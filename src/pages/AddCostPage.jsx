import { useState } from "react";
import {
    Box,
    Paper,
    Typography,
    TextField,
    MenuItem,
    Button,
    Stack,
    Alert
} from "@mui/material";

import { addCost } from "../services/db";

const CURRENCIES = ["USD", "ILS", "GBP", "EURO"];

const CATEGORIES = [
    "Food",
    "Car",
    "Education",
    "Housing",
    "Health",
    "Entertainment",
    "Other"
];

export default function AddCostPage() {
    const [sum, setSum] = useState("");
    const [currency, setCurrency] = useState("USD");
    const [category, setCategory] = useState("Food");
    const [description, setDescription] = useState("");

    const [status, setStatus] = useState({ type: "", message: "" });
    const [saving, setSaving] = useState(false);

    function validate() {
        const num = Number(sum);
        if (sum === "" || Number.isNaN(num) || num <= 0) {
            return "Sum must be a positive number";
        }
        if (!CURRENCIES.includes(currency)) {
            return "Invalid currency";
        }
        if (!category || category.trim() === "") {
            return "Category is required";
        }
        if (typeof description !== "string") {
            return "Description is required";
        }
        return "";
    }

    async function onSubmit(e) {
        e.preventDefault();
        setStatus({ type: "", message: "" });

        const err = validate();
        if (err) {
            setStatus({ type: "error", message: err });
            return;
        }

        setSaving(true);
        try {
            await addCost({
                sum: Number(sum),
                currency,
                category,
                description: description.trim()
            });

            setStatus({ type: "success", message: "Cost item added successfully." });
            setSum("");
            setCurrency("USD");
            setCategory("Food");
            setDescription("");
        } catch (ex) {
            setStatus({ type: "error", message: ex?.message || "Failed to add cost." });
        } finally {
            setSaving(false);
        }
    }

    return (
        <Paper sx={{ p: 3, maxWidth: 700 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
                Add New Cost
            </Typography>

            {status.message ? (
                <Alert severity={status.type === "error" ? "error" : "success"} sx={{ mb: 2 }}>
                    {status.message}
                </Alert>
            ) : null}

            <Box component="form" onSubmit={onSubmit}>
                <Stack spacing={2}>
                    <TextField
                        label="Sum"
                        type="number"
                        value={sum}
                        onChange={(e) => setSum(e.target.value)}
                        inputProps={{ step: "0.01", min: "0" }}
                        required
                    />

                    <TextField
                        select
                        label="Currency"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        required
                    >
                        {CURRENCIES.map((c) => (
                            <MenuItem key={c} value={c}>{c}</MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        label="Category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                    >
                        {CATEGORIES.map((c) => (
                            <MenuItem key={c} value={c}>{c}</MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        label="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        multiline
                        minRows={2}
                    />

                    <Button variant="contained" type="submit" disabled={saving}>
                        {saving ? "Saving..." : "Add Cost"}
                    </Button>
                </Stack>
            </Box>
        </Paper>
    );
}
