"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleBookmark(pokemonName: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: existing } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", user.id)
    .eq("pokemon_name", pokemonName)
    .single();

  if (existing) {
    await supabase.from("bookmarks").delete().eq("id", existing.id);
    revalidatePath(`/pokemon/${pokemonName}`);
    revalidatePath("/");
    return false;
  } else {
    await supabase.from("bookmarks").insert({ user_id: user.id, pokemon_name: pokemonName });
    revalidatePath(`/pokemon/${pokemonName}`);
    revalidatePath("/");
    return true;
  }
}

export async function getBookmarks(): Promise<string[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("bookmarks")
    .select("pokemon_name")
    .eq("user_id", user.id);

  return data?.map((b) => b.pokemon_name) ?? [];
}
