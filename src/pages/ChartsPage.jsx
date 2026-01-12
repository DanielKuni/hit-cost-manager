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

import {
    fetchRates,
    convert,
    round2,
    CURRENCY_INFO,
    CURRENCIES,
} from "../services/currencyService";

import { loadSettings } from "../services/settingsStore";
import { getAllCosts } from "../services/db";

/**
 * normalizeYearMonth
 * ------------------
 * IndexedDB אצלכם שומר date כ:
 * { year, month, day }
 * הפונקציה מחזירה year/month מספריים כדי לסנן ולסכם בקלות.
 */
function normalizeYearMonth(dateValue) {
    if (!dateValue) {
        return { year: NaN, month: NaN };
    }

    if (typeof dateValue === "object" && dateValue.year && dateValue.month) {
        return { year: Number(dateValue.year), month: Number(dateValue.month) };
    }

    // fallback אם בעתיד יישמר תאריך כמחרוזת
    const d = new Date(dateValue);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

/**
 * Stable color palette
 * --------------------
 * צבעים קבועים ודטרמיניסטיים (נוחות מקרא + עקביות בין charts).
 */
const COLOR_PALETTE = [
    "#4e79a7",
    "#f28e2b",
    "#e15759",
    "#76b7b2",
    "#59a14f",
    "#edc949",
    "#af7aa1",
    "#ff9da7",
    "#9c755f",
    "#bab0ac",
];

/**
 * getColorForKey
 * --------------
 * מייצר צבע עקבי לקטגוריה לפי שם הקטגוריה.
 * כך "Food" תמיד יהיה אותו צבע בכל הגרפים.
 */
function getColorForKey(key) {
    let hash = 0;

    for (let i = 0; i < key.length; i += 1) {
        hash = (hash * 31 + key.charCodeAt(i)) % 100000;
    }

    return COLOR_PALETTE[hash % COLOR_PALETTE.length];
}

/**
 * PieChartSvg
 * -----------
 * גרף עוגה אמיתי (SVG) ללא ספריות.
 * data: [{ label, value }]
 * - משתמש בצבע קבוע לפי label (קטגוריה) כדי להתאים למקרא.
 */
function PieChartSvg({ data, size }) {
    const radius = size / 2;
    const total = data.reduce((sum, x) => sum + x.value, 0);

    if (!total) {
        return (
            <Box
                sx={{
                    width: size,
                    height: size,
                    display: "grid",
                    placeItems: "center",
                    opacity: 0.7,
                }}
            >
                No data
            </Box>
        );
    }

    let angle = -Math.PI / 2;

    function arcPath(startAngle, endAngle) {
        const x1 = radius + radius * Math.cos(startAngle);
        const y1 = radius + radius * Math.sin(startAngle);
        const x2 = radius + radius * Math.cos(endAngle);
        const y2 = radius + radius * Math.sin(endAngle);

        const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

        return [
            `M ${radius} ${radius}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
            "Z",
        ].join(" ");
    }

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {data.map((slice) => {
                const startAngle = angle;
                const sliceAngle = (slice.value / total) * Math.PI * 2;
                const endAngle = angle + sliceAngle;
                angle = endAngle;

                return (
                    <path
                        key={slice.label}
                        d={arcPath(startAngle, endAngle)}
                        fill={getColorForKey(slice.label)}
                    />
                );
            })}
        </svg>
    );
}

/**
 * StackedBarChartSvg
 * ------------------
 * גרף עמודות מחולק לפי קטגוריות (Stacked).
 *
 * monthsData: Array length 12:
 *  [
 *    { month: 1, totalsByCategory: { Food: 10, Car: 5, ... }, total: 15 },
 *    ...
 *  ]
 *
 * categories: Array of category names (for legend and deterministic stacking order)
 *
 * Responsive fix:
 * - width="100%" וה-viewBox קבוע -> לא גולש מעבר למסך.
 * - labels ממוקמים בתוך שטח הגרף.
 */
function StackedBarChartSvg({ monthsData, categories, height }) {
    const width = 900; // canvas internal width (responsive via viewBox)
    const padding = 40;
    const chartW = width - padding * 2;
    const chartH = height - padding * 2;

    // נדרש כדי לנרמל גובה: העמודה הגבוהה ביותר = chartH
    const maxTotal = monthsData.reduce((m, x) => Math.max(m, x.total), 0);

    const barCount = monthsData.length;
    const barSlot = chartW / barCount; // שטח לכל חודש
    const barW = barSlot * 0.62;       // width בפועל של עמודה (משאיר רווחים)

    // baseline axis Y
    const baseY = padding + chartH;

    return (
        <Box sx={{ width: "100%", overflow: "hidden" }}>
            <svg
                width="100%"
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="xMidYMid meet"
            >
                {/* קו בסיס X */}
                <line
                    x1={padding}
                    y1={baseY}
                    x2={padding + chartW}
                    y2={baseY}
                    stroke="rgba(255,255,255,0.25)"
                    strokeWidth="1"
                />

                {/* עמודות */}
                {monthsData.map((m, idx) => {
                    const xCenter = padding + idx * barSlot + barSlot / 2;
                    const xLeft = xCenter - barW / 2;

                    // יחס הגובה של החודש יחסית למקסימום
                    const monthScale = maxTotal === 0 ? 0 : (m.total / maxTotal);

                    // heightTotal = גובה העמודה של החודש (בפיקסלים)
                    const heightTotal = monthScale * chartH;

                    // אם אין נתונים בחודש - לא מציירים stack (רק label)
                    if (m.total <= 0) {
                        return (
                            <g key={m.month}>
                                <text
                                    x={xCenter}
                                    y={baseY + 16}
                                    textAnchor="middle"
                                    fontSize="10"
                                    fill="rgba(255,255,255,0.75)"
                                >
                                    {m.month}
                                </text>
                            </g>
                        );
                    }

                    // currentTopY משמש לבנייה מלמטה למעלה
                    let currentTopY = baseY;

                    return (
                        <g key={m.month}>
                            {/* Stacks לפי קטגוריות */}
                            {categories.map((cat) => {
                                const val = Number(m.totalsByCategory[cat] || 0);

                                if (val <= 0) {
                                    return null;
                                }

                                // חלק יחסי של קטגוריה מתוך total של אותו חודש
                                const frac = val / m.total;
                                const segH = frac * heightTotal;

                                // מציירים segment מלמטה כלפי מעלה
                                const y = currentTopY - segH;
                                currentTopY = y;

                                return (
                                    <rect
                                        key={`${m.month}-${cat}`}
                                        x={xLeft}
                                        y={y}
                                        width={barW}
                                        height={segH}
                                        fill={getColorForKey(cat)}
                                        rx="3"
                                    />
                                );
                            })}

                            {/* תווית חודש על ציר X (בתוך תחומי הגרף - לא גולש) */}
                            <text
                                x={xCenter}
                                y={baseY + 16}
                                textAnchor="middle"
                                fontSize="10"
                                fill="rgba(255,255,255,0.75)"
                            >
                                {m.month}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </Box>
    );
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

    /**
     * loadData
     * --------
     * - מביא את כל העלויות מ-IndexedDB.
     * - מביא שערים מהשרת (או ברירת מחדל).
     */
    async function loadData() {
        try {
            setError("");

            const [allCosts, r] = await Promise.all([
                getAllCosts(),
                fetchRates(settings.ratesUrl),
            ]);

            setCosts(Array.isArray(allCosts) ? allCosts : []);
            setRates(r);
        } catch (e) {
            setError(e?.message || "Failed to load data");
        }
    }

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /**
     * filteredMonth
     * -------------
     * סינון נתונים לחודש/שנה הנבחרים עבור Pie + breakdown.
     */
    const filteredMonth = useMemo(() => {
        return costs.filter((c) => {
            const ym = normalizeYearMonth(c?.date);
            return ym.year === Number(year) && ym.month === Number(month);
        });
    }, [costs, year, month]);

    /**
     * byCategory
     * ----------
     * סיכום לחודש הנבחר לפי קטגוריות במטבע הנבחר.
     */
    const byCategory = useMemo(() => {
        const map = new Map();

        filteredMonth.forEach((c) => {
            const category = c.category || "Uncategorized";
            const amount = Number(c.sum ?? 0);
            const fromCur = c.currency || "USD";

            const converted = rates
                ? convert(amount, fromCur, currency, rates)
                : amount;

            map.set(category, (map.get(category) || 0) + converted);
        });

        const arr = Array.from(map.entries()).map(([category, totalValue]) => ({
            category: category,
            total: round2(totalValue),
        }));

        arr.sort((a, b) => b.total - a.total);
        return arr;
    }, [filteredMonth, rates, currency]);

    /**
     * pieData
     * -------
     * פורמט עבור PieChartSvg.
     */
    const pieData = useMemo(() => {
        return byCategory.map((x) => ({
            label: x.category,
            value: Number(x.total),
        }));
    }, [byCategory]);

    /**
     * pieLegendRows
     * -------------
     * יוצר מקרא "יפה":
     * - צבע + שם קטגוריה
     * - ערך במטבע
     * - אחוז מתוך total
     */
    const pieLegendRows = useMemo(() => {
        const total = byCategory.reduce((s, x) => s + x.total, 0);

        return byCategory.map((row) => {
            const pct = total === 0 ? 0 : (row.total / total) * 100;

            return {
                category: row.category,
                total: row.total,
                pct: round2(pct),
                color: getColorForKey(row.category),
            };
        });
    }, [byCategory]);

    /**
     * totalMonth
     * ----------
     * סכום כולל לחודש הנבחר במטבע הנבחר.
     */
    const totalMonth = useMemo(() => {
        const sum = byCategory.reduce((s, x) => s + x.total, 0);
        return round2(sum);
    }, [byCategory]);

    /**
     * categoriesInYear
     * ----------------
     * סט קטגוריות לכל השנה הנבחרת (ל-Stacked Bar Chart).
     * כך הבר-צ'ארט מחולק לקטגוריות באופן עקבי בכל החודשים.
     */
    const categoriesInYear = useMemo(() => {
        const set = new Set();

        costs.forEach((c) => {
            const ym = normalizeYearMonth(c?.date);

            if (ym.year === Number(year)) {
                set.add(c.category || "Uncategorized");
            }
        });

        // מיון אלפביתי ליציבות במקרא + stacking order
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [costs, year]);

    /**
     * monthsStackedData
     * -----------------
     * בונה מערך של 12 חודשים:
     * - totalsByCategory: אובייקט {category: total}
     * - total: סך כל החודש
     *
     * ההמרה למטבע הנבחר מתבצעת כאן כדי שהגרף יהיה "במטבע המוצג".
     */
    const monthsStackedData = useMemo(() => {
        const months = Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            totalsByCategory: {},
            total: 0,
        }));

        // initialize totalsByCategory keys (ליציבות)
        months.forEach((m) => {
            categoriesInYear.forEach((cat) => {
                m.totalsByCategory[cat] = 0;
            });
        });

        costs.forEach((c) => {
            const ym = normalizeYearMonth(c?.date);

            if (ym.year !== Number(year)) {
                return;
            }

            const idx = ym.month - 1;
            if (idx < 0 || idx >= 12) {
                return;
            }

            const category = c.category || "Uncategorized";
            const amount = Number(c.sum ?? 0);
            const fromCur = c.currency || "USD";

            const converted = rates
                ? convert(amount, fromCur, currency, rates)
                : amount;

            months[idx].totalsByCategory[category] =
                (months[idx].totalsByCategory[category] || 0) + converted;

            months[idx].total += converted;
        });

        // עיגול לצורכי תצוגה + עקביות
        return months.map((m) => {
            const nextTotals = { ...m.totalsByCategory };

            Object.keys(nextTotals).forEach((k) => {
                nextTotals[k] = round2(nextTotals[k]);
            });

            return {
                month: m.month,
                totalsByCategory: nextTotals,
                total: round2(m.total),
            };
        });
    }, [costs, year, categoriesInYear, rates, currency]);

    const symbol = CURRENCY_INFO[currency]?.symbol || "";

    return (
        <Stack spacing={2}>
            <Typography variant="h4" fontWeight={800}>
                Charts
            </Typography>

            <Typography sx={{ opacity: 0.8 }}>
                Pie chart (by category, month) + Stacked bar chart (12 months, year).
            </Typography>

            <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

            {error ? <Alert severity="error">{error}</Alert> : null}

            {/* Controls */}
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

                <Button variant="contained" onClick={loadData}>
                    Refresh
                </Button>
            </Stack>

            {/* Summary */}
            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    bgcolor: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                }}
            >
                <Typography fontWeight={800}>
                    Selected Month Total: {symbol}{totalMonth} ({currency})
                </Typography>
            </Paper>

            {/* ✅ Pie Chart + improved legend */}
            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    bgcolor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                }}
            >
                <Typography fontWeight={800} sx={{ mb: 1 }}>
                    Pie Chart (Selected Month)
                </Typography>

                <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="stretch">
                    <Box sx={{ display: "grid", placeItems: "center" }}>
                        <PieChartSvg data={pieData} size={240} />
                    </Box>

                    {/* Legend (improved): color + name + value + percent */}
                    <Stack spacing={1} sx={{ width: "100%" }}>
                        {pieLegendRows.length === 0 ? (
                            <Typography sx={{ opacity: 0.7 }}>No data for this month.</Typography>
                        ) : (
                            pieLegendRows.map((row) => (
                                <Stack
                                    key={row.category}
                                    direction="row"
                                    alignItems="center"
                                    justifyContent="space-between"
                                    spacing={2}
                                    sx={{
                                        p: 1,
                                        borderRadius: 2,
                                        border: "1px solid rgba(255,255,255,0.08)",
                                    }}
                                >
                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
                                        <Box
                                            sx={{
                                                width: 12,
                                                height: 12,
                                                borderRadius: 999,
                                                bgcolor: row.color,
                                                flex: "0 0 auto",
                                            }}
                                        />
                                        <Typography fontWeight={700} noWrap>
                                            {row.category}
                                        </Typography>
                                    </Stack>

                                    <Stack direction="row" spacing={2} alignItems="baseline">
                                        <Typography sx={{ opacity: 0.9 }}>
                                            {symbol}{row.total}
                                        </Typography>
                                        <Typography sx={{ opacity: 0.7 }}>
                                            {row.pct}%
                                        </Typography>
                                    </Stack>
                                </Stack>
                            ))
                        )}
                    </Stack>
                </Stack>
            </Paper>

            {/* ✅ Stacked Bar Chart (by categories) + responsive X axis */}
            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    bgcolor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                }}
            >
                <Typography fontWeight={800} sx={{ mb: 1 }}>
                    Stacked Bar Chart (Selected Year)
                </Typography>

                <StackedBarChartSvg
                    monthsData={monthsStackedData}
                    categories={categoriesInYear}
                    height={260}
                />

                {/* Legend for stacked bar */}
                <Typography sx={{ mt: 1, opacity: 0.8 }}>
                    Values shown in {currency} ({symbol})
                </Typography>

                <Box
                    sx={{
                        mt: 1,
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 1,
                    }}
                >
                    {categoriesInYear.length === 0 ? (
                        <Typography sx={{ opacity: 0.7 }}>No data for this year.</Typography>
                    ) : (
                        categoriesInYear.map((cat) => (
                            <Box
                                key={cat}
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 999,
                                    border: "1px solid rgba(255,255,255,0.08)",
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: 999,
                                        bgcolor: getColorForKey(cat),
                                    }}
                                />
                                <Typography fontSize={12} sx={{ opacity: 0.9 }}>
                                    {cat}
                                </Typography>
                            </Box>
                        ))
                    )}
                </Box>
            </Paper>
        </Stack>
    );
}
