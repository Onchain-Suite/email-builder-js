/**
 * Pre-send content blocks on editor saves.
 *
 * When the design being edited belongs to an ACTIVE automation, the backend
 * runs the content part of its pre-send check on `POST /email-designs/:id/editor/saved`
 * and `PUT /email-designs/:id/email` and refuses the save (HTTP 422) for two
 * hard blocks only: `URL_SHORTENER` and `SEED_PHRASE_REQUEST`. Blocks cannot be
 * overridden and there are no warnings on this path (the editor cannot ack).
 *
 * The refusal arrives through the backend's global error envelope:
 *
 *   { success: false, error: { code: 'PRESEND_BLOCKED', message,
 *       details: { code, message, rulesetVersion, checks: [...], presend } } }
 *
 * `checks` is read from `error.details.checks` and, defensively, from a
 * top-level `checks` (the unwrapped Nest body) in case the envelope changes.
 */

export const PRESEND_BLOCKED = 'PRESEND_BLOCKED';

export type TPresendBlockCheck = {
  code: string;
  message: string;
  fix: string | null;
  /** Offending links, when the check reports them (URL_SHORTENER: `details.links`). */
  links: string[];
};

export type TPresendBlock = {
  message: string;
  rulesetVersion: string | null;
  checks: TPresendBlockCheck[];
};

/** Which save path was refused. Autosave is silent today; the explicit Save button is not. */
export type TSaveSource = 'save' | 'autosave';

type TRecord = Record<string, unknown>;

function asRecord(value: unknown): TRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as TRecord) : null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function linksFrom(details: unknown): string[] {
  const d = asRecord(details);
  if (!d) return [];
  const out: string[] = [];
  for (const key of ['links', 'urls', 'link', 'url']) {
    const value = d[key];
    const values = Array.isArray(value) ? value : [value];
    for (const v of values) {
      const s = asString(v);
      if (s && out.indexOf(s) === -1) out.push(s);
    }
  }
  return out;
}

function toCheck(raw: unknown): TPresendBlockCheck | null {
  const r = asRecord(raw);
  const code = asString(r?.code);
  if (!r || !code) return null;
  // Only blocks refuse a save; ignore anything else the backend might list.
  if (r.outcome !== undefined && r.outcome !== 'block') return null;
  return {
    code,
    message: asString(r.message) ?? '',
    fix: asString(r.fix),
    links: linksFrom(r.details),
  };
}

/**
 * Returns the block when `body` is a 422 PRESEND_BLOCKED refusal, else null
 * (so every other error keeps its existing handling).
 */
export function parsePresendBlock(status: number, body: unknown): TPresendBlock | null {
  if (status !== 422) return null;
  const root = asRecord(body);
  if (!root) return null;
  const error = asRecord(root.error);
  const details = asRecord(error?.details);

  const codes = [error?.code, details?.code, root.code];
  if (codes.indexOf(PRESEND_BLOCKED) === -1) return null;

  const rawChecks = [details?.checks, root.checks, error?.checks].find((c): c is unknown[] => Array.isArray(c)) ?? [];
  const checks = rawChecks.map(toCheck).filter((c): c is TPresendBlockCheck => c !== null);

  return {
    message:
      asString(details?.message) ??
      asString(error?.message) ??
      asString(root.message) ??
      'This email is blocked by a pre-send check.',
    rulesetVersion: asString(details?.rulesetVersion) ?? asString(root.rulesetVersion),
    checks,
  };
}

const REASONS: Record<string, string> = {
  URL_SHORTENER: 'contains a link shortener',
  SEED_PHRASE_REQUEST: 'asks for a seed phrase or private key',
};

const TITLES: Record<string, string> = {
  URL_SHORTENER: 'Link shortener',
  SEED_PHRASE_REQUEST: 'Seed phrase or private key request',
};

export function checkTitle(code: string): string {
  return TITLES[code] ?? code;
}

/** "Not saved: this email can't go out while it contains a link shortener and asks for …". */
export function presendHeadline(block: TPresendBlock): string {
  const reasons: string[] = [];
  for (const check of block.checks) {
    const reason = REASONS[check.code];
    if (reason && reasons.indexOf(reason) === -1) reasons.push(reason);
  }
  if (reasons.length === 0) {
    return 'Not saved: this email is blocked by a pre-send check.';
  }
  return `Not saved: this email can't go out while it ${reasons.join(' and ')}.`;
}

/** Stable identity of a block, so a repeating autosave does not reopen the same dialog. */
export function presendSignature(block: TPresendBlock): string {
  return block.checks
    .map((c) => `${c.code}:${[...c.links].sort().join(',')}`)
    .sort()
    .join('|');
}

/** Message sent to the host (dashboard) when a save is refused. */
export const EMAIL_SAVE_BLOCKED = 'EMAIL_SAVE_BLOCKED';
/** Sent once when a save succeeds after an earlier refusal. */
export const EMAIL_SAVE_BLOCK_CLEARED = 'EMAIL_SAVE_BLOCK_CLEARED';

export function presendHostMessage(
  block: TPresendBlock,
  context: { campaignId: string | null; designId: string | null; source: TSaveSource }
) {
  return {
    type: EMAIL_SAVE_BLOCKED,
    payload: {
      campaignId: context.campaignId,
      designId: context.designId,
      source: context.source,
      status: 'saveBlocked' as const,
      code: PRESEND_BLOCKED,
      message: presendHeadline(block),
      rulesetVersion: block.rulesetVersion,
      checks: block.checks,
    },
  };
}
