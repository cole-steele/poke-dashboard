import Link from "next/link";
import styles from "./not-found.module.scss";

export default function NotFound() {
  return (
    <div className={styles.page}>
      <p className={styles.number}>404</p>
      <h1 className={styles.heading}>Pokémon not found</h1>
      <p className={styles.sub}>That one must have fled.</p>
      <Link href="/" className={styles.back}>← Back to Pokédex</Link>
    </div>
  );
}
