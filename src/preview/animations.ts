export type AnimationType = "none" | "fade" | "slide";

export interface AnimationSettings {
    type: AnimationType;
    durationMs: number;
}

export const DEFAULT_ANIMATION_SETTINGS: AnimationSettings = {
    type: "fade",
    durationMs: 350
};

export default DEFAULT_ANIMATION_SETTINGS;
