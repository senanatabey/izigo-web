import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  User, Mail, Phone, MessageCircle, Send, Globe, ShieldCheck, Check, Circle,
  Star, PlusCircle, ListChecks, Bell, Heart, Languages, Coins, LayoutDashboard,
  Award, Crown,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useCurrency } from "../../i18n/CurrencyContext";
import { useAuth } from "../../App";
import { supabase } from "../../lib/supabaseClient";
import { fetchListingRatings } from "../../lib/listings";

const QUICK_ACTIONS = [
  { key: "quickAddListing", to: "/add-listing", icon: PlusCircle },
  { key: "quickMyListings", to: "/my-listings", icon: ListChecks },
  { key: "quickReviews", to: "/reviews", icon: Star },
  { key: "quickNotifications", to: "/notifications", icon: Bell },
  { key: "quickSaved", to: "/saved", icon: Heart },
];

function monthYear(dateStr, language) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(language === "az" ? "az-AZ" : "en-US", { month: "long", year: "numeric" });
}

export default function ProfilePage() {
  const { t, language } = useLanguage();
  const { currency } = useCurrency();
  const { user, refreshUser } = useAuth();

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

  useEffect(() => {
    if (!user?.id) return;
    supabase.from("listings").select("id").eq("host_id", user.id).then(async ({ data: listings }) => {
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

  const markDirty = (setter) => (e) => { setter(e.target.value); setDirty(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from("profiles").update({ full_name: name, phone }).eq("id", user.id);

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

  return (
    <div className="profile-page">
      <style>{`
        .profile-page { max-width: 980px; margin: 0 auto; }
        .pp-section-gap { display: flex; flex-direction: column; gap: 24px; }

        /* Hero card */
        .pp-hero {
          border: 1px solid var(--border); border-radius: 16px; padding: 28px; background: var(--bg);
          box-shadow: var(--shadow-sm); display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 24px;
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
      `}</style>

      <div className="pp-hero">
        <div className="pp-hero-left">
          <div className="pp-avatar">{initials}</div>
          <div>
            <h1>{user?.name}</h1>
            <div className="pp-badge-row">
              <span className="pp-badge"><ShieldCheck size={13} />{t("villaDetail.hostBadge")}</span>
              <span className="pp-role">{roleLabel}</span>
            </div>
            {user?.role === "admin" && (
              <Link to="/admin" className="pp-admin-link"><LayoutDashboard size={13} />{t("profilePage.backToAdmin")}</Link>
            )}
          </div>
        </div>
        <div className="pp-stat-grid">
          <div className="pp-stat-card">
            <div className="pp-stat-label">{t("profilePage.memberSince")}</div>
            <div className="pp-stat-value">{monthYear(user?.createdAt, language)}</div>
          </div>
          <div className="pp-stat-card">
            <div className="pp-stat-label">{t("profilePage.listingsLabel")}</div>
            <div className="pp-stat-value">{stats.listings}</div>
          </div>
          <div className="pp-stat-card">
            <div className="pp-stat-label">{t("profilePage.reviewsLabel")}</div>
            <div className="pp-stat-value">{stats.rating ? `${stats.rating} ★ (${stats.reviewCount})` : "—"}</div>
          </div>
          <div className={`pp-stat-card${whatsappConnected ? " connected" : ""}`}>
            <div className="pp-stat-label">WhatsApp</div>
            <div className="pp-stat-value">{whatsappConnected ? `${t("profilePage.whatsappConnected")} ✓` : "—"}</div>
          </div>
        </div>
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
                  <label><Languages size={13} />{t("profilePage.languageLabel")}</label>
                  <input type="text" value={language === "az" ? "Azərbaycan" : "English"} disabled />
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
                    Host Verified
                  </div>
                  <div className="pp-founder-item">🎁 Founder Benefits Unlocked</div>
                </div>
              </div>
            )}

            <div className="pp-card">
              <h2>{t("profilePage.quickActionsTitle")}</h2>
              <div className="pp-quick-list">
                {QUICK_ACTIONS.map(({ key, to, icon: Icon }) => (
                  <Link key={key} to={to} className="pp-quick-link"><Icon size={16} />{t(`profilePage.${key}`)}</Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="pp-save-bar">
          <span className={`pp-save-status ${saved ? "saved" : dirty ? "dirty" : ""}`}>
            {saved ? <><Check size={15} />{t("profilePage.saved")}</> : dirty ? t("profilePage.unsavedChanges") : t("profilePage.allSaved")}
          </span>
          <button type="submit" className="pp-save" disabled={!dirty || saving}>{t("profilePage.save")}</button>
        </div>
      </form>
    </div>
  );
}
