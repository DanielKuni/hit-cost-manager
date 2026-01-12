"use strict";

import { useMemo, useState } from "react";
import {
    Typography,
    Stack,
    TextField,
    MenuItem,
    Button,
    Alert,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Paper,
} from "@mui/material";

import { fetchRates, convert, round2, CURRENCY_INFO, CURRENCIES } from "../services/currencyService";
import { getMonthlyReport } from "../services/db";
import { loadSettings } from "../services/settingsStore";

/**
 * formatDate
 * ----------
 * IndexedDB אצלכם שומר date כאובייקט {year,month,day}.
 * הפונקציה הזו מייצרת תצוגה עקבית בטבלה.
 */
function formatDate(dateValue) {
    if (!dateValue) {
        return "";
    }

    if (typeof dateValue === "object" && dateValue.year && dateValue.month && dateValue.day) {
        const yyyy = String(dateValue.year);
        const mm = String(dateValue.month).padStart(2, "0");
        const dd = String(dateValue.day).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    }

    // fallback למקרה עתידי (string)
    const d = new Date(dateValue);
    if (!Number.isNaN(d.getTime())) {
        return d.toLocaleDateString("en-US");
    }

    return String(dateValue);
}

export default function ReportPage() {
    const settings = useMemo(() => loadSettings(), []);

    // ברירת מחדל: החודש הנוכחי
    const now = new Date();

    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);

    // מטבע תצוגה: מה-Settings או USD
    const [currency, setCurrency] = useState(settings.baseCurrency || "USD");

    const [rows, setRows] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    /**
     * onGetReport
     * -----------
     * שומר לוגיקה עובדת:
     * - אנחנו מקבלים RAW rows מ-getMonthlyReport(year, month),
     * - ממירים לצד ה-UI לפי המטבע שנבחר במסך,
     * - מציגים בטבלה + Total.
     */
    async function onGetReport() {
        try {
            setLoading(true);
            setError("");

            // מקביליות: מביאים גם את הנתונים וגם את השערים
            const [rawRows, rates] = await Promise.all([
                getMonthlyReport(Number(year), Number(month)),
                fetchRates(settings.ratesUrl),
            ]);

            const safeRows = Array.isArray(rawRows) ? rawRows : [];

            const convertedRows = safeRows.map((r) => {
                const sum = Number(r.sum ?? 0);
                const fromCur = r.currency || "USD";

                const converted = convert(sum, fromCur, currency, rates);

                return {
                    ...r,
                    sumConverted: round2(converted),
                };
            });

            setRows(convertedRows);
        } catch (e) {
            setError(e?.message || "Failed to get report");
            setRows([]);
        } finally {
            setLoading(false);
        }
    }

    /**
     * Total מחושב תמיד מהערכים המומרים (sumConverted) כדי להתאים למטבע שנבחר.
     */
    const total = useMemo(() => {
        const sum = rows.reduce((acc, r) => acc + Number(r.sumConverted || 0), 0);
        return round2(sum);
    }, [rows]);

    const symbol = CURRENCY_INFO[currency]?.symbol || "";

    return (
        <Stack spacing={2}>
            <Typography variant="h4" fontWeight={800}>
                Monthly Report
            </Typography>

            <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

            {error ? <Alert severity="error">{error}</Alert> : null}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="stretch">
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
                    {CURRENCIES.map((code) => (
                        <MenuItem key={code} value={code}>
                            {CURRENCY_INFO[code].label}
                        </MenuItem>
                    ))}
                </TextField>

                <Button variant="contained" onClick={onGetReport} disabled={loading}>
                    {loading ? "Loading..." : "GET REPORT"}
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
                <Typography fontWeight={800}>
                    Total: {symbol}{total} ({currency})
                </Typography>
            </Paper>

            <Paper
                elevation={0}
                sx={{
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.08)",
                    bgcolor: "rgba(255,255,255,0.03)",
                }}
            >
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell align="right">Original Sum</TableCell>
                            <TableCell>Original Currency</TableCell>
                            <TableCell align="right">Converted</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} sx={{ opacity: 0.7 }}>
                                    No data for this month.
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((r) => (
                                <TableRow key={r.id || `${r.category}-${r.description}-${formatDate(r.date)}`}>
                                    <TableCell>{formatDate(r.date)}</TableCell>
                                    <TableCell>{r.category}</TableCell>
                                    <TableCell>{r.description}</TableCell>
                                    <TableCell align="right">{r.sum}</TableCell>
                                    <TableCell>{r.currency}</TableCell>
                                    <TableCell align="right">
                                        {symbol}{r.sumConverted} ({currency})
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Paper>
        </Stack>
    );
}
