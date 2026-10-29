# Contexte de reprise — Module « Site web public » (GES-CARS 2026 / Itiban)

> Fichier de passation pour reprendre le travail dans une nouvelle conversation.
> Proposition validée : `Doc/PROPOSITION_SITE_WEB.md` (le § 12 liste les décisions). Mis à jour le 2026-10-29.

## 1. Règles impératives
- **Ne jamais pousser sur `main`** : un push sur `main` déploie en production (front et back). On travaille uniquement sur les branches `feature/site-web` et on ne pousse rien sans accord explicite.
- **Aucune CI pendant le module** : ne pas ajouter de `.github/workflows` au repo `car-rental-website`.
- **Commits sans aucune mention de Claude ou de l'IA** : pas de `Co-Authored-By`, pas de « Generated with ».
- Ne jamais commiter `car-rental-api/.env.docker` (fichier de secrets non suivi par git).
- Stash `backup-docker-securite-2026-10-01` dans l'API : il contient l'ancienne stack Docker et la couche sécurité. Ne pas le supprimer sans demander.
- Réponses en français, concises.

## 2. Projets et environnement
| Projet | Chemin | Branche |
|---|---|---|
| API Laravel 13 | `C:\laragon\www\GES-CARS-2026\car-rental-api` | `feature/site-web` |
| Admin Next.js 15 | `C:\laragon\www\car-rental-client` | `feature/site-web` |
| Site public Next.js 15.5.28 | `C:\laragon\www\GES-CARS-2026\car-rental-website` | `develop` (projet Next vierge, scaffold seulement) |

- PHP : `C:/laragon/bin/php/php-8.4/php.exe`. Le PHP du PATH est en 8.2 et ne suffit pas.
- MySQL : `C:/laragon/bin/mysql/mysql-8.0.30-winx64/bin`. S'il est arrêté : `mysqld.exe --defaults-file=C:/laragon/bin/mysql/mysql-8.0.30-winx64/my.ini` en arrière-plan (environ 80 s avant d'être prêt). Machine à mémoire limitée.
- Base de test réaliste : `ges_site_web_test`, une copie de la sauvegarde prod, déjà migrée et seedée avec `WebsiteDemoSeeder`. Pour l'utiliser : `export DB_DATABASE=ges_site_web_test` avant artisan. Ne pas toucher la base `ges-cars-prod-backup-08-09-2026`.
- Tests : `php artisan test` (base `ges_car_rental_2026_testing`). Référence : **21 échecs anciens (hors module) / 383 réussites**, dont 40 tests dans `tests/Feature/Website`.
- Pièges :
  - le heredoc de Git Bash réduit `\\` en `\` : préférer l'outil Edit pour le PHP contenant des namespaces ;
  - curl avec des `[]` dans l'URL : utiliser `-g`.

## 3. Décisions validées
- Réservation **par véhicule** (pas de « modèles »).
- Marque **Itiban**, langues **FR / AR (RTL) / EN**.
- Prix affiché « X MAD / jour » = `website_price_override` s'il est > 0, sinon `daily_rate`. Toujours passer par `Vehicle::website_price` : en prod, l'override vaut `0.00` au lieu de NULL.
- Aller simple et livraison autorisés, avec la seule mention « des frais peuvent s'appliquer » (pas de montant affiché).
- Extras et conditions de location configurables dans l'admin : conditions globales, avec surcharge possible par véhicule.
- Notifications envoyées aux utilisateurs de l'agence de départ (repli sur les admins si personne n'a la permission). Délai de réponse affiché : « sous 2 h ouvrées ».
- Carte OpenStreetMap (Leaflet). Hébergement sur le même serveur que l'admin.
- Paiement en ligne prévu plus tard : le statut `awaiting_payment` et les champs `payment_status` / `amount_due_online` existent déjà.

## 4. Backend terminé (commits sur `feature/site-web`)
- `103db82` **Lot 1, modèle de données** :
  - agences : slug, GPS, horaires, services, WhatsApp, description en JSON {fr,ar,en}, collection `photos` ;
  - véhicules : `website_slug`, titre et descriptions JSON, portes, bagages, `features`, `website_featured`, `website_sort_order`, conditions spécifiques ;
  - tables `agency_pickup_points`, `website_extras`, `web_reservation_events` ;
  - `web_reservations` étendue, statut : new → contacted → converted | rejected | cancelled | expired (+ awaiting_payment) ;
  - paramètres `rental_conditions` et mentions du site ;
  - permissions `view-website-requests`, `handle-website-requests`, `manage-website-catalog`, `manage-website-content`.
- `ba85367` **Lot 2, API publique** `/api/v1/public` :
  - `site`, `vehicles` (filtres + `pickup_at`/`return_at`, `available_only`, `sort`), `vehicles/{slug}`, `vehicles/{slug}/quote`, `agencies`, `agencies/{slug}`, `extras` ;
  - `POST reservation-requests`, `GET/POST reservation-requests/{token}[/cancel]` ;
  - langue via `?locale=` ;
  - erreurs métier renvoyées en codes stables : `vehicle_unavailable`, `pickup_too_soon`, `rental_too_short`, `rental_too_long`, `driver_too_young`, `pickup_point_invalid`, `bot_detected`, `consent_required`, `booking_disabled`, `request_not_cancellable` ;
  - le serveur du site doit envoyer `X-Website-Key` + `X-Client-Ip` ;
  - Turnstile obligatoire en production, plus un champ honeypot `website` ;
  - limites : 3 demandes/min et 20/jour par IP ;
  - service partagé `VehicleAvailabilityService`.
- `41b55c3` **Lot 3, workflow admin et catalogue** `/api/v1/website` :
  - `requests` (liste filtrée par agence via `WebsiteAccess`), `requests/stats` (open, today, late_first_contact, conversion_rate, avg_first_contact_minutes) ;
  - `requests/{id}` (avec `events` et `conversion_defaults`), `requests/{id}/assign`, `requests/{id}/events` (type call|whatsapp|email|note : le premier contact passe la demande en `contacted`) ;
  - `requests/{id}/availability?vehicle_id=` (avec alternatives), `requests/{id}/client-matches` ;
  - `requests/{id}/convert` : mêmes champs que POST /reservations, **`client_id` obligatoire**, les autres champs sont repris de la demande. Exige aussi la permission `create-reservation` ;
  - `requests/{id}/reject` : `rejection_code` parmi vehicle_unavailable|incomplete_file|client_unreachable|client_declined|duplicate|other, plus `reason` et `notify_client` ;
  - catalogue : `vehicles` (liste et fiche avec `checklist {complete, score, missing[]}`), `PATCH vehicles/{id}`, `vehicles/{id}/publish|unpublish`, `vehicles/{id}/copy-from/{sourceId}` ;
  - agences : `agencies`, `PATCH agencies/{id}`, `agencies/{id}/publish|unpublish`, `agencies/{id}/pickup-points[/{pointId}]` ;
  - photos : `{vehicles|agencies}/{id}/photos` (POST multipart `photos[]`, largeur ≥ 1200 px), `photos/order` (PUT `media_ids`), `photos/{mediaId}` (PATCH alt/is_cover, DELETE) ;
  - réglages : `content` (GET/PUT, textes {fr,ar,en}), `conditions` (GET/PUT), `extras` (CRUD) ;
  - un refus de publication renvoie un 422 avec les codes manquants dans `errors.checklist` (photos, cover, price, doors, luggage, title_ar, short_description_en, coordinates, opening_hours, description_fr…) ;
  - e-mails au client (reçue, acceptée, refusée) en fr/ar/en, commande `website:expire-requests` toutes les heures, job `RevalidateWebsite` (POST `{WEBSITE_URL}/api/revalidate` avec l'en-tête `X-Revalidate-Secret`) ;
  - `VehicleService` **ignore désormais `show_on_website`** : la publication passe uniquement par `/publish` ;
  - l'ancien `WebsiteController` et l'ancien `WebsiteService` sont supprimés : les anciennes routes `/website/reservations*` n'existent plus.
- Données de prod : 15 véhicules ont un `daily_rate` < 50 MAD (jusqu'à 0,10) ; la checklist bloque leur publication (`min_publish_price` = 50).
- E-mails envoyés de façon synchrone : vérifier qu'un worker de file tourne en prod avant de passer en différé.

## 5. Lot 4 — interface admin (EN COURS, rien d'écrit pour l'instant)
Repo `car-rental-client`, branche `feature/site-web` (le dernier commit `0ac403f` ne contient que la proposition).

Existant à **remplacer**, car il cible les anciennes routes :
- `src/services/website.service.ts`, `src/features/website/hooks/use-website.ts`, `src/types/website.types.ts` ;
- `apiRoutes.website` et `apiRoutes.public` dans `src/config/apiRoutes.ts` (vers la ligne 183) ;
- `src/app/(dashboard)/website/page.tsx` (placeholder « Coming soon ») ;
- les champs web de `src/features/vehicles/components/vehicle-form.tsx` (lignes ~53-55, 87, 115-117, 427-447 : switch `show_on_website`, description, prix) : les retirer et renvoyer vers le module Site web.

Conventions à suivre : regarder `src/features/claims` (components `*-view.tsx`, `*-form-view.tsx`, `*-detail-view.tsx`, hooks `use-claims.ts`), `src/app/(dashboard)/claims/{page,new,[id]}`, `CustomTable` et `useCustomTable` (pagination Laravel `meta`), `CustomAlertDialog`, `apiClient` dans `@/lib/api`, React Query, react-hook-form + zod, shadcn/ui, `@dnd-kit` (déjà installé), `src/components/layout/app-sidebar.tsx`, `src/config/route-permissions.ts`, `src/constants/data.ts`. Les réponses API ont la forme `{success, message, data, meta?}`.

À construire :
1. Types, service et hooks pour toutes les routes `/website/*` du § 4.
2. Menu « Site web » (permissions ci-dessus) : Tableau de bord · Demandes (badge des nouvelles) · Véhicules publiés · Agences · Options · Conditions · Contenu.
3. Demandes :
   - liste avec onglets par statut, recherche, indicateur « en retard (> 2 h) » ;
   - fiche : coordonnées avec boutons tel:, WhatsApp (`whatsapp_url`) et mailto:, timeline des `events`, formulaire d'échange, assignation, disponibilité et alternatives, clients correspondants ;
   - **Accepter** : choisir ou créer le client (formulaire client existant prérempli), puis le formulaire de réservation prérempli avec `conversion_defaults`, puis POST convert ;
   - **Refuser** : code, motif et case « prévenir le client ».
4. Fiche web d'un véhicule : textes FR/AR/EN (champ AR en `dir="rtl"`), équipements (codes `Vehicle::FEATURES` : gps, bluetooth, carplay, android_auto, usb, rear_camera, parking_sensors, cruise_control, heated_seats, sunroof, keyless, isofix, abs, airbags), portes, bagages, prix web, conditions, gestion des photos (drag & drop pour l'ordre, couverture, alt, upload multiple), checklist avec score, Publier / Dépublier, Copier depuis un autre véhicule, lien vers la page publique.
5. Fiche web d'une agence : description FR/AR/EN, carte Leaflet pour la position (à ajouter : `leaflet` + `react-leaflet`, versions récentes stables), éditeur d'horaires (monday…sunday, créneaux open/close HH:mm), services, WhatsApp, photos, points de livraison, checklist, Publier / Dépublier.
6. Écrans Options (CRUD), Conditions et Contenu (textes FR/AR/EN, interrupteurs `booking_enabled` / `show_prices`).
7. Vérifier `npx tsc --noEmit` et lancer l'admin pour tester sur la base `ges_site_web_test`.

## 6. Lots suivants
- **Lot 5** : analyser des sites pros de location (aucune référence fournie par l'utilisateur) et produire 2 maquettes de la page d'accueil à faire valider.
- **Lot 6** : site `car-rental-website` :
  - pages : accueil, `/voitures`, `/voitures/[slug]`, `/agences`, `/agences/[slug]`, tunnel `/reservation` en 3 étapes, `/reservation/confirmation/[reference]`, `/suivi/[token]`, à propos, contact, FAQ, pages légales (loi 09-08) ;
  - technique : next-intl fr/ar/en (RTL), Tailwind 4 + shadcn, Leaflet, Turnstile, SEO (sitemap, JSON-LD), route `/api/revalidate` ;
  - les appels se font côté serveur avec `X-Website-Key` + `X-Client-Ip`.
- **Lot 7** : recette (Docker local), fusion backend → admin → mise en ligne, uniquement avec l'accord de l'utilisateur.
