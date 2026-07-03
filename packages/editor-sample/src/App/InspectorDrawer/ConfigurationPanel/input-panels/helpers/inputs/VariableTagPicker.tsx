import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Popover,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Braces, RotateCw, Search, X } from 'lucide-react';

import { useVariables } from '../../../../../../documents/editor/VariablesContext';

const RECENT_STORAGE_KEY = 'email_builder_recent_variables_v1';

function keyForDisplay(k: string) {
  return k
    .replace(/^\s*\{\{\s*/, '')
    .replace(/\s*\}\}\s*$/, '')
    .trim();
}

type Props = {
  /** Called with the merge tag (e.g. `{{ profile.firstName }}`) to insert. */
  onInsert: (tag: string) => void;
  label?: string;
};

/**
 * "Variable Tags" button + searchable popover of backend-driven merge tags
 * (GET /email-builder/config). Shared by the Text, Heading and Button
 * panels so any content field can be personalized per recipient.
 */
export default function VariableTagButton({ onInsert, label = 'Variable Tags' }: Props) {
  const [popoverAnchorEl, setPopoverAnchorEl] = useState<null | HTMLElement>(null);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listItemRefs = useRef<Array<HTMLDivElement | null>>([]);

  const { variableGroups, loading, error, refresh } = useVariables();

  const [recentKeys, setRecentKeys] = useState<string[]>(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as unknown) : null;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((v) => typeof v === 'string').slice(0, 8);
    } catch {
      return [];
    }
  });

  const open = Boolean(popoverAnchorEl);

  const handleMergeTagClick = (tagValue: string) => {
    onInsert(tagValue);
    setPopoverAnchorEl(null);
    setRecentKeys((prev) => {
      const next = [tagValue, ...prev.filter((k) => k !== tagValue)].slice(0, 8);
      try {
        window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
      } catch {
        return next;
      }
      return next;
    });
  };

  const allVariables = useMemo(() => {
    const items: Array<{
      groupId: string;
      groupLabel: string;
      key: string;
      label: string;
      type?: string;
      required?: boolean;
    }> = [];
    for (const g of variableGroups) {
      for (const it of g.items) {
        items.push({
          groupId: g.id,
          groupLabel: g.label,
          key: it.key,
          label: it.label,
          type: it.type,
          required: it.required,
        });
      }
    }
    return items;
  }, [variableGroups]);

  const recentVariables = useMemo(() => {
    const byKey = new Map(allVariables.map((v) => [v.key, v] as const));
    return recentKeys
      .map((k) => byKey.get(k) ?? { groupId: 'recent', groupLabel: 'Recent', key: k, label: keyForDisplay(k) })
      .slice(0, 8);
  }, [allVariables, recentKeys]);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (v: { key: string; label: string }) => {
      if (!q) return true;
      return v.label.toLowerCase().includes(q) || keyForDisplay(v.key).toLowerCase().includes(q);
    };

    const result: Array<{ id: string; label: string; items: typeof allVariables }> = [];

    if (!q && recentVariables.length > 0) {
      result.push({ id: 'recent', label: 'Recent', items: recentVariables as any });
    }

    for (const g of variableGroups) {
      const items = g.items
        .map((it) => ({
          groupId: g.id,
          groupLabel: g.label,
          key: it.key,
          label: it.label,
          type: it.type,
          required: it.required,
        }))
        .filter(matches);

      if (items.length > 0) {
        result.push({ id: g.id, label: g.label, items: items as any });
      }
    }

    return result;
  }, [query, recentVariables, variableGroups]);

  const selectable = useMemo(() => {
    const flat: Array<{ key: string; label: string }> = [];
    for (const g of filteredGroups) {
      for (const it of g.items) {
        flat.push({ key: it.key, label: it.label });
      }
    }
    return flat;
  }, [filteredGroups]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIndex(0);
    listItemRefs.current = [];
    window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = listItemRefs.current[activeIndex];
    el?.scrollIntoView?.({ block: 'nearest' });
  }, [activeIndex, open]);

  const onSearchKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(0, selectable.length - 1)));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const item = selectable[activeIndex] ?? selectable[0];
      if (item) handleMergeTagClick(item.key);
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setPopoverAnchorEl(null);
    }
  };

  return (
    <>
      <Tooltip title="Insert a merge tag that is replaced with each recipient's value at send time">
        <Button
          size="small"
          startIcon={loading ? <CircularProgress size={14} /> : <Braces size={14} />}
          onClick={(e) => setPopoverAnchorEl(e.currentTarget)}
          sx={{ textTransform: 'none', fontSize: '0.85rem' }}
        >
          {label}
        </Button>
      </Tooltip>
      <Popover
        anchorEl={popoverAnchorEl}
        open={open}
        onClose={() => setPopoverAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { width: 360, overflow: 'hidden' } }}
      >
        <Stack sx={{ p: 1.25 }} gap={1}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
            <Typography fontWeight={700} fontSize={13}>
              Insert Variable
            </Typography>
            <Stack direction="row" alignItems="center" gap={0.5}>
              <IconButton size="small" onClick={refresh} disabled={loading}>
                <RotateCw size={16} />
              </IconButton>
              <IconButton size="small" onClick={() => setPopoverAnchorEl(null)}>
                <X size={16} />
              </IconButton>
            </Stack>
          </Stack>

          <TextField
            size="small"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onSearchKeyDown}
            inputRef={searchInputRef}
            placeholder="Search variables…"
            InputProps={{
              startAdornment: (
                <Box sx={{ display: 'flex', alignItems: 'center', pr: 1, color: 'text.secondary' }}>
                  <Search size={16} />
                </Box>
              ),
            }}
          />

          {error ? (
            <Alert
              severity="warning"
              variant="outlined"
              action={
                <Button size="small" onClick={refresh} disabled={loading} sx={{ textTransform: 'none' }}>
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
          ) : null}

          <Divider />

          <Box sx={{ maxHeight: 320, overflow: 'auto' }}>
            {filteredGroups.length === 0 ? (
              <Box sx={{ py: 2, px: 1 }}>
                <Typography fontSize={13} color="text.secondary">
                  No matches
                </Typography>
              </Box>
            ) : (
              <Stack gap={1}>
                {(() => {
                  let runningIndex = 0;
                  return filteredGroups.map((g) => {
                    const items = g.items;
                    return (
                      <Box key={g.id}>
                        <Typography sx={{ px: 1, pb: 0.5 }} fontSize={12} fontWeight={700} color="text.secondary">
                          {g.label}
                        </Typography>
                        <List dense disablePadding>
                          {items.map((it: any) => {
                            const currentIndex = runningIndex;
                            runningIndex += 1;
                            const active = currentIndex === activeIndex;
                            const displayKey = keyForDisplay(it.key);
                            const rightChipLabel = it.required ? `${displayKey} *` : displayKey;
                            return (
                              <ListItemButton
                                key={`${it.key}-${currentIndex}`}
                                selected={active}
                                onClick={() => handleMergeTagClick(it.key)}
                                ref={(el) => {
                                  listItemRefs.current[currentIndex] = el;
                                }}
                                sx={{ borderRadius: 1, mx: 0.5, my: 0.25 }}
                              >
                                <ListItemText
                                  primary={
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                                      <Typography
                                        fontSize={13}
                                        fontWeight={600}
                                        sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                      >
                                        {it.label}
                                      </Typography>
                                      <Stack direction="row" gap={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
                                        {it.type ? (
                                          <Chip
                                            size="small"
                                            label={it.type}
                                            variant="outlined"
                                            sx={{ height: 20, fontSize: 11 }}
                                          />
                                        ) : null}
                                        <Chip
                                          size="small"
                                          label={rightChipLabel}
                                          variant="outlined"
                                          sx={{
                                            height: 20,
                                            fontSize: 11,
                                            fontFamily:
                                              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                                          }}
                                        />
                                      </Stack>
                                    </Stack>
                                  }
                                />
                              </ListItemButton>
                            );
                          })}
                        </List>
                      </Box>
                    );
                  });
                })()}
              </Stack>
            )}
          </Box>
        </Stack>
      </Popover>
    </>
  );
}
