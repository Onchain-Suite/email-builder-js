/** Backend bodies as the onchain-backend global error filter sends them (staging, presend-check). */
export const SHORTENER_CHECK = {
  code: 'URL_SHORTENER',
  outcome: 'block',
  message: 'The email links to a public URL shortener (bit.ly).',
  fix: 'Replace each shortened link with the full destination URL.',
  details: { links: ['https://bit.ly/abc', 'https://tinyurl.com/xyz'] },
};

export const SEED_CHECK = {
  code: 'SEED_PHRASE_REQUEST',
  outcome: 'block',
  message: 'The email asks the reader for a seed phrase.',
  fix: 'Remove the request. Legitimate projects never ask for a seed phrase.',
  details: { matched: 'enter your seed phrase' },
};

/** `{ success:false, error:{ code, message, details:<Nest body> } }`. */
export function envelopeBody(checks: unknown[] = [SHORTENER_CHECK, SEED_CHECK]) {
  const nestBody = {
    code: 'PRESEND_BLOCKED',
    message: `This send is blocked by ${checks.length} pre-send checks: URL_SHORTENER, SEED_PHRASE_REQUEST. Fix them and try again.`,
    rulesetVersion: '2026-11-21.1',
    checks,
    presend: { ok: false, blocked: true, rulesetVersion: '2026-11-21.1', mode: 'full', checks },
  };
  return {
    success: false,
    error: { code: 'PRESEND_BLOCKED', message: nestBody.message, details: nestBody },
    meta: { timestamp: '2026-11-21T00:00:00.000Z', path: '/api/v1/email-designs/d1/email' },
  };
}

/** The unwrapped Nest body: `checks` at the top level. */
export function topLevelBody(checks: unknown[] = [SHORTENER_CHECK, SEED_CHECK]) {
  return {
    statusCode: 422,
    code: 'PRESEND_BLOCKED',
    message: 'This send is blocked by 2 pre-send checks.',
    rulesetVersion: '2026-11-21.1',
    checks,
  };
}
