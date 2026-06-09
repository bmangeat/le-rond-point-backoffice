# Rond Point — Backoffice Super Admin

Backoffice de gouvernance pour la plateforme **Le Rond Point**. Se branche sur la
**même base PostgreSQL Neon** que l'app principale et n'est accessible qu'aux
comptes `SUPER_ADMIN`.

> Projet **Next.js uniquement** (App Router). Pas de backend séparé : tout passe
> par les Server Components / Server Actions et Prisma.

## Stack

- **Next.js 14** (App Router) · React 18 · TypeScript · Tailwind
- **Prisma** (client typé sur le schéma partagé) · **Neon** (Postgres)
- **NextAuth v5** (Auth.js) — Google OAuth, sessions JWT
- Bypass **dev-login** (email Super Admin) en `NODE_ENV=development`

## Modules

| Route          | Rôle                                                                 |
| -------------- | -------------------------------------------------------------------- |
| `/`            | Tableau de bord — KPIs globaux + suivi du stockage Vercel Blob       |
| `/groups`      | Liste des groupes + création (groupe + invitation admin, 1 transaction) |
| `/groups/[id]` | Détail d'un groupe — membres + promotion `MEMBER` → `ADMIN`          |
| `/logs`        | Cron `/api/cron/daily` (TODO Vercel) + activité globale récente      |
| `/login`       | Connexion (Google + dev-login)                                       |
| `/403`         | Accès refusé (non Super Admin)                                       |

## Sécurité

Double garde :

1. **`middleware.ts`** (Edge) — lit le rôle dans le JWT et redirige vers `/403`
   tout compte non `SUPER_ADMIN`, **avant** de charger l'interface.
2. **`lib/admin.ts`** — `requireSuperAdmin()` / `assertSuperAdmin()` revérifient
   **en base** (le rôle du token peut être périmé) au début de chaque page et
   Server Action sensible.

## Démarrage

```bash
npm install                       # génère aussi le client Prisma (postinstall)
cp .env.example .env.local        # + .env (la CLI Prisma lit .env, pas .env.local)
#   → renseigner DATABASE_URL / DIRECT_URL (même base Neon que le-rond-point)
#   → AUTH_SECRET (openssl rand -base64 32), AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET
npm run prisma:generate           # si besoin de regénérer le client
npm run dev                       # http://localhost:3000
```

> ⚠️ Ce projet **ne lance jamais de migration**. La source de vérité du schéma
> reste `le-rond-point`. `prisma/schema.prisma` ne sert qu'à générer le client.

En dev, se connecter via **dev-login** avec l'email d'un compte `SUPER_ADMIN`
existant (ex. en QA : `brice.mangeat@gmail.com`).

## Reste à faire

- **`/logs`** : brancher la dernière exécution réelle du cron `/api/cron/daily`
  (API Vercel Cron, ou table `CronRun` écrite par le-rond-point). Stub pour l'instant.
- Estimation du stockage Blob basée sur ~3 Mo/photo — affiner si besoin via
  l'API Vercel Blob (`list()`).
- Envoi automatique (email) de l'invitation : pour l'instant le lien est
  **affiché/copiable** (création de groupe + fiche groupe), à transmettre à la main.

## Invitations

À la création d'un groupe, une `Invitation` (token hex, usage unique, 7 j) est
créée et son lien est affiché immédiatement (copiable). Il est aussi rappelé sur
la fiche du groupe tant qu'il est valide. Format : `<APP_BASE_URL>/invite/<token>`,
consommé par l'app **le-rond-point**.

> ⚠️ Le modèle `Invitation` n'a pas de champ rôle : le lien fait rejoindre en
> **Membre**. Pour nommer un Admin, promouvoir la personne ensuite depuis
> `/groups/[id]`.

## Déploiement Vercel

`vercel-build` lance `prisma generate && next build`. Définir dans le projet
Vercel : `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`,
`AUTH_GOOGLE_SECRET`, `APP_BASE_URL` (domaine de le-rond-point pour les liens
d'invitation). **Ne pas** définir `NEXTAUTH_URL` (auto-détecté, `trustHost`).
Ajouter le callback `https://<env>.vercel.app/api/auth/callback/google` dans Google Cloud.
