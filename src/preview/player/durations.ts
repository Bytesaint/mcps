export const DEFAULT_SCENE_DURATIONS_MS = {
    intro: 2500,
    subintro: 2000,
    body: 1500,
    camera: 2000,
    score: 3000
} as const;

export type SceneType = keyof typeof DEFAULT_SCENE_DURATIONS_MS;
