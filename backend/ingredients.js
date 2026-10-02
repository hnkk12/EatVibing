// Conservative quantity parsing: uncertain measures stay as source text.
const clean = (value) =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
const aliases = {
  "chicken breast": [
    "chicken breast",
    "chicken breasts",
    "uc ga",
    "thit uc ga",
  ],
  chicken: ["chicken", "thit ga"],
  beef: ["beef", "thit bo"],
  garlic: ["garlic", "toi", "toi bam", "toi bam nhuyen", "toi dap dap"],
  onion: ["onion", "onions", "hanh tay"],
  tomato: ["tomato", "tomatoes", "ca chua"],
  egg: ["egg", "eggs", "trung", "trung ga", "trung ga ta"],
  salmon: ["salmon", "ca hoi", "phi le ca hoi"],
  tofu: ["tofu", "dau hu", "dau hu non"],
  mushroom: ["mushrooms", "mushroom", "nam"],
  milk: ["milk", "sua tuoi"],
  butter: ["butter", "bo lat"],
  salt: ["salt", "muoi"],
  sugar: ["sugar", "duong"],
  "olive oil": ["olive oil", "dau o liu"],
  "soy sauce": ["soy sauce", "nuoc tuong"],
  rice: ["rice", "gao"],
  shrimp: ["shrimp", "prawns", "tom"],
  peanut: ["peanut", "peanuts", "groundnut", "groundnuts", "dau phong", "lac"],
  carrot: ["carrot", "carrots", "ca rot"],
  potato: ["potato", "potatoes", "khoai tay"],
};
function canonical(value) {
  const name = clean(value)
    .replace(
      /\b(finely chopped|thinly sliced|chopped|sliced|fresh|boneless|skinless)\b/g,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();
  for (const [key, values] of Object.entries(aliases))
    if (values.includes(name)) return key;
  return name;
}
const units = {
  g: ["g", 1],
  gram: ["g", 1],
  grams: ["g", 1],
  kg: ["g", 1000],
  ml: ["ml", 1],
  l: ["ml", 1000],
  litre: ["ml", 1000],
  litres: ["ml", 1000],
  tsp: ["tsp", 1],
  teaspoon: ["tsp", 1],
  teaspoons: ["tsp", 1],
  tbsp: ["tbsp", 1],
  tablespoon: ["tbsp", 1],
  tablespoons: ["tbsp", 1],
  cup: ["cup", 1],
  cups: ["cup", 1],
  clove: ["clove", 1],
  cloves: ["clove", 1],
  piece: ["piece", 1],
  pieces: ["piece", 1],
  qua: ["piece", 1],
  cu: ["piece", 1],
  tep: ["clove", 1],
  lat: ["slice", 1],
  slice: ["slice", 1],
  slices: ["slice", 1],
};
function parseIngredient(raw) {
  const original = typeof raw === "string" ? raw : raw.data || "";
  let s = clean(original)
    .replace(/¼/g, " 1/4 ")
    .replace(/½/g, " 1/2 ")
    .replace(/¾/g, " 3/4 ")
    .replace(/muong canh/g, "tbsp")
    .replace(/muong (cafe|ca phe)/g, "tsp")
    .replace(/\s+/g, " ")
    .trim();
  const m = s.match(
    /^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)\s*([a-z]+)?\s*(.*)$/,
  );
  if (
    !m ||
    /\d\s*[-–]\s*\d/.test(s) ||
    /\b(or|hoac)\b|[,;/]/.test(m?.[3] || "")
  )
    return {
      raw: original,
      name: canonical(original),
      quantity: null,
      unit: null,
      structured: false,
    };
  const parts = m[1].split(/\s+/);
  let quantity = 0;
  for (const p of parts) {
    if (p.includes("/")) {
      const [a, b] = p.split("/").map(Number);
      quantity += a / b;
    } else quantity += Number(p);
  }
  const unit = units[m[2]];
  let name;
  if (unit) name = m[3];
  else {
    name = [m[2], m[3]].filter(Boolean).join(" ");
  }
  if (!name || !Number.isFinite(quantity) || quantity <= 0)
    return {
      raw: original,
      name: canonical(original),
      quantity: null,
      unit: null,
      structured: false,
    };
  // Bare numerical counts are pieces; descriptors that do not identify a measure remain unparsed.
  if (
    !unit &&
    (/^(handful|pinch|dash|can|cans|pack|packs|bia|nhanh|muong)\b/.test(name) ||
      ![
        "egg",
        "onion",
        "tomato",
        "potato",
        "carrot",
        "chicken",
        "chicken breast",
        "salmon",
        "shrimp",
        "mushroom",
      ].includes(canonical(name)))
  )
    return {
      raw: original,
      name: canonical(original),
      quantity: null,
      unit: null,
      structured: false,
    };
  return {
    raw: original,
    name: canonical(name),
    quantity: quantity * (unit?.[1] || 1),
    unit: unit?.[0] || "piece",
    structured: true,
  };
}
function formatQuantity(q) {
  return Number(q.toFixed(2)).toString();
}
function ingredientLabel(item, factor = 1) {
  return item.structured
    ? `${formatQuantity(item.quantity * factor)} ${item.unit} ${item.name}`
    : item.raw;
}
function enrichMeal(m, metadata = {}) {
  const ingredients_structured = m.ingredients.map(parseIngredient);
  const text = clean(m.name);
  const mealTypes =
    metadata.mealTypes ||
    (/\b(egg|eggs|congee|bread|oat|omelette|pancake)\b|\btrung\b|^chao\b|\bbanh mi\b/.test(
      text,
    )
      ? ["breakfast", "lunch", "dinner"]
      : ["lunch", "dinner"]);
  return {
    ...m,
    ingredients_structured,
    baseServings: metadata.baseServings || null,
    mealTypes,
  };
}
function matchesAvoid(meal, avoid) {
  const hay = clean(
    `${meal.ingredients.join(" ")} ${meal.ingredients_structured.map((i) => i.name).join(" ")}`,
  );
  return avoid.some((term) => {
    const original = clean(term);
    const key = canonical(term);
    const names = aliases[key] || [original];
    return [original, key, ...names]
      .filter(Boolean)
      .some((name) => hay.includes(name));
  });
}
function grocery(entries, meals, pantry) {
  const map = new Map(),
    warnings = new Set();
  for (const entry of entries) {
    const meal = meals.find((m) => m.id === entry.meal);
    if (!meal) continue;
    const factor = meal.baseServings ? entry.servings / meal.baseServings : 1;
    if (!meal.baseServings)
      warnings.add(
        `${meal.name}: original serving count is not set; source quantities are used.`,
      );
    for (const ing of meal.ingredients_structured) {
      const key = ing.structured
        ? `${ing.name}|${ing.unit}`
        : `source|${clean(ing.raw)}`;
      const item = map.get(key) || {
        key,
        name: ing.name,
        unit: ing.unit,
        quantity: ing.structured ? 0 : null,
        raw: ing.raw,
        structured: ing.structured,
        recipes: [],
        occurrences: 0,
      };
      if (ing.structured) item.quantity += ing.quantity * factor;
      else if (factor !== 1)
        warnings.add(
          `${meal.name}: '${ing.raw}' has no exact measure; check it manually.`,
        );
      item.occurrences++;
      if (!item.recipes.includes(meal.name)) item.recipes.push(meal.name);
      map.set(key, item);
    }
  }
  return {
    items: [...map.values()].map((item) => {
      const available = pantry
        .filter(
          (p) => p.name === item.name && p.unit === item.unit && p.structured,
        )
        .reduce((sum, p) => sum + p.quantity, 0);
      const needed = item.structured
        ? Math.max(0, item.quantity - available)
        : null;
      return {
        ...item,
        quantity:
          item.quantity === null ? null : Number(item.quantity.toFixed(2)),
        needed: needed === null ? null : Number(needed.toFixed(2)),
        available,
        label: item.structured
          ? `${formatQuantity(needed)} ${item.unit} ${item.name}`
          : item.raw,
        covered: item.structured && needed === 0,
      };
    }),
    warnings: [...warnings],
  };
}
module.exports = {
  clean,
  canonical,
  parseIngredient,
  ingredientLabel,
  enrichMeal,
  matchesAvoid,
  grocery,
};
