"use strict";

const KEY = "rates_url";

export function getRatesUrl() {
    return localStorage.getItem(KEY) || "";
}

export function setRatesUrl(url) {
    localStorage.setItem(KEY, url || "");
}
