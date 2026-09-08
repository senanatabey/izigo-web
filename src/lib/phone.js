/**
 * Formats a raw +994xxxxxxxxx string as "+994 xx xxx xx xx". With `mask`
 * true the last two digits are shown as "xx" — used for the reveal-on-click
 * pattern in PhoneReveal and the listing gallery lightbox.
 */
export function formatPhone(raw, mask) {
  const digits = raw.replace(/\D/g, "");
  const cc = digits.slice(0, 3);
  const p1 = digits.slice(3, 5);
  const p2 = digits.slice(5, 8);
  const p3 = digits.slice(8, 10);
  const p4 = mask ? "xx" : digits.slice(10, 12);
  return `+${cc} ${p1} ${p2} ${p3} ${p4}`;
}
