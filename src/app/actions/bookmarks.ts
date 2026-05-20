"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface BookmarkResult {
  bookmarked: boolean;
  error?: string;
}

const POKEMON_NAME_PATTERN = /^[a-z0-9-]+$/;

function normalizePokemonName(name: string): string | null {
  const normalized = name.trim().toLowerCase();
  if (!normalized || normalized.length > 80) return null;
  if (!POKEMON_NAME_PATTERN.test(normalized)) return null;
  return normalized;
}

export async function toggleBookmark(pokemonName: string): Promise<BookmarkResult> {
  const normalizedName = normalizePokemonName(pokemonName);
  if (!normalizedName) {
    return { bookmarked: false, error: "Pokemon name is invalid." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { bookmarked: false, error: "Sign in to save Pokemon." };

  const { data: existing, error: findError } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", user.id)
    .eq("pokemon_name", normalizedName)
    .single();

  if (findError && findError.code !== "PGRST116") {
    return { bookmarked: false, error: "Could not check saved Pokemon." };
  }

  if (existing) {
    const { error } = await supabase.from("bookmarks").delete().eq("id", existing.id);
    if (error) return { bookmarked: true, error: "Could not remove saved Pokemon." };
    revalidatePath(`/pokemon/${normalizedName}`);
    revalidatePath("/");
    return { bookmarked: false };
  }

  const { error } = await supabase
    .from("bookmarks")
    .insert({ user_id: user.id, pokemon_name: normalizedName });
  if (error) return { bookmarked: false, error: "Could not save Pokemon." };
  revalidatePath(`/pokemon/${normalizedName}`);
  revalidatePath("/");
  return { bookmarked: true };
}

export async function getBookmarks(): Promise<string[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("bookmarks")
    .select("pokemon_name")
    .eq("user_id", user.id);

  if (error) throw new Error("Could not load saved Pokemon.");
  return data?.map((b) => b.pokemon_name) ?? [];
}
