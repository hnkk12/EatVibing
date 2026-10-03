const VERSION = "mifflin-st-jeor-1990/v1";
const { bmiForAge } = require("./pediatric");
const SOURCES = {
  bmi: "https://www.cdc.gov/bmi/index.html",
  resting: "https://pubmed.ncbi.nlm.nih.gov/2305711/",
  children: "https://www.niddk.nih.gov/health-information/weight-management/helping-your-child-who-is-overweight",
};
function validDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) && new Date(value + "T12:00:00Z").toISOString().slice(0, 10) === value;
}
function localDate(timezone = "Asia/Bangkok", now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
function ageOn(birthDate, date) {
  if (!validDate(birthDate) || !validDate(date) || birthDate > date) return null;
  const birthday = birthDate.slice(5);
  return Number(date.slice(0, 4)) - Number(birthDate.slice(0, 4)) - (date.slice(5) < birthday ? 1 : 0);
}
function weekOf(date) {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7);
  return d.toISOString().slice(0, 10);
}
function measurementsInMetric(input) {
  if (input.units !== undefined && !["metric", "imperial"].includes(input.units)) throw new Error("Choose metric or imperial units.");
  const heightCm = input.units === "imperial" ? Number(input.height) * 2.54 : Number(input.height);
  const weightKg = input.units === "imperial" ? Number(input.weight) * 0.45359237 : Number(input.weight);
  const waistCm = input.waist ? Number(input.waist) * (input.units === "imperial" ? 2.54 : 1) : null;
  if (![heightCm, weightKg].every(Number.isFinite) || heightCm < 40 || heightCm > 260 || weightKg < 5 || weightKg > 500 || (waistCm !== null && (!Number.isFinite(waistCm) || waistCm < 20 || waistCm > 300))) throw new Error("Enter valid height and weight; imperial height is in inches.");
  return { heightCm, weightKg, waistCm };
}
function metrics(profile, measurement, date, policy = {}) {
  const age = ageOn(profile.birthDate, date);
  const missing = [];
  if (age === null) missing.push("birthDate");
  if (!measurement) missing.push("measurement");
  if (!["male", "female"].includes(profile.formulaSex)) missing.push("formulaSex");
  const bmi = measurement ? measurement.weightKg / (measurement.heightCm / 100) ** 2 : null;
  const bmiCategory = bmi !== null && age >= 20 ? (bmi < 18.5 ? "Underweight" : bmi < 25 ? "Healthy weight" : bmi < 30 ? "Overweight" : "Obesity") : null;
  const pediatric = age !== null && age >= 2 && age < 20 ? bmiForAge(profile, measurement, date, policy) : null;
  const restingCandidate = missing.length === 0 && age >= 18 && age <= 78 && !profile.specialCare ?
    10 * measurement.weightKg + 6.25 * measurement.heightCm - 5 * age + (profile.formulaSex === "male" ? 5 : -161) : null;
  const resting = restingCandidate !== null && restingCandidate > 0 ? restingCandidate : null;
  const activity = profile.activity || "sedentary";
  const eligible = age >= (policy.minimumAge ?? 20) && age <= (policy.maximumAge ?? 78) && !profile.specialCare;
  const reviewed = policy.status === "approved" && Boolean(policy.reviewedBy && policy.reviewedAt && policy.version);
  const factor = reviewed && eligible ? policy.activityFactors?.[activity] : null;
  const estimatedNeed = resting !== null && Number.isFinite(factor) && factor >= 1 && factor <= 3 ? Math.round(resting * factor) : null;
  const adjustment = policy.adjustments?.[profile.goal];
  const targetCandidate = estimatedNeed !== null && Number.isFinite(adjustment) && policy.weightGoalsEnabled === true ? Math.round(estimatedNeed + adjustment) : (profile.goal === "maintain" ? estimatedNeed : null);
  const bounds = policy.energyBounds;
  const target = targetCandidate !== null && Number.isFinite(bounds?.minimumKcal) && Number.isFinite(bounds?.maximumKcal) && bounds.minimumKcal > 0 && bounds.maximumKcal >= bounds.minimumKcal && targetCandidate >= bounds.minimumKcal && targetCandidate <= bounds.maximumKcal ? targetCandidate : null;
  return {
    bmi: bmi === null ? null : Number(bmi.toFixed(1)), bmiCategory, pediatric,
    bmiNote: pediatric ? pediatric.note : age !== null && age < 20 ? "Age-specific BMI interpretation is awaiting specialist review; adult categories do not apply." : "BMI is a screening measure, not a diagnosis.",
    restingKcal: resting === null ? null : Math.round(resting), estimatedNeedKcal: estimatedNeed,
    targetKcal: target, missing, age, estimated: true, formulaVersion: VERSION,
    policyVersion: reviewed ? policy.version : null,
    policyStatus: reviewed ? "approved" : "awaiting-specialist-review", sources: SOURCES,
  };
}
function verifiedNutrition(meal) {
  const n = meal.nutrition;
  return Boolean(n && n.status === "verified" && n.reviewedBy && n.reviewedAt && n.sourceUrl && n.baseServings > 0 &&
    ["kcal", "protein", "carbohydrate", "fat"].every(key => Number.isFinite(n.perServing?.[key]) && n.perServing[key] >= 0));
}
function totalNutrition(dishes, meals, memberId) {
  const total = { kcal: 0, protein: 0, carbohydrate: 0, fat: 0 };
  let complete = dishes.length > 0;
  for (const dish of dishes) {
    const servings = memberId ? dish.portions[memberId] || 0 : Object.values(dish.portions).reduce((a, b) => a + b, 0);
    if (!servings) continue;
    const meal = meals.find(m => m.id === dish.mealId);
    if (!meal || !verifiedNutrition(meal)) { complete = false; continue; }
    for (const key of Object.keys(total)) total[key] += meal.nutrition.perServing[key] * servings;
  }
  return { complete, values: complete ? Object.fromEntries(Object.entries(total).map(([k, v]) => [k, Math.round(v * 10) / 10])) : null };
}
function allocateRecipeServings(targetKcal, recipe, slot, policy) {
  const shares = policy.mealShares, bounds = policy.recipeServingBounds;
  if (policy.status !== "approved" || !policy.reviewedBy || !policy.reviewedAt || !Number.isFinite(targetKcal) || targetKcal <= 0 || !verifiedNutrition(recipe) || recipe.nutrition.perServing.kcal <= 0 || !shares || !["breakfast", "lunch", "dinner"].every(s => Number.isFinite(shares[s]) && shares[s] > 0) || Math.abs(Object.values(shares).reduce((a, b) => a + b, 0) - 1) > 0.0001 || !Number.isFinite(bounds?.minimum) || !Number.isFinite(bounds?.maximum) || bounds.minimum <= 0 || bounds.maximum > 10 || bounds.maximum < bounds.minimum) return null;
  const servings = targetKcal * shares[slot] / recipe.nutrition.perServing.kcal;
  // Do not silently clamp a quantity and claim the approved target has been met.
  return Number.isFinite(servings) && servings >= bounds.minimum && servings <= bounds.maximum ? Math.round(servings * 100) / 100 : null;
}
module.exports = { VERSION, SOURCES, validDate, localDate, ageOn, weekOf, measurementsInMetric, metrics, verifiedNutrition, totalNutrition, allocateRecipeServings };
