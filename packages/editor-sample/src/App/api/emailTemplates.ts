import { EditorConfigurationSchema, TEditorConfiguration } from '../../documents/editor/core';

import { apiCredentials, authHeaders, findErrorMessage, getApiBaseUrl } from './config';

export type EmailTemplateSummary = {
  id: string;
  name: string;
  updatedAt: string | null;
  category: string | null;
  isRecommended: boolean;
};

async function apiGet(path: string): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      method: 'GET',
      credentials: apiCredentials(),
      headers: { Accept: 'application/json', ...authHeaders() },
    });
  } catch {
    throw new Error('Could not reach the server. Check your connection and try again.');
  }
  const json: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const serverMessage = findErrorMessage(json);
    if (response.status === 401 || response.status === 403) {
      throw new Error(serverMessage ?? 'Not authorized. Please sign in to your Onchain Suite account.');
    }
    throw new Error(serverMessage ?? `Request failed (${response.status}).`);
  }
  return json;
}

function unwrapList(json: unknown): unknown[] {
  if (Array.isArray(json)) {
    return json;
  }
  if (typeof json === 'object' && json !== null) {
    const record = json as Record<string, unknown>;
    for (const key of ['data', 'templates', 'items', 'results', 'rows']) {
      const value = record[key];
      if (Array.isArray(value)) {
        return value;
      }
      if (typeof value === 'object' && value !== null) {
        const nested = unwrapList(value);
        if (nested.length > 0) {
          return nested;
        }
      }
    }
  }
  return [];
}

function str(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }
  return null;
}

function toSummary(raw: unknown): EmailTemplateSummary | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const record = raw as Record<string, unknown>;
  const id = str(record, ['id', '_id', 'templateId']);
  if (!id) {
    return null;
  }
  return {
    id,
    name: str(record, ['name', 'title', 'label']) ?? 'Untitled template',
    updatedAt: str(record, ['updatedAt', 'updated_at', 'modifiedAt', 'createdAt', 'created_at']),
    category: str(record, ['category']),
    isRecommended: record.isRecommended === true,
  };
}

export async function listTemplates(access: 'private' | 'public'): Promise<EmailTemplateSummary[]> {
  const sort = access === 'private' ? 'recent' : 'popular';
  const json = await apiGet(`/email-templates?access=${access}&sort=${sort}&limit=50`);
  const list = unwrapList(json);
  const summaries: EmailTemplateSummary[] = [];
  for (const item of list) {
    const summary = toSummary(item);
    if (summary) {
      summaries.push(summary);
    }
  }
  return summaries;
}

function findDocumentCandidate(obj: unknown, depth = 0): unknown {
  if (depth > 3 || typeof obj !== 'object' || obj === null) {
    return null;
  }
  const record = obj as Record<string, unknown>;
  // A builder document is an object keyed by block ids with a "root" node.
  if (typeof record.root === 'object' && record.root !== null) {
    return record;
  }
  for (const key of ['json', 'document', 'builderState', 'content', 'data', 'template']) {
    let value = record[key];
    if (typeof value === 'string') {
      try {
        value = JSON.parse(value);
      } catch {
        continue;
      }
    }
    const candidate = findDocumentCandidate(value, depth + 1);
    if (candidate) {
      return candidate;
    }
  }
  return null;
}

/**
 * Fetches a template and returns its editor document, validated against the
 * builder schema. Throws with a user-readable message on failure.
 */
export async function fetchTemplateDocument(id: string): Promise<TEditorConfiguration> {
  const json = await apiGet(`/email-templates/${encodeURIComponent(id)}`);
  const candidate = findDocumentCandidate(json);
  if (!candidate) {
    throw new Error('This template does not contain an editable builder document (it may be HTML-only).');
  }
  const parsed = EditorConfigurationSchema.safeParse(candidate);
  if (!parsed.success || !parsed.data.root) {
    throw new Error('This template is not compatible with the editor.');
  }
  return parsed.data;
}
