import { Appearance, getAppearanceSetting } from "../store/settingsStore";

/**
 * Apply the theme to the document based on the appearance setting.
 */
export function applyTheme(appearance?: Appearance) {
    const theme = appearance || getAppearanceSetting();
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        root.classList.add(systemTheme);
    } else {
        root.classList.add(theme);
    }
}

/**
 * Initialize theme listener for system changes.
 */
export function initThemeListener() {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
        if (getAppearanceSetting() === "system") {
            applyTheme("system");
        }
    };

    if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener("change", listener);
    } else {
        // Fallback for older browsers/TS libs
        (mediaQuery as any).addListener(listener);
    }
}
