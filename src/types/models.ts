import type { AspectRatio } from './aspectRatio';

export interface PhoneSpec {
    id: string;
    key: string;
    label: string;
    value: string;
}

export interface Phone {
    id: string;
    name: string;
    brand?: string;
    specs: PhoneSpec[];
    image?: { name: string; dataUrl: string }; // store as base64 data URL
}

export interface Rule {
    id: string;
    specKey: string;
    ruleType: 'higher_wins' | 'lower_wins' | 'manual' | 'alphanumeric' | 'ranking';
    options?: {
        // for alphanumeric rules:
        alphaMode?: 'high_number_wins' | 'low_number_wins'; // default high_number_wins
        // for ranking rules:
        rankingList?: string[]; // ordered from lowest -> highest
        rankingDirection?: 'ascending' | 'descending'; // default ascending
    };
    notes?: string;
    updatedAt: string; // ISO string
}

export interface TemplateSections {
    intro: string;
    subintro: string;
    body: string;
    camera: string;
    score: string;
}

export interface Template {
    id: string;
    name: string;
    aspectRatio?: AspectRatio;
    placeholders: string[];
    sections: TemplateSections;
    updatedAt: string; // ISO string
}

export interface Project {
    id: string;
    name: string;
    templateId: string;
    phoneAId: string;
    phoneBId: string;
    aspectRatioOverride?: AspectRatio;
    createdAt: string; // ISO string
    updatedAt: string; // ISO string
}
