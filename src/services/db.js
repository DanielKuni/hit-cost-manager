"use strict";

/**
 * db.js
 * -----
 * שכבת שירות שמחברת בין:
 * - IndexedDB (idb.js)
 * - Rates (currencyService)
 *
 * מספקת:
 * - addCost()
 * - getAllCosts()
 * - getMonthlyReport():
 *   מצב A: getMonthlyReport(year, month) => מחזיר RAW rows (כמו בקוד שלכם)
 *   מצב B: getMonthlyReport(year, month, targetCurrency, ratesUrl) => דוח מלא לפי המסמך
 *
 * זה מאפשר לא לשבור את ReportPage הקיים וגם לעמוד בדרישות המסמך.
 */

import {
    openCostsDB,
    addCost as addCostToDb,
    getAllCosts as getAllCostsFromIdb,
} from "./idb";

import { fetchRates, convert, round2 } from "./currencyService";

const DB_NAME = "costsdb";
const DB_VERSION = 1;

let dbPromise = null;

/**
 * getDb()
 * -------
 * caching ל-Promise כדי לא לפתוח DB בכל קריאה מחדש.
 */
export function getDb() {
    if (!dbPromise) {
        dbPromise = openCostsDB(DB_NAME, DB_VERSION);
    }

    return dbPromise;
}

/**
 * addCost(cost)
 * -------------
 * מוסיף עלות חדשה ל-IndexedDB.
 */
export async function addCost(cost) {
    const db = await getDb();
    return addCostToDb(db, cost);
}

/**
 * getAllCosts()
 * -------------
 * מחזיר את כל העלויות מ-IndexedDB.
 */
export async function getAllCosts() {
    const db = await getDb();
    return getAllCostsFromIdb(db);
}

/**
 * getMonthlyReport(year, month, targetCurrency?, ratesUrl?)
 * ---------------------------------------------------------
 * מצב A (לוגיקה קיימת שלכם):
 * - מחזיר מערך רשומות מסוננות (RAW), ללא המרות.
 *
 * מצב B (דרישת המסמך):
 * - מחזיר אובייקט report:
 *   { year, month, costs: [...], total: { currency, total } }
 * - total מחושב לאחר המרה למטבע יעד.
 */
export async function getMonthlyReport(year, month, targetCurrency, ratesUrl) {
    const all = await getAllCosts();

    const filtered = all.filter((c) => {
        return c?.date?.year === year && c?.date?.month === month;
    });

    // מצב A: ללא מטבע יעד -> מחזירים RAW rows (כדי לא לשבור את ReportPage).
    if (!targetCurrency) {
        return filtered;
    }

    // מצב B: דוח מלא לפי המסמך.
    const rates = await fetchRates(ratesUrl);

    const costs = filtered.map((c) => ({
        sum: c.sum,
        currency: c.currency,
        category: c.category,
        description: c.description,
        // לפי הדוגמה במסמך נדרש שדה Date:{day}
        Date: { day: c?.date?.day },
    }));

    let total = 0;

    filtered.forEach((c) => {
        total += convert(c.sum, c.currency, targetCurrency, rates);
    });

    return {
        year: year,
        month: month,
        costs: costs,
        total: { currency: targetCurrency, total: round2(total) },
    };
}
