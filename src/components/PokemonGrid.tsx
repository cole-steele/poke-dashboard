"use client";

import { useState, useMemo, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import type { PokemonListItem } from "@/lib/pokemon";
import { toggleBookmark } from "@/app/actions/bookmarks";
import styles from "./PokemonGrid.module.scss";

type SortKey = "id" | "name" | "total" | "hp" | "attack" | "defense" | "special-attack" | "special-defense" | "speed";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "id",               label: "#"       },
  { key: "name",             label: "A–Z"     },
  { key: "total",            label: "Total"   },
  { key: "hp",               label: "HP"      },
  { key: "attack",           label: "Atk"     },
  { key: "defense",          label: "Def"     },
  { key: "special-attack",   label: "Sp.Atk"  },
  { key: "special-defense",  label: "Sp.Def"  },
  { key: "speed",            label: "Spd"     },
];

export default function PokemonGrid({
  pokemon,
  bookmarks,
}: {
  pokemon: PokemonListItem[];
  bookmarks: Set<string>;
}) {
  const [search, setSearch] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [savedOnly, setSavedOnly] = useState(false);
  const [localBookmarks, setLocalBookmarks] = useState<Set<string>>(() => new Set(bookmarks));
  const [pendingBookmarks, setPendingBookmarks] = useState<Set<string>>(new Set());
  const [actionError, setActionError] = useState<string | null>(null);
  const [, startBookmarkTransition] = useTransition();

  const sortIsDefault = sortKey === "id" && sortDir === "asc";
  const hasActiveFilters = selectedTypes.size > 0 || !sortIsDefault || savedOnly;

  const activeSortLabel = useMemo(() => {
    const opt = SORT_OPTIONS.find((o) => o.key === sortKey);
    return `${opt?.label} ${sortDir === "asc" ? "↑" : "↓"}`;
  }, [sortKey, sortDir]);

  const allTypes = useMemo(
    () => [...new Set(pokemon.flatMap((p) => p.types))].sort(),
    [pokemon]
  );

  const availableTypes = useMemo(() => {
    if (selectedTypes.size === 0) return new Set(allTypes);
    return new Set(
      allTypes.filter((type) => {
        if (selectedTypes.has(type)) return true;
        return pokemon.some(
          (p) =>
            p.types.includes(type) &&
            [...selectedTypes].every((t) => p.types.includes(t))
        );
      })
    );
  }, [pokemon, allTypes, selectedTypes]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const result = pokemon.filter((p) => {
      const matchesSearch = p.name.includes(q);
      const matchesType =
        selectedTypes.size === 0 ||
        [...selectedTypes].every((t) => p.types.includes(t));
      const matchesSaved = !savedOnly || localBookmarks.has(p.name);
      return matchesSearch && matchesType && matchesSaved;
    });

    return result.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "id")         cmp = a.id - b.id;
      else if (sortKey === "name")  cmp = a.name.localeCompare(b.name);
      else if (sortKey === "total") cmp = a.total - b.total;
      else cmp = (a.stats[sortKey] ?? 0) - (b.stats[sortKey] ?? 0);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [pokemon, search, selectedTypes, sortKey, sortDir, savedOnly, localBookmarks]);

  function toggleType(type: string) {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function handleGridBookmark(e: React.MouseEvent, name: string) {
    e.preventDefault();
    e.stopPropagation();
    if (pendingBookmarks.has(name)) return;

    const wasBookmarked = localBookmarks.has(name);
    setActionError(null);
    setLocalBookmarks((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
    setPendingBookmarks((prev) => new Set(prev).add(name));
    startBookmarkTransition(async () => {
      const result = await toggleBookmark(name);
      if (result.error) {
        setLocalBookmarks((prev) => {
          const next = new Set(prev);
          wasBookmarked ? next.add(name) : next.delete(name);
          return next;
        });
        setActionError(result.error);
        setPendingBookmarks((prev) => {
          const next = new Set(prev);
          next.delete(name);
          return next;
        });
        return;
      }
      setLocalBookmarks((prev) => {
        const next = new Set(prev);
        result.bookmarked ? next.add(name) : next.delete(name);
        return next;
      });
      setPendingBookmarks((prev) => {
        const next = new Set(prev);
        next.delete(name);
        return next;
      });
    });
  }

  function clearAll() {
    setSelectedTypes(new Set());
    setSortKey("id");
    setSortDir("asc");
    setSavedOnly(false);
  }

  return (
    <div className={styles.wrapper}>
      {actionError && <p className={styles.errorMessage}>{actionError}</p>}

      {/* Search + sort */}
      <div className={styles.controlBar}>
        <input
          type="search"
          placeholder="Search Pokémon..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
        <div className={styles.sortGroup}>
          {SORT_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => toggleSort(key)}
              className={`${styles.sortBtn} ${sortKey === key ? styles.activeSort : ""}`}
            >
              {label}
              {sortKey === key && (
                <span className={styles.arrow}>{sortDir === "asc" ? "↑" : "↓"}</span>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={() => setSavedOnly((v) => !v)}
          className={`${styles.sortBtn} ${savedOnly ? styles.activeSort : ""}`}
        >
          ★ Saved
        </button>
      </div>

      {/* Active filters box + type grid */}
      <div className={styles.filterRow}>
        <div className={styles.selectedBox}>
          {savedOnly && (
            <button className={styles.activeTag} onClick={() => setSavedOnly(false)}>
              ★ Saved <span className={styles.tagX}>×</span>
            </button>
          )}
          {!sortIsDefault && (
            <button
              className={styles.activeTag}
              onClick={() => { setSortKey("id"); setSortDir("asc"); }}
            >
              {activeSortLabel} <span className={styles.tagX}>×</span>
            </button>
          )}
          {[...selectedTypes].map((type) => (
            <button
              key={type}
              className={`${styles.activeTag} ${styles.typeTag} ${styles[type]}`}
              onClick={() => toggleType(type)}
            >
              {type} <span className={styles.tagX}>×</span>
            </button>
          ))}
          <button
            className={styles.clearAll}
            onClick={clearAll}
            style={{ visibility: hasActiveFilters ? "visible" : "hidden" }}
          >
            Clear all
          </button>
        </div>

        <div className={styles.typeGrid}>
          {allTypes.map((type) => (
            <button
              key={type}
              onClick={() => toggleType(type)}
              disabled={!availableTypes.has(type)}
              className={`${styles.typeBtn} ${styles[type]} ${selectedTypes.has(type) ? styles.activeType : ""} ${!availableTypes.has(type) ? styles.disabledType : ""}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {filtered.length > 0 ? (
        <ul className={styles.grid}>
          {filtered.map((p) => (
            <li key={p.id}>
              <div className={styles.card}>
                <Link href={`/pokemon/${p.name}`} className={styles.cardInner}>
                  <Image src={p.sprite} alt={p.name} width={96} height={96} />
                  <span className={styles.id}>#{String(p.id).padStart(3, "0")}</span>
                  <span className={styles.name}>{p.name}</span>
                  <div className={styles.types}>
                    {p.types.map((t) => (
                      <span key={t} className={`${styles.badge} ${styles[t]}`}>{t}</span>
                    ))}
                  </div>
                </Link>
                <button
                  className={`${styles.saveBtn} ${localBookmarks.has(p.name) ? styles.saveBtnSaved : ""} ${pendingBookmarks.has(p.name) ? styles.saveBtnPending : ""}`}
                  onClick={(e) => handleGridBookmark(e, p.name)}
                  disabled={pendingBookmarks.has(p.name)}
                  aria-label={localBookmarks.has(p.name) ? "Remove bookmark" : "Save"}
                  aria-busy={pendingBookmarks.has(p.name)}
                >
                  {pendingBookmarks.has(p.name) ? "..." : localBookmarks.has(p.name) ? "★" : "☆"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>
            {savedOnly ? "No saved Pokemon yet." : "No Pokemon found."}
          </p>
          <p className={styles.emptyText}>
            {savedOnly
              ? "Save Pokemon with the star button, then use this filter to review them."
              : "Try a different search, type filter, or sort option."}
          </p>
        </div>
      )}
      <a href="#top" className={styles.backToTop}>Back to top</a>
    </div>
  );
}
