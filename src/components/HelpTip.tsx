"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import styles from "./HelpTip.module.scss";

interface Props {
  children: React.ReactNode;
}

export default function HelpTip({ children }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !popoverRef.current) return;
    const el = popoverRef.current;
    el.style.transform = "";
    const rect = el.getBoundingClientRect();
    const margin = 8;
    let nudge = 0;
    if (rect.right > window.innerWidth - margin) nudge = window.innerWidth - margin - rect.right;
    if (rect.left < margin) nudge = margin - rect.left;
    if (nudge !== 0) el.style.transform = `translateX(calc(-50% + ${nudge}px))`;
  }, [open]);

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        className={styles.trigger}
        onClick={() => setOpen((v) => !v)}
        aria-label="What is this?"
      >
        ?
      </button>
      {open && (
        <div className={styles.popover} ref={popoverRef} role="tooltip">
          {children}
        </div>
      )}
    </div>
  );
}
