"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import type { PokemonListItem } from "@/lib/pokemon";
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

export default function PokemonGrid({ pokemon }: { pokemon: PokemonListItem[] }) {
  const [search, setSearch] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

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
      return matchesSearch && matchesType;
    });

    return result.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "id")        cmp = a.id - b.id;
      else if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "total") cmp = a.total - b.total;
      else cmp = (a.stats[sortKey] ?? 0) - (b.stats[sortKey] ?? 0);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [pokemon, search, selectedTypes, sortKey, sortDir]);

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

  return (
    <div className={styles.wrapper}>
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
      </div>

      {/* Type filters */}
      <div className={styles.typeBar}>
        <button
          className={styles.clearBtn}
          onClick={() => setSelectedTypes(new Set())}
          style={{ visibility: selectedTypes.size > 0 ? "visible" : "hidden" }}
        >
          ✕ {selectedTypes.size === 1
            ? [...selectedTypes][0]
            : `${selectedTypes.size} types`}
        </button>
        <div className={styles.typeGrid}>
          {allTypes.map((type) => (
            <button
              key={type}
              onClick={() => toggleType(type)}
              disabled={!availableTypes.has(type)}
              className={`${styles.typeBtn} ${styles[type]} ${selectedTypes.has(type) ? styles.activeType : ""} ${!availableTypes.has(type) ? styles.disabledType : ""}`}
            >
              {type}
              {selectedTypes.has(type) && (
                <span className={styles.typeX}>×</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {filtered.length > 0 ? (
        <ul className={styles.grid}>
          {filtered.map((p) => (
            <li key={p.id}>
              <Link href={`/pokemon/${p.name}`} className={styles.card}>
                <Image src={p.sprite} alt={p.name} width={96} height={96} />
                <span className={styles.id}>#{String(p.id).padStart(3, "0")}</span>
                <span className={styles.name}>{p.name}</span>
                <div className={styles.types}>
                  {p.types.map((t) => (
                    <span key={t} className={`${styles.badge} ${styles[t]}`}>{t}</span>
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>No Pokémon found.</p>
      )}
    </div>
  );
}
