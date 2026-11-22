/**
 * @jest-environment node
 */
import { classifySaveResponse, errorFromBody, runEditorSave } from './editorSave';
import { envelopeBody, topLevelBody } from './fixtures';
import { EMAIL_SAVE_BLOCKED } from './presendBlock';

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });
}

function save(res: Response, source: 'save' | 'autosave' = 'save') {
  const postToParent = jest.fn();
  const outcome = runEditorSave({
    send: async () => res,
    source,
    context: { campaignId: null, designId: 'd1' },
    postToParent,
  });
  return { outcome, postToParent };
}

describe('runEditorSave', () => {
  it('422 PRESEND_BLOCKED: blocked (not saved) with both codes, and the host is told', async () => {
    const { outcome, postToParent } = save(jsonResponse(422, envelopeBody()));
    const result = await outcome;
    expect(result.kind).toBe('blocked');
    if (result.kind !== 'blocked') return;
    expect(result.block.checks.map((c) => c.code)).toEqual(['URL_SHORTENER', 'SEED_PHRASE_REQUEST']);
    expect(postToParent).toHaveBeenCalledTimes(1);
    const message = postToParent.mock.calls[0][0];
    expect(message.type).toBe(EMAIL_SAVE_BLOCKED);
    expect(message.type).not.toBe('EMAIL_SAVED');
    expect(message.payload.status).toBe('saveBlocked');
    expect(message.payload.designId).toBe('d1');
  });

  it('handles the top-level checks shape and reports the autosave source', async () => {
    const { outcome, postToParent } = save(jsonResponse(422, topLevelBody()), 'autosave');
    expect((await outcome).kind).toBe('blocked');
    expect(postToParent.mock.calls[0][0].payload.source).toBe('autosave');
  });

  it('2xx: saved, host not notified of a block', async () => {
    const { outcome, postToParent } = save(jsonResponse(200, { success: true }));
    expect(await outcome).toEqual({ kind: 'saved' });
    expect(postToParent).not.toHaveBeenCalled();
  });

  it.each([
    [422, { success: false, error: { code: 'VALIDATION_FAILED', message: 'Name is required' } }, 'Name is required'],
    [
      400,
      { success: false, error: { code: 'BAD_REQUEST', message: 'html must be a string' } },
      'html must be a string',
    ],
    [500, { success: false, error: { code: 'INTERNAL_ERROR', message: 'boom' } }, 'boom'],
    [403, { message: 'Forbidden resource' }, 'Forbidden resource'],
    [404, { error: 'Not found' }, 'Not found'],
    [502, {}, 'Request failed (HTTP 502)'],
  ])('%i keeps the existing error and does not notify the host', async (status, body, message) => {
    const { outcome, postToParent } = save(jsonResponse(status, body));
    const result = await outcome;
    expect(result.kind).toBe('failed');
    if (result.kind !== 'failed') return;
    expect(result.status).toBe(status);
    expect(result.error.message).toBe(message);
    expect(postToParent).not.toHaveBeenCalled();
  });

  it('non-JSON errors keep the body text, as before', async () => {
    const result = await classifySaveResponse(
      new Response('Bad Gateway', { status: 502, headers: { 'content-type': 'text/plain' } })
    );
    expect(result).toMatchObject({ kind: 'failed', status: 502 });
    if (result.kind === 'failed') expect(result.error.message).toBe('Bad Gateway');
  });

  it('a 422 PRESEND_BLOCKED body without a JSON content type still parses', async () => {
    const result = await classifySaveResponse(new Response(JSON.stringify(envelopeBody()), { status: 422 }));
    expect(result.kind).toBe('blocked');
  });
});

describe('errorFromBody', () => {
  it('falls back to the status when JSON is unreadable', () => {
    expect(errorFromBody(500, 'application/json', '<html>').message).toBe('Request failed (HTTP 500)');
    expect(errorFromBody(500, 'text/html', '').message).toBe('Request failed (HTTP 500)');
  });
});
