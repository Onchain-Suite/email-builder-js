/**
 * Post-processes the rendered email HTML to make it mobile-responsive:
 * - injects a <head> with viewport meta and a media-query stylesheet
 * - tags multi-column layout tables (identifiable by their inline
 *   `table-layout:fixed` style) so their cells stack on small screens
 * - makes images fluid and prevents horizontal overflow
 *
 * Media queries are supported by Gmail, Apple Mail, Outlook iOS/Android and
 * most modern clients; older clients simply fall back to the desktop layout.
 */
const RESPONSIVE_STYLES = `
  body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
  img { border: 0; outline: none; text-decoration: none; }
  @media only screen and (max-width: 480px) {
    .eb-columns { width: 100% !important; }
    .eb-columns td {
      display: block !important;
      width: 100% !important;
      max-width: 100% !important;
      padding-left: 0 !important;
      padding-right: 0 !important;
    }
    img { max-width: 100% !important; height: auto !important; }
    table { width: 100% !important; }
  }
`;

const HEAD_MARKUP = [
  '<head>',
  '<meta charset="utf-8"/>',
  '<meta name="viewport" content="width=device-width, initial-scale=1"/>',
  '<meta http-equiv="X-UA-Compatible" content="IE=edge"/>',
  `<style>${RESPONSIVE_STYLES}</style>`,
  '</head>',
].join('');

export default function makeResponsiveHtml(html: string): string {
  let out = html;

  // Tag the columns-container tables so the stylesheet can stack them.
  out = out.replace(
    /<table(?![^>]*class=)([^>]*style="[^"]*table-layout:\s*fixed[^"]*")/gi,
    '<table class="eb-columns"$1'
  );

  // Inject the head (renderToStaticMarkup emits <html><body> with no head).
  if (/<head[\s>]/i.test(out)) {
    out = out.replace(/<head([^>]*)>/i, `<head$1><meta name="viewport" content="width=device-width, initial-scale=1"/><style>${RESPONSIVE_STYLES}</style>`);
  } else {
    out = out.replace(/<html([^>]*)>/i, `<html$1>${HEAD_MARKUP}`);
  }

  return out;
}
