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

## 5. Lot 4 — interface admin (TERMINÉ le 2026-10-30)
Le lot est commité sur `feature/site-web` dans `car-rental-client`, avec un correctif de la règle de modification d'une fiche publiée dans `car-rental-api`.
- Fichiers :
  - `src/types/website.types.ts` et `src/services/website.service.ts` ;
  - `src/features/website/{hooks/use-website.ts, constants.ts, utils.ts, components/*}` ;
  - les pages `src/app/(dashboard)/website/**`.
- Menu « Site web » : sous-menus filtrés par permission et badge des nouvelles demandes. Les routes sont protégées dans `route-permissions.ts`.
- Parcours « Accepter » : il réutilise les formulaires existants.
  - `ClientForm` reçoit les props `prefill`, `onCreated` et `backHref`.
  - `ReservationFormView` reçoit la prop `webRequest` : l'envoi passe par `/convert` et le prix web est conservé.
- Les champs web ont été retirés du formulaire véhicule. L'onglet « Site web » de la fiche véhicule renvoie vers la fiche web.
- Leaflet 1.9.4 et react-leaflet 5.0.0 sont installés avec npm (le déploiement utilise `npm ci`).
- API : une fiche publiée peut désormais être modifiée tant que la modification n'ajoute pas de point manquant (`assertNothingRemoved`). Avant, une fiche publiée déjà incomplète (agences de démo sans photo) ne pouvait plus être corrigée. Un test couvre ce cas ; 41 tests du site passent.
- Recette dans le navigateur sur `ges_site_web_test`, tout est OK :
  - tableau de bord ;
  - liste et fiche d'une demande ; ajout d'un échange (la demande passe en « Contactée ») ;
  - Accepter avec création du client : WEB-2026-0002 → RES-000263 (700,28 MAD) ;
  - Refuser avec « autre motif » et e-mail : WEB-2026-0003 ;
  - liste et fiche web des véhicules ;
  - fiche agence : carte, enregistrement, envoi de 2 photos, changement de couverture, réordonnancement ;
  - pages Options (modification), Conditions (enregistrement) et Contenu.
- Corrections faites pendant la recette :
  - Select Radix vidé au montage dans un formulaire : les valeurs vides sont ignorées ;
  - fiches véhicule et agence : utilisation de `useForm({ values, resetOptions: { keepDirtyValues: true } })`, sinon plantage au premier rendu et perte des modifications non enregistrées lors d'un rafraîchissement ;
  - la molette ne zoome plus la carte ;
  - libellés des notifications dans l'historique.
- Non testés dans le navigateur : texte alternatif et suppression d'une photo, points de livraison, copie de fiche. Le glisser-déposer des photos au clavier n'a pas réagi au test automatisé ; à la souris, il fonctionne.
- Pièges d'environnement :
  - une session NextAuth expirée laisse les pages en chargement infini : il faut se reconnecter ;
  - un `next dev` orphelin peut garder le port 3000 ;
  - deux serveurs sur le même `.next` font geler le navigateur.
- Points relevés hors module, non corrigés :
  - le pied de `CustomTable` affiche le nombre de lignes de la page au lieu de `meta.total` ;
  - les heures s'affichent avec 1 h de décalage dans le navigateur (le même décalage existe sur les réservations) ;
  - le fil d'Ariane affiche les segments d'URL en anglais ;
  - avant l'hydratation, le formulaire de connexion s'envoie en GET avec le mot de passe dans l'URL (vu dans le log : `/sign-in?email=…&password=…`).

## 5 bis. Recette du 2026-10-30 (après-midi)
- Admin, commit `1983a2b` :
  - fiches web : le formulaire n'est rempli qu'une fois, donc l'envoi d'une photo n'efface plus les saisies non enregistrées ;
  - les boutons Publier / Retirer ne soumettent plus le formulaire ;
  - le client est présélectionné quand une seule correspondance existe ;
  - middleware : une session dont le jeton n'a pas pu être rafraîchi est traitée comme déconnectée (avant, la page restait en chargement infini) ;
  - le formulaire de connexion est en POST (avant, le mot de passe pouvait apparaître dans l'URL).
- Admin, commit `320dfe0`, et API, commit `f81afa8` : un texte traduisible vide était enregistré `[]` et faisait planter `GET /public/extras` (erreur 500).
- **Problème hors module, à traiter côté serveur** : le Maroc est revenu à GMT le 20/09/2026 (décret 2.26.530). La base de fuseaux de PHP (2025.2) applique encore GMT+1, donc toutes les heures enregistrées par l'API s'affichent avec 1 h de décalage. Il faut mettre à jour la base de fuseaux de PHP (version de PHP plus récente ou extension `timezonedb`) en local et en production.

## 6. Lot 6 — site public (FAIT le 2026-10-30, commit `170a101` sur `car-rental-website/develop`)
Le lot 5 (maquettes) a été sauté à la demande de l'utilisateur : le site a été développé directement.
- Toutes les pages du § 5.2 de la proposition existent, en FR/AR/EN ; le README du repo les décrit.
- Recette faite dans le navigateur :
  - accueil, catalogue avec dates (indisponibilité correcte), fiche véhicule avec estimation en direct ;
  - tunnel complet, dont l'erreur `driver_too_young` traduite, puis WEB-2026-0005 envoyée, suivie et annulée ;
  - version arabe en RTL.
- Reste à faire :
  - vérifier le rendu sur un vrai téléphone ;
  - remplacer le logo provisoire (`src/components/ui/logo.tsx`) et les couleurs si la charte change ;
  - renseigner dans l'admin le contenu du site (coordonnées, réseaux, textes) ;
  - configurer `WEBSITE_API_KEY`, Turnstile et `REVALIDATE_SECRET` ;
  - tester le build de production (`pnpm build`).
- Lancement : `pnpm dev --port 3001` (l'admin utilise le port 3000).

## 7. Lots suivants
- **Lot 5** : analyser des sites pros de location (aucune référence fournie par l'utilisateur) et produire 2 maquettes de la page d'accueil à faire valider.
- **Lot 6** : site `car-rental-website` :
  - pages : accueil, `/voitures`, `/voitures/[slug]`, `/agences`, `/agences/[slug]`, tunnel `/reservation` en 3 étapes, `/reservation/confirmation/[reference]`, `/suivi/[token]`, à propos, contact, FAQ, pages légales (loi 09-08) ;
  - technique : next-intl fr/ar/en (RTL), Tailwind 4 + shadcn, Leaflet, Turnstile, SEO (sitemap, JSON-LD), route `/api/revalidate` ;
  - les appels se font côté serveur avec `X-Website-Key` + `X-Client-Ip`.
- **Lot 7** : recette (Docker local), fusion backend → admin → mise en ligne, uniquement avec l'accord de l'utilisateur.
