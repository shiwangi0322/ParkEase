import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/api";

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const validate = () => {
    if (!name.trim()) return "Full name is required.";
    if (!/^\S+@\S+\.\S+$/.test(email)) return "Enter a valid email address.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (password !== confirm) return "Passwords do not match.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="success-card-center">
        <div className="success-card">
          <div className="success-icon">✓</div>
          <h2 className="text-section-title" style={{ marginBottom: 4 }}>Account created</h2>
          <p className="text-secondary" style={{ marginBottom: 16 }}>
            Redirecting to sign in...
          </p>
          <div className="spinner" style={{ margin: "0 auto" }} />
        </div>
      </div>
    );
  }

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
            Join the Smart<br />Parking Network.
          </h1>
          <p className="auth-subtext">
            Register your vehicles, find open spots instantly, and never circle the block looking for parking again.
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

          <h2 className="auth-title">Create account</h2>
          <p className="auth-subtitle">Start reserving parking spots in seconds.</p>

          <div className="field-group">
            <label className="field-label">Full name</label>
            <input
              type="text"
              className="field-input"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              required
            />
          </div>

          <div className="field-group">
            <label className="field-label">Email address</label>
            <input
              type="email"
              className="field-input"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              autoComplete="email"
              required
            />
          </div>

          <div className="field-group">
            <label className="field-label">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                className="field-input"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                autoComplete="new-password"
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

          <div className="field-group">
            <label className="field-label">Confirm password</label>
            <input
              type={showPassword ? "text" : "password"}
              className="field-input"
              placeholder="Re-enter password"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setError(""); }}
              autoComplete="new-password"
              required
            />
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
            {loading ? "Creating account..." : "Create account"}
          </button>

          <p className="auth-footer-text">
            Already have an account?{" "}
            <Link to="/login" className="auth-link">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;