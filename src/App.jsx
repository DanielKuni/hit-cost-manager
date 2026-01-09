import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { AppBar, Toolbar, Typography, Button, Container } from "@mui/material";

import AddCostPage from "./pages/AddCostPage";
import ReportPage from "./pages/ReportPage";
import ChartsPage from "./pages/ChartsPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
    return (
        <BrowserRouter>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        Cost Manager
                    </Typography>
                    <Button color="inherit" component={Link} to="/">Add</Button>
                    <Button color="inherit" component={Link} to="/report">Report</Button>
                    <Button color="inherit" component={Link} to="/charts">Charts</Button>
                    <Button color="inherit" component={Link} to="/settings">Settings</Button>
                </Toolbar>
            </AppBar>

            <Container sx={{ mt: 3 }}>
                <Routes>
                    <Route path="/" element={<AddCostPage />} />
                    <Route path="/report" element={<ReportPage />} />
                    <Route path="/charts" element={<ChartsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                </Routes>
            </Container>
        </BrowserRouter>
    );
}
