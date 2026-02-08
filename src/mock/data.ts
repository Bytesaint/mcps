export interface Spec {
    key: string;
    label: string;
    value: string;
}

export interface Phone {
    id: string;
    name: string;
    brand: string;
    specs: Spec[];
}

export interface Rule {
    id: string;
    specKey: string;
    type: 'HIGHER_WINS' | 'LOWER_WINS' | 'MANUAL';
    lastUpdated: string;
}

export interface Template {
    id: string;
    name: string;
    sections: string[];
}

export interface Project {
    id: string;
    name: string;
    templateId: string;
    phoneAId: string;
    phoneBId: string;
    dateCreated: string;
}

export const INITIAL_PHONES: Phone[] = [
    {
        id: "p1",
        name: "iPhone 15 Pro",
        brand: "Apple",
        specs: [
            { key: "screen_size", label: "Screen Size", value: "6.1 inches" },
            { key: "battery", label: "Battery", value: "3274 mAh" },
            { key: "storage", label: "Storage", value: "128GB" }
        ]
    },
    {
        id: "p2",
        name: "Samsung Galaxy S24",
        brand: "Samsung",
        specs: [
            { key: "screen_size", label: "Screen Size", value: "6.2 inches" },
            { key: "battery", label: "Battery", value: "4000 mAh" },
            { key: "storage", label: "Storage", value: "256GB" }
        ]
    },
    {
        id: "p3",
        name: "Google Pixel 8",
        brand: "Google",
        specs: [
            { key: "screen_size", label: "Screen Size", value: "6.2 inches" },
            { key: "battery", label: "Battery", value: "4575 mAh" },
            { key: "storage", label: "Storage", value: "128GB" }
        ]
    }
];

export const INITIAL_RULES: Rule[] = [
    { id: "r1", specKey: "screen_size", type: "HIGHER_WINS", lastUpdated: "2024-02-01" },
    { id: "r2", specKey: "battery", type: "HIGHER_WINS", lastUpdated: "2024-02-01" },
    { id: "r3", specKey: "storage", type: "HIGHER_WINS", lastUpdated: "2024-01-15" }
];

export const INITIAL_TEMPLATES: Template[] = [
    { id: "t1", name: "Standard Comparison v1", sections: ["Intro", "Specs", "Camera", "Battery", "Verdict"] },
    { id: "t2", name: "Short Form (Reels)", sections: ["Hook", "Fast Specs", "Winner"] }
];

export const INITIAL_PROJECTS: Project[] = [
    { id: "prj1", name: "iPhone vs Galaxy", templateId: "t1", phoneAId: "p1", phoneBId: "p2", dateCreated: "2024-02-07" }
];
