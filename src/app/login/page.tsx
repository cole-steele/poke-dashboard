import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "./LoginForm";
import styles from "./page.module.scss";

function safeNextPath(next: string | string[] | undefined): string {
  if (typeof next !== "string") return "/";
  if (!next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[]; verified?: string }>;
}) {
  const { next, verified } = await searchParams;
  const nextPath = safeNextPath(next);
  const isVerified = verified === "1";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && !isVerified) {
    redirect(nextPath);
  }

  return (
    <div className={styles.page}>
      <LoginForm nextPath={nextPath} verified={isVerified} />
    </div>
  );
}
