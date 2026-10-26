# Proposition — Site web public & demandes de réservation en ligne

> Projet : **GES-CARS 2026**. Rédigé le 2026-10-26, **validé le 2026-10-26** (décisions au § 12).
> Périmètre : backend `car-rental-api` (Laravel), back-office `car-rental-client` (Next.js), nouvelle application **site web public**.
> Le paiement en ligne n'est **pas** dans ce lot, mais l'architecture est prévue pour l'accueillir (§ 9).

---

## 1. Objectifs

1. Un **site web vitrine professionnel** et attractif : présentation de la société, des **agences** (adresse, carte, horaires, contacts) et de la **flotte**.
2. Le visiteur **recherche une voiture** (agence, dates, catégorie, boîte, carburant, prix…), voit les **photos** et les **caractéristiques**, puis **envoie une demande de réservation**.
3. Le gestionnaire **voit les demandes** dans le back-office, **contacte le client** (appel, WhatsApp, e-mail) en gardant une trace de chaque échange, puis **accepte** ou **refuse**.
4. Une demande acceptée est **convertie en réservation** en passant par les mêmes règles que le back-office (conflits, tarifs, numérotation, contrat).
5. Le back-office **oblige à saisir des infos complètes** (photos, description, équipements, infos d'agence) avant qu'une voiture ou une agence soit publiée.
6. Plus tard : **paiement en ligne** (acompte ou totalité).

---

## 2. Ce qui existe déjà (audit)

### 2.1 Backend (`car-rental-api`)

| Élément | État | Remarque |
|---|---|---|
| `vehicles.show_on_website`, `website_description`, `website_price_override` | ✅ existe | Rien pour les équipements, le slug, la photo de couverture ni l'ordre d'affichage |
| Collection média `photos` (+ conversions `thumb`, `medium`) sur `Vehicle` | ✅ existe | Pas de photo de couverture, pas d'ordre géré côté UI, pas de WebP « large » |
| Collection `logo` sur `Agency` | ✅ existe | Rien pour la carte (lat/lng), les horaires, les photos ou la publication web |
| Table `web_reservations` + modèle `WebReservation` | ✅ existe | Statuts trop limités, pas d'agence, pas d'historique des contacts, pas de gestionnaire assigné |
| `GET /public/company`, `/public/vehicles`, `/public/vehicles/{id}`, `POST /public/reservations` | ✅ existe | Avec rate limiting `throttle:public` / `public-submit` |
| Admin `/website/*` (stats, liste, approve, reject, véhicules) | ✅ existe | Permission unique `manage-website` |

**Problèmes à corriger dans l'existant :**

1. **La disponibilité n'est pas calculée sur les dates** : `publicVehicles()` filtre `status = 'available'`. Une voiture louée aujourd'hui mais libre la semaine prochaine disparaît du site, et une voiture « available » déjà réservée sur les dates demandées s'affiche quand même.
2. **`approve()` contourne les règles métier** : il appelle `Reservation::create()` directement. Il n'y a ni contrôle de conflit (`checkConflict`), ni `calculateTotal()`, ni numérotation par agence (`agency_document_counters`), ni `created_by`, ni caution. Il faut passer par `ReservationService::create()`.
3. **Recherche du client par e-mail seul** (`Client::firstOrCreate(['email' => …])`) : risque de doublons ou de fusion erronée. Il faut chercher par téléphone, e-mail et CIN, et laisser le gestionnaire choisir.
4. **La référence `WEB-YYYY-NNNN` est calculée par `count() + 1`** : deux demandes simultanées peuvent obtenir la même référence (contrainte `unique` → erreur 500).
5. **`/public/vehicles/{id}` expose l'UUID interne** et `getMediaByCollection` renvoie potentiellement des métadonnées internes. Il faut des **slugs** et une ressource publique dédiée.
6. Aucune **notification** (gestionnaire ou client) à la création ou au traitement d'une demande.
7. Aucune protection **anti-spam** à part le rate limiting par IP.

### 2.2 Back-office (`car-rental-client`)

| Élément | État |
|---|---|
| `src/app/(dashboard)/website/page.tsx` | Placeholder « Coming soon » |
| `src/services/website.service.ts`, `features/website/hooks/use-website.ts`, `types/website.types.ts` | Existent (service et hooks prêts, pas d'UI) |
| `VehicleForm` : switch « afficher sur le site », description web, prix web | Existe, sans contrôle de complétude |
| Gestion des photos véhicule | Upload et suppression, mais pas de réordonnancement ni de photo de couverture |
| `@dnd-kit` déjà installé | Utilisable pour réordonner les photos |

### 2.3 Point d'attention Git

✅ **Traité le 2026-10-26** : les 21 fichiers non commités du backend (stack Docker et couche sécurité du 2026-10-01) ont été retirés de `main` et conservés dans `git stash` sous le nom `backup-docker-securite-2026-10-01`. Pour les récupérer : `git stash apply` ; pour les effacer définitivement : `git stash drop`.
⚠️ **Un push sur `main` déclenche le déploiement en production** (front et back). Tout le travail se fait sur des branches et n'est fusionné qu'après validation.

---

## 3. Architecture proposée

```
                    ┌──────────────────────────────┐
  Visiteurs  ──────▶│  SITE WEB PUBLIC (nouveau)   │  www.<domaine>
                    │  Next.js 15 · SSR/ISR · SEO  │
                    │  FR / AR (RTL) / EN          │
                    └──────────────┬───────────────┘
                                   │ Server Components + Server Actions
                                   │ (API_INTERNAL_URL, en-tête X-Client-Ip)
                                   ▼
                    ┌──────────────────────────────┐
                    │  API Laravel (car-rental-api)│
                    │  /api/v1/public/*  (sans auth)│
                    │  /api/v1/website/* (JWT+perm)│
                    └──────────────┬───────────────┘
                                   ▲
                                   │ JWT (NextAuth)
                    ┌──────────────┴───────────────┐
  Gestionnaires ───▶│  BACK-OFFICE (existant)      │  admin.<domaine>
                    │  car-rental-client           │
                    └──────────────────────────────┘
```

### 3.1 Pourquoi une application séparée pour le site public (recommandé)

| Critère | App séparée ✅ | Pages publiques dans le back-office |
|---|---|---|
| Design | Libre, orienté marketing et conversion | Contraint par la charte admin |
| Performance / SEO | Bundle léger, SSR/ISR, pas de NextAuth ni React Query admin | Bundle et middleware d'auth partagés |
| Sécurité | Aucun code admin exposé, surface d'attaque minimale | Risque de fuite (routes, middleware) |
| Déploiement | Indépendant : un bug du site ne casse pas l'admin | Un seul déploiement pour les deux |
| Domaine | `www.` vs `admin.` naturellement | Réécritures plus complexes |
| Coût | Un repo et un process PM2 en plus | — |

**Alternative écartée pour l'instant : monorepo** (pnpm workspaces avec un package `@ges/types` partagé). C'est intéressant, mais il faudrait restructurer deux repos qui sont aujourd'hui déployés séparément. On pourra y revenir plus tard. Pour l'instant, les types publics sont dupliqués (peu nombreux).

---

## 4. Stratégie Git

| Repo | Branche | Contenu |
|---|---|---|
| `car-rental-api` | `feature/site-web` | Migrations, endpoints publics v2, workflow des demandes, notifications |
| `car-rental-client` | `feature/site-web` | Module « Site web » du back-office, onglets web sur véhicule/agence, gestion des photos |
| **nouveau** `car-rental-website` (dans `C:\laragon\www\GES-CARS-2026\car-rental-website`) | `main` + `develop` | Site public. **Pas de workflow de déploiement** tant que le site n'est pas validé |

Règles :
- **Aucune CI ni aucun déploiement pendant le développement de ce module.** Les workflows `deploy.yml` actuels (API et admin) ne réagissent qu'à un `push` sur `main`, donc les commits et pushes sur `feature/site-web` ne déclenchent rien. Le repo `car-rental-website` n'a **aucun** dossier `.github/workflows`, et on n'en ajoute pas avant la mise en ligne.
- **Migrations backend uniquement additives** (nouvelles colonnes nullable ou avec valeur par défaut). L'admin actuel en production continue donc de fonctionner même si le backend est fusionné avant le front.
- Ordre de fusion : **backend → back-office → mise en ligne du site**.
- Commits petits et thématiques. Fusion dans `main` uniquement après recette locale (stack Docker) **et votre accord explicite**.

---

## 5. Site web public

### 5.1 Stack

- **Next.js 15 (App Router)**, React 19, TypeScript, **Tailwind 4 + shadcn/ui** (mêmes outils que l'admin, mais design propre).
- **next-intl** : FR (par défaut), **AR avec RTL**, EN.
- **SSR + ISR** (`revalidate` et revalidation à la demande par tag : quand une voiture ou une agence change, l'API appelle `POST /api/revalidate` du site avec un secret).
- `next/image` (WebP/AVIF, tailles responsives) sur les conversions médias de l'API.
- Cartes : **Leaflet + OpenStreetMap** (gratuit). Google Maps en option, avec clé API.
- Formulaires : react-hook-form + zod (comme l'admin).
- Anti-spam : **Cloudflare Turnstile** (gratuit, sans « images à cliquer ») + honeypot + rate limiting API.
- SEO : `sitemap.xml`, `robots.txt`, métadonnées Open Graph par page, **JSON-LD** (`AutoRental`/`LocalBusiness` par agence, `Product`/`Offer` par voiture), URLs propres avec slugs.
- Analytics : Google Analytics 4 ou Plausible (identifiant configurable dans les paramètres « website »).

### 5.2 Pages

| Route | Contenu |
|---|---|
| `/` Accueil | Hero plein écran + **widget de recherche** (agence de départ, agence de retour, dates et heures), catégories, voitures mises en avant, atouts (assurance, kilométrage, assistance…), agences, avis, FAQ courte, CTA WhatsApp |
| `/voitures` | Résultats et catalogue : filtres (agence, dates, catégorie, boîte, carburant, places, prix), tri, cartes avec photo, prix/jour et badge « disponible sur vos dates ». Les filtres sont gardés dans l'URL (partageables) |
| `/voitures/[slug]` | **Galerie** (lightbox, swipe mobile), caractéristiques et équipements, conditions (âge minimum, permis, caution, kilométrage), **calcul du prix estimé** selon les dates, agences où la voiture est disponible, voitures similaires, CTA « Demander une réservation » |
| `/agences` | Liste et **carte** de toutes les agences |
| `/agences/[slug]` | Photos, adresse, carte, **horaires**, téléphone/WhatsApp/e-mail, itinéraire, voitures disponibles dans l'agence |
| `/reservation` | **Tunnel en 3 étapes** : ① dates et agences (prérempli) ② options (conducteur supplémentaire, siège enfant, livraison…) ③ coordonnées (nom, téléphone, e-mail, âge, n° de vol facultatif, message, consentement). Récapitulatif avec **prix estimatif** à droite |
| `/reservation/confirmation/[reference]` | Merci, référence, prochaines étapes (« un conseiller vous contacte sous X h »), bouton WhatsApp |
| `/suivi/[token]` *(optionnel, recommandé)* | Le client suit l'état de sa demande via un lien secret reçu par e-mail. Ce sera aussi le point d'entrée du **paiement** plus tard |
| `/a-propos`, `/contact`, `/faq` | Contenu géré depuis le back-office |
| `/conditions-generales`, `/mentions-legales`, `/confidentialite` | Pages légales. **Loi 09-08 (CNDP)** : consentement explicite au traitement des données |

### 5.3 Design

- Direction : **premium et rassurant**. Grandes photos, typographie soignée, une couleur d'accent issue du logo, beaucoup d'espace, coins arrondis, micro-animations discrètes.
- **Mobile first** (la majorité du trafic de location arrive par mobile). CTA « Réserver » et « WhatsApp » toujours accessibles (barre collante sur mobile).
- Cibles Lighthouse : **Performance ≥ 90, SEO ≥ 95, Accessibilité ≥ 90**.
- Je propose de commencer par **2 maquettes de la page d'accueil** (ou un échantillon HTML) pour valider la direction visuelle avant de décliner les autres pages.

### 5.4 Sécurité du site public

- Le site n'appelle **que** `/api/v1/public/*`, **côté serveur** (Server Components et Server Actions). L'URL interne de l'API n'est jamais exposée au navigateur, et aucun CORS n'est nécessaire pour le formulaire.
- ⚠️ Comme les appels passent par le serveur Next, **l'IP vue par Laravel serait celle du serveur**. Le rate limiting par IP deviendrait alors global. Le site transmet donc l'IP réelle dans `X-Client-Ip`, et l'API ne fait confiance à cet en-tête **que** si la requête porte un secret partagé (`X-Website-Key`). Sinon, elle utilise `request->ip()`.
- Le jeton Turnstile est vérifié **côté API** (clé secrète dans `.env`).

---

## 6. Workflow des demandes de réservation

### 6.1 Cycle de vie

```
             ┌────────────┐  le gestionnaire ouvre / appelle  ┌────────────┐
  Site ────▶ │    new     │ ─────────────────────────────────▶│ contacted  │
             └─────┬──────┘                                    └─────┬──────┘
                   │                                                 │
       refuse      │      accepte                         accepte    │   refuse
     ┌─────────────┼───────────────┐            ┌────────────────────┼─────────┐
     ▼             │               ▼            ▼                    │         ▼
┌──────────┐       │        ┌────────────┐                           │   ┌──────────┐
│ rejected │       │        │ converted  │◀──────────────────────────┘   │ rejected │
└──────────┘       │        └────────────┘  (réservation créée)          └──────────┘
                   │               ▲
                   │               │ (futur) paiement reçu
                   │        ┌──────┴──────────┐
                   │        │awaiting_payment │  ← prévu, non activé dans ce lot
                   │        └─────────────────┘
                   ▼
          ┌──────────────────────┐
          │ cancelled / expired  │  (annulée par le client / sans suite après la date de départ)
          └──────────────────────┘
```

Statuts : `new`, `contacted`, `converted`, `rejected`, `cancelled`, `expired`, plus `awaiting_payment` (réservé pour le paiement).
Une commande planifiée (`scheduler` existe déjà) passe en `expired` les demandes `new`/`contacted` dont la date de départ est passée.

### 6.2 Traitement côté gestionnaire

1. **Notification** dès la création d'une demande : notification in-app (module Notifications existant) aux utilisateurs de **l'agence de départ** (`agency_user`) ayant la permission, plus un e-mail. Badge du nombre de nouvelles demandes dans la sidebar.
2. **Fiche demande** :
   - informations client, dates, agences, voiture ou modèle demandé, options, prix estimatif, message ;
   - **boutons de contact** : `tel:`, **WhatsApp** (message prérempli avec la référence), `mailto:` ;
   - **journal des échanges** (appel, WhatsApp, e-mail, note) avec auteur et date, plus le résultat (« injoignable », « à rappeler le… ») ;
   - **contrôle de disponibilité en direct** sur les dates (réutilise `checkConflict`) ;
   - **détection du client existant** (même téléphone, e-mail ou CIN) avec choix « lier » ou « créer ».
3. **Accepter** ouvre le **formulaire de réservation existant prérempli** (client, voiture, dates, agences, tarif). Le gestionnaire choisit la voiture précise et complète CIN, permis, caution… À la validation, l'appel passe par `ReservationService::create()` (conflits, calcul, numérotation, audit). La demande passe en `converted` et est liée à la réservation.
4. **Refuser** demande un **motif** (liste : indisponible, dossier incomplet, client injoignable… ou texte libre), avec envoi optionnel d'un e-mail au client et, si possible, **proposition d'une alternative** (autre voiture ou autres dates).
5. **Assignation** : une demande peut être prise en charge par un gestionnaire (`assigned_to`) pour éviter que deux personnes appellent le même client.

### 6.3 Communications client

| Événement | Canal |
|---|---|
| Demande reçue | E-mail d'accusé de réception (référence + lien de suivi) |
| Demande acceptée | E-mail de confirmation (récapitulatif, agence, documents à apporter). Plus tard : lien de paiement |
| Demande refusée | E-mail courtois avec motif et alternatives |
| *(option)* | SMS ou WhatsApp Business API (phase ultérieure, coût par message) |

Les e-mails passent par la file **queue** existante (Horizon) et des **templates Blade** bilingues FR/AR.

---

## 7. Backend : modifications détaillées (`feature/site-web`)

### 7.1 Décision clé : réserver une **voiture précise** ou un **modèle** ?

✅ **Décision : réservation par véhicule.** Chaque voiture publiée a sa propre fiche sur le site. L'immatriculation n'est jamais affichée.
- Disponibilité sur des dates : le véhicule est actif, publié, et n'a aucune réservation (`pending`, `confirmed`, `active`) ni maintenance qui chevauche ces dates.
- À la conversion, le gestionnaire peut **changer de véhicule** (équivalent disponible) si celui demandé n'est plus libre.
- Pour limiter la double saisie entre voitures identiques : bouton **« Copier la fiche web depuis un autre véhicule »** (description, équipements, photos).

### 7.2 Migrations (toutes additives)

**`vehicles`** (enrichissement ; `show_on_website` et `website_price_override` existants sont conservés) :
`website_slug` unique · `website_title` (traduisible : JSON `{fr, ar, en}`) · `website_description` → JSON traduisible · `website_short_description` (traduisible) · `doors` · `luggage_large` · `luggage_small` · `has_ac` · `features` json (GPS, Bluetooth, CarPlay, caméra de recul, régulateur…) · `website_featured` · `website_sort_order` · `website_published_at`. Conditions propres au véhicule, **nullables** car elles priment sur les conditions globales : `min_driver_age` · `min_license_years` · `mileage_policy` (`unlimited`/`limited`) · `mileage_limit_per_day` · `website_deposit_amount`.
**Prix affiché** = `website_price_override` s'il est renseigné, sinon `daily_rate`. Il est modifiable depuis l'admin et affiché « **X MAD / jour** ».
Médias : la collection `photos` existante est conservée, avec une photo de **couverture** (`custom_properties.is_cover`), un ordre (`order_column`), un texte alternatif et une conversion supplémentaire `large` en WebP.

**Conditions globales de location** (paramètres `website.rental_conditions`, éditables dans l'admin) : âge minimum, ancienneté du permis, caution par défaut, politique kilométrique, documents requis, carburant, texte libre traduisible. Chaque véhicule peut les surcharger.

**`agencies`** : `slug` unique · `show_on_website` · `website_description` (traduisible) · `latitude` · `longitude` · `google_maps_url` · `whatsapp` · `opening_hours` json (par jour, plusieurs créneaux, jours fériés) · `services` json (livraison aéroport, 24/7…) · `sort_order`. Collection média `photos`.

**`agency_pickup_points`** : points de livraison par agence (aéroport, gare, hôtel, adresse libre). Les frais ne sont **pas** affichés en montant : le site indique « **des frais de livraison peuvent s'appliquer** ». Le gestionnaire les fixe à la conversion.

**Retour dans une autre agence** : autorisé sur demande du client. Le site affiche « **des frais supplémentaires peuvent s'appliquer** ». Le gestionnaire les fixe à la conversion.

**`website_extras`** : options louables (conducteur supplémentaire, siège bébé, GPS…) : `code`, `label` (traduisible), `pricing` (`per_day`/`per_rental`), `price`, `is_active`. Le même référentiel servira plus tard à la réservation en ligne payée.

**`web_reservations`** (extension) : `agency_id` (départ) · `return_agency_id` · `delivery_requested` · `delivery_address` · `client_id` (nullable, lien client existant) · `pickup_point_id` · `extras` json · `driver_age` · `flight_number` · `estimated_total` · `currency` (`MAD`) · `locale` · `tracking_token` (unique, pour `/suivi`) · `assigned_to` · `contacted_at` · `handled_by` · `handled_at` · `rejection_code` · `consent_at` · `utm` json (source marketing) · `payment_status` (`none` par défaut, **prévu pour le paiement**) · `amount_due_online` (nullable). Le **statut** est élargi aux valeurs du § 6.1. Migration : `pending` → `new`, `approved` → `converted`.

**`web_reservation_events`** : `id` · `web_reservation_id` · `type` (`status_change`, `call`, `whatsapp`, `email`, `note`, `notification_sent`) · `outcome` · `body` · `user_id` · `created_at`.

**Référence** : génération via `agency_document_counters` (déjà en place pour les autres numérotations, avec verrou), ou un compteur dédié verrouillé par `lockForUpdate`.

### 7.3 Endpoints publics (`/api/v1/public`, sans auth, throttled)

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/site` | Paramètres société + contenu du site (hero, à propos, FAQ, réseaux, SEO) |
| GET | `/agencies` · `/agencies/{slug}` | Agences publiées (sans champs fiscaux ni bancaires) |
| GET | `/vehicles` | Recherche : `agency`, `pickup_at`, `return_at`, `category`, `transmission`, `fuel`, `seats`, `price_min/max`, `sort`, pagination. Renvoie `available` et le prix estimé si des dates sont fournies |
| GET | `/vehicles/{slug}` | Fiche détaillée (conditions fusionnées global + véhicule) + véhicules similaires |
| GET | `/vehicles/{slug}/quote` | Devis estimatif (jours, tarif, options). Livraison et aller simple marqués « frais éventuels » |
| GET | `/conditions` | Conditions globales de location |
| GET | `/extras` | Options disponibles |
| POST | `/reservation-requests` | Création de la demande (validation, Turnstile, honeypot, throttle) |
| GET | `/reservation-requests/{token}` | Suivi par le client (données minimales) |
| POST | `/reservation-requests/{token}/cancel` | Annulation par le client (si `new`/`contacted`) |

L'ancien `/public/vehicles/{id}` (UUID) est remplacé par le slug. L'ancien `/public/reservations` reste en alias de `/reservation-requests` le temps de la transition.

Ressources publiques **dédiées** (`PublicVehicleResource`, `PublicAgencyResource`) : liste blanche stricte des champs. Jamais d'immatriculation, de VIN, d'UUID interne, de données fiscales ou bancaires.

### 7.4 Endpoints admin (`/api/v1/website`, JWT)

| Méthode | Route |
|---|---|
| GET | `/requests` (filtres statut/agence/dates/assigné, recherche) · `/requests/{id}` · `/requests/stats` |
| POST | `/requests/{id}/assign` · `/requests/{id}/events` (journal) |
| GET | `/requests/{id}/availability` · `/requests/{id}/client-matches` |
| POST | `/requests/{id}/convert` (payload = réservation complète → `ReservationService::create`) |
| POST | `/requests/{id}/reject` (motif + e-mail optionnel) |
| GET/PATCH | `/vehicles` · `/vehicles/{id}` (fiche web) · `/vehicles/{id}/photos` (ordre, couverture, alt) · `/vehicles/{id}/publish` (contrôle de complétude) · `/vehicles/{id}/copy-from/{sourceId}` |
| GET/PUT | `/conditions` (conditions globales) |
| PATCH | `/agencies/{id}/website` (+ médias) |
| CRUD | `/extras` · `/content` (pages, FAQ, hero, avis) |

**Permissions** (spatie) remplaçant `manage-website` : `website.requests.view`, `website.requests.handle`, `website.catalog.manage`, `website.content.manage`. Les demandes sont **filtrées par agence** selon `agency_user`, comme le reste de l'app.

### 7.5 Saisie garantie (règles de publication)

Un véhicule ne peut passer `show_on_website = true` que si :
- couverture + **au moins 4 photos** (largeur ≥ 1200 px, conversions WebP générées) ;
- slug, catégorie, boîte, carburant, places, portes, bagages, prix web et caution renseignés ;
- titre et description courte **en FR, AR et EN** (les 3 langues sont validées) ;
- véhicule actif, rattaché à une agence elle-même publiée.

Une agence ne peut être publiée que si : adresse, ville, téléphone, **coordonnées GPS**, horaires et au moins 1 photo sont renseignés.
L'API renvoie la **liste précise des éléments manquants** (422), que le back-office affiche sous forme de checklist.

---

## 8. Back-office : modifications (`car-rental-client`, `feature/site-web`)

1. **Menu « Site web »** (remplace le placeholder) :
   - **Tableau de bord** : demandes du jour, nouvelles / en cours / converties / refusées, taux de conversion, délai moyen de première prise de contact, sources.
   - **Demandes** : liste (onglets par statut, badge sur les nouvelles), fiche avec timeline, boutons de contact, disponibilité, détection client, **Accepter → formulaire de réservation prérempli**, **Refuser → motif**.
   - **Véhicules publiés** : liste avec **score de complétude**, modification rapide du **prix affiché**, mise en avant, ordre d'affichage, bouton **Publier** bloqué tant que la checklist n'est pas complète, lien « voir sur le site ».
   - **Options** (extras) : CRUD simple.
   - **Conditions de location** : conditions globales (âge, permis, caution, kilométrage, documents, texte FR/AR/EN).
   - **Contenu & paramètres** : hero, à propos, FAQ, avis, liens sociaux, WhatsApp, SEO, analytics, délai de réponse affiché, e-mail de notification.
2. **Gestionnaire de photos réutilisable** : glisser-déposer multiple, **réordonnancement** (`@dnd-kit` déjà installé), choix de la **couverture**, texte alternatif, compression côté client, refus des images trop petites.
3. **Fiche agence** : nouvel onglet « Site web » avec **sélecteur de position sur carte** (Leaflet), éditeur d'horaires, photos, description, slug, interrupteur de publication et checklist.
4. **Fiche véhicule** : onglet « Site web » (titre et descriptions FR/AR/EN, équipements, bagages, portes, prix affiché, conditions spécifiques, photos, checklist, publier) et bouton « Copier depuis un autre véhicule ».
5. **Notifications** : la cloche existante reçoit les nouvelles demandes, avec lien direct vers la fiche.

---

## 9. Préparation du paiement en ligne (non développé dans ce lot)

Ce qui est posé dès maintenant pour ne rien casser plus tard :
- `web_reservations.payment_status`, `amount_due_online` et le statut `awaiting_payment` sont **déjà dans le schéma** ;
- devis serveur unique (`/vehicles/{slug}/quote`). Le montant payé sera **toujours recalculé côté serveur**, jamais pris du navigateur ;
- `tracking_token` et la page `/suivi/[token]` serviront de **page de paiement** ;
- les paiements reçus iront dans `reservation_payments` (existant), donc la facturation et les crédits restent cohérents.

Phase future (à valider à ce moment-là) :
- table `online_payments` (`provider`, `provider_reference`, `amount`, `currency`, `status`, `payload` brut, `paid_at`) ;
- interface `PaymentGateway` dans Laravel (création de session, vérification de **webhook signé**, remboursement) avec un adaptateur par fournisseur. Au Maroc : **CMI** (référence bancaire) ou un agrégateur ; à choisir selon votre banque ;
- deux scénarios possibles : **(1)** acceptation par le gestionnaire → envoi du lien de paiement de l'acompte → `converted` à réception ; **(2)** réservation instantanée payée (plus tard, si la disponibilité en ligne est fiable).

---

## 10. Déploiement

- Serveur actuel : nouveau dossier `/var/www/ges-cars-website`, process PM2 `itiban-website`, vhost Nginx `www.<domaine>` (HTTPS Let's Encrypt). L'admin reste sur son domaine actuel (à confirmer : `admin.<domaine>` ?).
- Docker : ajout d'un service `website` dans `GES-CARS-2026/docker-compose.yml` pour la recette locale.
- Workflow GitHub `deploy.yml` pour le nouveau repo **seulement après validation**, sur le même modèle que l'admin.
- Variables : `API_INTERNAL_URL`, `WEBSITE_API_KEY`, `REVALIDATE_SECRET`, `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GA_ID`.
- Médias : servis par l'API (`storage`). Le domaine est autorisé dans `next.config` (`images.remotePatterns`). Un CDN est envisageable plus tard.

---

## 11. Plan de réalisation par lots

| Lot | Contenu | Livrable vérifiable |
|---|---|---|
| **0. Préparation** | Traiter les 21 fichiers non commités du backend, créer les branches, initialiser `car-rental-website` | Branches prêtes, app « hello » qui tourne en local |
| **1. Backend : modèle de données** | Migrations § 7.2, modèles, seeders de démo (véhicules publiés, agences avec GPS, photos) | `migrate` OK, l'admin actuel fonctionne toujours |
| **2. Backend : API publique** | Endpoints § 7.3, disponibilité par dates, devis, Turnstile, `X-Client-Ip` sécurisé, références atomiques | Tests Feature (recherche, disponibilité, création de demande, anti-abus) |
| **3. Backend : workflow admin** | Endpoints § 7.4, conversion via `ReservationService`, journal, notifications et e-mails, expiration planifiée, permissions | Tests Feature conversion (conflit refusé, numérotation correcte) |
| **4. Back-office** | § 8 : catalogue + photos, agences web, demandes, paramètres | Parcours complet d'un gestionnaire en local |
| **5. Site : maquette** | 2 directions visuelles pour la page d'accueil | **Validation du design par vous** |
| **6. Site : pages** | § 5.2 complet, i18n FR/AR/EN, SEO, responsive | Lighthouse ≥ 90, recette mobile |
| **7. Recette & mise en ligne** | Stack Docker complète, recette bout en bout, fusion backend → admin, déploiement du site | Mise en production avec votre accord |
| *8. Plus tard* | Paiement en ligne, SMS/WhatsApp API, avis clients, espace client | — |

---

## 12. Décisions validées (2026-10-26)

| # | Sujet | Décision |
|---|---|---|
| 1 | Granularité | **Réservation par véhicule** (§ 7.1) |
| 2 | Marque | **Itiban** (Itiban Rent Car) : nom, logo et couleurs de la marque |
| 3 | Langues | **FR + AR (RTL) + EN** dès le départ |
| 4 | Prix | « **X MAD / jour** », prix affiché modifiable depuis l'admin (`website_price_override`) |
| 5 | Aller simple | Autorisé sur demande du client, avec la mention « des frais supplémentaires peuvent s'appliquer » |
| 6 | Livraison | Oui, avec la mention « des frais de livraison peuvent s'appliquer » |
| 7 | Extras | Oui, configurables dans l'admin (§ 7.2 `website_extras`) |
| 8 | Conditions | Configurables dans l'admin : globales + surcharge par véhicule |
| 9 | Notifications | Utilisateurs de l'agence de départ (au départ) |
| 10 | Délai de réponse | « **Sous 2 h ouvrées** » |
| 11 | Carte | **OpenStreetMap** (Leaflet) |
| 12 | Hébergement | Même serveur que l'admin |
| 13 | Références visuelles | Aucune fournie : analyse de sites professionnels du secteur avant la maquette (lot 5) |
| 14 | Fichiers non commités du backend | Retirés de `main` (stash `backup-docker-securite-2026-10-01`) |
| — | CI | **Aucun déclenchement de CI ni de déploiement** pendant le développement du module (§ 4) |

---

## 13. Risques et parades

| Risque | Parade |
|---|---|
| Spam / fausses demandes | Turnstile + honeypot + throttle par IP réelle + validation du téléphone |
| Le site affiche « disponible » à tort | Le site parle de **demande** (pas de réservation ferme). Disponibilité calculée sur les dates. Contrôle final à la conversion |
| Casser l'admin en production | Migrations additives, branches, recette Docker, fusion uniquement après accord |
| Photos lourdes et site lent | Conversions WebP, `next/image`, taille minimale/maximale à l'upload |
| Données sensibles exposées | Ressources publiques en liste blanche, slugs au lieu d'UUID, aucune donnée fiscale ou bancaire |
| Conformité CNDP (loi 09-08) | Consentement explicite, page confidentialité, durée de conservation des demandes refusées ou expirées (purge planifiée) |
