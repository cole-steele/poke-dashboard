import type { ReactNode } from "react";
import { PhysicalBadge, SpecialBadge } from "@/components/StatBadge";

const STAT_DESC: Record<string, ReactNode> = {
  hp:               "Hit Points. How much damage your Pokémon can take before fainting. Higher HP means it survives longer in battle.",
  attack:           <><PhysicalBadge /> attack power. Determines damage dealt by moves that make direct contact, like Tackle, Slash, and Earthquake.</>,
  defense:          <><PhysicalBadge /> defense. Reduces damage taken from moves that make direct contact. Higher defense means less damage per hit.</>,
  "special-attack": <><SpecialBadge /> attack power. Determines damage dealt by energy-based moves that don&apos;t make contact, like Flamethrower, Psychic, and Thunderbolt.</>,
  "special-defense":<><SpecialBadge /> defense. Reduces damage taken from energy-based moves that don&apos;t make contact, like Flamethrower and Thunderbolt.</>,
  speed:            "Determines who acts first each turn. A faster Pokémon attacks before its opponent.",
};

export default STAT_DESC;
