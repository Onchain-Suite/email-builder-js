import { create } from 'zustand';

import getConfiguration from '../../getConfiguration';

import { TEditorBlock, TEditorConfiguration } from './core';

export type TPushContent = {
  title: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
};

export const EMPTY_PUSH_CONTENT: TPushContent = { title: '', body: '', ctaLabel: '', ctaUrl: '' };

type TValue = {
  document: TEditorConfiguration;

  past: TEditorConfiguration[];
  future: TEditorConfiguration[];

  // Companion in-app push notification for this campaign. Not part of the
  // block document; saved alongside it as the `push` field.
  pushContent: TPushContent;

  selectedBlockId: string | null;
  selectedSidebarTab: 'blocks' | 'block-configuration' | 'styles' | 'history';
  selectedMainTab: 'editor' | 'preview' | 'push';
  selectedScreenSize: 'desktop' | 'mobile';

  inspectorDrawerOpen: boolean;
  samplesDrawerOpen: boolean;
};

const editorStateStore = create<TValue>(() => ({
  document: getConfiguration(window.location.hash),
  past: [],
  future: [],
  pushContent: EMPTY_PUSH_CONTENT,
  selectedBlockId: null,
  selectedSidebarTab: 'blocks',
  selectedMainTab: 'editor',
  selectedScreenSize: 'desktop',

  inspectorDrawerOpen: true,
  samplesDrawerOpen: true,
}));

const HISTORY_LIMIT = 100;
const HISTORY_COALESCE_MS = 800;
let lastHistoryPushAt = 0;

function pushHistory(previous: TEditorConfiguration): Pick<TValue, 'past' | 'future'> {
  const { past } = editorStateStore.getState();
  const now = Date.now();
  // Coalesce rapid edits (e.g. typing) into a single undo step.
  const coalesce = now - lastHistoryPushAt < HISTORY_COALESCE_MS && past.length > 0;
  lastHistoryPushAt = now;
  if (coalesce) {
    return { past, future: [] };
  }
  return { past: [...past, previous].slice(-HISTORY_LIMIT), future: [] };
}

export function useDocument() {
  return editorStateStore((s) => s.document);
}

export function useSelectedBlockId() {
  return editorStateStore((s) => s.selectedBlockId);
}

export function useSelectedScreenSize() {
  return editorStateStore((s) => s.selectedScreenSize);
}

export function useSelectedMainTab() {
  return editorStateStore((s) => s.selectedMainTab);
}

export function setSelectedMainTab(selectedMainTab: TValue['selectedMainTab']) {
  return editorStateStore.setState({ selectedMainTab });
}

export function useSelectedSidebarTab() {
  return editorStateStore((s) => s.selectedSidebarTab);
}

export function usePushContent() {
  return editorStateStore((s) => s.pushContent);
}

export function setPushContent(pushContent: TPushContent) {
  return editorStateStore.setState({ pushContent });
}

/** True when the push has any content worth sending/saving. */
export function isPushContentPresent(pushContent: TPushContent): boolean {
  return pushContent.title.trim().length > 0 || pushContent.body.trim().length > 0;
}

/** The `push` field for save payloads, or undefined when not configured. */
export function toPushPayload(pushContent: TPushContent) {
  if (!isPushContentPresent(pushContent)) {
    return undefined;
  }
  return {
    title: pushContent.title.trim(),
    body: pushContent.body.trim(),
    ctaLabel: pushContent.ctaLabel.trim() || undefined,
    ctaUrl: pushContent.ctaUrl.trim() || undefined,
  };
}

export function useInspectorDrawerOpen() {
  return editorStateStore((s) => s.inspectorDrawerOpen);
}

export function useSamplesDrawerOpen() {
  return editorStateStore((s) => s.samplesDrawerOpen);
}

export function useCanUndo() {
  return editorStateStore((s) => s.past.length > 0);
}

export function useCanRedo() {
  return editorStateStore((s) => s.future.length > 0);
}

export function setSelectedBlockId(selectedBlockId: TValue['selectedBlockId']) {
  const selectedSidebarTab = selectedBlockId === null ? 'blocks' : 'block-configuration';
  const options: Partial<TValue> = {};
  if (selectedBlockId !== null) {
    options.inspectorDrawerOpen = true;
    options.samplesDrawerOpen = true;
  }
  return editorStateStore.setState({
    selectedBlockId,
    selectedSidebarTab,
    ...options,
  });
}

export function setSidebarTab(selectedSidebarTab: TValue['selectedSidebarTab']) {
  return editorStateStore.setState({ selectedSidebarTab });
}

export function resetDocument(document: TValue['document']) {
  const previous = editorStateStore.getState().document;
  return editorStateStore.setState({
    document,
    ...pushHistory(previous),
    selectedSidebarTab: 'blocks',
    selectedBlockId: null,
  });
}

export function setDocument(document: TValue['document']) {
  const originalDocument = editorStateStore.getState().document;
  return editorStateStore.setState({
    document: {
      ...originalDocument,
      ...document,
    },
    ...pushHistory(originalDocument),
  });
}

export function undo() {
  const { past, future, document } = editorStateStore.getState();
  if (past.length === 0) {
    return;
  }
  const previous = past[past.length - 1];
  editorStateStore.setState({
    document: previous,
    past: past.slice(0, -1),
    future: [...future, document].slice(-HISTORY_LIMIT),
    selectedBlockId: null,
  });
}

export function redo() {
  const { past, future, document } = editorStateStore.getState();
  if (future.length === 0) {
    return;
  }
  const next = future[future.length - 1];
  editorStateStore.setState({
    document: next,
    future: future.slice(0, -1),
    past: [...past, document].slice(-HISTORY_LIMIT),
    selectedBlockId: null,
  });
}

/**
 * Appends a block to the end of the root EmailLayout and selects it.
 * Used by the Blocks palette for click-to-add.
 */
export function appendBlockToRoot(block: TEditorBlock) {
  const document = editorStateStore.getState().document;
  const root = document.root as { type: string; data: { childrenIds?: string[] | null } & Record<string, unknown> };
  if (!root || root.type !== 'EmailLayout') {
    return;
  }
  const blockId = `block-${Date.now()}`;
  setDocument({
    [blockId]: block,
    root: {
      type: 'EmailLayout',
      data: {
        ...root.data,
        childrenIds: [...(root.data.childrenIds ?? []), blockId],
      },
    },
  } as unknown as TValue['document']);
  setSelectedBlockId(blockId);
}

export function toggleInspectorDrawerOpen() {
  const inspectorDrawerOpen = !editorStateStore.getState().inspectorDrawerOpen;
  return editorStateStore.setState({ inspectorDrawerOpen });
}

export function toggleSamplesDrawerOpen() {
  const samplesDrawerOpen = !editorStateStore.getState().samplesDrawerOpen;
  return editorStateStore.setState({ samplesDrawerOpen });
}

export function setSelectedScreenSize(selectedScreenSize: TValue['selectedScreenSize']) {
  return editorStateStore.setState({ selectedScreenSize });
}
