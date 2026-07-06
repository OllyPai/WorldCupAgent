import { createContext, useContext } from "react";

const ThemeContext = createContext({
  mode: "dark",
  toggleTheme: () => {},
});

export function ThemeProvider({ value, children }) {
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode() {
  return useContext(ThemeContext);
}
