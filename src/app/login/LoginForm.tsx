"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, sendPasswordReset } from "@/app/actions/auth";
import styles from "./page.module.scss";

export default function LoginForm({ nextPath, verified }: { nextPath: string; verified?: boolean }) {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [signInState, signInAction, signingIn] = useActionState(signIn, null);
  const [signUpState, signUpAction, signingUp] = useActionState<
    { error?: string; checkEmail?: boolean } | null,
    FormData
  >(signUp, null);
  const [forgotState, forgotAction, sendingReset] = useActionState<
    { error?: string; sent?: boolean } | null,
    FormData
  >(sendPasswordReset, null);

  const isSignIn = mode === "signin";
  const isForgot = mode === "forgot";
  const pending = isSignIn ? signingIn : isForgot ? sendingReset : signingUp;
  const serverError = isSignIn ? signInState?.error : isForgot ? forgotState?.error : signUpState?.error;

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    if (mode === "signup") {
      const form = e.currentTarget;
      const password = (form.elements.namedItem("password") as HTMLInputElement).value;
      const confirm = (form.elements.namedItem("confirm") as HTMLInputElement).value;
      if (password !== confirm) {
        e.preventDefault();
        setConfirmError("Passwords do not match");
        return;
      }
    }
    setConfirmError(null);
  }

  function switchMode(next: "signin" | "signup" | "forgot") {
    setMode(next);
    setConfirmError(null);
  }

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>TeamDex</h1>

      {!isForgot && (
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${isSignIn ? styles.active : ""}`}
            onClick={() => switchMode("signin")}
          >
            Sign in
          </button>
          <button
            className={`${styles.tab} ${mode === "signup" ? styles.active : ""}`}
            onClick={() => switchMode("signup")}
          >
            Sign up
          </button>
        </div>
      )}

      {verified && (
        <p className={styles.notice}>Email confirmed! Sign in to get started.</p>
      )}

      {signUpState?.checkEmail ? (
        <p className={styles.notice}>Check your inbox for a confirmation link.</p>
      ) : forgotState?.sent ? (
        <p className={styles.notice}>Check your inbox for a reset link.</p>
      ) : (
        <form action={isSignIn ? signInAction : isForgot ? forgotAction : signUpAction} onSubmit={handleSubmit} className={styles.form}>
          {!isForgot && <input type="hidden" name="next" value={nextPath} />}
          <label className={styles.label}>
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className={styles.input}
            />
          </label>

          {!isForgot && (
            <label className={styles.label}>
              Password
              <input
                name="password"
                type="password"
                required
                autoComplete={isSignIn ? "current-password" : "new-password"}
                className={styles.input}
              />
            </label>
          )}

          {mode === "signup" && (
            <label className={styles.label}>
              Confirm password
              <input
                name="confirm"
                type="password"
                required
                autoComplete="new-password"
                className={styles.input}
              />
            </label>
          )}

          {(confirmError || serverError) && (
            <p className={styles.error}>{confirmError ?? serverError}</p>
          )}

          <button type="submit" disabled={pending} className={styles.submit}>
            {pending ? "..." : isSignIn ? "Sign in" : isForgot ? "Send reset link" : "Sign up"}
          </button>

          {isSignIn && (
            <button type="button" className={styles.forgotLink} onClick={() => switchMode("forgot")}>
              Forgot password?
            </button>
          )}

          {isForgot && (
            <button type="button" className={styles.forgotLink} onClick={() => switchMode("signin")}>
              Back to sign in
            </button>
          )}
        </form>
      )}

      {(signUpState?.checkEmail || forgotState?.sent) && (
        <button className={styles.forgotLink} onClick={() => switchMode("signin")}>
          Back to sign in
        </button>
      )}
    </div>
  );
}
