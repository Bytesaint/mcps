export type AspectRatioPreset = "16:9" | "9:16" | "1:1" | "4:5" | "3:4" | "custom";

export interface AspectRatio {
    preset: AspectRatioPreset;
    customW?: number;
    customH?: number;
}

/**
 * Get the numeric ratio value (width/height)
 */
export function getRatioValue(ar: AspectRatio): number {
    switch (ar.preset) {
        case "16:9":
            return 16 / 9;
        case "9:16":
            return 9 / 16;
        case "1:1":
            return 1;
        case "4:5":
            return 4 / 5;
        case "3:4":
            return 3 / 4;
        case "custom":
            if (ar.customW && ar.customH && ar.customH > 0) {
                return ar.customW / ar.customH;
            }
            // Fallback to 16:9 if custom values are invalid
            return 16 / 9;
        default:
            return 16 / 9;
    }
}

/**
 * Format aspect ratio for display
 */
export function formatAspectRatio(ar: AspectRatio): string {
    if (ar.preset === "custom" && ar.customW && ar.customH) {
        const ratio = (ar.customW / ar.customH).toFixed(2);
        return `Custom (${ratio}:1)`;
    }
    return ar.preset;
}

/**
 * Get default aspect ratio (16:9)
 */
export function getDefaultAspectRatio(): AspectRatio {
    return {
        preset: "16:9"
    };
}

/**
 * Validate custom aspect ratio values
 */
export function isValidCustomRatio(w?: number, h?: number): boolean {
    return (
        w !== undefined &&
        h !== undefined &&
        w > 0 &&
        h > 0 &&
        Number.isFinite(w) &&
        Number.isFinite(h)
    );
}
