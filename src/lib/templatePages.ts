import type { Template, TemplatePage, SceneLayout } from '../types/models';

export function makeDefaultLayout(): SceneLayout {
    return { elements: [], backgroundColor: '#000000' };
}

export function createDefaultPages(): TemplatePage[] {
    const baseTypes: Array<'intro' | 'subintro' | 'body' | 'camera' | 'score'> = ['intro', 'subintro', 'body', 'camera', 'score'];
    return baseTypes.map((type) => ({
        id: crypto.randomUUID(),
        baseType: type,
        label: type.charAt(0).toUpperCase() + type.slice(1),
        duplicateGroupId: crypto.randomUUID(),
        duplicateIndex: 0,
        dataBind: {
            mode: type === 'body' ? 'rowIndex' : 'none',
            rowIndex: type === 'body' ? 0 : undefined,
        },
        layout: makeDefaultLayout(),
        timing: { durationMs: 3000, transition: { type: 'none', durationMs: 0 } },
    }));
}

export function getEffectivePages(template: Template): TemplatePage[] {
    if (template.pages && template.pages.length > 0) {
        return template.pages;
    }

    // Legacy migration
    const pages: TemplatePage[] = [];
    const sections = template.sections;
    if (!sections) return createDefaultPages();

    const keys = ['intro', 'subintro', 'body', 'camera', 'score'] as const;
    keys.forEach(key => {
        pages.push({
            id: crypto.randomUUID(),
            baseType: key,
            label: key.charAt(0).toUpperCase() + key.slice(1),
            duplicateGroupId: crypto.randomUUID(),
            duplicateIndex: 0,
            dataBind: { mode: 'none' }, // legacy didn't have row index concepts explicit
            layout: makeDefaultLayout(), // legacy didn't have layouts
            timing: { durationMs: 3000, transition: { type: 'none', durationMs: 0 } }
        });
    });

    return pages;
}

export function duplicatePage(page: TemplatePage, existingPages: TemplatePage[]): TemplatePage {
    const groupPages = existingPages.filter(p => p.duplicateGroupId === page.duplicateGroupId);
    const maxIndex = groupPages.reduce((max, p) => Math.max(max, p.duplicateIndex), -1);
    const nextIndex = maxIndex + 1;

    let rowIndex = page.dataBind.rowIndex;
    if (page.baseType === 'body' && page.dataBind.mode === 'rowIndex') {
        const indexMap = groupPages.map(p => p.dataBind.rowIndex).filter(i => i !== undefined) as number[];
        const maxRowIndex = indexMap.length > 0 ? Math.max(...indexMap) : -1;
        rowIndex = maxRowIndex + 1;
    }

    return {
        ...page,
        id: crypto.randomUUID(),
        label: `${page.label.replace(/\s\(\d+\)$/, '')} (${nextIndex + 1})`,
        duplicateIndex: nextIndex,
        dataBind: {
            mode: page.dataBind.mode,
            rowIndex: rowIndex,
        },
        layout: JSON.parse(JSON.stringify(page.layout)), // clone layout
        timing: { ...page.timing, transition: { ...page.timing.transition } }, // clone timing
    };
}
