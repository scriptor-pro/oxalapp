// @vitest-environment node
// Mesure à la demande du taux de « non déterminable » sur les produits
// belges les plus scannés d'Open Food Facts. Désactivé par défaut :
//   OXA_AUDIT=1 npx vitest run scripts/audit-non-determinable.test.ts --reporter=default
// (--reporter=default : hors terminal interactif, Vitest 4 choisit un
// rapporteur minimal qui masque les console.log des tests réussis.)
// L'échantillon est mis en cache dans .cache/ (ignoré par git) pour que
// les mesures avant/après portent sur les mêmes produits. Le premier
// lancement enregistre aussi les niveaux de référence ; les suivants
// affichent chaque produit dont le niveau a changé.
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  matchIngredients,
  matchStructuredIngredients,
  type MatchResult,
} from "../src/lib/oxalate-matcher";

const CACHE_DIR = fileURLToPath(new URL("../.cache/", import.meta.url));
const SAMPLE_PATH = `${CACHE_DIR}off-audit-sample.json`;
const BASELINE_PATH = `${CACHE_DIR}off-audit-baseline.json`;
const PAGES = 2;
const PAGE_SIZE = 100;
const USER_AGENT = "oxalapp/0.2.1 (+https://github.com/scriptor-pro/oxalapp)";

interface OffSearchIngredient {
  id?: string;
  text?: string;
  percent_estimate?: number;
  percent?: number;
}

interface OffSearchProduct {
  code: string;
  product_name?: string;
  ingredients_text?: string;
  ingredients?: OffSearchIngredient[];
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// L'API de recherche OFF est limitée à 10 requêtes par minute et renvoie
// régulièrement une page HTML 503 de maintenance : on réessaie en
// espaçant de plus en plus.
async function fetchPage(page: number): Promise<OffSearchProduct[]> {
  const url =
    "https://world.openfoodfacts.org/api/v2/search" +
    `?countries_tags_en=belgium&sort_by=unique_scans_n&page_size=${PAGE_SIZE}&page=${page}` +
    "&fields=code,product_name,lang,ingredients_text,ingredients";
  for (let attempt = 1; attempt <= 6; attempt++) {
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (response.ok) {
      try {
        const data = (await response.json()) as { products: OffSearchProduct[] };
        return data.products;
      } catch {
        // Page HTML au lieu de JSON : on réessaie.
      }
    }
    await sleep(15_000 * attempt);
  }
  throw new Error(`Open Food Facts indisponible pour la page ${page}`);
}

async function loadSample(): Promise<OffSearchProduct[]> {
  if (fs.existsSync(SAMPLE_PATH)) {
    return JSON.parse(fs.readFileSync(SAMPLE_PATH, "utf8")) as OffSearchProduct[];
  }
  const products: OffSearchProduct[] = [];
  for (let page = 1; page <= PAGES; page++) {
    if (page > 1) await sleep(10_000);
    products.push(...(await fetchPage(page)));
  }
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(SAMPLE_PATH, JSON.stringify(products));
  return products;
}

// Même choix que ResultView : ingrédients structurés s'il y en a, texte
// brut sinon.
function matchProduct(product: OffSearchProduct): MatchResult {
  const structured = (product.ingredients ?? []).map((ingredient) => ({
    text: ingredient.text ?? "",
    percentEstimate: ingredient.percent_estimate ?? null,
    percentDeclared: ingredient.percent ?? null,
    offId: ingredient.id ?? null,
  }));
  return structured.length > 0
    ? matchStructuredIngredients(structured)
    : matchIngredients(product.ingredients_text ?? "");
}

describe.runIf(process.env.OXA_AUDIT === "1")("audit « non déterminable »", () => {
  it("mesure le taux sur l'échantillon et compare à la référence", async () => {
    const products = await loadSample();
    const results = new Map(products.map((p) => [p.code, matchProduct(p)]));

    const counts: Record<string, number> = {};
    for (const result of results.values()) {
      counts[result.level] = (counts[result.level] ?? 0) + 1;
    }
    const undetermined = counts["non déterminable"] ?? 0;
    console.log(
      `Non déterminable : ${undetermined}/${products.length} ` +
        `(${Math.round((100 * undetermined) / products.length)} %)`
    );
    console.log("Répartition :", counts);

    const levels = Object.fromEntries(
      [...results].map(([code, result]) => [code, result.level])
    );
    if (!fs.existsSync(BASELINE_PATH)) {
      fs.writeFileSync(BASELINE_PATH, JSON.stringify(levels, null, 2));
      console.log(`Référence enregistrée dans ${BASELINE_PATH}`);
    } else {
      const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8")) as Record<string, string>;
      const changes = products
        .filter((p) => baseline[p.code] !== undefined && baseline[p.code] !== levels[p.code])
        .map((p) => `  ${baseline[p.code]} → ${levels[p.code]} | ${p.product_name ?? "?"} (${p.code})`)
        .sort();
      console.log(`Produits dont le niveau change (${changes.length}) :\n${changes.join("\n")}`);
    }

    // Ce qui bloque encore : inconnus significatifs des produits non
    // déterminables, par fréquence. Sert à choisir le prochain chantier.
    const unknownCounts = new Map<string, number>();
    for (const result of results.values()) {
      if (result.level !== "non déterminable") continue;
      for (const unknown of result.unknownIngredients) {
        const key = unknown.offId ?? `texte : ${unknown.text}`;
        unknownCounts.set(key, (unknownCounts.get(key) ?? 0) + 1);
      }
    }
    const topUnknowns = [...unknownCounts]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25)
      .map(([key, count]) => `  ${key} : ${count}`);
    console.log(`Inconnus les plus fréquents :\n${topUnknowns.join("\n")}`);

    expect(products.length).toBeGreaterThan(0);
  }, 600_000);
});
