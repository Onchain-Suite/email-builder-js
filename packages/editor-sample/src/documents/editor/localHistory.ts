import { create } from 'zustand';

import { TEditorConfiguration } from './core';

/**
 * Local autosave history: debounced snapshots of the working document,
 * persisted to localStorage so recent work survives reloads and is browsable
 * from the History tab — independent of any backend.
 */
export type TDesignSnapshot = {
  id: string;
  savedAt: string; // ISO
  label: string;
  document: TEditorConfiguration;
};

const STORAGE_KEY = 'email-builder.recent-designs.v1';
const MAX_SNAPSHOTS = 20;
const DEBOUNCE_MS = 2500;

function readStorage(): TDesignSnapshot[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStorage(snapshots: TDesignSnapshot[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
  } catch {
    // Storage full or unavailable — autosave is best-effort.
  }
}

const snapshotStore = create<{ snapshots: TDesignSnapshot[] }>(() => ({
  snapshots: readStorage(),
}));

export function useDesignSnapshots(): TDesignSnapshot[] {
  return snapshotStore((s) => s.snapshots);
}

function deriveLabel(document: TEditorConfiguration): string {
  // Use the first heading/text content as a label when available.
  for (const block of Object.values(document)) {
    const data = (block as { type?: string; data?: { props?: { text?: unknown } } }) ?? {};
    if ((data.type === 'Heading' || data.type === 'Text') && typeof data.data?.props?.text === 'string') {
      const text = data.data.props.text.trim();
      if (text.length > 0) {
        return text.length > 48 ? `${text.slice(0, 48)}…` : text;
      }
    }
  }
  const blockCount = Math.max(Object.keys(document).length - 1, 0);
  return `Untitled design (${blockCount} block${blockCount === 1 ? '' : 's'})`;
}

let debounceTimer: number | null = null;
let lastSerialized: string | null = null;

/**
 * Records a debounced snapshot of the document. Consecutive identical
 * documents are skipped; the newest snapshot replaces one made within the
 * same editing session window (5 minutes) so the list shows distinct work
 * sessions rather than every keystroke.
 */
export function recordSnapshot(document: TEditorConfiguration) {
  if (typeof window === 'undefined') {
    return;
  }
  if (debounceTimer !== null) {
    window.clearTimeout(debounceTimer);
  }
  debounceTimer = window.setTimeout(() => {
    debounceTimer = null;
    const serialized = JSON.stringify(document);
    if (serialized === lastSerialized) {
      return;
    }
    lastSerialized = serialized;

    const now = new Date();
    const snapshots = [...snapshotStore.getState().snapshots];
    const newest = snapshots[0];
    const withinSession = newest && now.getTime() - new Date(newest.savedAt).getTime() < 5 * 60 * 1000;

    const snapshot: TDesignSnapshot = {
      id: withinSession ? newest.id : `snap_${now.getTime()}`,
      savedAt: now.toISOString(),
      label: deriveLabel(document),
      document,
    };

    const next = withinSession ? [snapshot, ...snapshots.slice(1)] : [snapshot, ...snapshots];
    const capped = next.slice(0, MAX_SNAPSHOTS);
    snapshotStore.setState({ snapshots: capped });
    writeStorage(capped);
  }, DEBOUNCE_MS);
}

export function deleteSnapshot(id: string) {
  const next = snapshotStore.getState().snapshots.filter((s) => s.id !== id);
  snapshotStore.setState({ snapshots: next });
  writeStorage(next);
}
