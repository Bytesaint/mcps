import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Phone, Rule, Template, Project, Spec, INITIAL_PHONES, INITIAL_RULES, INITIAL_TEMPLATES, INITIAL_PROJECTS } from './data';

// Re-export types for convenience
export type { Phone, Rule, Template, Project, Spec };

interface AppState {
    phones: Phone[];
    rules: Rule[];
    templates: Template[];
    projects: Project[];
    addPhone: (phone: Phone) => void;
    updatePhone: (phone: Phone) => void;
    deletePhone: (id: string) => void;
    addRule: (rule: Rule) => void;
    updateRule: (rule: Rule) => void;
    deleteRule: (id: string) => void;
    addTemplate: (template: Template) => void;
    deleteTemplate: (id: string) => void;
    addProject: (project: Project) => void;
    deleteProject: (id: string) => void;
}

const MockContext = createContext<AppState | undefined>(undefined);

export const MockProvider = ({ children }: { children: ReactNode }) => {
    const [phones, setPhones] = useState<Phone[]>(INITIAL_PHONES);
    const [rules, setRules] = useState<Rule[]>(INITIAL_RULES);
    const [templates, setTemplates] = useState<Template[]>(INITIAL_TEMPLATES);
    const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);

    const addPhone = (phone: Phone) => setPhones([...phones, phone]);
    const updatePhone = (phone: Phone) => setPhones(phones.map(p => p.id === phone.id ? phone : p));
    const deletePhone = (id: string) => setPhones(phones.filter(p => p.id !== id));

    const addRule = (rule: Rule) => setRules([...rules, rule]);
    const updateRule = (rule: Rule) => setRules(rules.map(r => r.id === rule.id ? rule : r));
    const deleteRule = (id: string) => setRules(rules.filter(r => r.id !== id));

    const addTemplate = (template: Template) => setTemplates([...templates, template]);
    const deleteTemplate = (id: string) => setTemplates(templates.filter(t => t.id !== id));

    const addProject = (project: Project) => setProjects([...projects, project]);
    const deleteProject = (id: string) => setProjects(projects.filter(p => p.id !== id));

    return (
        <MockContext.Provider value={{
            phones, rules, templates, projects,
            addPhone, updatePhone, deletePhone,
            addRule, updateRule, deleteRule,
            addTemplate, deleteTemplate,
            addProject, deleteProject
        }}>
            {children}
        </MockContext.Provider>
    );
};

export const useMock = () => {
    const context = useContext(MockContext);
    if (!context) {
        throw new Error('useMock must be used within a MockProvider');
    }
    return context;
};
