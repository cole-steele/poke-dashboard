"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface TeamTemplate {
  id: string;
  name: string;
  slots: (string | null)[];
}

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export interface SaveTemplateResult extends ActionResult {
  template?: TeamTemplate;
}

const POKEMON_NAME_PATTERN = /^[a-z0-9-]+$/;
const TEMPLATE_NAME_MAX_LENGTH = 80;

function isValidSlot(slot: number): boolean {
  return Number.isInteger(slot) && slot >= 0 && slot < 6;
}

function normalizePokemonName(name: string): string | null {
  const normalized = name.trim().toLowerCase();
  if (!normalized || normalized.length > 80) return null;
  if (!POKEMON_NAME_PATTERN.test(normalized)) return null;
  return normalized;
}

function normalizeTemplateName(name: string): string | null {
  const normalized = name.trim().replace(/\s+/g, " ");
  if (!normalized) return null;
  if (normalized.length > TEMPLATE_NAME_MAX_LENGTH) return null;
  return normalized;
}

function normalizeTemplateSlots(slots: (string | null)[]): (string | null)[] | null {
  if (slots.length !== 6) return null;
  const normalized: (string | null)[] = [];
  for (const name of slots) {
    if (name === null) {
      normalized.push(null);
      continue;
    }
    const normalizedName = normalizePokemonName(name);
    if (!normalizedName) return null;
    normalized.push(normalizedName);
  }
  return normalized;
}

export async function getTeam(): Promise<(string | null)[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Array(6).fill(null);

  const { data, error } = await supabase
    .from("team_slots")
    .select("slot, pokemon_name")
    .eq("user_id", user.id)
    .order("slot");

  if (error) throw new Error("Could not load your team.");
  const slots: (string | null)[] = Array(6).fill(null);
  data?.forEach((row) => {
    if (isValidSlot(row.slot)) slots[row.slot] = row.pokemon_name;
  });
  return slots;
}

export async function setTeamSlot(slot: number, pokemonName: string): Promise<ActionResult> {
  if (!isValidSlot(slot)) return { ok: false, error: "Team slot is out of range." };
  const normalizedName = normalizePokemonName(pokemonName);
  if (!normalizedName) return { ok: false, error: "Pokemon name is invalid." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to edit your team." };

  const { error } = await supabase
    .from("team_slots")
    .upsert({ user_id: user.id, slot, pokemon_name: normalizedName });
  if (error) return { ok: false, error: "Could not update this team slot." };
  revalidatePath("/team");
  return { ok: true };
}

export async function clearTeamSlot(slot: number): Promise<ActionResult> {
  if (!isValidSlot(slot)) return { ok: false, error: "Team slot is out of range." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to edit your team." };

  const { error } = await supabase
    .from("team_slots")
    .delete()
    .eq("user_id", user.id)
    .eq("slot", slot);
  if (error) return { ok: false, error: "Could not clear this team slot." };
  revalidatePath("/team");
  return { ok: true };
}

export async function clearTeam(): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to edit your team." };

  const { error } = await supabase.from("team_slots").delete().eq("user_id", user.id);
  if (error) return { ok: false, error: "Could not clear your team." };
  revalidatePath("/team");
  return { ok: true };
}

export async function getTemplates(): Promise<TeamTemplate[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("team_templates")
    .select("id, name, slots")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Could not load team templates.");
  return (data ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    slots: (t.slots as string[]).map((s) => s || null),
  }));
}

export async function saveTemplate(name: string, slots: (string | null)[]): Promise<SaveTemplateResult> {
  const normalizedName = normalizeTemplateName(name);
  if (!normalizedName) return { ok: false, error: "Template name must be 1-80 characters." };
  const normalizedSlots = normalizeTemplateSlots(slots);
  if (!normalizedSlots) return { ok: false, error: "Team template contains invalid Pokemon." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to save team templates." };

  const { data, error } = await supabase
    .from("team_templates")
    .insert({ user_id: user.id, name: normalizedName, slots: normalizedSlots.map((s) => s ?? "") })
    .select("id, name, slots")
    .single();

  if (error || !data) return { ok: false, error: "Could not save this team template." };
  revalidatePath("/team");
  return {
    ok: true,
    template: {
      id: data.id,
      name: data.name,
      slots: (data.slots as string[]).map((s) => s || null),
    },
  };
}

export async function loadTemplate(slots: (string | null)[]): Promise<ActionResult> {
  const normalizedSlots = normalizeTemplateSlots(slots);
  if (!normalizedSlots) return { ok: false, error: "Team template contains invalid Pokemon." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to load team templates." };

  const { error: deleteError } = await supabase.from("team_slots").delete().eq("user_id", user.id);
  if (deleteError) return { ok: false, error: "Could not replace your current team." };

  const rows = normalizedSlots
    .map((name, slot) => (name ? { user_id: user.id, slot, pokemon_name: name } : null))
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (rows.length > 0) {
    const { error } = await supabase.from("team_slots").insert(rows);
    if (error) return { ok: false, error: "Could not load this team template." };
  }
  revalidatePath("/team");
  return { ok: true };
}

export async function deleteTemplate(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to delete team templates." };

  const { error } = await supabase
    .from("team_templates")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: "Could not delete this team template." };
  revalidatePath("/team");
  return { ok: true };
}
