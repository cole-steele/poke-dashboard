import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  getPokemonDetail,
  getPokemonSpecies,
  getEvolutionChain,
  getPokemonLevelUpMoves,
  type EvolutionNode,
} from "@/lib/pokemon";
import { getBookmarks } from "@/app/actions/bookmarks";
import BackButton from "@/components/BackButton";
import ScrollTop from "@/components/ScrollTop";
import BackToTop from "@/components/BackToTop";
import BookmarkButton from "@/components/BookmarkButton";
import IVChecker from "@/components/IVChecker";
import MoveList from "@/components/MoveList";
import HelpTip from "@/components/HelpTip";
import STAT_DESC from "@/lib/statDesc";
import styles from "./page.module.scss";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const { name } = await params;
  const [pokemon, species] = await Promise.all([
    getPokemonDetail(name),
    getPokemonSpecies(name),
  ]);
  const types = pokemon.types.join(", ");
  const title = pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);
  return {
    title,
    description: `${title} (#${String(pokemon.id).padStart(3, "0")}) — ${types} type. ${species.genus}. Base stats, evolution chain, IV checker, and level-up moves.`,
  };
}

const STAT_MAX = 255;


function statColor(value: number): string {
  if (value < 50)  return "#FF7F7F";
  if (value < 80)  return "#FFAA5A";
  if (value < 110) return "#FFD700";
  if (value < 130) return "#78C850";
  return "#6890F0";
}

function EvolutionTree({ node }: { node: EvolutionNode }) {
  return (
    <div className={styles.evoGroup}>
      <Link href={`/pokemon/${node.name}`} className={styles.evoStage}>
        <Image src={node.sprite} alt={node.name} width={72} height={72} />
        <span className={styles.evoName}>{node.name}</span>
      </Link>
      {node.evolvesTo.length > 0 && (
        <div className={styles.evoBranches}>
          {node.evolvesTo.map((next) => (
            <div key={next.name} className={styles.evoStep}>
              <div className={styles.evoArrowWrap}>
                {next.trigger && <span className={styles.evoTrigger}>{next.trigger}</span>}
                <span className={styles.evoArrow}>→</span>
              </div>
              <EvolutionTree node={next} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function PokemonPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;

  const [pokemon, species, moves, bookmarks] = await Promise.all([
    getPokemonDetail(name),
    getPokemonSpecies(name),
    getPokemonLevelUpMoves(name),
    getBookmarks(),
  ]);

  const evolutionChain = await getEvolutionChain(species.evolutionChainUrl);
  const isBookmarked = bookmarks.includes(name);

  return (
    <div className={styles.page}>
      <ScrollTop />
      <div className={styles.container}>
        <BackButton />

        {/* Profile card */}
        <div className={styles.userBox}>
          <div className={styles.userBoxSave}>
            <BookmarkButton pokemonName={name} initialBookmarked={isBookmarked} />
          </div>
          <div className={styles.header}>
            <div className={styles.imageCol}>
              <Image
                src={pokemon.officialArt}
                alt={pokemon.name}
                width={240}
                height={240}
                priority
              />
              <div className={styles.sprites}>
                <div className={styles.spriteItem}>
                  <Image src={pokemon.sprite} alt={`${pokemon.name} sprite`} width={64} height={64} />
                  <span className={styles.spriteLabel}>Default</span>
                </div>
                {pokemon.id <= 151 && (
                  <div className={styles.spriteItem}>
                    <Image src={pokemon.shinySprite} alt={`${pokemon.name} shiny sprite`} width={64} height={64} />
                    <span className={styles.spriteLabel}>Shiny</span>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.meta}>
              <span className={styles.id}>#{String(pokemon.id).padStart(3, "0")}</span>
              <h1 className={styles.name}>{pokemon.name}</h1>
              <p className={styles.genus}>{species.genus}</p>
              <div className={styles.types}>
                {pokemon.types.map((type) => (
                  <span key={type} className={`${styles.badge} ${styles[type]}`}>
                    {type}
                  </span>
                ))}
              </div>
              <div className={styles.physicals}>
                <span>Height: {(pokemon.height / 10).toFixed(1)}m</span>
                <span>Weight: {(pokemon.weight / 10).toFixed(1)}kg</span>
                <span>{species.generation}</span>
                {species.habitat && <span>Habitat: {species.habitat}</span>}
                {species.isLegendary && <span className={styles.legendary}>Legendary</span>}
                {species.isMythical && <span className={styles.legendary}>Mythical</span>}
              </div>
              <div className={styles.abilities}>
                <h2>Abilities</h2>
                <ul>
                  {pokemon.abilities.map((a) => (
                    <li key={a.name} className={styles.abilityItem}>
                      <span className={styles.abilityName}>
                        {a.name}
                        {a.hidden && <span className={styles.hidden}>hidden</span>}
                      </span>
                      {a.description && (
                        <span className={styles.tooltip}>{a.description}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          {species.flavorText && (
            <p className={styles.cardFlavorText}>{species.flavorText}</p>
          )}
          <div className={styles.cardSection}>
            <h2 className={styles.sectionTitle}>Evolution Chain</h2>
            <div className={styles.evoChain}>
              <EvolutionTree node={evolutionChain} />
            </div>
          </div>
        </div>

        {/* Base Stats */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Base Stats</h2>
            <HelpTip>
              <p><strong>Base stats</strong> are fixed numbers that define a species&apos; strengths. Every Charizard has the same base stats.</p>
              <p>They don&apos;t change with level, but a higher base stat means that stat will always grow faster as your Pokémon levels up.</p>
            </HelpTip>
          </div>
          {pokemon.stats.map((stat) => (
            <div key={stat.name} className={styles.statRow}>
              <span className={styles.statName}>
                <span className={styles.statLabel}>{stat.name}</span>
                {STAT_DESC[stat.name] && <HelpTip><p>{STAT_DESC[stat.name]}</p></HelpTip>}
              </span>
              <span className={styles.statValue}>{stat.value}</span>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{
                    "--pct": `${(stat.value / STAT_MAX) * 100}%`,
                    "--color": statColor(stat.value),
                  } as React.CSSProperties}
                />
              </div>
            </div>
          ))}
        </div>

        {/* IV Checker */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>IV Checker</h2>
            <HelpTip>
              <p><strong>IVs (Individual Values)</strong> are hidden numbers from 0–31 assigned randomly when a Pokémon is caught or hatched. They never change.</p>
              <p>They control how each stat is distributed as your Pokémon levels up. A higher IV means that stat grows a little more at every level. Two Charizards trained identically will still end up with different stats if their IVs differ, because one was distributing more points into that stat from the very start.</p>
              <p>31 is perfect, 0 is the worst possible roll.</p>
            </HelpTip>
          </div>
          <IVChecker stats={pokemon.stats.map((s) => ({ name: s.name, base: s.value }))} />
        </div>

        {/* Moves */}
        {moves.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Moves Learned by Level</h2>
            <MoveList moves={moves} />
          </div>
        )}
      </div>
      <BackToTop />
    </div>
  );
}
