const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const { DatabaseSync } = require("node:sqlite");
const { installPremium } = require("../premium-service");
const { parseIngredient, enrichMeal, grocery } = require("../ingredients");

test("quantity parsing and grocery arithmetic preserve uncertain measures", () => {
  assert.deepEqual(
    [
      parseIngredient("1/2 kg chicken breast").quantity,
      parseIngredient("200g ức gà").name,
    ],
    [500, "chicken breast"],
  );
  assert.equal(parseIngredient("¼ cup milk").quantity, 0.25);
  assert.equal(parseIngredient("1 1/2 cups milk").quantity, 1.5);
  assert.equal(parseIngredient("2-3 g salt").structured, false);
  assert.equal(parseIngredient("2 salt").structured, false);
  assert.equal(
    enrichMeal({
      name: "Đùi gà áp chảo sốt chanh sả",
      ingredients: [],
    }).mealTypes.includes("breakfast"),
    false,
  );
  const m = enrichMeal(
    {
      id: "one",
      name: "One",
      ingredients: ["200 g chicken breast", "100 ml milk", "Salt to taste"],
    },
    { baseServings: 2, mealTypes: ["dinner"] },
  );
  const result = grocery(
    [
      { meal: "one", servings: 4 },
      { meal: "one", servings: 2 },
    ],
    [m],
    [parseIngredient("100 g chicken breast")],
  );
  assert.equal(
    result.items.find((i) => i.name === "chicken breast").needed,
    500,
  );
  assert.equal(result.items.find((i) => i.name === "milk").needed, 300);
  assert.equal(result.items.find((i) => !i.structured).occurrences, 2);
});

test("Free and Pro enforce permissions, weekly planning, templates, shopping, notes and ownership", async () => {
  const db = new DatabaseSync(":memory:");
  db.exec(`PRAGMA foreign_keys=ON;
 CREATE TABLE visitors(id TEXT PRIMARY KEY,plan TEXT DEFAULT 'free');
 CREATE TABLE catalog(id TEXT PRIMARY KEY,payload TEXT);
 CREATE TABLE favorites(visitor TEXT REFERENCES visitors(id),meal TEXT REFERENCES catalog(id),PRIMARY KEY(visitor,meal));
 CREATE TABLE planner(visitor TEXT,day INTEGER,meal TEXT);
 CREATE TABLE events(visitor TEXT,plan TEXT);`);
  for (let i = 0; i < 14; i++)
    db.prepare("INSERT INTO catalog VALUES(?,?)").run(
      "meal-" + i,
      JSON.stringify({
        id: "meal-" + i,
        name: "Chicken " + i,
        origin: "Test",
        category: "balance",
        ingredients: ["200 g chicken breast", "100 ml milk", "Salt to taste"],
        image_url: "https://example.com/dish.jpg",
        recipes: [{ order: 1, details: "Cook" }],
      }),
    );
  const meals = () =>
    db
      .prepare(
        "SELECT c.payload,r.payload AS metadata FROM catalog c LEFT JOIN ev_recipe_metadata r ON r.meal=c.id",
      )
      .all()
      .map((r) =>
        enrichMeal(
          JSON.parse(r.payload),
          r.metadata
            ? JSON.parse(r.metadata)
            : { baseServings: 2, mealTypes: ["breakfast", "lunch", "dinner"] },
        ),
      );
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.visitor = req.headers["x-visitor-id"] || "owner";
    db.prepare("INSERT OR IGNORE INTO visitors(id) VALUES(?)").run(req.visitor);
    next();
  });
  installPremium(app, db, meals);
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const url = `http://127.0.0.1:${server.address().port}/api`;
  const request = async (route, body, visitor = "owner") => {
    const response = await fetch(url + route, {
      method: body ? "POST" : "GET",
      headers: { "content-type": "application/json", "x-visitor-id": visitor },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: response.status, data: await response.json() };
  };
  try {
    const initial = (await request("/state")).data;
    for (let i = 0; i < 10; i++)
      assert.equal(
        (await request("/favorites", { meal: "meal-" + i })).status,
        200,
      );
    assert.equal(
      (await request("/favorites", { meal: "meal-10" })).status,
      403,
    );
    assert.equal(
      (
        await request("/planner", {
          day: initial.currentDay,
          slot: "breakfast",
          meal: "meal-0",
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await request("/planner", {
          day: (initial.currentDay + 1) % 7,
          slot: "breakfast",
          meal: "meal-0",
        })
      ).status,
      403,
    );
    for (const route of [
      "/planner/generate",
      "templates",
      "pantry",
      "shopping",
      "notes",
      "collections",
      "recipe-metadata",
      "preferences",
    ])
      assert.equal(
        (await request("/" + route.replace(/^\//, ""), {})).status,
        403,
        route,
      );
    await request("/plan", { plan: "pro" });
    assert.equal(
      (await request("/favorites", { meal: "meal-10" })).data.favorites.length,
      11,
    );
    await request("/preferences", { people: 4 });
    const generated = await request("/planner/generate", {});
    assert.equal(generated.data.planner.length, 21);
    assert(generated.data.planner.every((e) => e.servings === 4));
    const locked = generated.data.planner[0];
    await request("/planner", { ...locked, locked: true });
    const regenerated = (await request("/planner/generate", {})).data;
    assert.equal(
      regenerated.planner.find(
        (e) => e.day === locked.day && e.slot === locked.slot,
      ).meal,
      locked.meal,
    );
    assert.equal(
      (await request("/planner/swap", { day: locked.day, slot: locked.slot }))
        .status,
      400,
    );
    const unlocked = regenerated.planner.find((e) => !e.locked);
    const swapped = (
      await request("/planner/swap", { day: unlocked.day, slot: unlocked.slot })
    ).data;
    assert.notEqual(
      swapped.planner.find(
        (e) => e.day === unlocked.day && e.slot === unlocked.slot,
      ).meal,
      unlocked.meal,
    );
    await request("/pantry", { text: "500 g chicken breast" });
    const cart = (await request("/shopping", { generate: true })).data;
    assert.equal(
      cart.shopping.find((i) => i.name === "chicken breast").needed,
      7900,
    );
    assert.equal(cart.shopping.find((i) => i.name === "milk").needed, 4200);
    const item = cart.shopping.find((i) => i.name === "milk");
    await request("/shopping", { key: item.key, checked: true });
    assert.equal(
      (await request("/shopping", { generate: true })).data.shopping.find(
        (i) => i.key === item.key,
      ).checked,
      1,
    );
    await request("/pantry", { text: "200 ml milk" });
    assert.equal((await request("/state")).data.shoppingStale, true);
    await request("/shopping", { generate: true });
    assert.equal(
      (await request("/state")).data.shopping.find((i) => i.name === "milk")
        .checked,
      0,
    );
    assert.equal(
      (await request("/pantry", { text: "a little salt" })).status,
      400,
    );
    const saved = (await request("/templates", { name: "Family Favorites" }))
      .data.templates[0];
    const next = new Date(initial.currentWeek + "T12:00:00Z");
    next.setUTCDate(next.getUTCDate() + 7);
    const nextWeek = next.toISOString().slice(0, 10);
    await request("/preferences", { activeWeek: nextWeek });
    assert.equal((await request("/state")).data.planner.length, 0);
    assert.equal(
      (await request("/templates", { apply: saved.id })).data.planner.length,
      21,
    );
    const weekBefore = (await request("/state")).data.planner;
    await request("/preferences", { avoid: ["chicken"] });
    assert.equal((await request("/planner/generate", {})).status, 400);
    assert.deepEqual((await request("/state")).data.planner, weekBefore);
    assert.equal((await request("/suggestions", {})).status, 400);
    await request("/preferences", { avoid: [] });
    await request("/notes", { meal: "meal-0", content: "Less salt next time" });
    assert.equal(
      (await request("/state")).data.notes["meal-0"],
      "Less salt next time",
    );
    const c = (await request("/collections", { name: "Quick lunches" })).data
      .collections[0];
    await request("/collections", { collection: c.id, meal: "meal-0" });
    assert.equal(
      (await request("/state")).data.collections[0].meals[0],
      "meal-0",
    );
    await request("/plan", { plan: "pro" }, "other");
    assert.equal(
      (await request("/templates", { apply: saved.id }, "other")).status,
      404,
    );
    assert.equal(
      (
        await request(
          "/collections",
          { collection: c.id, meal: "meal-0" },
          "other",
        )
      ).status,
      404,
    );
    assert.deepEqual(
      (await request("/state", undefined, "other")).data.notes,
      {},
    );
    const metadata = await request("/recipe-metadata", {
      meal: "meal-0",
      baseServings: 3,
      mealTypes: ["lunch"],
    });
    assert.equal(
      metadata.data.meals.find((m) => m.id === "meal-0").baseServings,
      3,
    );
    await request("/plan", { plan: "free" });
    const downgraded = (await request("/state")).data;
    assert.equal(downgraded.favorites.length, 11);
    assert.equal(downgraded.templates.length, 1);
    assert.equal(downgraded.notes["meal-0"], "Less salt next time");
    assert.equal(
      (await request("/notes", { meal: "meal-0", content: "overwrite" }))
        .status,
      403,
    );
    await request("/plan", { plan: "pro" });
    await request("/preferences", { activeWeek: nextWeek });
    assert.equal((await request("/state")).data.planner.length, 21);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    db.close();
  }
});
