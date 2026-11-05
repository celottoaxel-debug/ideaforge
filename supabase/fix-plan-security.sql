-- IdeaForge — empêcher un utilisateur de se donner lui-même l'accès à vie.
-- Avant : la règle "profiles_update_own" laissait chaque membre modifier SA ligne,
-- y compris la colonne "plan" (n'importe qui pouvait passer en 'lifetime' sans payer).
-- Après : les utilisateurs connectés ne peuvent modifier que locale et full_name.
-- Le plan n'est changé que par le serveur (webhook Stripe / page succès, clé service_role).

revoke update on public.profiles from authenticated, anon;
grant update (locale, full_name) on public.profiles to authenticated;

revoke insert on public.profiles from authenticated, anon;
grant insert (id, email, full_name, locale) on public.profiles to authenticated;
