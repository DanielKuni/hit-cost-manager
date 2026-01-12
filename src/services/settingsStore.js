"use strict";

/**
 * settingsStore.js
 * ----------------
 * אחריות:
 * - Persist של הגדרות באפליקציה (localStorage).
 * - דרישה: גם ללא URL שהמשתמש הגדיר, המערכת חייבת לעבוד.
 */

const STORAGE_KEY = "cm_settings_v1";

/**
 * ברירות מחדל:
 * - baseCurrency ברירת מחדל USD.
 * - ratesUrl מצביע ל-/rates.json כדי לעמוד בדרישה "גם בלי הגדרה ידנית".
 */
export const DEFAULT_SETTINGS = Object.freeze({
    baseCurrency: "USD",
    ratesUrl: "/rates.json",
});

/**
 * loadSettings()
 * --------------
 * קורא הגדרות מ-localStorage ומחזיר אובייקט מלא (עם fallback לברירות מחדל).
 */
export function loadSettings() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            return { ...DEFAULT_SETTINGS };
        }

        const parsed = JSON.parse(raw);

        return {
            ...DEFAULT_SETTINGS,
            ...parsed,
        };
    } catch (err) {
        // אם יש בעיה בפרסור/נתונים לא תקינים - חוזרים לברירת מחדל כדי לא להפיל את האפליקציה.
        return { ...DEFAULT_SETTINGS };
    }
}

/**
 * saveSettings(nextSettings)
 * --------------------------
 * שומר אובייקט הגדרות ל-localStorage.
 */
export function saveSettings(nextSettings) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSettings));
}
