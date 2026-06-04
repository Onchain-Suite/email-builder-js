import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export interface VariableDefinition {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
}

export interface VariableGroup {
  id: string;
  label: string;
  items: VariableDefinition[];
}

interface VariablesContextType {
  variableGroups: VariableGroup[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const VariablesContext = createContext<VariablesContextType | null>(null);

export const useVariables = () => {
  const context = useContext(VariablesContext);
  if (!context) {
    throw new Error('useVariables must be used within a VariablesProvider');
  }
  return context;
};

const EMPTY_GROUPS: VariableGroup[] = [];

type VariablesProviderProps = {
  children: React.ReactNode;
  apiBaseUrl?: string;
  token?: string | null;
  orgId?: string | null;
  embedded?: boolean;
};

export const VariablesProvider: React.FC<VariablesProviderProps> = ({ children, apiBaseUrl, token, orgId, embedded }) => {
  const [variableGroups, setVariableGroups] = useState<VariableGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const baseUrl = useMemo(() => apiBaseUrl?.replace(/\/+$/, '') ?? '', [apiBaseUrl]);
  const refresh = useMemo(() => () => setRefreshNonce((n) => n + 1), []);

  useEffect(() => {
    const fetchVariables = async () => {
      if (!baseUrl) {
        setVariableGroups(EMPTY_GROUPS);
        setError('Missing apiBaseUrl; cannot load variables.');
        setLoading(false);
        return;
      }
      if (embedded && (!token || !orgId)) {
        setVariableGroups(EMPTY_GROUPS);
        setError('Missing auth config; cannot load variables.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const headers: Record<string, string> = { Accept: 'application/json' };
        if (orgId) headers['x-org-id'] = orgId;
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
          headers['x-editor-token'] = token;
        }

        const res = await fetch(`${baseUrl}/email-builder/config`, {
          method: 'GET',
          headers,
          credentials: token ? 'omit' : 'include',
        });

        if (!res.ok) {
          const contentType = res.headers.get('content-type') ?? '';
          if (contentType.includes('application/json')) {
            const data = (await res.json().catch(() => null)) as any;
            const message = data?.error?.message ?? data?.message ?? `Failed to load variables (HTTP ${res.status})`;
            throw new Error(message);
          }
          const text = await res.text().catch(() => '');
          throw new Error(text || `Failed to load variables (HTTP ${res.status})`);
        }

        const json = (await res.json()) as any;
        if (json?.success === false) {
          throw new Error(json?.error?.message ?? json?.message ?? 'Failed to load variables');
        }

        const payload = (json?.data ?? json?.payload ?? json) as any;
        const groups = (payload?.groups ?? payload?.variableGroups ?? []) as any[];

        const normalized: VariableGroup[] = groups
          .filter(Boolean)
          .map((g) => {
            const id = String(g.id ?? g.key ?? g.name ?? 'group');
            const label = String(g.label ?? g.name ?? id);
            const itemsRaw = (g.items ?? g.variables ?? g.values ?? []) as any[];
            const items = itemsRaw
              .filter(Boolean)
              .map((it) => {
                const rawKey = String(it.key ?? it.value ?? it.name ?? '');
                const label = String(it.label ?? it.name ?? rawKey);
                const key = rawKey.includes('{{') ? rawKey : `{{ ${rawKey} }}`;
                const type = typeof it.type === 'string' ? it.type : undefined;
                const required = typeof it.required === 'boolean' ? it.required : undefined;
                return { key, label, type, required } satisfies VariableDefinition;
              })
              .filter((it) => it.key !== '{{  }}');

            return { id, label, items };
          })
          .filter((g) => g.items.length > 0);

        setVariableGroups(normalized);
        if (normalized.length === 0) {
          setError('No variables returned by backend.');
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to load variables';
        setError(message);
        setVariableGroups(EMPTY_GROUPS);
      } finally {
        setLoading(false);
      }
    };

    fetchVariables();
  }, [baseUrl, embedded, orgId, refreshNonce, token]);

  return (
    <VariablesContext.Provider value={{ variableGroups, loading, error, refresh }}>
      {children}
    </VariablesContext.Provider>
  );
};
