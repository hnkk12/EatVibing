const translations = require('./data/recipe-english.json');
const sourceRecipes = require('./data/supabase-snapshot.json');
const { parseIngredient } = require('./ingredients');

const dishNames = new Map();
const ingredientLines = new Map();
const ingredientNames = new Map();
for (const meal of sourceRecipes) {
  const translation = translations[`sb-${meal.id}`];
  if (!translation) continue;
  dishNames.set(meal.name, translation.name);
  meal.ingredients.forEach((ingredient, index) => {
    const original = ingredient.data;
    const translated = translation.ingredients[index];
    ingredientLines.set(original, translated);
    ingredientNames.set(parseIngredient(original).name, parseIngredient(translated).name);
  });
}

// Translate cached generated lists without altering their keys or quantities.
function englishShopping(items) {
  return items.map(item => {
    const name = ingredientNames.get(item.name) || item.name;
    const raw = ingredientLines.get(item.raw) || item.raw;
    const label = item.structured && item.label?.endsWith(item.name)
      ? item.label.slice(0, -item.name.length) + name
      : ingredientLines.get(item.label) || item.label;
    return { ...item, name, raw, label, recipes: (item.recipes || []).map(name => dishNames.get(name) || name) };
  });
}

function englishShoppingWarning(warning) {
  let result = warning;
  for (const [original, translated] of [...dishNames, ...ingredientLines]) {
    result = result.split(original).join(translated);
  }
  return result;
}

// Keep source records intact; translate the catalog returned by the local API.
function englishRecipe(meal) {
  const translation = translations[meal.id];
  if (!translation) return meal;
  return {
    ...meal,
    original_name: meal.name,
    original_ingredients: meal.ingredients,
    name: translation.name,
    description: `Prepare ${translation.name.toLowerCase()} with the ingredients and cooking steps below.`,
    ingredients: translation.ingredients,
    recipes: meal.recipes.map((step, index) => ({
      ...step,
      title: translation.steps[index][0],
      details: translation.steps[index][1],
    })),
    recipe_language: 'en',
    translation_language: 'en',
    search_aliases: [meal.name, ...meal.ingredients, ...meal.recipes.map(step => `${step.title} ${step.details}`)],
  };
}

module.exports = { englishRecipe, englishShopping, englishShoppingWarning };
