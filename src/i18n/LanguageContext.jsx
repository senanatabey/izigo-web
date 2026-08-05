import { createContext, useContext, useEffect, useState } from "react";
import { translations, DEFAULT_LANGUAGE, LANGUAGES, RTL_LANGUAGES } from "./translations";

const LanguageContext = createContext(null);

function resolve(obj, path) {
  return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

const LANGUAGE_STORAGE_KEY = "izigo_language";

function readStoredLanguage() {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return LANGUAGES.some((l) => l.code === stored) ? stored : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(readStoredLanguage);
  const isRtl = RTL_LANGUAGES.includes(language);

  // Global RTL wiring lives here — the one place language state changes —
  // rather than in every page/layout, so new RTL languages need zero
  // changes outside this file and translations.js.
  useEffect(() => {
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.documentElement.lang = language;
    document.documentElement.classList.toggle("rtl", isRtl);
  }, [language, isRtl]);

  const setLanguage = (code) => {
    setLanguageState(code);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
    } catch {
      // localStorage unavailable (private mode, etc.) — selection just won't persist.
    }
  };

  const t = (key) => {
    const value = resolve(translations[language], key);
    if (value === undefined) return resolve(translations[DEFAULT_LANGUAGE], key) ?? key;
    return value;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
