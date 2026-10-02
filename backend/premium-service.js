const {
  parseIngredient,
  matchesAvoid,
  grocery,
  clean,
} = require("./ingredients");
const SLOTS = ["breakfast", "lunch", "dinner"];
function calendar() {
  const text = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const date = new Date(text + "T12:00:00Z");
  const day = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - day);
  return {
    today: text,
    currentDay: day,
    currentWeek: date.toISOString().slice(0, 10),
  };
}
function installPremium(app, db, getMeals) {
  db.exec(`CREATE TABLE IF NOT EXISTS ev_settings(visitor TEXT PRIMARY KEY REFERENCES visitors(id),payload TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS ev_entries(visitor TEXT NOT NULL REFERENCES visitors(id),week TEXT NOT NULL,day INTEGER NOT NULL,slot TEXT NOT NULL,meal TEXT NOT NULL REFERENCES catalog(id),servings INTEGER NOT NULL,locked INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(visitor,week,day,slot));
 CREATE TABLE IF NOT EXISTS ev_templates(id TEXT PRIMARY KEY,visitor TEXT NOT NULL REFERENCES visitors(id),name TEXT NOT NULL,payload TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS ev_pantry(id TEXT PRIMARY KEY,visitor TEXT NOT NULL REFERENCES visitors(id),payload TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS ev_shopping(visitor TEXT PRIMARY KEY REFERENCES visitors(id),payload TEXT NOT NULL,signature TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS ev_notes(visitor TEXT NOT NULL REFERENCES visitors(id),meal TEXT NOT NULL REFERENCES catalog(id),content TEXT NOT NULL,PRIMARY KEY(visitor,meal));
 CREATE TABLE IF NOT EXISTS ev_collections(id TEXT PRIMARY KEY,visitor TEXT NOT NULL REFERENCES visitors(id),name TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS ev_collection_items(collection TEXT NOT NULL REFERENCES ev_collections(id) ON DELETE CASCADE,meal TEXT NOT NULL REFERENCES catalog(id),PRIMARY KEY(collection,meal));
 CREATE TABLE IF NOT EXISTS ev_migrations(version INTEGER PRIMARY KEY);
 CREATE TABLE IF NOT EXISTS ev_recipe_metadata(meal TEXT PRIMARY KEY REFERENCES catalog(id),payload TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS ev_recipe_ingredients(meal TEXT NOT NULL REFERENCES catalog(id),line INTEGER NOT NULL,name TEXT NOT NULL,quantity REAL,unit TEXT,raw TEXT NOT NULL,structured INTEGER NOT NULL,PRIMARY KEY(meal,line));`);
  const cal = calendar();
  if (!db.prepare("SELECT 1 FROM ev_migrations WHERE version=1").get()) {
    db.exec("BEGIN");
    try {
      db.prepare(
        "INSERT OR IGNORE INTO ev_entries SELECT visitor,?,day,'dinner',meal,2,0 FROM planner",
      ).run(cal.currentWeek);
      db.prepare("INSERT INTO ev_migrations VALUES(1)").run();
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  }
  function settings(id) {
    const row = db
      .prepare("SELECT payload FROM ev_settings WHERE visitor=?")
      .get(id);
    return {
      people: 2,
      category: "all",
      avoid: [],
      origins: [],
      activeWeek: calendar().currentWeek,
      ...(row ? JSON.parse(row.payload) : {}),
    };
  }
  const plan = (id) =>
    db.prepare("SELECT plan FROM visitors WHERE id=?").get(id).plan;
  const entries = (id, week) =>
    db
      .prepare(
        "SELECT week,day,slot,meal,servings,locked FROM ev_entries WHERE visitor=? AND week=? ORDER BY day,slot",
      )
      .all(id, week);
  const pantry = (id) =>
    db
      .prepare("SELECT id,payload FROM ev_pantry WHERE visitor=?")
      .all(id)
      .map((p) => ({ id: p.id, ...JSON.parse(p.payload) }));
  const signature = (id) =>
    JSON.stringify({
      entries: entries(id, settings(id).activeWeek),
      pantry: pantry(id),
      metadata: getMeals().map((m) => [m.id, m.baseServings, m.ingredients]),
    });
  function state(id) {
    const prefs = settings(id),
      cart = db
        .prepare("SELECT payload,signature FROM ev_shopping WHERE visitor=?")
        .get(id);
    return {
      plan: plan(id),
      ...calendar(),
      preferences: prefs,
      planner: entries(id, prefs.activeWeek),
      favorites: db
        .prepare("SELECT meal FROM favorites WHERE visitor=?")
        .all(id)
        .map((x) => x.meal),
      shopping: cart ? JSON.parse(cart.payload).items : [],
      shoppingWarnings: cart ? JSON.parse(cart.payload).warnings : [],
      shoppingStale: !!cart && cart.signature !== signature(id),
      pantry: pantry(id),
      notes: Object.fromEntries(
        db
          .prepare("SELECT meal,content FROM ev_notes WHERE visitor=?")
          .all(id)
          .map((x) => [x.meal, x.content]),
      ),
      templates: db
        .prepare(
          "SELECT id,name,created_at,payload FROM ev_templates WHERE visitor=? ORDER BY created_at DESC",
        )
        .all(id)
        .map((x) => ({
          id: x.id,
          name: x.name,
          created_at: x.created_at,
          count: JSON.parse(x.payload).entries.length,
        })),
      collections: db
        .prepare("SELECT id,name FROM ev_collections WHERE visitor=?")
        .all(id)
        .map((c) => ({
          ...c,
          meals: db
            .prepare("SELECT meal FROM ev_collection_items WHERE collection=?")
            .all(c.id)
            .map((x) => x.meal),
        })),
    };
  }
  function send(req, res) {
    res.json(state(req.visitor));
  }
  function pro(req, res, next) {
    if (plan(req.visitor) !== "pro")
      return res.status(403).json({ error: "This feature requires Pro demo." });
    next();
  }
  function reject(res, message, status = 400) {
    return res.status(status).json({ error: message });
  }
  function transaction(action) {
    db.exec("BEGIN");
    try {
      action();
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  }
  function validWeek(w) {
    return (
      typeof w === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(w) &&
      !Number.isNaN(Date.parse(w)) &&
      new Date(w + "T12:00:00Z").toISOString().slice(0, 10) === w &&
      new Date(w + "T12:00:00Z").getUTCDay() === 1
    );
  }
  app.get("/api/meals", (req, res) => res.json({ meals: getMeals() }));
  app.get("/api/state", (req, res) => send(req, res));
  app.post("/api/plan", (req, res) => {
    if (!["free", "pro"].includes(req.body.plan))
      return reject(res, "Invalid plan.");
    transaction(() => {
      db.prepare("UPDATE visitors SET plan=? WHERE id=?").run(
        req.body.plan,
        req.visitor,
      );
      db.prepare("INSERT INTO events(visitor,plan) VALUES(?,?)").run(
        req.visitor,
        req.body.plan,
      );
      if (req.body.plan === "free") {
        const prefs = settings(req.visitor);
        prefs.activeWeek = calendar().currentWeek;
        db.prepare(
          "INSERT INTO ev_settings VALUES(?,?) ON CONFLICT(visitor) DO UPDATE SET payload=excluded.payload",
        ).run(req.visitor, JSON.stringify(prefs));
      }
    });
    send(req, res);
  });
  app.post("/api/favorites", (req, res) => {
    const id = req.visitor,
      m = req.body.meal;
    if (!getMeals().some((x) => x.id === m))
      return reject(res, "Meal not found.", 404);
    const exists = db
      .prepare("SELECT 1 FROM favorites WHERE visitor=? AND meal=?")
      .get(id, m);
    if (exists)
      transaction(() => {
        db.prepare("DELETE FROM favorites WHERE visitor=? AND meal=?").run(
          id,
          m,
        );
        db.prepare(
          "DELETE FROM ev_collection_items WHERE meal=? AND collection IN(SELECT id FROM ev_collections WHERE visitor=?)",
        ).run(m, id);
      });
    else {
      if (plan(id) === "free" && state(id).favorites.length >= 10)
        return reject(
          res,
          "Free can save 10 recipes. Upgrade to Pro demo for unlimited saves.",
          403,
        );
      db.prepare("INSERT INTO favorites VALUES(?,?)").run(id, m);
    }
    send(req, res);
  });
  app.post("/api/preferences", pro, (req, res) => {
    const old = settings(req.visitor),
      p = { ...old, ...req.body };
    if (
      !Number.isInteger(p.people) ||
      p.people < 1 ||
      p.people > 20 ||
      !["all", "loss", "gain", "balance"].includes(p.category) ||
      !Array.isArray(p.avoid) ||
      p.avoid.length > 30 ||
      p.avoid.some((x) => typeof x !== "string" || x.length > 100) ||
      !Array.isArray(p.origins) ||
      p.origins.some((x) => typeof x !== "string") ||
      !validWeek(p.activeWeek)
    )
      return reject(
        res,
        "Check people, food preferences and week start (Monday).",
      );
    db.prepare(
      "INSERT INTO ev_settings VALUES(?,?) ON CONFLICT(visitor) DO UPDATE SET payload=excluded.payload",
    ).run(
      req.visitor,
      JSON.stringify({
        people: p.people,
        category: p.category,
        avoid: p.avoid.filter((x) => x.trim()),
        origins: p.origins,
        activeWeek: p.activeWeek,
      }),
    );
    send(req, res);
  });
  app.post("/api/planner", (req, res) => {
    const id = req.visitor,
      prefs = settings(id),
      week = prefs.activeWeek,
      { day, meal, slot = "dinner" } = req.body;
    const servings = req.body.servings ?? prefs.people;
    if (
      !Number.isInteger(day) ||
      day < 0 ||
      day > 6 ||
      !SLOTS.includes(slot) ||
      !Number.isInteger(servings) ||
      servings < 1 ||
      servings > 20
    )
      return reject(res, "Invalid day, meal slot or serving count.");
    if (
      plan(id) === "free" &&
      (week !== calendar().currentWeek ||
        day !== calendar().currentDay ||
        servings !== prefs.people ||
        req.body.locked)
    )
      return reject(
        res,
        "Free plans today only. Pro unlocks all 7 days, servings and locked meals.",
        403,
      );
    if (meal === null)
      db.prepare(
        "DELETE FROM ev_entries WHERE visitor=? AND week=? AND day=? AND slot=?",
      ).run(id, week, day, slot);
    else {
      if (!getMeals().some((x) => x.id === meal))
        return reject(res, "Meal not found.", 404);
      db.prepare(
        "INSERT INTO ev_entries VALUES(?,?,?,?,?,?,?) ON CONFLICT(visitor,week,day,slot) DO UPDATE SET meal=excluded.meal,servings=excluded.servings,locked=excluded.locked",
      ).run(id, week, day, slot, meal, servings, req.body.locked ? 1 : 0);
    }
    send(req, res);
  });
  function candidates(id, slot) {
    const prefs = settings(id);
    return getMeals().filter(
      (m) =>
        m.mealTypes.includes(slot) &&
        (prefs.category === "all" || m.category === prefs.category) &&
        (!prefs.origins.length || prefs.origins.includes(m.origin)) &&
        !matchesAvoid(m, prefs.avoid),
    );
  }
  app.post("/api/planner/generate", pro, (req, res) => {
    const id = req.visitor,
      prefs = settings(id),
      old = entries(id, prefs.activeWeek);
    const locked = old.filter((e) => e.locked);
    if (
      locked.some((e) => !candidates(id, e.slot).some((m) => m.id === e.meal))
    )
      return reject(
        res,
        "A locked meal conflicts with your preferences. Unlock or change it first.",
      );
    const next = [...locked],
      usage = new Map();
    for (const entry of locked)
      usage.set(entry.meal, (usage.get(entry.meal) || 0) + 1);
    const pantryNames = pantry(id).map((p) => p.name);
    for (let day = 0; day < 7; day++)
      for (const slot of SLOTS) {
        if (next.some((e) => e.day === day && e.slot === slot)) continue;
        const options = candidates(id, slot);
        if (!options.length)
          return reject(
            res,
            `No ${slot} recipes match your preferences. Broaden the filters or tag more recipes for this meal.`,
          );
        const ranks = options
          .map((m) => ({
            m,
            score:
              (usage.get(m.id) || 0) * 100 -
              m.ingredients_structured.filter((i) =>
                pantryNames.includes(i.name),
              ).length *
                3 +
              Math.random(),
          }))
          .sort((a, b) => a.score - b.score);
        const chosen = ranks[0].m;
        next.push({
          day,
          slot,
          meal: chosen.id,
          servings: prefs.people,
          locked: 0,
        });
        usage.set(chosen.id, (usage.get(chosen.id) || 0) + 1);
      }
    transaction(() => {
      db.prepare("DELETE FROM ev_entries WHERE visitor=? AND week=?").run(
        id,
        prefs.activeWeek,
      );
      for (const e of next)
        db.prepare("INSERT INTO ev_entries VALUES(?,?,?,?,?,?,?)").run(
          id,
          prefs.activeWeek,
          e.day,
          e.slot,
          e.meal,
          e.servings,
          e.locked,
        );
    });
    send(req, res);
  });
  app.post("/api/planner/swap", pro, (req, res) => {
    const { day, slot } = req.body;
    const id = req.visitor,
      prefs = settings(id),
      all = entries(id, prefs.activeWeek),
      entry = all.find((e) => e.day === day && e.slot === slot);
    if (!entry) return reject(res, "Choose a meal before swapping.");
    if (entry.locked) return reject(res, "Unlock this meal before swapping.");
    const candidatesForSlot = candidates(id, slot).filter(
      (m) => m.id !== entry.meal,
    );
    if (!candidatesForSlot.length)
      return reject(res, "No alternative matches these preferences.");
    candidatesForSlot.sort(
      (a, b) =>
        all.filter((e) => e.meal === a.id).length -
        all.filter((e) => e.meal === b.id).length,
    );
    db.prepare(
      "UPDATE ev_entries SET meal=? WHERE visitor=? AND week=? AND day=? AND slot=?",
    ).run(candidatesForSlot[0].id, id, prefs.activeWeek, day, slot);
    send(req, res);
  });
  app.post("/api/templates", pro, (req, res) => {
    const id = req.visitor;
    if (req.body.remove) {
      db.prepare("DELETE FROM ev_templates WHERE id=? AND visitor=?").run(
        req.body.remove,
        id,
      );
      return send(req, res);
    }
    if (req.body.apply) {
      const template = db
        .prepare("SELECT payload FROM ev_templates WHERE id=? AND visitor=?")
        .get(req.body.apply, id);
      if (!template) return reject(res, "Saved plan not found.", 404);
      const data = JSON.parse(template.payload);
      if (data.entries.some((e) => !getMeals().some((m) => m.id === e.meal)))
        return reject(res, "A saved recipe is no longer available.");
      transaction(() => {
        const prefs = {
          ...settings(id),
          ...data.preferences,
          activeWeek: settings(id).activeWeek,
        };
        db.prepare(
          "INSERT INTO ev_settings VALUES(?,?) ON CONFLICT(visitor) DO UPDATE SET payload=excluded.payload",
        ).run(id, JSON.stringify(prefs));
        db.prepare("DELETE FROM ev_entries WHERE visitor=? AND week=?").run(
          id,
          prefs.activeWeek,
        );
        for (const e of data.entries)
          db.prepare("INSERT INTO ev_entries VALUES(?,?,?,?,?,?,?)").run(
            id,
            prefs.activeWeek,
            e.day,
            e.slot,
            e.meal,
            e.servings,
            e.locked,
          );
      });
      return send(req, res);
    }
    const name = req.body.name;
    if (typeof name !== "string" || !name.trim() || name.length > 80)
      return reject(res, "Enter a plan name (1–80 characters).");
    const current = entries(id, settings(id).activeWeek);
    if (!current.length) return reject(res, "Add meals before saving a plan.");
    db.prepare(
      "INSERT INTO ev_templates(id,visitor,name,payload) VALUES(?,?,?,?)",
    ).run(
      crypto.randomUUID(),
      id,
      name.trim(),
      JSON.stringify({ entries: current, preferences: settings(id) }),
    );
    send(req, res);
  });
  app.post("/api/pantry", pro, (req, res) => {
    if (req.body.remove) {
      db.prepare("DELETE FROM ev_pantry WHERE id=? AND visitor=?").run(
        req.body.remove,
        req.visitor,
      );
      return send(req, res);
    }
    if (typeof req.body.text !== "string" || req.body.text.length > 200)
      return reject(
        res,
        "Enter a pantry ingredient, for example: 200 g chicken breast.",
      );
    const ing = parseIngredient(req.body.text);
    if (!ing.structured)
      return reject(
        res,
        "Use a measurable quantity, for example: 200 g chicken breast or 2 pieces egg.",
      );
    db.prepare("INSERT INTO ev_pantry VALUES(?,?,?)").run(
      crypto.randomUUID(),
      req.visitor,
      JSON.stringify(ing),
    );
    send(req, res);
  });
  app.post("/api/shopping", pro, (req, res) => {
    const id = req.visitor;
    if (req.body.generate) {
      const result = grocery(
        entries(id, settings(id).activeWeek),
        getMeals(),
        pantry(id),
      );
      const old = db
        .prepare("SELECT payload FROM ev_shopping WHERE visitor=?")
        .get(id);
      const oldItems = old ? JSON.parse(old.payload).items : [];
      result.items = result.items.map((item) => ({
        ...item,
        checked: oldItems.some(
          (o) => o.key === item.key && o.needed === item.needed && o.checked,
        )
          ? 1
          : 0,
      }));
      db.prepare(
        "INSERT INTO ev_shopping VALUES(?,?,?) ON CONFLICT(visitor) DO UPDATE SET payload=excluded.payload,signature=excluded.signature",
      ).run(id, JSON.stringify(result), signature(id));
    } else {
      const row = db
        .prepare("SELECT payload FROM ev_shopping WHERE visitor=?")
        .get(id);
      if (!row) return reject(res, "Generate a grocery list first.");
      const data = JSON.parse(row.payload);
      const item = data.items.find((i) => i.key === req.body.key);
      if (!item) return reject(res, "Grocery item not found.", 404);
      item.checked = req.body.checked ? 1 : 0;
      db.prepare("UPDATE ev_shopping SET payload=? WHERE visitor=?").run(
        JSON.stringify(data),
        id,
      );
    }
    send(req, res);
  });
  app.post("/api/notes", pro, (req, res) => {
    const { meal, content } = req.body;
    if (
      !getMeals().some((m) => m.id === meal) ||
      typeof content !== "string" ||
      content.length > 3000
    )
      return reject(res, "Enter a recipe note of up to 3,000 characters.");
    db.prepare(
      "INSERT INTO ev_notes VALUES(?,?,?) ON CONFLICT(visitor,meal) DO UPDATE SET content=excluded.content",
    ).run(req.visitor, meal, content);
    send(req, res);
  });
  app.post("/api/collections", pro, (req, res) => {
    const id = req.visitor;
    if (req.body.remove) {
      db.prepare("DELETE FROM ev_collections WHERE id=? AND visitor=?").run(
        req.body.remove,
        id,
      );
      return send(req, res);
    }
    if (req.body.collection && req.body.meal) {
      const c = db
        .prepare("SELECT id FROM ev_collections WHERE id=? AND visitor=?")
        .get(req.body.collection, id);
      if (!c) return reject(res, "Collection not found.", 404);
      if (!getMeals().some((m) => m.id === req.body.meal))
        return reject(res, "Meal not found.", 404);
      transaction(() => {
        db.prepare("INSERT OR IGNORE INTO favorites VALUES(?,?)").run(
          id,
          req.body.meal,
        );
        const has = db
          .prepare(
            "SELECT 1 FROM ev_collection_items WHERE collection=? AND meal=?",
          )
          .get(c.id, req.body.meal);
        if (has)
          db.prepare(
            "DELETE FROM ev_collection_items WHERE collection=? AND meal=?",
          ).run(c.id, req.body.meal);
        else
          db.prepare("INSERT INTO ev_collection_items VALUES(?,?)").run(
            c.id,
            req.body.meal,
          );
      });
      return send(req, res);
    }
    if (
      typeof req.body.name !== "string" ||
      !req.body.name.trim() ||
      req.body.name.length > 80
    )
      return reject(res, "Enter a collection name (1–80 characters).");
    if (req.body.id)
      db.prepare(
        "UPDATE ev_collections SET name=? WHERE id=? AND visitor=?",
      ).run(req.body.name.trim(), req.body.id, id);
    else
      db.prepare("INSERT INTO ev_collections VALUES(?,?,?)").run(
        crypto.randomUUID(),
        id,
        req.body.name.trim(),
      );
    send(req, res);
  });
  app.post("/api/recipe-metadata", pro, (req, res) => {
    const { meal, baseServings, mealTypes } = req.body;
    if (
      !getMeals().some((m) => m.id === meal) ||
      !Number.isInteger(baseServings) ||
      baseServings < 1 ||
      baseServings > 20 ||
      !Array.isArray(mealTypes) ||
      !mealTypes.length ||
      mealTypes.some((t) => !SLOTS.includes(t))
    )
      return reject(
        res,
        "Set the original serving count and at least one meal type.",
      );
    db.prepare(
      "INSERT INTO ev_recipe_metadata VALUES(?,?) ON CONFLICT(meal) DO UPDATE SET payload=excluded.payload",
    ).run(meal, JSON.stringify({ baseServings, mealTypes }));
    res.json({ state: state(req.visitor), meals: getMeals() });
  });
  app.post("/api/suggestions", (req, res) => {
    const id = req.visitor,
      prefs =
        plan(id) === "pro"
          ? settings(id)
          : {
              category: ["all", "loss", "gain", "balance"].includes(
                req.body.category,
              )
                ? req.body.category
                : "all",
              avoid: [],
              origins: [],
            };
    const options = getMeals().filter(
      (m) =>
        (prefs.category === "all" || m.category === prefs.category) &&
        !matchesAvoid(m, prefs.avoid) &&
        (!prefs.origins.length || prefs.origins.includes(m.origin)),
    );
    if (!options.length)
      return reject(res, "No matching recipes. Broaden your preferences.");
    const pantryNames = plan(id) === "pro" ? pantry(id).map((p) => p.name) : [];
    options.sort(
      (a, b) =>
        b.ingredients_structured.filter((i) => pantryNames.includes(i.name))
          .length -
        a.ingredients_structured.filter((i) => pantryNames.includes(i.name))
          .length,
    );
    const best = pantryNames.length
      ? options.filter(
          (m) =>
            m.ingredients_structured.filter((i) => pantryNames.includes(i.name))
              .length ===
            options[0].ingredients_structured.filter((i) =>
              pantryNames.includes(i.name),
            ).length,
        )
      : options;
    res.json({
      meal: best[Math.floor(Math.random() * best.length)],
      personalized: plan(id) === "pro",
    });
  });
  return { state };
}
module.exports = { installPremium };
