import { getPokemonList } from "@/lib/pokemon";
import PokemonGrid from "@/components/PokemonGrid";
import styles from "./page.module.scss";

export default async function Home() {
  const pokemon = await getPokemonList();

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.heading}>Pokédex</h1>
        <PokemonGrid pokemon={pokemon} />
      </main>
    </div>
  );
}
