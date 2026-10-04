import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getUser, clearSession } from "../services/api";

/* ---- Inline SVG icons ---- */
const IconGrid = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);
const IconCompass = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
  </svg>
);
const IconBookmark = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconCar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-3"/>
    <circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>
  </svg>
);
const IconLogout = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IconMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);
const IconX = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard",   Icon: IconGrid },
  { to: "/explore",   label: "Explore",     Icon: IconCompass },
  { to: "/bookings",  label: "My Bookings", Icon: IconBookmark },
  { to: "/vehicles",  label: "My Vehicles", Icon: IconCar },
];

function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = getUser();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  const initials = user?.name
    ? user.name.trim().split(/\s+/).map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/dashboard" className="navbar-logo">
          <div className="navbar-logo-mark">P</div>
          <span className="navbar-logo-text">ParkEase</span>
        </Link>

        {/* Desktop nav links */}
        <div className="navbar-links">
          {NAV_LINKS.map(({ to, label, Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`navbar-link${active ? " navbar-link-active" : ""}`}
              >
                <span className="navbar-link-icon"><Icon /></span>
                {label}
              </Link>
            );
          })}
        </div>

        {/* Desktop right */}
        <div className="navbar-right">
          <Link
            to="/settings"
            className="navbar-account-link"
            aria-label="Open account settings"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 8px",
              borderRadius: 10,
              background: pathname === "/settings" ? "var(--primary-soft)" : "transparent",
            }}
          >
            <div className="navbar-avatar" title={user?.name}>{initials}</div>
            <span className="navbar-username">{user?.name || "User"}</span>
          </Link>
          <button onClick={handleLogout} className="btn-secondary navbar-logout-btn">
            <IconLogout />
            Logout
          </button>
        </div>

        {/* Mobile hamburger — logout access only; primary mobile nav is the
            bottom tab bar below, matching the reference screenshots */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="navbar-hamburger"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <IconX /> : <IconMenu />}
        </button>
      </div>

      {/* Mobile dropdown — logout / account only now that navigation lives
          in the bottom tab bar */}
      {menuOpen && (
        <div className="navbar-mobile-menu">
          <div className="navbar-mobile-footer" style={{ borderTop: "none" }}>
            <div className="navbar-mobile-user">
              <div className="navbar-avatar">{initials}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{user?.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{user?.email}</div>
              </div>
            </div>
            <Link
              to="/settings"
              onClick={() => setMenuOpen(false)}
              className="btn-secondary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              Settings
            </Link>
            <button onClick={handleLogout} className="btn-secondary" style={{ width: "100%" }}>
              <IconLogout />
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Bottom tab bar — mobile only, uses the same existing routes as the
          desktop nav links above (no new/invented routes) */}
      <div className="bottom-tab-bar">
        {NAV_LINKS.map(({ to, label, Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`bottom-tab-item${active ? " bottom-tab-item-active" : ""}`}
            >
              <Icon />
              <span>{label.replace("My ", "")}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default Navbar;