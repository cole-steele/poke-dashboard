import Image from "next/image";
import Link from "next/link";
import {
  getPokemonDetail,
  getPokemonSpecies,
  getEvolutionChain,
  getPokemonLevelUpMoves,
  type EvolutionNode,
} from "@/lib/pokemon";
import styles from "./page.module.scss";

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
        <>
          <span className={styles.evoArrow}>→</span>
          <div className={styles.evoBranches}>
            {node.evolvesTo.map((next) => (
              <EvolutionTree key={next.name} node={next} />
            ))}
          </div>
        </>
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

  const [pokemon, species, moves] = await Promise.all([
    getPokemonDetail(name),
    getPokemonSpecies(name),
    getPokemonLevelUpMoves(name),
  ]);

  const evolutionChain = await getEvolutionChain(species.evolutionChainUrl);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link href="/" className={styles.back}>← Back</Link>

        {/* Header */}
        <div className={styles.header}>
          <Image
            src={pokemon.officialArt}
            alt={pokemon.name}
            width={240}
            height={240}
            priority
          />
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

        {/* Pokédex Entry */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Pokédex Entry</h2>
          <p className={styles.flavorText}>{species.flavorText}</p>
        </div>

        {/* Evolution Chain */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Evolution Chain</h2>
          <div className={styles.evoChain}>
            <EvolutionTree node={evolutionChain} />
          </div>
        </div>

        {/* Base Stats */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Base Stats</h2>
          {pokemon.stats.map((stat) => (
            <div key={stat.name} className={styles.statRow}>
              <span className={styles.statName}>{stat.name}</span>
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

        {/* Moves */}
        {moves.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Moves Learned by Level</h2>
            <div className={styles.moveList}>
              {moves.map((move) => (
                <div key={move.name} className={styles.moveRow}>
                  <div className={styles.moveMeta}>
                    <span className={styles.moveLevel}>Lv.{move.level}</span>
                    <span className={styles.moveName}>{move.name.replace(/-/g, " ")}</span>
                    <span className={`${styles.badge} ${styles[move.type]}`}>{move.type}</span>
                    <span className={styles.moveClass}>{move.damageClass}</span>
                    <span className={styles.moveStat}>{move.power ?? "—"} pow</span>
                    <span className={styles.moveStat}>{move.pp} PP</span>
                  </div>
                  {move.flavorText && (
                    <p className={styles.moveFlavorText}>{move.flavorText}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
