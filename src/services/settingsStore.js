"use strict";

const KEY = "cm_settings_v1";

export const DEFAULT_SETTINGS = {
    baseCurrency: "USD",
    ratesUrl: "/rates.json",
};

export function loadSettings() {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return { ...DEFAULT_SETTINGS };
        const parsed = JSON.parse(raw);

        return {
            ...DEFAULT_SETTINGS,
            ...parsed,
        };
    } catch {
        return { ...DEFAULT_SETTINGS };
    }
}

export function saveSettings(nextSettings) {
    localStorage.setItem(KEY, JSON.stringify(nextSettings));
}
