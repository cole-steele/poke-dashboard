import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import MobileNav from "./MobileNav";
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
        TeamDex
      </Link>
      <div className={styles.right}>
        <Link href="/" className={styles.navLink}>Pokédex</Link>
        <Link href="/team" className={styles.navLink}>Team Builder</Link>
        <div className={styles.divider} />
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
      <MobileNav email={user?.email ?? null} />
    </nav>
  );
}
