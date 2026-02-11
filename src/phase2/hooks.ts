/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Phase 2B Placeholder hooks
 * These are stubbed for now but will be implemented in the next phase.
 */

export const applyAnimation = (scene: any, _params: any) => {
    // Phase 2B: No-op for now
    return scene;
};

export const playScoreAudio = (type: string, volume: number) => {
    // Phase 2B: No-op for now
    console.log(`[Audio Placeholder] Play ${type} at ${volume}`);
};

export const exportProjectJSON = (_projectId: string) => {
    throw new Error("JSON Export is available after Phase 2 balance");
};

export const importProjectJSON = (_file: File) => {
    throw new Error("JSON Import is available after Phase 2 balance");
};
