import pokemonListData from "@/data/pokemon-list.json";
import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";

export interface PokemonListItem {
  id: number;
  name: string;
  sprite: string;
  types: string[];
  total: number;
  stats: Record<string, number>;
}

export interface PokemonDetail {
  id: number;
  name: string;
  sprite: string;
  shinySprite: string;
  officialArt: string;
  types: string[];
  stats: { name: string; value: number }[];
  abilities: { name: string; hidden: boolean; description: string }[];
  height: number;
  weight: number;
}

export interface PokemonSpecies {
  flavorText: string;
  genus: string;
  habitat: string | null;
  generation: string;
  isLegendary: boolean;
  isMythical: boolean;
  evolutionChainUrl: string;
}

export interface EvolutionNode {
  name: string;
  id: number;
  sprite: string;
  trigger: string | null;
  evolvesTo: EvolutionNode[];
}

export interface MoveDetail {
  name: string;
  type: string;
  power: number | null;
  pp: number;
  accuracy: number | null;
  damageClass: string;
  flavorText: string;
  level: number;
}

interface PokeAPIDetailResponse {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: { type: { name: string } }[];
  stats: { stat: { name: string }; base_stat: number }[];
  abilities: { ability: { name: string }; is_hidden: boolean }[];
  sprites: {
    front_default: string;
    front_shiny: string;
    other: { "official-artwork": { front_default: string } };
  };
  moves: {
    move: { name: string };
    version_group_details: {
      level_learned_at: number;
      move_learn_method: { name: string };
    }[];
  }[];
}

interface PokeAPIEvolutionDetail {
  trigger: { name: string };
  min_level: number | null;
  min_happiness: number | null;
  item: { name: string } | null;
}

interface PokeAPIChainLink {
  species: { name: string; url: string };
  evolution_details: PokeAPIEvolutionDetail[];
  evolves_to: PokeAPIChainLink[];
}

function idFromUrl(url: string): number {
  return parseInt(url.split("/").filter(Boolean).pop()!);
}

function spriteFromId(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

function cleanText(text: string): string {
  return text.replace(/[\f\n\r]/g, " ").replace(/\s+/g, " ").trim();
}

function normalizePokemonName(name: string): string {
  return name.trim().toLowerCase();
}

function parseTrigger(details: PokeAPIEvolutionDetail[]): string | null {
  if (!details?.length) return null;
  const d = details[0];
  if (d.trigger.name === "level-up") {
    if (d.min_level) return `Lv. ${d.min_level}`;
    if (d.min_happiness) return "Happiness";
    return "Level up";
  }
  if (d.trigger.name === "use-item" && d.item) {
    return d.item.name.replace(/-/g, " ");
  }
  if (d.trigger.name === "trade") return "Trade";
  return null;
}

function parseEvolutionNode(node: PokeAPIChainLink): EvolutionNode {
  const id = idFromUrl(node.species.url);
  return {
    name: node.species.name,
    id,
    sprite: spriteFromId(id),
    trigger: parseTrigger(node.evolution_details),
    evolvesTo: node.evolves_to.map(parseEvolutionNode),
  };
}

async function getAbilityDescription(name: string): Promise<string> {
  const res = await fetch(`https://pokeapi.co/api/v2/ability/${name}`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) return "";
  const data = await res.json();
  const entry = data.effect_entries.find(
    (e: { language: { name: string }; short_effect: string }) =>
      e.language.name === "en"
  );
  return entry?.short_effect ?? "";
}

export function getPokemonList(): PokemonListItem[] {
  return pokemonListData satisfies PokemonListItem[];
}

const getCachedRawPokemon = unstable_cache(
  async (name: string): Promise<PokeAPIDetailResponse> => {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`, {
      next: { revalidate: 86400 },
    });
    if (res.status === 404) notFound();
    if (!res.ok) throw new Error(`Failed to fetch Pokemon: ${name}`);
    return res.json();
  },
  ["pokemon-raw"],
  { revalidate: 86400 }
);

const getCachedPokemonDetail = unstable_cache(
  async (name: string): Promise<PokemonDetail> => {
    const d = await getCachedRawPokemon(name);

    const abilities = await Promise.all(
      d.abilities.map(async (a) => ({
        name: a.ability.name,
        hidden: a.is_hidden,
        description: await getAbilityDescription(a.ability.name),
      }))
    );

    return {
      id: d.id,
      name: d.name,
      sprite: d.sprites.front_default,
      shinySprite: d.sprites.front_shiny,
      officialArt: d.sprites.other["official-artwork"].front_default,
      types: d.types.map((t) => t.type.name),
      stats: d.stats.map((s) => ({ name: s.stat.name, value: s.base_stat })),
      abilities,
      height: d.height,
      weight: d.weight,
    };
  },
  ["pokemon-detail"],
  { revalidate: 86400 }
);

export async function getPokemonDetail(name: string): Promise<PokemonDetail> {
  return getCachedPokemonDetail(normalizePokemonName(name));
}

const getCachedPokemonSpecies = unstable_cache(
  async (name: string): Promise<PokemonSpecies> => {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${name}`, {
      next: { revalidate: 86400 },
    });
    if (res.status === 404) notFound();
    if (!res.ok) throw new Error(`Failed to fetch species: ${name}`);
    const d = await res.json();

    const preferredVersions = ["x", "heartgold", "emerald", "firered", "red"];
    const enEntries = d.flavor_text_entries.filter(
      (e: { language: { name: string } }) => e.language.name === "en"
    );
    const flavorEntry =
      preferredVersions
        .map((v: string) =>
          enEntries.find(
            (e: { version: { name: string } }) => e.version.name === v
          )
        )
        .find(Boolean) ?? enEntries[0];

    return {
      flavorText: flavorEntry ? cleanText(flavorEntry.flavor_text) : "",
      genus: d.genera.find(
        (g: { language: { name: string }; genus: string }) =>
          g.language.name === "en"
      )?.genus ?? "",
      habitat: d.habitat?.name ?? null,
      generation: d.generation.name.replace("generation-", "Gen ").toUpperCase(),
      isLegendary: d.is_legendary,
      isMythical: d.is_mythical,
      evolutionChainUrl: d.evolution_chain.url,
    };
  },
  ["pokemon-species"],
  { revalidate: 86400 }
);

export async function getPokemonSpecies(name: string): Promise<PokemonSpecies> {
  return getCachedPokemonSpecies(normalizePokemonName(name));
}

const getCachedEvolutionChain = unstable_cache(
  async (url: string): Promise<EvolutionNode> => {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) throw new Error("Failed to fetch evolution chain");
    const d = await res.json();
    return parseEvolutionNode(d.chain);
  },
  ["pokemon-evolution-chain"],
  { revalidate: 86400 }
);

export async function getEvolutionChain(url: string): Promise<EvolutionNode> {
  return getCachedEvolutionChain(url);
}

const getCachedPokemonLevelUpMoves = unstable_cache(
  async (name: string): Promise<MoveDetail[]> => {
    const d = await getCachedRawPokemon(name);

    const levelUpMoves = d.moves
      .flatMap((m) => {
        const best = m.version_group_details
          .filter((v) => v.move_learn_method.name === "level-up")
          .sort((a, b) => a.level_learned_at - b.level_learned_at)[0];
        return best ? [{ name: m.move.name, level: best.level_learned_at }] : [];
      })
      .sort((a, b) => a.level - b.level);

    const details = await Promise.all(
      levelUpMoves.map(async ({ name: moveName, level }) => {
        const r = await fetch(`https://pokeapi.co/api/v2/move/${moveName}`, {
          next: { revalidate: 86400 },
        });
        if (!r.ok) return null;
        const m = await r.json();
        const en = m.flavor_text_entries.find(
          (e: { language: { name: string }; flavor_text: string }) =>
            e.language.name === "en"
        );
        return {
          name: moveName,
          type: m.type.name,
          power: m.power,
          pp: m.pp,
          accuracy: m.accuracy,
          damageClass: m.damage_class.name,
          flavorText: en ? cleanText(en.flavor_text) : "",
          level,
        };
      })
    );

    return details.filter((m): m is MoveDetail => m !== null);
  },
  ["pokemon-level-up-moves"],
  { revalidate: 86400 }
);

export async function getPokemonLevelUpMoves(name: string): Promise<MoveDetail[]> {
  return getCachedPokemonLevelUpMoves(normalizePokemonName(name));
}
