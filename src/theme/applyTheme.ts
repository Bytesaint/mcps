export type Appearance = "light" | "dark" | "system";

/**
 * Apply the requested appearance to the document root.
 */
export function applyAppearance(mode: Appearance) {
    const root = document.documentElement;
    root.classList.remove("dark");

    if (mode === "dark") {
        root.classList.add("dark");
    } else if (mode === "system") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (prefersDark) {
            root.classList.add("dark");
        }
    }
}
