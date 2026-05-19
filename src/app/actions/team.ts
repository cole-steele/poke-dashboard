"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface TeamTemplate {
  id: string;
  name: string;
  slots: (string | null)[];
}

export async function getTeam(): Promise<(string | null)[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Array(6).fill(null);

  const { data } = await supabase
    .from("team_slots")
    .select("slot, pokemon_name")
    .eq("user_id", user.id)
    .order("slot");

  const slots: (string | null)[] = Array(6).fill(null);
  data?.forEach((row) => { slots[row.slot] = row.pokemon_name; });
  return slots;
}

export async function setTeamSlot(slot: number, pokemonName: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("team_slots").upsert({ user_id: user.id, slot, pokemon_name: pokemonName });
  revalidatePath("/team");
}

export async function clearTeamSlot(slot: number): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("team_slots").delete().eq("user_id", user.id).eq("slot", slot);
  revalidatePath("/team");
}

export async function clearTeam(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("team_slots").delete().eq("user_id", user.id);
  revalidatePath("/team");
}

export async function getTemplates(): Promise<TeamTemplate[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("team_templates")
    .select("id, name, slots")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (data ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    slots: (t.slots as string[]).map((s) => s || null),
  }));
}

export async function saveTemplate(name: string, slots: (string | null)[]): Promise<TeamTemplate | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("team_templates")
    .insert({ user_id: user.id, name, slots: slots.map((s) => s ?? "") })
    .select("id, name, slots")
    .single();

  revalidatePath("/team");
  if (!data) return null;
  return { id: data.id, name: data.name, slots: (data.slots as string[]).map((s) => s || null) };
}

export async function loadTemplate(slots: (string | null)[]): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("team_slots").delete().eq("user_id", user.id);

  const rows = slots
    .map((name, slot) => (name ? { user_id: user.id, slot, pokemon_name: name } : null))
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (rows.length > 0) await supabase.from("team_slots").insert(rows);
  revalidatePath("/team");
}

export async function deleteTemplate(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("team_templates").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/team");
}
