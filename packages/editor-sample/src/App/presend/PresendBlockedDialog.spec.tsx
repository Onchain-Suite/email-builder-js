import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react-dom/test-utils';

import { envelopeBody, SEED_CHECK, SHORTENER_CHECK } from './fixtures';
import { parsePresendBlock } from './presendBlock';
import PresendBlockedDialog from './PresendBlockedDialog';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function render(element: React.ReactElement) {
  act(() => root.render(element));
}

describe('PresendBlockedDialog', () => {
  it('shows the headline, each block with message and fix, and the offending links', () => {
    const block = parsePresendBlock(422, envelopeBody())!;
    render(<PresendBlockedDialog block={block} onClose={() => undefined} />);

    const text = document.body.textContent ?? '';
    expect(text).toContain(
      `Not saved: this email can't go out while it contains a link shortener and asks for a seed phrase or private key.`
    );
    const shortener = document.querySelector('[data-testid="presend-check-URL_SHORTENER"]');
    const seed = document.querySelector('[data-testid="presend-check-SEED_PHRASE_REQUEST"]');
    expect(shortener?.textContent).toContain(SHORTENER_CHECK.message);
    expect(shortener?.textContent).toContain(SHORTENER_CHECK.fix);
    const links = Array.from(shortener?.querySelectorAll('li') ?? []).map((li) => li.textContent);
    expect(links).toEqual(['https://bit.ly/abc', 'https://tinyurl.com/xyz']);
    expect(seed?.textContent).toContain(SEED_CHECK.message);
    expect(seed?.textContent).toContain(SEED_CHECK.fix);
    expect(seed?.querySelectorAll('li').length).toBe(0);
    expect(text).toContain('Your edits are still here.');
  });

  it('renders nothing without a block, and closes on the button', () => {
    render(<PresendBlockedDialog block={null} onClose={() => undefined} />);
    expect(document.querySelector('[role="dialog"]')).toBeNull();

    const onClose = jest.fn();
    render(<PresendBlockedDialog block={parsePresendBlock(422, envelopeBody([SEED_CHECK]))!} onClose={onClose} />);
    const button = Array.from(document.querySelectorAll('button')).find((b) => b.textContent === 'Back to editing');
    act(() => button!.click());
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
