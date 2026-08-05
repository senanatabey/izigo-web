/* =========================================================================
   Currency conversion service.
   AZN is the only currency ever stored (in the DB and in every listing
   object) — this module converts AZN -> the user's selected display
   currency on the fly, using live rates cached in localStorage. Nothing
   here ever writes a converted price back to the database.
   ========================================================================= */

export const CURRENCIES = [
  { code: "AZN", symbol: "₼" },
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
  { code: "TRY", symbol: "₺" },
  { code: "SAR", symbol: "﷼" },
];

/** Currency a language should default to on its first-ever selection (only
 *  applied when the user hasn't manually picked a currency yet — see
 *  CurrencyContext.setCurrencyForLanguage). Language and currency stay
 *  fully independent after that. */
export const DEFAULT_CURRENCY_BY_LANGUAGE = { ar: "SAR" };

export const DEFAULT_CURRENCY = "USD";

const SYMBOLS = Object.fromEntries(CURRENCIES.map((c) => [c.code, c.symbol]));

const RATES_STORAGE_KEY = "izigo_exchange_rates";
const RATES_TTL_MS = 18 * 60 * 60 * 1000; // 18h, inside the required 12-24h window
const RATES_API_URL = "https://open.er-api.com/v6/latest/AZN";

function readCachedRates() {
  try {
    const raw = window.localStorage.getItem(RATES_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.rates || !parsed?.fetchedAt) return null;
    if (Date.now() - parsed.fetchedAt > RATES_TTL_MS) return null;
    return parsed.rates;
  } catch {
    return null;
  }
}

function writeCachedRates(rates) {
  try {
    window.localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify({ rates, fetchedAt: Date.now() }));
  } catch {
    // localStorage unavailable — rates just won't be cached across reloads.
  }
}

/**
 * Resolves AZN->currency exchange rates, preferring a fresh localStorage
 * cache (12-24h TTL) over a network call. Returns null if no rates could
 * be obtained (offline, API down) — callers must fall back to AZN.
 */
export async function getExchangeRates() {
  const cached = readCachedRates();
  if (cached) return cached;

  try {
    const res = await fetch(RATES_API_URL);
    if (!res.ok) throw new Error(`Exchange rate API responded ${res.status}`);
    const data = await res.json();
    if (!data?.rates) throw new Error("Exchange rate API returned no rates");
    writeCachedRates(data.rates);
    return data.rates;
  } catch {
    return null;
  }
}

export function currencySymbol(code) {
  return SYMBOLS[code] || code;
}

/** Converts an AZN amount into `currency`, or null if the rate is unavailable. */
export function convertFromAzn(amountAzn, currency, rates) {
  if (typeof amountAzn !== "number" || Number.isNaN(amountAzn)) return null;
  if (currency === "AZN") return amountAzn;
  const rate = rates?.[currency];
  if (!rate) return null;
  return amountAzn * rate;
}

function roundNaturally(amount, currency) {
  if (currency === "AZN") {
    return Math.round(amount * 100) / 100;
  }
  // USD/EUR/GBP/TRY — whole numbers, or a .99 psychological price once
  // the amount is large enough for that to read as intentional.
  if (amount >= 10) return Math.floor(amount) - 0.01 >= 0 ? Math.floor(amount) + 0.99 : Math.round(amount);
  return Math.round(amount);
}

/**
 * Formats an AZN amount for display in `currency`. Falls back to AZN
 * formatting whenever the target currency's rate isn't available (API
 * down, offline, cache empty), so the UI never shows a broken value.
 */
export function formatPrice(amountAzn, currency, rates) {
  if (typeof amountAzn !== "number" || Number.isNaN(amountAzn)) return "";

  const converted = convertFromAzn(amountAzn, currency, rates);
  const effectiveCurrency = converted === null ? "AZN" : currency;
  const value = converted === null ? amountAzn : converted;
  const rounded = roundNaturally(value, effectiveCurrency);

  const display = Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(2);
  return `${currencySymbol(effectiveCurrency)}${display}`;
}
