"use strict";

import { useEffect, useState } from "react";
import {
    Typography,
    Stack,
    TextField,
    MenuItem,
    Button,
    Alert,
    Divider,
} from "@mui/material";

import { loadSettings, saveSettings, DEFAULT_SETTINGS } from "../services/settingsStore";
import { CURRENCY_INFO, CURRENCIES } from "../services/currencyService";

/**
 * SettingsPage
 * ------------
 * מאפשר למשתמש לבחור:
 * - baseCurrency (מטבע תצוגה ברירת מחדל)
 * - ratesUrl (מקור שערי המרה)
 *
 * דרישה:
 * גם אם ratesUrl ריק/לא מוגדר - האפליקציה צריכה לעבוד עם ברירת מחדל.
 */

export default function SettingsPage() {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [saved, setSaved] = useState(false);

    /**
     * טעינת הגדרות פעם אחת ב-mount.
     */
    useEffect(() => {
        setSettings(loadSettings());
    }, []);

    /**
     * שמירה ל-localStorage.
     */
    function handleSave() {
        saveSettings(settings);
        setSaved(true);

        setTimeout(() => {
            setSaved(false);
        }, 1500);
    }

    /**
     * איפוס להגדרות ברירת מחדל.
     */
    function handleReset() {
        saveSettings(DEFAULT_SETTINGS);
        setSettings(DEFAULT_SETTINGS);
        setSaved(true);

        setTimeout(() => {
            setSaved(false);
        }, 1500);
    }

    return (
        <Stack spacing={2}>
            <Typography variant="h4" fontWeight={800}>
                Settings
            </Typography>

            <Typography sx={{ opacity: 0.8 }}>
                Configure base currency and exchange rates source.
            </Typography>

            <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                    select
                    fullWidth
                    label="Base Currency"
                    value={settings.baseCurrency}
                    onChange={(e) => {
                        setSettings((prev) => ({
                            ...prev,
                            baseCurrency: e.target.value,
                        }));
                    }}
                >
                    {CURRENCIES.map((code) => (
                        <MenuItem key={code} value={code}>
                            {CURRENCY_INFO[code].label}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    fullWidth
                    label="Rates URL"
                    value={settings.ratesUrl}
                    onChange={(e) => {
                        setSettings((prev) => ({
                            ...prev,
                            ratesUrl: e.target.value,
                        }));
                    }}
                    helperText='Example: "/rates.json"'
                />
            </Stack>

            <Stack direction="row" spacing={2}>
                <Button variant="contained" onClick={handleSave}>
                    Save
                </Button>

                <Button variant="outlined" onClick={handleReset}>
                    Reset
                </Button>
            </Stack>

            {saved ? <Alert severity="success">Settings saved</Alert> : null}
        </Stack>
    );
}
