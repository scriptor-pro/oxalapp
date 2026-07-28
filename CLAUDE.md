# oxalapp

Application (web/mobile) permettant d'estimer la teneur en oxalate d'un
produit alimentaire (y compris produits transformés : biscuits, conserves,
plats préparés) à partir de son code-barres.

## Contexte / problème

Il n'existe pas de base de données grand public équivalente à Yuka pour
l'oxalate. Les bases de référence sérieuses (OHF, USDA/Harvard) couvrent
bien les aliments bruts, mais très peu les produits transformés du commerce,
car l'oxalate n'est pas un nutriment à étiquetage obligatoire. L'app doit
donc **estimer** un niveau d'oxalate à partir de la liste d'ingrédients d'un
produit, plutôt que retourner une valeur exacte garantie.

## Sources de données

- **OHF (Oxalosis & Hyperoxaluria Foundation)** — base de référence la plus
  citée par les cliniciens, gratuite, sans inscription :
  https://ohf.org/oxalate-food-content-database/
  - Consultable en ligne par catégorie (légumes, fruits, céréales, protéines,
    laitiers, matières grasses, boissons, sucreries, épices, **produits du
    commerce**, suppléments)
  - PDF téléchargeable avec la liste complète :
    `https://ohf.org/wp-content/uploads/2024/02/Oxalate-List-022724.pdf`
  - Site disponible en français
  - Pas d'API officielle. Deux options d'extraction :
    1. **Parser le PDF** (tableau structuré aliment / catégorie / portion /
       mg oxalate) avec `pdfplumber` ou `tabula-py` → JSON/SQLite local,
       réutilisable hors-ligne (extraction ponctuelle, pas de re-scraping).
    2. **Scraper les pages catégories HTML** (`/vegetables-oxalate/`,
       `/commercial-oxalate/`, etc.) — tableaux HTML plus simples à parser
       que le PDF.
  - ⚠️ Vérifier `robots.txt` et les CGU avant tout scraping automatisé
    récurrent (fondation à but non lucratif, pas pensée pour l'usage
    programmatique). Attribution correcte recommandée si redistribution des
    données. Une extraction ponctuelle → conversion en base locale → usage
    hors-ligne a un impact serveur minime.
  - Limite : base américaine, couverture des marques belges/européennes
    restera limitée.

- **Open Food Facts** (`world.openfoodfacts.org/api`) — API publique et
  gratuite, bonne couverture des produits belges/français. Ne donne pas
  l'oxalate directement, mais retourne la **liste d'ingrédients** d'un
  produit à partir de son code-barres (EAN).

## Architecture envisagée

1. **Scan caméra du code-barres** → EAN
   - Options : Barcode Detection API native du navigateur (Chrome/Edge/
     Android seulement, pas Safari/Firefox), ou bibliothèque JS cross-browser
     type **ZXing-js** (activement maintenue, recommandée) ou QuaggaJS
     (fonctionnelle mais plus datée). ZXing-js/QuaggaJS fonctionnent partout,
     y compris Safari/iOS.
2. **Requête Open Food Facts** avec l'EAN → ingrédients + infos produit
3. **Matching texte** de la liste d'ingrédients contre la base OHF locale
   (ingrédients à risque connus : cacao, épinards, amandes, son de blé,
   etc.) → estimation du niveau : faible / modéré / élevé / très élevé
4. **Affichage du résultat** à l'utilisateur

Point de vigilance : les valeurs d'oxalate varient selon la variété, le sol,
la cuisson, etc. — le résultat reste indicatif, pas une valeur garantie pour
un produit précis.

## Stack

Cohérente avec les autres projets de l'auteur : React/TSX + Node.js.
PocketBaud (PocketBase) pourrait servir de backend/stockage si besoin d'un
hébergement léger cohérent avec l'existant.

## Document connexe

Un premier classement statique des aliments par teneur en oxalate (listes
ascendante/descendante, format markdown, ~32 aliments avec valeurs
approximatives en mg/100g) a déjà été généré dans une conversation
antérieure ("Aliments classés par teneur en oxalate") et peut servir de
point de départ pour la base locale ou de fallback hors-ligne.

## Origine

Conversation Claude.ai renommée "oxalapp" par l'utilisateur pour retrouver
facilement ce fil de réflexion avant de reprendre le développement avec
Claude Code (`claude` puis `claude -c` pour reprendre la session).
