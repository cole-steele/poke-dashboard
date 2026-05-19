import type { PokemonListItem } from "./pokemon";

export const ALL_TYPES = [
  "normal", "fire", "water", "electric", "grass", "ice",
  "fighting", "poison", "ground", "flying", "psychic", "bug",
  "rock", "ghost", "dragon", "dark", "steel", "fairy",
] as const;

export type TypeName = typeof ALL_TYPES[number];

// chart[attacker][defender] = multiplier (omitted entries = 1x)
const CHART: Partial<Record<TypeName, Partial<Record<TypeName, number>>>> = {
  normal:   { rock: 0.5, steel: 0.5, ghost: 0 },
  fire:     { grass: 2, ice: 2, bug: 2, steel: 2, fire: 0.5, water: 0.5, rock: 0.5, dragon: 0.5 },
  water:    { fire: 2, ground: 2, rock: 2, water: 0.5, grass: 0.5, dragon: 0.5 },
  electric: { water: 2, flying: 2, electric: 0.5, grass: 0.5, dragon: 0.5, ground: 0 },
  grass:    { water: 2, ground: 2, rock: 2, fire: 0.5, grass: 0.5, poison: 0.5, flying: 0.5, bug: 0.5, dragon: 0.5, steel: 0.5 },
  ice:      { grass: 2, ground: 2, flying: 2, dragon: 2, water: 0.5, ice: 0.5 },
  fighting: { normal: 2, ice: 2, rock: 2, dark: 2, steel: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, fairy: 0.5, ghost: 0 },
  poison:   { grass: 2, fairy: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0 },
  ground:   { fire: 2, electric: 2, poison: 2, rock: 2, steel: 2, grass: 0.5, bug: 0.5, flying: 0 },
  flying:   { grass: 2, fighting: 2, bug: 2, electric: 0.5, rock: 0.5, steel: 0.5 },
  psychic:  { fighting: 2, poison: 2, psychic: 0.5, steel: 0.5, dark: 0 },
  bug:      { grass: 2, psychic: 2, dark: 2, fire: 0.5, fighting: 0.5, poison: 0.5, flying: 0.5, ghost: 0.5, steel: 0.5, fairy: 0.5 },
  rock:     { fire: 2, ice: 2, flying: 2, bug: 2, fighting: 0.5, ground: 0.5, steel: 0.5 },
  ghost:    { psychic: 2, ghost: 2, dark: 0.5, normal: 0 },
  dragon:   { dragon: 2, steel: 0.5, fairy: 0 },
  dark:     { psychic: 2, ghost: 2, fighting: 0.5, dark: 0.5, fairy: 0.5 },
  steel:    { ice: 2, rock: 2, fairy: 2, fire: 0.5, water: 0.5, electric: 0.5, steel: 0.5 },
  fairy:    { fighting: 2, dragon: 2, dark: 2, fire: 0.5, poison: 0.5, steel: 0.5 },
};

function effectiveness(attacker: TypeName, defender: TypeName): number {
  return CHART[attacker]?.[defender] ?? 1;
}

function defensiveMultipliers(types: string[]): Record<string, number> {
  return Object.fromEntries(
    ALL_TYPES.map((atk) => [
      atk,
      types.reduce((m, def) => m * effectiveness(atk, def as TypeName), 1),
    ])
  );
}

export interface TeamCoverage {
  weaknesses: { type: string; count: number; max: number }[];
  resistances: { type: string; count: number }[];
  immunities: string[];
  uncovered: string[];
}

export function getTeamCoverage(team: PokemonListItem[]): TeamCoverage {
  if (team.length === 0) {
    return { weaknesses: [], resistances: [], immunities: [], uncovered: [] };
  }

  const memberCharts = team.map((p) => defensiveMultipliers(p.types));

  const weaknesses: { type: string; count: number; max: number }[] = [];
  const resistances: { type: string; count: number }[] = [];
  const immunities: string[] = [];

  for (const atk of ALL_TYPES) {
    const mults = memberCharts.map((c) => c[atk]);
    const weakCount = mults.filter((m) => m > 1).length;
    const resistCount = mults.filter((m) => m > 0 && m < 1).length;
    const immuneCount = mults.filter((m) => m === 0).length;
    const maxMult = Math.max(...mults);

    if (immuneCount > 0 && weakCount === 0) {
      immunities.push(atk);
    } else if (weakCount > 0) {
      weaknesses.push({ type: atk, count: weakCount, max: maxMult });
    } else if (resistCount > 0) {
      resistances.push({ type: atk, count: resistCount });
    }
  }

  weaknesses.sort((a, b) => b.count - a.count || b.max - a.max);
  resistances.sort((a, b) => b.count - a.count);

  const teamTypes = [...new Set(team.flatMap((p) => p.types))];
  const covered = new Set(
    ALL_TYPES.filter((def) =>
      teamTypes.some((atk) => effectiveness(atk as TypeName, def) > 1)
    )
  );
  const uncovered = ALL_TYPES.filter((def) => !covered.has(def));

  return { weaknesses, resistances, immunities, uncovered };
}
