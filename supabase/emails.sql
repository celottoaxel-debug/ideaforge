-- IdeaForge — colonnes pour les e-mails (Resend).
alter table public.profiles
  add column if not exists welcome_sent_at timestamptz,
  add column if not exists nurture_step smallint not null default 0,
  add column if not exists abandoned_sent_at timestamptz,
  add column if not exists email_opt_out boolean not null default false;

alter table public.newsletter_subscribers
  add column if not exists unsubscribed_at timestamptz,
  add column if not exists last_drop_at timestamptz;

-- Les comptes déjà existants ne reçoivent ni bienvenue ni relances rétroactives.
update public.profiles set welcome_sent_at = coalesce(welcome_sent_at, now()), nurture_step = 3
  where created_at < now();

create index if not exists profiles_nurture_idx on public.profiles (nurture_step, created_at) where plan = 'free' and email_opt_out = false;
