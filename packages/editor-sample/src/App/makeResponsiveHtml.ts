/**
 * Post-processes the rendered email HTML into a bulletproof, mobile- and
 * desktop-safe document — the "centered card on a full-bleed backdrop"
 * structure every robust marketing email uses.
 *
 * Layers, because email clients differ:
 * 1. Fluid-hybrid inline rewrites (work EVERYWHERE, media queries or not —
 *    including the Gmail app on non-Gmail accounts, which strips <style>):
 *    - any table fixed wider than 480px becomes width:100% + max-width:<n>px
 *    - images gain max-width:100%; height:auto
 * 2. A <body> reset that paints the backdrop edge-to-edge and drops the
 *    default 8px margin (that margin is why an un-reset email looks shoved
 *    to one side instead of centered).
 * 3. An Outlook (Word engine) ghost table: Outlook ignores `max-width`, so
 *    without this the card runs full-bleed and left-aligned on desktop
 *    Outlook. The MSO-conditional table pins it to the card width, centered.
 * 4. A <head> with viewport meta and a media-query stylesheet for clients
 *    that support it: multi-column layout tables (tagged via their inline
 *    `table-layout:fixed`) stack vertically on small screens.
 *
 * Deliberately absent: a blanket mobile `table { width:100% !important }` —
 * it stretched small tables (buttons, badges) across the full screen.
 */

// Containers narrower than this are intentional (buttons, avatars) — leave
// their fixed widths alone.
const FLUID_MIN_PX = 480;

// Fallback backdrop when the layout has none — matches EmailLayout's default.
const DEFAULT_BACKDROP = '#F5F5F5';

const RESPONSIVE_STYLES = `
  body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
  table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
  @media only screen and (max-width: 480px) {
    .eb-columns td {
      display: block !important;
      width: 100% !important;
      max-width: 100% !important;
      padding-left: 0 !important;
      padding-right: 0 !important;
    }
    img { max-width: 100% !important; height: auto !important; }
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

function getStyleAttr(tag: string): string | null {
  const m = tag.match(/style="([^"]*)"/i);
  return m ? m[1] : null;
}

function setStyleAttr(tag: string, tagName: string, style: string): string {
  if (/style="/i.test(tag)) {
    return tag.replace(/style="[^"]*"/i, `style="${style}"`);
  }
  return tag.replace(new RegExp(`<${tagName}\\b`, 'i'), `<${tagName} style="${style}"`);
}

/**
 * Rewrites a fixed pixel width (width="640" attribute or inline
 * `width:640px`) into `width:100%; max-width:640px` so the table shrinks
 * with the viewport. Only applies at container widths (>= FLUID_MIN_PX).
 */
function fluidizeTable(tag: string): string {
  const style = getStyleAttr(tag) ?? '';
  const styleWidth = style.match(/(?:^|;)\s*width:\s*(\d+(?:\.\d+)?)px/i);
  const attrWidth = tag.match(/\swidth="(\d+(?:\.\d+)?)"/i);
  const width = styleWidth ? parseFloat(styleWidth[1]) : attrWidth ? parseFloat(attrWidth[1]) : null;
  if (width === null || width < FLUID_MIN_PX) {
    return tag;
  }

  let out = tag.replace(/(\s)width="[\d.]+"/i, '$1width="100%"');
  let nextStyle = style.replace(/((?:^|;)\s*)width:\s*[\d.]+px/i, '$1width:100%');
  if (!/max-width/i.test(nextStyle)) {
    nextStyle = nextStyle
      ? `${nextStyle.replace(/;\s*$/, '')};max-width:${width}px`
      : `width:100%;max-width:${width}px`;
  }
  return setStyleAttr(out, 'table', nextStyle);
}

/** Images never overflow their container; height follows the scaled width. */
function fluidizeImage(tag: string): string {
  const style = getStyleAttr(tag);
  if (style && /max-width/i.test(style)) {
    return tag;
  }
  const nextStyle = style ? `${style.replace(/;\s*$/, '')};max-width:100%;height:auto` : 'max-width:100%;height:auto';
  return setStyleAttr(tag, 'img', nextStyle);
}

/**
 * Reads the backdrop color off the outermost wrapper (the EmailLayout root
 * <div>, which carries `background-color:<backdrop>`). Used to paint the
 * <body> the same color so the backdrop is full-bleed rather than a floating
 * band inside a default-white body.
 */
function extractBackdropColor(html: string): string {
  const firstDiv = html.match(/<div\b[^>]*style="([^"]*)"/i);
  const bg = firstDiv?.[1].match(/background-color:\s*(#[0-9a-fA-F]{3,8}|rgb[^;"]*)/i);
  return bg ? bg[1].trim() : DEFAULT_BACKDROP;
}

/** Finds the index just past the `</table>` that closes the table opening at `openIdx`. */
function findMatchingTableClose(html: string, openIdx: number): number | null {
  const token = /<table\b|<\/table>/gi;
  token.lastIndex = openIdx;
  let depth = 0;
  for (let m = token.exec(html); m; m = token.exec(html)) {
    if (m[0].toLowerCase() === '</table>') {
      depth -= 1;
      if (depth === 0) {
        return m.index + m[0].length;
      }
    } else {
      depth += 1;
    }
  }
  return null;
}

/**
 * Centers the content card (the table carrying `max-width:<n>px`) in a way
 * that survives an aggressive transport sanitizer — the fix for the "card
 * pinned to one side, backdrop filling the gutter" bug.
 *
 * The send transport (Azure Communication Services / Exchange Online) rewrites
 * every outgoing email: it strips <html>/<head>/<body>/<style>, ALL `align`
 * attributes, table `width`/`role`/`cellspacing`/`cellpadding`/`border`
 * attributes, `margin` out of inline styles, and HTML comments (so MSO ghost
 * tables die too). Verified against the raw sent MIME. Every classic centering
 * hook — `align="center"`, `margin:0 auto`, a media-query stylesheet, an
 * Outlook ghost table — is exactly what it removes.
 *
 * What DOES survive is inline `style` properties. The only centering primitive
 * left standing is therefore `text-align:center` on a parent — but that centers
 * inline-level boxes only, not a block-level <table>. So we make the card an
 * `display:inline-block` box (with `width:100%;max-width:<n>px`) inside a
 * `text-align:center` wrapper: the inline-block card is then centered by
 * text-align, using nothing but inline styles the sanitizer keeps. The wrapper
 * also carries `align="center"` and the card keeps `margin:0 auto` for the
 * happy path where nothing is stripped.
 */
function wrapCentered(html: string): string {
  const cardTable = html.match(/<table\b[^>]*max-width:\s*\d+px[^>]*>/i);
  if (!cardTable || cardTable.index === undefined) {
    return html;
  }
  const openIdx = cardTable.index;
  const cardOpenTag = cardTable[0];
  const cardOpenEnd = openIdx + cardOpenTag.length;
  const closeIdx = findMatchingTableClose(html, openIdx);
  if (closeIdx === null) {
    return html;
  }

  // Make the card itself an inline-block that `text-align:center` can center
  // even after every attribute and `margin` is stripped in transit.
  const centeredCardTag = ensureInlineBlockCard(cardOpenTag);

  const open =
    `<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%">` +
    `<tr><td align="center" style="text-align:center">`;
  const close = `</td></tr></table>`;

  return (
    html.slice(0, openIdx) + open + centeredCardTag + html.slice(cardOpenEnd, closeIdx) + close + html.slice(closeIdx)
  );
}

/** Adds `display:inline-block;width:100%` (once) to the card's inline style. */
function ensureInlineBlockCard(tag: string): string {
  const style = getStyleAttr(tag) ?? '';
  if (/display:\s*inline-block/i.test(style)) {
    return tag;
  }
  const additions = `display:inline-block;width:100%`;
  const nextStyle = style ? `${style.replace(/;\s*$/, '')};${additions}` : additions;
  return setStyleAttr(tag, 'table', nextStyle);
}

export default function makeResponsiveHtml(html: string): string {
  let out = html;

  // Tag the columns-container tables so the stylesheet can stack them.
  out = out.replace(
    /<table(?![^>]*class=)([^>]*style="[^"]*table-layout:\s*fixed[^"]*")/gi,
    '<table class="eb-columns"$1'
  );

  // Fluid-hybrid pass: works in every client, no media queries required.
  out = out.replace(/<table\b[^>]*>/gi, fluidizeTable);
  out = out.replace(/<img\b[^>]*\/?>/gi, fluidizeImage);

  // Center the card on a bulletproof wrapper cell (not a lone align attr),
  // and pin its width for Outlook.
  out = wrapCentered(out);

  // Paint the backdrop edge-to-edge on <body> and drop its default margin so
  // the card reads as centered, not shoved to one side.
  const backdrop = extractBackdropColor(out);
  const bodyReset = `margin:0;padding:0;width:100%;background-color:${backdrop};`;
  if (/<body\b[^>]*style="/i.test(out)) {
    out = out.replace(/(<body\b[^>]*style=")/i, `$1${bodyReset}`);
  } else {
    out = out.replace(/<body\b([^>]*)>/i, `<body$1 style="${bodyReset}">`);
  }

  // Inject the head (renderToStaticMarkup emits <html><body> with no head).
  if (/<head[\s>]/i.test(out)) {
    out = out.replace(
      /<head([^>]*)>/i,
      `<head$1><meta name="viewport" content="width=device-width, initial-scale=1"/><style>${RESPONSIVE_STYLES}</style>`
    );
  } else {
    out = out.replace(/<html([^>]*)>/i, `<html$1>${HEAD_MARKUP}`);
  }

  // Also drop the stylesheet at the top of <body>. Some send pipelines forward
  // only the <body> inner HTML (dropping <head> and its <style>); a body-level
  // <style> then survives and keeps the media queries working. Harmless where
  // <head> is preserved, and where the transport strips ALL <style> the inline
  // fluid pass above is still the responsive floor.
  out = out.replace(/(<body\b[^>]*>)/i, `$1<style>${RESPONSIVE_STYLES}</style>`);

  return out;
}
