import { openCostsDB, addCost as addCostToDb, getAllCosts } from "./idb";
import { fetchRates, convert, round2 } from "./currencyService";

const DB_NAME = "costsdb";
const DB_VERSION = 1;

let dbPromise = null;

export function getDb() {
    if (!dbPromise) {
        dbPromise = openCostsDB(DB_NAME, DB_VERSION);
    }
    return dbPromise;
}

export async function addCost(cost) {
    const db = await getDb();
    return addCostToDb(db, cost);
}

export async function fetchAllCosts() {
    const db = await getDb();
    return getAllCosts(db);
}

export async function getMonthlyReport(year, month, targetCurrency, ratesUrl) {
    const all = await fetchAllCosts();
    const rates = await fetchRates(ratesUrl);

    const filtered = all.filter(
        (c) => c?.date?.year === year && c?.date?.month === month
    );

    const costs = filtered.map((c) => ({
        sum: c.sum,
        currency: c.currency,
        category: c.category,
        description: c.description,
        Date: { day: c.date.day }
    }));

    let total = 0;
    filtered.forEach((c) => {
        total += convert(c.sum, c.currency, targetCurrency, rates);
    });

    return {
        year,
        month,
        costs,
        total: { currency: targetCurrency, total: round2(total) }
    };
}
