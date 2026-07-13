import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resendVerification, verifyEmail, type VerifyStatus } from "../api/auth";
import { ui } from "../lib/ui";

type State = "loading" | VerifyStatus;

const badgeBase =
  "mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 text-3xl";

export default function VerifyPage() {
  const [params] = useSearchParams();
  const token = params.get("token");

  const [state, setState] = useState<State>("loading");
  const [email, setEmail] = useState("");
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">(
    "idle",
  );

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    verifyEmail(token)
      .then(setState)
      .catch(() => setState("invalid"));
  }, [token]);

  async function onResend() {
    setResendState("sending");
    try {
      await resendVerification(email);
    } finally {
      setResendState("sent");
    }
  }

  if (state === "loading") {
    return (
      <div className={`${ui.card} text-center`}>
        <p className={ui.muted}>Verifying your email…</p>
      </div>
    );
  }

  if (state === "verified") {
    return (
      <div className={`${ui.card} text-center`}>
        <div className={`${badgeBase} border-slate-900`}>✓</div>
        <h1 className="mb-2 text-2xl font-bold">Email verified</h1>
        <p className={ui.muted}>Your account is ready to use.</p>
        <Link className={`${ui.btnPrimary} ${ui.btnBlock}`} to="/login">
          Continue to login
        </Link>
      </div>
    );
  }

  // expired or invalid
  return (
    <div className={`${ui.card} text-center`}>
      <div className={`${badgeBase} border-red-600 text-red-600`}>!</div>
      <h1 className="mb-2 text-2xl font-bold">
        Link {state === "expired" ? "expired" : "invalid"}
      </h1>
      <p className={ui.muted}>
        This verification link is {state}. Request a new one below.
      </p>

      {resendState === "sent" ? (
        <p className={ui.statusOk}>
          If an unverified account exists for that email, a new verification
          email has been sent.
        </p>
      ) : (
        <div className="mt-4 flex gap-2">
          <input
            className={`${ui.input} flex-1`}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
          />
          <button
            className={ui.btnPrimary}
            type="button"
            onClick={onResend}
            disabled={resendState === "sending" || !email}
          >
            {resendState === "sending" ? "Sending…" : "Resend"}
          </button>
        </div>
      )}

      <p className={ui.footer}>
        <Link className={ui.link} to="/login">
          Back to login
        </Link>
      </p>
    </div>
  );
}
