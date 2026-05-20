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
      <div className={styles.bgBall} aria-hidden="true">
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="18.5" stroke="currentColor" strokeWidth="1" />
          <path d="M1.5 20a18.5 18.5 0 0 1 37 0H1.5Z" fill="currentColor" />
          <rect x="1.5" y="18.75" width="37" height="2.5" fill="currentColor" />
          <circle cx="20" cy="20" r="6" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="20" cy="20" r="2.5" fill="currentColor" />
        </svg>
      </div>
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
