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

interface PokeAPIListResponse {
  results: { name: string; url: string }[];
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

interface PokeAPIChainLink {
  species: { name: string; url: string };
  evolves_to: PokeAPIChainLink[];
}

import { notFound } from "next/navigation";

function idFromUrl(url: string): number {
  return parseInt(url.split("/").filter(Boolean).pop()!);
}

function spriteFromId(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

function cleanText(text: string): string {
  return text.replace(/[\f\n\r]/g, " ").replace(/\s+/g, " ").trim();
}

function parseEvolutionNode(node: PokeAPIChainLink): EvolutionNode {
  const id = idFromUrl(node.species.url);
  return {
    name: node.species.name,
    id,
    sprite: spriteFromId(id),
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

export async function getPokemonList(limit = 151): Promise<PokemonListItem[]> {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error("Failed to fetch Pokemon list");
  const data: PokeAPIListResponse = await res.json();

  return Promise.all(
    data.results.map(async ({ name, url }) => {
      const id = idFromUrl(url);
      const detailRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`, {
        next: { revalidate: 86400 },
      });
      const detail = await detailRes.json();
      return {
        id,
        name,
        sprite: spriteFromId(id),
        types: detail.types.map(
          (t: { type: { name: string } }) => t.type.name
        ),
        total: detail.stats.reduce(
          (sum: number, s: { base_stat: number }) => sum + s.base_stat, 0
        ),
        stats: Object.fromEntries(
          detail.stats.map((s: { stat: { name: string }; base_stat: number }) => [
            s.stat.name,
            s.base_stat,
          ])
        ),
      };
    })
  );
}

export async function getPokemonDetail(name: string): Promise<PokemonDetail> {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`, {
    next: { revalidate: 86400 },
  });
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`Failed to fetch Pokemon: ${name}`);
  const d: PokeAPIDetailResponse = await res.json();

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
    officialArt: d.sprites.other["official-artwork"].front_default,
    types: d.types.map((t) => t.type.name),
    stats: d.stats.map((s) => ({ name: s.stat.name, value: s.base_stat })),
    abilities,
    height: d.height,
    weight: d.weight,
  };
}

export async function getPokemonSpecies(name: string): Promise<PokemonSpecies> {
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
}

export async function getEvolutionChain(url: string): Promise<EvolutionNode> {
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error("Failed to fetch evolution chain");
  const d = await res.json();
  return parseEvolutionNode(d.chain);
}

export async function getPokemonLevelUpMoves(name: string): Promise<MoveDetail[]> {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) return [];
  const d: PokeAPIDetailResponse = await res.json();

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
}
