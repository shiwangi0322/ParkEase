import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { ChevronLeftIcon, PencilIcon } from "../components/Icons";
import { clearSession, getUser } from "../services/api";
import "./Settings.css";

const NOTIFICATION_KEY = "parkease_notification_preferences";
const THEME_KEY = "parkease_theme";

const DEFAULT_NOTIFICATIONS = {
  bookingConfirmations: true,
  bookingReminders: true,
  parkingUpdates: false,
  emailNotifications: true,
};

const SETTINGS_SECTIONS = [
  ["account", "Account"],
  ["security", "Security"],
  ["notifications", "Notifications"],
  ["privacy", "Privacy"],
  ["preferences", "Preferences"],
  ["support", "Support"],
];

function readNotifications() {
  try {
    const stored = JSON.parse(
      localStorage.getItem(NOTIFICATION_KEY) || "{}"
    );

    return {
      ...DEFAULT_NOTIFICATIONS,
      ...stored,
    };
  } catch {
    return DEFAULT_NOTIFICATIONS;
  }
}

function initialsFor(name) {
  return (
    name
      ?.trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U"
  );
}

function Settings() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => getUser() || {});
  const [editing, setEditing] = useState(false);

  const [profile, setProfile] = useState(() => {
    const savedUser = getUser() || {};

    return {
      name: savedUser.name || "",
      email: savedUser.email || "",
      phone: savedUser.phone ?? savedUser.phone_number ?? "",
    };
  });

  const [profileError, setProfileError] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  const [notifications, setNotifications] =
    useState(readNotifications);

  const [securityOpen, setSecurityOpen] = useState(false);

  const [passwordFields, setPasswordFields] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  const [passwordMessage, setPasswordMessage] = useState("");

  const [privacyExpanded, setPrivacyExpanded] = useState(false);

  const [dialog, setDialog] = useState(null);

  const [notice, setNotice] = useState("");

  const phoneKey = Object.prototype.hasOwnProperty.call(user, "phone")
    ? "phone"
    : Object.prototype.hasOwnProperty.call(user, "phone_number")
    ? "phone_number"
    : null;

  const updateProfileField = (field, value) => {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));

    setProfileError("");
    setProfileSaved(false);
  };

  const saveProfile = (event) => {
    event.preventDefault();

    if (!profile.name.trim()) {
      setProfileError("Full name is required.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(profile.email.trim())) {
      setProfileError("Enter a valid email address.");
      return;
    }

    const updatedUser = {
      ...user,
      name: profile.name.trim(),
      email: profile.email.trim(),
    };

    if (phoneKey) {
      updatedUser[phoneKey] = profile.phone.trim();
    }

    localStorage.setItem("user", JSON.stringify(updatedUser));

    setUser(updatedUser);

    setProfile({
      name: updatedUser.name,
      email: updatedUser.email,
      phone:
        updatedUser.phone ??
        updatedUser.phone_number ??
        "",
    });

    setEditing(false);
    setProfileSaved(true);
    setProfileError("");
  };

  const cancelEditing = () => {
    setEditing(false);
    setProfileError("");

    setProfile({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone ?? user.phone_number ?? "",
    });
  };

  const toggleNotification = (key) => {
    setNotifications((current) => {
      const next = {
        ...current,
        [key]: !current[key],
      };

      localStorage.setItem(
        NOTIFICATION_KEY,
        JSON.stringify(next)
      );

      return next;
    });
  };

  const submitPasswordChange = (event) => {
    event.preventDefault();

    setPasswordMessage("");

    if (
      !passwordFields.current ||
      !passwordFields.next ||
      !passwordFields.confirm
    ) {
      setPasswordMessage(
        "Enter your current password and complete both new password fields."
      );
      return;
    }

    if (passwordFields.next.length < 6) {
      setPasswordMessage(
        "New password must be at least 6 characters."
      );
      return;
    }

    if (
      passwordFields.next !== passwordFields.confirm
    ) {
      setPasswordMessage(
        "The new passwords do not match."
      );
      return;
    }

    setPasswordMessage(
      "Password changes are not available in the current account service. No password was changed."
    );
  };

  const clearLocalPreferences = () => {
    localStorage.removeItem(NOTIFICATION_KEY);
    localStorage.removeItem(THEME_KEY);

    setNotifications(DEFAULT_NOTIFICATIONS);
    setDialog(null);

    setNotice(
      "Local app preferences were cleared. Your sign-in and server data were not changed."
    );
  };

  const confirmLogout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="settings-page-wrapper">
      <Navbar />

      <main className="settings-page">
        {/* Header */}
        <header className="settings-header">
          <div className="settings-header-left">
            <Link
              to="/dashboard"
              className="settings-back-link"
            >
              <ChevronLeftIcon size={18} />
              Dashboard
            </Link>

            <div className="settings-title-row">
              <div className="settings-title-icon">
                ⚙
              </div>

              <div>
                <h1>Settings</h1>
                <p>
                  Manage your ParkEase account and
                  preferences.
                </p>
              </div>
            </div>
          </div>

          <div className="settings-header-user">
            <div className="settings-header-avatar">
              {initialsFor(user.name)}
            </div>

            <div>
              <strong>
                {user.name || "ParkEase User"}
              </strong>
              <span>
                {user.email || "Account"}
              </span>
            </div>
          </div>
        </header>

        {notice && (
          <div className="settings-notice" role="status">
            <div className="settings-notice-icon">
              ✓
            </div>

            <span>{notice}</span>

            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        <div className="settings-layout">
          {/* Sidebar */}
          <aside
            className="settings-sidebar"
            aria-label="Settings sections"
          >
            <div className="settings-sidebar-heading">
              <span>SETTINGS</span>
              <small>Manage your account</small>
            </div>

            <nav className="settings-sidebar-nav">
              {SETTINGS_SECTIONS.map(
                ([id, label], index) => (
                  <button
                    type="button"
                    className="settings-nav-link"
                    key={id}
                    onClick={() => scrollToSection(id)}
                  >
                    <span className="settings-nav-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span>{label}</span>
                  </button>
                )
              )}
            </nav>

            <div className="settings-sidebar-help">
              <div className="settings-help-icon">
                ?
              </div>

              <strong>Need help?</strong>

              <span>
                Check the support section for
                available information.
              </span>
            </div>
          </aside>

          {/* Main Content */}
          <div className="settings-content">
            {/* Account */}
            <section
              className="settings-card"
              id="account"
            >
              <div className="settings-section-heading">
                <div>
                  <span className="settings-eyebrow">
                    ACCOUNT
                  </span>

                  <h2>Profile information</h2>

                  <p>
                    Your personal information associated
                    with this ParkEase account.
                  </p>
                </div>

                {!editing && (
                  <button
                    className="settings-button settings-button-quiet"
                    type="button"
                    onClick={() => {
                      setEditing(true);
                      setProfileSaved(false);
                    }}
                  >
                    <PencilIcon size={14} />
                    Edit Profile
                  </button>
                )}
              </div>

              <div className="settings-profile-summary">
                <div className="settings-avatar">
                  {initialsFor(user.name)}
                </div>

                <div className="settings-profile-copy">
                  <strong>
                    {user.name || "ParkEase user"}
                  </strong>

                  <span>
                    {user.email ||
                      "No email available"}
                  </span>
                </div>

                <span className="settings-account-badge">
                  ACTIVE
                </span>
              </div>

              {editing ? (
                <form
                  className="settings-form"
                  onSubmit={saveProfile}
                >
                  <div className="settings-form-grid">
                    <label className="settings-field">
                      <span>Full name</span>

                      <input
                        value={profile.name}
                        onChange={(event) =>
                          updateProfileField(
                            "name",
                            event.target.value
                          )
                        }
                        autoComplete="name"
                        required
                      />
                    </label>

                    <label className="settings-field">
                      <span>Email address</span>

                      <input
                        type="email"
                        value={profile.email}
                        onChange={(event) =>
                          updateProfileField(
                            "email",
                            event.target.value
                          )
                        }
                        autoComplete="email"
                        required
                      />
                    </label>

                    {phoneKey && (
                      <label className="settings-field">
                        <span>Phone number</span>

                        <input
                          type="tel"
                          value={profile.phone}
                          onChange={(event) =>
                            updateProfileField(
                              "phone",
                              event.target.value
                            )
                          }
                          autoComplete="tel"
                        />
                      </label>
                    )}
                  </div>

                  <p className="settings-local-note">
                    Profile edits update the saved browser
                    session only; the current account service
                    does not provide a profile update
                    endpoint.
                  </p>

                  {profileError && (
                    <p
                      className="settings-inline-error"
                      role="alert"
                    >
                      {profileError}
                    </p>
                  )}

                  <div className="settings-form-actions">
                    <button
                      className="settings-button settings-button-quiet"
                      type="button"
                      onClick={cancelEditing}
                    >
                      Cancel
                    </button>

                    <button
                      className="settings-button settings-button-primary"
                      type="submit"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {profileSaved && (
                    <p
                      className="settings-success"
                      role="status"
                    >
                      Profile updated for this browser
                      session.
                    </p>
                  )}

                  <div className="settings-information-grid">
                    <div className="settings-info-item">
                      <span>Name</span>
                      <strong>
                        {user.name || "Not provided"}
                      </strong>
                    </div>

                    <div className="settings-info-item">
                      <span>Email</span>
                      <strong>
                        {user.email || "Not provided"}
                      </strong>
                    </div>

                    {phoneKey && (
                      <div className="settings-info-item">
                        <span>Phone</span>
                        <strong>
                          {user[phoneKey] ||
                            "Not provided"}
                        </strong>
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>

            {/* Security */}
            <section
              className="settings-card"
              id="security"
            >
              <div className="settings-section-heading">
                <div>
                  <span className="settings-eyebrow">
                    SECURITY
                  </span>

                  <h2>Password & security</h2>

                  <p>
                    Keep your account credentials private
                    and secure.
                  </p>
                </div>

                <div className="settings-section-icon">
                  🔒
                </div>
              </div>

              <div className="settings-security-row">
                <div>
                  <strong>Password</strong>
                  <span>••••••••••••</span>
                </div>

                <button
                  className="settings-button settings-button-quiet"
                  type="button"
                  onClick={() => {
                    setSecurityOpen(
                      (open) => !open
                    );
                    setPasswordMessage("");
                  }}
                >
                  {securityOpen
                    ? "Close"
                    : "Change Password"}
                </button>
              </div>

              {securityOpen && (
                <form
                  className="settings-password-form"
                  onSubmit={submitPasswordChange}
                >
                  <label className="settings-field">
                    <span>Current password</span>

                    <input
                      type="password"
                      autoComplete="current-password"
                      value={passwordFields.current}
                      onChange={(event) =>
                        setPasswordFields({
                          ...passwordFields,
                          current:
                            event.target.value,
                        })
                      }
                    />
                  </label>

                  <label className="settings-field">
                    <span>New password</span>

                    <input
                      type="password"
                      autoComplete="new-password"
                      value={passwordFields.next}
                      onChange={(event) =>
                        setPasswordFields({
                          ...passwordFields,
                          next: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label className="settings-field">
                    <span>
                      Confirm new password
                    </span>

                    <input
                      type="password"
                      autoComplete="new-password"
                      value={
                        passwordFields.confirm
                      }
                      onChange={(event) =>
                        setPasswordFields({
                          ...passwordFields,
                          confirm:
                            event.target.value,
                        })
                      }
                    />
                  </label>

                  <p className="settings-local-note">
                    Password changes are not supported
                    by the current authentication API.
                  </p>

                  {passwordMessage && (
                    <p
                      className="settings-inline-error"
                      role="alert"
                    >
                      {passwordMessage}
                    </p>
                  )}

                  <div className="settings-form-actions">
                    <button
                      className="settings-button settings-button-primary"
                      type="submit"
                    >
                      Update Password
                    </button>
                  </div>
                </form>
              )}
            </section>

            {/* Notifications */}
            <section
              className="settings-card"
              id="notifications"
            >
              <div className="settings-section-heading">
                <div>
                  <span className="settings-eyebrow">
                    NOTIFICATIONS
                  </span>

                  <h2>Notification preferences</h2>

                  <p>
                    Choose which ParkEase updates you
                    want to receive.
                  </p>
                </div>

                <div className="settings-section-icon">
                  🔔
                </div>
              </div>

              <div className="settings-toggle-list">
                {[
                  [
                    "bookingConfirmations",
                    "Booking confirmations",
                    "Updates when a booking is created or changed.",
                  ],
                  [
                    "bookingReminders",
                    "Booking reminders",
                    "Reminders about your upcoming reservations.",
                  ],
                  [
                    "parkingUpdates",
                    "Parking updates",
                    "Changes to parking availability and locations.",
                  ],
                  [
                    "emailNotifications",
                    "Email notifications",
                    "Send supported notifications by email.",
                  ],
                ].map(
                  ([key, label, description]) => (
                    <div
                      className="settings-toggle-row"
                      key={key}
                    >
                      <div className="settings-toggle-copy">
                        <strong>{label}</strong>
                        <span>{description}</span>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={
                          notifications[key]
                        }
                        aria-label={label}
                        className={`settings-switch${
                          notifications[key]
                            ? " is-on"
                            : ""
                        }`}
                        onClick={() =>
                          toggleNotification(key)
                        }
                      >
                        <span />
                      </button>
                    </div>
                  )
                )}
              </div>
            </section>

            {/* Privacy */}
            <section
              className="settings-card"
              id="privacy"
            >
              <div className="settings-section-heading">
                <div>
                  <span className="settings-eyebrow">
                    PRIVACY
                  </span>

                  <h2>Privacy & data</h2>

                  <p>
                    Manage preferences saved by this
                    browser.
                  </p>
                </div>

                <div className="settings-section-icon">
                  🛡️
                </div>
              </div>

              <div className="settings-action-row">
                <div>
                  <strong>Manage privacy</strong>
                  <span>
                    Review what this device stores for
                    ParkEase.
                  </span>
                </div>

                <button
                  type="button"
                  className="settings-button settings-button-quiet"
                  onClick={() =>
                    setPrivacyExpanded(
                      (expanded) => !expanded
                    )
                  }
                >
                  {privacyExpanded
                    ? "Hide Details"
                    : "Manage Privacy"}
                </button>
              </div>

              {privacyExpanded && (
                <p className="settings-privacy-detail">
                  Notification and theme preferences are
                  stored in this browser. Your bookings
                  and account records remain in the ParkEase
                  service and are not affected by clearing
                  local preferences.
                </p>
              )}

              <div className="settings-action-row settings-action-row-danger">
                <div>
                  <strong>Clear local data</strong>
                  <span>
                    Remove saved notification and theme
                    preferences from this browser.
                  </span>
                </div>

                <button
                  type="button"
                  className="settings-button settings-button-danger"
                  onClick={() =>
                    setDialog("clear")
                  }
                >
                  Clear Local Data
                </button>
              </div>
            </section>

            {/* Preferences */}
            <section
              className="settings-card"
              id="preferences"
            >
              <div className="settings-section-heading">
                <div>
                  <span className="settings-eyebrow">
                    APP PREFERENCES
                  </span>

                  <h2>Preferences</h2>

                  <p>
                    Choose the display options available
                    in this version.
                  </p>
                </div>

                <div className="settings-section-icon">
                  ⚙️
                </div>
              </div>

              <div className="settings-preference-row">
                <div>
                  <strong>Theme</strong>

                  <span>
                    ParkEase currently supports the light
                    appearance.
                  </span>
                </div>

                <div className="settings-theme-options">
                  <label>
                    <input
                      type="radio"
                      name="theme"
                      value="light"
                      checked
                      readOnly
                    />
                    Light
                  </label>

                  <label className="is-disabled">
                    <input
                      type="radio"
                      name="theme"
                      value="dark"
                      disabled
                    />
                    Dark
                  </label>

                  <label className="is-disabled">
                    <input
                      type="radio"
                      name="theme"
                      value="system"
                      disabled
                    />
                    System
                  </label>
                </div>
              </div>

              <div className="settings-preference-row">
                <div>
                  <strong>Language</strong>
                  <span>
                    Interface language
                  </span>
                </div>

                <span className="settings-language-value">
                  English
                </span>
              </div>
            </section>

            {/* Support */}
            <section
              className="settings-card"
              id="support"
            >
              <div className="settings-section-heading">
                <div>
                  <span className="settings-eyebrow">
                    SUPPORT
                  </span>

                  <h2>Help & support</h2>

                  <p>
                    Information about available ParkEase
                    support options.
                  </p>
                </div>

                <div className="settings-section-icon">
                  ?
                </div>
              </div>

              <div className="settings-support-list">
                <div>
                  <strong>
                    Help & Support
                  </strong>

                  <span>
                    Support center unavailable
                  </span>
                </div>

                <div>
                  <strong>
                    Contact Us
                  </strong>

                  <span>
                    No contact channel configured
                  </span>
                </div>

                <div>
                  <strong>
                    About ParkEase
                  </strong>

                  <span>
                    Smart parking and reservations
                  </span>
                </div>
              </div>
            </section>

            {/* Logout */}
            <section className="settings-logout-card">
              <div className="settings-logout-icon">
                ↪
              </div>

              <div className="settings-logout-copy">
                <strong>
                  Log out of ParkEase
                </strong>

                <span>
                  You can sign back in at any time.
                </span>
              </div>

              <button
                type="button"
                className="settings-button settings-button-danger"
                onClick={() => setDialog("logout")}
              >
                Log Out
              </button>
            </section>
          </div>
        </div>
      </main>

      {/* Confirmation Dialog */}
      {dialog && (
        <div
          className="settings-dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setDialog(null);
            }
          }}
        >
          <section
            className="settings-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-dialog-title"
          >
            <div className="settings-dialog-icon">
              {dialog === "logout" ? "↪" : "!"}
            </div>

            <h2 id="settings-dialog-title">
              {dialog === "logout"
                ? "Log out?"
                : "Clear local data?"}
            </h2>

            <p>
              {dialog === "logout"
                ? "Are you sure you want to log out?"
                : "This removes saved app preferences from this browser. Your account, sign-in and database records will remain unchanged."}
            </p>

            <div className="settings-form-actions">
              <button
                type="button"
                className="settings-button settings-button-quiet"
                onClick={() => setDialog(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="settings-button settings-button-danger"
                onClick={
                  dialog === "logout"
                    ? confirmLogout
                    : clearLocalPreferences
                }
              >
                {dialog === "logout"
                  ? "Log Out"
                  : "Clear Local Data"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default Settings;