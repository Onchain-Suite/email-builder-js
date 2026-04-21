import React from 'react';
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
export declare const useVariables: () => VariablesContextType;
export declare const VariablesProvider: React.FC<{
    children: React.ReactNode;
}>;
export {};
//# sourceMappingURL=VariablesContext.d.ts.map