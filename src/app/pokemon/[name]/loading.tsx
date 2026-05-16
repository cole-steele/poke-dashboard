import styles from "./loading.module.scss";

function Bone({ w, h }: { w?: string; h?: string }) {
  return (
    <div
      className={styles.bone}
      style={{ width: w ?? "100%", height: h ?? "16px" }}
    />
  );
}

export default function Loading() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Bone w="48px" h="14px" />

        {/* Header */}
        <div className={styles.header}>
          <Bone w="240px" h="240px" />
          <div className={styles.meta}>
            <Bone w="48px" h="13px" />
            <Bone w="180px" h="36px" />
            <Bone w="100px" h="14px" />
            <div className={styles.row}>
              <Bone w="60px" h="26px" />
              <Bone w="60px" h="26px" />
            </div>
            <div className={styles.row}>
              <Bone w="80px" h="13px" />
              <Bone w="80px" h="13px" />
              <Bone w="80px" h="13px" />
            </div>
            <div className={styles.col}>
              <Bone w="60px" h="12px" />
              <Bone w="120px" h="14px" />
              <Bone w="120px" h="14px" />
            </div>
          </div>
        </div>

        {/* Flavor text */}
        <div className={styles.section}>
          <Bone w="80px" h="12px" />
          <Bone h="16px" />
          <Bone w="70%" h="16px" />
        </div>

        {/* Evolution */}
        <div className={styles.section}>
          <Bone w="120px" h="12px" />
          <div className={styles.row}>
            <Bone w="80px" h="80px" />
            <Bone w="24px" h="16px" />
            <Bone w="80px" h="80px" />
            <Bone w="24px" h="16px" />
            <Bone w="80px" h="80px" />
          </div>
        </div>

        {/* Stats */}
        <div className={styles.section}>
          <Bone w="80px" h="12px" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.statRow}>
              <Bone w="120px" h="13px" />
              <Bone w="32px" h="13px" />
              <Bone h="8px" />
            </div>
          ))}
        </div>

        {/* Moves */}
        <div className={styles.section}>
          <Bone w="160px" h="12px" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Bone key={i} h="56px" />
          ))}
        </div>
      </div>
    </div>
  );
}
