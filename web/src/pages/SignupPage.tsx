import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { signup } from "../api/auth";
import type { ApiError } from "../lib/api";
import { ui } from "../lib/ui";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Move focus to the confirmation heading once sign-up succeeds, so keyboard
  // and screen-reader users aren't stranded on the now-unmounted form.
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (done) successHeadingRef.current?.focus();
  }, [done]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Enter your email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await signup(email, password);
      setDone(true);
    } catch (err) {
      setError((err as ApiError).message ?? "Sign-up failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className={`${ui.card} text-center`}>
        <h1
          ref={successHeadingRef}
          tabIndex={-1}
          className="mb-2 text-2xl font-bold focus:outline-none"
        >
          Check your email
        </h1>
        <p className={ui.muted}>
          We sent a verification link to <strong>{email}</strong>. Open it to
          verify your account, then log in. The link expires in 24 hours.
        </p>
        <Link className={`${ui.btnPrimary} ${ui.btnBlock}`} to="/login">
          Continue to login
        </Link>
      </div>
    );
  }

  return (
    <div className={ui.card}>
      <h1 className="text-2xl font-bold">Create account</h1>
      <p className={ui.muted}>Email verification is required.</p>

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
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "signup-error" : undefined}
        />

        <label className={ui.label} htmlFor="password">
          Password
        </label>
        <input
          id="password"
          className={ui.input}
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimum 8 characters"
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "signup-error" : undefined}
        />

        <label className={ui.label} htmlFor="confirm">
          Confirm password
        </label>
        <input
          id="confirm"
          className={ui.input}
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "signup-error" : undefined}
        />

        {error && (
          <p id="signup-error" role="alert" className={ui.statusError}>
            {error}
          </p>
        )}

        <button
          className={`${ui.btnPrimary} ${ui.btnBlock}`}
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Creating account…" : "Sign up"}
        </button>
      </form>

      <p className={ui.footer}>
        Already registered?{" "}
        <Link className={ui.link} to="/login">
          Log in →
        </Link>
      </p>
    </div>
  );
}
