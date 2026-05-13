import { mkdir, writeFile } from "node:fs/promises";

const LIMIT = 151;
const OUTFILE = new URL("../src/data/pokemon-list.json", import.meta.url);

function spriteFromId(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }
  return res.json();
}

const list = await fetchJson(`https://pokeapi.co/api/v2/pokemon?limit=${LIMIT}`);
const pokemon = await Promise.all(
  list.results.map(async ({ name, url }) => {
    const id = Number(url.split("/").filter(Boolean).pop());
    const detail = await fetchJson(`https://pokeapi.co/api/v2/pokemon/${id}`);

    return {
      id,
      name,
      sprite: spriteFromId(id),
      types: detail.types.map((entry) => entry.type.name),
      total: detail.stats.reduce((sum, stat) => sum + stat.base_stat, 0),
      stats: Object.fromEntries(
        detail.stats.map((stat) => [stat.stat.name, stat.base_stat])
      ),
    };
  })
);

await mkdir(new URL("../src/data/", import.meta.url), { recursive: true });
await writeFile(OUTFILE, `${JSON.stringify(pokemon, null, 2)}\n`);
console.log(`Wrote ${pokemon.length} Pokemon to ${OUTFILE.pathname}`);
