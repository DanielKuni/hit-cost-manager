"use strict";

import { HashRouter, Routes, Route, Link } from "react-router-dom";
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Container,
    Box,
    Paper,
} from "@mui/material";

import AddCostPage from "./pages/AddCostPage";
import ReportPage from "./pages/ReportPage";
import ChartsPage from "./pages/ChartsPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
    return (
        <HashRouter>
            {/* Background wrapper */}
            <Box
                sx={{
                    minHeight: "100vh",
                    background:
                        "radial-gradient(1200px circle at 20% 10%, rgba(59,130,246,0.18), transparent 45%), " +
                        "radial-gradient(1000px circle at 80% 30%, rgba(56,189,248,0.12), transparent 45%), " +
                        "linear-gradient(180deg, #0b1220 0%, #0a0f1a 100%)",
                }}
            >
                {/* Top bar */}
                <AppBar
                    position="sticky"
                    elevation={0}
                    sx={{
                        bgcolor: "transparent",
                        backdropFilter: "blur(10px)",
                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                    }}
                >
                    <Container maxWidth="lg">
                        <Toolbar disableGutters sx={{ py: 1 }}>
                            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 800 }}>
                                Cost Manager
                            </Typography>

                            <Button color="inherit" component={Link} to="/">
                                Add
                            </Button>
                            <Button color="inherit" component={Link} to="/report">
                                Report
                            </Button>
                            <Button color="inherit" component={Link} to="/charts">
                                Charts
                            </Button>
                            <Button color="inherit" component={Link} to="/settings">
                                Settings
                            </Button>
                        </Toolbar>
                    </Container>
                </AppBar>

                {/* CENTERED CONTENT */}
                <Box
                    sx={{
                        minHeight: "calc(100vh - 64px)", // גובה המסך פחות ה-AppBar
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "flex-start",
                        pt: 6,
                        px: 2,
                    }}
                >
                    <Container maxWidth="sm">
                        <Paper
                            elevation={12}
                            sx={{
                                p: { xs: 2, sm: 4 },
                                borderRadius: 3,
                            }}
                        >
                            <Routes>
                                <Route path="/" element={<AddCostPage />} />
                                <Route path="/report" element={<ReportPage />} />
                                <Route path="/charts" element={<ChartsPage />} />
                                <Route path="/settings" element={<SettingsPage />} />
                            </Routes>
                        </Paper>
                    </Container>
                </Box>
            </Box>
        </HashRouter>
    );
}
