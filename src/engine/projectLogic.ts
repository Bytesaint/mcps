import { Template, Phone, Rule, Scene, SceneType } from '../types/models';
import { compareSpecs } from './compareAdvanced';
import { getEffectiveScene } from '../preview/sceneMerge';

export function generateScenes(
    template: Template,
    phoneA: Phone,
    phoneB: Phone,
    rules: Rule[],
    overrides: Record<string, any> = {} // ID -> SceneOverride
): Scene[] {
    const sections = template.sections;
    const sceneKeys = Object.keys(sections);

    // 1. Initial Pass: Create Scenes with Auto Data
    let scenes: Scene[] = sceneKeys.map((key) => {
        // const type = key as SceneType; // Simplified assumption for now

        // Determine scene type more accurately based on naming conventions if needed
        // For now, key is often 'intro', 'body1', etc. 
        // But in current template checks:
        const isIntro = key === 'intro';
        const isSubintro = key === 'subintro';
        const isScore = key === 'score';
        const isCamera = key.toLowerCase().includes('camera');
        const isBody = !isIntro && !isSubintro && !isScore;

        let actualType: SceneType = 'body';
        if (isIntro) actualType = 'intro';
        else if (isSubintro) actualType = 'subintro';
        else if (isScore) actualType = 'score';
        else if (isCamera) actualType = 'camera';

        // Calculate Auto Data
        let autoData: any = {
            placeholders: {} // Populate from template placeholders if we had them mapped
        };

        if (isBody) {
            const rule = rules.find(r => r.id === key || r.specKey === key);
            // Logic from PreviewContent to find specs
            const specA = phoneA.specs.find(s => s.key === rule?.specKey || s.key === key)?.value || "";
            const specB = phoneB.specs.find(s => s.key === rule?.specKey || s.key === key)?.value || "";

            let winner: "A" | "B" | "TIE" | null = null;
            if (rule) {
                winner = compareSpecs(specA, specB, rule).winner;
            }

            autoData = {
                ...autoData,
                specKey: rule?.specKey || key,
                specLabel: rule?.specKey || key, // Should get nice label
                specA,
                specB,
                winner
            };
        }

        return {
            id: key,
            type: actualType,
            label: key.charAt(0).toUpperCase() + key.slice(1),
            auto: autoData,
            override: overrides[key]
        };
    });

    // 2. Score Calculation Pass
    // We need to calculate scores based on the *effective* winner of each body scene
    let scoreA = 0;
    let scoreB = 0;

    // We used to rely on PreviewContent to calc on fly, now we need to persist it.
    // Let's iterate body scenes
    scenes.forEach(scene => {
        if (scene.type === 'body') {
            const effective = getEffectiveScene(scene).effective;
            if (effective.winner === 'A') scoreA++;
            else if (effective.winner === 'B') scoreB++;
            // TIE gives 0 to both usually, or we can configure
        }
    });

    // 3. Update Score Scene
    scenes = scenes.map(scene => {
        if (scene.type === 'score') {
            const autoWinner = scoreA > scoreB ? 'A' : scoreB > scoreA ? 'B' : 'TIE';
            return {
                ...scene,
                auto: {
                    ...scene.auto,
                    scoreA,
                    scoreB,
                    winner: autoWinner
                }
            };
        }
        return scene;
    });

    return scenes;
}
