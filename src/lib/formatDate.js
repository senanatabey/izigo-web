/** DD.MM.YYYY, the Azerbaijani convention. Intl's "az" locale yields ISO
 *  (2026-09-09) in current browsers, so the admin/partner screens, which are
 *  Azerbaijani-only, format dates explicitly instead of via the locale. */
export function formatDateAz(value) {
  const dateOnly = typeof value === "string" && value.match(/^(d{4})-(d{2})-(d{2})$/);
  if (dateOnly) return `${dateOnly[3]}.${dateOnly[2]}.${dateOnly[1]}`;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}`;
}

/* Azerbaijani month names. Chromium ships no month data for the "az" locale,
   so toLocaleDateString("az-AZ", { month: "long" }) yields "M12" - format
   Azerbaijani dates from this list instead. */
const AZ_MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avqust", "sentyabr", "oktyabr", "noyabr", "dekabr"];

/* Date-only strings (YYYY-MM-DD) are read as local calendar dates, not UTC
   midnight, so the shown day never shifts with the viewer timezone. */
function toDate(value) {
  if (value instanceof Date) return value;
  const m = typeof value === "string" && value.match(/^(d{4})-(d{2})-(d{2})$/);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value);
}

/** "5 dekabr 2026" (az) / "5 December 2026" (everything else, as before). */
export function formatDateLong(value, language) {
  const d = toDate(value);
  if (Number.isNaN(d.getTime())) return "";
  if (language === "az") return `${d.getDate()} ${AZ_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/** "dekabr 2026" (az) / "December 2026" (everything else, as before). */
export function formatMonthYear(value, language) {
  const d = toDate(value);
  if (Number.isNaN(d.getTime())) return "";
  if (language === "az") return `${AZ_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
