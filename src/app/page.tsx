import { getPokemonList } from "@/lib/pokemon";
import { getBookmarks } from "@/app/actions/bookmarks";
import PokemonGrid from "@/components/PokemonGrid";
import PokeballIcon from "@/components/PokeballIcon";
import styles from "./page.module.scss";

export default async function Home() {
  const [pokemon, bookmarks] = await Promise.all([getPokemonList(), getBookmarks()]);
  const bookmarkSet = new Set(bookmarks);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.heading}>
          <PokeballIcon size={32} />
          Poke Dashboard
        </h1>
        <PokemonGrid pokemon={pokemon} bookmarks={bookmarkSet} />
      </main>
    </div>
  );
}
