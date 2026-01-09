const DEFAULT_RATES_URL = `${import.meta.env.BASE_URL}rates.json`;

const SUPPORTED_CURRENCIES = ["USD", "ILS", "GBP", "EURO"];

function validateRates(rates) {
    if (!rates || typeof rates !== "object") {
        throw new Error("Invalid rates object");
    }

    SUPPORTED_CURRENCIES.forEach((currency) => {
        if (
            typeof rates[currency] !== "number" ||
            Number.isNaN(rates[currency]) ||
            rates[currency] <= 0
        ) {
            throw new Error("Missing or invalid rate for " + currency);
        }
    });
}

export function round2(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

export async function fetchRates(optionalUrl) {
    const url =
        optionalUrl && optionalUrl.trim() !== ""
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

export function convert(amount, fromCurrency, toCurrency, rates) {
    if (fromCurrency === toCurrency) {
        return amount;
    }

    validateRates(rates);

    if (!SUPPORTED_CURRENCIES.includes(fromCurrency)) {
        throw new Error("Unsupported currency: " + fromCurrency);
    }

    if (!SUPPORTED_CURRENCIES.includes(toCurrency)) {
        throw new Error("Unsupported currency: " + toCurrency);
    }

    const amountInUsd = amount / rates[fromCurrency];
    const converted = amountInUsd * rates[toCurrency];

    return converted;
}
