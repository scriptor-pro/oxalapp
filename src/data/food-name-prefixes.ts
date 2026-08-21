// Maps a common French/Dutch food name to the item-name prefix(es) used in
// oxalate-database.json, so a name search can return every preparation
// variant (boiled, fried, raw...) the OHF database lists for that food,
// each with its own level — preparation changes the oxalate level, so
// collapsing to a single "worst case" would hide that.
// Curated manually against the 737-entry database; not exhaustive — covers
// common raw foods across fruit/veg/meat/dairy/slow-carb categories, not
// brand-name or composite entries.
export interface FoodNamePrefix {
  name: string;
  itemPrefixes: string[];
}

export const FOOD_NAME_PREFIXES: FoodNamePrefix[] = [
  { name: "poulet", itemPrefixes: ["Meats and Poultry"] },
  { name: "dinde", itemPrefixes: ["Meats and Poultry"] },
  { name: "boeuf", itemPrefixes: ["Meats and Poultry"] },
  { name: "porc", itemPrefixes: ["Meats and Poultry"] },
  { name: "agneau", itemPrefixes: ["Meats and Poultry"] },
  { name: "viande", itemPrefixes: ["Meats and Poultry"] },
  { name: "saucisse", itemPrefixes: ["Meats and Poultry"] },
  { name: "jambon", itemPrefixes: ["Meats and Poultry"] },
  { name: "poisson", itemPrefixes: ["Fish and Seafood"] },
  { name: "saumon", itemPrefixes: ["Fish and Seafood"] },
  { name: "crevette", itemPrefixes: ["Fish and Seafood"] },
  { name: "oeuf", itemPrefixes: ["Eggs Whole"] },
  { name: "riz", itemPrefixes: ["Rice,", "Grains, Rice"] },
  { name: "pain", itemPrefixes: ["Bread,"] },
  { name: "pate", itemPrefixes: ["Pasta,"] },
  { name: "pomme de terre", itemPrefixes: ["Potato,", "Potato Salad", "Potatoes,"] },
  { name: "patate", itemPrefixes: ["Potato,", "Potato Salad", "Potatoes,"] },
  { name: "lait", itemPrefixes: ["Milk, Cows"] },
  { name: "fromage", itemPrefixes: ["Cheese,"] },
  { name: "yaourt", itemPrefixes: ["Milk Products, Yogurt"] },
  { name: "beurre", itemPrefixes: ["Butter"] },
];
