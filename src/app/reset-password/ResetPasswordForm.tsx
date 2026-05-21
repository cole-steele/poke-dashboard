"use client";

import { useActionState, useState } from "react";
import { updatePassword } from "@/app/actions/auth";
import styles from "@/app/login/page.module.scss";

export default function ResetPasswordForm() {
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [state, action, pending] = useActionState<
    { error?: string; success?: boolean } | null,
    FormData
  >(updatePassword, null);

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    const form = e.currentTarget;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const confirm = (form.elements.namedItem("confirm") as HTMLInputElement).value;
    if (password !== confirm) {
      e.preventDefault();
      setConfirmError("Passwords do not match");
      return;
    }
    setConfirmError(null);
  }

  if (state?.success) {
    return (
      <div className={styles.card}>
        <h1 className={styles.title}>TeamDex</h1>
        <p className={styles.notice}>Password updated! <a href="/login">Sign in</a>.</p>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>TeamDex</h1>
      <form action={action} onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label}>
          New password
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={styles.input}
          />
        </label>
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

        {(confirmError || state?.error) && (
          <p className={styles.error}>{confirmError ?? state?.error}</p>
        )}

        <button type="submit" disabled={pending} className={styles.submit}>
          {pending ? "..." : "Update password"}
        </button>
      </form>
    </div>
  );
}
