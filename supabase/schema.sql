-- ============ IdeaForge — schéma (déjà appliqué au projet Supabase) ============
-- Référence : ces tables existent déjà dans le projet "IdeaForge".
-- Gardé ici pour versionner le schéma et recréer la base ailleurs si besoin.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text, full_name text,
  locale text not null default 'fr', plan text not null default 'free',
  created_at timestamptz not null default now()
);

create table if not exists public.ideas (
  id text primary key, sector text not null, title text not null, pitch text,
  budget text, budget_min integer, revenue text, delai text,
  difficulty smallint check (difficulty between 1 and 3),
  market text, model text, competition text,
  steps jsonb not null default '[]', risks jsonb not null default '[]', tags jsonb not null default '[]',
  benchmark text, markets text, featured boolean not null default false, is_ai boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  locale text not null default 'fr', created_at timestamptz not null default now()
);

create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  idea_id text not null, created_at timestamptz not null default now(),
  primary key (user_id, idea_id)
);

create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  description text not null, sector text, budget text, email text,
  locale text not null default 'fr', quote jsonb, status text not null default 'new',
  created_at timestamptz not null default now()
);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique, locale text not null default 'fr',
  source text not null default 'drop', created_at timestamptz not null default now()
);

-- RLS + policies + trigger handle_new_user : voir les migrations du projet Supabase.
-- (profiles/favorites : privés par utilisateur ; ideas : lecture publique ;
--  quote_requests/newsletter : insertion ouverte à tous.)
