"use client";

import { useActionState, useState } from "react";
import { signIn, signUp } from "@/app/actions/auth";
import styles from "./page.module.scss";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [confirmError, setConfirmError] = useState<string | null>(null);
  // clear client-side errors when switching tabs
  const [signInState, signInAction, signingIn] = useActionState(signIn, null);
  const [signUpState, signUpAction, signingUp] = useActionState(signUp, null);

  const isSignIn = mode === "signin";
  const pending = isSignIn ? signingIn : signingUp;
  const serverError = isSignIn ? signInState?.error : signUpState?.error;

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    if (!isSignIn) {
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

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Poke Dashboard</h1>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${isSignIn ? styles.active : ""}`}
            onClick={() => { setMode("signin"); setConfirmError(null); }}
          >
            Sign in
          </button>
          <button
            className={`${styles.tab} ${!isSignIn ? styles.active : ""}`}
            onClick={() => { setMode("signup"); setConfirmError(null); }}
          >
            Sign up
          </button>
        </div>

        <form action={isSignIn ? signInAction : signUpAction} onSubmit={handleSubmit} className={styles.form}>
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

          {!isSignIn && (
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
            {pending ? "..." : isSignIn ? "Sign in" : "Sign up"}
          </button>
        </form>
      </div>
    </div>
  );
}
