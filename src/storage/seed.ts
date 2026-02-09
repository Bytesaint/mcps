import type { Phone, Rule, Template, Project } from '../types/models';
import { loadPhones, savePhones, loadRules, saveRules, loadTemplates, saveTemplates, loadProjects, saveProjects } from './repo';

function generateId(): string {
    return Math.random().toString(36).substring(2, 11);
}

function getISODate(): string {
    return new Date().toISOString();
}

export function ensureSeedData(): void {
    // Only seed if storage is empty
    const hasPhones = loadPhones().length > 0;
    const hasRules = loadRules().length > 0;
    const hasTemplates = loadTemplates().length > 0;

    if (hasPhones && hasRules && hasTemplates) {
        return; // Already seeded
    }

    console.log('Seeding initial data...');

    // Seed Phones
    if (!hasPhones) {
        const samplePhones: Phone[] = [
            {
                id: generateId(),
                name: 'iPhone 15 Pro Max',
                brand: 'Apple',
                specs: [
                    { id: generateId(), key: 'screen_size', label: 'Screen Size', value: '6.7 inches' },
                    { id: generateId(), key: 'resolution', label: 'Resolution', value: '2796 x 1290' },
                    { id: generateId(), key: 'processor', label: 'Processor', value: 'A17 Pro' },
                    { id: generateId(), key: 'ram', label: 'RAM', value: '8 GB' },
                    { id: generateId(), key: 'storage', label: 'Storage', value: '256 GB' },
                    { id: generateId(), key: 'battery', label: 'Battery', value: '4422 mAh' },
                    { id: generateId(), key: 'rear_camera', label: 'Rear Camera', value: '48 MP + 12 MP + 12 MP' },
                    { id: generateId(), key: 'front_camera', label: 'Front Camera', value: '12 MP' },
                    { id: generateId(), key: 'os', label: 'OS', value: 'iOS 17' },
                    { id: generateId(), key: 'weight', label: 'Weight', value: '221 g' },
                    { id: generateId(), key: 'price', label: 'Price', value: '$1199' },
                ],
            },
            {
                id: generateId(),
                name: 'Samsung Galaxy S24 Ultra',
                brand: 'Samsung',
                specs: [
                    { id: generateId(), key: 'screen_size', label: 'Screen Size', value: '6.8 inches' },
                    { id: generateId(), key: 'resolution', label: 'Resolution', value: '3120 x 1440' },
                    { id: generateId(), key: 'processor', label: 'Processor', value: 'Snapdragon 8 Gen 3' },
                    { id: generateId(), key: 'ram', label: 'RAM', value: '12 GB' },
                    { id: generateId(), key: 'storage', label: 'Storage', value: '256 GB' },
                    { id: generateId(), key: 'battery', label: 'Battery', value: '5000 mAh' },
                    { id: generateId(), key: 'rear_camera', label: 'Rear Camera', value: '200 MP + 50 MP + 12 MP + 10 MP' },
                    { id: generateId(), key: 'front_camera', label: 'Front Camera', value: '12 MP' },
                    { id: generateId(), key: 'os', label: 'OS', value: 'Android 14' },
                    { id: generateId(), key: 'weight', label: 'Weight', value: '232 g' },
                    { id: generateId(), key: 'price', label: 'Price', value: '$1299' },
                ],
            },
        ];
        savePhones(samplePhones);
    }

    // Seed Rules
    if (!hasRules) {
        const sampleRules: Rule[] = [
            { id: generateId(), specKey: 'screen_size', ruleType: 'higher_wins', updatedAt: getISODate() },
            { id: generateId(), specKey: 'resolution', ruleType: 'higher_wins', updatedAt: getISODate() },
            { id: generateId(), specKey: 'ram', ruleType: 'higher_wins', updatedAt: getISODate() },
            { id: generateId(), specKey: 'storage', ruleType: 'higher_wins', updatedAt: getISODate() },
            { id: generateId(), specKey: 'battery', ruleType: 'higher_wins', updatedAt: getISODate() },
            { id: generateId(), specKey: 'rear_camera', ruleType: 'manual', notes: 'Compare megapixels and features', updatedAt: getISODate() },
            { id: generateId(), specKey: 'weight', ruleType: 'lower_wins', updatedAt: getISODate() },
            { id: generateId(), specKey: 'price', ruleType: 'lower_wins', updatedAt: getISODate() },
        ];
        saveRules(sampleRules);
    }

    // Seed Templates
    if (!hasTemplates) {
        const sampleTemplates: Template[] = [
            {
                id: generateId(),
                name: 'Standard Comparison Template',
                placeholders: ['{PHONE_A}', '{PHONE_B}', '{WINNER}', '{SPEC}'],
                sections: {
                    intro: 'Welcome to the ultimate showdown between {PHONE_A} and {PHONE_B}! Today we\'re comparing these flagship devices to help you decide which one is worth your money.',
                    subintro: 'Both phones are packed with cutting-edge features, but which one comes out on top? Let\'s dive into the specs.',
                    body: 'Looking at the core specifications, {PHONE_A} offers {SPEC}, while {PHONE_B} counters with {SPEC}. The difference is clear when it comes to performance.',
                    camera: 'The camera battle is fierce! {PHONE_A} features a {SPEC} setup, while {PHONE_B} brings {SPEC} to the table. For photography enthusiasts, this could be the deciding factor.',
                    score: 'After comparing all the specs, {WINNER} takes the crown! It excels in key areas like {SPEC} and {SPEC}, making it the better choice for most users.',
                },
                updatedAt: getISODate(),
            },
        ];
        saveTemplates(sampleTemplates);
    }

    // Optionally seed one project
    const phones = loadPhones();
    const templates = loadTemplates();
    if (phones.length >= 2 && templates.length > 0 && loadProjects().length === 0) {
        const sampleProjects: Project[] = [
            {
                id: generateId(),
                name: `${phones[0].name} vs ${phones[1].name}`,
                templateId: templates[0].id,
                phoneAId: phones[0].id,
                phoneBId: phones[1].id,
                createdAt: getISODate(),
                updatedAt: getISODate(),
            },
        ];
        saveProjects(sampleProjects);
    }

    console.log('Seed data created successfully');
}
