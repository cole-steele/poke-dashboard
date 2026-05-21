"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

function safeNextPath(formData: FormData): string {
  const next = formData.get("next");
  if (typeof next !== "string") return "/";
  if (!next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

// Per-instance in-memory rate limiter — sufficient for a hobby project.
// Won't sync across multiple serverless instances, but still adds meaningful friction.
const signupAttempts = new Map<string, number[]>();
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (signupAttempts.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) return true;
  signupAttempts.set(ip, [...recent, now]);
  return false;
}

async function getClientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "unknown";
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
  _prev: { error?: string; checkEmail?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; checkEmail?: boolean }> {
  const ip = await getClientIp();
  if (isRateLimited(ip)) {
    return { error: "Too many signup attempts. Please try again later." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    options: { emailRedirectTo: "https://teamdex.live/login?verified=1" },
  });
  if (error) return { error: error.message };
  return { checkEmail: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
