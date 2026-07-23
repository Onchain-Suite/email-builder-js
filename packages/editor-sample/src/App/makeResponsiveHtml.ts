/**
 * Post-processes the rendered email HTML to make it mobile-responsive.
 *
 * Two layers, because email clients differ:
 * 1. Fluid-hybrid inline rewrites (work EVERYWHERE, media queries or not —
 *    including the Gmail app on non-Gmail accounts, which strips <style>):
 *    - any table fixed wider than 480px becomes width:100% + max-width:<n>px
 *    - images gain max-width:100%; height:auto
 * 2. A <head> with viewport meta and a media-query stylesheet for clients
 *    that support it: multi-column layout tables (tagged via their inline
 *    `table-layout:fixed`) stack vertically on small screens.
 *
 * Deliberately absent: a blanket mobile `table { width:100% !important }` —
 * it stretched small tables (buttons, badges) across the full screen.
 */

// Containers narrower than this are intentional (buttons, avatars) — leave
// their fixed widths alone.
const FLUID_MIN_PX = 480;

const RESPONSIVE_STYLES = `
  body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
  img { border: 0; outline: none; text-decoration: none; }
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
    nextStyle = nextStyle ? `${nextStyle.replace(/;\s*$/, '')};max-width:${width}px` : `width:100%;max-width:${width}px`;
  }
  return setStyleAttr(out, 'table', nextStyle);
}

/** Images never overflow their container; height follows the scaled width. */
function fluidizeImage(tag: string): string {
  const style = getStyleAttr(tag);
  if (style && /max-width/i.test(style)) {
    return tag;
  }
  const nextStyle = style
    ? `${style.replace(/;\s*$/, '')};max-width:100%;height:auto`
    : 'max-width:100%;height:auto';
  return setStyleAttr(tag, 'img', nextStyle);
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

  // Inject the head (renderToStaticMarkup emits <html><body> with no head).
  if (/<head[\s>]/i.test(out)) {
    out = out.replace(
      /<head([^>]*)>/i,
      `<head$1><meta name="viewport" content="width=device-width, initial-scale=1"/><style>${RESPONSIVE_STYLES}</style>`
    );
  } else {
    out = out.replace(/<html([^>]*)>/i, `<html$1>${HEAD_MARKUP}`);
  }

  return out;
}
