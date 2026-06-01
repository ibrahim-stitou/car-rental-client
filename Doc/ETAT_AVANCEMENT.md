# État d'Avancement — Car Rental Client

> Projet : **GES-CARS 2026** — Application de gestion de location de voitures  
> Frontend : `C:\laragon\www\car-rental-client` (Next.js 15 + NextAuth v5)  
> Backend : `C:\laragon\www\GES-CARS-2026\car-rental-api` (Laravel + JWT)  
> Mise à jour : 2026-06-01 (Session 2)

---

## 1. Corrections appliquées

### 1.1 Bug d'authentification — CORRIGÉ ✅

**Symptôme** : `[auth][error] CredentialsSignin` à chaque tentative de connexion.

**Causes identifiées et fixes :**

| # | Fichier | Problème | Correction |
|---|---------|----------|------------|
| 1 | `car-rental-api` — migration `audits` | Colonnes `auditable_id` / `user_id` en `BIGINT` alors que l'app utilise des **UUID** (strings) → crash SQL 500 au `$user->update(['last_login_at' => now()])` | Nouvelle migration `2026_06_01_000001_fix_audits_table_uuid_columns.php` → `ALTER TABLE audits MODIFY COLUMN ... VARCHAR(36)` |
| 2 | `.env` — `AUTH_URL` | Pointait vers le backend `http://127.0.0.1:8000` au lieu de l'app Next.js | Corrigé → `AUTH_URL=http://localhost:3000` |
| 3 | `.env` — `AUTH_SECRET` | Variable dupliquée (ligne vide puis valeur réelle) | Nettoyé — une seule ligne valide |
| 4 | `src/lib/auth.config.ts` — `secret` | Lisait `process.env.NEXTAUTH_SECRET` (variable absente, format v4) — NextAuth v5 lit `AUTH_SECRET` automatiquement | Champ `secret` supprimé |
| 5 | `src/lib/auth.config.ts` — `catch {}` silencieux | Les erreurs backend étaient avalées sans log, rendant le debug impossible | Ajout d'un `console.error` avec status HTTP + body de la réponse |

**Credentials de test (après seeding) :**
```
superadmin@ges-cars.ma / password  (rôle: super-admin)
admin@ges-cars.ma      / password  (rôle: admin)
agent@ges-cars.ma      / password  (rôle: agent)
```

---

---

## 1b. Implémentation Session 2 — Tous les modules (2026-06-01)

### Changements majeurs

| Quoi | Détail |
|------|--------|
| **Pattern d'implémentation** | Tous les modules utilisent désormais `CustomTable` + `CustomAlertDialog` (pattern cohérent avec le reste du template) |
| **`useCustomTable` adapté** | Supporte maintenant les deux formats de pagination : DataTables (`start/length`) ET Laravel (`page/per_page` + `meta.pagination`) |
| **Modules complétés (CRUD complet)** | Agences, Clients, Véhicules, Réservations, Assurances, Maintenances, Visites techniques, Vignettes, Utilisateurs, Facturation |
| **Modules lecture seule** | Rôles, Logs d'activité |
| **Modules transversaux** | Notifications (liste + mark read + delete), Profil (édition), Sécurité (changement mot de passe) |
| **Formulaires** | `ClientForm`, `AgencyForm`, `InsuranceForm`, `MaintenanceForm`, `TechnicalInspectionForm`, `VignetteForm`, `UserForm`, `BillingForm` créés |
| **Route manquante ajoutée** | `apiRoutes.reservations.confirm` |
| **0 erreur TypeScript** | `npx tsc --noEmit` passe sans erreur |

### État post-session 2

| Module | Statut |
|--------|--------|
| Authentification (sign-in) | ✅ COMPLET |
| Dashboard/Overview | ✅ COMPLET |
| Agences | ✅ COMPLET (liste + CRUD) |
| Véhicules | ✅ COMPLET (liste + CRUD) |
| Clients | ✅ COMPLET (liste + CRUD) |
| Réservations | ✅ COMPLET (liste + CRUD + workflow confirm/activate/complete/cancel) |
| Facturation | ✅ COMPLET (liste + CRUD + mark paid + line items) |
| Assurances | ✅ COMPLET (liste + CRUD) |
| Maintenances | ✅ COMPLET (liste + CRUD) |
| Visites techniques | ✅ COMPLET (liste + CRUD) |
| Vignettes | ✅ COMPLET (liste + CRUD + mark paid) |
| Utilisateurs | ✅ COMPLET (liste + CRUD + activate/suspend) |
| Rôles | ✅ COMPLET (lecture seule) |
| Notifications | ✅ COMPLET (liste + mark read + delete) |
| Logs d'activité | ✅ COMPLET (lecture seule) |
| Profil | ✅ COMPLET (édition nom/téléphone) |
| Sécurité | ✅ COMPLET (changement mot de passe) |
| Reset password page | 🔴 Manquant |
| Paramètres | ✅ COMPLET (infos société) |
| Site web public | 🟡 STUB (page placeholder) |
| Token refresh automatique | 🔴 Manquant |

---

## 1c. Correctifs Session 3 (2026-06-01)

| Correction | Détail |
|------------|--------|
| **404 `/dashboard`** | Page `/dashboard` créée avec dashboard complet — c'est la destination post-login |
| **Bug SQL `clients.is_active`** | DashboardController corrigé → `is_blacklisted` (le bon champ) |
| **Bug `reference` réservations** | Colonne DB = `reservation_number`, resource API retourne maintenant aussi `reference` pour compatibilité frontend |
| **Statistiques enrichies** | `billing.revenue_this_month/last_month`, `clients.blacklisted/new_this_month`, `reservations.pending_action/upcoming_returns/this_month`, `recent_reservations` (8 dernières) |
| **Nav Dashboard** | Pointait sur `/overview` → maintenant `/dashboard` |
| **Settings page** | Créée avec formulaire informations société |
| **Website page** | Stub créé (no 404) |
| **Toutes icônes nav** | Vérifiées et présentes dans `icons.tsx` |

### Flux d'authentification complet ✅

```
/ → redirect /sign-in (middleware: non connecté)
/sign-in → [login] → redirect /dashboard (sign-in-form + middleware: connecté)
/dashboard → DashboardView (KPIs + charts + quick actions + recent reservations)
Sidebar → tous les modules naviguent correctement (0 page 404)
```

### Structure des routes publiques vs privées

| Type | Routes |
|------|--------|
| **Publiques** | `/sign-in`, `/forgot-password`, `/reset-password` |
| **Privées** | tout le reste → redirect `/sign-in` si non authentifié |
| **Exclues** | `/api/*` (bypass middleware) |

---

## 2. Architecture globale

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│  Frontend — Next.js 15      │        │  Backend — Laravel (PHP)     │
│  Port: 3000                 │◄──────►│  Port: 8000                  │
│  Auth: NextAuth v5 (JWT)    │  HTTP  │  Auth: tymon/jwt-auth        │
│  State: React Query + Zustand│       │  DB: MySQL (ges_car_2026_1)  │
│  UI: Shadcn/ui + Tailwind   │        │  Rôles: spatie/permission    │
└─────────────────────────────┘        └──────────────────────────────┘
```

**Flux d'authentification :**
1. Formulaire sign-in → `signIn('credentials', {email, password})`
2. NextAuth → `authorize()` → `POST /api/v1/auth/login`
3. Backend valide, met à jour `last_login_at`, retourne JWT + user
4. NextAuth stocke le token dans le cookie de session (JWT strategy, 24h)
5. Chaque requête API attache automatiquement `Authorization: Bearer <token>` via l'intercepteur Axios
6. Le middleware Next.js protège toutes les routes `/dashboard/**`

---

## 3. État d'avancement par module

### Légende
- ✅ **COMPLET** — Composants + hooks + page opérationnels
- 🟡 **PARTIEL** — Fonctionnel mais manque la page de détail/édition
- 🔴 **STUB** — Page existe (heading seulement), aucun composant UI
- ⬜ **ABSENT** — Ni page ni composant

---

### 3.1 Authentification & Sécurité

| Module | Statut | Ce qui existe | Ce qui manque |
|--------|--------|---------------|----------------|
| Sign-in | 🟡 PARTIEL | Page + form + validation Zod | Gestion d'erreur HTTP visible pour l'utilisateur |
| Forgot password | 🟡 PARTIEL | Page + view component | Logique d'envoi email (appel API) |
| Reset password | 🔴 STUB | Route dans config | Page `reset-password/page.tsx` manquante |
| Profil utilisateur | 🔴 STUB | `profile/page.tsx` vide | Composants + formulaire d'édition |
| Sécurité (mot de passe) | 🔴 STUB | `security/page.tsx` vide | Composant change-password |

---

### 3.2 Modules Métier

| Module | Statut | Composants | Hooks | Page liste | Page détail |
|--------|--------|-----------|-------|-----------|------------|
| **Véhicules** | 🟡 PARTIEL | `vehicles-view`, `vehicle-form` | `use-vehicles` | ✅ | ❌ `[id]/page.tsx` |
| **Réservations** | 🟡 PARTIEL | `reservations-view`, `reservation-form` | `use-reservations` | ✅ | ❌ `[id]/page.tsx` |
| **Clients** | 🟡 PARTIEL | `clients-view` (référence `ClientForm` manquant) | `use-clients` | ✅ | ❌ `[id]/page.tsx` |
| **Agences** | 🔴 STUB | ❌ aucun | `use-agencies` | Page vide | ❌ |
| **Facturation** | 🔴 STUB | ❌ aucun | `use-billing` | Page vide | ❌ |
| **Assurances** | 🔴 STUB | ❌ aucun | `use-insurances` | Page vide | ❌ |
| **Maintenances** | 🔴 STUB | ❌ aucun | `use-maintenances` | Page vide | ❌ |
| **Visites techniques** | 🔴 STUB | ❌ aucun | `use-technical-inspections` | Page vide | ❌ |
| **Vignettes** | 🔴 STUB | ❌ aucun | `use-vignettes` | Page vide | ❌ |

---

### 3.3 Administration

| Module | Statut | Composants | Hooks | Page |
|--------|--------|-----------|-------|------|
| **Utilisateurs** | 🔴 STUB | ❌ aucun | `use-users` | Page vide |
| **Rôles & Permissions** | 🔴 STUB | ❌ aucun | `use-roles` | Page vide |
| **Notifications** | 🔴 STUB | ❌ aucun | `use-notifications` | Page vide |
| **Logs d'activité** | 🔴 STUB | ❌ aucun | `use-logs` | Page vide |
| **Paramètres** | 🔴 STUB | ❌ aucun | `use-settings` | ❌ Pas de page |

---

### 3.4 Dashboard & Statistiques

| Module | Statut | Détails |
|--------|--------|---------|
| **Overview / Dashboard** | 🟡 PARTIEL | `overview-view.tsx` avec charts Recharts et KPI cards. Hook `use-dashboard.ts` connecté au backend. Fonctionnel mais sans filtres ni drill-down. |
| **Site web public** | 🔴 STUB | Hook `use-website.ts` présent. Aucune page dashboard pour gérer les réservations web. |

---

## 4. Intégration backend ↔ frontend

### 4.1 Services et routes API (204 endpoints définis)

Tous les services frontend sont définis dans `src/services/` et `src/config/apiRoutes.ts`. L'intégration **est codée** mais les composants UI qui appellent ces services sont manquants pour la majorité des modules.

| Service | Endpoints définis | Hooks React Query | UI connectée |
|---------|-----------------|-------------------|--------------|
| `auth.service` | login, logout, me, refresh, changePassword, forgotPassword, resetPassword | via NextAuth | ✅ Sign-in |
| `vehicle.service` | CRUD + status + photos + documents | `use-vehicles` | 🟡 Liste + création |
| `reservation.service` | CRUD + workflow + calendar + stats | `use-reservations` | 🟡 Liste + création |
| `client.service` | CRUD + restore | `use-clients` | 🟡 Liste (form manquant) |
| `agency.service` | CRUD + restore + logs | `use-agencies` | 🔴 Stub |
| `billing.service` | CRUD + approbation + PDF | `use-billing` | 🔴 Stub |
| `insurance.service` | CRUD + restore | `use-insurances` | 🔴 Stub |
| `maintenance.service` | CRUD + statuts + médias | `use-maintenances` | 🔴 Stub |
| `technical-inspection.service` | CRUD + restore | `use-technical-inspections` | 🔴 Stub |
| `vignette.service` | CRUD + paiement | `use-vignettes` | 🔴 Stub |
| `user.service` | CRUD + rôles + suspend | `use-users` | 🔴 Stub |
| `role.service` | CRUD + permissions | `use-roles` | 🔴 Stub |
| `notification.service` | list + markRead + summary | `use-notifications` | 🔴 Stub |
| `log.service` | list + show | `use-logs` | 🔴 Stub |
| `dashboard.service` | statistics | `use-dashboard` | 🟡 Partiel |
| `setting.service` | CRUD settings + logo | `use-settings` | 🔴 Stub |
| `website.service` | réservations publiques + véhicules | `use-website` | 🔴 Stub |

### 4.2 Points d'attention

- **CORS** : Aucune config CORS explicite dans le backend — fonctionne en dev car les requêtes NextAuth viennent du serveur Node (pas du navigateur). En production, configurer `config/cors.php`.
- **Token refresh** : Le token JWT expire en 60 min. L'intercepteur Axios gère le 401 (signOut), mais il n'y a **pas de logique de refresh automatique** avant expiration.
- **Schemas Zod** : Absents pour tous les formulaires sauf sign-in. Ajouter la validation côté client avant soumission.

---

## 5. Fichiers manquants critiques

```
src/
├── app/(auth)/reset-password/page.tsx          ← ABSENT
├── app/(dashboard)/
│   ├── agencies/[id]/page.tsx                  ← ABSENT (x11 features)
│   ├── vehicles/[id]/page.tsx
│   ├── clients/[id]/page.tsx
│   ├── reservations/[id]/page.tsx
│   ├── billing/[id]/page.tsx
│   ├── insurances/[id]/page.tsx
│   ├── maintenances/[id]/page.tsx
│   ├── technical-inspections/[id]/page.tsx
│   ├── vignettes/[id]/page.tsx
│   ├── users/[id]/page.tsx
│   └── settings/page.tsx                       ← ABSENT
│
├── features/
│   ├── agencies/components/                    ← VIDE
│   ├── billing/components/                     ← VIDE
│   ├── clients/components/client-form.tsx      ← MANQUANT (référencé)
│   ├── insurances/components/                  ← VIDE
│   ├── maintenances/components/                ← VIDE
│   ├── technical-inspections/components/       ← VIDE
│   ├── users/components/                       ← VIDE
│   ├── vignettes/components/                   ← VIDE
│   ├── profile/components/                     ← VIDE
│   ├── notifications/components/               ← VIDE
│   ├── logs/components/                        ← VIDE
│   ├── settings/components/                    ← VIDE
│   └── website/components/                     ← VIDE
```

---

## 6. Prochaines étapes recommandées

### Phase 1 — Stabilisation (priorité haute)

1. **Compléter les modules partiels** (véhicules, réservations, clients) :
   - Ajouter `[id]/page.tsx` avec vue détail + formulaire d'édition
   - Créer `client-form.tsx` (référencé mais absent dans `clients-view`)
   - Ajouter les schemas Zod pour la validation des formulaires

2. **Réinitialiser la page reset-password** :
   - Créer `src/app/(auth)/reset-password/page.tsx`
   - Connecter au endpoint `POST /api/v1/auth/reset-password`

3. **Refresh automatique du token JWT** :
   - Implémenter la logique de refresh dans le callback `jwt` de `auth.config.ts` quand le token approche de l'expiration (backend : `POST /api/v1/auth/refresh`)

### Phase 2 — Modules administratifs

4. **Agences** : Composants liste (DataTable) + formulaire create/edit + page détail
5. **Utilisateurs** : Liste + create/edit + assign-role + suspend/activate
6. **Rôles & Permissions** : Vue readonly + formulaire d'assignation

### Phase 3 — Modules opérationnels

7. **Facturation** : Vue liste + création de documents (6 types) + workflow approbation + aperçu PDF
8. **Assurances / Visites techniques / Vignettes** : CRUD standard avec DataTable
9. **Maintenances** : CRUD + workflow statuts (planifiée → en cours → terminée)

### Phase 4 — Fonctionnalités transversales

10. **Notifications** : Centre de notifications en temps réel + badge compteur
11. **Logs d'activité** : Vue en lecture seule avec filtres date/utilisateur/action
12. **Paramètres** : Gestion logo, infos société, configuration système
13. **Profil & Sécurité** : Édition profil + changement mot de passe

### Phase 5 — Finitions

14. **CORS production** : Configurer `config/cors.php` dans le backend pour les origines autorisées
15. **Gestion d'erreurs UI** : Afficher les messages d'erreur API (422 validation, 403 forbidden) dans les formulaires
16. **Tests** : Ajouter tests E2E pour les flux critiques (login, création réservation, facturation)
17. **Site web public** : Interface publique de réservation (`website` feature)

---

## 7. Stack technique

| Couche | Technologie | Version |
|--------|------------|---------|
| Framework Frontend | Next.js | 15.2.4 |
| React | React | 19.0.0 |
| Authentification | NextAuth (Auth.js) | v5 beta |
| HTTP Client | Axios | 1.8.4 |
| Data Fetching | TanStack React Query | 5.71.5 |
| State global | Zustand | 5.0.2 |
| Formulaires | React Hook Form + Zod | 7.54 / 3.24 |
| UI | Shadcn/ui + Radix UI | — |
| CSS | Tailwind CSS | 4.0 |
| Charts | Recharts | 2.15.1 |
| Tables | TanStack Table | 8.21.2 |
| i18n | next-intl | 4.0.2 |
| Framework Backend | Laravel | 12+ |
| Auth Backend | tymon/jwt-auth | — |
| Rôles/Permissions | spatie/laravel-permission | — |
| Audit | owen-it/laravel-auditing | — |
| Base de données | MySQL | — |

---

*Document généré automatiquement le 2026-06-01*
