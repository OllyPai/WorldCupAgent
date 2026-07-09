import { useEffect, useMemo, useState } from "react";
import { ConfigProvider, theme as antdTheme } from "antd";
import AppRouter from "./router";
import { ThemeProvider } from "./theme/ThemeContext";
import "./styles/global.css";
import "./styles/home.css";
import "./styles/query.css";

const THEME_STORAGE_KEY = "projc-theme-mode";

const themeTokens = {
  dark: {
    algorithm: antdTheme.darkAlgorithm,
    token: {
      colorPrimary: "#22C55E",
      colorSuccess: "#22C55E",
      colorInfo: "#38BDF8",
      colorError: "#EF4444",
      colorText: "#E5E7EB",
      colorTextBase: "#E5E7EB",
      colorTextSecondary: "#94A3B8",
      colorBgBase: "#0B1220",
      colorBgContainer: "#111C2E",
      colorBgElevated: "#162235",
      colorBorder: "#23314A",
      colorSplit: "#23314A",
      borderRadius: 18,
      fontFamily: "'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    },
  },
  light: {
    algorithm: antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: "#16A34A",
      colorSuccess: "#16A34A",
      colorInfo: "#0EA5E9",
      colorError: "#EF4444",
      colorText: "#0F172A",
      colorTextBase: "#0F172A",
      colorTextSecondary: "#475569",
      colorBgBase: "#F4F8FB",
      colorBgContainer: "#FFFFFF",
      colorBgElevated: "#EEF4FB",
      colorBorder: "#CBD5E1",
      colorSplit: "#CBD5E1",
      borderRadius: 18,
      fontFamily: "'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    },
  },
};

function App() {
  const [mode, setMode] = useState(() => {
    if (typeof window === "undefined") return "dark";
    return window.localStorage.getItem(THEME_STORAGE_KEY) ?? "dark";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    document.documentElement.style.colorScheme = mode;
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode((currentMode) => (currentMode === "dark" ? "light" : "dark"));
  };

  const themeConfig = useMemo(() => themeTokens[mode], [mode]);
  const themeContextValue = useMemo(
    () => ({ mode, toggleTheme }),
    [mode]
  );

  return (
    <ThemeProvider value={themeContextValue}>
      <ConfigProvider theme={themeConfig}>
        <AppRouter />
      </ConfigProvider>
    </ThemeProvider>
  );
}

export default App;
