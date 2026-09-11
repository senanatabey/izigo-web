// Long-stay discount pricing — the single place this math happens, so the
// listing card, the listing detail page, and any future booking/search flow
// all agree on what a listing costs per night. MVP: one discount tier only
// (2+ nights by default), no 7/30-night tiers yet.

function computeLongStayPrice(listing) {
  if (listing.longStayDiscountType === "percentage") {
    return Math.round(listing.price * (1 - listing.longStayDiscountValue / 100));
  }
  if (listing.longStayDiscountType === "fixed_price") {
    return listing.longStayDiscountValue;
  }
  return null;
}

export function isLongStayDiscountActive(listing) {
  const configured = !!(
    listing?.longStayEnabled &&
    listing.longStayDiscountType &&
    listing.longStayDiscountValue != null &&
    listing.longStayDiscountValue > 0
  );
  if (!configured) return false;

  // A long-stay "discount" must actually be cheaper than the regular
  // nightly rate. A fixed_price value left stale after the host lowered
  // the base price (it doesn't auto-update) would otherwise render as a
  // discount that costs MORE for staying longer — nonsensical and
  // misleading to guests. Treat that as no discount at all rather than
  // trusting whatever is in the database.
  const discounted = computeLongStayPrice(listing);
  return discounted != null && discounted < listing.price;
}

/** Nightly price once the long-stay discount applies — null if the listing
 *  has no active long-stay discount. */
export function longStayDiscountedPrice(listing) {
  if (!isLongStayDiscountActive(listing)) return null;
  return computeLongStayPrice(listing);
}

/** Nightly price for a stay of `nights` — the regular price for a single
 *  night, the discounted price once the listing's minimum-night threshold
 *  is met. Not wired into a booking flow yet, but this is the one place
 *  that logic should live once one exists. */
export function nightlyPriceForStay(listing, nights) {
  const discounted = longStayDiscountedPrice(listing);
  if (discounted != null && nights >= (listing.longStayMinNights || 2)) {
    return discounted;
  }
  return listing.price;
}
