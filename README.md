# IdeaForge

Site de **IdeaForge** — idées business validées (FR · US · ES), catalogue, devis SaaS, comptes & favoris.
Next.js 14 (App Router) + Supabase (base + Auth Google / GitHub / e-mail).

Le projet Supabase **IdeaForge** est déjà créé, avec les tables, la sécurité (RLS) et les 80 idées injectées.

## 1. Lancer en local

```bash
cd ideaforge
cp .env.local.example .env.local   # les clés sont déjà pré-remplies
npm install
npm run dev
```

Ouvre http://localhost:3000 — le catalogue affiche les 80 idées lues depuis Supabase.

## 2. Activer la connexion Google / GitHub / e-mail

Dans le dashboard Supabase → **Authentication → Providers** :

- **Email** : activé par défaut (lien magique) — rien à faire.
- **Google** : active le provider, colle ton *Client ID* / *Client Secret* (créés sur Google Cloud Console → OAuth).
- **GitHub** : active le provider, colle ton *Client ID* / *Client Secret* (GitHub → Settings → Developer settings → OAuth Apps).

Puis dans **Authentication → URL Configuration**, ajoute en *Redirect URLs* :
```
http://localhost:3000/auth/callback
https://TON-DOMAINE/auth/callback
```

## 3. Déployer sur Vercel

1. Pousse ce dossier sur un repo GitHub.
2. Sur [vercel.com](https://vercel.com) → *New Project* → importe le repo.
3. Ajoute les variables d'environnement (onglet *Environment Variables*) :
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://odkzhathddzbxojezcnx.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_lZKLF-xV6dQMjnJnJJGqmA_wylbnBVQ`
   - `NEXT_PUBLIC_SITE_URL` = `https://TON-DOMAINE`
4. Déploie. Ajoute l'URL `https://TON-DOMAINE/auth/callback` dans les Redirect URLs Supabase.
5. Branche ton nom de domaine (`ideaforges.io`) dans Vercel → *Domains*.

## Structure

```
app/            pages (catalogue, login, callbacks) + server actions
components/      FavoriteButton, QuoteForm, Newsletter (client)
lib/supabase/    clients Supabase (browser, server, middleware)
supabase/        schema.sql (référence) + seed.sql (les 80 idées)
```

## Données

- `ideas` — catalogue (lecture publique) + idées générées par IA (écriture = la sienne)
- `favorites` — idées sauvegardées, privées par utilisateur
- `quote_requests` — demandes de devis (tu les lis dans Supabase → Table Editor, ou via un back-office à venir)
- `newsletter_subscribers` — inscriptions au drop
- `profiles` — créé automatiquement à chaque inscription

## Paiement Stripe (Accès à vie)

Le flux est déjà codé : bouton → `/api/checkout` (crée la session Stripe) → paiement → `/api/stripe/webhook` passe `profiles.plan = 'lifetime'` → les fiches + prompts se débloquent automatiquement.

À configurer (une fois) :

1. **Crée un compte Stripe** puis, dans le Dashboard → *Products*, crée un produit **« IdeaForge — Accès à vie »**, prix **unique (one-time) 129 €**. Copie le `price_...`.
2. Récupère ta **clé secrète** (Developers → API keys → *Secret key*, `sk_...`).
3. Crée un **webhook** (Developers → Webhooks → *Add endpoint*) vers `https://TON-DOMAINE/api/stripe/webhook`, événement `checkout.session.completed`. Copie le *Signing secret* (`whsec_...`).
   - En local, utilise le CLI : `stripe listen --forward-to localhost:3000/api/stripe/webhook` (il te donne un `whsec_...`).
4. Récupère la **clé service_role Supabase** (Project Settings → API → `service_role`).
5. Remplis `.env.local` (et les variables Vercel) :
   ```
   SUPABASE_SERVICE_ROLE_KEY=...
   STRIPE_SECRET_KEY=sk_...
   STRIPE_LIFETIME_PRICE_ID=price_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

Test en mode test Stripe : carte `4242 4242 4242 4242`, date future, CVC quelconque.

## Prochaines étapes possibles

- Porter l'UI complète de la maquette (filtres, sélecteur FR/EN/ES, fiches détaillées, section « Niches », génération d'idées par IA, bouton « Lancer avec Claude »).
- Devis chiffré par IA (route serveur appelant l'API Claude).
- Back-office pour lire/traiter les `quote_requests`.
- Paiement Stripe pour les plans.
