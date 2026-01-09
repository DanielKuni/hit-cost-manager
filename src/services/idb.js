"use strict";

const STORE_NAME = "costs";

function isSupportedCurrency(cur) {
    return cur === "USD" || cur === "GBP" || cur === "EURO" || cur === "ILS";
}

function assertValidCost(cost) {
    if (!cost || typeof cost !== "object") throw new Error("Invalid cost object");
    if (typeof cost.sum !== "number" || Number.isNaN(cost.sum)) throw new Error("Invalid sum");
    if (typeof cost.currency !== "string" || !isSupportedCurrency(cost.currency)) throw new Error("Invalid currency");
    if (typeof cost.category !== "string" || cost.category.trim() === "") throw new Error("Invalid category");
    if (typeof cost.description !== "string") throw new Error("Invalid description");
}

export function openCostsDB(databaseName, databaseVersion) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(databaseName, databaseVersion);

        request.onerror = (e) => reject(e.target.error);

        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
            }
        };

        request.onsuccess = (e) => resolve(e.target.result);
    });
}

export function addCost(db, cost) {
    return new Promise((resolve, reject) => {
        try {
            assertValidCost(cost);
        } catch (err) {
            reject(err);
            return;
        }

        const now = new Date();
        const stored = {
            sum: cost.sum,
            currency: cost.currency,
            category: cost.category,
            description: cost.description,
            date: {
                year: now.getFullYear(),
                month: now.getMonth() + 1,
                day: now.getDate()
            }
        };

        const tx = db.transaction([STORE_NAME], "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.add(stored);

        req.onsuccess = () => resolve({ sum: stored.sum, currency: stored.currency, category: stored.category, description: stored.description });
        req.onerror = (e) => reject(e.target.error);
    });
}

export function getAllCosts(db) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_NAME], "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = (e) => resolve(e.target.result || []);
        req.onerror = (e) => reject(e.target.error);
    });
}
