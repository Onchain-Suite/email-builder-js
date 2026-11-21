import { parsePresendBlock, presendHostMessage, TPresendBlock, TSaveSource } from './presendBlock';

/**
 * Error for a failed request, built from its body. This is the editor's
 * long-standing message extraction (moved here unchanged from App/index.tsx),
 * so every failure that is not a pre-send block reads exactly as before.
 */
export function errorFromBody(status: number, contentType: string, text: string): Error {
  if (contentType.includes('application/json')) {
    let data: { error?: { message?: string } | string; message?: string } | null = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
    const message =
      (typeof data?.error === 'object' ? data.error?.message : undefined) ??
      data?.message ??
      (typeof data?.error === 'string' ? data.error : null) ??
      `Request failed (HTTP ${status})`;
    return new Error(message);
  }
  return new Error(text || `Request failed (HTTP ${status})`);
}

export type TSaveOutcome =
  | { kind: 'saved' }
  | { kind: 'blocked'; block: TPresendBlock }
  | { kind: 'failed'; status: number; error: Error };

/**
 * Classifies a save response. A 422 PRESEND_BLOCKED becomes `blocked`; any
 * other non-2xx is `failed` with the same error the editor always showed.
 */
export async function classifySaveResponse(res: Response): Promise<TSaveOutcome> {
  if (res.ok) return { kind: 'saved' };
  const contentType = res.headers.get('content-type') ?? '';
  const text = await res.text().catch(() => '');
  if (res.status === 422) {
    let body: unknown = null;
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
    const block = parsePresendBlock(res.status, body);
    if (block) return { kind: 'blocked', block };
  }
  return { kind: 'failed', status: res.status, error: errorFromBody(res.status, contentType, text) };
}

/**
 * Runs one save request and tells the host when the backend refused it, so the
 * dashboard never shows a design as saved when it was not. The caller decides
 * what the editor shows; this only classifies and notifies.
 */
export async function runEditorSave(options: {
  send: () => Promise<Response>;
  source: TSaveSource;
  context: { campaignId: string | null; designId: string | null };
  postToParent: (message: unknown) => void;
}): Promise<TSaveOutcome> {
  const res = await options.send();
  const outcome = await classifySaveResponse(res);
  if (outcome.kind === 'blocked') {
    options.postToParent(presendHostMessage(outcome.block, { ...options.context, source: options.source }));
  }
  return outcome;
}
