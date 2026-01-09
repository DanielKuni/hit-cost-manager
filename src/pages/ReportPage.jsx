import { useState } from "react";
import {
    Paper,
    Typography,
    Stack,
    TextField,
    MenuItem,
    Button,
    Alert,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody
} from "@mui/material";

import { getMonthlyReport } from "../services/db";
import { getRatesUrl } from "../services/settingsStore";

const CURRENCIES = ["USD", "ILS", "GBP", "EURO"];

function currentYear() {
    return new Date().getFullYear();
}

function currentMonth() {
    return new Date().getMonth() + 1;
}

export default function ReportPage() {
    const [year, setYear] = useState(String(currentYear()));
    const [month, setMonth] = useState(String(currentMonth()));
    const [currency, setCurrency] = useState("USD");

    const [status, setStatus] = useState({ type: "", message: "" });
    const [loading, setLoading] = useState(false);

    const [report, setReport] = useState(null);

    function validate() {
        const y = Number(year);
        const m = Number(month);
        if (Number.isNaN(y) || y < 2000 || y > 2100) return "Year must be between 2000-2100";
        if (Number.isNaN(m) || m < 1 || m > 12) return "Month must be between 1-12";
        if (!CURRENCIES.includes(currency)) return "Invalid currency";
        return "";
    }

    async function onGetReport() {
        setStatus({ type: "", message: "" });

        const err = validate();
        if (err) {
            setStatus({ type: "error", message: err });
            return;
        }

        setLoading(true);
        try {
            const ratesUrl = getRatesUrl(); // can be empty -> currencyService uses default URL (we'll set it later)
            const r = await getMonthlyReport(Number(year), Number(month), currency, ratesUrl);
            setReport(r);
            setStatus({ type: "success", message: "Report created." });
        } catch (ex) {
            setReport(null);
            setStatus({ type: "error", message: ex?.message || "Failed to get report" });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
                Monthly Report
            </Typography>

            {status.message ? (
                <Alert severity={status.type === "error" ? "error" : "success"} sx={{ mb: 2 }}>
                    {status.message}
                </Alert>
            ) : null}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
                <TextField
                    label="Year"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    sx={{ width: 160 }}
                />

                <TextField
                    label="Month (1-12)"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    sx={{ width: 160 }}
                />

                <TextField
                    select
                    label="Currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    sx={{ width: 200 }}
                >
                    {CURRENCIES.map((c) => (
                        <MenuItem key={c} value={c}>{c}</MenuItem>
                    ))}
                </TextField>

                <Button variant="contained" onClick={onGetReport} disabled={loading}>
                    {loading ? "Loading..." : "Get Report"}
                </Button>
            </Stack>

            {report ? (
                <>
                    <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                        Total: {report.total.total} {report.total.currency}
                    </Typography>

                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Day</TableCell>
                                <TableCell>Category</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell align="right">Sum</TableCell>
                                <TableCell>Currency</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {report.costs.map((c, idx) => (
                                <TableRow key={idx}>
                                    <TableCell>{c.Date?.day}</TableCell>
                                    <TableCell>{c.category}</TableCell>
                                    <TableCell>{c.description}</TableCell>
                                    <TableCell align="right">{c.sum}</TableCell>
                                    <TableCell>{c.currency}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </>
            ) : null}
        </Paper>
    );
}
