import styles from "./StatBadge.module.scss";

export function PhysicalBadge() {
  return <span className={styles.physical}>Physical</span>;
}

export function SpecialBadge() {
  return <span className={styles.special}>Special</span>;
}
