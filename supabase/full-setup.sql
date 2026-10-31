-- ============ IdeaForge — installation complète (à coller dans Supabase → SQL Editor du NOUVEAU projet) ============
-- Catalogue servi en statique par le site : pas besoin de la table "ideas" ni de seed.
-- Ce script crée les tables nécessaires (comptes, favoris, devis, newsletter) + sécurité + création auto du profil.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text, full_name text,
  locale text not null default 'fr', plan text not null default 'free',
  created_at timestamptz not null default now()
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

alter table public.profiles enable row level security;
alter table public.favorites enable row level security;
alter table public.quote_requests enable row level security;
alter table public.newsletter_subscribers enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (id = (select auth.uid()));

create policy "favorites_select_own" on public.favorites for select to authenticated using (user_id = (select auth.uid()));
create policy "favorites_insert_own" on public.favorites for insert to authenticated with check (user_id = (select auth.uid()));
create policy "favorites_delete_own" on public.favorites for delete to authenticated using (user_id = (select auth.uid()));

create policy "quotes_insert_any" on public.quote_requests for insert to anon, authenticated with check (true);
create policy "quotes_select_own" on public.quote_requests for select to authenticated using (user_id = (select auth.uid()));

create policy "newsletter_insert_any" on public.newsletter_subscribers for insert to anon, authenticated with check (true);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'))
  on conflict (id) do nothing;
  return new;
end; $$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
