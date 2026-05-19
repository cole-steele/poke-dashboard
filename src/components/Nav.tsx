import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import PokeballIcon from "./PokeballIcon";
import styles from "./Nav.module.scss";

export default async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.logo}>
        <PokeballIcon size={18} />
        Poke Dashboard
      </Link>
      <div className={styles.right}>
        <Link href="/team" className={styles.navLink}>Team</Link>
        {user ? (
          <>
            <span className={styles.email}>{user.email}</span>
            <form action={signOut}>
              <button className={styles.signOut}>Sign out</button>
            </form>
          </>
        ) : (
          <Link href="/login" className={styles.signIn}>
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
