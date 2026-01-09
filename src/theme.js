import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
    palette: {
        mode: "dark",
        primary: { main: "#3b82f6" },
        background: {
            default: "#0b1220",
            paper: "#0f1b2d",
        },
    },
    shape: {
        borderRadius: 14,
    },
    typography: {
        fontFamily: "Inter, system-ui, Arial",
        h4: { fontWeight: 800 },
        h5: { fontWeight: 800 },
        button: { fontWeight: 700 },
    },
});
