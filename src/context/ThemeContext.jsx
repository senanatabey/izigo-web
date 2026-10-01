import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../App";

// Preference is "light" | "dark" | "system"; the resolved `theme` is only ever
// "light" | "dark". Guests keep their choice in React state only (no
// localStorage); signed-in users persist it to profiles.theme_preference.
const ThemeContext = createContext(null);

const DARK_QUERY = "(prefers-color-scheme: dark)";

function systemPrefersDark() {
  return typeof window !== "undefined" && !!window.matchMedia && window.matchMedia(DARK_QUERY).matches;
}

export function ThemeProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [preference, setPreference] = useState("system");
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia(DARK_QUERY);
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Read the saved preference separately from the main profile hydration, so a
  // missing column (migration not applied yet) can never break sign-in.
  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;
    supabase
      .from("profiles")
      .select("theme_preference")
      .eq("id", userId)
      .single()
      .then(({ data, error }) => {
        if (cancelled || error) return;
        const saved = data?.theme_preference;
        if (saved === "light" || saved === "dark" || saved === "system") setPreference(saved);
      });
    return () => { cancelled = true; };
  }, [userId]);

  const theme = preference === "system" ? (systemDark ? "dark" : "light") : preference;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    setPreference(next);
    if (userId) {
      supabase.from("profiles").update({ theme_preference: next }).eq("id", userId).then(() => {});
    }
  }, [theme, userId]);

  const value = useMemo(() => ({ theme, preference, toggleTheme }), [theme, preference, toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
