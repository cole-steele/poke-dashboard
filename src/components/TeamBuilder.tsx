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
  const [pendingSlots, setPendingSlots] = useState<Set<number>>(new Set());
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [clearingTeam, setClearingTeam] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [, startSaveTransition] = useTransition();

  const hasTeam = slots.some(Boolean);
  const teamActionPending = clearingTeam || pendingSlots.size > 0 || Boolean(loadingTemplateId);

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
    const slot = activeSlot;
    const previous = slots[slot];
    const next = [...slots];
    next[slot] = p;
    setSlots(next);
    setActiveSlot(null);
    setActionError(null);
    setPendingSlots((prev) => new Set(prev).add(slot));
    startTransition(async () => {
      const result = await setTeamSlot(slot, p.name);
      if (!result.ok) {
        setSlots((current) => {
          const restored = [...current];
          restored[slot] = previous;
          return restored;
        });
        setActionError(result.error ?? "Could not update this team slot.");
      }
      setPendingSlots((prev) => {
        const updated = new Set(prev);
        updated.delete(slot);
        return updated;
      });
    });
  }

  function handleRemove(i: number, e: React.MouseEvent) {
    e.stopPropagation();
    const previous = slots[i];
    const next = [...slots];
    next[i] = null;
    setSlots(next);
    if (activeSlot === i) setActiveSlot(null);
    setActionError(null);
    setPendingSlots((prev) => new Set(prev).add(i));
    startTransition(async () => {
      const result = await clearTeamSlot(i);
      if (!result.ok) {
        setSlots((current) => {
          const restored = [...current];
          restored[i] = previous;
          return restored;
        });
        setActionError(result.error ?? "Could not clear this team slot.");
      }
      setPendingSlots((prev) => {
        const updated = new Set(prev);
        updated.delete(i);
        return updated;
      });
    });
  }

  function handleClearTeam() {
    const previous = slots;
    setSlots(Array(6).fill(null));
    setActiveSlot(null);
    setActionError(null);
    setClearingTeam(true);
    startTransition(async () => {
      const result = await clearTeam();
      if (!result.ok) {
        setSlots(previous);
        setActionError(result.error ?? "Could not clear your team.");
      }
      setClearingTeam(false);
    });
  }

  function handleSaveTemplate() {
    if (!templateName.trim() || savingTemplate) return;
    const name = templateName.trim();
    const names = slots.map((s) => s?.name ?? null);
    setTemplateName("");
    setSaving(false);
    setActionError(null);
    setSavingTemplate(true);
    startSaveTransition(async () => {
      const result = await saveTemplate(name, names);
      if (result.template) {
        setTemplates((prev) => [result.template!, ...prev]);
      } else {
        setActionError(result.error ?? "Could not save this team template.");
      }
      setSavingTemplate(false);
    });
  }

  function handleLoadTemplate(template: TeamTemplate) {
    if (loadingTemplateId) return;
    const previous = slots;
    const next = template.slots.map((name) =>
      name ? (pokemon.find((p) => p.name === name) ?? null) : null
    );
    setSlots(next);
    setActiveSlot(null);
    setShowTemplates(false);
    setActionError(null);
    setLoadingTemplateId(template.id);
    startTransition(async () => {
      const result = await loadTemplate(template.slots);
      if (!result.ok) {
        setSlots(previous);
        setActionError(result.error ?? "Could not load this team template.");
      }
      setLoadingTemplateId(null);
    });
  }

  function handleDeleteTemplate(id: string) {
    if (deletingTemplateId) return;
    const previous = templates;
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    setActionError(null);
    setDeletingTemplateId(id);
    startTransition(async () => {
      const result = await deleteTemplate(id);
      if (!result.ok) {
        setTemplates(previous);
        setActionError(result.error ?? "Could not delete this team template.");
      }
      setDeletingTemplateId(null);
    });
  }

  return (
    <div className={styles.wrapper}>
      {actionError && <p className={styles.errorMessage}>{actionError}</p>}
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <button
          className={styles.clearBtn}
          onClick={handleClearTeam}
          disabled={!hasTeam || teamActionPending}
        >
          {clearingTeam ? "Clearing..." : "Clear team"}
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
                disabled={savingTemplate}
                autoFocus
              />
              <button className={styles.confirmBtn} onClick={handleSaveTemplate} disabled={!templateName.trim() || savingTemplate}>
                {savingTemplate ? "Saving..." : "Save"}
              </button>
              <button className={styles.cancelBtn} onClick={() => { setSaving(false); setTemplateName(""); }} disabled={savingTemplate}>Cancel</button>
            </>
          ) : (
            <>
              <button className={styles.saveBtn} onClick={() => setSaving(true)} disabled={!hasTeam || savingTemplate}>
                {savingTemplate ? "Saving..." : "Save as template"}
              </button>
              <button className={styles.saveBtn} onClick={() => setShowTemplates(true)} disabled={Boolean(loadingTemplateId)}>
                {loadingTemplateId ? "Loading..." : "Load template"}
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
            className={`${styles.slot} ${slot ? styles.filled : styles.empty} ${activeSlot === i ? styles.active : ""} ${pendingSlots.has(i) ? styles.slotPending : ""}`}
            onClick={() => handleSlotClick(i)}
            aria-busy={pendingSlots.has(i)}
          >
            {slot ? (
              <>
                <button
                  className={styles.removeBtn}
                  onClick={(e) => handleRemove(i, e)}
                  aria-label="Remove"
                  disabled={pendingSlots.has(i) || clearingTeam}
                >
                  ×
                </button>
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
              <button
                key={p.id}
                className={styles.pickerCard}
                onClick={() => handleAdd(p)}
                disabled={activeSlot !== null && pendingSlots.has(activeSlot)}
              >
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
              <button className={styles.modalClose} onClick={() => setShowTemplates(false)} disabled={Boolean(loadingTemplateId)}>×</button>
            </div>
            {templates.length === 0 ? (
              <div className={styles.noTemplates}>
                <p className={styles.emptyTitle}>No saved templates yet.</p>
                <p className={styles.emptyText}>Build a team, then save it as a template to reuse later.</p>
              </div>
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
                      <button className={styles.loadBtn} onClick={() => handleLoadTemplate(t)} disabled={Boolean(loadingTemplateId)}>
                        {loadingTemplateId === t.id ? "Loading..." : "Load"}
                      </button>
                      <button
                        className={styles.deleteTemplateBtn}
                        onClick={() => handleDeleteTemplate(t.id)}
                        disabled={deletingTemplateId === t.id || Boolean(loadingTemplateId)}
                        aria-label={`Delete ${t.name}`}
                      >
                        {deletingTemplateId === t.id ? "..." : "×"}
                      </button>
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

          {coverage.majorWeaknesses.length > 0 && (
            <div className={styles.coverageSection}>
              <h3 className={styles.coverageLabel}>Major weaknesses</h3>
              <div className={styles.typeRow}>
                {coverage.majorWeaknesses.map(({ type, count, max }) => (
                  <div key={type} className={styles.coverageChip}>
                    <span className={`${styles.badge} ${styles[type]}`}>{type}</span>
                    <span className={`${styles.count} ${max >= 4 ? styles.severe : styles.weak}`}>×{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

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

          {coverage.noResistance.length > 0 && (
            <div className={styles.coverageSection}>
              <h3 className={styles.coverageLabel}>No resistance to</h3>
              <div className={styles.typeRow}>
                {coverage.noResistance.map((type) => (
                  <span key={type} className={`${styles.badge} ${styles[type]} ${styles.dim}`}>{type}</span>
                ))}
              </div>
            </div>
          )}

          {coverage.bestOffensiveTypes.length > 0 && (
            <div className={styles.coverageSection}>
              <h3 className={styles.coverageLabel}>Best offensive types</h3>
              <div className={styles.typeRow}>
                {coverage.bestOffensiveTypes.map(({ type, coveredCount }) => (
                  <div key={type} className={styles.coverageChip}>
                    <span className={`${styles.badge} ${styles[type]}`}>{type}</span>
                    <span className={`${styles.count} ${styles.offense}`}>{coveredCount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {coverage.duplicateTypes.length > 0 && (
            <div className={styles.coverageSection}>
              <h3 className={styles.coverageLabel}>Duplicate types</h3>
              <div className={styles.typeRow}>
                {coverage.duplicateTypes.map(({ type, count }) => (
                  <div key={type} className={styles.coverageChip}>
                    <span className={`${styles.badge} ${styles[type]}`}>{type}</span>
                    <span className={`${styles.count} ${styles.duplicate}`}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {coverage.effectiveAgainst.length > 0 && (
            <div className={styles.coverageSection}>
              <h3 className={styles.coverageLabel}>Effective against</h3>
              <div className={styles.typeRow}>
                {coverage.effectiveAgainst.map((type) => (
                  <span key={type} className={`${styles.badge} ${styles[type]}`}>{type}</span>
                ))}
              </div>
            </div>
          )}

          {coverage.uncovered.length > 0 && (
            <div className={styles.coverageSection}>
              <h3 className={styles.coverageLabel}>
                <span className={styles.coverageLabelText}>
                  No <span className={styles.stabTerm}>STAB</span> coverage against
                </span>
                <span className={styles.tooltipWrap}>
                  <button
                    type="button"
                    className={styles.helpTip}
                    aria-label="STAB means Same Type Attack Bonus: moves that match a Pokemon's type hit harder."
                  >
                    ?
                  </button>
                  <span className={styles.tooltipText}>
                    Same Type Attack Bonus: moves that match a Pokemon&apos;s type hit harder.
                    For example, Fire Pokemon do more damage with Fire attacks.
                  </span>
                </span>
              </h3>
              <div className={styles.typeRow}>
                {coverage.uncovered.map((type) => (
                  <span key={type} className={`${styles.badge} ${styles[type]} ${styles.dim}`}>{type}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {!hasTeam && (
        <div className={styles.emptyTeam}>
          <p className={styles.emptyTitle}>Your team is empty.</p>
          <p className={styles.emptyText}>Select a slot, search for a Pokemon, and start building a six-member team.</p>
        </div>
      )}
    </div>
  );
}
