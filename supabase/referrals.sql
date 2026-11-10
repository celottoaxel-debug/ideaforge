-- Système de parrainage IdeaForge
-- profiles : code de parrainage, parrain, mois membre offert
alter table public.profiles add column if not exists ref_code text unique;
alter table public.profiles add column if not exists referred_by uuid references public.profiles(id) on delete set null;
alter table public.profiles add column if not exists bonus_until timestamptz;

-- Un filleul n'a qu'un seul parrain
create table if not exists public.referrals (
  id bigserial primary key,
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_id uuid not null unique references public.profiles(id) on delete cascade,
  status text not null default 'signed_up' check (status in ('signed_up', 'paid')),
  plan text,
  amount_cents integer,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  check (referrer_id <> referred_id)
);
create index if not exists referrals_referrer_idx on public.referrals (referrer_id);

-- Paliers atteints : 1 = 1 mois offert, 2 = accès à vie, 3 = SaaS prioritaire -30 %
create table if not exists public.referral_rewards (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  tier smallint not null check (tier in (1, 2, 3)),
  status text not null default 'granted' check (status in ('granted', 'included', 'pending', 'delivered')),
  created_at timestamptz not null default now(),
  delivered_at timestamptz,
  unique (user_id, tier)
);

-- Lecture seule de ses propres lignes ; toutes les écritures passent par le serveur (clé service)
alter table public.referrals enable row level security;
alter table public.referral_rewards enable row level security;
drop policy if exists "referrals_select_own" on public.referrals;
create policy "referrals_select_own" on public.referrals for select to authenticated using (referrer_id = (select auth.uid()));
drop policy if exists "rewards_select_own" on public.referral_rewards;
create policy "rewards_select_own" on public.referral_rewards for select to authenticated using (user_id = (select auth.uid()));
revoke insert, update, delete on public.referrals from authenticated, anon;
revoke insert, update, delete on public.referral_rewards from authenticated, anon;
