# TeamDex

TeamDex is a full-stack Pokemon team builder for browsing the original Pokedex, saving favorites, and building reusable teams with type coverage analysis.

The app combines public PokeAPI data with authenticated user data stored in Supabase. Visitors can browse Pokemon, inspect detailed stats and evolution chains, and sign in to save Pokemon, manage a six-slot team, and store named team templates.

## Features

- Browse the first 151 Pokemon with search, type filters, saved-only filtering, and stat-based sorting
- View Pokemon detail pages with official art, sprites, abilities, base stats, evolution chains, and level-up moves
- Sign up, sign in, and sign out with Supabase Auth
- Save and unsave Pokemon per user
- Build a six-Pokemon team with persisted slots
- Save, load, and delete reusable team templates
- Analyze team type coverage, including weaknesses, resistances, immunities, effective coverage, and missing STAB coverage
- Responsive navigation with a mobile drawer menu

## Tech Stack

- **Next.js**: App Router, React Server Components, Server Actions, route-level data fetching
- **React**: Client components for interactive filters, saved state, mobile navigation, and team editing
- **TypeScript**: Typed API responses, team coverage logic, and component props
- **Supabase**: Auth, Postgres tables, and per-user persistence
- **PokeAPI**: Pokemon, species, evolution, ability, move, and sprite data
- **SCSS Modules**: Component-scoped styling with shared variables and mixins
- **Node.js runtime/tooling**: Used through Next.js for local development, builds, linting, and server-side execution

## Architecture

The project uses the Next.js App Router with server-first data loading. The Gen 1 list used by the dashboard and team picker is stored locally in `src/data/pokemon-list.json` for fast, reliable renders. Detail pages still fetch richer Pokemon, species, evolution, ability, and move data from PokeAPI with `revalidate` settings, while authenticated user data is read through Supabase server clients.

Server Actions in `src/app/actions` handle mutations for auth, bookmarks, team slots, and saved templates. Interactive UI is isolated into client components such as `PokemonGrid`, `TeamBuilder`, `BookmarkButton`, and `MobileNav`.

```text
src/app
  actions/          Server Actions for auth, bookmarks, and teams
  login/            Auth page
  pokemon/[name]/   Pokemon detail route
  team/             Team builder route

src/components      Reusable UI and interactive client components
src/lib             PokeAPI helpers, Supabase clients, and type coverage logic
src/styles          Global styles, variables, and mixins
```

## Data Model

The app expects Supabase tables for bookmarks, team slots, and saved team templates. A runnable setup script is included at `supabase/schema.sql`.

```sql
create table bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pokemon_name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, pokemon_name)
);

create table team_slots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slot int not null check (slot >= 0 and slot < 6),
  pokemon_name text not null,
  updated_at timestamptz not null default now(),
  unique (user_id, slot)
);

create table team_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slots text[] not null,
  created_at timestamptz not null default now()
);
```

In production, these tables should have Row Level Security enabled so users can only read and mutate rows where `user_id = auth.uid()`.

## Getting Started

Install dependencies:

```bash
npm install
```

Copy the environment template:

```bash
cp .env.local.example .env.local
```

Add your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev     # Start the local Next.js dev server
npm run build   # Create a production build
npm run start   # Run the production build
npm run lint    # Run ESLint
npm run generate:pokemon # Refresh the local Gen 1 list data from PokeAPI
```

## Portfolio Notes

This project demonstrates a practical full-stack workflow: server-rendered public data, authenticated user-specific persistence, optimistic client interactions, relational database modeling, and domain-specific analysis logic. The team builder and coverage tools are intentionally more product-like than a basic CRUD demo, giving the app a clear use case beyond browsing API data.
