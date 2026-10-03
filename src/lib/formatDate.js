/** DD.MM.YYYY, the Azerbaijani convention. Intl's "az" locale yields ISO
 *  (2026-09-09) in current browsers, so the admin/partner screens, which are
 *  Azerbaijani-only, format dates explicitly instead of via the locale. */
export function formatDateAz(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}`;
}
