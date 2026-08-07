import React, { createContext, useContext, useEffect, useState, Suspense, lazy } from "react";
import {
  BrowserRouter, Routes, Route, Outlet, Navigate, Link, NavLink, useLocation, useParams,
} from "react-router-dom";
import {
  Home as HomeIcon, Heart, User, ListChecks,
  PlusCircle, Star, LayoutDashboard, Users, ClipboardList, BarChart3,
  ShieldCheck, LogOut, X, Sparkles, Bell, Settings, ChevronDown, Globe, ArrowLeft,
  Map, MapPin, HelpCircle, FileText, Image as ImageIcon, Compass, Trophy,
} from "lucide-react";
import "./App.css";
import "./rtl.css";
import LoginForm from "./pages/Auth/LoginForm";
import RegisterForm from "./pages/Auth/RegisterForm";
import { LanguageProvider, useLanguage } from "./i18n/LanguageContext";
import { CurrencyProvider, useCurrency, CURRENCIES } from "./i18n/CurrencyContext";
import { LANGUAGES } from "./i18n/translations";
import { supabase } from "./lib/supabaseClient";
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
const ReviewsPage = lazy(() => import("./pages/Reviews/ReviewsPage"));
const NotificationsPage = lazy(() => import("./pages/Notifications/NotificationsPage"));
const TransfersPage = lazy(() => import("./pages/Transfers/TransfersPage"));
const TransferDetailPage = lazy(() => import("./pages/Transfers/TransferDetail"));
const EventsPage = lazy(() => import("./pages/Events/EventsPage"));
const EventDetailPage = lazy(() => import("./pages/Events/EventDetail"));
const ConciergePage = lazy(() => import("./pages/Concierge/ConciergePage"));
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
      .select("full_name, role, phone, created_at, verified, founder_host, founder_granted_at, vip_expires_at, welcome_seen")
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

  const register = async (email, password, name, phone) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, phone } },
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
  if (loading) return null;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}

function RequireGuest({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/profile" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role !== "admin") return <Navigate to="/" replace />;
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

function LocaleSwitcher() {
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
    <div className="locale-switcher" ref={rootRef}>
      <button
        type="button"
        className="locale-switcher-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Globe size={15} />
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
  { to: "/reviews", key: "reviews", icon: Star },
  { to: "/notifications", key: "notifications", icon: Bell },
];

const ACCOUNT_MENU_ADMIN_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/listings/pending", label: "Pending approvals", icon: ClipboardList },
  { to: "/admin/listings", label: "Listings", icon: HomeIcon },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
  { to: "/admin/statistics", label: "Statistics", icon: BarChart3 },
  { to: "/admin/hero", label: "Hero campaigns", icon: Sparkles },
  { to: "/admin/trip-requests", label: "Travel Concierge", icon: Compass },
  { to: "/admin/founder-campaign", label: "Founder Campaign", icon: Trophy },
];

function AccountMenu() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [newTripRequestsCount, setNewTripRequestsCount] = useState(0);
  const rootRef = React.useRef(null);
  const isAdmin = user?.role === "admin";

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
        {(unreadCount + pendingCount + newTripRequestsCount) > 0 && <span className="account-menu-trigger-dot" />}
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
            <div className="account-menu-label">Admin</div>
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
function MainLayout() {
  const { isAuthenticated } = useAuth();
  const { openLogin } = useAuthModal();
  const { t } = useLanguage();
  const { saved } = useSaved();
  const location = useLocation();
  const favoritesCount = saved.length;

  // Compact + shadow only kick in past this scroll threshold — the navbar
  // itself is already `position: sticky` in CSS, this just toggles a class.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 120);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div>
      <header className={`app-navbar${scrolled ? " is-stuck" : ""}`}>
        <div className="app-navbar-inner">
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
            <LocaleSwitcher />
            <Link to="/saved" className="nav-icon-link nav-icon-link-favorites" aria-label={t("nav.saved")} data-tooltip={t("nav.saved")}>
              <Heart size={19} />
              {favoritesCount > 0 && <span className="nav-icon-badge">{favoritesCount > 99 ? "99+" : favoritesCount}</span>}
            </Link>
            {isAuthenticated ? (
              <AccountMenu />
            ) : (
              <button type="button" className="btn-outline" onClick={openLogin}>{t("nav.login")}</button>
            )}
            <Link to="/add-listing" className="btn-primary"><PlusCircle size={16} /><span>{t("nav.publish")}</span></Link>
          </div>
        </div>
      </header>
      <main><Outlet /></main>
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
  { to: "/reviews", key: "reviews", icon: Star },
];

function AppLayout() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
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
        <NotificationBell userId={user?.id} />
        <LocaleSwitcher />
        <button className="sidebar-link logout" onClick={logout}><LogOut size={17} />{t("sidebar.logout")}</button>
      </aside>
      <main className="app-main">
        <p style={{ fontSize: 13, color: "var(--text-soft)", marginBottom: 18 }}>
          Signed in as <strong>{user?.name}</strong> ({user?.role})
        </p>
        <Outlet />
      </main>
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
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/listings/pending", label: "Pending approvals", icon: ClipboardList },
  { to: "/admin/listings", label: "Listings", icon: HomeIcon },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
  { to: "/admin/statistics", label: "Statistics", icon: BarChart3 },
  { to: "/admin/hero", label: "Hero campaigns", icon: Sparkles },
  { to: "/admin/trip-requests", label: "Travel Concierge", icon: Compass },
  { to: "/admin/founder-campaign", label: "Founder Campaign", icon: Trophy },
];

// Stage 1 CMS foundation — admin-only CRUD, not yet wired to the public site.
const CONTENT_NAV_ITEMS = [
  { to: "/admin/content/guides", label: "Travel Guides", icon: Map },
  { to: "/admin/content/places", label: "Places", icon: MapPin },
  { to: "/admin/content/faq", label: "FAQ", icon: HelpCircle },
  { to: "/admin/content/pages", label: "Static Pages", icon: FileText },
  { to: "/admin/content/media", label: "Media Library", icon: ImageIcon },
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
          <span className="admin-profile-role">{user?.role === "admin" ? "Super Admin" : user?.role}</span>
        </span>
        <ChevronDown size={14} className={`account-menu-chevron ${open ? "is-open" : ""}`} />
      </button>

      <div className={`admin-profile-dropdown ${open ? "is-open" : ""}`} role="menu">
        <Link to="/profile" role="menuitem" className="account-menu-item" onClick={() => setOpen(false)}>
          <User size={16} /><span>Profile</span>
        </Link>
        <Link to="/profile" role="menuitem" className="account-menu-item" onClick={() => setOpen(false)}>
          <ShieldCheck size={16} /><span>Change password</span>
        </Link>
        <Link to="/profile" role="menuitem" className="account-menu-item" onClick={() => setOpen(false)}>
          <Settings size={16} /><span>Settings</span>
        </Link>
        <div className="account-menu-divider" />
        <button type="button" role="menuitem" className="account-menu-item account-menu-item-danger" onClick={() => { setOpen(false); logout(); }}>
          <LogOut size={16} /><span>Log out</span>
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
        {lastLogin && <span className="admin-topbar-lastlogin">Last login: {lastLogin}</span>}
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
          </NavLink>
        ))}

        <div className="sidebar-section-label">Content Management</div>
        {CONTENT_NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
          >
            <Icon size={17} />{label}
          </NavLink>
        ))}

        <button className="sidebar-link logout" onClick={logout}><LogOut size={17} />Log out</button>
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
            <Route path="reviews" element={<ReviewsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>

          {/* Admin pages */}
          <Route element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
            <Route path="admin" element={<AdminDashboardPage />} />
            <Route path="admin/users" element={<AdminUsersPage />} />
            <Route path="admin/listings" element={<AdminListingsPage />} />
            <Route path="admin/listings/pending" element={<PendingApprovalsPage />} />
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
