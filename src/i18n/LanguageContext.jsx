import { createContext, useContext, useState } from "react";
import { translations, DEFAULT_LANGUAGE } from "./translations";

const LanguageContext = createContext(null);

function resolve(obj, path) {
  return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);

  const t = (key) => {
    const value = resolve(translations[language], key);
    if (value === undefined) return resolve(translations[DEFAULT_LANGUAGE], key) ?? key;
    return value;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
