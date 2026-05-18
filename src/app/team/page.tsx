import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPokemonList } from "@/lib/pokemon";
import { getBookmarks } from "@/app/actions/bookmarks";
import { getTeam, getTemplates } from "@/app/actions/team";
import TeamBuilder from "@/components/TeamBuilder";
import styles from "./page.module.scss";

export default async function TeamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/team");
  }

  const [pokemon, teamNames, templates, bookmarks] = await Promise.all([
    getPokemonList(),
    getTeam(),
    getTemplates(),
    getBookmarks(),
  ]);
  const initialTeam = teamNames.map((name) =>
    name ? (pokemon.find((p) => p.name === name) ?? null) : null
  );

  return (
    <div className={styles.page}>
      <div className={styles.main}>
        <Link href="/" className={styles.backLink}>← Pokédex</Link>
        <h1 className={styles.heading}>Team Builder</h1>
        <TeamBuilder
          pokemon={pokemon}
          initialTeam={initialTeam}
          initialTemplates={templates}
          bookmarks={bookmarks}
        />
      </div>
    </div>
  );
}
