export const ACTIONS = {
    // Navigation
    MPCS_NAV_DASHBOARD: "MPCS_NAV_DASHBOARD",
    MPCS_NAV_PHONES: "MPCS_NAV_PHONES",
    MPCS_NAV_RULES: "MPCS_NAV_RULES",
    MPCS_NAV_TEMPLATES: "MPCS_NAV_TEMPLATES",
    MPCS_NAV_GENERATE: "MPCS_NAV_GENERATE",
    MPCS_NAV_PROJECTS: "MPCS_NAV_PROJECTS",
    MPCS_NAV_SETTINGS: "MPCS_NAV_SETTINGS",

    // Dashboard
    MPCS_DASHBOARD_ADD_PHONE: "MPCS_DASHBOARD_ADD_PHONE",
    MPCS_DASHBOARD_CREATE_TEMPLATE: "MPCS_DASHBOARD_CREATE_TEMPLATE",
    MPCS_DASHBOARD_GENERATE_PROJECT: "MPCS_DASHBOARD_GENERATE_PROJECT",

    // Phones
    MPCS_PHONES_ADD: "MPCS_PHONES_ADD",
    MPCS_PHONES_EDIT: "MPCS_PHONES_EDIT",
    MPCS_PHONES_DELETE: "MPCS_PHONES_DELETE",
    MPCS_PHONES_SAVE: "MPCS_PHONES_SAVE",

    // Rules
    MPCS_RULES_ADD: "MPCS_RULES_ADD",
    MPCS_RULES_EDIT: "MPCS_RULES_EDIT",
    MPCS_RULES_DELETE: "MPCS_RULES_DELETE",
    MPCS_RULES_SAVE: "MPCS_RULES_SAVE",

    // Templates
    MPCS_TEMPLATE_CREATE: "MPCS_TEMPLATE_CREATE",
    MPCS_TEMPLATE_DUPLICATE: "MPCS_TEMPLATE_DUPLICATE",
    MPCS_TEMPLATE_DELETE: "MPCS_TEMPLATE_DELETE",
    MPCS_TEMPLATE_OPEN_BUILDER: "MPCS_TEMPLATE_OPEN_BUILDER",

    // Generate
    MPCS_GENERATE_PREVIEW: "MPCS_GENERATE_PREVIEW",
    MPCS_GENERATE_SAVE: "MPCS_GENERATE_SAVE",

    // Projects
    MPCS_PROJECTS_OPEN: "MPCS_PROJECTS_OPEN",
    MPCS_PROJECTS_DELETE: "MPCS_PROJECTS_DELETE",
    MPCS_PROJECTS_EXPORT: "MPCS_PROJECTS_EXPORT",
    MPCS_PROJECTS_EDIT: "MPCS_PROJECTS_EDIT",

    // Settings
    MPCS_SETTINGS_THEME_TOGGLE: "MPCS_SETTINGS_THEME_TOGGLE",
    MPCS_SETTINGS_RULES_ADMIN: "MPCS_SETTINGS_RULES_ADMIN",
    MPCS_SETTINGS_DATA_IMPORT: "MPCS_SETTINGS_DATA_IMPORT",
    MPCS_SETTINGS_DATA_EXPORT: "MPCS_SETTINGS_DATA_EXPORT",
} as const;

export type ActionId = typeof ACTIONS[keyof typeof ACTIONS];

// Action descriptions for documentation
export const ACTION_DESCRIPTIONS: Record<ActionId, string> = {
    // Navigation
    MPCS_NAV_DASHBOARD: "Navigate to Dashboard",
    MPCS_NAV_PHONES: "Navigate to Phones Management",
    MPCS_NAV_RULES: "Navigate to Rule Map",
    MPCS_NAV_TEMPLATES: "Navigate to Templates",
    MPCS_NAV_GENERATE: "Navigate to Generate Project",
    MPCS_NAV_PROJECTS: "Navigate to Projects",
    MPCS_NAV_SETTINGS: "Navigate to Settings",

    // Dashboard
    MPCS_DASHBOARD_ADD_PHONE: "Quick Action: Add Phone",
    MPCS_DASHBOARD_CREATE_TEMPLATE: "Quick Action: Create Template",
    MPCS_DASHBOARD_GENERATE_PROJECT: "Quick Action: Generate Project",

    // Phones
    MPCS_PHONES_ADD: "Open Add Phone Modal",
    MPCS_PHONES_EDIT: "Open Edit Phone Modal",
    MPCS_PHONES_DELETE: "Open Delete Phone Confirmation",
    MPCS_PHONES_SAVE: "Save Phone Details",

    // Rules
    MPCS_RULES_ADD: "Open Add Rule Modal",
    MPCS_RULES_EDIT: "Open Edit Rule Modal",
    MPCS_RULES_DELETE: "Open Delete Rule Confirmation",
    MPCS_RULES_SAVE: "Save Rule Changes",

    // Templates
    MPCS_TEMPLATE_CREATE: "Open Create Template Modal",
    MPCS_TEMPLATE_DUPLICATE: "Duplicate Selected Template",
    MPCS_TEMPLATE_DELETE: "Delete Selected Template",
    MPCS_TEMPLATE_OPEN_BUILDER: "Navigate to Template Builder",

    // Generate
    MPCS_GENERATE_PREVIEW: "Generate Project Preview",
    MPCS_GENERATE_SAVE: "Save Generated Project",

    // Projects
    MPCS_PROJECTS_OPEN: "Open Project Details",
    MPCS_PROJECTS_DELETE: "Delete Project",
    MPCS_PROJECTS_EXPORT: "Export Project (Phase 2)",
    MPCS_PROJECTS_EDIT: "Edit Project (Phase 2)",

    // Settings
    MPCS_SETTINGS_THEME_TOGGLE: "Toggle Theme (Mock)",
    MPCS_SETTINGS_RULES_ADMIN: "Navigate to Rule Admin",
    MPCS_SETTINGS_DATA_IMPORT: "Import Data (Phase 2)",
    MPCS_SETTINGS_DATA_EXPORT: "Export Data (Phase 2)",
};
