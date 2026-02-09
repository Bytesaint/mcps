import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import type { Phone, Rule, Template, Project } from '../types/models';
import { loadPhones, savePhones, loadRules, saveRules, loadTemplates, saveTemplates, loadProjects, saveProjects } from '../storage/repo';

// State interface
interface AppState {
    phones: Phone[];
    rules: Rule[];
    templates: Template[];
    projects: Project[];
}

// Action types
type AppAction =
    // Phones
    | { type: 'ADD_PHONE'; payload: Phone }
    | { type: 'UPDATE_PHONE'; payload: Phone }
    | { type: 'DELETE_PHONE'; payload: string }
    // Rules
    | { type: 'ADD_RULE'; payload: Rule }
    | { type: 'UPDATE_RULE'; payload: Rule }
    | { type: 'DELETE_RULE'; payload: string }
    // Templates
    | { type: 'ADD_TEMPLATE'; payload: Template }
    | { type: 'UPDATE_TEMPLATE'; payload: Template }
    | { type: 'DELETE_TEMPLATE'; payload: string }
    // Projects
    | { type: 'ADD_PROJECT'; payload: Project }
    | { type: 'UPDATE_PROJECT'; payload: Project }
    | { type: 'DELETE_PROJECT'; payload: string }
    // Load all
    | { type: 'LOAD_ALL'; payload: AppState };

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        // Phones
        case 'ADD_PHONE': {
            const newPhones = [...state.phones, action.payload];
            savePhones(newPhones);
            return { ...state, phones: newPhones };
        }
        case 'UPDATE_PHONE': {
            const newPhones = state.phones.map(p => p.id === action.payload.id ? action.payload : p);
            savePhones(newPhones);
            return { ...state, phones: newPhones };
        }
        case 'DELETE_PHONE': {
            const newPhones = state.phones.filter(p => p.id !== action.payload);
            savePhones(newPhones);
            return { ...state, phones: newPhones };
        }

        // Rules
        case 'ADD_RULE': {
            const newRules = [...state.rules, action.payload];
            saveRules(newRules);
            return { ...state, rules: newRules };
        }
        case 'UPDATE_RULE': {
            const newRules = state.rules.map(r => r.id === action.payload.id ? action.payload : r);
            saveRules(newRules);
            return { ...state, rules: newRules };
        }
        case 'DELETE_RULE': {
            const newRules = state.rules.filter(r => r.id !== action.payload);
            saveRules(newRules);
            return { ...state, rules: newRules };
        }

        // Templates
        case 'ADD_TEMPLATE': {
            const newTemplates = [...state.templates, action.payload];
            saveTemplates(newTemplates);
            return { ...state, templates: newTemplates };
        }
        case 'UPDATE_TEMPLATE': {
            const newTemplates = state.templates.map(t => t.id === action.payload.id ? action.payload : t);
            saveTemplates(newTemplates);
            return { ...state, templates: newTemplates };
        }
        case 'DELETE_TEMPLATE': {
            const newTemplates = state.templates.filter(t => t.id !== action.payload);
            saveTemplates(newTemplates);
            return { ...state, templates: newTemplates };
        }

        // Projects
        case 'ADD_PROJECT': {
            const newProjects = [...state.projects, action.payload];
            saveProjects(newProjects);
            return { ...state, projects: newProjects };
        }
        case 'UPDATE_PROJECT': {
            const newProjects = state.projects.map(p => p.id === action.payload.id ? action.payload : p);
            saveProjects(newProjects);
            return { ...state, projects: newProjects };
        }
        case 'DELETE_PROJECT': {
            const newProjects = state.projects.filter(p => p.id !== action.payload);
            saveProjects(newProjects);
            return { ...state, projects: newProjects };
        }

        // Load all
        case 'LOAD_ALL':
            return action.payload;

        default:
            return state;
    }
}

// Context interface
interface AppStoreContextType {
    state: AppState;
    // Phones
    addPhone: (phone: Phone) => void;
    updatePhone: (phone: Phone) => void;
    deletePhone: (id: string) => void;
    // Rules
    addRule: (rule: Rule) => void;
    updateRule: (rule: Rule) => void;
    deleteRule: (id: string) => void;
    // Templates
    addTemplate: (template: Template) => void;
    updateTemplate: (template: Template) => void;
    deleteTemplate: (id: string) => void;
    duplicateTemplate: (template: Template) => void;
    // Projects
    addProject: (project: Project) => void;
    updateProject: (project: Project) => void;
    deleteProject: (id: string) => void;
}

const AppStoreContext = createContext<AppStoreContextType | undefined>(undefined);

// Provider
export function AppStoreProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(appReducer, {
        phones: [],
        rules: [],
        templates: [],
        projects: [],
    });

    // Load data on mount
    useEffect(() => {
        const phones = loadPhones();
        const rules = loadRules();
        const templates = loadTemplates();
        const projects = loadProjects();
        dispatch({ type: 'LOAD_ALL', payload: { phones, rules, templates, projects } });
    }, []);

    // Phone actions
    const addPhone = (phone: Phone) => dispatch({ type: 'ADD_PHONE', payload: phone });
    const updatePhone = (phone: Phone) => dispatch({ type: 'UPDATE_PHONE', payload: phone });
    const deletePhone = (id: string) => dispatch({ type: 'DELETE_PHONE', payload: id });

    // Rule actions
    const addRule = (rule: Rule) => dispatch({ type: 'ADD_RULE', payload: rule });
    const updateRule = (rule: Rule) => dispatch({ type: 'UPDATE_RULE', payload: rule });
    const deleteRule = (id: string) => dispatch({ type: 'DELETE_RULE', payload: id });

    // Template actions
    const addTemplate = (template: Template) => dispatch({ type: 'ADD_TEMPLATE', payload: template });
    const updateTemplate = (template: Template) => dispatch({ type: 'UPDATE_TEMPLATE', payload: template });
    const deleteTemplate = (id: string) => dispatch({ type: 'DELETE_TEMPLATE', payload: id });
    const duplicateTemplate = (template: Template) => {
        const newTemplate: Template = {
            ...template,
            id: Math.random().toString(36).substring(2, 11),
            name: `${template.name} (Copy)`,
            updatedAt: new Date().toISOString(),
        };
        dispatch({ type: 'ADD_TEMPLATE', payload: newTemplate });
    };

    // Project actions
    const addProject = (project: Project) => dispatch({ type: 'ADD_PROJECT', payload: project });
    const updateProject = (project: Project) => dispatch({ type: 'UPDATE_PROJECT', payload: project });
    const deleteProject = (id: string) => dispatch({ type: 'DELETE_PROJECT', payload: id });

    return (
        <AppStoreContext.Provider
            value={{
                state,
                addPhone,
                updatePhone,
                deletePhone,
                addRule,
                updateRule,
                deleteRule,
                addTemplate,
                updateTemplate,
                deleteTemplate,
                duplicateTemplate,
                addProject,
                updateProject,
                deleteProject,
            }}
        >
            {children}
        </AppStoreContext.Provider>
    );
}

// Hook
export function useAppStore() {
    const context = useContext(AppStoreContext);
    if (!context) {
        throw new Error('useAppStore must be used within AppStoreProvider');
    }
    return context;
}
