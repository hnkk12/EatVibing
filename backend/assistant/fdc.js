async function searchFoods(query, apiKey, fetcher = fetch) {
  if (!apiKey) { const e = new Error("Configure USDA_FDC_API_KEY to search the official food database."); e.status = 503; throw e; }
  const response = await fetcher("https://api.nal.usda.gov/fdc/v1/foods/search?api_key=" + encodeURIComponent(apiKey), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query, pageSize: 10, dataType: ["Foundation", "SR Legacy", "Survey (FNDDS)"] }), signal: AbortSignal.timeout(8000) });
  if (!response.ok) { const e = new Error("USDA search is temporarily unavailable."); e.status = 503; throw e; }
  const data = await response.json();
  return (data.foods || []).map(food => ({ fdcId: food.fdcId, description: food.description, dataType: food.dataType, sourceUrl: "https://fdc.nal.usda.gov/food-details/" + food.fdcId + "/nutrients", nutrients: (food.foodNutrients || []).map(n => ({ id: n.nutrientId, name: n.nutrientName, unit: n.unitName, value: n.value })) }));
}
module.exports = { searchFoods };
