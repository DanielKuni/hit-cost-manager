"use strict";

/**
 * currencyService.js
 * ------------------
 * אחריות הקובץ:
 * 1) להגדיר את רשימת המטבעות הנתמכים + הסמל הבינלאומי שלהם (UI friendly).
 * 2) להביא שערי מטבע משרת (Fetch API) לפי דרישת הפרויקט.
 * 3) לבצע המרה בין מטבעות בהתאם למבנה השערים שנדרש במסמך:
 *
 *    rates = {"USD":1, "GBP":0.6, "EURO":0.7, "ILS":3.4}
 *
 * פירוש:
 * - הערך מייצג "כמה יחידות מטבע = 1 USD"
 *   כלומר:
 *   ILS 3.4  = USD 1
 *   EURO 0.7 = USD 1
 *   GBP 0.6  = USD 1
 *
 * ולכן המרה:
 * - amountInUsd = amount / rates[fromCurrency]
 * - converted   = amountInUsd * rates[toCurrency]
 */

/**
 * מטבעות נתמכים + סימולים בינלאומיים (נדרש בתיקון #1).
 * חשוב: המפתחות חייבים להיות בדיוק USD/ILS/GBP/EURO.
 */
export const CURRENCY_INFO = Object.freeze({
    USD: { code: "USD", symbol: "$", label: "USD ($)" },
    ILS: { code: "ILS", symbol: "₪", label: "ILS (₪)" },
    GBP: { code: "GBP", symbol: "£", label: "GBP (£)" },
    EURO: { code: "EURO", symbol: "€", label: "EURO (€)" },
});

/**
 * מערך מטבעות – לשימוש ב-selectים.
 */
export const CURRENCIES = Object.freeze(["USD", "ILS", "GBP", "EURO"]);

/**
 * URL ברירת מחדל לשערים.
 * דרישה: האפליקציה חייבת לעבוד גם אם המשתמש לא הגדיר URL.
 *
 * הערה:
 * - מומלץ להגיש rates.json כתיקייה public (לדוגמה /rates.json).
 */
export const DEFAULT_RATES_URL = "/rates.json";

/**
 * round2
 * ------
 * עיגול ל-2 ספרות אחרי הנקודה (לנוחות תצוגה).
 */
export function round2(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * isSupportedCurrency
 * -------------------
 * בודק אם מטבע נמצא ברשימת המטבעות הנתמכים.
 */
export function isSupportedCurrency(currency) {
    return CURRENCIES.includes(currency);
}

/**
 * validateRates
 * -------------
 * ולידציה למבנה שערי המטבע.
 * חשוב כדי למנוע חלוקות באפס/undefined והמרות שגויות.
 */
function validateRates(rates) {
    if (!rates || typeof rates !== "object") {
        throw new Error("Invalid rates object");
    }

    CURRENCIES.forEach((currency) => {
        const value = rates[currency];

        if (typeof value !== "number" || Number.isNaN(value) || value <= 0) {
            throw new Error(`Missing/invalid rate for ${currency}`);
        }
    });
}

/**
 * fetchRates(optionalUrl)
 * -----------------------
 * מביא שערי מטבע מ-URL.
 * אם optionalUrl לא מוגדר/ריק -> משתמש ב-DEFAULT_RATES_URL.
 *
 * מחזיר: אובייקט rates תקין.
 */
export async function fetchRates(optionalUrl) {
    const url = optionalUrl && optionalUrl.trim() !== ""
        ? optionalUrl.trim()
        : DEFAULT_RATES_URL;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Failed to fetch exchange rates");
    }

    const rates = await response.json();
    validateRates(rates);

    return rates;
}

/**
 * convert(amount, fromCurrency, toCurrency, rates)
 * ------------------------------------------------
 * מבצע המרה לפי ההגדרה במסמך (USD בסיס).
 */
export function convert(amount, fromCurrency, toCurrency, rates) {
    if (fromCurrency === toCurrency) {
        return amount;
    }

    validateRates(rates);

    if (!isSupportedCurrency(fromCurrency)) {
        throw new Error(`Unsupported currency: ${fromCurrency}`);
    }

    if (!isSupportedCurrency(toCurrency)) {
        throw new Error(`Unsupported currency: ${toCurrency}`);
    }

    const amountInUsd = amount / rates[fromCurrency];
    const converted = amountInUsd * rates[toCurrency];

    return converted;
}
