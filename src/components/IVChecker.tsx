"use client";

import { useState } from "react";
import HelpTip from "./HelpTip";
import STAT_DESC from "@/lib/statDesc";
import styles from "./IVChecker.module.scss";

interface StatInfo {
  name: string;
  base: number;
}

interface Props {
  stats: StatInfo[];
}

const GENS = [
  { label: "Gen I",   value: 1 },
  { label: "Gen II",  value: 2 },
  { label: "Gen III+", value: 3 },
] as const;

function calcHP(base: number, iv: number, level: number): number {
  return Math.floor(((2 * base + iv) * level) / 100) + level + 10;
}

function calcStat(base: number, iv: number, level: number): number {
  return Math.floor(((2 * base + iv) * level) / 100) + 5;
}

function getRange(base: number, level: number, isHP: boolean, gen: number) {
  const maxIV = gen <= 2 ? 15 : 31;
  const calc = isHP ? calcHP : calcStat;
  return { min: calc(base, 0, level), max: calc(base, maxIV, level) };
}

function rate(value: number, min: number, max: number) {
  if (value >= max) return { label: "Perfect", key: "perfect" };
  const pct = (value - min) / (max - min);
  if (pct >= 0.75) return { label: "Great", key: "great" };
  if (pct >= 0.5)  return { label: "Good",  key: "good" };
  if (pct >= 0.25) return { label: "OK",    key: "ok" };
  return { label: "Poor", key: "poor" };
}

export default function IVChecker({ stats }: Props) {
  const [gen, setGen] = useState(3);
  const [level, setLevel] = useState(50);
  const [values, setValues] = useState<Record<string, string>>({});

  const genIndex = GENS.findIndex((g) => g.value === gen);
  const isLegacy = gen <= 2;

  return (
    <div className={styles.checker}>

      {/* Controls row */}
      <div className={styles.controls}>
        <div
          className={styles.genSwitcher}
          style={{ "--index": genIndex } as React.CSSProperties}
        >
          <div className={styles.genSlider} />
          {GENS.map((g) => (
            <button
              key={g.value}
              className={`${styles.genBtn} ${gen === g.value ? styles.active : ""}`}
              onClick={() => { setGen(g.value); setValues({}); }}
            >
              {g.label}
            </button>
          ))}
        </div>

        <div className={styles.levelRow}>
          <label htmlFor="iv-level" className={styles.levelLabel}>Level</label>
          <input
            id="iv-level"
            type="number"
            min={1}
            max={100}
            value={level}
            onChange={(e) => setLevel(Math.max(1, Math.min(100, Number(e.target.value))))}
            className={styles.levelInput}
          />
        </div>
      </div>

      {/* Stat rows */}
      <div className={styles.rows}>
        {stats.map(({ name, base }) => {
          const isHP = name === "hp";
          const { min, max } = getRange(base, level, isHP, gen);
          const raw = values[name];
          const actual = raw !== undefined && raw !== "" ? Number(raw) : null;
          const rating = actual !== null ? rate(actual, min, max) : null;
          const pct = actual !== null ? Math.max(0, Math.min(1, (actual - min) / (max - min))) : null;
          const desc = STAT_DESC[name];

          return (
            <div key={name} className={styles.row}>
              <span className={styles.statName}>
                <span className={styles.statNameText}>{name.replace(/-/g, " ")}</span>
                {desc && <HelpTip><p>{desc}</p></HelpTip>}
              </span>
              <span className={styles.range}>{min}–{max}</span>
              <input
                type="number"
                placeholder="—"
                value={raw ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [name]: e.target.value }))}
                className={styles.statInput}
              />
              <div className={styles.result}>
                <div className={styles.track}>
                  {pct !== null && (
                    <div
                      className={`${styles.fill} ${rating ? styles[rating.key] : ""}`}
                      style={{ width: `${pct * 100}%` }}
                    />
                  )}
                </div>
                {rating && (
                  <span className={`${styles.ratingLabel} ${styles[rating.key]}`}>
                    {rating.label}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer notes */}
      <div className={styles.footer}>
        {isLegacy ? (
          <>
            <span className={styles.footerItem}>
              <span className={styles.footerText}>0 Stat Exp</span>
              <HelpTip>
                <p><strong>Stat Experience</strong> is the Gen I–II equivalent of EVs, points earned through battle. This checker assumes none, so a trained Pokémon will show stats above the max line.</p>
              </HelpTip>
            </span>
            <span className={styles.footerDot}>·</span>
            <span className={styles.footerItem}>
              <span className={styles.footerText}>DVs 0–15</span>
              <HelpTip>
                <p>In Gen I–II, hidden values were called <strong>DVs (Determinant Values)</strong> and ranged 0–15 instead of 0–31. The gap between best and worst is smaller than in later games.</p>
                {gen === 1 && <p>Gen I used a single <strong>Special</strong> stat covering both attack and defense. It wasn&apos;t split until Gen II.</p>}
              </HelpTip>
            </span>
          </>
        ) : (
          <>
            <span className={styles.footerItem}>
              <span className={styles.footerText}>0 EVs</span>
              <HelpTip>
                <p><strong>Effort Values</strong> are bonus stat points earned through battling. A freshly caught Pokémon has 0 EVs. Training can add up to 63 points to a single stat at level 100.</p>
                <p>This checker assumes no EVs, so trained Pokémon will show stats above the max line.</p>
              </HelpTip>
            </span>
            <span className={styles.footerDot}>·</span>
            <span className={styles.footerItem}>
              <span className={styles.footerText}>neutral nature</span>
              <HelpTip>
                <p><strong>Nature</strong> is assigned randomly at birth and modifies one stat by +10% and another by -10%. A neutral nature has no effect. This checker assumes neutral.</p>
              </HelpTip>
            </span>
            <span className={styles.footerDot}>·</span>
            <span className={styles.footerItem}>
              <span className={styles.footerText}>Gen III+ formula</span>
              <HelpTip>
                <p><strong>Generation III</strong> (Ruby/Sapphire, 2002) introduced the modern stat formula and IVs (0–31). Switch to Gen I or Gen II above to use the older DV formula.</p>
              </HelpTip>
            </span>
          </>
        )}
      </div>
    </div>
  );
}
