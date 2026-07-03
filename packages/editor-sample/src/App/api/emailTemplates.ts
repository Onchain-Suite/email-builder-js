import { EditorConfigurationSchema, TEditorConfiguration } from '../../documents/editor/core';

import { apiCredentials, authHeaders, diagnoseAuthFailure, findErrorMessage, getApiBaseUrl } from './config';
import { getApiSession } from './session';

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

async function apiRequest(method: 'GET' | 'DELETE', path: string, orgScoped: boolean): Promise<unknown> {
  const endpoint = path.split('?')[0];
  const { token, orgId, campaignId } = getApiSession();

  // The editor origin is cross-site to the API, so the dashboard session
  // cookie never travels with these requests. The editor token IS the
  // designed transport here — the backend accepts it on template/config GET
  // routes when the request also carries the campaignId it was minted for.
  let url = `${getApiBaseUrl()}${path}`;
  if (campaignId) {
    url += `${url.includes('?') ? '&' : '?'}campaignId=${encodeURIComponent(campaignId)}`;
  }

  const doFetch = (headers: Record<string, string>) =>
    fetch(url, {
      method,
      credentials: apiCredentials(),
      headers: { Accept: 'application/json', ...headers },
    });

  const editorHeaders: Record<string, string> | null = token
    ? {
        Authorization: `Bearer ${token}`,
        'x-editor-token': token,
        ...(orgScoped && orgId ? { 'x-org-id': orgId } : {}),
      }
    : null;

  let response: Response;
  try {
    // Primary: editor token (works cookie-less from this origin).
    // Fallback: explicit auth token / env token / session cookie.
    response = await doFetch(editorHeaders ?? authHeaders({ orgScoped }));
    if (editorHeaders && (response.status === 401 || response.status === 403)) {
      const fallback = await doFetch(authHeaders({ orgScoped })).catch(() => null);
      if (fallback && fallback.ok) {
        response = fallback;
      }
    }
  } catch {
    throw new Error(
      `${method} ${endpoint}: request never reached the server. This is usually the backend CORS policy blocking this editor origin (or no network). Check that the API allows origin ${window.location.origin} with credentials.`
    );
  }

  const json: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const serverMessage = findErrorMessage(json);
    if (response.status === 401 || response.status === 403) {
      const diagnosis = await diagnoseAuthFailure();
      const authUsed = editorHeaders
        ? `Tried editor token${campaignId ? ` (campaignId=${campaignId})` : ' (no campaignId available!)'} and session fallback.`
        : 'No editor token available; used session auth only.';
      throw new Error(
        `${method} ${endpoint} → ${response.status}${serverMessage ? ` ("${serverMessage}")` : ''}. ${authUsed} ${diagnosis}`
      );
    }
    throw new Error(`${method} ${endpoint} → ${response.status}${serverMessage ? `: ${serverMessage}` : '.'}`);
  }
  return json;
}

async function apiGet(path: string, orgScoped: boolean): Promise<unknown> {
  return apiRequest('GET', path, orgScoped);
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

/**
 * Finds duplicate org templates (same trimmed, case-insensitive name),
 * keeping the most recently updated of each group.
 */
export async function findDuplicateTemplates(): Promise<{
  keep: EmailTemplateSummary[];
  remove: EmailTemplateSummary[];
}> {
  const all = await listFrom('/templates?sort=recent&limit=100', 'org');
  const byName = new Map<string, EmailTemplateSummary[]>();
  for (const template of all) {
    const key = template.name.trim().toLowerCase();
    byName.set(key, [...(byName.get(key) ?? []), template]);
  }

  const keep: EmailTemplateSummary[] = [];
  const remove: EmailTemplateSummary[] = [];
  for (const group of byName.values()) {
    const sorted = [...group].sort((a, b) => {
      const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return tb - ta;
    });
    keep.push(sorted[0]);
    remove.push(...sorted.slice(1));
  }
  return { keep, remove };
}

/** Deletes the given org templates. Returns how many were deleted. */
export async function deleteTemplates(templates: EmailTemplateSummary[]): Promise<number> {
  let deleted = 0;
  let firstError: Error | null = null;
  for (const template of templates) {
    if (template.source !== 'org') {
      continue; // only reusable org templates are cleaned up
    }
    try {
      await apiRequest('DELETE', `/templates/${encodeURIComponent(template.id)}`, true);
      deleted += 1;
    } catch (e) {
      firstError = firstError ?? (e instanceof Error ? e : new Error('Delete failed.'));
    }
  }
  if (deleted === 0 && firstError) {
    throw firstError;
  }
  return deleted;
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
