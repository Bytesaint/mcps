import { Template, Phone, Rule, Scene } from '../types/models';
import { compareSpecs } from './compareAdvanced';
import { getEffectiveScene } from '../preview/sceneMerge';
import { getEffectivePages } from '../lib/templatePages';

export function generateScenes(
    template: Template,
    phoneA: Phone,
    phoneB: Phone,
    rules: Rule[],
    overrides: Record<string, any> = {} // ID -> SceneOverride
): Scene[] {
    const pages = getEffectivePages(template);

    // Filter rules missing in either phone's specs, or just map them
    const dataRows = rules.map(rule => {
        const specAItem = phoneA.specs.find(s => s.key === rule.specKey);
        const specBItem = phoneB.specs.find(s => s.key === rule.specKey);
        const specA = specAItem?.value || "N/A";
        const specB = specBItem?.value || "N/A";
        // Also find label
        const specLabel = specAItem?.label || specBItem?.label || rule.specKey;
        
        let winner: "A" | "B" | "TIE" | null = null;
        if (specA !== "N/A" && specB !== "N/A") {
            winner = compareSpecs(specA, specB, rule).winner;
        }

        return {
            specKey: rule.specKey,
            specLabel,
            specA,
            specB,
            winner
        };
    }).filter(row => row.specA !== "N/A" || row.specB !== "N/A"); // Basic filtering

    // Determine Mode
    const bodyPages = pages.filter(p => p.baseType === 'body');
    const isDuplicateMode = bodyPages.some(p => p.duplicateIndex > 0);
    
    let generatedScenes: Scene[] = [];
    
    // 1. Initial Pass: Create Scenes from Pages
    for (const page of pages) {
        if (page.baseType !== 'body') {
            // Intro, Camera, Subintro, Score
            generatedScenes.push({
                id: crypto.randomUUID(),
                type: page.baseType,
                label: page.label,
                templatePageId: page.id,
                auto: {
                    placeholders: {
                        '{PHONE_A}': phoneA.name,
                        '{PHONE_B}': phoneB.name
                    }
                },
                timing: page.timing,
                override: overrides[page.id] // Use page.id or existing UUID lookup
            });
            continue;
        }

        // Body pages
        if (isDuplicateMode) {
            // Use explicit templates binding
            let rowIdx: number | undefined;
            if (page.dataBind.mode === 'rowIndex') {
                rowIdx = page.dataBind.rowIndex;
            } else {
                // Auto sequential based on duplicate index
                rowIdx = page.duplicateIndex;
            }

            const row = (rowIdx !== undefined && rowIdx < dataRows.length) ? dataRows[rowIdx] : null;

            generatedScenes.push({
                id: crypto.randomUUID(),
                type: 'body',
                label: page.label,
                templatePageId: page.id,
                timing: page.timing,
                auto: {
                    specKey: row?.specKey || 'unknown',
                    specLabel: row?.specLabel || 'N/A',
                    specA: row?.specA || 'N/A',
                    specB: row?.specB || 'N/A',
                    winner: row?.winner || null,
                    description: row ? '' : 'Row out of range',
                    placeholders: {
                        '{PHONE_A}': phoneA.name,
                        '{PHONE_B}': phoneB.name,
                        '{SPEC_NAME}': row?.specLabel || 'N/A',
                        '{SPEC_A}': row?.specA || 'N/A',
                        '{SPEC_B}': row?.specB || 'N/A',
                        '{WINNER}': row?.winner === 'A' ? phoneA.name : row?.winner === 'B' ? phoneB.name : row?.winner === 'TIE' ? 'Tie' : 'N/A'
                    }
                },
                override: overrides[page.id]
            });
        } else {
            // Auto Loop Fallback Mode
            // Generate one scene per spec row using this single body template page
            for (let i = 0; i < dataRows.length; i++) {
                const row = dataRows[i];
                generatedScenes.push({
                    id: crypto.randomUUID(),
                    type: 'body',
                    label: `${page.label} - ${row.specLabel}`,
                    templatePageId: page.id,
                    timing: page.timing,
                    auto: {
                        specKey: row.specKey,
                        specLabel: row.specLabel,
                        specA: row.specA,
                        specB: row.specB,
                        winner: row.winner,
                        placeholders: {
                            '{PHONE_A}': phoneA.name,
                            '{PHONE_B}': phoneB.name,
                            '{SPEC_NAME}': row.specLabel,
                            '{SPEC_A}': row.specA,
                            '{SPEC_B}': row.specB,
                            '{WINNER}': row.winner === 'A' ? phoneA.name : row.winner === 'B' ? phoneB.name : row.winner === 'TIE' ? 'Tie' : 'N/A'
                        }
                    },
                    override: overrides[page.id] // Note: all cloned scenes share same templateId and potentially override ID mapping
                });
            }
        }
    }

    // 2. Score Calculation Pass
    let scoreA = 0;
    let scoreB = 0;

    generatedScenes.forEach(scene => {
        if (scene.type === 'body') {
            const effective = getEffectiveScene(scene).effective;
            if (effective.winner === 'A') scoreA++;
            else if (effective.winner === 'B') scoreB++;
        }
    });

    // 3. Update Score Scene properties & placeholders
    generatedScenes = generatedScenes.map(scene => {
        if (scene.type === 'score') {
            const autoWinner = scoreA > scoreB ? 'A' : scoreB > scoreA ? 'B' : 'TIE';
            return {
                ...scene,
                auto: {
                    ...scene.auto,
                    scoreA,
                    scoreB,
                    winner: autoWinner,
                    placeholders: {
                        ...scene.auto.placeholders,
                        '{SCORE_A_TOTAL}': String(scoreA),
                        '{SCORE_B_TOTAL}': String(scoreB),
                        '{WINNER}': autoWinner === 'A' ? phoneA.name : autoWinner === 'B' ? phoneB.name : autoWinner === 'TIE' ? 'Tie' : 'N/A'
                    }
                }
            };
        }
        return scene;
    });

    return generatedScenes;
}
