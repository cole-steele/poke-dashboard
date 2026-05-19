import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPokemonList } from "@/lib/pokemon";
import { getTeam, getTemplates } from "@/app/actions/team";
import TeamBuilder from "@/components/TeamBuilder";
import styles from "./page.module.scss";

export default async function TeamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className={styles.page}>
        <div className={styles.main}>
          <h1 className={styles.heading}>Team Builder</h1>
          <p className={styles.gateMessage}>
            <Link href="/login" className={styles.gateLink}>Sign in</Link> to build and save your team.
          </p>
        </div>
      </div>
    );
  }

  const [pokemon, teamNames, templates] = await Promise.all([
    getPokemonList(),
    getTeam(),
    getTemplates(),
  ]);
  const initialTeam = teamNames.map((name) =>
    name ? (pokemon.find((p) => p.name === name) ?? null) : null
  );

  return (
    <div className={styles.page}>
      <div className={styles.main}>
        <h1 className={styles.heading}>Team Builder</h1>
        <TeamBuilder pokemon={pokemon} initialTeam={initialTeam} initialTemplates={templates} />
      </div>
    </div>
  );
}
