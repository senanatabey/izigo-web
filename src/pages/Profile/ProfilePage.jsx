import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  User, Mail, Phone, MessageCircle, Send, Globe, Check, Circle,
  Star, PlusCircle, ListChecks, Bell, Heart, Coins, LayoutDashboard,
  Award, Crown, Calendar, ChevronRight, Home, Settings, LogOut, ArrowLeft,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useCurrency } from "../../i18n/CurrencyContext";
import { useAuth } from "../../App";
import { supabase } from "../../lib/supabaseClient";
import { fetchListingRatings, toneForId } from "../../lib/listings";

const QUICK_ACTIONS = [
  { key: "quickAddListing", to: "/add-listing", icon: PlusCircle },
  { key: "quickMyListings", to: "/my-listings", icon: ListChecks },
  { key: "quickReviews", to: "/my-listings", icon: Star },
  { key: "quickNotifications", to: "/notifications", icon: Bell },
  { key: "quickSaved", to: "/saved", icon: Heart },
];

const TYPE_TO_PATH = { villa: "villas", car: "cars", transfer: "transfers", event: "events", service: "concierge" };
const CATEGORY_NAV_KEY = { villa: "nav.villas", car: "nav.cars", transfer: "nav.transfers", event: "nav.events", service: "nav.concierge" };

function monthYear(dateStr, language) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(language === "az" ? "az-AZ" : "en-US", { month: "long", year: "numeric" });
}

export default function ProfilePage() {
  const { t, language } = useLanguage();
  const { currency, formatPrice } = useCurrency();
  const { user, refreshUser, logout } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [email] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [whatsapp, setWhatsapp] = useState(user?.phone || "");
  const [telegram, setTelegram] = useState("");
  const [website, setWebsite] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  const [stats, setStats] = useState({ listings: 0, rating: null, reviewCount: 0 });
  const [statsError, setStatsError] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [myListings, setMyListings] = useState([]);
  const [myListingsLoading, setMyListingsLoading] = useState(true);
  const [myListingsFilter, setMyListingsFilter] = useState("all");
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from("listings").select("id").eq("host_id", user.id).then(async ({ data: listings, error }) => {
      if (error) {
        console.error("Failed to load listing stats:", error);
        setStatsError(true);
        return;
      }
      setStatsError(false);
      const ids = (listings || []).map((l) => l.id);
      const ratings = await fetchListingRatings(ids);
      const entries = Object.values(ratings);
      const reviewCount = entries.reduce((sum, r) => sum + r.reviewCount, 0);
      const rating = reviewCount
        ? Math.round((entries.reduce((sum, r) => sum + r.rating * r.reviewCount, 0) / reviewCount) * 10) / 10
        : null;
      setStats({ listings: ids.length, rating, reviewCount });
    });
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("listings")
      .select("id, category, city, title, images, status, price")
      .eq("host_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setMyListings((data || []).map((row) => ({
        id: row.id,
        type: row.category,
        city: row.city,
        price: row.price,
        tone: toneForId(row.id),
        status: row.status,
        title: row.title,
        image: row.images?.[0],
      }))))
      .finally(() => setMyListingsLoading(false));
  }, [user?.id]);

  useEffect(() => {
    if (!settingsOpen) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setSettingsOpen(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [settingsOpen]);

  const markDirty = (setter) => (e) => { setter(e.target.value); setDirty(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    const { error: profileError } = await supabase.from("profiles").update({ full_name: name, phone }).eq("id", user.id);
    if (profileError) {
      console.error("Failed to save profile:", profileError);
      setSaveError(t("profilePage.saveError"));
      setSaving(false);
      return;
    }

    if (newPassword) {
      if (newPassword !== confirmPassword) {
        setPasswordMessage(t("register.passwordMismatch"));
        setSaving(false);
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      setPasswordMessage(error ? error.message : "");
      if (!error) { setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }
    }

    await refreshUser();
    setSaving(false);
    setDirty(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const initials = (user?.name || "?").trim().slice(0, 1).toUpperCase();
  const roleLabel = user?.role === "admin" ? t("profilePage.roleAdmin") : t("profilePage.roleHost");
  const whatsappConnected = !!(whatsapp && whatsapp.trim());

  const completion = useMemo(() => {
    const remaining = [];
    if (!phone) remaining.push(t("profilePage.completionPhone"));
    remaining.push(t("profilePage.completionPhoto")); // no avatar upload feature yet — always pending
    if (!whatsappConnected) remaining.push(t("profilePage.completionWhatsapp"));
    const total = 3;
    const done = total - remaining.length;
    return { percent: Math.round((done / total) * 100), remaining };
  }, [phone, whatsappConnected, t]);

  const myListingsCounts = myListings.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});
  const filteredMyListings = myListingsFilter === "all"
    ? myListings
    : myListings.filter((item) => item.status === myListingsFilter);

  return (
    <div className="profile-page">
      <style>{`
        .profile-page { max-width: 980px; margin: 0 auto; }
        .pp-section-gap { display: flex; flex-direction: column; gap: 24px; }

        /* Hero card */
        .pp-hero {
          border: 1px solid var(--border); border-radius: 16px; padding: 28px; background: var(--bg);
          box-shadow: var(--shadow-sm); display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 24px;
          position: relative;
        }
        .pp-hero-left { display: flex; align-items: center; gap: 20px; min-width: 0; }
        .pp-avatar {
          width: 96px; height: 96px; border-radius: 50%; background: var(--bg-soft); color: var(--izigo-green);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 32px; font-weight: 800;
        }
        .pp-hero h1 { font-size: 22px; font-weight: 800; margin: 0 0 6px; }
        .pp-badge-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 4px; }
        .pp-badge {
          display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 700; color: var(--izigo-green);
          background: rgba(0, 200, 151, 0.12); border-radius: 999px; padding: 4px 10px;
        }
        .pp-role { font-size: 13px; color: var(--text-soft); font-weight: 600; }

        .pp-stat-grid { display: grid; grid-template-columns: repeat(4, auto); gap: 12px; }
        .pp-stat-card {
          border: 1px solid var(--border); border-radius: 12px; padding: 10px 16px; text-align: center; min-width: 96px;
        }
        .pp-stat-card .pp-stat-label { font-size: 11px; color: var(--text-soft); font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; }
        .pp-stat-card .pp-stat-value { font-size: 14.5px; font-weight: 800; margin-top: 4px; }
        .pp-stat-card.connected .pp-stat-value { color: var(--izigo-green); }

        /* Role row + My listings */
        .pp-role-row {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          border: 1px solid var(--border); border-radius: 14px; padding: 14px 18px; margin-top: 16px; background: var(--bg);
        }
        .pp-role-chip { display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 700; color: var(--text); }
        .pp-role-chip svg { color: var(--izigo-green); flex-shrink: 0; }
        .pp-role-btn {
          display: inline-flex; align-items: center; gap: 6px; border: 1.5px solid var(--izigo-green); border-radius: 999px;
          padding: 8px 16px; font-size: 12.5px; font-weight: 700; color: var(--izigo-green); white-space: nowrap;
          transition: background 0.15s ease;
        }
        .pp-role-btn:hover { background: rgba(0,200,151,0.08); }

        .pp-settings-fab { display: none; }

        .pp-settings-header { display: none; }

        .pp-logout-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%;
          margin-top: 24px; padding: 13px; border-radius: 12px; border: 1.5px solid #E0553F;
          background: transparent; color: #E0553F; font-weight: 700; font-size: 14px; cursor: pointer;
          transition: background 0.15s ease;
        }
        .pp-logout-btn:hover { background: rgba(224, 85, 63, 0.08); }

        .pp-my-listings { margin-top: 16px; }
        .pp-my-listings-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .pp-my-listings-head h2 { margin: 0; }
        .pp-my-listings-viewall { font-size: 12.5px; font-weight: 700; color: var(--izigo-green); white-space: nowrap; }
        .pp-my-listings-empty { font-size: 13.5px; color: var(--text-soft); margin: 4px 0 0; }

        .pp-mf-filters {
          display: flex; gap: 8px; overflow-x: auto; padding-bottom: 2px; margin-bottom: 12px;
          scrollbar-width: none;
        }
        .pp-mf-filters::-webkit-scrollbar { display: none; }
        .pp-mf-chip {
          flex-shrink: 0; border: 1.5px solid var(--izigo-green); background: #fff; color: var(--izigo-green);
          border-radius: 999px; padding: 6px 14px; font-size: 12.5px; font-weight: 700; cursor: pointer;
          white-space: nowrap; transition: background 0.15s ease, color 0.15s ease;
        }
        .pp-mf-chip:hover { background: rgba(0,200,151,0.08); }
        .pp-mf-chip.active { background: var(--izigo-green); color: #fff; }

        .pp-my-listings-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .pp-mli-card {
          display: block; border: 1px solid var(--border); border-radius: 14px; overflow: hidden;
          transition: box-shadow 0.15s ease, transform 0.15s ease;
        }
        .pp-mli-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
        .pp-mli-thumb {
          position: relative; width: 100%; aspect-ratio: 4 / 3; background-size: cover; background-position: center;
        }
        .pp-mli-thumb.dusk { background: linear-gradient(135deg, #24406B, #6B4A8A 60%, #C98A3B); }
        .pp-mli-thumb.forest { background: linear-gradient(135deg, #0F3D3A, #1E6E5C 55%, #4C9A6B); }
        .pp-mli-thumb.meadow { background: linear-gradient(135deg, #1B4332, #3F7A57 55%, #86A662); }
        .pp-mli-status-dot {
          position: absolute; top: 8px; right: 8px; width: 10px; height: 10px; border-radius: 50%;
          border: 2px solid #fff; box-shadow: 0 0 0 1px rgba(0,0,0,0.06);
        }
        .pp-mli-status-dot.approved { background: var(--izigo-green); }
        .pp-mli-status-dot.pending { background: #FFB800; }
        .pp-mli-status-dot.rejected { background: #E0553F; }
        .pp-mli-body { padding: 10px; }
        .pp-mli-title {
          font-size: 12.5px; font-weight: 700; color: var(--text); line-height: 1.35;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 34px;
        }
        .pp-mli-meta { font-size: 10.5px; color: var(--text-soft); margin-top: 4px; }
        .pp-mli-price { font-size: 12.5px; font-weight: 800; color: var(--text); margin-top: 4px; }

        /* Layout */
        .pp-layout { display: grid; grid-template-columns: 1fr 300px; gap: 24px; margin-top: 24px; align-items: start; }

        .pp-card {
          border: 1px solid var(--border); border-radius: 14px; padding: 24px; background: var(--bg);
          transition: box-shadow 0.15s ease;
        }
        .pp-card h2 { font-size: 16px; font-weight: 800; margin: 0 0 4px; }
        .pp-card-subtitle { font-size: 12.5px; color: var(--text-soft); margin: 0 0 18px; }

        .pp-field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .pp-field { display: flex; flex-direction: column; gap: 6px; }
        .pp-field.full { grid-column: 1 / -1; }
        .pp-field label { font-size: 12.5px; font-weight: 700; color: var(--text); display: flex; align-items: center; gap: 5px; }
        .pp-field input, .pp-field select {
          border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; height: 44px;
          font-size: 14px; color: var(--text); font-family: var(--sans); width: 100%;
          transition: border-color 0.15s ease;
        }
        .pp-field input:focus, .pp-field select:focus { border-color: var(--izigo-green); outline: none; }
        .pp-field input:disabled { color: var(--text-soft); background: var(--bg-soft); }

        .pp-note { font-size: 12px; color: var(--text-soft); margin: 14px 0 0; line-height: 1.5; }
        .pp-password-message { font-size: 12.5px; color: #E0553F; margin-top: 4px; }

        .pp-admin-link {
          display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 700;
          color: var(--izigo-green); margin-top: 6px;
        }
        .pp-admin-link:hover { text-decoration: underline; }

        /* Sidebar cards */
        .pp-completion-bar { height: 8px; border-radius: 999px; background: var(--bg-soft); overflow: hidden; margin: 10px 0 12px; }
        .pp-completion-fill { height: 100%; background: var(--izigo-green); border-radius: 999px; transition: width 0.2s ease; }
        .pp-completion-percent { font-size: 20px; font-weight: 800; }
        .pp-completion-remaining { font-size: 12px; color: var(--text-soft); font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; margin: 12px 0 6px; }
        .pp-completion-list { display: flex; flex-direction: column; gap: 8px; font-size: 13px; color: var(--text); }
        .pp-completion-list li { display: flex; align-items: center; gap: 8px; list-style: none; }
        .pp-completion-list li::before { content: ""; width: 5px; height: 5px; border-radius: 50%; background: var(--izigo-orange); flex-shrink: 0; }

        .pp-founder-list { display: flex; flex-direction: column; gap: 8px; font-size: 13px; color: var(--text); margin-top: 4px; }
        .pp-founder-item { display: flex; align-items: center; gap: 8px; }
        .pp-founder-item.done { color: var(--izigo-green); font-weight: 700; }
        .pp-founder-item .pp-founder-icon-done { color: var(--izigo-green); flex-shrink: 0; }
        .pp-founder-item .pp-founder-icon-pending { color: var(--text-soft); flex-shrink: 0; }
        .pp-founder-card { border-color: var(--izigo-orange); }
        .pp-founder-badge-row { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 800; margin-bottom: 4px; }
        .pp-founder-vip-until { font-size: 12.5px; color: var(--text-soft); margin-bottom: 14px; }
        .pp-founder-benefit { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--izigo-green); font-weight: 700; padding: 4px 0; }

        .pp-quick-list { display: flex; flex-direction: column; gap: 4px; }
        .pp-quick-link {
          display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px;
          font-size: 13.5px; font-weight: 600; color: var(--text); transition: background 0.15s ease;
        }
        .pp-quick-link:hover { background: var(--bg-soft); }
        .pp-quick-link svg { color: var(--izigo-green); flex-shrink: 0; }

        /* Sticky save bar */
        .pp-save-bar {
          position: sticky; bottom: 0; margin-top: 24px; display: flex; align-items: center; justify-content: space-between;
          gap: 16px; background: var(--bg); border: 1px solid var(--border); border-radius: 14px; padding: 14px 20px;
          box-shadow: 0 -4px 16px rgba(20, 30, 28, 0.06);
        }
        .pp-save-status { display: flex; align-items: center; gap: 6px; font-size: 13.5px; font-weight: 700; color: var(--text-soft); }
        .pp-save-status.dirty { color: var(--izigo-orange); }
        .pp-save-status.saved { color: var(--izigo-green); }
        .pp-save {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          background: var(--izigo-orange); color: #fff; border: none; border-radius: 10px;
          padding: 13px 26px; font-weight: 700; font-size: 14px; cursor: pointer; white-space: nowrap;
        }
        .pp-save:disabled { opacity: 0.5; cursor: not-allowed; }

        @media (max-width: 860px) {
          .pp-layout { grid-template-columns: 1fr; }
          .pp-hero { flex-direction: column; align-items: flex-start; }
          .pp-stat-grid { grid-template-columns: repeat(2, 1fr); width: 100%; }
          .pp-field-grid { grid-template-columns: 1fr; }
          .pp-save-bar { flex-direction: column; align-items: stretch; text-align: center; }
        }

        .pp-stat-icon { display: none; }
        .pp-quick-chevron { display: none; }

        @media (max-width: 640px) {
          .pp-hero { padding: 18px; border-radius: 18px; gap: 14px; }
          .pp-avatar { width: 60px; height: 60px; font-size: 20px; }
          .pp-hero h1 { font-size: 17px; }
          .pp-stat-grid { gap: 10px 16px; padding-top: 14px; margin-top: 6px; border-top: 1px solid var(--border); }
          .pp-stat-card {
            padding: 0; border: none; border-radius: 0; background: transparent; min-width: 0; text-align: left;
            display: grid; grid-template-columns: 14px 1fr; column-gap: 5px; row-gap: 2px; align-items: center;
          }
          .pp-stat-icon {
            display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px;
            border-radius: 50%; position: static; margin: 0; flex-shrink: 0;
            grid-row: 1; grid-column: 1;
          }
          .pp-stat-icon svg { width: 9px; height: 9px; }
          .pp-stat-icon-member { background: rgba(0,200,151,0.14); color: var(--izigo-green); }
          .pp-stat-icon-listings { background: rgba(255,166,0,0.16); color: var(--izigo-orange); }
          .pp-stat-icon-reviews { background: rgba(255,184,0,0.18); color: #B8860B; }
          .pp-stat-icon-whatsapp { background: rgba(37,211,102,0.16); color: #25D366; }
          .pp-stat-label {
            font-size: 9.5px; font-weight: 600; text-transform: none; letter-spacing: 0; color: var(--text-soft);
            grid-row: 1; grid-column: 2;
          }
          .pp-stat-card .pp-stat-value {
            font-size: 13px; font-weight: 700; margin-top: 0; padding-right: 0; color: var(--text);
            grid-row: 2; grid-column: 1 / -1;
          }

          .pp-settings-fab {
            display: flex; align-items: center; justify-content: center;
            position: absolute; top: 14px; right: 14px; width: 34px; height: 34px;
            border-radius: 50%; border: 1px solid var(--border); background: var(--bg-soft);
            color: var(--text); cursor: pointer; z-index: 2; padding: 0;
          }

          .pp-settings-overlay {
            position: fixed; inset: 0; z-index: 300; background: var(--bg);
            transform: translateX(100%); transition: transform 0.25s ease;
            overflow-y: auto; padding: 16px 18px 40px;
          }
          .pp-settings-overlay.is-open { transform: translateX(0); }

          .pp-settings-header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
          .pp-settings-header h1 { font-size: 16px; font-weight: 800; margin: 0; }
          .pp-settings-back {
            display: flex; align-items: center; justify-content: center;
            width: 34px; height: 34px; border-radius: 50%; border: none;
            background: var(--bg-soft); color: var(--text); cursor: pointer; flex-shrink: 0; padding: 0;
          }

          .pp-role-row { padding: 12px 14px; margin-top: 0; border-radius: 12px; }
          .pp-role-chip { font-size: 13px; gap: 8px; }
          .pp-role-btn { padding: 7px 12px; font-size: 11.5px; }

          .pp-my-listings { margin-top: 12px; }
          .pp-mf-filters { margin-bottom: 10px; }
          .pp-mf-chip { padding: 5px 12px; font-size: 11.5px; }
          .pp-my-listings-grid { gap: 8px; }
          .pp-mli-body { padding: 8px; }
          .pp-mli-title { font-size: 12px; min-height: 32px; }
          .pp-mli-meta { font-size: 10px; }
          .pp-mli-price { font-size: 12px; }

          .pp-card { padding: 16px; border-radius: 16px; }
          .pp-card h2 { font-size: 14.5px; }
          .pp-card-subtitle { display: none; }
          .pp-field-grid { gap: 0; }
          .pp-field {
            flex-direction: row; align-items: center; justify-content: space-between; gap: 10px;
            padding: 13px 0; border-bottom: 1px solid var(--border);
          }
          .pp-field:last-child { border-bottom: none; }
          .pp-field label { font-size: 12.5px; color: var(--text-soft); font-weight: 600; flex-shrink: 0; }
          .pp-field input, .pp-field select {
            border: none; padding: 0; height: auto; text-align: right; font-weight: 700; font-size: 14px; background: transparent;
          }
          .pp-field input:disabled { background: transparent; }
          .pp-field.full { flex-direction: column; align-items: stretch; }
          .pp-field.full input { text-align: left; }

          .pp-quick-link { position: relative; }
          .pp-quick-chevron { display: inline-block; margin-left: auto; color: var(--text-soft); }
        }
      `}</style>

      <div className="pp-hero">
        <button type="button" className="pp-settings-fab" onClick={() => setSettingsOpen(true)} aria-label={t("profilePage.settingsTitle")}>
          <Settings size={17} />
        </button>
        <div className="pp-hero-left">
          <div className="pp-avatar">{initials}</div>
          <div>
            <h1>{user?.name}</h1>
            <div className="pp-badge-row">
              <span className="pp-role">{roleLabel}</span>
            </div>
            {user?.role === "admin" && (
              <Link to="/admin" className="pp-admin-link"><LayoutDashboard size={13} />{t("profilePage.backToAdmin")}</Link>
            )}
          </div>
        </div>
        <div className="pp-stat-grid">
          <div className="pp-stat-card">
            <div className="pp-stat-icon pp-stat-icon-member"><Calendar size={13} /></div>
            <div className="pp-stat-label">{t("profilePage.memberSince")}</div>
            <div className="pp-stat-value">{monthYear(user?.createdAt, language)}</div>
          </div>
          <div className="pp-stat-card">
            <div className="pp-stat-icon pp-stat-icon-listings"><ListChecks size={13} /></div>
            <div className="pp-stat-label">{t("profilePage.listingsLabel")}</div>
            <div className="pp-stat-value">{statsError ? "—" : stats.listings}</div>
          </div>
          <div className="pp-stat-card">
            <div className="pp-stat-icon pp-stat-icon-reviews"><Star size={13} /></div>
            <div className="pp-stat-label">{t("profilePage.reviewsLabel")}</div>
            <div className="pp-stat-value">{stats.rating ? `${stats.rating} ★ (${stats.reviewCount})` : "—"}</div>
          </div>
          <div className={`pp-stat-card${whatsappConnected ? " connected" : ""}`}>
            <div className="pp-stat-icon pp-stat-icon-whatsapp"><MessageCircle size={13} /></div>
            <div className="pp-stat-label">WhatsApp</div>
            <div className="pp-stat-value">{whatsappConnected ? `${t("profilePage.whatsappConnected")} ✓` : "—"}</div>
          </div>
        </div>
      </div>

      <div className="pp-card pp-my-listings">
        <div className="pp-my-listings-head">
          <h2>{t("profilePage.myListingsTitle")}</h2>
          {myListings.length > 0 && <Link to="/my-listings" className="pp-my-listings-viewall">{t("profilePage.viewAll")}</Link>}
        </div>
        {myListingsLoading ? null : myListings.length === 0 ? (
          <p className="pp-my-listings-empty">{t("profilePage.myListingsEmpty")}</p>
        ) : (
          <>
            <div className="pp-mf-filters">
              <button
                type="button"
                className={`pp-mf-chip${myListingsFilter === "all" ? " active" : ""}`}
                onClick={() => setMyListingsFilter("all")}
              >
                {t("profilePage.filterAll")} {myListings.length}
              </button>
              {["approved", "pending", "rejected"].map((statusKey) => (
                myListingsCounts[statusKey] > 0 && (
                  <button
                    key={statusKey}
                    type="button"
                    className={`pp-mf-chip${myListingsFilter === statusKey ? " active" : ""}`}
                    onClick={() => setMyListingsFilter(statusKey)}
                  >
                    {t(`myListingsPage.status.${statusKey}`)} {myListingsCounts[statusKey]}
                  </button>
                )
              ))}
            </div>
            <div className="pp-my-listings-grid">
              {filteredMyListings.map((item) => (
                <Link to={`/edit-listing/${item.id}`} className="pp-mli-card" key={item.id}>
                  <div className={`pp-mli-thumb ${item.image ? "" : item.tone}`} style={item.image ? { backgroundImage: `url("${item.image}")` } : undefined}>
                    <span className={`pp-mli-status-dot ${item.status}`} />
                  </div>
                  <div className="pp-mli-body">
                    <div className="pp-mli-title">{item.title?.[language] || item.title?.en}</div>
                    <div className="pp-mli-meta">
                      {t(CATEGORY_NAV_KEY[item.type])}{item.city ? ` · ${item.city}` : ""}
                    </div>
                    <div className="pp-mli-price">
                      {item.price === 0 ? t("eventsPage.free") : item.price ? formatPrice(item.price) : ""}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      <div className={`pp-settings-overlay${settingsOpen ? " is-open" : ""}`}>
        <div className="pp-settings-header">
          <button type="button" className="pp-settings-back" onClick={() => setSettingsOpen(false)} aria-label={t("listingGallery.back")}>
            <ArrowLeft size={20} />
          </button>
          <h1>{t("profilePage.settingsTitle")}</h1>
        </div>

        <div className="pp-role-row">
          <div className="pp-role-chip">
            {user?.role === "admin" ? <LayoutDashboard size={18} /> : <Home size={18} />}
            <span>{roleLabel}</span>
          </div>
          {user?.role === "admin" ? (
            <Link to="/admin" className="pp-role-btn">{t("profilePage.backToAdmin")}</Link>
          ) : (
            <Link to="/add-listing" className="pp-role-btn"><PlusCircle size={14} />{t("profilePage.quickAddListing")}</Link>
          )}
        </div>

        <form onSubmit={handleSubmit}>
        <div className="pp-layout">
          <div className="pp-section-gap">
            <div className="pp-card">
              <h2>{t("profilePage.sectionPersonal")}</h2>
              <p className="pp-card-subtitle">{t("profilePage.note")}</p>
              <div className="pp-field-grid">
                <div className="pp-field full">
                  <label><User size={13} />{t("profilePage.nameLabel")}</label>
                  <input type="text" value={name} onChange={markDirty(setName)} />
                </div>
                <div className="pp-field">
                  <label><Mail size={13} />{t("profilePage.emailLabel")}</label>
                  <input type="email" value={email} disabled />
                </div>
                <div className="pp-field">
                  <label><Phone size={13} />{t("profilePage.phoneLabel")}</label>
                  <input type="tel" value={phone} onChange={markDirty(setPhone)} />
                </div>
                <div className="pp-field">
                  <label><Coins size={13} />{t("profilePage.currencyLabel")}</label>
                  <input type="text" value={currency} disabled />
                </div>
              </div>
            </div>

            <div className="pp-card">
              <h2>{t("profilePage.sectionContact")}</h2>
              <div className="pp-field-grid">
                <div className="pp-field">
                  <label><MessageCircle size={13} />{t("profilePage.whatsappLabel")}</label>
                  <input type="tel" value={whatsapp} onChange={markDirty(setWhatsapp)} />
                </div>
                <div className="pp-field">
                  <label><Send size={13} />{t("profilePage.telegramLabel")}</label>
                  <input type="text" value={telegram} onChange={markDirty(setTelegram)} />
                </div>
                <div className="pp-field full">
                  <label><Globe size={13} />{t("profilePage.websiteLabel")}</label>
                  <input type="url" value={website} onChange={markDirty(setWebsite)} />
                </div>
              </div>
            </div>

            <div className="pp-card">
              <h2>{t("profilePage.sectionSecurity")}</h2>
              <div className="pp-field-grid">
                <div className="pp-field full">
                  <label>{t("profilePage.currentPasswordLabel")}</label>
                  <input type="password" value={currentPassword} onChange={markDirty(setCurrentPassword)} autoComplete="current-password" />
                </div>
                <div className="pp-field">
                  <label>{t("profilePage.newPasswordLabel")}</label>
                  <input type="password" value={newPassword} onChange={markDirty(setNewPassword)} autoComplete="new-password" />
                </div>
                <div className="pp-field">
                  <label>{t("profilePage.confirmPasswordLabel")}</label>
                  <input type="password" value={confirmPassword} onChange={markDirty(setConfirmPassword)} autoComplete="new-password" />
                </div>
              </div>
              {passwordMessage && <p className="pp-password-message">{passwordMessage}</p>}
            </div>
          </div>

          <div className="pp-section-gap">
            <div className="pp-card">
              <h2>{t("profilePage.completionTitle")}</h2>
              <div className="pp-completion-percent">{completion.percent}%</div>
              <div className="pp-completion-bar"><div className="pp-completion-fill" style={{ width: `${completion.percent}%` }} /></div>
              {completion.remaining.length > 0 && (
                <>
                  <div className="pp-completion-remaining">{t("profilePage.completionRemainingLabel")}</div>
                  <ul className="pp-completion-list">
                    {completion.remaining.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </>
              )}
            </div>

            {user?.founderHost ? (
              <div className="pp-card pp-founder-card">
                <div className="pp-founder-badge-row"><Award size={18} color="var(--izigo-orange)" />🏅 Founder Host</div>
                <div className="pp-founder-badge-row"><Crown size={16} color="var(--izigo-orange)" />👑 Launch VIP Active</div>
                <p className="pp-founder-vip-until">
                  VIP Valid Until: {user.vipExpiresAt ? new Date(user.vipExpiresAt).toLocaleDateString() : "—"}
                </p>
                <div className="pp-founder-benefit"><Check size={14} />Founder Badge</div>
                <div className="pp-founder-benefit"><Check size={14} />Launch VIP Membership</div>
                <div className="pp-founder-benefit"><Check size={14} />Priority Visibility</div>
              </div>
            ) : (
              <div className="pp-card">
                <h2>Founder Progress</h2>
                <div className="pp-founder-list">
                  <div className="pp-founder-item done"><Check size={15} className="pp-founder-icon-done" />Account Created</div>
                  <div className={`pp-founder-item${phone ? " done" : ""}`}>
                    {phone ? <Check size={15} className="pp-founder-icon-done" /> : <Circle size={13} className="pp-founder-icon-pending" />}
                    Profile Completed
                  </div>
                  <div className={`pp-founder-item${stats.listings > 0 ? " done" : ""}`}>
                    {stats.listings > 0 ? <Check size={15} className="pp-founder-icon-done" /> : <Circle size={13} className="pp-founder-icon-pending" />}
                    First Listing Published
                  </div>
                  <div className={`pp-founder-item${user?.verified ? " done" : ""}`}>
                    {user?.verified ? <Check size={15} className="pp-founder-icon-done" /> : <Circle size={13} className="pp-founder-icon-pending" />}
                    Profile Ready
                  </div>
                  <div className="pp-founder-item">🎁 Founder Benefits Unlocked</div>
                </div>
              </div>
            )}

            <div className="pp-card">
              <h2>{t("profilePage.quickActionsTitle")}</h2>
              <div className="pp-quick-list">
                {QUICK_ACTIONS.map(({ key, to, icon: Icon }) => (
                  <Link key={key} to={to} className="pp-quick-link">
                    <Icon size={16} />{t(`profilePage.${key}`)}
                    <ChevronRight size={15} className="pp-quick-chevron" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="pp-save-bar">
          <span className={`pp-save-status ${saved ? "saved" : dirty ? "dirty" : ""}`}>
            {saved ? <><Check size={15} />{t("profilePage.saved")}</> : dirty ? t("profilePage.unsavedChanges") : t("profilePage.allSaved")}
          </span>
          {saveError && <p className="pp-password-message">{saveError}</p>}
          <button type="submit" className="pp-save" disabled={!dirty || saving}>{t("profilePage.save")}</button>
        </div>
      </form>

        <button type="button" className="pp-logout-btn" onClick={logout}>
          <LogOut size={16} />{t("sidebar.logout")}
        </button>
      </div>
    </div>
  );
}
