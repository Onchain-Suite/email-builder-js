import { EditorConfigurationSchema, TEditorConfiguration } from '../../documents/editor/core';

import { apiCredentials, authHeaders, findErrorMessage, getApiBaseUrl } from './config';

/**
 * Two template systems exist on the backend:
 * - `/templates` (+ `/templates/public`) — org-scoped; this is where the
 *   builder's "Save Template" flow writes reusable templates.
 * - `/email-templates` — user-scoped gallery (public + your private).
 * The history panel reads from both so nothing is missed.
 */
export type TemplateSource = 'org' | 'org-public' | 'user';

export type EmailTemplateSummary = {
  id: string;
  source: TemplateSource;
  name: string;
  updatedAt: string | null;
  category: string | null;
  isRecommended: boolean;
};

async function apiGet(path: string, orgScoped: boolean): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      method: 'GET',
      credentials: apiCredentials(),
      headers: { Accept: 'application/json', ...authHeaders({ orgScoped }) },
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

function toSummary(raw: unknown, source: TemplateSource): EmailTemplateSummary | null {
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
    source,
    name: str(record, ['name', 'title', 'label']) ?? 'Untitled template',
    updatedAt: str(record, ['updatedAt', 'updated_at', 'modifiedAt', 'createdAt', 'created_at']),
    category: str(record, ['category']),
    isRecommended: record.isRecommended === true,
  };
}

async function listFrom(path: string, source: TemplateSource): Promise<EmailTemplateSummary[]> {
  const json = await apiGet(path, source !== 'user');
  const summaries: EmailTemplateSummary[] = [];
  for (const item of unwrapList(json)) {
    const summary = toSummary(item, source);
    if (summary) {
      summaries.push(summary);
    }
  }
  return summaries;
}

function dedupe(lists: EmailTemplateSummary[][]): EmailTemplateSummary[] {
  const seen = new Set<string>();
  const out: EmailTemplateSummary[] = [];
  for (const list of lists) {
    for (const template of list) {
      if (!seen.has(template.id)) {
        seen.add(template.id);
        out.push(template);
      }
    }
  }
  return out;
}

/**
 * Merges both template systems. If one source fails but the other succeeds,
 * the successful results are returned; only throws when everything fails.
 */
export async function listTemplates(access: 'private' | 'public'): Promise<EmailTemplateSummary[]> {
  const sources: Array<Promise<EmailTemplateSummary[]>> =
    access === 'private'
      ? [
          listFrom('/templates?sort=recent&limit=50', 'org'),
          listFrom('/email-templates?access=private&sort=recent&limit=50', 'user'),
        ]
      : [
          listFrom('/templates/public?limit=50', 'org-public'),
          listFrom('/email-templates?access=public&sort=popular&limit=50', 'user'),
        ];

  const results = await Promise.allSettled(sources);
  const fulfilled = results.filter(
    (r): r is PromiseFulfilledResult<EmailTemplateSummary[]> => r.status === 'fulfilled'
  );
  if (fulfilled.length === 0) {
    const firstError = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
    throw firstError ? firstError.reason : new Error('Failed to load templates.');
  }
  return dedupe(fulfilled.map((r) => r.value));
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

function detailPath(template: Pick<EmailTemplateSummary, 'id' | 'source'>): string {
  const id = encodeURIComponent(template.id);
  switch (template.source) {
    case 'org':
      return `/templates/${id}`;
    case 'org-public':
      return `/templates/public/${id}`;
    case 'user':
      return `/email-templates/${id}`;
  }
}

/**
 * Fetches a template and returns its editor document, validated against the
 * builder schema. Throws with a user-readable message on failure.
 */
export async function fetchTemplateDocument(
  template: Pick<EmailTemplateSummary, 'id' | 'source'>
): Promise<TEditorConfiguration> {
  const json = await apiGet(detailPath(template), template.source !== 'user');
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
