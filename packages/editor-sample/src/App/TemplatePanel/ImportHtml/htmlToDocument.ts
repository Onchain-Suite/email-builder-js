import { EditorConfigurationSchema, TEditorConfiguration } from '../../../documents/editor/core';

/**
 * Converts pasted HTML into a builder document made of Html blocks.
 *
 * The markup is imported verbatim (no lossy conversion to native blocks).
 * With `split` enabled, the top-level sections of the email are placed into
 * separate Html blocks so they can be reordered/deleted on the canvas; each
 * section keeps a copy of its ancestor wrappers (outer tables, tds, …) so it
 * still renders standalone exactly as it did in the original document.
 */

export type THtmlImportResult = {
  document: TEditorConfiguration;
  sectionCount: number;
};

// Wrappers that are safe to descend through while they have a single child.
const DESCENDABLE_TAGS = new Set([
  'DIV',
  'CENTER',
  'TABLE',
  'TBODY',
  'THEAD',
  'TFOOT',
  'TR',
  'TD',
  'TH',
  'SECTION',
  'ARTICLE',
  'MAIN',
  'HEADER',
  'FOOTER',
]);

// Elements that can stand alone as a section. TD/TH are deliberately absent:
// splitting a row's cells would stack columns vertically.
const SECTIONABLE_TAGS = new Set([
  'TABLE',
  'DIV',
  'P',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'UL',
  'OL',
  'HR',
  'IMG',
  'SECTION',
  'ARTICLE',
  'HEADER',
  'FOOTER',
  'CENTER',
  'BLOCKQUOTE',
  'TR',
]);

function isWhitespaceText(node: Node): boolean {
  return node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim().length === 0;
}

// MSO conditionals (<!--[if mso]> … <![endif]-->) span sibling nodes; splitting
// between them would orphan the open/close halves in different blocks.
function isConditionalComment(node: Node): boolean {
  return node.nodeType === Node.COMMENT_NODE && /\[(?:if|endif)/i.test(node.textContent ?? '');
}

function significantChildren(el: Element): Node[] {
  return Array.from(el.childNodes).filter((n) => !isWhitespaceText(n) && n.nodeType !== Node.COMMENT_NODE);
}

function hasConditionalComments(el: Element): boolean {
  return Array.from(el.childNodes).some(isConditionalComment);
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function openTag(el: Element): string {
  const attrs = Array.from(el.attributes)
    .map((a) => ` ${a.name}="${escapeAttribute(a.value)}"`)
    .join('');
  return `<${el.tagName.toLowerCase()}${attrs}>`;
}

function closeTag(el: Element): string {
  return `</${el.tagName.toLowerCase()}>`;
}

function wrapInChain(chain: Element[], inner: string): string {
  const open = chain.map(openTag).join('');
  const close = [...chain]
    .reverse()
    .map(closeTag)
    .join('');
  return `${open}${inner}${close}`;
}

/**
 * Walks down from <body> through single-child wrappers, then splits the first
 * multi-child container into one HTML string per child. Returns null when no
 * safe split point exists (the caller falls back to a single section).
 */
function splitIntoSections(body: Element): string[] | null {
  let current: Element = body;
  const chain: Element[] = [];

  for (;;) {
    if (hasConditionalComments(current)) {
      return null;
    }
    const children = significantChildren(current);
    const elements = children.filter((n): n is Element => n.nodeType === Node.ELEMENT_NODE);

    // Loose text mixed in — not a structural wrapper, stop here.
    if (elements.length !== children.length || elements.length === 0) {
      return null;
    }

    if (elements.length === 1) {
      const only = elements[0];
      if (!DESCENDABLE_TAGS.has(only.tagName)) {
        return null;
      }
      if (only !== body) {
        chain.push(only);
      }
      current = only;
      continue;
    }

    if (elements.every((el) => SECTIONABLE_TAGS.has(el.tagName))) {
      return elements.map((el) => wrapInChain(chain, el.outerHTML));
    }
    return null;
  }
}

function parseHexColor(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const v = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(v)) {
    return v;
  }
  if (/^#[0-9a-fA-F]{3}$/.test(v)) {
    return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
  }
  // CSSOM reports inline styles as rgb(r, g, b).
  const rgb = v.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/);
  if (rgb) {
    const hex = rgb
      .slice(1, 4)
      .map((n) => Math.min(255, Number(n)).toString(16).padStart(2, '0'))
      .join('');
    return `#${hex}`;
  }
  return null;
}

function extractBackdropColor(body: HTMLElement): string | null {
  const fromStyle = parseHexColor(body.style.backgroundColor);
  if (fromStyle) {
    return fromStyle;
  }
  return parseHexColor(body.getAttribute('bgcolor'));
}

export default function htmlToDocument(html: string, options: { split: boolean }): THtmlImportResult {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const body = parsed.body;

  if (!body || body.innerHTML.trim().length === 0) {
    throw new Error('No HTML content found. Paste the full email HTML (or a fragment of it).');
  }

  // <style> blocks from <head> would otherwise be dropped; carried over in a
  // leading block so class-based and responsive styles keep working.
  const headStyles = Array.from(parsed.querySelectorAll('head style'))
    .map((el) => el.outerHTML)
    .join('\n');

  let sections: string[] | null = null;
  if (options.split) {
    sections = splitIntoSections(body);
  }
  if (!sections || sections.length === 0) {
    sections = [body.innerHTML];
  }
  if (headStyles) {
    sections = [headStyles, ...sections];
  }

  const stamp = Date.now();
  const childrenIds = sections.map((_, i) => `block-${stamp}-${i}`);

  const document: TEditorConfiguration = {
    root: {
      type: 'EmailLayout',
      data: {
        backdropColor: extractBackdropColor(body) ?? '#F5F5F5',
        canvasColor: '#FFFFFF',
        textColor: '#262626',
        fontFamily: 'MODERN_SANS',
        childrenIds,
      },
    },
  };
  sections.forEach((contents, i) => {
    document[childrenIds[i]] = {
      type: 'Html',
      data: {
        props: { contents },
      },
    };
  });

  const validated = EditorConfigurationSchema.safeParse(document);
  if (!validated.success) {
    throw new Error('The pasted HTML could not be converted into an editable document.');
  }

  return { document: validated.data, sectionCount: sections.length };
}
