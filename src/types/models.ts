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
}

export interface Rule {
    id: string;
    specKey: string;
    ruleType: 'higher_wins' | 'lower_wins' | 'manual';
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
