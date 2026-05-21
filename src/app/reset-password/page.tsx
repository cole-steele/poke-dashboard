import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ResetPasswordForm from "./ResetPasswordForm";
import styles from "@/app/login/page.module.scss";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className={styles.page}>
      <ResetPasswordForm />
    </div>
  );
}
