const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const { DatabaseSync } = require("node:sqlite");
const { SQLiteStore, SupabaseStore, mutate } = require("../assistant/store");
const { authenticator, installDemo } = require("../assistant/auth");
const { installAssistant } = require("../assistant/service");
const { enrichMeal } = require("../ingredients");
const { metrics, ageOn, measurementsInMetric, validDate, totalNutrition, localDate, weekOf } = require("../assistant/nutrition");
const policy = require("../assistant/policy.json");
const nutrition = { status: "verified", reviewedBy: "fixture-reviewer", reviewedAt: "2026-10-01", sourceUrl: "https://fdc.nal.usda.gov/", baseServings: 2, perServing: { kcal: 200, protein: 20, carbohydrate: 10, fat: 8 }, allergensReviewed: true, dietTags: [], cookingMinutes: 20 };
const fixtures = () => Array.from({ length: 8 }, (_, i) => ({ ...enrichMeal({ id: "recipe-" + i, name: "Reviewed chicken " + i, origin: i % 2 ? "Vietnam" : "Italy", ingredients: ["200 g chicken breast", "100 ml milk"], image_url: "", }, { baseServings: 2, mealTypes: ["breakfast", "lunch", "dinner"] }), nutrition: structuredClone(nutrition) }));
async function harness(t, options = {}) {
  const db = new DatabaseSync(":memory:"), store = new SQLiteStore(db), app = express(); app.use(express.json());
  const meals = options.meals || fixtures();
  const client = { auth: { getUser: async token => token.startsWith("valid-") ? { data: { user: { id: token.slice(6) } }, error: null } : { data: { user: null }, error: new Error("invalid") } } };
  installDemo(app, store);
  installAssistant(app, { store, authenticate: authenticator({ store, client, demo: true }), getMeals: () => meals, pilotIds: ["alice", "bob", "eve"], ...options });
  const server = app.listen(0, "127.0.0.1"); await new Promise(resolve => server.once("listening", resolve));
  t.after(() => { server.close(); db.close(); });
  const url = "http://127.0.0.1:" + server.address().port;
  async function call(actor, path, body, method = body ? "POST" : "GET", headers = {}) {
    const response = await fetch(url + "/api/v1" + path, { method, headers: { "Content-Type": "application/json", ...(actor ? { Authorization: "Bearer valid-" + actor } : {}), ...headers }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, data: await response.json(), headers: response.headers };
  }
  async function profile(actor, patch = {}) { const result = await call(actor, "/profile", { name: actor, aiConsent: true, birthDate: "1990-04-01", formulaSex: "male", ...patch }, "PUT"); assert.equal(result.status, 200, JSON.stringify(result.data)); return result.data; }
  async function family() { await profile("alice"); await profile("bob"); const home = await call("alice", "/households", { name: "Test family" }); assert.equal(home.status, 201); const invite = await call("alice", "/invites", {}); const joined = await call("bob", "/invites/accept", { token: invite.data.token }); assert.equal(joined.status, 200, JSON.stringify(joined.data)); return home.data; }
  return { store, call, profile, family, meals, url };
}
test("BMI, units and birth-date boundaries are deterministic; unreviewed policies produce no targets", () => {
  const m = { heightCm: 170, weightKg: 70 }, p = { birthDate: "1990-04-01", formulaSex: "male", goal: "loss" };
  const actual = metrics(p, m, "2026-10-03", policy);
  assert.equal(actual.bmi, 24.2); assert.equal(actual.restingKcal, 1588); assert.equal(actual.targetKcal, null); assert.equal(actual.estimatedNeedKcal, null);
  const converted = measurementsInMetric({ units: "imperial", height: 170 / 2.54, weight: 70 / 0.45359237 });
  assert.ok(Math.abs(converted.weightKg - 70) < 1e-8); assert.equal(metrics(p, converted, "2026-10-03").bmi, actual.bmi);
  for (const age of [2, 17, 18, 19]) assert.equal(metrics({ ...p, birthDate: `${2026 - age}-10-03` }, m, "2026-10-03").bmiCategory, null);
  assert.equal(metrics({ ...p, birthDate: "2006-10-03" }, m, "2026-10-03").bmiCategory, "Healthy weight");
  assert.equal(ageOn("2008-10-04", "2026-10-03"), 17); assert.equal(validDate("2026-02-30"), false);
  assert.equal(metrics(p, null, "2026-10-03").restingKcal, null); assert.equal(metrics({ ...p, specialCare: true }, m, "2026-10-03").restingKcal, null);
  assert.throws(() => measurementsInMetric({ height: 0, weight: 70 }));
});
test("invalid tokens and client-supplied identity cannot access data; demo sessions are separate", async t => {
  const { call } = await harness(t);
  assert.equal((await call(null, "/today", null, "GET", { "x-visitor-id": "alice", Authorization: "Bearer forged" })).status, 401);
  assert.equal((await call(null, "/today")).status, 401);
  const demo = await call(null, "/demo-session", {}); const cookie = demo.headers.get("set-cookie").split(";")[0];
  const view = await call(null, "/today", null, "GET", { Cookie: cookie }); assert.equal(view.status, 200); assert.equal(view.data.demo, true); assert.match(view.data.profile.id, /^demo-/);
  assert.equal((await call(null, "/today", null, "GET", { Cookie: "eatvibing_demo=" + "a".repeat(64) })).status, 401);
});
test("profiles reject cross-account writes, preserve measurement history and allow corrections", async t => {
  const { call, profile } = await harness(t); await profile("alice"); await profile("bob");
  assert.equal((await call("bob", "/profile?memberId=alice")).status, 404);
  assert.equal((await call("bob", "/profile", { memberId: "alice", name: "hacked" }, "PUT")).status, 404);
  const date = localDate();
  const one = await call("alice", "/measurements", { date, height: 170, weight: 70, units: "metric" });
  const two = await call("alice", "/measurements", { date, height: 170, weight: 69, units: "metric" }); assert.equal(two.status, 201);
  await call("alice", "/measurements", { id: one.data.id, date, height: 170, weight: 71, units: "metric" });
  const p = await call("alice", "/profile"); assert.equal(p.data.measurements.length, 2); assert.equal(p.data.measurements.find(m => m.id === one.data.id).weightKg, 71);
  assert.equal((await call("alice", "/measurements", { date: "2099-01-01", height: 170, weight: 70 })).status, 400);
});
test("family invitations are single-use; adult body history is private and consent withdrawal invalidates context", async t => {
  const { call, family, store } = await harness(t); await family();
  await call("alice", "/measurements", { date: localDate(), height: 170, weight: 70 });
  const hidden = await call("bob", "/profile?memberId=alice"); assert.equal(hidden.data.metrics, undefined); assert.equal(hidden.data.birthDate, undefined);
  await call("alice", "/profile", { sharing: { portions: true, goals: false, body: true } }, "PUT");
  const shared = await call("bob", "/profile?memberId=alice"); assert.equal(shared.data.metrics.bmi, 24.2); assert.equal(shared.data.goal, undefined);
  await call("bob", "/assistant/messages", { prompt: "Help me choose dinner", memberId: "alice" }); assert.equal((await call("bob", "/assistant/messages")).data.length, 2);
  await call("alice", "/profile", { sharing: { portions: false, goals: false, body: false } }, "PUT");
  assert.equal((await call("bob", "/assistant/messages")).data.length, 0);
  const revoked = await call("bob", "/profile?memberId=alice"); assert.equal(revoked.data.metrics, undefined); assert.equal(revoked.data.allergies, undefined);
  const { data } = await store.read(); assert.equal(Object.values(data.invites)[0].used, true);
});
test("child records belong to the guardian; no adult BMI category or weight-loss goals", async t => {
  const { call, family } = await harness(t); await family();
  const date = localDate(), year = Number(date.slice(0, 4)), birthDate = `${year - 6}-01-01`;
  const child = await call("alice", "/members", { name: "Child", birthDate }); assert.equal(child.status, 201);
  const id = child.data.id;
  assert.equal((await call("bob", "/profile", { memberId: id, name: "changed" }, "PUT")).status, 403);
  assert.equal((await call("alice", "/profile", { memberId: id, goal: "loss" }, "PUT")).status, 400);
  assert.equal((await call("alice", "/measurements", { memberId: id, date, height: 115, weight: 21 })).status, 201);
  assert.equal((await call("alice", "/profile?memberId=" + id)).data.metrics.bmiCategory, null);
  const result = await call("alice", "/assistant/messages", { memberId: id, prompt: "Help my child lose weight with a calorie deficit" }); assert.equal(result.data.providerStatus, "policy"); assert.match(result.data.answer, /do not prescribe/);
  assert.equal((await call("alice", "/members", { name: "Infant", birthDate: `${year - 1}-01-01` })).status, 400);
});
test("multi-dish proposals require confirmation, use participant servings and pantry subtraction; confirmation is idempotent", async t => {
  const { call, family, store } = await harness(t); await family(); const date = localDate();
  const preview = await call("alice", "/plan-proposals", { date, slots: ["dinner"], selections: { dinner: [{ mealId: "recipe-0", portions: { alice: 1, bob: 0.5 } }, { mealId: "recipe-1", portions: { alice: 1, bob: 1 } }] } });
  assert.equal(preview.status, 201); assert.equal(preview.data.entries[0].nutrition.values.kcal, 700);
  assert.equal((await store.read()).data.plans[preview.data.scope + ":" + date], undefined);
  assert.equal((await call("bob", `/plan-proposals/${preview.data.id}/confirm`, {})).status, 404);
  const first = await call("alice", `/plan-proposals/${preview.data.id}/confirm`, {}); assert.equal(first.status, 200);
  const repeat = await call("alice", `/plan-proposals/${preview.data.id}/confirm`, {}); assert.deepEqual(repeat.data, first.data);
  await call("alice", "/pantry", { text: "100 g chicken breast" });
  const groceries = await call("alice", "/groceries?start=" + weekOf(date)); assert.equal(groceries.data.items.find(i => i.name === "chicken breast").needed, 250);
});
test("stale preferences, allergies, expired proposals and withdrawn participation cannot save", async t => {
  const { call, family, store } = await harness(t); await family(); const date = localDate();
  const p = await call("alice", "/plan-proposals", { date });
  await call("bob", "/profile", { avoid: ["chicken"] }, "PUT"); assert.equal((await call("alice", `/plan-proposals/${p.data.id}/confirm`, {})).status, 409);
  await call("bob", "/profile", { avoid: [] }, "PUT");
  const next = await call("alice", "/plan-proposals", { date }); await mutate(store, s => { s.proposals[next.data.id].expires = 0; });
  assert.equal((await call("alice", `/plan-proposals/${next.data.id}/confirm`, {})).status, 409);
  const last = await call("alice", "/plan-proposals", { date }); await call("bob", "/profile", { sharing: { portions: false, goals: false, body: false } }, "PUT");
  assert.equal((await call("alice", `/plan-proposals/${last.data.id}/confirm`, {})).status, 409);
  assert.equal(Object.keys((await store.read()).data.plans).length, 0);
});
test("locked allergy conflicts and unreviewed allergen/diet metadata fail closed", async t => {
  const meals = fixtures(); meals[0].nutrition = null;
  const { call, profile } = await harness(t, { meals }); await profile("alice", { allergies: ["peanut"] });
  assert.equal((await call("alice", "/plan-proposals", { date: localDate(), slots: ["dinner"], selections: { dinner: [{ mealId: "recipe-0", portions: { alice: 1 } }] } })).status, 409);
  const p = await call("alice", "/plan-proposals", { date: localDate(), slots: ["dinner"] }); assert.equal(p.status, 201);
  await call("alice", `/plan-proposals/${p.data.id}/confirm`, {}); await call("alice", "/plans/lock", { date: localDate(), slot: "dinner", locked: true });
  await call("alice", "/profile", { allergies: ["milk"] }, "PUT");
  assert.equal((await call("alice", "/plan-proposals", { date: localDate(), slots: ["dinner"] })).status, 409);
});
test("weekly proposals commit atomically and swaps exclude the current recipe", async t => {
  const { call, profile, store } = await harness(t); await profile("alice"); const start = weekOf(localDate());
  const week = await call("alice", "/weekly-proposals", { start }); assert.equal(week.status, 201); assert.equal(week.data.days.length, 7);
  await call("alice", "/check-ins", { date: week.data.days[6].date, dayActivity: "light", activityStatus: "planned", activity: "Walk", activityMinutes: 20, cookingMinutes: 30, locations: { breakfast: "home", lunch: "outside", dinner: "home" } });
  assert.equal((await call("alice", `/plan-proposals/${week.data.id}/confirm`, {})).status, 409); assert.equal(Object.keys((await store.read()).data.plans).length, 0);
  const fresh = await call("alice", "/weekly-proposals", { start }); assert.equal((await call("alice", `/plan-proposals/${fresh.data.id}/confirm`, {})).status, 200);
  assert.equal(Object.keys((await store.read()).data.plans).length, 7);
  const oldMeal = (await store.read()).data.plans["alice:" + start].entries.find(e => e.slot === "dinner").dishes[0].mealId;
  const swap = await call("alice", "/plan-proposals", { date: start, slots: ["dinner"], swap: true }); assert.notEqual(swap.data.entries[0].dishes[0].mealId, oldMeal);
});
test("planned exercise stays planned, school meals unknown and incomplete diary has no total target", async t => {
  const { call, profile } = await harness(t); await profile("alice"); const date = localDate();
  await call("alice", "/check-ins", { date, dayActivity: "moderate", activityStatus: "planned", activity: "Gym", activityMinutes: 45, cookingMinutes: 20, locations: { breakfast: "home", lunch: "outside", dinner: "home" } });
  await call("alice", "/meal-logs", { date, slot: "lunch", status: "unknown" });
  const view = await call("alice", "/today"); assert.equal(view.data.checkIn.activityStatus, "planned"); assert.equal(view.data.intake.complete, false); assert.equal(view.data.intake.values, null); assert.equal(view.data.metrics.targetKcal, null);
  const p = await call("alice", "/plan-proposals", { date }); assert.equal(p.data.entries.some(e => e.slot === "lunch"), false);
});
test("provider receives only permitted context and current history; numeric prose is filtered and errors fall back", async t => {
  const calls = []; const { call, family } = await harness(t, { provider: async request => { calls.push(request); return "Eat 900 kcal each day"; } }); await family();
  const ambiguous = await call("bob", "/assistant/messages", { prompt: "Help with cooking" }); assert.deepEqual(ambiguous.data.missingInformation, ["memberId"]); assert.equal(calls.length, 0);
  const result = await call("bob", "/assistant/messages", { prompt: "Help with cooking", memberId: "alice" }); assert.equal(result.data.providerStatus, "filtered"); assert.equal(calls[0].context.member.measurements, undefined); assert.equal(calls[0].context.member.metrics, undefined); assert.equal(calls[0].context.logs.length, 0);
  assert.equal((await call("eve", "/assistant/messages", { prompt: "Help with cooking", memberId: "alice" })).status, 404);
});
test("nutrition totals never certify missing data; reviewer writes require server authorization", async t => {
  const meals = fixtures(); meals[0].nutrition = null; assert.equal(totalNutrition([{ mealId: meals[0].id, portions: { alice: 1 } }], meals).values, null);
  const { call } = await harness(t, { meals }); assert.equal((await call("alice", "/nutrition/recipe-0", nutrition, "PUT")).status, 403);
  const readiness = await call("alice", "/nutrition/readiness"); assert.equal(readiness.data.ready, false);
});
test("store retries conflicts without partial writes; Supabase errors are sanitized", async () => {
  const db = new DatabaseSync(":memory:"), store = new SQLiteStore(db);
  const result = await Promise.all([mutate(store, s => { s.events.push({ type: "one" }); return 1; }), mutate(store, s => { s.events.push({ type: "two" }); return 2; })]); assert.deepEqual(result, [1, 2]); assert.equal((await store.read()).data.events.length, 2); db.close();
  const hosted = new SupabaseStore({ from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ error: { message: "secret" } }) }) }) }) });
  await assert.rejects(() => hosted.read(), error => !error.message.includes("secret"));
});

test("approved energy estimates require reviewed bounds; exercise is not added a second time", () => {
  const p = { birthDate: "1990-04-01", formulaSex: "male", goal: "loss", activity: "moderate" }, m = { heightCm: 170, weightKg: 70 };
  const approved = { status: "approved", version: "test-policy-only", reviewedBy: "fixture", reviewedAt: "2026-10-01", activityFactors: { moderate: 1.5 }, adjustments: { loss: -200 }, weightGoalsEnabled: true, energyBounds: { minimumKcal: 1600, maximumKcal: 3000 } };
  const result = metrics(p, m, "2026-10-03", approved);
  assert.equal(result.estimatedNeedKcal, 2381); assert.equal(result.targetKcal, 2181);
  assert.equal(metrics(p, m, "2026-10-03", { ...approved, energyBounds: null }).targetKcal, null);
  assert.equal(metrics(p, m, "2026-10-03", { ...approved, energyBounds: { minimumKcal: 2300, maximumKcal: 3000 } }).targetKcal, null);
  assert.equal(metrics({ ...p, birthDate: "2007-10-03" }, m, "2026-10-03", approved).estimatedNeedKcal, null);
  assert.throws(() => measurementsInMetric({ units: "invalid", height: 170, weight: 70 }));
});

test("pediatric interpretation requires an approved policy and matching reference version and hash", () => {
  const { bmiForAge, VERSION } = require("../assistant/pediatric");
  // Synthetic percentile bands exercise gating only; these are not clinical reference data.
  const reference = { version: VERSION, sha256: "fixture-hash", source: "fixture", rows: [{ sex: 1, agemos: 72.5, p5: 12, p85: 18, p95: 20 }] };
  const approved = { status: "approved", reviewedBy: "fixture", reviewedAt: "2026-10-01", pediatricInterpretationEnabled: true, pediatricReference: reference, pediatricReferenceSha256: "fixture-hash" };
  const child = { birthDate: "2020-10-03", formulaSex: "male" }, m = { heightCm: 115, weightKg: 21 };
  assert.equal(bmiForAge(child, m, "2026-10-03", approved).band, "5th to below 85th percentile");
  assert.equal(bmiForAge(child, m, "2026-10-03", { ...approved, status: "draft" }), null);
  assert.equal(bmiForAge(child, m, "2026-10-03", { ...approved, pediatricReferenceSha256: "changed" }), null);
  assert.equal(bmiForAge({ ...child, formulaSex: "unspecified" }, m, "2026-10-03", approved), null);
  assert.equal(bmiForAge({ ...child, birthDate: "2006-10-03" }, m, "2026-10-03", approved), null);
});

test("grocery checks persist only for current quantities and reject stale updates", async t => {
  const { call, profile } = await harness(t); await profile("alice"); const date = localDate(), start = weekOf(date);
  const preview = await call("alice", "/plan-proposals", { date, slots: ["dinner"] });
  await call("alice", `/plan-proposals/${preview.data.id}/confirm`, {});
  const cart = (await call("alice", "/groceries?start=" + start)).data, item = cart.items.find(i => !i.covered);
  assert.equal((await call("alice", "/groceries/check", { start, signature: cart.signature, key: item.key, checked: true })).status, 200);
  assert.equal((await call("alice", "/groceries?start=" + start)).data.items.find(i => i.key === item.key).checked, true);
  await call("alice", "/pantry", { text: "10 g chicken breast" });
  assert.equal((await call("alice", "/groceries/check", { start, signature: cart.signature, key: item.key, checked: true })).status, 409);
  assert.equal((await call("alice", "/groceries?start=" + start)).data.items.some(i => i.checked), false);
});

test("chat planning previews tomorrow without provider calls; ambiguous weeks require date selection", async t => {
  let providerCalls = 0;
  const { call, profile, store } = await harness(t, { provider: async () => { providerCalls++; throw new Error("offline"); } }); await profile("alice");
  const tomorrow = new Date(localDate() + "T12:00:00Z"); tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const result = await call("alice", "/assistant/messages", { prompt: "Suggest dinner tomorrow" });
  assert.equal(result.data.proposal.date, tomorrow.toISOString().slice(0, 10)); assert.equal(providerCalls, 0);
  assert.equal(Object.keys((await store.read()).data.plans).length, 0);
  const week = await call("alice", "/assistant/messages", { prompt: "Gợi ý thực đơn tuần sau" });
  assert.equal(week.data.providerStatus, "date-required"); assert.equal(week.data.proposal, null);
  assert.equal((await call("alice", "/assistant/messages", { prompt: "Help with cooking" })).data.providerStatus, "unavailable");
  await call("alice", "/profile", { aiConsent: false }, "PUT");
  const withoutConsent = await call("alice", "/assistant/messages", { prompt: "Help with cooking" });
  assert.equal(withoutConsent.data.providerStatus, "consent-required"); assert.equal(providerCalls, 1);
});

test("future activity cannot be completed; confirmed home meals can be removed through an away-day preview", async t => {
  const { call, profile } = await harness(t); await profile("alice"); const date = localDate();
  const preview = await call("alice", "/plan-proposals", { date }); await call("alice", `/plan-proposals/${preview.data.id}/confirm`, {});
  const body = { date, dayActivity: "light", activityStatus: "planned", activity: "Walk", activityMinutes: 20, cookingMinutes: 30, locations: { breakfast: "outside", lunch: "outside", dinner: "outside" } };
  assert.equal((await call("alice", "/check-ins", body)).status, 200);
  const away = await call("alice", "/plan-proposals", { date }); assert.equal(away.status, 201); assert.equal(away.data.entries.length, 0);
  assert.equal((await call("alice", `/plan-proposals/${away.data.id}/confirm`, {})).data.entries.length, 0);
  const tomorrow = new Date(date + "T12:00:00Z"); tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  assert.equal((await call("alice", "/check-ins", { ...body, date: tomorrow.toISOString().slice(0, 10), activityStatus: "completed" })).status, 400);
});

test("demo imports preview explicit owner portions and never import visitor identity or write plans automatically", async t => {
  const { call, family, store } = await harness(t); await family(); const date = localDate();
  const result = await call("alice", "/demo-imports", { userId: "eve", visitorId: "bob", days: [{ date, entries: [{ slot: "dinner", dishes: [{ mealId: "recipe-0", servings: 1.5, portions: { eve: 8 } }] }] }] });
  assert.equal(result.status, 201); assert.deepEqual(result.data.days[0].entries[0].dishes[0].portions, { alice: 1.5 });
  assert.equal(Object.keys((await store.read()).data.plans).length, 0);
  assert.equal((await call("alice", `/plan-proposals/${result.data.id}/confirm`, {})).status, 200);
  assert.equal((await call("alice", "/demo-imports", { days: [{ date, entries: [{ slot: "dinner", dishes: [{ mealId: "missing", servings: 1 }] }] }] })).status, 409);
  assert.equal(Object.keys((await store.read()).data.plans).length, 1);
});

test("recipe energy allocation needs approved meal shares, reviewed data and serving bounds", () => {
  const { allocateRecipeServings } = require("../assistant/nutrition");
  const approved = { status: "approved", reviewedBy: "fixture", reviewedAt: "2026-10-01", mealShares: { breakfast: 0.25, lunch: 0.35, dinner: 0.4 }, recipeServingBounds: { minimum: 0.5, maximum: 4 } };
  assert.equal(allocateRecipeServings(2000, fixtures()[0], "dinner", approved), 4);
  assert.equal(allocateRecipeServings(2500, fixtures()[0], "dinner", approved), null);
  assert.equal(allocateRecipeServings(2000, fixtures()[0], "dinner", policy), null);
  assert.equal(allocateRecipeServings(2000, { ...fixtures()[0], nutrition: null }, "dinner", approved), null);
  assert.equal(allocateRecipeServings(null, fixtures()[0], "dinner", approved), null);
});

test("separate households cannot read each other's profiles, proposals, pantry, plans or chat", async t => {
  const { call, family, profile } = await harness(t); await family(); await profile("eve");
  assert.equal((await call("eve", "/households", { name: "Separate family" })).status, 201);
  const p = await call("alice", "/plan-proposals", { date: localDate() }); await call("alice", `/plan-proposals/${p.data.id}/confirm`, {});
  await call("alice", "/pantry", { text: "100 g chicken breast" });
  await call("alice", "/assistant/messages", { prompt: "Help with cooking", memberId: "alice" });
  assert.equal((await call("eve", "/profile?memberId=alice")).status, 404);
  assert.equal((await call("eve", `/plan-proposals/${p.data.id}/confirm`, {})).status, 404);
  assert.deepEqual((await call("eve", "/plans")).data, []); assert.deepEqual((await call("eve", "/pantry")).data, []);
  assert.deepEqual((await call("eve", "/assistant/messages")).data, []);
  assert.equal((await call("eve", "/assistant/messages", { prompt: "Help with cooking", memberId: "bob" })).status, 404);
});

test("a guardian leaving a family retains the child record while former members lose access", async t => {
  const { call, family } = await harness(t); await family();
  const child = await call("alice", "/members", { name: "Child", birthDate: `${Number(localDate().slice(0, 4)) - 6}-01-01` });
  assert.equal(child.status, 201);
  assert.equal((await call("alice", "/households/transfer", { memberId: "bob" })).status, 200);
  assert.equal((await call("alice", "/households/leave", {})).status, 200);
  assert.equal((await call("alice", "/profile?memberId=" + child.data.id)).data.editable, true);
  assert.equal((await call("bob", "/profile?memberId=" + child.data.id)).status, 404);
  assert.equal((await call("alice", "/households", { name: "New household" })).status, 201);
  assert.equal((await call("alice", "/today")).data.members.some(m => m.id === child.data.id), true);
});

test("authorized reviewers import sources and review recipe data without opening access to other users", async t => {
  const { call } = await harness(t, { adminIds: ["alice"] });
  assert.equal((await call("bob", "/nutrition/reviewer")).status, 403);
  const recipe = await call("alice", "/recipe-imports", { name: "Source fixture", origin: "Vietnam", sourceUrl: "https://example.org/fixture", ingredients: ["200 g chicken breast"], steps: ["Fixture instruction"] });
  assert.equal(recipe.status, 201);
  assert.equal((await call("alice", "/nutrition/" + recipe.data.id, nutrition, "PUT")).status, 200);
  const reviewed = (await call("alice", "/catalog")).data.meals.find(m => m.id === recipe.data.id);
  assert.equal(reviewed.nutrition.reviewedBy, "alice"); assert.equal(reviewed.nutrition.perServing.kcal, 200);
  assert.equal((await call("bob", "/pilot/metrics")).status, 403);
  const report = await call("alice", "/pilot/metrics"); assert.equal(report.status, 200); assert.equal(report.data.p95ResponseMs, null);
  assert.equal(report.data.profiles, undefined); assert.equal(report.data.messages, undefined);
});

test("chat status distinguishes missing setup from consent and does not expose server credentials", async t => {
  const { providerConfiguration, createProvider } = require("../assistant/provider");
  assert.equal(providerConfiguration({}), "not-configured");
  assert.equal(providerConfiguration({ LLM7_API_KEY: "secret", LLM7_BASE_URL: "https://example.org" }), "not-enabled");
  assert.equal(createProvider({}), null);
  const { call, profile } = await harness(t); await profile("alice");
  const status = await call("alice", "/assistant/status");
  assert.equal(status.data.provider, "not-configured"); assert.equal(status.data.ready, false);
  assert.equal(status.data.apiKey, undefined);
  const reply = await call("alice", "/assistant/messages", { prompt: "Tell me a kitchen tip" });
  assert.equal(reply.data.providerStatus, "offline"); assert.match(reply.data.answer, /not connected/);
});

test("numbered cooking steps pass through while nutritional targets and empty replies do not", async t => {
  const { call, profile } = await harness(t, { provider: async ({ prompt }) => prompt === "Empty reply" ? { answer: "" } : "1. Rinse the rice.\n2. Cook gently for 20 minutes." });
  await profile("alice");
  assert.equal((await call("alice", "/assistant/status")).data.ready, true);
  const reply = await call("alice", "/assistant/messages", { prompt: "Give me cooking steps" });
  assert.equal(reply.data.providerStatus, "available"); assert.match(reply.data.answer, /20 minutes/);
  const empty = await call("alice", "/assistant/messages", { prompt: "Empty reply" });
  assert.equal(empty.data.providerStatus, "unavailable"); assert.match(empty.data.answer, /could not reply/);
  await call("alice", "/profile", { aiConsent: false }, "PUT");
  assert.equal((await call("alice", "/assistant/status")).data.ready, false);
});

test("provider plan contains only the selected consenting member's dishes and nutrition", async t => {
  const requests = [];
  const { call, family } = await harness(t, { provider: async request => { requests.push(request); return "Cook gently."; } });
  await family(); await call("bob", "/profile", { aiConsent: false }, "PUT");
  const date = localDate();
  const preview = await call("alice", "/plan-proposals", { date, slots: ["dinner"], selections: { dinner: [
    { mealId: "recipe-0", portions: { alice: 1, bob: 3 } },
    { mealId: "recipe-1", portions: { bob: 4 } },
  ] } });
  assert.equal((await call("alice", `/plan-proposals/${preview.data.id}/confirm`, {})).status, 200);
  const reply = await call("alice", "/assistant/messages", { memberId: "alice", prompt: "Tell me a kitchen tip" });
  assert.equal(reply.status, 200); assert.equal(requests.length, 1);
  const plan = requests[0].context.plan;
  assert.equal(plan.scope, undefined); assert.equal(plan.entries[0].participants, undefined);
  assert.deepEqual(plan.entries[0].dishes, [{ mealId: "recipe-0", name: "Reviewed chicken 0", servings: 1 }]);
  assert.equal(plan.entries[0].nutrition.values.kcal, 200);
  assert.equal(plan.entries[0].nutritionByMember, undefined);
  assert.equal(JSON.stringify(requests[0].context).includes('"bob"'), false);
  assert.equal((await call("alice", "/assistant/messages", { memberId: "bob", prompt: "Tell me a kitchen tip" })).data.providerStatus, "consent-required");
  assert.equal(requests.length, 1);
});

test("provider history is reused only with the same current member context", async t => {
  const requests = [];
  const { call, profile, store } = await harness(t, { provider: async request => { requests.push(request); return "Use fresh ingredients."; } });
  await profile("alice");
  for (let i = 0; i < 2; i++) assert.equal((await call("alice", "/assistant/messages", { prompt: "Tell me a kitchen tip" })).status, 200);
  assert.equal(requests[0].history.length, 0); assert.equal(requests[1].history.length, 2);
  await mutate(store, s => { for (const m of s.messages.alice) delete m.contextStamp; });
  assert.equal((await call("alice", "/assistant/messages", { prompt: "Tell me a kitchen tip" })).status, 200);
  assert.equal(requests[2].history.length, 0);
  await call("alice", "/profile", { allergies: ["milk"] }, "PUT");
  assert.equal((await call("alice", "/assistant/messages", { prompt: "Tell me a kitchen tip" })).status, 200);
  assert.equal(requests[3].history.length, 0); assert.deepEqual(requests[3].context.member.allergies, ["milk"]);
});

test("in-flight provider replies are discarded when restrictions, consent or daily context change", async t => {
  for (const change of ["allergies", "avoid", "diet", "specialCare", "consent", "checkIn", "plan", "catalog"]) {
    await t.test(change, async sub => {
      let release, entered;
      const started = new Promise(resolve => { entered = resolve; });
      const paused = new Promise(resolve => { release = resolve; });
      const { call, profile, store, meals } = await harness(sub, { provider: async () => { entered(); await paused; return "Try milk in the sauce."; } });
      await profile("alice");
      const pending = call("alice", "/assistant/messages", { prompt: "Tell me a kitchen tip" });
      await started;
      try {
        if (change === "catalog") { meals[0].name = "Changed source recipe"; }
        else if (change === "plan") {
          const p = await call("alice", "/plan-proposals", { date: localDate(), slots: ["dinner"] });
          assert.equal((await call("alice", `/plan-proposals/${p.data.id}/confirm`, {})).status, 200);
        } else {
          const patch = change === "allergies" ? { allergies: ["milk"] } : change === "avoid" ? { avoid: ["milk"] } : change === "diet" ? { diet: "vegan" } : change === "specialCare" ? { specialCare: true } : { aiConsent: false };
          const updated = change === "checkIn" ? await call("alice", "/check-ins", { date: localDate(), dayActivity: "light", activityStatus: "planned", activity: "Walk", activityMinutes: 20, cookingMinutes: 15, locations: { breakfast: "home", lunch: "outside", dinner: "home" } }) : await call("alice", "/profile", patch, "PUT");
          assert.equal(updated.status, 200);
        }
      } finally { release(); }
      const result = await pending;
      assert.equal(result.status, 409); assert.match(result.data.error, /changed/);
      assert.equal(((await store.read()).data.messages.alice || []).length, 0);
    });
  }
});

test("withdrawn participation and departed members do not block groceries, locks or new proposals", async t => {
  for (const change of ["withdraw", "leave"]) {
    await t.test(change, async sub => {
      const { call, family, store } = await harness(sub); await family();
      const date = localDate(), start = weekOf(date);
      const preview = await call("alice", "/plan-proposals", { date, slots: ["dinner"], selections: { dinner: [
        { mealId: "recipe-0", portions: { alice: 1, bob: 2 } },
        { mealId: "recipe-1", portions: { bob: 1 } },
      ] } });
      assert.equal((await call("alice", `/plan-proposals/${preview.data.id}/confirm`, {})).status, 200);
      assert.equal((await call("alice", "/plans/lock", { date, slot: "dinner", locked: true })).status, 200);
      const before = await call("alice", "/groceries?start=" + start);
      const item = before.data.items.find(i => i.name === "chicken breast");
      assert.equal(item.needed, 400);
      assert.equal((await call("alice", "/groceries/check", { start, signature: before.data.signature, key: item.key, checked: true })).status, 200);
      const changed = change === "withdraw" ? await call("bob", "/profile", { sharing: { portions: false, goals: false, body: false } }, "PUT") : await call("bob", "/households/leave", {});
      assert.equal(changed.status, 200);
      const after = await call("alice", "/groceries?start=" + start);
      assert.equal(after.status, 200); assert.equal(after.data.items.find(i => i.name === "chicken breast").needed, 100);
      assert.equal(after.data.items.find(i => i.name === "chicken breast").checked, false);
      const plans = await call("alice", "/plans?start=" + start);
      assert.equal(plans.data[0].entries[0].dishes.length, 1);
      assert.deepEqual(plans.data[0].entries[0].dishes[0].portions, { alice: 1 });
      const breakfast = await call("alice", "/plan-proposals", { date, slots: ["breakfast"] });
      const confirmed = await call("alice", `/plan-proposals/${breakfast.data.id}/confirm`, {});
      assert.equal(confirmed.status, 200);
      assert.ok(confirmed.data.entries.every(e => e.dishes.every(d => d.portions.bob === undefined)));
      const next = await call("alice", "/plan-proposals", { date, slots: ["dinner"] });
      assert.equal(next.status, 201); assert.equal(next.data.entries[0].locked, true);
      assert.deepEqual(next.data.entries[0].participants, ["alice"]);
      assert.equal((await call("alice", "/plans/lock", { date, slot: "dinner", locked: false })).status, 200);
      const saved = (await store.read()).data.plans[preview.data.scope + ":" + date];
      assert.equal(saved.entries[0].locked, false); assert.deepEqual(saved.entries[0].dishes[0].portions, { alice: 1 });
      const week = await call("alice", "/weekly-proposals", { start });
      assert.equal(week.status, 201);
      assert.equal((await call("alice", `/plan-proposals/${week.data.id}/confirm`, {})).status, 200);
    });
  }
});

test("slots with no permitted participants disappear and can be unlocked; allergy conflicts still reject locks", async t => {
  const { call, family } = await harness(t); await family(); const date = localDate();
  const p = await call("alice", "/plan-proposals", { date, slots: ["dinner"], selections: { dinner: [{ mealId: "recipe-0", portions: { bob: 1 } }] } });
  await call("alice", `/plan-proposals/${p.data.id}/confirm`, {});
  await call("alice", "/plans/lock", { date, slot: "dinner", locked: true });
  await call("bob", "/profile", { sharing: { portions: false, goals: false, body: false } }, "PUT");
  assert.deepEqual((await call("alice", "/groceries")).data.items, []);
  assert.deepEqual((await call("alice", "/plans")).data[0].entries, []);
  assert.equal((await call("alice", "/plans/lock", { date, slot: "dinner", locked: false })).status, 200);
  const own = await call("alice", "/plan-proposals", { date, slots: ["dinner"] });
  await call("alice", `/plan-proposals/${own.data.id}/confirm`, {});
  await call("alice", "/profile", { allergies: ["milk"] }, "PUT");
  assert.equal((await call("alice", "/plans/lock", { date, slot: "dinner", locked: true })).status, 409);
  assert.equal((await call("alice", "/plans/lock", { date, slot: "dinner", locked: false })).status, 200);
});

test("previous-week reuse removes departed participants before creating a new week", async t => {
  const { call, family } = await harness(t); await family(); const start = weekOf(localDate());
  const week = await call("alice", "/weekly-proposals", { start });
  assert.equal((await call("alice", `/plan-proposals/${week.data.id}/confirm`, {})).status, 200);
  assert.equal((await call("bob", "/households/leave", {})).status, 200);
  const next = new Date(start + "T12:00:00Z"); next.setUTCDate(next.getUTCDate() + 7);
  const reused = await call("alice", "/weekly-proposals", { start: next.toISOString().slice(0, 10), reusePrevious: true });
  assert.equal(reused.status, 201);
  assert.ok(reused.data.days.every(day => day.entries.every(e => e.dishes.every(d => Object.keys(d.portions).join() === "alice"))));
  assert.equal((await call("alice", `/plan-proposals/${reused.data.id}/confirm`, {})).status, 200);
});
