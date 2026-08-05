import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  CURRENCIES, DEFAULT_CURRENCY, DEFAULT_CURRENCY_BY_LANGUAGE, getExchangeRates,
  formatPrice as formatPriceAzn,
} from "../lib/currency";

export { CURRENCIES, DEFAULT_CURRENCY };

const CURRENCY_STORAGE_KEY = "izigo_currency";

function readStoredCurrency() {
  try {
    return window.localStorage.getItem(CURRENCY_STORAGE_KEY);
  } catch {
    return null;
  }
}

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const stored = readStoredCurrency();
  const [currency, setCurrencyState] = useState(
    CURRENCIES.some((c) => c.code === stored) ? stored : DEFAULT_CURRENCY,
  );
  const [hasExplicitCurrency, setHasExplicitCurrency] = useState(!!stored);
  const [rates, setRates] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getExchangeRates().then((r) => { if (!cancelled) setRates(r); });
    return () => { cancelled = true; };
  }, []);

  const setCurrency = (code) => {
    setCurrencyState(code);
    setHasExplicitCurrency(true);
    try {
      window.localStorage.setItem(CURRENCY_STORAGE_KEY, code);
    } catch {
      // localStorage unavailable (private mode, etc.) — selection just won't persist.
    }
  };

  // Called when the language changes. Currency stays fully independent
  // once the user has picked one themselves — this only sets a sensible
  // language-specific default (e.g. SAR for Arabic) the very first time,
  // before any explicit currency choice has been made.
  const setCurrencyForLanguage = (languageCode) => {
    if (hasExplicitCurrency) return;
    const languageDefault = DEFAULT_CURRENCY_BY_LANGUAGE[languageCode];
    if (languageDefault) setCurrencyState(languageDefault);
  };

  // Centralized formatter — every screen showing a price should call this
  // instead of re-implementing conversion/rounding/symbol logic itself.
  const formatPrice = useCallback(
    (amountAzn) => formatPriceAzn(amountAzn, currency, rates),
    [currency, rates],
  );

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, setCurrencyForLanguage, rates, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
