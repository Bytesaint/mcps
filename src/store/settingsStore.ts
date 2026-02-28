import type { AspectRatio } from "../types/aspectRatio";
import { getDefaultAspectRatio } from "../types/aspectRatio";

const STORAGE_KEY = "mpcs_settings_aspectRatio";
const THEME_KEY = "mpcs_settings_appearance";

export type Appearance = "light" | "dark" | "system";

/**
 * Get the default aspect ratio from localStorage
 */
export function getDefaultAspectRatioSetting(): AspectRatio {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored) as AspectRatio;
            return parsed;
        }
    } catch (error) {
        console.error("Failed to load aspect ratio from localStorage:", error);
    }
    return getDefaultAspectRatio();
}

/**
 * Save the default aspect ratio to localStorage
 */
export function saveDefaultAspectRatio(ar: AspectRatio): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ar));
    } catch (error) {
        console.error("Failed to save aspect ratio to localStorage:", error);
    }
}

/**
 * Get appearance setting
 */
export function getAppearanceSetting(): Appearance {
    return (localStorage.getItem(THEME_KEY) as Appearance) || "light";
}

/**
 * Save appearance setting
 */
export function saveAppearanceSetting(appearance: Appearance): void {
    localStorage.setItem(THEME_KEY, appearance);
}

// ─── Phase 3 Feature Flag ─────────────────────────────────────────────────────

const PHASE3_KEY = 'mpcs_phase3_enabled';
const RENDER_SERVER_URL_KEY = 'mpcs_render_server_url';

export function getPhase3Enabled(): boolean {
    return localStorage.getItem(PHASE3_KEY) === 'true';
}

export function savePhase3Enabled(enabled: boolean): void {
    localStorage.setItem(PHASE3_KEY, String(enabled));
}

export function getRenderServerUrl(): string {
    return localStorage.getItem(RENDER_SERVER_URL_KEY) || 'http://localhost:3001';
}

export function saveRenderServerUrl(url: string): void {
    localStorage.setItem(RENDER_SERVER_URL_KEY, url);
}
