import { envelopeBody, SEED_CHECK, SHORTENER_CHECK, topLevelBody } from './fixtures';
import {
  EMAIL_SAVE_BLOCKED,
  parsePresendBlock,
  presendHeadline,
  presendHostMessage,
  presendSignature,
} from './presendBlock';

describe('parsePresendBlock', () => {
  it('reads checks from the global error envelope (error.details.checks)', () => {
    const block = parsePresendBlock(422, envelopeBody());
    expect(block).not.toBeNull();
    expect(block!.rulesetVersion).toBe('2026-11-21.1');
    expect(block!.checks.map((c) => c.code)).toEqual(['URL_SHORTENER', 'SEED_PHRASE_REQUEST']);
    expect(block!.checks[0]).toEqual({
      code: 'URL_SHORTENER',
      message: SHORTENER_CHECK.message,
      fix: SHORTENER_CHECK.fix,
      links: ['https://bit.ly/abc', 'https://tinyurl.com/xyz'],
    });
    expect(block!.checks[1].links).toEqual([]);
  });

  it('reads checks from a top-level `checks` too', () => {
    const block = parsePresendBlock(422, topLevelBody());
    expect(block!.checks.map((c) => c.code)).toEqual(['URL_SHORTENER', 'SEED_PHRASE_REQUEST']);
    expect(block!.message).toBe('This send is blocked by 2 pre-send checks.');
  });

  it('only treats 422 PRESEND_BLOCKED as a block', () => {
    expect(parsePresendBlock(400, envelopeBody())).toBeNull();
    expect(parsePresendBlock(409, envelopeBody())).toBeNull();
    expect(
      parsePresendBlock(422, { success: false, error: { code: 'VALIDATION_FAILED', message: 'Name required' } })
    ).toBeNull();
    expect(parsePresendBlock(422, null)).toBeNull();
    expect(parsePresendBlock(422, 'PRESEND_BLOCKED')).toBeNull();
  });

  it('ignores malformed and non-block entries in checks', () => {
    const block = parsePresendBlock(
      422,
      envelopeBody([SHORTENER_CHECK, { code: 'GMAIL_CLIP', outcome: 'warn' }, null, 'x', { outcome: 'block' }])
    );
    expect(block!.checks.map((c) => c.code)).toEqual(['URL_SHORTENER']);
  });

  it('still reports a block when checks are missing', () => {
    const block = parsePresendBlock(422, { success: false, error: { code: 'PRESEND_BLOCKED', message: 'Blocked.' } });
    expect(block).toEqual({ message: 'Blocked.', rulesetVersion: null, checks: [] });
    expect(presendHeadline(block!)).toBe('Not saved: this email is blocked by a pre-send check.');
  });
});

describe('presendHeadline', () => {
  it('names each block in plain words', () => {
    expect(presendHeadline(parsePresendBlock(422, envelopeBody([SHORTENER_CHECK]))!)).toBe(
      `Not saved: this email can't go out while it contains a link shortener.`
    );
    expect(presendHeadline(parsePresendBlock(422, envelopeBody([SEED_CHECK]))!)).toBe(
      `Not saved: this email can't go out while it asks for a seed phrase or private key.`
    );
    expect(presendHeadline(parsePresendBlock(422, envelopeBody())!)).toBe(
      `Not saved: this email can't go out while it contains a link shortener and asks for a seed phrase or private key.`
    );
  });
});

describe('presendSignature', () => {
  it('is order-independent and changes when the offending links change', () => {
    const a = parsePresendBlock(422, envelopeBody([SHORTENER_CHECK, SEED_CHECK]))!;
    const b = parsePresendBlock(422, envelopeBody([SEED_CHECK, SHORTENER_CHECK]))!;
    const c = parsePresendBlock(422, envelopeBody([{ ...SHORTENER_CHECK, details: { links: ['https://t.co/1'] } }]))!;
    expect(presendSignature(a)).toBe(presendSignature(b));
    expect(presendSignature(a)).not.toBe(presendSignature(c));
  });
});

describe('presendHostMessage', () => {
  it('carries the status, both codes and the offending links for the dashboard', () => {
    const msg = presendHostMessage(parsePresendBlock(422, envelopeBody())!, {
      campaignId: null,
      designId: 'd1',
      source: 'save',
    });
    expect(msg.type).toBe(EMAIL_SAVE_BLOCKED);
    expect(msg.payload).toMatchObject({
      designId: 'd1',
      campaignId: null,
      source: 'save',
      status: 'saveBlocked',
      code: 'PRESEND_BLOCKED',
      rulesetVersion: '2026-11-21.1',
    });
    expect(msg.payload.checks.map((c) => c.code)).toEqual(['URL_SHORTENER', 'SEED_PHRASE_REQUEST']);
    expect(msg.payload.checks[0].links).toEqual(['https://bit.ly/abc', 'https://tinyurl.com/xyz']);
  });
});
