/**
 * @jest-environment node
 */

/**
 * Preview ↔ delivery parity guardrail.
 *
 * The editor's preview renders the exact output of `makeResponsiveHtml`. The
 * delivered email is that output after the send transport (Azure Communication
 * Services / Exchange Online) rewrites it — and after a recipient client (Gmail,
 * etc.) renders it. We can't control every client, but we CAN guarantee that
 * what we hand the transport stays visually faithful to the editor through the
 * transport's known mutations.
 *
 * This suite asserts the structural invariants that make that true, and would
 * have caught both shipped regressions:
 *   - the card not centering after the transport stripped align/margin, and
 *   - the centering wrapper's `text-align:center` leaking into body text.
 *
 * Assertions are structural (string/tag level) on purpose: jsdom has no layout
 * engine and does not resolve inherited `text-align`, so a computed-style test
 * would be unreliable. The invariants below encode the same guarantees
 * deterministically.
 */
import { renderToStaticMarkup, TReaderDocument } from '@usewaypoint/email-builder';

import makeResponsiveHtml from './makeResponsiveHtml';

/**
 * Faithful model of the send transport, reverse-engineered from a captured
 * sent MIME: it drops <html>/<head>/<body>/<style>, ALL `align` and table
 * `role`/`cellspacing`/`cellpadding`/`border`/`width` attributes, `margin`
 * out of inline styles, and HTML comments. Only inline `style` properties
 * survive — which is exactly what our centering/alignment now relies on.
 */
function sanitizeLikeTransport(html: string): string {
  return html
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<\/?html[^>]*>/gi, '')
    .replace(/<\/?body[^>]*>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s(?:align|role|cellspacing|cellpadding|border)="[^"]*"/gi, '')
    .replace(/<(table|td|tr)\b([^>]*?)\swidth="[^"]*"/gi, '<$1$2')
    .replace(/margin:[^;"']*;?/gi, '');
}

const EMAIL_LAYOUT = {
  backdropColor: '#F5F5F5',
  canvasColor: '#FFFFFF',
  textColor: '#262626',
  fontFamily: 'MODERN_SANS' as const,
};

/** An email built from native blocks with default-left text and a centered button. */
function nativeFixture(): TReaderDocument {
  return {
    root: { type: 'EmailLayout', data: { ...EMAIL_LAYOUT, childrenIds: ['h', 't', 'b', 'img'] } },
    h: { type: 'Heading', data: { props: { text: 'Hi there,', level: 'h3' }, style: { padding: pad(16, 0) } } },
    t: { type: 'Text', data: { props: { text: 'DEFAULT_LEFT_PARAGRAPH' }, style: { padding: pad(8, 8) } } },
    b: {
      type: 'Button',
      data: { props: { text: 'CENTERED_BUTTON', url: '#' }, style: { textAlign: 'center', padding: pad(8, 24) } },
    },
    img: { type: 'Image', data: { props: { url: 'https://example.test/hero.png', alt: 'hero' }, style: {} } },
  } as unknown as TReaderDocument;
}

function pad(top: number, bottom: number) {
  return { top, bottom, left: 24, right: 24 };
}

const cardTagOf = (html: string) => html.match(/<table\b[^>]*max-width:\s*\d+px[^>]*>/i)?.[0] ?? '';

describe('preview ↔ delivery parity', () => {
  const exported = makeResponsiveHtml(renderToStaticMarkup(nativeFixture(), { rootBlockId: 'root' }));
  const delivered = sanitizeLikeTransport(exported);

  it('centers the card with an inline-block + a text-align:center wrapper cell', () => {
    const card = cardTagOf(exported);
    expect(card).toMatch(/display:\s*inline-block/i);
    // the cell immediately wrapping the card carries the centering
    const before = exported.slice(0, exported.indexOf(card));
    expect(before).toMatch(/<td\b[^>]*text-align:\s*center[^>]*>\s*$/i);
  });

  it('resets text-align on the card so centering does not leak into body text', () => {
    expect(cardTagOf(exported)).toMatch(/text-align:\s*left/i);
    // the default Text block must not be force-centered by an ancestor
    const open = exported.slice(0, exported.indexOf('DEFAULT_LEFT_PARAGRAPH')).match(/<[a-z]+\b[^>]*>$/i)?.[0] ?? '';
    expect(open).not.toMatch(/text-align/i);
  });

  it("preserves a block's own explicit alignment (centered button stays centered)", () => {
    const beforeBtn = exported.slice(0, exported.indexOf('CENTERED_BUTTON'));
    // the nearest alignment before the button is its own center, not the card's left
    expect(beforeBtn.lastIndexOf('text-align:center')).toBeGreaterThan(beforeBtn.lastIndexOf('text-align:left'));
  });

  it('makes every image fluid', () => {
    const imgs = exported.match(/<img\b[^>]*>/gi) ?? [];
    expect(imgs.length).toBeGreaterThan(0);
    imgs.forEach((tag) => expect(tag).toMatch(/max-width/i));
  });

  it('survives the send transport: centering + alignment hold after sanitization', () => {
    expect(delivered).not.toMatch(/<style/i); // stylesheet gone
    expect(delivered).not.toMatch(/\salign="/i); // align attrs gone — proves the sanitizer ran
    const card = cardTagOf(delivered);
    expect(card).toMatch(/display:\s*inline-block/i);
    expect(card).toMatch(/text-align:\s*left/i); // no leak after transport
    expect(delivered).toMatch(/text-align:\s*center/i); // wrapper still centers the card
    (delivered.match(/<img\b[^>]*>/gi) ?? []).forEach((tag) => expect(tag).toMatch(/max-width/i));
  });

  it('does not override an imported layout that already sets its own card alignment', () => {
    // A raw card that already declares text-align:center must be left untouched.
    const raw =
      '<html><body><div style="background-color:#eee;width:100%">' +
      '<table style="max-width:600px;text-align:center"><tbody><tr><td>x</td></tr></tbody></table>' +
      '</div></body></html>';
    const card = cardTagOf(makeResponsiveHtml(raw));
    expect(card).toMatch(/text-align:\s*center/i);
    expect(card).not.toMatch(/text-align:\s*left/i);
  });
});
