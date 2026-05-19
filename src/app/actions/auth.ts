"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function safeNextPath(formData: FormData): string {
  const next = formData.get("next");
  if (typeof next !== "string") return "/";
  if (!next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

export async function signIn(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string }> {
  const next = safeNextPath(formData);
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });
  if (error) return { error: error.message };
  redirect(next);
}

export async function signUp(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string }> {
  const next = safeNextPath(formData);
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });
  if (error) return { error: error.message };
  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
