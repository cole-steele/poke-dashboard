"use client";

import Link from "next/link";
import styles from "../../error.module.scss";

export default function PokemonError({ reset }: { reset: () => void }) {
  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <h1 className={styles.title}>This Pokemon could not load.</h1>
        <p className={styles.message}>
          PokeAPI may be temporarily unavailable, or the detail data could not be fetched.
        </p>
        <div className={styles.actions}>
          <button className={styles.button} onClick={reset}>Try again</button>
          <Link className={styles.link} href="/">Back to dashboard</Link>
        </div>
      </section>
    </main>
  );
}
