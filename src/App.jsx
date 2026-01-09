"use strict";

import { HashRouter, Routes, Route, Link } from "react-router-dom";
import { AppBar, Toolbar, Typography, Button, Container, Box, Paper } from "@mui/material";

import AddCostPage from "./pages/AddCostPage";
import ReportPage from "./pages/ReportPage";
import ChartsPage from "./pages/ChartsPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
    return (
        <HashRouter>
            <Box
                sx={{
                    minHeight: "100vh",
                    background: "linear-gradient(180deg, #0b1220 0%, #0a0f1a 100%)",
                }}
            >
                <AppBar position="static">
                    <Container maxWidth="lg">
                        <Toolbar disableGutters>
                            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
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

                {/* מרכז את כל התוכן במסך */}
                <Container maxWidth={false} sx={{ mt: 6 }}>
                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                        <Paper
                            elevation={6}
                            sx={{
                                p: 4,
                                width: "min(700px, 100%)",
                            }}
                        >
                            <Routes>
                                <Route path="/" element={<AddCostPage />} />
                                <Route path="/report" element={<ReportPage />} />
                                <Route path="/charts" element={<ChartsPage />} />
                                <Route path="/settings" element={<SettingsPage />} />
                            </Routes>
                        </Paper>
                    </Box>
                </Container>
            </Box>
        </HashRouter>
    );
}
