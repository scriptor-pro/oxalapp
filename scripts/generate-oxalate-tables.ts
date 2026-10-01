// Génère src/data/low-oxalate-ingredients.json et
// src/data/risky-oxalate-ingredients.json à partir de la taxonomie des
// ingrédients d'Open Food Facts, de scripts/low-oxalate-roots.json et de
// scripts/risky-oxalate-roots.json. Usage : npm run generate:oxalate-tables
// Node 24 exécute ce fichier TypeScript directement (imports en .ts).
import { createHash } from "node:crypto";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { KNOWN_INGREDIENTS } from "../src/data/known-ingredients.ts";
import {
  computeLowOxalateIds,
  type RootsFile,
  type Taxonomy,
} from "./low-oxalate-generator.ts";
import { computeRiskyOxalateIds, type RiskyRootsFile } from "./risky-oxalate-generator.ts";

const TAXONOMY_URL = "https://static.openfoodfacts.org/data/taxonomies/ingredients.json";
const USER_AGENT = "oxalapp/0.2.0 (+https://github.com/scriptor-pro/oxalapp)";
const ROOTS_PATH = fileURLToPath(new URL("./low-oxalate-roots.json", import.meta.url));
const OUTPUT_PATH = fileURLToPath(new URL("../src/data/low-oxalate-ingredients.json", import.meta.url));
const RISKY_ROOTS_PATH = fileURLToPath(new URL("./risky-oxalate-roots.json", import.meta.url));
const RISKY_OUTPUT_PATH = fileURLToPath(new URL("../src/data/risky-oxalate-ingredients.json", import.meta.url));

const response = await fetch(TAXONOMY_URL, { headers: { "User-Agent": USER_AGENT } });
if (!response.ok) {
  throw new Error(`Téléchargement de la taxonomie impossible : HTTP ${response.status}`);
}
const rawTaxonomy = await response.text();
const taxonomy = JSON.parse(rawTaxonomy) as Taxonomy;
const rootsFile = JSON.parse(fs.readFileSync(ROOTS_PATH, "utf8")) as RootsFile;
const riskyOffIds = new Set(KNOWN_INGREDIENTS.flatMap((known) => (known.offId ? [known.offId] : [])));

const { table, report } = computeLowOxalateIds(taxonomy, rootsFile, riskyOffIds);

const output = {
  source: {
    name: "Open Food Facts — taxonomie des ingrédients",
    url: TAXONOMY_URL,
    downloadedAt: new Date().toISOString(),
    sha256: createHash("sha256").update(rawTaxonomy).digest("hex"),
    license: "ODbL 1.0 (base) / DbCL 1.0 (contenu) — © contributeurs Open Food Facts",
    generator: "scripts/generate-oxalate-tables.ts",
  },
  families: table.families,
  // Clés triées : diff lisible à chaque régénération.
  ids: Object.fromEntries(Object.entries(table.ids).sort(([a], [b]) => a.localeCompare(b))),
};
fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`);

console.log(`Identifiants faibles : ${Object.keys(table.ids).length}`);
console.log("\nRetenus par famille :");
for (const [family, count] of Object.entries(report.descendantsByFamily)) {
  console.log(`  ${family} : ${count}`);
}
console.log(`\nÉcartés par un ancêtre à risque (${report.riskyConflicts.length}) :`);
console.log(`  ${report.riskyConflicts.join(" ")}`);
console.log(`\nÉcartés par exclude (${report.excluded.length}) :`);
console.log(`  ${report.excluded.join(" ")}`);
console.log(`\nRendus faibles par forceLow (${report.forcedLow.length}) :`);
console.log(`  ${report.forcedLow.join(" ")}`);

const riskyRootsFile = JSON.parse(fs.readFileSync(RISKY_ROOTS_PATH, "utf8")) as RiskyRootsFile;
const risky = computeRiskyOxalateIds(taxonomy, riskyRootsFile, new Set(Object.keys(table.ids)), riskyOffIds);
fs.writeFileSync(
  RISKY_OUTPUT_PATH,
  `${JSON.stringify(
    {
      source: { ...output.source },
      tiers: risky.table.tiers,
      ids: Object.fromEntries(Object.entries(risky.table.ids).sort(([a], [b]) => a.localeCompare(b))),
    },
    null,
    2
  )}\n`
);
console.log(`\nIngrédients à risque hérités : ${Object.keys(risky.table.ids).length}`);
console.log("Par palier :", risky.report.countsByTier);
console.log(`Laissés à la table faible : ${risky.report.skippedLow.join(" ")}`);
console.log(`Laissés aux offId connus : ${risky.report.skippedKnown.join(" ")}`);
console.log(`Exclus : ${risky.report.excluded.join(" ")}`);
console.log(`Dans deux familles : ${risky.report.inTwoFamilies.join(" ")}`);
console.log(`Paliers « blé » (raffiné) : ${Object.entries(risky.table.ids).filter(([, e]) => e.label === "blé").map(([id]) => id).join(" ")}`);
console.log(`Paliers « blé complet » : ${Object.entries(risky.table.ids).filter(([, e]) => e.label === "blé complet").map(([id]) => id).join(" ")}`);
