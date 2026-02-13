import { Scene } from '../types/models';
import { DEFAULT_SCENE_DURATIONS_MS } from '../preview/player/durations';

export function getEffectiveScene(scene: Scene) {
    // 1. Merge Text
    // Auto placeholders are defaults, overrides take precedence
    const mergedText = {
        ...scene.auto.placeholders,
        ...(scene.override?.text || {})
    };

    // 2. Merge Winner
    // If override is present, use it. Otherwise use auto.
    const effectiveWinner = scene.override?.winnerOverride !== undefined
        ? scene.override.winnerOverride
        : scene.auto.winner;

    // 3. Merge Duration
    const effectiveDurationMs = scene.override?.durationMs ?? DEFAULT_SCENE_DURATIONS_MS[scene.type as keyof typeof DEFAULT_SCENE_DURATIONS_MS] ?? 2000;

    // 4. Merge Media (Helpers)
    // We don't merge image sources effectively here because we need the Phone objects to know the "default"
    // So usually the caller (PreviewContent) calculates the final image source based on this override.
    // But we can expose the overrides directly.

    return {
        ...scene,
        effective: {
            enabled: scene.override?.enabled ?? true,
            durationMs: effectiveDurationMs,
            transition: scene.override?.transition ?? { type: 'none' }, // Default to none if not specified, implies inherit logic elsewhere if needed
            text: mergedText,
            winner: effectiveWinner,
            media: scene.override?.media,
        }
    };
}

/**
 * Helper to check if a scene should be skipped
 */
export function isSceneDisabled(scene: Scene): boolean {
    return scene.override?.enabled === false;
}
