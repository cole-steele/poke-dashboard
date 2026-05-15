"use client";

import { useState, useEffect } from "react";
import styles from "./BackToTop.module.scss";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`${styles.button} ${visible ? styles.visible : ""}`}
      aria-label="Back to top"
    >
      ↑
    </button>
  );
}
