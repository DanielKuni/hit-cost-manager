"use strict";


const DEFAULT_RATES_URL = "https://gist.githubusercontent.com/Dannyf275/5da6e345103f6fcfb16cd4658cb72be4/raw/37622f9867ec3ea29ad2ba05944b1c76573f7a95/rates.json";

/**
 * שערי ברירת מחדל קבועים (Fallback)
 * יופעלו אוטומטית אם fetch נכשל או אם הנתונים לא תקינים.
 */
const FALLBACK_RATES = {
    USD: 1,
    ILS: 3.4,
    GBP: 0.6,
    EURO: 0.7,
};

/**
 * ✅ Export: רשימת מטבעות לשימוש בכל העמודים (כמו Add / Report / Charts / Settings)
 * חשוב שזה יהיה בדיוק אותו סט שמערכת ההמרה תומכת בו.
 */
export const CURRENCIES = ["USD", "ILS", "GBP", "EURO"];

/**
 * ✅ Export: מידע תצוגתי למטבעות (כולל סמל בינלאומי)
 * זה עוזר לדרישה של "לצד סוגי המטבעות נדרש הסמל הבינלאומי".
 */
export const CURRENCY_INFO = {
    USD: { code: "USD", symbol: "$", label: "US Dollar" },
    ILS: { code: "ILS", symbol: "₪", label: "Israeli Shekel" },
    GBP: { code: "GBP", symbol: "£", label: "British Pound" },
    EURO: { code: "EURO", symbol: "€", label: "Euro" },
};

/**
 * בדיקת תקינות אובייקט שערים:
 * - חייב להיות Object
 * - לכל מטבע נתמך חייב להיות מספר חיובי
 */
function validateRates(rates) {
    if (!rates || typeof rates !== "object") {
        throw new Error("Invalid rates object");
    }

    CURRENCIES.forEach((currency) => {
        const value = rates[currency];
        if (typeof value !== "number" || Number.isNaN(value) || value <= 0) {
            throw new Error("Missing or invalid rate for " + currency);
        }
    });
}

/**
 * עיגול ל-2 ספרות אחרי הנקודה
 */
export function round2(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * משיכת שערים מהשרת.
 * אם נכשל מכל סיבה (404/רשת/JSON לא תקין/חסר שער) => מחזיר FALLBACK_RATES.
 *
 * optionalUrl:
 * - אם הגיע URL לא ריק => נשתמש בו
 * - אחרת => DEFAULT_RATES_URL
 */
export async function fetchRates(optionalUrl) {
    const url =
        optionalUrl && optionalUrl.trim() !== ""
            ? optionalUrl.trim()
            : DEFAULT_RATES_URL;

    try {
        const response = await fetch(url);

        // אם השרת לא מחזיר OK (למשל 404/500)
        if (!response.ok) {
            throw new Error("Failed to fetch exchange rates");
        }

        // ניסיון לפרסר JSON
        const rates = await response.json();

        // וולידציה לשערים שהגיעו
        validateRates(rates);

        return rates;
    } catch (err) {
        // כל כשל => fallback קבוע
        console.warn(
            "Using fallback exchange rates. Reason:",
            err && err.message ? err.message : err
        );

        // וולידציה פנימית ל-fallback (הגנה)
        validateRates(FALLBACK_RATES);

        // מחזירים עותק כדי שלא ישנו בטעות את האובייקט
        return { ...FALLBACK_RATES };
    }
}

/**
 * המרת סכום בין מטבעות
 *
 * amount: מספר
 * fromCurrency / toCurrency: אחד מהמטבעות ב-CURRENCIES
 * rates: אובייקט השערים (מ-fetchRates או fallback)
 */
export function convert(amount, fromCurrency, toCurrency, rates) {
    // אותו מטבע => לא ממירים
    if (fromCurrency === toCurrency) {
        return amount;
    }

    // בדיקת מטבעות נתמכים
    if (!CURRENCIES.includes(fromCurrency)) {
        throw new Error("Unsupported currency: " + fromCurrency);
    }
    if (!CURRENCIES.includes(toCurrency)) {
        throw new Error("Unsupported currency: " + toCurrency);
    }

    // בדיקת תקינות שערים
    validateRates(rates);

    // המרה דרך USD:
    // amountInUsd = amount / rate(from)
    // converted   = amountInUsd * rate(to)
    const amountInUsd = amount / rates[fromCurrency];
    const converted = amountInUsd * rates[toCurrency];

    return converted;
}
