import { createContext, useContext, useEffect, useMemo } from "react";
import { useStoredState } from "../hooks/useStoredState.js";
import { useMediaQuery } from "../hooks/useMediaQuery.js";
import { STORAGE_KEYS } from "../constants/config.js";

const ThemeContext = createContext(null);

const CYCLE = { auto: "light", light: "dark", dark: "auto" };
const META_COLORS = { dark: "#0a0e1a", light: "#efe9db" };

/** Theme-Modus (auto/hell/dunkel) mit System-Erkennung und Persistenz. */
export function ThemeProvider({ children }) {
  const [mode, setMode] = useStoredState(STORAGE_KEYS.theme, "auto", { raw: true });
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const isDark = mode === "auto" ? prefersDark : mode === "dark";

  useEffect(() => {
    const theme = isDark ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", META_COLORS[theme]);
  }, [isDark]);

  const value = useMemo(
    () => ({ mode, setMode, isDark, cycleMode: () => setMode((m) => CYCLE[m] ?? "auto") }),
    [mode, isDark, setMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme muss innerhalb von <ThemeProvider> verwendet werden");
  return ctx;
}
