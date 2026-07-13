import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, resendVerification } from "../api/auth";
import { useAuth } from "../lib/auth";
import type { ApiError } from "../lib/api";
import { ui } from "../lib/ui";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Shown when the account exists but isn't verified yet.
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">(
    "idle",
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNeedsVerification(false);
    setSubmitting(true);
    try {
      const { token, user } = await login(email, password);
      setSession(token, user);
      navigate("/", { replace: true });
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.code === "email_not_verified") {
        setNeedsVerification(true);
      }
      setError(apiErr.message ?? "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onResend() {
    setResendState("sending");
    try {
      await resendVerification(email);
    } finally {
      // Endpoint intentionally responds the same regardless; always confirm.
      setResendState("sent");
    }
  }

  return (
    <div className={ui.card}>
      <h1 className="text-2xl font-bold">Log in</h1>
      <p className={ui.muted}>Use your verified account.</p>

      <form onSubmit={onSubmit} noValidate>
        <label className={ui.label} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          className={ui.input}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          required
        />

        <label className={ui.label} htmlFor="password">
          Password
        </label>
        <input
          id="password"
          className={ui.input}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className={ui.statusError}>{error}</p>}

        <button
          className={`${ui.btnPrimary} ${ui.btnBlock}`}
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>

      {needsVerification && (
        <div className="mt-4 border-t border-slate-200 pt-4 text-center">
          <p className={ui.muted}>Account not verified?</p>
          {resendState === "sent" ? (
            <p className={ui.statusOk}>
              If an unverified account exists for that email, a new verification
              email has been sent.
            </p>
          ) : (
            <button
              className={`${ui.btn} ${ui.btnBlock}`}
              type="button"
              onClick={onResend}
              disabled={resendState === "sending" || !email}
            >
              {resendState === "sending" ? "Sending…" : "Resend email"}
            </button>
          )}
        </div>
      )}

      <p className={ui.footer}>
        <Link className={ui.link} to="/signup">
          Create an account →
        </Link>
      </p>
    </div>
  );
}
