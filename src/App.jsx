import React, { createContext, useContext, useState } from "react";
import {
  BrowserRouter, Routes, Route, Outlet, Navigate, Link, useLocation,
} from "react-router-dom";
import {
  Home as HomeIcon, Heart, User, ListChecks,
  PlusCircle, Star, LayoutDashboard, Users, ClipboardList, BarChart3,
  ShieldCheck, LogOut,
} from "lucide-react";
import "./App.css";
import Home from "./pages/Home/IzigoHomepage";
import CityGuide from "./pages/Destinations/CityGuide";
import VillasPage from "./pages/Villas/VillasPage";
import VillaDetailPage from "./pages/Villas/VillaDetail";
import CarsPage from "./pages/Cars/CarsPage";
import TransfersPage from "./pages/Transfers/TransfersPage";
import TransferDetailPage from "./pages/Transfers/TransferDetail";
import EventsPage from "./pages/Events/EventsPage";
import EventDetailPage from "./pages/Events/EventDetail";
import ConciergePage from "./pages/Concierge/ConciergePage";
import PlanMyTripPage from "./pages/PlanMyTrip/PlanMyTripPage";
import { LanguageProvider, useLanguage } from "./i18n/LanguageContext";
import { LANGUAGES } from "./i18n/translations";

/* =========================================================================
   AUTH — mock context for now. Swap the two TODOs for real API calls.
   Session is kept in memory only (React state), never localStorage —
   in production this should be backed by an httpOnly cookie + a /me call
   on app load, as described in the MVP architecture doc.
   ========================================================================= */
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null | { name, role: 'guest' | 'host' | 'admin' }

  const login = async (email, password) => {
    // TODO: replace with `POST /auth/login`, then `GET /users/me` to hydrate the session
    setUser({ name: "Elvin Mammadov", role: "host" });
  };

  const loginAsAdmin = () => setUser({ name: "Admin", role: "admin" }); // demo helper only

  const logout = () => {
    // TODO: replace with `POST /auth/logout`
    setUser(null);
  };

  const value = { user, isAuthenticated: !!user, login, loginAsAdmin, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/* =========================================================================
   ROUTE GUARDS
   ========================================================================= */
function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}

function RequireGuest({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/profile" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { user } = useAuth();
  if (!user || user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

/* =========================================================================
   LOGO — shared between navbar, auth card and sidebars
   ========================================================================= */
function IzigoLogo() {
  return (
    <span className="app-logo">
      IZIGO
      <span className="app-logo-tagline">Stay · Drive · Explore</span>
    </span>
  );
}

function IzigoLogoMark() {
  return <span className="logo-mark" role="img" aria-label="IZIGO" />;
}

const MAIN_NAV_ITEMS = [
  { to: "/concierge", key: "concierge" },
  { to: "/villas", key: "villas" },
  { to: "/cars", key: "cars" },
  { to: "/transfers", key: "transfers" },
  { to: "/events", key: "events" },
  { to: "/deals", key: "deals" },
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
  const { t } = useLanguage();
  const location = useLocation();
  return (
    <div>
      <header className="app-navbar">
        <div className="app-navbar-inner">
          <Link to="/"><IzigoLogoMark /></Link>
          <nav className="app-nav-links">
            <Link to="/" className={location.pathname === "/" ? "active" : ""}>{t("nav.home")}</Link>
            {MAIN_NAV_ITEMS.map(({ to, key }) => (
              <Link key={to} to={to} className={location.pathname.startsWith(to) ? "active" : ""}>{t(`nav.${key}`)}</Link>
            ))}
          </nav>
          <div className="app-nav-right">
            <LanguageSwitcher />
            <Link to="/saved" className="nav-icon-link"><Heart size={17} /><span>{t("nav.saved")}</span></Link>
            {isAuthenticated ? (
              <Link to="/profile" className="btn-outline">{t("nav.myAccount")}</Link>
            ) : (
              <Link to="/login" className="btn-outline">{t("nav.login")}</Link>
            )}
            <Link to="/add-listing" className="btn-primary"><PlusCircle size={16} /><span>{t("nav.publish")}</span></Link>
          </div>
        </div>
      </header>
      <main><Outlet /></main>
      <footer className="site-footer">© {new Date().getFullYear()} IZIGO. {t("footer.rights")}</footer>
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
        <Link to="/"><IzigoLogo /></Link>
        {APP_NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="sidebar-link"><Icon size={17} />{label}</Link>
        ))}
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

const CarDetail = () => <PagePlaceholder title="Car detail" description="Make, model, transmission, contact host." />;
const Experiences = () => <PagePlaceholder title="Experiences" description="Category browse grid for tours and activities." />;
const ExperienceDetail = () => <PagePlaceholder title="Experience detail" description="Duration, group size, contact host." />;
const Deals = () => <PagePlaceholder title="Deals" description="Discounted and promoted listings across every category." />;
const Saved = () => <PagePlaceholder title="Saved" description="Listings the guest has bookmarked." />;

const Login = () => <PagePlaceholder title="Log in" description="Phone or email + password, OTP verification." />;
const Register = () => <PagePlaceholder title="Sign up" description="Name, phone, email, password — WhatsApp number added later on Profile." />;

const Profile = () => <PagePlaceholder title="Profile" description="Personal info, WhatsApp number, verification status." />;
const AddListing = () => <PagePlaceholder title="Add listing" description="Category picker, then the matching villa/car/experience/event form." />;
const AddListingCategory = () => <PagePlaceholder title="Add listing — category form" description="Category-specific fields, photo upload, submit for approval." />;
const MyListings = () => <PagePlaceholder title="My listings" description="Status badges, inquiries, and the confirm-stay action." />;
const Reviews = () => <PagePlaceholder title="Reviews" description="Guest: confirm stays and write reviews. Host: view and reply to reviews." />;

const AdminDashboard = () => <PagePlaceholder title="Admin dashboard" description="KPI cards and trend charts." />;
const AdminUsers = () => <PagePlaceholder title="Users" description="Search, filter, suspend/ban." />;
const AdminListings = () => <PagePlaceholder title="Listings" description="All listings across every status, category, and city." />;
const AdminPendingApprovals = () => <PagePlaceholder title="Pending approvals" description="Daily triage queue — approve, reject with reason, or request edits." />;
const AdminReviews = () => <PagePlaceholder title="Reviews" description="Verified reviews plus the flagged/reported queue." />;
const AdminStatistics = () => <PagePlaceholder title="Statistics" description="Conversion rates, review volume, premium revenue." />;

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
      <BrowserRouter>
        <Routes>
          {/* Public browse pages */}
          <Route element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="concierge" element={<ConciergePage />} />
            <Route path="plan-my-trip" element={<PlanMyTripPage />} />
            <Route path="villas" element={<VillasPage />} />
            <Route path="villas/:id" element={<VillaDetailPage />} />
            <Route path="cars" element={<CarsPage />} />
            <Route path="cars/:id" element={<CarDetail />} />
            <Route path="transfers" element={<TransfersPage />} />
            <Route path="transfers/:id" element={<TransferDetailPage />} />
            <Route path="experiences" element={<Experiences />} />
            <Route path="experiences/:id" element={<ExperienceDetail />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="events/:id" element={<EventDetailPage />} />
            <Route path="deals" element={<Deals />} />
            <Route path="saved" element={<Saved />} />
            <Route path="destinations/:city" element={<CityGuide />} />
          </Route>

          {/* Auth pages — redirect away if already logged in */}
          <Route element={<AuthLayout />}>
            <Route path="login" element={<RequireGuest><Login /></RequireGuest>} />
            <Route path="register" element={<RequireGuest><Register /></RequireGuest>} />
          </Route>

          {/* Authenticated user pages */}
          <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
            <Route path="profile" element={<Profile />} />
            <Route path="add-listing" element={<AddListing />} />
            <Route path="add-listing/:category" element={<AddListingCategory />} />
            <Route path="my-listings" element={<MyListings />} />
            <Route path="reviews" element={<Reviews />} />
          </Route>

          {/* Admin pages */}
          <Route element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="admin/users" element={<AdminUsers />} />
            <Route path="admin/listings" element={<AdminListings />} />
            <Route path="admin/listings/pending" element={<AdminPendingApprovals />} />
            <Route path="admin/reviews" element={<AdminReviews />} />
            <Route path="admin/statistics" element={<AdminStatistics />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </LanguageProvider>
  );
}
