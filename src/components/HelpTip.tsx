"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./HelpTip.module.scss";

interface Props {
  children: React.ReactNode;
}

export default function HelpTip({ children }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        className={styles.trigger}
        onClick={() => setOpen((v) => !v)}
        aria-label="What is this?"
      >
        ?
      </button>
      {open && (
        <div className={styles.popover} role="tooltip">
          {children}
        </div>
      )}
    </div>
  );
}
