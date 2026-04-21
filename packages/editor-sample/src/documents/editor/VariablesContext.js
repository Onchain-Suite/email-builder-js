var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { createContext, useContext, useEffect, useState } from 'react';
const VariablesContext = createContext(null);
export const useVariables = () => {
    const context = useContext(VariablesContext);
    if (!context) {
        throw new Error('useVariables must be used within a VariablesProvider');
    }
    return context;
};
// Default static variables to fallback to or simulate the API response
const DEFAULT_GROUPS = [
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
export const VariablesProvider = ({ children }) => {
    const [variableGroups, setVariableGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        // SIMULATION: Fetching from backend
        // In production, this would be: fetch('/api/v1/email-builder/config')
        const fetchVariables = () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                setLoading(true);
                // Simulate network delay
                yield new Promise((resolve) => setTimeout(resolve, 500));
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
            }
            catch (err) {
                setError('Failed to load variables');
            }
            finally {
                setLoading(false);
            }
        });
        fetchVariables();
    }, []);
    return (React.createElement(VariablesContext.Provider, { value: { variableGroups, loading, error } }, children));
};
//# sourceMappingURL=VariablesContext.js.map