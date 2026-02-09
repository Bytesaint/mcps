import type { Phone, Rule, Template, Project } from '../types/models';

// Storage keys
const STORAGE_KEYS = {
    PHONES: 'mpcs_phones_v1',
    RULES: 'mpcs_rules_v1',
    TEMPLATES: 'mpcs_templates_v1',
    PROJECTS: 'mpcs_projects_v1',
} as const;

// Phones
export function loadPhones(): Phone[] {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.PHONES);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Failed to load phones:', error);
        return [];
    }
}

export function savePhones(phones: Phone[]): void {
    try {
        localStorage.setItem(STORAGE_KEYS.PHONES, JSON.stringify(phones));
    } catch (error) {
        console.error('Failed to save phones:', error);
    }
}

// Rules
export function loadRules(): Rule[] {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.RULES);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Failed to load rules:', error);
        return [];
    }
}

export function saveRules(rules: Rule[]): void {
    try {
        localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(rules));
    } catch (error) {
        console.error('Failed to save rules:', error);
    }
}

// Templates
export function loadTemplates(): Template[] {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Failed to load templates:', error);
        return [];
    }
}

export function saveTemplates(templates: Template[]): void {
    try {
        localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
    } catch (error) {
        console.error('Failed to save templates:', error);
    }
}

// Projects
export function loadProjects(): Project[] {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Failed to load projects:', error);
        return [];
    }
}

export function saveProjects(projects: Project[]): void {
    try {
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    } catch (error) {
        console.error('Failed to save projects:', error);
    }
}
