import React, { createContext, useContext, useEffect, useState } from "react";
import {
  BrowserRouter, Routes, Route, Outlet, Navigate, Link, useLocation,
} from "react-router-dom";
import {
  Home as HomeIcon, Heart, User, ListChecks,
  PlusCircle, Star, LayoutDashboard, Users, ClipboardList, BarChart3,
  ShieldCheck, LogOut, X,
} from "lucide-react";
import "./App.css";
import Home from "./pages/Home/IzigoHomepage";
import CityGuide from "./pages/Destinations/CityGuide";
import VillasPage from "./pages/Villas/VillasPage";
import VillaDetailPage from "./pages/Villas/VillaDetail";
import CarsPage from "./pages/Cars/CarsPage";
import CarDetailPage from "./pages/Cars/CarDetail";
import ExperiencesPage from "./pages/Experiences/ExperiencesPage";
import ExperienceDetailPage from "./pages/Experiences/ExperienceDetail";
import DealsPage from "./pages/Deals/DealsPage";
import SavedPage from "./pages/Saved/SavedPage";
import ProfilePage from "./pages/Profile/ProfilePage";
import MyListingsPage from "./pages/MyListings/MyListingsPage";
import ReviewsPage from "./pages/Reviews/ReviewsPage";
import TransfersPage from "./pages/Transfers/TransfersPage";
import TransferDetailPage from "./pages/Transfers/TransferDetail";
import EventsPage from "./pages/Events/EventsPage";
import EventDetailPage from "./pages/Events/EventDetail";
import ConciergePage from "./pages/Concierge/ConciergePage";
import PlanMyTripPage from "./pages/PlanMyTrip/PlanMyTripPage";
import LoginPage from "./pages/Auth/LoginPage";
import AddListingPage from "./pages/AddListing/AddListingPage";
import AddListingFormPage from "./pages/AddListing/AddListingFormPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import LoginForm from "./pages/Auth/LoginForm";
import RegisterForm from "./pages/Auth/RegisterForm";
import { LanguageProvider, useLanguage } from "./i18n/LanguageContext";
import { LANGUAGES } from "./i18n/translations";
import { supabase } from "./lib/supabaseClient";
import NotificationBell from "./components/NotificationBell";
import PendingApprovalsPage from "./pages/Admin/PendingApprovalsPage";
import AdminDashboardPage from "./pages/Admin/DashboardPage";
import AdminListingsPage from "./pages/Admin/ListingsPage";
import AdminUsersPage from "./pages/Admin/UsersPage";
import AdminReviewsPage from "./pages/Admin/ReviewsPage";
import AdminStatisticsPage from "./pages/Admin/StatisticsPage";
import HostProfilePage from "./pages/Host/HostProfilePage";
import AllDestinationsPage from "./pages/Destinations/AllDestinationsPage";

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
      .select("full_name, role")
      .eq("id", session.user.id)
      .single();
    setUser({
      id: session.user.id,
      email: session.user.email,
      name: profile?.full_name || session.user.email,
      role: profile?.role || "host",
    });
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

  const value = { user, isAuthenticated: !!user, loading, login, register, logout };
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

const MAIN_NAV_ITEMS = [
  { to: "/villas", key: "villas" },
  { to: "/cars", key: "cars" },
  { to: "/transfers?type=transfer", key: "transfers", matchTo: "/transfers" },
  { to: "/experiences", key: "tours" },
  { to: "/concierge", key: "concierge" },
];

function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  return (
    <div className="language-switcher">
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          className={code === language ? "active" : ""}
          onClick={() => setLanguage(code)}
          type="button"
        >
          {label}
        </button>
      ))}
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
  const location = useLocation();
  return (
    <div>
      <header className="app-navbar">
        <div className="app-navbar-inner">
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
          <div className="app-nav-right">
            <LanguageSwitcher />
            <Link to="/saved" className="nav-icon-link"><Heart size={17} /><span>{t("nav.saved")}</span></Link>
            {isAuthenticated ? (
              <Link to="/profile" className="btn-outline">{t("nav.myAccount")}</Link>
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
  { to: "/profile", label: "Profile", icon: User },
  { to: "/my-listings", label: "My listings", icon: ListChecks },
  { to: "/add-listing", label: "Add listing", icon: PlusCircle },
  { to: "/reviews", label: "Reviews", icon: Star },
];

function AppLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Link to="/"><IzigoLogoDark /></Link>
        {APP_NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="sidebar-link"><Icon size={17} />{label}</Link>
        ))}
        <NotificationBell userId={user?.id} />
        <LanguageSwitcher />
        <button className="sidebar-link logout" onClick={logout}><LogOut size={17} />Log out</button>
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

const ADMIN_NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/listings/pending", label: "Pending approvals", icon: ClipboardList },
  { to: "/admin/listings", label: "Listings", icon: HomeIcon },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
  { to: "/admin/statistics", label: "Statistics", icon: BarChart3 },
];

function AdminLayout() {
  const { logout } = useAuth();
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Link to="/admin" className="app-logo"><ShieldCheck size={18} color="var(--izigo-orange)" style={{ marginRight: 8 }} />IZIGO admin</Link>
        {ADMIN_NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="sidebar-link"><Icon size={17} />{label}</Link>
        ))}
        <button className="sidebar-link logout" onClick={logout}><LogOut size={17} />Log out</button>
      </aside>
      <main className="app-main"><Outlet /></main>
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

/* =========================================================================
   ROOT APP — full route tree, matching the MVP sitemap 1:1
   ========================================================================= */
export default function App() {
  return (
    <LanguageProvider>
    <AuthProvider>
    <AuthModalProvider>
    <SavedProvider>
      <BrowserRouter>
        <AuthModal />
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
            <Route path="experiences" element={<ExperiencesPage />} />
            <Route path="experiences/:id" element={<ExperienceDetailPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="events/:id" element={<EventDetailPage />} />
            <Route path="deals" element={<DealsPage />} />
            <Route path="saved" element={<SavedPage />} />
            <Route path="destinations/:city" element={<CityGuide />} />
            <Route path="host/:id" element={<HostProfilePage />} />
            <Route path="destinations" element={<AllDestinationsPage />} />
          </Route>

          {/* Auth pages — redirect away if already logged in */}
          <Route element={<AuthLayout />}>
            <Route path="login" element={<RequireGuest><LoginPage /></RequireGuest>} />
            <Route path="register" element={<RequireGuest><RegisterPage /></RequireGuest>} />
          </Route>

          {/* Authenticated user pages */}
          <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
            <Route path="profile" element={<ProfilePage />} />
            <Route path="add-listing" element={<AddListingPage />} />
            <Route path="add-listing/:category" element={<AddListingFormPage />} />
            <Route path="edit-listing/:id" element={<AddListingFormPage />} />
            <Route path="my-listings" element={<MyListingsPage />} />
            <Route path="reviews" element={<ReviewsPage />} />
          </Route>

          {/* Admin pages */}
          <Route element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
            <Route path="admin" element={<AdminDashboardPage />} />
            <Route path="admin/users" element={<AdminUsersPage />} />
            <Route path="admin/listings" element={<AdminListingsPage />} />
            <Route path="admin/listings/pending" element={<PendingApprovalsPage />} />
            <Route path="admin/reviews" element={<AdminReviewsPage />} />
            <Route path="admin/statistics" element={<AdminStatisticsPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </SavedProvider>
    </AuthModalProvider>
    </AuthProvider>
    </LanguageProvider>
  );
}
