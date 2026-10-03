const fs = require("node:fs");
const path = require("node:path");
const { enrichMeal } = require("../ingredients");
const { englishRecipe } = require("../english-recipes");
const load = file => JSON.parse(fs.readFileSync(path.join(__dirname, "../data", file), "utf8").replace(/^\uFEFF/, ""));
function loadCatalog() {
  const source = load("source-meals.json").filter(Boolean).map(m => ({
    id: "local-" + m.idMeal, name: m.strMeal, origin: m.strArea || m.strCountry || "Unspecified",
    image_url: m.strMealThumb, source_url: m.strSource || "https://www.themealdb.com/meal/" + m.idMeal,
    category: "balance", description: "Prepare the ingredients and follow the source recipe below.", image_note: "Dish image from TheMealDB",
    recipes: (m.strInstructions || "").split(/\r?\n/).filter(x => x.trim() && !/^\s*step\s+\d+\s*[:.)-]?\s*$/i.test(x)).map((details, i) => ({ order: i + 1, title: "Step " + (i + 1), details })),
    ingredients: Array.from({ length: 20 }, (_, i) => m["strIngredient" + (i + 1)]?.trim() ? `${m["strMeasure" + (i + 1)] || ""} ${m["strIngredient" + (i + 1)]}`.trim() : null).filter(Boolean),
  }));
  const snapshot = load("supabase-snapshot.json").map(m => englishRecipe({ ...m, id: "sb-" + m.id, image_note: "Illustration from the existing recipe library", ingredients: m.ingredients.map(i => typeof i === "string" ? i : i.data), recipes: m.recipes.map(s => ({ order: s.order || s.step_number, title: s.title, details: s.details || s.content, image_url: s.img_url || null })).sort((a, b) => a.order - b.order) }));
  return [...snapshot, ...source].map(m => enrichMeal(m));
}
module.exports = { loadCatalog };
