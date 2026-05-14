import { getPokemonList } from "@/lib/pokemon";
import { getBookmarks } from "@/app/actions/bookmarks";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import PokemonGrid from "@/components/PokemonGrid";
import styles from "./page.module.scss";

export default async function Home() {
  const supabase = await createClient();
  const [
    pokemon,
    bookmarks,
    {
      data: { user },
    },
  ] = await Promise.all([
    getPokemonList(),
    getBookmarks(),
    supabase.auth.getUser(),
  ]);
  const bookmarkSet = new Set(bookmarks);
  const teamHref = user ? "/team" : "/login?next=/team";

  return (
    <div className={styles.page}>
      <main className={styles.main} id="top">
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Pokedex workspace</p>
            <h1 className={styles.heading}>Find Pokemon for your team</h1>
            <p className={styles.subheading}>
              Search, filter, and save Pokemon here, then bring them into Team Builder for coverage analysis.
            </p>
          </div>
          <Link href={teamHref} className={styles.teamCta}>
            <span className={styles.teamCtaLabel}>
              {user ? "Build a team" : "Sign in to build"}
              <span className={styles.teamCtaArrow}>→</span>
            </span>
            <span className={styles.teamCtaMeta}>
              Save slots, templates, and coverage notes
            </span>
          </Link>
        </div>
        <PokemonGrid pokemon={pokemon} bookmarks={bookmarkSet} />
      </main>
    </div>
  );
}
