import React, { createContext, useContext, useEffect, useState } from 'react';

export interface VariableDefinition {
  key: string;
  label: string;
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
}

const VariablesContext = createContext<VariablesContextType | null>(null);

export const useVariables = () => {
  const context = useContext(VariablesContext);
  if (!context) {
    throw new Error('useVariables must be used within a VariablesProvider');
  }
  return context;
};

// Default static variables to fallback to or simulate the API response
const DEFAULT_GROUPS: VariableGroup[] = [
  {
    id: 'recipient',
    label: 'Recipient',
    items: [
      { label: 'First Name', key: '{{ user.first_name }}' },
      { label: 'Last Name', key: '{{ user.last_name }}' },
      { label: 'Email', key: '{{ user.email }}' },
      { label: 'Job Title', key: '{{ user.job_title }}' },
    ],
  },
  {
    id: 'company',
    label: 'Company',
    items: [
      { label: 'Name', key: '{{ company.name }}' },
      { label: 'Address', key: '{{ company.address }}' },
    ],
  },
  {
    id: 'campaign',
    label: 'Campaign',
    items: [
      { label: 'Unsubscribe', key: '{{ system.unsubscribe_url }}' },
      { label: 'View in Browser', key: '{{ system.view_in_browser }}' },
    ],
  },
];

export const VariablesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [variableGroups, setVariableGroups] = useState<VariableGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // SIMULATION: Fetching from backend
    // In production, this would be: fetch('/api/v1/email-builder/config')
    const fetchVariables = async () => {
      try {
        setLoading(true);
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        // Simulate receiving dynamic custom fields along with standard ones
        const dynamicResponse = [
            ...DEFAULT_GROUPS,
            {
                id: 'custom',
                label: 'Custom Fields',
                items: [
                    { label: 'Membership Level', key: '{{ user.custom.membership_level }}' },
                    { label: 'Points Balance', key: '{{ user.custom.points }}' },
                ]
            }
        ];
        
        setVariableGroups(dynamicResponse);
      } catch (err) {
        setError('Failed to load variables');
      } finally {
        setLoading(false);
      }
    };

    fetchVariables();
  }, []);

  return (
    <VariablesContext.Provider value={{ variableGroups, loading, error }}>
      {children}
    </VariablesContext.Provider>
  );
};
