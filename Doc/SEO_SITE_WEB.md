# SEO du site Itiban Rent Car — plan d'action

Objectif : apparaître en tête sur « location voiture Tanger », « location voiture aéroport Tanger », « كراء السيارات طنجة », « car rental Tangier »… et dans le **pack Google Maps** (les 3 agences affichées sur la carte), qui reçoit la majorité des clics pour une recherche locale.

Le code fait sa part (§ 1). Le classement local dépend surtout de ce qui se passe **hors du site** (§ 2 à 5) : c'est à faire par l'équipe.

## 1. Ce qui est en place dans le code (`car-rental-website`)

| Élément | Détail |
|---|---|
| Pages par ville | `/fr/location-voiture/tanger` (et `/ar`, `/en`) : générées automatiquement pour chaque ville où une agence est en ligne. Voitures de la ville, prix minimum, points de livraison, agences, carte, FAQ. |
| Titres orientés recherche | Accueil « Location de voiture au Maroc dès X MAD/jour », fiche « Location Fiat 500 2022 à Tanger dès X MAD/jour », agence « Location de voiture à Tanger · nom ». Arabe en « كراء السيارات », anglais avec « car hire ». Noms de villes traduits (طنجة, Tangier). |
| URL canoniques + hreflang | Chaque page déclare son URL et ses versions FR/AR/EN (+ x-default FR). Corrige un bug : toutes les pages pointaient vers l'accueil. |
| Catalogue filtré | Les recherches avec filtres ou dates sont en `noindex, follow` (évite des milliers de doublons). |
| Données structurées | Organization + WebSite (site), AutoRental avec horaires et coordonnées GPS (agences), Product/Car avec prix par jour (voitures), BreadcrumbList, FAQPage. |
| Sitemap | `/sitemap.xml` : toutes les pages dans les 3 langues, villes, voitures (toutes les pages de l'API), agences. |
| Aperçus de partage | Image 1200×630 générée (`/og.png?l=fr`) ou photo de la voiture/agence ; favicon et icône iPhone à la marque. |
| Accueil | Le h1 est « Location de voitures au Maroc » ; liens « Location voiture {ville} » sur l'accueil et dans le pied de page. |
| Vérification | Variables `GOOGLE_SITE_VERIFICATION` et `BING_SITE_VERIFICATION` (balises meta). |

À la mise en ligne : définir `NEXT_PUBLIC_SITE_URL` sur le vrai domaine (https), sinon canoniques et sitemap pointent vers localhost.

## 2. Google Business Profile (priorité n° 1)

Une fiche par agence physique, sur https://business.google.com :
- **Catégorie principale** « Agence de location de voitures » ; secondaires si vrai (« Location de véhicules utilitaires »…).
- Nom = nom réel de l'enseigne (ne pas ajouter de mots-clés au nom : Google suspend les fiches).
- Adresse, téléphone et horaires **identiques** au site (même écriture partout : c'est le « NAP »).
- Lien du site = la page de l'agence (`/fr/agences/{slug}`), pas l'accueil.
- Zone desservie : ville + aéroport si livraison.
- 10 photos minimum (façade, comptoir, voitures réelles), puis 2 à 4 nouvelles par mois.
- Services et attributs : livraison aéroport, paiement, langues parlées.
- Publications hebdomadaires (offres de saison, nouvelles voitures).
- Répondre à **chaque** avis, en moins de 48 h, dans la langue du client.
- Renseigner aussi le lien WhatsApp et le lien de réservation (page ville).

## 3. Avis clients (vrais uniquement)

Le nombre, la note et la fréquence des avis Google sont un des premiers facteurs du pack Maps.
- Au retour des clés : QR code au comptoir + message WhatsApp avec le lien direct « laisser un avis » de la fiche.
- Objectif réaliste : 5 à 10 avis par mois et par agence.
- **Jamais** d'avis achetés, inventés ou rédigés par l'équipe, ni de note affichée sur le site sans vrais avis derrière : Google le détecte, supprime les avis et peut pénaliser la fiche. Le site n'affiche donc aucune note pour l'instant.

## 4. Search Console et Bing

1. Google Search Console : ajouter la propriété « domaine », ou la propriété URL avec `GOOGLE_SITE_VERIFICATION`.
2. Envoyer `https://<domaine>/sitemap.xml`.
3. Inspecter et demander l'indexation de l'accueil et des pages ville.
4. Suivre chaque semaine : requêtes, pages, couverture, Core Web Vitals mobile.
5. Même chose sur Bing Webmaster Tools (importer depuis Search Console).

## 5. Notoriété et liens

- Annuaires marocains et touristiques avec le **même NAP** : Pages Jaunes Maroc (telecontact.ma), Kerix, Tripadvisor, offices de tourisme, guides de voyage.
- Partenariats avec hôtels et riads de la ville : lien vers la page ville en échange d'une offre.
- Réseaux sociaux (Facebook, Instagram, TikTok) : à renseigner dans l'admin pour qu'ils apparaissent dans les données Organization.
- Nom de domaine : un `.ma` (ou `.com` + hébergement rapide) ; HTTPS obligatoire.

## 6. Contenu (à faire ensuite)

- Remplir dans l'admin la description de chaque voiture et de chaque agence (texte unique, pas copié d'un concurrent).
- Photos réelles des voitures (les fiches sans photo ressortent moins bien).
- Guides utiles, 1 à 2 par mois : « Louer une voiture à l'aéroport de Tanger », « Conduire au Maroc : règles et péages », « Road trip Tanger – Chefchaouen ». Une section blog peut être ajoutée au site sur demande.
- Ajouter une ville au site = ajouter une agence (ou un point de livraison) dans cette ville : la page se crée seule. Ne pas créer de pages pour des villes non desservies (contenu « porte d'entrée » pénalisé).

## 7. À vérifier à la mise en ligne

- `pnpm build` puis Lighthouse mobile ≥ 90 en performance et SEO.
- Test des résultats enrichis : https://search.google.com/test/rich-results sur une page ville, une voiture et une agence.
- Partage d'un lien dans WhatsApp : image et titre corrects.
- Pas de 404 dans Search Console après 2 semaines.
