"use client";

import Link from "next/link";
import styles from "./error.module.scss";

export default function AppError({ reset }: { reset: () => void }) {
  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <h1 className={styles.title}>Pokemon data is unavailable.</h1>
        <p className={styles.message}>
          The dashboard could not reach the Pokemon data service. Try again in a moment.
        </p>
        <div className={styles.actions}>
          <button className={styles.button} onClick={reset}>Try again</button>
          <Link className={styles.link} href="/">Back to dashboard</Link>
        </div>
      </section>
    </main>
  );
}
