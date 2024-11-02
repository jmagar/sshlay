import { createTheme } from "@mui/material/styles"

const theme = createTheme({
  palette: {
    primary: {
      main: "#90caf9", // Light blue
    },
    secondary: {
      main: "#64b5f6", // Slightly darker blue
    },
  },
  typography: {
    fontFamily: "Inter, sans-serif",
  },
})

export default theme
