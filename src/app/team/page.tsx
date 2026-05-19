import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPokemonList } from "@/lib/pokemon";
import { getTeam, getTemplates } from "@/app/actions/team";
import TeamBuilder from "@/components/TeamBuilder";
import styles from "./page.module.scss";

export default async function TeamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/team");
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
