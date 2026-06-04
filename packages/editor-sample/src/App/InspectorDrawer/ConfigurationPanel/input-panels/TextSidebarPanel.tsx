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
import { TextProps, TextPropsSchema } from '@usewaypoint/block-text';

import BaseSidebarPanel from './helpers/BaseSidebarPanel';
import BooleanInput from './helpers/inputs/BooleanInput';
import MultiStylePropertyPanel from './helpers/style-inputs/MultiStylePropertyPanel';
import { useVariables } from '../../../../documents/editor/VariablesContext';

type TextSidebarPanelProps = {
  data: TextProps;
  setData: (v: TextProps) => void;
};

export default function TextSidebarPanel({ data, setData }: TextSidebarPanelProps) {
  const [, setErrors] = useState<Zod.ZodError | null>(null);
  const [popoverAnchorEl, setPopoverAnchorEl] = useState<null | HTMLElement>(null);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listItemRefs = useRef<Array<HTMLDivElement | null>>([]);

  const { variableGroups, loading, error, refresh } = useVariables();

  const recentStorageKey = 'email_builder_recent_variables_v1';
  const [recentKeys, setRecentKeys] = useState<string[]>(() => {
    try {
      const raw = window.localStorage.getItem(recentStorageKey);
      const parsed = raw ? (JSON.parse(raw) as unknown) : null;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((v) => typeof v === 'string').slice(0, 8);
    } catch {
      return [];
    }
  });

  const open = Boolean(popoverAnchorEl);

  const updateData = (d: unknown) => {
    const res = TextPropsSchema.safeParse(d);
    if (res.success) {
      setData(res.data);
      setErrors(null);
    } else {
      setErrors(res.error);
    }
  };

  const handleMergeTagClick = (tagValue: string) => {
    const input = inputRef.current;
    if (!input) return;

    const currentText = data.props?.text ?? '';
    const start = input.selectionStart ?? currentText.length;
    const end = input.selectionEnd ?? currentText.length;

    const newText = currentText.substring(0, start) + tagValue + currentText.substring(end);

    updateData({ ...data, props: { ...data.props, text: newText } });
    setPopoverAnchorEl(null);

    setRecentKeys((prev) => {
      const next = [tagValue, ...prev.filter((k) => k !== tagValue)].slice(0, 8);
      try {
        window.localStorage.setItem(recentStorageKey, JSON.stringify(next));
      } catch {
        return next;
      }
      return next;
    });

    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + tagValue.length, start + tagValue.length);
    }, 0);
  };

  const keyForDisplay = (k: string) =>
    k.replace(/^\s*\{\{\s*/, '').replace(/\s*\}\}\s*$/, '').trim();

  const allVariables = useMemo(() => {
    const items: Array<{ groupId: string; groupLabel: string; key: string; label: string; type?: string; required?: boolean }> = [];
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
    <BaseSidebarPanel title="Text block">
      <Box mb={2}>
        <Box display="flex" justifyContent="flex-start" alignItems="left" mb={3}>
          <Box />
          <Tooltip title="Insert Variable">
            <Button
              size="small"
              startIcon={loading ? <CircularProgress size={14} /> : <Braces size={14} />}
              onClick={(e) => setPopoverAnchorEl(e.currentTarget)}
              sx={{ textTransform: 'none', fontSize: '0.85rem' }}
            >
              Variable Tags
            </Button>
          </Tooltip>
        </Box>
        <TextField
          label="Content"
          fullWidth
          multiline
          minRows={5}
          variant="outlined"
          value={data.props?.text ?? ''}
          onChange={(e) => updateData({ ...data, props: { ...data.props, text: e.target.value } })}
          inputRef={inputRef}
        />
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
                                        <Typography fontSize={13} fontWeight={600} sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                          {it.label}
                                        </Typography>
                                        <Stack direction="row" gap={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
                                          {it.type ? (
                                            <Chip size="small" label={it.type} variant="outlined" sx={{ height: 20, fontSize: 11 }} />
                                          ) : null}
                                          <Chip
                                            size="small"
                                            label={rightChipLabel}
                                            variant="outlined"
                                            sx={{ height: 20, fontSize: 11, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}
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
      </Box>

      <BooleanInput
        label="Markdown"
        defaultValue={data.props?.markdown ?? false}
        onChange={(markdown) => updateData({ ...data, props: { ...data.props, markdown } })}
      />

      <MultiStylePropertyPanel
        names={['color', 'backgroundColor', 'fontFamily', 'fontSize', 'fontWeight', 'textAlign', 'padding']}
        value={data.style}
        onChange={(style) => updateData({ ...data, style })}
      />
    </BaseSidebarPanel>
  );
}
