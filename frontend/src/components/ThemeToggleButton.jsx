import { Button } from "antd";
import { useThemeMode } from "../theme/ThemeContext";

function ThemeToggleButton() {
  const { mode, toggleTheme } = useThemeMode();
  const isDarkMode = mode === "dark";

  return (
    <Button
      type="default"
      className="theme-toggle-btn"
      onClick={toggleTheme}
      aria-label={isDarkMode ? "切换到浅色模式" : "切换到深色模式"}
      title={isDarkMode ? "切换到浅色模式" : "切换到深色模式"}
    >
      <span className="theme-toggle-glyph" aria-hidden="true">
        {isDarkMode ? "☀️" : "🌙"}
      </span>
    </Button>
  );
}

export default ThemeToggleButton;
