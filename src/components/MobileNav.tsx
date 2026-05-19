"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import styles from "./Nav.module.scss";

export default function MobileNav({ email }: { email: string | null }) {
  const [open, setOpen] = useState(false);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <div className={styles.mobileNav}>
      <button
        type="button"
        className={styles.menuButton}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span />
        <span />
        <span />
      </button>

      {open && (
        <div className={styles.mobileLayer}>
          <button
            type="button"
            className={styles.mobileOverlay}
            aria-label="Close menu"
            onClick={closeMenu}
          />
          <aside className={styles.mobilePanel}>
            <div className={styles.mobilePanelHeader}>
              <span className={styles.mobileTitle}>Menu</span>
              <button
                type="button"
                className={styles.closeButton}
                aria-label="Close menu"
                onClick={closeMenu}
              >
                x
              </button>
            </div>

            <Link href="/" className={styles.mobileLink} onClick={closeMenu}>
              Pokédex
            </Link>
            <Link href="/team" className={styles.mobileLink} onClick={closeMenu}>
              Team Builder
            </Link>

            <div className={styles.accountBlock}>
              <span className={styles.accountLabel}>Current account</span>
              {email ? (
                <span className={styles.accountEmail}>{email}</span>
              ) : (
                <span className={styles.accountEmail}>Not signed in</span>
              )}
            </div>

            {email ? (
              <form action={signOut}>
                <button className={styles.mobileAction}>Sign out</button>
              </form>
            ) : (
              <Link href="/login" className={styles.mobileActionLink} onClick={closeMenu}>
                Sign in
              </Link>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
