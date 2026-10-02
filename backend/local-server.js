const express = require("express");
const cors = require("cors");
const { DatabaseSync } = require("node:sqlite");
const fs = require("node:fs");
const path = require("node:path");
const { enrichMeal } = require("./ingredients");
const { installPremium } = require("./premium-service");
const app = express();
app.use(cors({ origin: ["http://127.0.0.1:5173", "http://localhost:5173"] }));
app.use(express.json({ limit: "1mb" }));
const db = new DatabaseSync(path.join(__dirname, "data", "eatvibing.sqlite"));
db.exec(`PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS catalog(id TEXT PRIMARY KEY,payload TEXT NOT NULL,source TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS visitors(id TEXT PRIMARY KEY,plan TEXT NOT NULL DEFAULT 'free' CHECK(plan IN ('free','pro')));
CREATE TABLE IF NOT EXISTS favorites(visitor TEXT NOT NULL REFERENCES visitors(id),meal TEXT NOT NULL REFERENCES catalog(id),PRIMARY KEY(visitor,meal));
CREATE TABLE IF NOT EXISTS planner(visitor TEXT NOT NULL REFERENCES visitors(id),day INTEGER NOT NULL CHECK(day BETWEEN 0 AND 6),meal TEXT NOT NULL REFERENCES catalog(id),PRIMARY KEY(visitor,day));
CREATE TABLE IF NOT EXISTS shopping(visitor TEXT NOT NULL REFERENCES visitors(id),label TEXT NOT NULL,checked INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(visitor,label));
CREATE TABLE IF NOT EXISTS overrides(meal TEXT PRIMARY KEY REFERENCES catalog(id),image_url TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY,visitor TEXT NOT NULL,plan TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP);`);
const put = db.prepare(
  "INSERT INTO catalog VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload",
);
function normalize(m, source = "supabase") {
  const steps = (m.recipes || [])
    .map((s) => ({
      order: s.order || s.step_number,
      title: s.title || `Step ${s.order || s.step_number}`,
      details: s.details || s.content,
      image_url: s.img_url || null,
    }))
    .sort((a, b) => a.order - b.order);
  return {
    ...m,
    id: source === "supabase" ? `sb-${m.id}` : m.id,
    source,
    ingredients: (m.ingredients || []).map((i) =>
      typeof i === "string" ? i : i.data,
    ),
    recipes: steps,
    description:
      m.description ||
      `Cook ${m.name.toLowerCase()}. Prepare the ingredients and follow the recipe step by step.`,
    image_note:
      source === "supabase"
        ? "Illustration from the existing recipe library"
        : "Dish image from TheMealDB",
  };
}
const snapshot = path.join(__dirname, "data", "supabase-snapshot.json");
if (fs.existsSync(snapshot))
  for (const m of JSON.parse(
    fs.readFileSync(snapshot, "utf8").replace(/^\uFEFF/, ""),
  )) {
    const n = normalize(m);
    put.run(n.id, JSON.stringify(n), "supabase");
  }
const imported = JSON.parse(
  fs
    .readFileSync(path.join(__dirname, "data", "source-meals.json"), "utf8")
    .replace(/^\uFEFF/, ""),
);
for (const m of imported.filter(Boolean)) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++)
    if (m[`strIngredient${i}`]?.trim())
      ingredients.push(
        `${m[`strMeasure${i}`] || ""} ${m[`strIngredient${i}`]}`.trim(),
      );
  const n = normalize(
    {
      id: `local-${m.idMeal}`,
      name: m.strMeal,
      origin: m.strArea,
      category:
        m.strCategory === "Vegetarian"
          ? "loss"
          : m.strCategory === "Beef"
            ? "gain"
            : "balance",
      image_url: m.strMealThumb,
      ingredients,
      recipes: m.strInstructions
        .split(/\r?\n/)
        .filter((x) => x.trim())
        .map((details, i) => ({ order: i + 1, details })),
      source_url: m.strSource || "https://www.themealdb.com",
      recipe_language: "en",
    },
    "local",
  );
  put.run(n.id, JSON.stringify(n), "local");
}
let remoteStatus = "snapshot";
// Verified replacement for a broken shared chicken illustration in the remote catalog.
for (const id of ["sb-29", "sb-38"]) {
  if (db.prepare("SELECT id FROM catalog WHERE id=?").get(id))
    db.prepare("INSERT OR IGNORE INTO overrides VALUES(?,?)").run(
      id,
      "https://www.themealdb.com/images/media/meals/nlxald1764112200.jpg",
    );
}
async function syncRemote() {
  try {
    const response = await fetch(
      "https://ryzedmdauxudjxokgxrf.supabase.co/rest/v1/meals?select=*,ingredients(*),recipes(*)&order=id",
      {
        headers: {
          apikey:
            process.env.SUPABASE_KEY ||
            "sb_publishable_EF-LmHee41xDwJXCSNx9Ug_5_n91wjs",
        },
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!response.ok) throw Error(response.status);
    const meals = await response.json();
    for (const m of meals) {
      const n = normalize(m);
      put.run(n.id, JSON.stringify(n), "supabase");
    }
    remoteStatus = "live";
  } catch {
    remoteStatus = "cached";
  }
}
const ingredientVersions = new Map();
function meals() {
  return db
    .prepare(
      "SELECT c.payload,o.image_url,r.payload AS metadata FROM catalog c LEFT JOIN overrides o ON o.meal=c.id LEFT JOIN ev_recipe_metadata r ON r.meal=c.id",
    )
    .all()
    .map((r) => {
      const meal = enrichMeal(
        {
          ...JSON.parse(r.payload),
          ...(r.image_url
            ? { image_url: r.image_url, image_note: "Custom local image" }
            : {}),
        },
        r.metadata ? JSON.parse(r.metadata) : {},
      );
      const version = JSON.stringify(meal.ingredients);
      if (ingredientVersions.get(meal.id) !== version) {
        db.prepare("DELETE FROM ev_recipe_ingredients WHERE meal=?").run(
          meal.id,
        );
        const insert = db.prepare(
          "INSERT INTO ev_recipe_ingredients VALUES(?,?,?,?,?,?,?)",
        );
        meal.ingredients_structured.forEach((i, line) =>
          insert.run(
            meal.id,
            line,
            i.name,
            i.quantity,
            i.unit,
            i.raw,
            i.structured ? 1 : 0,
          ),
        );
        ingredientVersions.set(meal.id, version);
      }
      return meal;
    });
}
app.use("/api", (req, res, next) => {
  const id = req.headers["x-visitor-id"];
  if (!id || !/^[a-zA-Z0-9-]{8,80}$/.test(id))
    return res.status(400).json({ error: "Invalid local session." });
  req.visitor = id;
  db.prepare("INSERT OR IGNORE INTO visitors(id) VALUES(?)").run(id);
  next();
});
installPremium(app, db, meals);
app.post("/api/images", (req, res) => {
  const { meal, image_url } = req.body;
  if (
    !meals().some((m) => m.id === meal) ||
    typeof image_url !== "string" ||
    !/^https:\/\//.test(image_url)
  )
    return res
      .status(400)
      .json({ error: "Choose a meal and enter an HTTPS image URL." });
  db.prepare(
    "INSERT INTO overrides VALUES(?,?) ON CONFLICT(meal) DO UPDATE SET image_url=excluded.image_url",
  ).run(meal, image_url);
  res.json({ meals: meals(), remoteStatus });
});
app.post("/api/meals", (req, res) => {
  const { name, origin, category, image_url, ingredients, recipes } = req.body;
  if (
    !name?.trim() ||
    !["gain", "loss", "balance"].includes(category) ||
    !/^https:\/\//.test(image_url || "") ||
    !Array.isArray(ingredients) ||
    !ingredients.length ||
    !Array.isArray(recipes) ||
    !recipes.length
  )
    return res.status(400).json({
      error: "Enter a name, HTTPS image URL, ingredients and cooking steps.",
    });
  const n = normalize(
    {
      ...req.body,
      id: `custom-${crypto.randomUUID()}`,
      name: name.trim(),
      origin: origin || "Custom",
    },
    "custom",
  );
  put.run(n.id, JSON.stringify(n), "custom");
  res.status(201).json(n);
});
app.use((err, req, res, next) => {
  console.error(err.message);
  res
    .status(500)
    .json({ error: "Unable to save local data. Please try again." });
});
app.listen(5000, "127.0.0.1", () => {
  console.log("EatVibing local API http://127.0.0.1:5000");
  syncRemote();
});
