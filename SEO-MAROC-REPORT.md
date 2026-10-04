# HAMZA KING — SEO Maroc : stratégie et sprint 1

_4 octobre 2026_

## 1. Le marché (ce qu'on a observé)

- Google = ~95 % des recherches au Maroc (StatCounter, sept. 2026). Le français domine les requêtes produits ; l'arabe/darija n'est couvert que par Avito, Jumia, OpenSooq.
- Les requêtes « [modèle] maroc » / « [modèle] prix maroc » (Air Force 1, Jordan 4, Dunk, Samba, 530, 9060, Kayano 14, Hoka, On…) sont gagnées par **Avito** (pages auto « /sp/ »), **Jumia** (pages « mlp/slp ») et quelques boutiques indépendantes avec **une page par modèle** (titre « Modèle Maroc », texte, FAQ). Plusieurs de ces boutiques vendent ouvertement des copies.
- Aucune boutique en tête n'affiche d'avis/étoiles. Les requêtes « livraison gratuite / paiement à la livraison » sont gagnées par des pages faibles. Les requêtes « sneakers + ville » sont laissées aux réseaux sociaux et à Google Maps.
- Semrush (volumes) indisponible : plus d'unités API sur le compte. Priorités établies sur les SERP observées.

**Stratégie :** une page forte par modèle et par intention, données produit complètes pour Google (prix MAD, livraison gratuite, échange gratuit), confiance (avis vérifiés, suivi, COD), maillage interne, et zéro page vide ou dupliquée dans l'index.

## 2. Ce qui est en place (sprint 1)

### Technique
- URL du site pilotée par `PUBLIC_SITE_URL` (ou l'origine) — plus de domaine `hamzaking.ma` codé en dur.
- Sitemap propre `/sitemap.xml` : pages statiques, livraison + 11 villes, collections **non vides**, produits + images, articles. Supprimé : les fausses versions `/en-us/`, `/en-ca/`, `/fr-ca/` et les collections vides.
- robots.txt : filtres/tri/pagination/recherche/suivi bloqués ; sur tout domaine autre que le domaine canonique → `Disallow: /` (le *.myshopify.dev ne fera pas doublon).
- Canonical + Open Graph + Twitter sur toutes les routes ; `noindex, follow` sur les URLs filtrées/triées/paginées, recherche, panier, compte, suivi, collections vides.
- Titres « mot-clé d'abord, marque à la fin » ; `lang="fr-MA"`.

### Données structurées
- `OnlineStore` (+ politique d'échange) et `WebSite` + recherche sur l'accueil.
- Produits : `ProductGroup` avec chaque couleur/pointure en `Product` + `Offer` (prix MAD, disponibilité, état neuf, **livraison gratuite MA 1–3 j**, **échange gratuit 7 j**), `AggregateRating` uniquement avec de vrais avis.
- Collections : `CollectionPage` + `ItemList` + `BreadcrumbList` ; `FAQPage` là où une FAQ est visible (modèles, FAQ, livraison, villes).

### Contenu
- **24 pages modèles** (collections intelligentes, remplies automatiquement par le titre produit ou le tag `modele-<handle>`) : Air Force 1, Dunk Low, Air Max Plus TN, Air Max 90, Vomero, Pegasus, Air Jordan 1, Air Jordan 4, Samba, Gazelle, Campus, NB 530/9060/550/2002R, Gel-Kayano 14, Gel-1130, Gel-Nimbus, On Cloud, Hoka Clifton/Bondi, Converse Chuck Taylor, Vans Old Skool, Puma Speedcat. Chacune : intro, 400–470 mots uniques, 4–5 FAQ, titre/description SEO. Masquées et `noindex` tant qu'elles sont vides.
- 38 collections existantes : description + titre/description SEO.
- `/livraison` (COD, délais, échange, FAQ) + 11 pages ville (Casablanca, Rabat, Marrakech, Tanger, Agadir, Fès, Meknès, Oujda, Kénitra, Tétouan, El Jadida) avec quartiers réels et délais réels.
- Blog **Journal** créé (le lien du menu était en 404) + 4 guides : paiement à la livraison, running au Maroc, taille par modèle, entretien poussière/chaleur.
- Maillage : menu « Icônes » → pages modèles ; pages marque → leurs modèles ; fil d'Ariane produit → marque → modèle.

### Règles respectées
Aucune mention d'authenticité, aucun avis/prix/stat inventé, « N°1 » jamais affiché.

## 3. À faire par le propriétaire (bloquant)

1. **Domaine** → l'attacher à la vitrine Hydrogen, puis définir `PUBLIC_SITE_URL=https://<domaine>` dans les variables d'environnement Hydrogen.
2. **Google Search Console** (après le domaine) → vérifier avec la balise (`PUBLIC_GOOGLE_SITE_VERIFICATION`), soumettre `sitemap.xml`, demander l'indexation : accueil, `/livraison`, les pages modèles en stock, les 4 articles.
3. **Google Business Profile — Casablanca** : c'est le pack Maps pour « sneakers Casablanca ». Puis coller le lien d'avis dans `TRUST.googleReviewUrl` (`app/lib/config.ts`).
4. **Google Merchant Center** (app Google & YouTube) : fiches gratuites Shopping. Disponibilité au Maroc à confirmer en ajoutant le pays dans Merchant Center.
5. **Produits** : titre `Marque Modèle — Coloris` (ex. « Nike Air Force 1 '07 — Blanc ») pour qu'ils tombent automatiquement dans la bonne page modèle ; sinon ajouter le tag `modele-<handle>`.
6. **Avis réels** : envoyer le lien `/avis?commande=…` après chaque livraison.

## 4. Sprints suivants (par impact)

1. **Catalogue** : chaque modèle en stock = une page qui s'allume. Priorité aux modèles à forte demande (AF1, Dunk, Jordan 4, Samba, 530, 9060, TN).
2. **Arabe/darija** : pages d'atterrissage `/ar/` pour « سبرديلة », « حذاء رياضي »… — espace presque vide hors marketplaces.
3. **Calendrier saisonnier** : pages Aïd, rentrée, Black Friday en ligne 4–6 semaines avant.
4. **Mesure** : Search Console + GA4 → positions par modèle chaque semaine ; étoffer les pages qui montent (photos réelles, avis).
