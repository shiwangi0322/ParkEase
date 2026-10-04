import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login, saveSession } from "../services/api";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password);
      saveSession(res.token, res.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Brand Hero Left Panel */}
      <div className="auth-left">
        <div>
          <div className="auth-logo-row">
            <div className="auth-logo-mark">P</div>
            <span className="auth-logo-text">ParkEase</span>
          </div>
          <h1 className="auth-headline">
            Smart Parking.<br />Made Effortless.
          </h1>
          <p className="auth-subtext">
            Reserve verified parking spaces in seconds. Real-time availability, clear hourly pricing, and zero hassle.
          </p>
        </div>
      </div>

      {/* Form Right Panel */}
      <div className="auth-right">
        <form onSubmit={handleSubmit} className="auth-card">
          {/* Mobile Logo Header */}
          <div className="auth-mobile-logo">
            <div className="auth-mobile-logo-mark">P</div>
            <span className="auth-mobile-logo-text">ParkEase</span>
          </div>

          <h2 className="auth-title">Welcome back</h2>
          <p className="auth-subtitle">Sign in to manage your parking bookings.</p>

          <div className="field-group">
            <label className="field-label">Email address</label>
            <input
              type="email"
              className={`field-input${error ? " error" : ""}`}
              placeholder="name@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              autoComplete="email"
              required
            />
          </div>

          <div className="field-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <label className="field-label" style={{ marginBottom: 0 }}>Password</label>
            </div>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                className={`field-input${error ? " error" : ""}`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && (
            <div className="error-text" style={{ marginBottom: 16 }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: "100%", marginTop: 8 }}
          >
            {loading && <span className="spinner" style={{ width: 14, height: 14, borderTopColor: "#fff" }} />}
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p className="auth-footer-text">
            Don't have an account?{" "}
            <Link to="/register" className="auth-link">
              Create account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;