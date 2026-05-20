"use client";

import { useState, useMemo } from "react";
import type { MoveDetail } from "@/lib/pokemon";
import styles from "./MoveList.module.scss";

type SortField = "level" | "name" | "pp";
type SortDir = "asc" | "desc";

const SORT_LABELS: Record<SortField, string> = {
  level: "Level",
  name: "A–Z",
  pp: "PP",
};

export default function MoveList({ moves }: { moves: MoveDetail[] }) {
  const [search, setSearch] = useState("");
  const [typeFilters, setTypeFilters] = useState<Set<string>>(new Set());
  const [classFilters, setClassFilters] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("level");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const allTypes = useMemo(
    () => [...new Set(moves.map((m) => m.type))].sort(),
    [moves]
  );

  const filtered = useMemo(() => {
    let list = moves;
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((m) => m.name.replace(/-/g, " ").includes(q));
    if (typeFilters.size > 0) list = list.filter((m) => typeFilters.has(m.type));
    if (classFilters.size > 0) list = list.filter((m) => classFilters.has(m.damageClass));

    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortField === "level") cmp = a.level - b.level;
      else if (sortField === "name") cmp = a.name.localeCompare(b.name);
      else cmp = a.pp - b.pp;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [moves, search, typeFilters, classFilters, sortField, sortDir]);

  function toggleType(t: string) {
    setTypeFilters((prev) => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });
  }
  function toggleClass(c: string) {
    setClassFilters((prev) => {
      const next = new Set(prev);
      next.has(c) ? next.delete(c) : next.add(c);
      return next;
    });
  }
  function handleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  }
  function clearAll() {
    setSearch("");
    setTypeFilters(new Set());
    setClassFilters(new Set());
    setSortField("level");
    setSortDir("asc");
  }

  const isFiltered = !!(search || typeFilters.size > 0 || classFilters.size > 0);
  const activeTags = [
    ...[...typeFilters].map((t) => ({ key: t, label: t, kind: "type" as const })),
    ...[...classFilters].map((c) => ({ key: c, label: c, kind: "class" as const })),
  ];

  return (
    <div className={styles.root}>
      <div className={styles.controls}>

        {/* Search + sort inline */}
        <div className={styles.topRow}>
          <div className={styles.searchWrap}>
            <input
              className={styles.search}
              type="text"
              placeholder="Search moves…"
              value={search}
              maxLength={50}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className={styles.clearBtn} onClick={() => setSearch("")} aria-label="Clear search">
                ×
              </button>
            )}
          </div>
          <div className={styles.sortGroup}>
            {(["level", "name", "pp"] as const).map((f) => (
              <button
                key={f}
                className={`${styles.sortBtn} ${sortField === f ? styles.active : ""}`}
                onClick={() => handleSort(f)}
              >
                {SORT_LABELS[f]}
                {sortField === f && (
                  <span className={styles.sortArrow}>{sortDir === "asc" ? "↑" : "↓"}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Selected tags box */}
        <div className={styles.tagBox}>
          {activeTags.length === 0 ? (
            <span className={styles.tagPlaceholder}>Click types or classes below to filter…</span>
          ) : (
            activeTags.map(({ key, label, kind }) => (
              <button
                key={key}
                className={`${styles.tag} ${kind === "type" ? styles[key] : styles[`class${key[0].toUpperCase()}${key.slice(1)}`]}`}
                onClick={() => kind === "type" ? toggleType(key) : toggleClass(key)}
              >
                {label} ×
              </button>
            ))
          )}
        </div>

        {/* Type grid */}
        <div className={styles.typeGrid}>
          {allTypes.map((t) => (
            <button
              key={t}
              className={`${styles.typePill} ${styles[t]} ${typeFilters.has(t) ? styles.active : ""}`}
              onClick={() => toggleType(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Class pills */}
        <div className={styles.pillGroup}>
          {(["physical", "special", "status"] as const).map((c) => (
            <button
              key={c}
              className={`${styles.classPill} ${styles[`class${c[0].toUpperCase()}${c.slice(1)}`]} ${classFilters.has(c) ? styles.active : ""}`}
              onClick={() => toggleClass(c)}
            >
              {c}
            </button>
          ))}
        </div>

      </div>

      {isFiltered && (
        <div className={styles.filterStatus}>
          <p className={styles.resultCount}>
            {filtered.length} {filtered.length === 1 ? "move" : "moves"}
          </p>
          <button className={styles.clearAll} onClick={clearAll}>Clear all</button>
        </div>
      )}

      <div className={styles.moveList}>
        {filtered.length === 0 ? (
          <p className={styles.empty}>No moves match these filters.</p>
        ) : (
          filtered.map((move) => (
            <div key={move.name} className={styles.moveRow}>
              <div className={styles.moveMeta}>
                <div className={styles.moveNameRow}>
                  <span className={styles.moveLevel}>Lv.{move.level}</span>
                  <span className={styles.moveName}>{move.name.replace(/-/g, " ")}</span>
                </div>
                <div className={styles.moveBadges}>
                  <span className={`${styles.badge} ${styles[move.type]}`}>{move.type}</span>
                  <span className={`${styles.moveClass} ${
                    move.damageClass === "physical" ? styles.moveClassPhysical :
                    move.damageClass === "special"  ? styles.moveClassSpecial :
                                                      styles.moveClassStatus
                  }`}>
                    {move.damageClass}
                  </span>
                  {move.damageClass !== "status" && (
                    <span className={`${styles.movePow} ${
                      move.damageClass === "physical" ? styles.moveClassPhysical : styles.moveClassSpecial
                    }`}>
                      {move.power ?? "—"} pow
                    </span>
                  )}
                  <span className={styles.movePP}>{move.pp} PP</span>
                </div>
              </div>
              {move.flavorText && (
                <p className={styles.moveFlavorText}>{move.flavorText}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
