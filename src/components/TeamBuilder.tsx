"use client";

import { useState, useMemo, useTransition } from "react";
import Image from "next/image";
import type { PokemonListItem } from "@/lib/pokemon";
import type { TeamTemplate } from "@/app/actions/team";
import {
  setTeamSlot,
  clearTeamSlot,
  clearTeam,
  saveTemplate,
  loadTemplate,
  deleteTemplate,
} from "@/app/actions/team";
import { getTeamCoverage } from "@/lib/typeChart";
import styles from "./TeamBuilder.module.scss";

export default function TeamBuilder({
  pokemon,
  initialTeam,
  initialTemplates,
}: {
  pokemon: PokemonListItem[];
  initialTeam: (PokemonListItem | null)[];
  initialTemplates: TeamTemplate[];
}) {
  const [slots, setSlots] = useState<(PokemonListItem | null)[]>(initialTeam);
  const [templates, setTemplates] = useState<TeamTemplate[]>(initialTemplates);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [, startTransition] = useTransition();
  const [, startSaveTransition] = useTransition();

  const hasTeam = slots.some(Boolean);

  const filteredPokemon = useMemo(() => {
    const q = search.toLowerCase();
    const results = q ? pokemon.filter((p) => p.name.includes(q)) : pokemon;
    return results.slice(0, 40);
  }, [pokemon, search]);

  const coverage = useMemo(
    () => getTeamCoverage(slots.filter((s): s is PokemonListItem => s !== null)),
    [slots]
  );

  function handleSlotClick(i: number) {
    setActiveSlot((prev) => (prev === i ? null : i));
    setSearch("");
  }

  function handleAdd(p: PokemonListItem) {
    if (activeSlot === null) return;
    const next = [...slots];
    next[activeSlot] = p;
    setSlots(next);
    setActiveSlot(null);
    startTransition(() => setTeamSlot(activeSlot, p.name));
  }

  function handleRemove(i: number, e: React.MouseEvent) {
    e.stopPropagation();
    const next = [...slots];
    next[i] = null;
    setSlots(next);
    if (activeSlot === i) setActiveSlot(null);
    startTransition(() => clearTeamSlot(i));
  }

  function handleClearTeam() {
    setSlots(Array(6).fill(null));
    setActiveSlot(null);
    startTransition(() => clearTeam());
  }

  function handleSaveTemplate() {
    if (!templateName.trim()) return;
    const name = templateName.trim();
    const names = slots.map((s) => s?.name ?? null);
    setTemplateName("");
    setSaving(false);
    startSaveTransition(async () => {
      const result = await saveTemplate(name, names);
      if (result) setTemplates((prev) => [result, ...prev]);
    });
  }

  function handleLoadTemplate(template: TeamTemplate) {
    const next = template.slots.map((name) =>
      name ? (pokemon.find((p) => p.name === name) ?? null) : null
    );
    setSlots(next);
    setActiveSlot(null);
    startTransition(() => loadTemplate(template.slots));
  }

  function handleDeleteTemplate(id: string) {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    startTransition(() => deleteTemplate(id));
  }

  return (
    <div className={styles.wrapper}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <button
          className={styles.clearBtn}
          onClick={handleClearTeam}
          disabled={!hasTeam}
        >
          Clear team
        </button>
        <div className={styles.saveArea}>
          {saving ? (
            <>
              <input
                type="text"
                placeholder="Template name…"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSaveTemplate(); if (e.key === "Escape") { setSaving(false); setTemplateName(""); } }}
                className={styles.templateInput}
                autoFocus
              />
              <button className={styles.confirmBtn} onClick={handleSaveTemplate} disabled={!templateName.trim()}>Save</button>
              <button className={styles.cancelBtn} onClick={() => { setSaving(false); setTemplateName(""); }}>Cancel</button>
            </>
          ) : (
            <>
              <button className={styles.saveBtn} onClick={() => setSaving(true)} disabled={!hasTeam}>
                Save as template
              </button>
              <button className={styles.saveBtn} onClick={() => setShowTemplates(true)}>
                Load template
              </button>
            </>
          )}
        </div>
      </div>

      {/* 6 team slots */}
      <div className={styles.slots}>
        {slots.map((slot, i) => (
          <div
            key={i}
            className={`${styles.slot} ${slot ? styles.filled : styles.empty} ${activeSlot === i ? styles.active : ""}`}
            onClick={() => handleSlotClick(i)}
          >
            {slot ? (
              <>
                <button className={styles.removeBtn} onClick={(e) => handleRemove(i, e)} aria-label="Remove">×</button>
                <Image src={slot.sprite} alt={slot.name} width={72} height={72} />
                <span className={styles.slotName}>{slot.name}</span>
                <div className={styles.slotTypes}>
                  {slot.types.map((t) => (
                    <span key={t} className={`${styles.badge} ${styles[t]}`}>{t}</span>
                  ))}
                </div>
              </>
            ) : (
              <span className={styles.addLabel}>+</span>
            )}
          </div>
        ))}
      </div>

      {/* Picker panel */}
      {activeSlot !== null && (
        <div className={styles.picker}>
          <input
            type="search"
            placeholder="Search Pokémon…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.pickerSearch}
            autoFocus
          />
          <div className={styles.pickerGrid}>
            {filteredPokemon.map((p) => (
              <button key={p.id} className={styles.pickerCard} onClick={() => handleAdd(p)}>
                <Image src={p.sprite} alt={p.name} width={52} height={52} />
                <span className={styles.pickerName}>{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Templates modal */}
      {showTemplates && (
        <div className={styles.modalOverlay} onClick={() => setShowTemplates(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Saved Templates</h2>
              <button className={styles.modalClose} onClick={() => setShowTemplates(false)}>×</button>
            </div>
            {templates.length === 0 ? (
              <p className={styles.noTemplates}>No saved templates yet.</p>
            ) : (
              <div className={styles.templateList}>
                {templates.map((t) => (
                  <div key={t.id} className={styles.templateRow}>
                    <div className={styles.templateInfo}>
                      <span className={styles.templateName}>{t.name}</span>
                      <div className={styles.templateSprites}>
                        {t.slots.map((name, i) => {
                          const p = name ? pokemon.find((x) => x.name === name) : null;
                          return p ? (
                            <Image key={i} src={p.sprite} alt={p.name} width={36} height={36} />
                          ) : (
                            <div key={i} className={styles.emptySprite} />
                          );
                        })}
                      </div>
                    </div>
                    <div className={styles.templateActions}>
                      <button className={styles.loadBtn} onClick={() => { handleLoadTemplate(t); setShowTemplates(false); }}>Load</button>
                      <button className={styles.deleteTemplateBtn} onClick={() => handleDeleteTemplate(t.id)}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Type coverage */}
      {hasTeam && (
        <div className={styles.coverage}>
          <h2 className={styles.coverageHeading}>Type Coverage</h2>

          {coverage.weaknesses.length > 0 && (
            <div className={styles.coverageSection}>
              <h3 className={styles.coverageLabel}>Weak to</h3>
              <div className={styles.typeRow}>
                {coverage.weaknesses.map(({ type, count, max }) => (
                  <div key={type} className={styles.coverageChip}>
                    <span className={`${styles.badge} ${styles[type]}`}>{type}</span>
                    <span className={`${styles.count} ${max >= 4 ? styles.severe : styles.weak}`}>×{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {coverage.immunities.length > 0 && (
            <div className={styles.coverageSection}>
              <h3 className={styles.coverageLabel}>Immune to</h3>
              <div className={styles.typeRow}>
                {coverage.immunities.map((type) => (
                  <span key={type} className={`${styles.badge} ${styles[type]}`}>{type}</span>
                ))}
              </div>
            </div>
          )}

          {coverage.resistances.length > 0 && (
            <div className={styles.coverageSection}>
              <h3 className={styles.coverageLabel}>Resists</h3>
              <div className={styles.typeRow}>
                {coverage.resistances.map(({ type, count }) => (
                  <div key={type} className={styles.coverageChip}>
                    <span className={`${styles.badge} ${styles[type]}`}>{type}</span>
                    <span className={`${styles.count} ${styles.resist}`}>×{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {coverage.uncovered.length > 0 && (
            <div className={styles.coverageSection}>
              <h3 className={styles.coverageLabel}>No STAB coverage against</h3>
              <div className={styles.typeRow}>
                {coverage.uncovered.map((type) => (
                  <span key={type} className={`${styles.badge} ${styles[type]} ${styles.dim}`}>{type}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
