// Long-stay discount pricing — the single place this math happens, so the
// listing card, the listing detail page, and any future booking/search flow
// all agree on what a listing costs per night. MVP: one discount tier only
// (2+ nights by default), no 7/30-night tiers yet.

export function isLongStayDiscountActive(listing) {
  return !!(
    listing?.longStayEnabled &&
    listing.longStayDiscountType &&
    listing.longStayDiscountValue != null &&
    listing.longStayDiscountValue > 0
  );
}

/** Nightly price once the long-stay discount applies — null if the listing
 *  has no active long-stay discount. */
export function longStayDiscountedPrice(listing) {
  if (!isLongStayDiscountActive(listing)) return null;
  if (listing.longStayDiscountType === "percentage") {
    return Math.round(listing.price * (1 - listing.longStayDiscountValue / 100));
  }
  if (listing.longStayDiscountType === "fixed_price") {
    return listing.longStayDiscountValue;
  }
  return null;
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
