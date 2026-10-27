import React, { useState } from "react";
import {
  BookOpenCheck,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Info,
} from "lucide-react";
import type { User } from "../types";
import { DEMO_ACCOUNTS, signIn, sendPasswordResetEmail } from "../services/auth";
import { isSupabaseConfigured } from "../services/supabase";
import { Modal } from "../components/Modal";

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetStatus, setResetStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [resetMessage, setResetMessage] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const { user, error } = await signIn(email, password);
      if (error || !user) {
        setErrorMessage(error || "Invalid login credentials.");
      } else {
        onLoginSuccess(user);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to log in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleQuickFill(demoAccount: typeof DEMO_ACCOUNTS[0]) {
    setEmail(demoAccount.email);
    setPassword(demoAccount.password);
    setErrorMessage("");
  }

  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault();
    setResetStatus("loading");
    setResetMessage("");

    const { success, error } = await sendPasswordResetEmail(resetEmail);
    if (!success || error) {
      setResetStatus("error");
      setResetMessage(error || "Could not send reset instructions.");
    } else {
      setResetStatus("success");
      setResetMessage(
        isSupabaseConfigured
          ? `Password reset link sent to ${resetEmail}. Check your inbox!`
          : `[Demo Mode] A password reset link has been simulated for ${resetEmail}.`
      );
    }
  }

  return (
    <div className="login-page">
      <div className="login-card-wrapper">
        {/* Brand Header */}
        <div className="login-header">
          <div className="login-brand-icon">
            <BookOpenCheck size={28} />
          </div>
          <h1>ClassTrack</h1>
          <p className="school-subtitle">Greenfield Primary School Attendance System</p>

          <div className="auth-status-chip">
            {isSupabaseConfigured ? (
              <span className="chip-live">
                <CheckCircle2 size={13} /> Live Supabase Auth Active
              </span>
            ) : (
              <span className="chip-demo">
                <Sparkles size={13} /> Development Demo Mode
              </span>
            )}
          </div>
        </div>

        {/* Main Login Form */}
        <form className="login-form" onSubmit={handleLogin}>
          {errorMessage && (
            <div className="login-error-banner" role="alert">
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="input-group">
            <label htmlFor="login-email">School Email Address</label>
            <div className="input-field-wrapper">
              <Mail size={17} className="input-icon" />
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. teacher@greenfield.edu"
              />
            </div>
          </div>

          <div className="input-group">
            <div className="password-label-row">
              <label htmlFor="login-password">Password</label>
              <button
                type="button"
                className="forgot-link"
                onClick={() => {
                  setResetEmail(email || "");
                  setResetStatus("idle");
                  setResetMessage("");
                  setResetModalOpen(true);
                }}
              >
                Forgot password?
              </button>
            </div>
            <div className="input-field-wrapper">
              <Lock size={17} className="input-icon" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="button button-primary login-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading-spinner-label">Signing in...</span>
            ) : (
              <>
                <ShieldCheck size={18} />
                <span>Sign In to ClassTrack</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Logins Section */}
        {!isSupabaseConfigured && (
          <div className="demo-accounts-section">
            <div className="demo-accounts-header">
              <Info size={14} />
              <strong>Quick Demo Sign-In (Click to fill)</strong>
            </div>
            <p className="demo-accounts-note">
              Select any role below to pre-fill test credentials and explore role-based permissions:
            </p>
            <div className="demo-accounts-grid">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  type="button"
                  key={acc.email}
                  className={`demo-pill ${email === acc.email ? "demo-pill-active" : ""}`}
                  onClick={() => handleQuickFill(acc)}
                >
                  <div className="demo-pill-header">
                    <span className={`role-tag role-tag-${acc.role}`}>
                      {acc.role === "admin" ? "Admin" : "Teacher"}
                    </span>
                    <strong>{acc.name}</strong>
                  </div>
                  <span className="demo-pill-desc">{acc.description}</span>
                  <div className="demo-pill-classes">
                    {acc.assignedClasses.length > 0 ? (
                      acc.assignedClasses.join(", ")
                    ) : (
                      <em className="text-warning">No classes assigned (empty state test)</em>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Security & Footer Notice */}
        <div className="login-footer">
          <p>
            Protected by Role-Based Access Control · Greenfield Primary Demo School
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {resetModalOpen && (
        <Modal
          title="Reset Your Password"
          subtitle="Enter your registered school email to receive password recovery instructions."
          onClose={() => setResetModalOpen(false)}
        >
          <form className="form-body" onSubmit={handlePasswordReset}>
            {resetMessage && (
              <div
                className={`login-error-banner ${
                  resetStatus === "success" ? "login-success-banner" : ""
                }`}
              >
                {resetStatus === "success" ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                <span>{resetMessage}</span>
              </div>
            )}

            <label>
              School Email Address
              <input
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="teacher@greenfield.edu"
              />
            </label>

            <div className="modal-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setResetModalOpen(false)}
              >
                Close
              </button>
              <button
                type="submit"
                className="button button-primary"
                disabled={resetStatus === "loading"}
              >
                {resetStatus === "loading" ? "Sending..." : "Send Reset Link"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
