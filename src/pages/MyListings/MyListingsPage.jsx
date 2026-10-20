import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Search, Star, ChevronDown, MessageCircle, Plus, X } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useCurrency } from "../../i18n/CurrencyContext";
import { useAuth } from "../../App";
import { supabase } from "../../lib/supabaseClient";
import { toneForId } from "../../lib/listings";
import { ALL_DESTINATIONS, cityLabel } from "../../data/azerbaijanDestinations";
import { ListingStatusTabs } from "../../components/ListingStatusTabs";
import { useStatusFilter } from "../../lib/useStatusFilter";
import { fetchHostReviews, replyToReview } from "../../lib/reviews";

const TYPE_TO_PATH = { villa: "villas", car: "cars", transfer: "transfers", event: "events", service: "concierge" };

function ListingReviewsPanel({ reviews, onReplied }) {
  const { t } = useLanguage();
  const [replyDrafts, setReplyDrafts] = useState({});

  const submitReply = async (id) => {
    const draft = (replyDrafts[id] || "").trim();
    if (!draft) return;
    await replyToReview(id, draft);
    onReplied();
  };

  return (
    <div className="mlp-reviews-panel">
      {reviews.map((r) => (
        <div className="mlp-review-card" key={r.id}>
          <div className="mlp-review-head">
            <span className="mlp-review-stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
            <span className={`mlp-review-status ${r.status}`}>{t(`myListingsPage.reviewStatus.${r.status}`) || r.status}</span>
          </div>
          <p className="mlp-review-text">{r.text}</p>
          {r.host_reply ? (
            <div className="mlp-review-reply"><strong>{t("myListingsPage.yourReply")}:</strong> {r.host_reply}</div>
          ) : (
            <div className="mlp-review-reply-form">
              <input
                type="text"
                placeholder={t("myListingsPage.replyPlaceholder")}
                value={replyDrafts[r.id] || ""}
                onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [r.id]: e.target.value }))}
              />
              <button type="button" onClick={() => submitReply(r.id)}>
                <MessageCircle size={13} />{t("myListingsPage.replySubmit")}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function MyListingsPage() {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cityQuery, setCityQuery] = useState("");
  const [cityFilter, setCityFilter] = useState(null);
  const [cityOpen, setCityOpen] = useState(false);
  const [reviewsByListing, setReviewsByListing] = useState({});
  const [openReviewsFor, setOpenReviewsFor] = useState(null);

  const loadReviews = () => {
    if (!user) return;
    fetchHostReviews(user.id).then((rows) => {
      const grouped = {};
      rows.forEach((r) => {
        (grouped[r.listing_id] ||= []).push(r);
      });
      setReviewsByListing(grouped);
    });
  };

  useEffect(() => {
    if (!user) return;
    supabase
      .from("listings")
      .select("*")
      .eq("host_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setListings((data || []).map((row) => ({
        id: row.id,
        type: row.category,
        city: row.city,
        tone: toneForId(row.id),
        status: row.status,
        price: row.price,
        title: row.title,
        image: row.images?.[0],
        rejectReason: row.reject_reason,
      }))))
      .finally(() => setLoading(false));
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const cityOptions = ALL_DESTINATIONS.filter((c) => listings.some((l) => l.city === c));
  const filteredCities = cityOptions.filter((c) => cityLabel(c, language).toLowerCase().includes(cityQuery.trim().toLowerCase()));

  const pickCity = (c) => {
    setCityFilter(c);
    setCityQuery(cityLabel(c, language));
    setCityOpen(false);
  };
  const clearCity = () => {
    setCityFilter(null);
    setCityQuery("");
  };

  // Client-side filters: city first, then status (shared with the profile block). Tab counts follow the city filter.
  const cityListings = cityFilter ? listings.filter((l) => l.city === cityFilter) : listings;
  const { filter: statusFilter, setFilter: setStatusFilter, counts: statusCounts, filtered: filteredListings } = useStatusFilter(cityListings);

  return (
    <div className="my-listings-page">
      <style>{`
        .my-listings-page .mlp-head { margin-bottom: 24px; }
        .my-listings-page .mlp-head h1 { font-size: 22px; font-weight: 800; margin: 0 0 8px; }
        .my-listings-page .mlp-head p { font-size: 13.5px; color: var(--text-soft); margin: 0; }        .my-listings-page .mlp-reviews-toggle {
          display: inline-flex; align-items: center; gap: 5px; margin-top: 6px; border: none; background: none;
          padding: 0; font-size: 12px; font-weight: 700; color: var(--rebrand-cta); cursor: pointer;
        }
        .my-listings-page .mlp-reviews-toggle svg.is-open { transform: rotate(180deg); }
        .my-listings-page .mlp-reviews-panel { border-top: 1px solid var(--border); background: var(--bg-soft); padding: 14px; display: flex; flex-direction: column; gap: 12px; }
        .my-listings-page .mlp-review-card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; }
        .my-listings-page .mlp-review-head { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
        .my-listings-page .mlp-review-stars { color: #FFB800; font-size: 13px; }
        .my-listings-page .mlp-review-status { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: var(--bg-soft); color: var(--text-soft); }
        .my-listings-page .mlp-review-status.published { background: rgba(46,157,94,0.14); color: var(--rebrand-text); }
        .my-listings-page .mlp-review-status.pending_moderation, .my-listings-page .mlp-review-status.queued { background: rgba(255,180,0,0.16); color: #B87700; }
        .my-listings-page .mlp-review-status.rejected { background: rgba(224,85,63,0.14); color: #E0553F; }
        .my-listings-page .mlp-review-text { font-size: 13px; color: var(--text-soft); line-height: 1.6; margin: 0 0 8px; }
        .my-listings-page .mlp-review-reply { background: var(--bg-soft); border-radius: 8px; padding: 8px 12px; font-size: 12.5px; }
        .my-listings-page .mlp-review-reply-form { display: flex; gap: 8px; }
        .my-listings-page .mlp-review-reply-form input {
          flex: 1; border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; font-size: 12.5px; font-family: var(--sans);
        }
        .my-listings-page .mlp-review-reply-form button {
          display: inline-flex; align-items: center; gap: 4px; border: none; background: var(--rebrand-cta); color: #fff;
          border-radius: 8px; padding: 0 12px; font-size: 12px; font-weight: 700; cursor: pointer;
        }
        .my-listings-page .mlp-reject-reason { font-size: 12px; color: #E0553F; margin-top: 6px; }
        .my-listings-page .mlp-thumb.dusk { background: linear-gradient(135deg, #24406B, #6B4A8A 60%, #C98A3B); }
        .my-listings-page .mlp-thumb.forest { background: linear-gradient(135deg, #0F3D3A, #1E6E5C 55%, #4C9A6B); }
        .my-listings-page .mlp-thumb.meadow { background: linear-gradient(135deg, #1B4332, #3F7A57 55%, #86A662); }
        .my-listings-page .mlp-title { font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
        .my-listings-page .mlp-meta { display: flex; align-items: center; gap: 4px; font-size: 12.5px; color: var(--text-soft); }
        .my-listings-page .mlp-badge {
          font-size: 11.5px; font-weight: 700; padding: 4px 10px; border-radius: 999px; text-transform: capitalize;
        }
        .my-listings-page .mlp-badge.approved { background: rgba(46,157,94,0.14); color: var(--rebrand-text); }
        .my-listings-page .mlp-badge.pending { background: rgba(255,180,0,0.16); color: #B87700; }
        .my-listings-page .mlp-badge.rejected { background: rgba(224,85,63,0.14); color: #E0553F; }
        .my-listings-page .mlp-edit { font-size: 12.5px; font-weight: 700; color: var(--rebrand-cta); }
      

        /* Toolbar: city search + "new listing" */
        .my-listings-page .mlp-toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
        .my-listings-page .mlp-city-wrap { flex: 1; min-width: 0; position: relative; }
        .my-listings-page .mlp-search {
          display: flex; align-items: center; gap: 8px; border: 1px solid var(--border); border-radius: 10px;
          padding: 10px 14px; background: var(--surface);
        }
        .my-listings-page .mlp-search:focus-within { border-color: var(--rebrand-cta); }
        .my-listings-page .mlp-search svg { color: var(--text-soft); flex-shrink: 0; }
        .my-listings-page .mlp-search input {
          border: none; outline: none; font-size: 14px; color: var(--text); width: 100%; min-width: 0; font-family: var(--sans); background: transparent;
        }
        .my-listings-page .mlp-search-clear {
          display: flex; align-items: center; justify-content: center; border: none; background: none; padding: 0; cursor: pointer; color: var(--text-soft);
        }
        .my-listings-page .mlp-city-dropdown {
          position: absolute; top: calc(100% + 6px); left: 0; right: 0; max-height: 260px; overflow-y: auto;
          background: var(--surface); border: 1px solid var(--border); border-radius: 12px; box-shadow: var(--shadow-md); z-index: 20;
        }
        .my-listings-page .mlp-city-dropdown button {
          display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; padding: 11px 16px;
          border: none; background: none; font-size: 14px; color: var(--text); cursor: pointer;
        }
        .my-listings-page .mlp-city-dropdown button:hover { background: var(--bg-soft); }
        .my-listings-page .mlp-new-btn {
          display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; white-space: nowrap; text-decoration: none;
          background: var(--rebrand-listing-cta); color: #fff; border-radius: 10px; padding: 11px 16px; font-size: 14px; font-weight: 700;
        }
        .my-listings-page .mlp-new-btn:hover { background: var(--rebrand-listing-cta-hover); }

        /* Status tabs */
        .my-listings-page .mlp-tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 18px; }
        .my-listings-page .mlp-tab {
          border: 1.5px solid var(--rebrand-cta); background: var(--surface); color: var(--rebrand-cta); border-radius: 999px;
          padding: 7px 14px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: var(--sans); white-space: nowrap;
        }
        .my-listings-page .mlp-tab:hover:not(.active) { background: var(--rebrand-bg-tint); }
        .my-listings-page .mlp-tab.active { background: var(--rebrand-cta); border-color: var(--rebrand-cta); color: #fff; }
        .my-listings-page .mlp-empty { color: var(--text-soft); font-size: 14px; }

        /* Card grid */
        .my-listings-page .mlp-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; align-items: start; }
        .my-listings-page .mlp-item { border: 1px solid var(--border); border-radius: 14px; overflow: hidden; background: var(--surface); display: flex; flex-direction: column; }
        .my-listings-page .mlp-item.is-open { grid-column: 1 / -1; }
        .my-listings-page .mlp-item.is-open .mlp-thumb { aspect-ratio: auto; height: 140px; }
        .my-listings-page .mlp-thumb { display: block; width: 100%; aspect-ratio: 4 / 3; background-size: cover; background-position: center; }
        .my-listings-page .mlp-body { padding: 12px 14px 0; min-width: 0; flex: 1; }
        .my-listings-page .mlp-side { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 12px 14px 14px; }
        .my-listings-page .mlp-item.is-open .mlp-side { padding-bottom: 12px; }

        /* The bottom nav (shown up to 860px) has a "+" that opens "new listing", so hide the
           duplicate toolbar wherever the bottom nav is visible. */
        @media (max-width: 860px) {
          .my-listings-page .mlp-toolbar-main { display: none; }
        }

        @media (max-width: 640px) {
          .my-listings-page .mlp-list { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; }
          .my-listings-page .mlp-body { padding: 10px 10px 0; }
          .my-listings-page .mlp-title { font-size: 13px; }
          .my-listings-page .mlp-meta { font-size: 11.5px; flex-wrap: wrap; }
          .my-listings-page .mlp-side { padding: 10px; }
          .my-listings-page .mlp-badge { font-size: 10.5px; padding: 3px 8px; }
          .my-listings-page .mlp-edit { font-size: 11.5px; }
          .my-listings-page .mlp-new-btn { padding: 11px 12px; }
          .my-listings-page .mlp-item.is-open .mlp-thumb { height: 110px; }
        }
`}</style>

      <div className="mlp-head">
        <h1>{t("myListingsPage.heading")}</h1>
        <p>{t("myListingsPage.subtitle")}</p>
      </div>

      {loading ? null : listings.length === 0 ? (
        <div className="mlp-toolbar">
          <p className="mlp-empty" style={{ flex: 1, margin: 0 }}>{t("myListingsPage.subtitle")}</p>
          <Link to="/add-listing" className="mlp-new-btn"><Plus size={16} />{t("nav.publish")}</Link>
        </div>
      ) : (
        <>
          <div className="mlp-toolbar mlp-toolbar-main">
            <div className="mlp-city-wrap">
              <div className="mlp-search">
                <Search size={16} />
                <input
                  type="text"
                  placeholder={t("myListingsPage.cityPlaceholder")}
                  value={cityQuery}
                  onChange={(e) => { setCityQuery(e.target.value); setCityFilter(null); setCityOpen(true); }}
                  onFocus={() => setCityOpen(true)}
                  onBlur={() => setTimeout(() => setCityOpen(false), 150)}
                />
                {(cityFilter || cityQuery) && (
                  <button type="button" className="mlp-search-clear" onMouseDown={clearCity} aria-label={t("myListingsPage.clearCity")}>
                    <X size={15} />
                  </button>
                )}
              </div>
              {cityOpen && filteredCities.length > 0 && (
                <div className="mlp-city-dropdown">
                  {filteredCities.map((c) => (
                    <button key={c} type="button" onMouseDown={() => pickCity(c)}>
                      <MapPin size={14} />{cityLabel(c, language)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Link to="/add-listing" className="mlp-new-btn"><Plus size={16} />{t("nav.publish")}</Link>
          </div>

          <ListingStatusTabs
            className="mlp-tabs"
            itemClassName="mlp-tab"
            counts={statusCounts}
            value={statusFilter}
            onChange={setStatusFilter}
          />

          {filteredListings.length === 0 ? (
            <p className="mlp-empty">{t("myListingsPage.noResults")}</p>
          ) : (
            <div className="mlp-list">
              {filteredListings.map((item) => {
                const itemReviews = reviewsByListing[item.id] || [];
                const isOpen = openReviewsFor === item.id;
                return (
                  <div className={`mlp-item${isOpen ? " is-open" : ""}`} key={item.id}>
                    <Link
                      to={`/${TYPE_TO_PATH[item.type]}/${item.id}`}
                      className={`mlp-thumb ${item.image ? "" : item.tone}`}
                      style={item.image ? { backgroundImage: `url("${item.image}")` } : undefined}
                    />
                    <div className="mlp-body">
                      <div className="mlp-title">{item.title[language] || item.title.en}</div>
                      <div className="mlp-meta"><MapPin size={12} />{cityLabel(item.city, language)} · {formatPrice(item.price)}</div>
                      {item.status === "rejected" && item.rejectReason && (
                        <div className="mlp-reject-reason">{t("myListingsPage.rejectReasonLabel")}: {item.rejectReason}</div>
                      )}
                      {itemReviews.length > 0 && (
                        <button
                          type="button"
                          className="mlp-reviews-toggle"
                          onClick={() => setOpenReviewsFor(isOpen ? null : item.id)}
                        >
                          <Star size={12} />
                          {t("myListingsPage.reviewsToggle").replace("{count}", itemReviews.length)}
                          <ChevronDown size={13} className={isOpen ? "is-open" : ""} />
                        </button>
                      )}
                    </div>
                    <div className="mlp-side">
                      <span className={`mlp-badge ${item.status}`}>{t(`myListingsPage.status.${item.status}`)}</span>
                      <Link to={`/edit-listing/${item.id}`} className="mlp-edit">{t("myListingsPage.edit")}</Link>
                    </div>
                    {isOpen && <ListingReviewsPanel reviews={itemReviews} onReplied={loadReviews} />}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
