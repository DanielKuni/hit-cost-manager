"use strict";

import { useEffect, useMemo, useState } from "react";
import {
    Typography,
    Stack,
    TextField,
    MenuItem,
    Button,
    Alert,
    Divider,
    Box,
    Paper,
} from "@mui/material";

import { fetchRates, round2, convert } from "../services/currencyService";
import { loadSettings } from "../services/settingsStore";
import db from "../services/db";

const CURRENCIES = ["USD", "ILS", "GBP", "EURO"];

function toYearMonth(dateStr) {
    const d = new Date(dateStr);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export default function ChartsPage() {
    const settings = loadSettings();

    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [currency, setCurrency] = useState(settings.baseCurrency || "USD");

    const [rates, setRates] = useState(null);
    const [costs, setCosts] = useState([]);
    const [error, setError] = useState("");

    async function loadData() {
        try {
            setError("");

            const [allCosts, r] = await Promise.all([
                db.getAllCosts(),
                fetchRates(settings.ratesUrl),
            ]);

            setCosts(Array.isArray(allCosts) ? allCosts : []);
            setRates(r);
        } catch (e) {
            setError(e?.message || "Failed to load data");
            setRates(null);
            setCosts([]);
        }
    }

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filtered = useMemo(() => {
        return costs.filter((c) => {
            if (!c?.date) return false;
            const ym = toYearMonth(c.date);
            return ym.year === Number(year) && ym.month === Number(month);
        });
    }, [costs, year, month]);

    const byCategory = useMemo(() => {
        const map = new Map();

        for (const c of filtered) {
            const cat = c.category || "Uncategorized";
            const amount = Number(c.sum ?? c.amount ?? 0);
            const fromCur = c.currency || "USD";

            let converted = amount;

            if (rates) {
                try {
                    converted = convert(amount, fromCur, currency, rates);
                } catch {
                    converted = amount; // אם לא מצליח להמיר, נשאיר כמו שהוא
                }
            }

            map.set(cat, (map.get(cat) || 0) + converted);
        }

        const arr = Array.from(map.entries()).map(([cat, total]) => ({
            category: cat,
            total: round2(total),
        }));

        arr.sort((a, b) => b.total - a.total);
        return arr;
    }, [filtered, rates, currency]);

    const maxVal = useMemo(() => {
        return byCategory.reduce((m, x) => Math.max(m, x.total), 0);
    }, [byCategory]);

    const total = useMemo(() => {
        return round2(byCategory.reduce((s, x) => s + x.total, 0));
    }, [byCategory]);

    return (
        <Stack spacing={2}>
            <Typography variant="h4" fontWeight={800}>
                Charts
            </Typography>

            <Typography sx={{ opacity: 0.8 }}>
                Category breakdown for a selected month.
            </Typography>

            <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

            {error && <Alert severity="error">{error}</Alert>}

            <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems="stretch"
            >
                <TextField
                    fullWidth
                    label="Year"
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                />
                <TextField
                    fullWidth
                    label="Month (1-12)"
                    type="number"
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    inputProps={{ min: 1, max: 12 }}
                />
                <TextField
                    select
                    fullWidth
                    label="Currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                >
                    {CURRENCIES.map((c) => (
                        <MenuItem key={c} value={c}>
                            {c}
                        </MenuItem>
                    ))}
                </TextField>

                <Button variant="contained" onClick={loadData}>
                    Refresh
                </Button>
            </Stack>

            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    bgcolor: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                }}
            >
                <Typography fontWeight={700}>
                    Total: {total} {currency}
                </Typography>
            </Paper>

            <Stack spacing={1}>
                {byCategory.length === 0 ? (
                    <Typography sx={{ opacity: 0.7 }}>No data for this month.</Typography>
                ) : (
                    byCategory.map((row) => {
                        const pct = maxVal === 0 ? 0 : (row.total / maxVal) * 100;

                        return (
                            <Box
                                key={row.category}
                                sx={{
                                    p: 1.5,
                                    borderRadius: 2,
                                    border: "1px solid rgba(255,255,255,0.08)",
                                }}
                            >
                                <Stack
                                    direction="row"
                                    justifyContent="space-between"
                                    alignItems="center"
                                    spacing={2}
                                >
                                    <Typography fontWeight={700}>{row.category}</Typography>
                                    <Typography sx={{ opacity: 0.9 }}>
                                        {row.total} {currency}
                                    </Typography>
                                </Stack>

                                <Box
                                    sx={{
                                        mt: 1,
                                        height: 10,
                                        borderRadius: 999,
                                        bgcolor: "rgba(255,255,255,0.08)",
                                        overflow: "hidden",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            height: "100%",
                                            width: `${pct}%`,
                                            bgcolor: "primary.main",
                                        }}
                                    />
                                </Box>
                            </Box>
                        );
                    })
                )}
            </Stack>
        </Stack>
    );
}
