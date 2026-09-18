import React, { createContext, useContext, useEffect, useState, Suspense, lazy } from "react";
import {
  BrowserRouter, Routes, Route, Outlet, Navigate, Link, NavLink, useLocation, useParams, useNavigate,
} from "react-router-dom";
import {
  Home as HomeIcon, Heart, User, ListChecks, Package,
  PlusCircle, Star, LayoutDashboard, Users, ClipboardList, BarChart3,
  ShieldCheck, LogOut, X, Sparkles, Bell, Settings, ChevronDown, Globe, ArrowLeft,
  Map, MapPin, HelpCircle, FileText, Image as ImageIcon, Compass, Trophy,
  Handshake, Megaphone, Wallet, DollarSign, Receipt, MessageSquareText, Share2,
} from "lucide-react";
import "./App.css";
import "./rtl.css";
import LoginForm from "./pages/Auth/LoginForm";
import RegisterForm from "./pages/Auth/RegisterForm";
import { LanguageProvider, useLanguage } from "./i18n/LanguageContext";
import { CurrencyProvider, useCurrency, CURRENCIES } from "./i18n/CurrencyContext";
import { LANGUAGES } from "./i18n/translations";
import { supabase } from "./lib/supabaseClient";
import { fetchMyPartnerProfile, fetchAgentRequests } from "./lib/regionalPartner";
import NotificationBell from "./components/NotificationBell";

/* =========================================================================
   ROUTE-LEVEL CODE SPLITTING
   Every page (as opposed to layout/shared chrome, which loads eagerly since
   it's needed on first paint regardless of route) is its own lazy chunk —
   visiting "/" never downloads the admin panel, the CMS editors, or the
   add-listing form, and vice versa. LoginForm/RegisterForm stay eager above
   since AuthModal can appear on top of any page, not behind a route.
   ========================================================================= */
const Home = lazy(() => import("./pages/Home/IzigoHomepage"));
const CityGuide = lazy(() => import("./pages/Destinations/CityGuide"));
const VillasPage = lazy(() => import("./pages/Villas/VillasPage"));
const VillaDetailPage = lazy(() => import("./pages/Villas/VillaDetail"));
const CarsPage = lazy(() => import("./pages/Cars/CarsPage"));
const CarDetailPage = lazy(() => import("./pages/Cars/CarDetail"));
const DealsPage = lazy(() => import("./pages/Deals/DealsPage"));
const SavedPage = lazy(() => import("./pages/Saved/SavedPage"));
const ProfilePage = lazy(() => import("./pages/Profile/ProfilePage"));
const WelcomePage = lazy(() => import("./pages/Welcome/WelcomePage"));
const MyListingsPage = lazy(() => import("./pages/MyListings/MyListingsPage"));
const NotificationsPage = lazy(() => import("./pages/Notifications/NotificationsPage"));
const TransfersPage = lazy(() => import("./pages/Transfers/TransfersPage"));
const TransferDetailPage = lazy(() => import("./pages/Transfers/TransferDetail"));
const EventsPage = lazy(() => import("./pages/Events/EventsPage"));
const EventDetailPage = lazy(() => import("./pages/Events/EventDetail"));
const ConciergePage = lazy(() => import("./pages/Concierge/ConciergePage"));
const ServiceDetailPage = lazy(() => import("./pages/Concierge/ServiceDetail"));
const PlanMyTripPage = lazy(() => import("./pages/PlanMyTrip/PlanMyTripPage"));
const LoginPage = lazy(() => import("./pages/Auth/LoginPage"));
const AddListingPage = lazy(() => import("./pages/AddListing/AddListingPage"));
const BecomeAHostPage = lazy(() => import("./pages/BecomeAHost/BecomeAHostPage"));
const AddListingFormPage = lazy(() => import("./pages/AddListing/AddListingFormPage"));
const RegisterPage = lazy(() => import("./pages/Auth/RegisterPage"));
const PendingApprovalsPage = lazy(() => import("./pages/Admin/PendingApprovalsPage"));
const AdminDashboardPage = lazy(() => import("./pages/Admin/DashboardPage"));
const AdminListingsPage = lazy(() => import("./pages/Admin/ListingsPage"));
const AdminUsersPage = lazy(() => import("./pages/Admin/UsersPage"));
const AdminReviewsPage = lazy(() => import("./pages/Admin/ReviewsPage"));
const AdminPendingReviewsPage = lazy(() => import("./pages/Admin/PendingReviewsPage"));
const AdminStatisticsPage = lazy(() => import("./pages/Admin/StatisticsPage"));
const AdminHeroCampaignsPage = lazy(() => import("./pages/Admin/HeroCampaignsPage"));
const FounderCampaignPage = lazy(() => import("./pages/Admin/FounderCampaignPage"));
const TripRequestsListPage = lazy(() => import("./pages/Admin/TripRequests/TripRequestsListPage"));
const TripRequestDetailPage = lazy(() => import("./pages/Admin/TripRequests/TripRequestDetailPage"));
const HostProfilePage = lazy(() => import("./pages/Host/HostProfilePage"));
const AllDestinationsPage = lazy(() => import("./pages/Destinations/AllDestinationsPage"));
const PlacesIndexPage = lazy(() => import("./pages/Places/PlacesIndexPage"));
const PlaceDetail = lazy(() => import("./pages/Places/PlaceDetail"));
const TravelGuidesPage = lazy(() => import("./pages/Admin/Content/TravelGuidesPage"));
const PlacesPage = lazy(() => import("./pages/Admin/Content/PlacesPage"));
const FaqPage = lazy(() => import("./pages/Admin/Content/FaqPage"));
const StaticPagesPage = lazy(() => import("./pages/Admin/Content/StaticPagesPage"));
const MediaLibraryPage = lazy(() => import("./pages/Admin/Content/MediaLibraryPage"));
const AdminRegionalPartnersPage = lazy(() => import("./pages/Admin/RegionalPartners/RegionalPartnersPage"));
const AdminAdCampaignsPage = lazy(() => import("./pages/Admin/RegionalPartners/AdCampaignsPage"));
const AdminPartnerPaymentsPage = lazy(() => import("./pages/Admin/RegionalPartners/PartnerPaymentsAdminPage"));
const PartnerDashboardPage = lazy(() => import("./pages/RegionalPartner/PartnerDashboardPage"));
const PartnerListingsPage = lazy(() => import("./pages/RegionalPartner/PartnerListingsPage"));
const PartnerRevenuePage = lazy(() => import("./pages/RegionalPartner/PartnerRevenuePage"));
const PartnerPaymentsPage = lazy(() => import("./pages/RegionalPartner/PartnerPaymentsPage"));
const AgentRequestsPage = lazy(() => import("./pages/RegionalPartner/AgentRequestsPage"));

/* =========================================================================
   AUTH — backed by Supabase Auth. Session lives in Supabase's own storage
   (it manages refresh tokens internally); the `user` shape we expose here
   ({ name, role }) is hydrated from the `profiles` table on every auth
   state change.
   ========================================================================= */
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null | { id, email, name, role: 'host' | 'admin' }
  const [loading, setLoading] = useState(true);

  const hydrateFromSession = async (session) => {
    if (!session?.user) {
      setUser(null);
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, role, phone, created_at, verified, founder_host, founder_granted_at, vip_expires_at, welcome_seen, agent_status")
      .eq("id", session.user.id)
      .single();
    setUser({
      id: session.user.id,
      email: session.user.email,
      name: profile?.full_name || session.user.email,
      role: profile?.role || "host",
      phone: profile?.phone || "",
      createdAt: profile?.created_at,
      lastSignInAt: session.user.last_sign_in_at,
      verified: profile?.verified || false,
      founderHost: profile?.founder_host || false,
      founderGrantedAt: profile?.founder_granted_at || null,
      vipExpiresAt: profile?.vip_expires_at || null,
      welcomeSeen: profile?.welcome_seen || false,
      agentStatus: profile?.agent_status || "none",
    });
  };

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    await hydrateFromSession(session);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      hydrateFromSession(session).finally(() => setLoading(false));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      hydrateFromSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const register = async (email, password, name, phone, wantsAgent, region, agencyName, managedPropertiesCount) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          phone,
          host_type: wantsAgent ? "agent" : "owner",
          wants_agent: !!wantsAgent,
          region: wantsAgent ? region || null : null,
          agency_name: wantsAgent ? agencyName || null : null,
          managed_properties_count: wantsAgent ? managedPropertiesCount || null : null,
        },
      },
    });
    if (error) throw error;
    return { needsEmailConfirmation: !data.session };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const value = { user, isAuthenticated: !!user, loading, login, register, logout, refreshUser };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/* =========================================================================
   AUTH MODAL — Airbnb-style login/signup overlay, triggered from anywhere
   via useAuthModal().openLogin() instead of navigating to /login.
   ========================================================================= */
const AuthModalContext = createContext(null);

function AuthModalProvider({ children }) {
  const [mode, setMode] = useState(null); // null | "login" | "register"
  const value = {
    mode,
    openLogin: () => setMode("login"),
    openRegister: () => setMode("register"),
    close: () => setMode(null),
  };
  return <AuthModalContext.Provider value={value}>{children}</AuthModalContext.Provider>;
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within AuthModalProvider");
  return ctx;
}

function AuthModal() {
  const { t } = useLanguage();
  const { mode, openLogin, openRegister, close } = useAuthModal();

  useEffect(() => {
    if (!mode) return undefined;
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mode]);

  if (!mode) return null;

  return (
    <div className="auth-modal-overlay" onClick={close}>
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="auth-modal-close" onClick={close} aria-label="Close"><X size={18} /></button>
        {mode === "login" ? (
          <LoginForm
            onSuccess={close}
            footerSwitch={
              <p className="ap-switch">
                {t("auth.noAccount")} <button type="button" onClick={openRegister}>{t("auth.signUpLink")}</button>
              </p>
            }
          />
        ) : (
          <RegisterForm
            onSuccess={close}
            footerSwitch={
              <p className="ap-switch">
                {t("auth.haveAccount")} <button type="button" onClick={openLogin}>{t("auth.loginLink")}</button>
              </p>
            }
          />
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   SAVED — in-memory only (no localStorage), keyed by "type:id" e.g. "villa:v1".
   ========================================================================= */
const SavedContext = createContext(null);

function SavedProvider({ children }) {
  const [saved, setSaved] = useState([]); // [{ type, id }]

  const isSaved = (type, id) => saved.some((s) => s.type === type && s.id === id);

  const toggleSaved = (type, id) => {
    setSaved((prev) => (
      prev.some((s) => s.type === type && s.id === id)
        ? prev.filter((s) => !(s.type === type && s.id === id))
        : [...prev, { type, id }]
    ));
  };

  const value = { saved, isSaved, toggleSaved };
  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved() {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error("useSaved must be used within SavedProvider");
  return ctx;
}

/* =========================================================================
   ROUTE GUARDS
   ========================================================================= */
function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return <RouteFallback />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}

function RequireGuest({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <RouteFallback />;
  if (isAuthenticated) return <Navigate to="/profile" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

// Deliberately its own guard, not "RequireAdmin OR regional_partner" — a
// regional partner is a distinct, region-scoped role and must never satisfy
// an admin check anywhere in the app.
function RequireRegionalPartner({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <RouteFallback />;
  if (!user || user.role !== "regional_partner") return <Navigate to="/" replace />;
  return children;
}

/* =========================================================================
   LOGO — shared between navbar, auth card and sidebars
   ========================================================================= */
function IzigoLogo() {
  return <img src="/images/logos/logo-navbar.png" alt="IZIGO" className="app-logo-img" />;
}

function IzigoLogoDark() {
  return <img src="/images/logos/logo-dark.png" alt="IZIGO" className="app-logo-img app-logo-img-dark" />;
}

/* Shared by AppLayout and AdminLayout so both panel sidebars stay in sync —
   edit here once instead of in two places. */
function SidebarHeader() {
  const { t } = useLanguage();
  return (
    <div className="sidebar-header">
      <Link to="/" className="sidebar-header-logo"><IzigoLogoDark /></Link>
      <Link to="/" className="sidebar-back-link"><ArrowLeft size={14} /><span>{t("sidebar.backToSite")}</span></Link>
    </div>
  );
}

const MAIN_NAV_ITEMS = [
  { to: "/villas", key: "villas" },
  { to: "/cars", key: "cars" },
  { to: "/transfers", key: "transfers" },
  { to: "/concierge", key: "concierge" },
];

function ExperienceRedirect() {
  const { id } = useParams();
  return <Navigate to={`/transfers/${id}`} replace />;
}

function LocaleSwitcher({ className = "" }) {
  const { language, setLanguage } = useLanguage();
  const { currency, setCurrency, setCurrencyForLanguage } = useCurrency();
  const [open, setOpen] = useState(false);
  const rootRef = React.useRef(null);

  const activeLanguage = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  const handleLanguageChange = (code) => {
    setLanguage(code);
    setCurrencyForLanguage(code);
  };

  useEffect(() => {
    if (!open) return undefined;
    const onClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={`locale-switcher ${className}`} ref={rootRef}>
      <button
        type="button"
        className="locale-switcher-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Globe size={15} className="locale-switcher-globe" />
        <span>{activeLanguage.label} / {currency}</span>
        <ChevronDown size={13} className={`account-menu-chevron ${open ? "is-open" : ""}`} />
      </button>

      <div className={`locale-switcher-dropdown ${open ? "is-open" : ""}`} role="menu">
        <div className="locale-switcher-label">Language</div>
        <div className="locale-switcher-section">
          {LANGUAGES.map(({ code, fullLabel }) => (
            <button
              key={code}
              type="button"
              role="menuitemradio"
              aria-checked={code === language}
              className={`locale-switcher-item ${code === language ? "is-active" : ""}`}
              onClick={() => handleLanguageChange(code)}
            >
              {fullLabel}
            </button>
          ))}
        </div>

        <div className="locale-switcher-divider" />

        <div className="locale-switcher-label">Currency</div>
        <div className="locale-switcher-section">
          {CURRENCIES.map(({ code, symbol }) => (
            <button
              key={code}
              type="button"
              role="menuitemradio"
              aria-checked={code === currency}
              className={`locale-switcher-item ${code === currency ? "is-active" : ""}`}
              onClick={() => setCurrency(code)}
            >
              {code} ({symbol})
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const ACCOUNT_MENU_ITEMS = [
  { to: "/profile", key: "profile", icon: User },
  { to: "/my-listings", key: "myListings", icon: ListChecks },
  { to: "/add-listing", key: "addListing", icon: PlusCircle },
  { to: "/notifications", key: "notifications", icon: Bell },
];

const ACCOUNT_MENU_ADMIN_ITEMS = [
  { to: "/admin", label: "İdarə paneli", icon: LayoutDashboard },
  { to: "/admin/listings/pending", label: "Gözləyən təsdiqlər", icon: ClipboardList },
  { to: "/admin/listings", label: "Elanlar", icon: HomeIcon },
  { to: "/admin/users", label: "İstifadəçilər", icon: Users },
  { to: "/admin/reviews/pending", label: "Gözləyən Rəylər", icon: MessageSquareText },
  { to: "/admin/reviews", label: "Rəylər", icon: Star },
  { to: "/admin/statistics", label: "Statistika", icon: BarChart3 },
  { to: "/admin/hero", label: "Hero kampaniyaları", icon: Sparkles },
  { to: "/admin/trip-requests", label: "Səyahət Konsyerji", icon: Compass },
  { to: "/admin/founder-campaign", label: "Founder Kampaniyası", icon: Trophy },
];

const ACCOUNT_MENU_PARTNER_ITEMS = [
  { to: "/partner", key: "navDashboard", icon: LayoutDashboard },
  { to: "/partner/listings", key: "navListings", icon: HomeIcon },
  { to: "/partner/agent-requests", key: "navAgentRequests", icon: Users },
  { to: "/partner/revenue", key: "navRevenue", icon: DollarSign },
  { to: "/partner/payments", key: "navPayments", icon: Receipt },
];

function AccountMenu() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [newTripRequestsCount, setNewTripRequestsCount] = useState(0);
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);
  const [pendingAgentRequestsCount, setPendingAgentRequestsCount] = useState(0);
  const rootRef = React.useRef(null);
  const isAdmin = user?.role === "admin";
  const isRegionalPartner = user?.role === "regional_partner";

  useEffect(() => {
    if (!open) return undefined;
    const onClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false)
      .then(({ count }) => setUnreadCount(count || 0));
  }, [user?.id, open]);

  useEffect(() => {
    if (!isAdmin) return;
    supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")
      .then(({ count }) => setPendingCount(count || 0));
  }, [isAdmin, open]);

  useEffect(() => {
    if (!isAdmin) return;
    supabase
      .from("trip_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "new")
      .then(({ count }) => setNewTripRequestsCount(count || 0));
  }, [isAdmin, open]);

  useEffect(() => {
    if (!isAdmin) return;
    supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending_moderation")
      .then(({ count }) => setPendingReviewsCount(count || 0));
  }, [isAdmin, open]);

  useEffect(() => {
    if (!isRegionalPartner) return;
    fetchMyPartnerProfile().then((partner) => {
      if (!partner?.region) return;
      fetchAgentRequests(partner.region).then((rows) => setPendingAgentRequestsCount(rows.length));
    });
  }, [isRegionalPartner, open]);

  const close = () => setOpen(false);

  return (
    <div className="account-menu" ref={rootRef}>
      <button
        type="button"
        className="btn-outline account-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <User size={16} />
        <span>{t("nav.myAccount")}</span>
        {(unreadCount + pendingCount + newTripRequestsCount + pendingReviewsCount + pendingAgentRequestsCount) > 0 && <span className="account-menu-trigger-dot" />}
        <ChevronDown size={14} className={`account-menu-chevron ${open ? "is-open" : ""}`} />
      </button>

      <div className={`account-menu-dropdown ${open ? "is-open" : ""}`} role="menu">
        <div className="account-menu-section">
          {ACCOUNT_MENU_ITEMS.map(({ to, key, icon: Icon }) => (
            <Link key={to} to={to} role="menuitem" className="account-menu-item" onClick={close}>
              <Icon size={17} />
              <span>{t(`sidebar.${key}`)}</span>
              {key === "notifications" && unreadCount > 0 && (
                <span className="account-menu-badge">{unreadCount}</span>
              )}
            </Link>
          ))}
        </div>

        {isAdmin && (
          <>
            <div className="account-menu-divider" />
            <div className="account-menu-label">İdarəetmə</div>
            <div className="account-menu-section">
              {ACCOUNT_MENU_ADMIN_ITEMS.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to} role="menuitem" className="account-menu-item" onClick={close}>
                  <Icon size={17} />
                  <span>{label}</span>
                  {to === "/admin/listings/pending" && pendingCount > 0 && (
                    <span className="account-menu-badge">{pendingCount}</span>
                  )}
                  {to === "/admin/trip-requests" && newTripRequestsCount > 0 && (
                    <span className="account-menu-badge">{newTripRequestsCount}</span>
                  )}
                  {to === "/admin/reviews/pending" && pendingReviewsCount > 0 && (
                    <span className="account-menu-badge">{pendingReviewsCount}</span>
                  )}
                </Link>
              ))}
            </div>
          </>
        )}

        {isRegionalPartner && (
          <>
            <div className="account-menu-divider" />
            <div className="account-menu-label">{t("regionalPartner.navSectionLabel")}</div>
            <div className="account-menu-section">
              {ACCOUNT_MENU_PARTNER_ITEMS.map(({ to, key, icon: Icon }) => (
                <Link key={to} to={to} role="menuitem" className="account-menu-item" onClick={close}>
                  <Icon size={17} />
                  <span>{t(`regionalPartner.${key}`)}</span>
                  {to === "/partner/agent-requests" && pendingAgentRequestsCount > 0 && (
                    <span className="account-menu-badge">{pendingAgentRequestsCount}</span>
                  )}
                </Link>
              ))}
            </div>
          </>
        )}

        <div className="account-menu-divider" />
        <div className="account-menu-section">
          <Link to="/profile" role="menuitem" className="account-menu-item" onClick={close}>
            <Settings size={17} />
            <span>{t("sidebar.settings")}</span>
          </Link>
          <button
            type="button"
            role="menuitem"
            className="account-menu-item account-menu-item-danger"
            onClick={() => { close(); logout(); }}
          >
            <LogOut size={17} />
            <span>{t("sidebar.logout")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   LAYOUTS
   ========================================================================= */
/* Shared bottom tab bar (Home / Saved / + / Concierge / Account) — used by
   MainLayout (public pages, where it can hide on scroll-down) and AppLayout
   (account pages like Profile, where it must stay permanently visible). */
function BottomNav({ hidden = false }) {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { openLogin } = useAuthModal();
  const { saved } = useSaved();
  const favoritesCount = saved.length;

  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const addMenuRef = React.useRef(null);
  useEffect(() => {
    if (!addMenuOpen) return undefined;
    const onClickOutside = (e) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target)) setAddMenuOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setAddMenuOpen(false); };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [addMenuOpen]);

  return (
    <nav className={`app-bottom-nav${hidden ? " is-hidden" : ""}`}>
      <NavLink to="/" end className={({ isActive }) => `abn-item${isActive ? " is-active" : ""}`}>
        <HomeIcon size={22} />
        <span>{t("nav.home")}</span>
      </NavLink>
      <NavLink to="/saved" className={({ isActive }) => `abn-item${isActive ? " is-active" : ""}`}>
        <span className="abn-icon-wrap">
          <Heart size={22} />
          {favoritesCount > 0 && <span className="abn-badge">{favoritesCount > 99 ? "99+" : favoritesCount}</span>}
        </span>
        <span>{t("nav.saved")}</span>
      </NavLink>
      <div className="abn-cta-wrap" ref={addMenuRef}>
        {addMenuOpen && (
          <div className="abn-cta-menu">
            <Link to="/add-listing" className="abn-cta-menu-item" onClick={() => setAddMenuOpen(false)}>
              <PlusCircle size={18} />{t("nav.publish")}
            </Link>
            <Link to="/plan-my-trip" className="abn-cta-menu-item" onClick={() => setAddMenuOpen(false)}>
              <Sparkles size={18} />{t("heroButtons.planMyTrip")}
            </Link>
          </div>
        )}
        <button
          type="button"
          className={`abn-item abn-item-cta${addMenuOpen ? " is-open" : ""}`}
          aria-label={t("nav.publish")}
          onClick={() => setAddMenuOpen((v) => !v)}
        >
          <PlusCircle size={30} />
        </button>
      </div>
      <NavLink to="/concierge" className={({ isActive }) => `abn-item${isActive ? " is-active" : ""}`}>
        <Package size={22} />
        <span>{t("nav.concierge")}</span>
      </NavLink>
      {isAuthenticated ? (
        <NavLink to="/profile" className={({ isActive }) => `abn-item${isActive ? " is-active" : ""}`}>
          <User size={22} />
          <span>{t("nav.accountTab")}</span>
        </NavLink>
      ) : (
        <button type="button" className="abn-item" onClick={openLogin}>
          <User size={22} />
          <span>{t("nav.accountTab")}</span>
        </button>
      )}
    </nav>
  );
}

function MainLayout() {
  const { isAuthenticated } = useAuth();
  const { openLogin } = useAuthModal();
  const { t } = useLanguage();
  const { saved, isSaved, toggleSaved } = useSaved();
  const location = useLocation();
  const navigate = useNavigate();
  const favoritesCount = saved.length;
  // Elan detalı səhifələrində (villa/maşın/transfer/tədbir) mobil header-i
  // sıxlaşdırmaq üçün dil seçimi və "Yeni elan" düyməsini gizlədirik —
  // masaüstündə heç nə dəyişmir, CSS-dəki media query həll edir.
  const listingDetailMatch = location.pathname.match(/^\/(villas|cars|transfers|events|concierge)\/([^/]+)$/);
  const isListingDetailPage = !!listingDetailMatch;
  // Category LIST pages (/villas, /cars, /transfers, /events — no id) get the
  // same back-arrow + centered-logo mobile header as detail pages, but keep
  // the bottom tab bar (unlike single-listing detail pages).
  const isCategoryListPage = /^\/(villas|cars|transfers|events)$/.test(location.pathname);
  // URL seqmenti ("villas") ilə SaveHeart-in gözlədiyi tip adı ("villa")
  // fərqlidir — mobil başlıqdakı ürək düyməsi düzgün elanı saxlamaq üçün
  // uyğunlaşdırılır.
  const listingDetailType = listingDetailMatch && ({
    villas: "villa", cars: "car", transfers: "transfer", events: "event", concierge: "service",
  })[listingDetailMatch[1]];
  const listingDetailId = listingDetailMatch?.[2];
  const isListingSaved = listingDetailType && listingDetailId && isSaved(listingDetailType, listingDetailId);

  // Native paylaşma dəstəyi olmayan brauzerlərdə linki panoya kopyalayırıq.
  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: document.title, url: window.location.href }); } catch { /* ləğv edildi */ }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      alert(t("listingGallery.linkCopied"));
    }
  };

  // Compact + shadow only kick in past this scroll threshold — the navbar
  // itself is already `position: sticky` in CSS, this just toggles a class.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 120);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Aşağı naviqasiya aşağı sürüşdürəndə gizlənir, yuxarı sürüşdürəndə geri gəlir
  // (tap.az-dakı kimi) — ekranın çox yuxarısında (y <= 80) həmişə görünür.
  const [bottomNavHidden, setBottomNavHidden] = useState(false);
  const lastScrollYRef = React.useRef(0);
  useEffect(() => {
    const onBottomNavScroll = () => {
      const y = window.scrollY;
      const last = lastScrollYRef.current;
      if (y <= 80) setBottomNavHidden(false);
      else if (y > last + 4) setBottomNavHidden(true);
      else if (y < last - 4) setBottomNavHidden(false);
      lastScrollYRef.current = y;
    };
    window.addEventListener("scroll", onBottomNavScroll, { passive: true });
    return () => window.removeEventListener("scroll", onBottomNavScroll);
  }, []);

  return (
    <div>
      <header className={`app-navbar${scrolled ? " is-stuck" : ""}`}>
        <div className={`app-navbar-inner${isListingDetailPage ? " is-listing-detail" : ""}`}>
          <div className="app-navbar-left">
            <Link to="/"><IzigoLogo /></Link>
            <nav className="app-nav-links">
              {MAIN_NAV_ITEMS.map(({ to, key, matchTo }) => {
                const [toPath, toQuery] = to.split("?");
                const isActive = matchTo
                  ? location.pathname.startsWith(matchTo) && (location.search.slice(1) === toQuery)
                  : location.pathname.startsWith(toPath);
                return (
                  <Link key={key} to={to} className={isActive ? "active" : ""}>{t(`nav.${key}`)}</Link>
                );
              })}
            </nav>
          </div>
          <div className="app-nav-right">
            <LocaleSwitcher className={isListingDetailPage ? "is-hidden-on-detail-mobile" : ""} />
            <Link to="/saved" className="nav-icon-link nav-icon-link-favorites" aria-label={t("nav.saved")} data-tooltip={t("nav.saved")}>
              <Heart size={19} />
              {favoritesCount > 0 && <span className="nav-icon-badge">{favoritesCount > 99 ? "99+" : favoritesCount}</span>}
            </Link>
            {isAuthenticated ? (
              <AccountMenu />
            ) : (
              <button type="button" className="btn-outline" onClick={openLogin}>{t("nav.login")}</button>
            )}
            <Link
              to="/add-listing"
              className={`btn-primary${isListingDetailPage ? " is-hidden-on-detail-mobile" : ""}`}
            ><PlusCircle size={16} /><span>{t("nav.publish")}</span></Link>
          </div>
          {isListingDetailPage && (
            <div className="app-navbar-detail-mobile">
              <button type="button" className="app-navbar-detail-back" onClick={() => navigate(-1)} aria-label={t("listingGallery.back")}>
                <ArrowLeft size={20} />
              </button>
              <Link to="/" className="app-navbar-detail-logo"><IzigoLogo /></Link>
              <div className="app-navbar-detail-actions">
                <button
                  type="button"
                  className={`app-navbar-detail-heart${isListingSaved ? " is-saved" : ""}`}
                  aria-label={t("nav.saved")}
                  onClick={() => listingDetailType && listingDetailId && toggleSaved(listingDetailType, listingDetailId)}
                >
                  <Heart size={19} fill={isListingSaved ? "currentColor" : "none"} />
                </button>
                <button type="button" className="app-navbar-detail-share" onClick={handleShare} aria-label={t("listingGallery.share")}>
                  <Share2 size={19} />
                </button>
              </div>
            </div>
          )}
          {isCategoryListPage && (
            <div className="app-navbar-detail-mobile">
              <button type="button" className="app-navbar-detail-back" onClick={() => navigate(-1)} aria-label={t("listingGallery.back")}>
                <ArrowLeft size={20} />
              </button>
              <Link to="/" className="app-navbar-detail-logo"><IzigoLogo /></Link>
              <div className="app-navbar-detail-actions" style={{ width: 36 }} />
            </div>
          )}
          {!isListingDetailPage && !isCategoryListPage && (
            <div className="app-navbar-plain-mobile">
              <Link to="/" className="app-navbar-plain-mobile-logo"><IzigoLogo /></Link>
              <LocaleSwitcher className="app-navbar-plain-mobile-locale" />
            </div>
          )}
        </div>
      </header>
      {!isListingDetailPage && <BottomNav hidden={bottomNavHidden} />}
      <main className={!isListingDetailPage ? "has-bottom-nav" : ""}><Outlet /></main>
      <footer className="site-footer">
        <img src="/images/logos/logo-footer.png" alt="IZIGO" className="site-footer-logo" />
        <nav className="site-footer-explore">
          <span className="site-footer-explore-label">{t("footer.exploreHeading")}</span>
          <Link to="/destinations">{t("footer.travelGuides")}</Link>
          <Link to="/places">{t("footer.popularPlaces")}</Link>
          <Link to="/destinations">{t("footer.viewAllDestinations")}</Link>
        </nav>
        <p>© {new Date().getFullYear()} IZIGO. {t("footer.rights")}</p>
      </footer>
    </div>
  );
}

function AuthLayout() {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <Link to="/"><IzigoLogo /></Link>
        <Outlet />
      </div>
    </div>
  );
}

const APP_NAV_ITEMS = [
  { to: "/profile", key: "profile", icon: User },
  { to: "/my-listings", key: "myListings", icon: ListChecks },
  { to: "/add-listing", key: "addListing", icon: PlusCircle },
];

function AppLayout() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const isRegionalPartner = user?.role === "regional_partner";
  const [pendingAgentRequestsCount, setPendingAgentRequestsCount] = useState(0);

  useEffect(() => {
    if (!isRegionalPartner) return undefined;
    let cancelled = false;
    const load = () => {
      fetchMyPartnerProfile().then((partner) => {
        if (!partner?.region) return;
        fetchAgentRequests(partner.region).then((rows) => {
          if (!cancelled) setPendingAgentRequestsCount(rows.length);
        });
      });
    };
    load();
    const interval = setInterval(load, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [isRegionalPartner]);

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <SidebarHeader />
        {APP_NAV_ITEMS.map(({ to, key, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
          >
            <Icon size={17} />{t(`sidebar.${key}`)}
          </NavLink>
        ))}

        {isRegionalPartner && (
          <>
            <div className="sidebar-section-label">{t("regionalPartner.navSectionLabel")}</div>
            {ACCOUNT_MENU_PARTNER_ITEMS.map(({ to, key, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/partner"}
                className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
              >
                <Icon size={17} />{t(`regionalPartner.${key}`)}
                {to === "/partner/agent-requests" && pendingAgentRequestsCount > 0 && (
                  <span className="account-menu-badge">{pendingAgentRequestsCount}</span>
                )}
              </NavLink>
            ))}
          </>
        )}

        <NotificationBell userId={user?.id} />
        <LocaleSwitcher />
        <button className="sidebar-link logout" onClick={logout}><LogOut size={17} />{t("sidebar.logout")}</button>
      </aside>
      <main className="app-main has-bottom-nav">
        <p style={{ fontSize: 13, color: "var(--text-soft)", marginBottom: 18 }}>
          Signed in as <strong>{user?.name}</strong> ({user?.role})
        </p>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

/* "Add listing" needs to work for logged-out guests (public, tap.az-style —
   see the route comment below) AND for a logged-in user browsing from their
   profile panel. Rather than duplicate the page under two routes, this picks
   the right chrome (panel sidebar vs public navbar) around the same URL, so
   an authenticated user never leaves the panel shell to add a listing. */
function AddListingLayout() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <AppLayout /> : <MainLayout />;
}

const ADMIN_NAV_ITEMS = [
  { to: "/admin", label: "İdarə paneli", icon: LayoutDashboard, end: true },
  { to: "/admin/listings/pending", label: "Gözləyən təsdiqlər", icon: ClipboardList },
  { to: "/admin/listings", label: "Elanlar", icon: HomeIcon },
  { to: "/admin/users", label: "İstifadəçilər", icon: Users },
  { to: "/admin/reviews/pending", label: "Gözləyən Rəylər", icon: MessageSquareText },
  { to: "/admin/reviews", label: "Rəylər", icon: Star },
  { to: "/admin/statistics", label: "Statistika", icon: BarChart3 },
  { to: "/admin/hero", label: "Hero kampaniyaları", icon: Sparkles },
  { to: "/admin/trip-requests", label: "Səyahət Konsyerji", icon: Compass },
  { to: "/admin/founder-campaign", label: "Founder Kampaniyası", icon: Trophy },
];

// Stage 1 CMS foundation — admin-only CRUD, not yet wired to the public site.
const CONTENT_NAV_ITEMS = [
  { to: "/admin/content/guides", label: "Səyahət Bələdçiləri", icon: Map },
  { to: "/admin/content/places", label: "Yerlər", icon: MapPin },
  { to: "/admin/content/faq", label: "FAQ", icon: HelpCircle },
  { to: "/admin/content/pages", label: "Statik Səhifələr", icon: FileText },
  { to: "/admin/content/media", label: "Media Kitabxanası", icon: ImageIcon },
];

// Regional Partner program — admin side. Assigning partners/regions, entering
// ad revenue, and marking payouts paid all stay admin-only; a regional
// partner only ever reads what these pages produce, through its own /partner
// route tree and RLS, never through this one.
const REGIONAL_NAV_ITEMS = [
  { to: "/admin/regional-partners", label: "Regional Partnyorlar", icon: Handshake },
  { to: "/admin/ad-campaigns", label: "Reklam Kampaniyaları", icon: Megaphone },
  { to: "/admin/partner-payments", label: "Partnyor Ödənişləri", icon: Wallet },
];

function AdminProfileMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = React.useRef(null);
  const initials = (user?.name || "A").trim().slice(0, 1).toUpperCase();

  useEffect(() => {
    if (!open) return undefined;
    const onClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="admin-profile" ref={rootRef}>
      <button
        type="button"
        className="admin-profile-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="admin-profile-avatar">{initials}</span>
        <span className="admin-profile-text">
          <span className="admin-profile-name">{user?.name || "Admin"}</span>
          <span className="admin-profile-role">{user?.role === "admin" ? "Baş Admin" : user?.role}</span>
        </span>
        <ChevronDown size={14} className={`account-menu-chevron ${open ? "is-open" : ""}`} />
      </button>

      <div className={`admin-profile-dropdown ${open ? "is-open" : ""}`} role="menu">
        <Link to="/profile" role="menuitem" className="account-menu-item" onClick={() => setOpen(false)}>
          <User size={16} /><span>Profil</span>
        </Link>
        <Link to="/profile" role="menuitem" className="account-menu-item" onClick={() => setOpen(false)}>
          <ShieldCheck size={16} /><span>Şifrəni dəyiş</span>
        </Link>
        <Link to="/profile" role="menuitem" className="account-menu-item" onClick={() => setOpen(false)}>
          <Settings size={16} /><span>Tənzimləmələr</span>
        </Link>
        <div className="account-menu-divider" />
        <button type="button" role="menuitem" className="account-menu-item account-menu-item-danger" onClick={() => { setOpen(false); logout(); }}>
          <LogOut size={16} /><span>Çıxış</span>
        </button>
      </div>
    </div>
  );
}

function AdminTopBar() {
  const { user } = useAuth();
  const lastLogin = user?.lastSignInAt
    ? new Date(user.lastSignInAt).toLocaleString(undefined, { weekday: undefined, hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })
    : null;
  return (
    <div className="admin-topbar">
      <div className="admin-topbar-right">
        {lastLogin && <span className="admin-topbar-lastlogin">Son giriş: {lastLogin}</span>}
        <NotificationBell userId={user?.id} />
        <span className="admin-topbar-name">{user?.name}</span>
      </div>
    </div>
  );
}

function AdminLayout() {
  const { logout } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [newTripRequestsCount, setNewTripRequestsCount] = useState(0);
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      supabase
        .from("listings")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")
        .then(({ count }) => { if (!cancelled) setPendingCount(count || 0); });
      supabase
        .from("trip_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "new")
        .then(({ count }) => { if (!cancelled) setNewTripRequestsCount(count || 0); });
      supabase
        .from("reviews")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending_moderation")
        .then(({ count }) => { if (!cancelled) setPendingReviewsCount(count || 0); });
    };
    load();
    const interval = setInterval(load, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return (
    <div className="app-shell">
      <aside className="app-sidebar admin-sidebar">
        <SidebarHeader />
        <AdminProfileMenu />
        {ADMIN_NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
          >
            <Icon size={17} />{label}
            {to === "/admin/listings/pending" && pendingCount > 0 && (
              <span className="account-menu-badge">{pendingCount}</span>
            )}
            {to === "/admin/trip-requests" && newTripRequestsCount > 0 && (
              <span className="account-menu-badge">{newTripRequestsCount}</span>
            )}
            {to === "/admin/reviews/pending" && pendingReviewsCount > 0 && (
              <span className="account-menu-badge">{pendingReviewsCount}</span>
            )}
          </NavLink>
        ))}

        <div className="sidebar-section-label">Kontent İdarəetməsi</div>
        {CONTENT_NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
          >
            <Icon size={17} />{label}
          </NavLink>
        ))}

        <div className="sidebar-section-label">Regional Partnyor Proqramı</div>
        {REGIONAL_NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
          >
            <Icon size={17} />{label}
          </NavLink>
        ))}

        <button className="sidebar-link logout" onClick={logout}><LogOut size={17} />Çıxış</button>
      </aside>
      <main className="app-main">
        <AdminTopBar />
        <Outlet />
      </main>
    </div>
  );
}

/* =========================================================================
   PAGE PLACEHOLDERS
   Replace each of these with the real page component as it's built —
   e.g. swap `<Home />` below for
   `import Home from "./pages/Home/IzigoHomepage";` (already generated).
   Keeping them inline here means App.jsx runs standalone today.
   ========================================================================= */
function PagePlaceholder({ title, description }) {
  return (
    <div className="page-placeholder">
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}





function NotFound() {
  return <PagePlaceholder title="Page not found" description="The page you're looking for doesn't exist." />;
}

// Suspense fallback for lazy route chunks — deliberately minimal (no spinner
// graphic, no layout of its own) so it never becomes the page's LCP element
// and doesn't shift layout once the real page mounts.
function RouteFallback() {
  return <div style={{ minHeight: "40vh" }} />;
}

/* =========================================================================
   ROOT APP — full route tree, matching the MVP sitemap 1:1
   ========================================================================= */
export default function App() {
  return (
    <LanguageProvider>
    <CurrencyProvider>
    <AuthProvider>
    <AuthModalProvider>
    <SavedProvider>
      <BrowserRouter>
        <AuthModal />
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Public browse pages */}
          <Route element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="concierge" element={<ConciergePage />} />
            <Route path="concierge/:id" element={<ServiceDetailPage />} />
            <Route path="plan-my-trip" element={<PlanMyTripPage />} />
            <Route path="villas" element={<VillasPage />} />
            <Route path="villas/:id" element={<VillaDetailPage />} />
            <Route path="cars" element={<CarsPage />} />
            <Route path="cars/:id" element={<CarDetailPage />} />
            <Route path="transfers" element={<TransfersPage />} />
            <Route path="transfers/:id" element={<TransferDetailPage />} />
            {/* Tours used to live on their own page — they're just transfer
                listings with details.type "tour", so this now redirects into
                the merged Transfers & Tours page instead of a separate one. */}
            <Route path="experiences" element={<Navigate to="/transfers" replace />} />
            <Route path="experiences/:id" element={<ExperienceRedirect />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="events/:id" element={<EventDetailPage />} />
            <Route path="deals" element={<DealsPage />} />
            <Route path="saved" element={<SavedPage />} />
            <Route path="destinations/:city" element={<CityGuide />} />
            <Route path="host/:id" element={<HostProfilePage />} />
            <Route path="destinations" element={<AllDestinationsPage />} />
            <Route path="places" element={<PlacesIndexPage />} />
            <Route path="places/:slug" element={<PlaceDetail />} />
            <Route path="become-a-host" element={<BecomeAHostPage />} />
          </Route>

          {/* Publishing a listing is open to everyone, tap.az-style — no
              account required up front (the form creates the account at the
              very end, alongside the listing) — but a signed-in user should
              never leave their profile panel to do it, hence the dedicated
              layout that picks panel-vs-public chrome around this route. */}
          <Route element={<AddListingLayout />}>
            <Route path="add-listing" element={<AddListingPage />} />
            <Route path="add-listing/:category" element={<AddListingFormPage />} />
          </Route>

          {/* Auth pages — redirect away if already logged in */}
          <Route element={<AuthLayout />}>
            <Route path="login" element={<RequireGuest><LoginPage /></RequireGuest>} />
            <Route path="register" element={<RequireGuest><RegisterPage /></RequireGuest>} />
          </Route>

          {/* Authenticated user pages */}
          <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
            <Route path="welcome" element={<WelcomePage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="edit-listing/:id" element={<AddListingFormPage />} />
            <Route path="my-listings" element={<MyListingsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />

            {/* Regional Partner pages — same persistent sidebar as the rest of
                the account area (AppLayout), just gated per-route so the
                sidebar/header never disappears when navigating between them. */}
            <Route path="partner" element={<RequireRegionalPartner><PartnerDashboardPage /></RequireRegionalPartner>} />
            <Route path="partner/listings" element={<RequireRegionalPartner><PartnerListingsPage /></RequireRegionalPartner>} />
            <Route path="partner/agent-requests" element={<RequireRegionalPartner><AgentRequestsPage /></RequireRegionalPartner>} />
            <Route path="partner/revenue" element={<RequireRegionalPartner><PartnerRevenuePage /></RequireRegionalPartner>} />
            <Route path="partner/payments" element={<RequireRegionalPartner><PartnerPaymentsPage /></RequireRegionalPartner>} />
          </Route>

          {/* Admin pages */}
          <Route element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
            <Route path="admin" element={<AdminDashboardPage />} />
            <Route path="admin/users" element={<AdminUsersPage />} />
            <Route path="admin/listings" element={<AdminListingsPage />} />
            <Route path="admin/listings/pending" element={<PendingApprovalsPage />} />
            <Route path="admin/reviews/pending" element={<AdminPendingReviewsPage />} />
            <Route path="admin/reviews" element={<AdminReviewsPage />} />
            <Route path="admin/statistics" element={<AdminStatisticsPage />} />
            <Route path="admin/hero" element={<AdminHeroCampaignsPage />} />
            <Route path="admin/trip-requests" element={<TripRequestsListPage />} />
            <Route path="admin/trip-requests/:id" element={<TripRequestDetailPage />} />
            <Route path="admin/founder-campaign" element={<FounderCampaignPage />} />

            {/* Stage 1 CMS foundation — admin-only, not linked from the public site yet */}
            <Route path="admin/content/guides" element={<TravelGuidesPage />} />
            <Route path="admin/content/places" element={<PlacesPage />} />
            <Route path="admin/content/faq" element={<FaqPage />} />
            <Route path="admin/content/pages" element={<StaticPagesPage />} />
            <Route path="admin/content/media" element={<MediaLibraryPage />} />

            <Route path="admin/regional-partners" element={<AdminRegionalPartnersPage />} />
            <Route path="admin/ad-campaigns" element={<AdminAdCampaignsPage />} />
            <Route path="admin/partner-payments" element={<AdminPartnerPaymentsPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </SavedProvider>
    </AuthModalProvider>
    </AuthProvider>
    </CurrencyProvider>
    </LanguageProvider>
  );
}
