const { randomUUID, randomBytes } = require("node:crypto");
const { mutate } = require("./store");
const { hash } = require("./auth");
const { localDate, validDate, ageOn, weekOf, measurementsInMetric, metrics, verifiedNutrition, totalNutrition, allocateRecipeServings } = require("./nutrition");
const { matchesAvoid, parseIngredient, grocery, clean } = require("../ingredients");
const defaultPolicy = require("./policy.json");
const { safetyResponse } = require("./safety");
const { searchFoods } = require("./fdc");
const { planningIntent } = require("./intents");
const SLOTS = ["breakfast", "lunch", "dinner"];
const GOALS = ["balanced", "maintain", "gain", "loss"];
const fail = (message, status = 400) => { const e = new Error(message); e.status = status; throw e; };
const text = (v, max = 120) => { if (typeof v !== "string" || v.length > max) fail("Invalid text field."); return v.trim(); };
const list = v => { if (!Array.isArray(v) || v.length > 30) fail("Use at most 30 preferences."); return [...new Set(v.map(x => text(x, 100)).filter(Boolean))]; };
const uuid = () => randomUUID();
const freshProfile = id => ({ id, name: "You", birthDate: "", formulaSex: "unspecified", timezone: "Asia/Bangkok", units: "metric", goal: "balanced", targetWeightKg: null, activity: "sedentary", allergies: [], avoid: [], likes: [], dislikes: [], cuisines: [], diet: "any", cookingMinutes: 30, budget: "", equipment: [], mealsPerDay: 3, mealTimes: { breakfast: "08:00", lunch: "12:00", dinner: "19:00" }, eatingOut: "", usualActivity: "", usualActivityMinutes: 0, specialCare: false, aiConsent: false, sharing: { portions: true, goals: false, body: false }, portion: null });
function latest(s, id, date) { return (s.measurements[id] || []).filter(m => m.date <= date).sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt))[0] || null; }
function householdOf(s, actor) { return s.memberships[actor]?.householdId || null; }
function editable(s, actor, id, date) {
  void date;
  if (actor === id) return true;
  const p = s.profiles[id];
  const age = p ? ageOn(p.birthDate, localDate(s.profiles[actor]?.timezone || "Asia/Bangkok")) : null;
  return Boolean(p?.guardianId === actor && householdOf(s, id) === householdOf(s, actor) && age !== null && age < 18);
}
function memberIds(s, actor) {
  const home = householdOf(s, actor);
  return home ? Object.keys(s.memberships).filter(id => s.memberships[id].householdId === home) : [actor, ...Object.keys(s.profiles).filter(id => s.profiles[id].guardianId === actor && !householdOf(s, id))];
}
function visibleProfile(s, actor, id, date, policy) {
  const p = s.profiles[id] || freshProfile(id);
  if (p.guardianId && ageOn(p.birthDate, localDate(s.profiles[actor]?.timezone || "Asia/Bangkok")) >= 18) return { id, name: p.name, child: false, editable: false, needsAdultTransition: true, sharing: { portions: false, goals: false, body: false } };
  const owner = editable(s, actor, id, date);
  const visible = { id, name: p.name, child: Boolean(p.guardianId), editable: owner, sharing: p.sharing };
  if (owner) return { ...p, editable: true, child: Boolean(p.guardianId), measurements: s.measurements[id] || [], metrics: metrics(p, latest(s, id, date), date, policy) };
  if (p.sharing.portions) Object.assign(visible, { allergies: p.allergies, avoid: p.avoid, diet: p.diet, likes: p.likes, dislikes: p.dislikes, cuisines: p.cuisines, portion: p.portion });
  if (p.sharing.goals) visible.goal = p.goal;
  if (p.sharing.body) {
    const values = metrics(p, latest(s, id, date), date, policy);
    Object.assign(visible, { measurements: s.measurements[id] || [], metrics: { bmi: values.bmi, bmiCategory: values.bmiCategory, bmiNote: values.bmiNote } });
  }
  return visible;
}
function accessStamp(s, actor) {
  return hash(JSON.stringify(memberIds(s, actor).map(id => [id, s.memberships[id], s.profiles[id]?.sharing, s.profiles[id]?.aiConsent])));
}
function ownProfile(s, actor) { return s.profiles[actor] || freshProfile(actor); }
function currentDate(s, actor) { return localDate(ownProfile(s, actor).timezone); }
function checkDate(value) { if (!validDate(value)) fail("Use a real date in YYYY-MM-DD format."); return value; }
function scopeKey(s, actor) { return householdOf(s, actor) || actor; }
function snapshot(s, actor, date, meals) {
  const key = scopeKey(s, actor);
  return hash(JSON.stringify({
    profiles: memberIds(s, actor).map(id => [id, s.profiles[id], latest(s, id, date), s.checkIns[id + ":" + date]]),
    plan: s.plans[key + ":" + date], pantry: s.pantry[key],
    recipes: meals.map(m => [m.id, m.ingredients, m.baseServings, m.nutrition, m.mealTypes]),
  }));
}
function catalogWithNutrition(s, meals) {
  const ids = new Set(meals.map(m => m.id));
  const imported = Object.values(s.recipeCatalog || {}).filter(m => !ids.has(m.id));
  return [...meals, ...imported].map(m => ({ ...m, nutrition: s.nutrition[m.id] || m.nutrition || null, baseServings: s.nutrition[m.id]?.baseServings || m.baseServings }));
}
function memberAllowed(s, actor, id, date, write = false) {
  if (!memberIds(s, actor).includes(id)) fail("Member is unavailable.", 404);
  if (write && !editable(s, actor, id, date)) fail("Only this member or their guardian can make this change.", 403);
}
function canPlan(s, actor, id, date) {
  const p = s.profiles[id];
  if (p?.guardianId && ageOn(p.birthDate, localDate(s.profiles[actor]?.timezone || "Asia/Bangkok")) >= 18) return false;
  return editable(s, actor, id, date) || p?.sharing.portions === true;
}
function validateDishes(s, actor, date, dishes, meals) {
  if (!Array.isArray(dishes) || !dishes.length || dishes.length > 8) fail("Choose between one and eight dishes.");
  const participants = new Set();
  for (const dish of dishes) {
    const meal = meals.find(m => m.id === dish.mealId);
    if (!meal) fail("A recipe is unavailable.", 409);
    if (!dish.portions || typeof dish.portions !== "object" || Array.isArray(dish.portions) || !Object.keys(dish.portions).length) fail("Specify who is eating and their portions.");
    for (const [id, portion] of Object.entries(dish.portions)) {
      memberAllowed(s, actor, id, date);
      if (!canPlan(s, actor, id, date)) fail("A member has not shared meal-planning preferences.", 403);
      if (!Number.isFinite(portion) || portion <= 0 || portion > 10) fail("Portions must be greater than zero and no more than ten.");
      participants.add(id);
      const p = s.profiles[id] || freshProfile(id);
      if (matchesAvoid(meal, [...p.allergies, ...p.avoid])) fail("This recipe conflicts with a participant's avoided ingredients.", 409);
      if (p.allergies.length && meal.nutrition?.allergensReviewed !== true) fail("This recipe needs ingredient/allergen review before it can be planned for this member.", 409);
      if (p.diet !== "any" && !meal.nutrition?.dietTags?.includes(p.diet)) fail("This recipe's dietary suitability has not been verified.", 409);
    }
  }
  return [...participants];
}
function proposal(s, actor, date, slots, meals, selections, swap = false, used = new Set(), policy = defaultPolicy) {
  const ids = memberIds(s, actor).filter(id => canPlan(s, actor, id, date));
  if (!ids.length) fail("Share meal preferences before planning.");
  const entries = [];
  const existing = projectPlan(s, actor, s.plans[scopeKey(s, actor) + ":" + date], date)?.entries || [];
  for (const slot of slots) {
    const locked = existing.find(e => e.slot === slot && e.locked);
    if (locked) { validateDishes(s, actor, date, locked.dishes, meals); entries.push(locked); for (const d of locked.dishes) used.add(d.mealId); continue; }
    let dishes = selections?.[slot];
    if (!dishes) {
      const participants = ids.filter(id => {
        const ci = s.checkIns[id + ":" + date];
        return (editable(s, actor, id, date) || s.profiles[id]?.sharing.portions) && (!ci || ci.locations[slot] === "home");
      });
      if (!participants.length) continue;
      const choices = meals.filter(m => (m.mealTypes || SLOTS).includes(slot) && (!swap || !existing.find(e => e.slot === slot)?.dishes.some(d => d.mealId === m.id))).filter(m => participants.every(id => {
        const p = s.profiles[id] || freshProfile(id);
        return !matchesAvoid(m, [...p.allergies, ...p.avoid]) && (!p.allergies.length || m.nutrition?.allergensReviewed === true) && (p.diet === "any" || m.nutrition?.dietTags?.includes(p.diet));
      }));
      const owner = ownProfile(s, actor);
      const ci = s.checkIns[actor + ":" + date];
      const minutes = ci?.cookingMinutes ?? owner.cookingMinutes;
      if (choices.length && choices.every(m => used.has(m.id))) for (const m of choices) used.delete(m.id);
      choices.sort((a, b) => {
        const score = m => {
          const pantry = s.pantry[scopeKey(s, actor)] || [];
          const feedback = Object.values(s.feedback).filter(f => f.actor === actor && f.mealId === m.id);
          const taste = participants.reduce((n, id) => {
            const p = s.profiles[id] || freshProfile(id), name = clean(m.name + " " + (m.original_name || ""));
            return n + (p.likes.some(x => x && name.includes(clean(x))) ? 3 : 0) - (p.dislikes.some(x => x && name.includes(clean(x))) ? 8 : 0);
          }, 0);
          return taste + (used.has(m.id) ? -20 : 0) + (m.nutrition?.cookingMinutes && m.nutrition.cookingMinutes <= minutes ? 4 : 0) +
            (owner.cuisines.some(c => clean(m.origin).includes(clean(c))) ? 3 : 0) +
            pantry.filter(p => m.ingredients_structured?.some(i => i.name === p.name)).length +
            feedback.reduce((n, f) => n + (f.rating === "like" ? 2 : -3), 0) +
            (verifiedNutrition(m) ? 2 : 0);
        };
        return score(b) - score(a) || a.id.localeCompare(b.id);
      });
      if (!choices.length) fail("No suitable recipes for " + slot + ". Your current plan was kept.", 409);
      const meal = choices[0]; used.add(meal.id);
      const verified = meals.filter(verifiedNutrition), vietnamese = verified.filter(m => /vietnam|viet nam/i.test(m.origin));
      const ready = vietnamese.length >= 30 && verified.length - vietnamese.length >= 30;
      dishes = [{ mealId: meal.id, portions: Object.fromEntries(participants.map(id => {
        const p = s.profiles[id] || freshProfile(id), ci = s.checkIns[id + ":" + date];
        const canUseTarget = !p.guardianId && (editable(s, actor, id, date) || (p.sharing.goals && p.sharing.body));
        const target = ready && canUseTarget ? metrics({ ...p, activity: ci?.dayActivity || p.activity }, latest(s, id, date), date, policy).targetKcal : null;
        return [id, p.portion || allocateRecipeServings(target, meal, slot, policy) || 1];
      })) }];
    }
    const participants = validateDishes(s, actor, date, dishes, meals);
    entries.push({ slot, dishes, participants, locked: false });
  }
  const p = { id: uuid(), actor, scope: scopeKey(s, actor), date, slots, entries, policyStamp: hash(JSON.stringify(policy)), stamp: snapshot(s, actor, date, meals), createdAt: new Date().toISOString(), expires: Date.now() + 3600000, status: "pending", note: entries.length ? "Portions are recipe servings for you to confirm, not a clinical recommendation. Nutrition is shown only where reviewed data is available." : "No home meals are planned for these slots. Confirming removes any unlocked home meals in these slots." };
  s.proposals[p.id] = p;
  return p;
}
function publicPlan(plan, meals) {
  if (!plan) return null;
  return { ...plan, entries: plan.entries.map(e => ({ ...e, nutrition: totalNutrition(e.dishes, meals), nutritionByMember: Object.fromEntries(e.participants.map(id => [id, totalNutrition(e.dishes, meals, id)])), dishes: e.dishes.map(d => ({ ...d, name: meals.find(m => m.id === d.mealId)?.name || "Unavailable recipe", image: meals.find(m => m.id === d.mealId)?.image_url, verified: verifiedNutrition(meals.find(m => m.id === d.mealId) || {}) })) })) };
}
function projectPlan(s, actor, plan, date) {
  if (!plan) return null;
  // Re-project on every request: old shared portions never bypass withdrawn consent.
  const safe = structuredClone(plan);
  const allowed = new Set(memberIds(s, actor).filter(id => canPlan(s, actor, id, date)));
  for (const entry of safe.entries) {
    for (const d of entry.dishes) d.portions = Object.fromEntries(Object.entries(d.portions).filter(([id]) => allowed.has(id)));
    entry.dishes = entry.dishes.filter(d => Object.keys(d.portions).length);
    entry.participants = [...new Set(entry.dishes.flatMap(d => Object.keys(d.portions)))];
  }
  safe.entries = safe.entries.filter(entry => entry.dishes.length);
  return safe;
}
function safePlan(s, actor, plan, meals, date) {
  return publicPlan(projectPlan(s, actor, plan, date), meals);
}
function conversationContext(s, actor, memberId, date, meals, policy) {
  const person = visibleProfile(s, actor, memberId, date, policy);
  const member = Object.fromEntries(["name", "child", "goal", "allergies", "avoid", "likes", "dislikes", "cuisines", "diet", "cookingMinutes", "equipment"].filter(k => person[k] !== undefined).map(k => [k, person[k]]));
  const sharedPlan = projectPlan(s, actor, s.plans[scopeKey(s, actor) + ":" + date], date);
  // Provider conversation concerns one consenting member. Never send household
  // identities, other members' portions, or household nutrition totals.
  const entries = (sharedPlan?.entries || []).map(entry => {
    const dishes = entry.dishes.filter(d => d.portions[memberId]).map(d => ({ mealId: d.mealId, portions: { [memberId]: d.portions[memberId] } }));
    return { slot: entry.slot, locked: entry.locked, dishes: dishes.map(d => ({ mealId: d.mealId, name: meals.find(m => m.id === d.mealId)?.name || "Unavailable recipe", servings: d.portions[memberId] })), nutrition: totalNutrition(dishes, meals, memberId) };
  }).filter(entry => entry.dishes.length);
  return { date, member, plan: entries.length ? { date, entries } : null,
    policy: { status: policy.status, version: policy.version },
    checkIn: editable(s, actor, memberId, date) ? s.checkIns[memberId + ":" + date] || null : null,
    logs: editable(s, actor, memberId, date) ? Object.values(s.logs).filter(l => l.memberId === memberId && l.date === date) : [],
    recipes: meals.slice(0, 25).map(m => ({ id: m.id, name: m.name, ingredients: m.ingredients, verified: verifiedNutrition(m), nutrition: verifiedNutrition(m) ? m.nutrition.perServing : null })) };
}
function conversationStamp(s, memberId, context) {
  // Local fingerprint also covers clinical exclusions without sending them to AI.
  return hash(JSON.stringify({ context, profile: s.profiles[memberId] || freshProfile(memberId) }));
}
function groceryView(s, actor, meals, start) {
  const end = new Date(start + "T12:00:00Z"); end.setUTCDate(end.getUTCDate() + 6);
  const plans = Object.values(s.plans).filter(p => p.scope === scopeKey(s, actor) && p.date >= start && p.date <= end.toISOString().slice(0, 10));
  const entries = [];
  for (const p of plans) for (const e of projectPlan(s, actor, p, p.date).entries) for (const d of e.dishes) {
    validateDishes(s, actor, p.date, [d], meals);
    entries.push({ meal: d.mealId, servings: Object.values(d.portions).reduce((a, b) => a + b, 0) });
  }
  const result = grocery(entries, meals, s.pantry[scopeKey(s, actor)] || []);
  const signature = hash(JSON.stringify({ result, permissions: accessStamp(s, actor) }));
  const saved = s.groceryChecks?.[scopeKey(s, actor) + ":" + start];
  return { ...result, signature, items: result.items.map(item => ({ ...item, checked: saved?.signature === signature && saved.checks[item.key] === true })), generatedAt: new Date().toISOString(), planCount: plans.length };
}
function confirmProposal(s, actor, p, catalog, policy = defaultPolicy) {
  if (!p || p.actor !== actor || p.scope !== scopeKey(s, actor)) fail("Proposal unavailable.", 404);
  if (p.days) {
    if (p.status === "confirmed") return { ...p, days: p.days.map(id => safePlan(s, actor, s.plans[s.proposals[id].scope + ":" + s.proposals[id].date], catalog, s.proposals[id].date)) };
    if (p.expires <= Date.now()) fail("Proposal expired. Generate a new week.", 409);
    // All writes occur inside the same compare-and-set; any stale day aborts the entire week.
    const days = p.days.map(id => confirmProposal(s, actor, s.proposals[id], catalog, policy));
    p.status = "confirmed"; return { ...p, days };
  }
  if (p.status === "confirmed") return safePlan(s, actor, s.plans[p.scope + ":" + p.date], catalog, p.date);
  if (p.expires <= Date.now() || p.policyStamp !== hash(JSON.stringify(policy)) || p.stamp !== snapshot(s, actor, p.date, catalog)) fail("Preferences, participants, policy or plan changed. Generate a fresh proposal.", 409);
  for (const e of p.entries) validateDishes(s, actor, p.date, e.dishes, catalog);
  const key = p.scope + ":" + p.date, previous = s.plans[key]?.entries || [];
  const plan = { date: p.date, scope: p.scope, entries: [...previous.filter(e => !(p.slots || p.entries.map(e => e.slot)).includes(e.slot)), ...p.entries], updatedAt: new Date().toISOString() };
  s.plans[key] = plan; p.status = "confirmed";
  s.events.push({ type: "plan_confirmed", at: Date.now() }); s.events = s.events.slice(-1000);
  return safePlan(s, actor, plan, catalog, p.date);
}
function todayView(s, actor, policy, meals, date = currentDate(s, actor)) {
  const profile = ownProfile(s, actor);
  const ci = s.checkIns[actor + ":" + date] || null;
  const dayProfile = { ...profile, activity: ci?.dayActivity || profile.activity };
  const logs = Object.values(s.logs).filter(l => l.memberId === actor && l.date === date);
  const total = { kcal: 0, protein: 0, carbohydrate: 0, fat: 0 };
  let complete = SLOTS.every(slot => logs.some(l => l.slot === slot && l.status === "recorded"));
  for (const log of logs) {
    if (log.status !== "recorded" || !log.dishes.length) { complete = false; continue; }
    const n = totalNutrition(log.dishes, meals, actor);
    if (!n.complete) { complete = false; continue; }
    for (const key of Object.keys(total)) total[key] += n.values[key];
  }
  const home = householdOf(s, actor);
  const actions = [];
  if (!profile.birthDate || !latest(s, actor, date)) actions.push({ label: "Complete your profile", to: "/profile" });
  if (!ci) actions.push({ label: "Check in for today", to: "/today#check-in" });
  if (!s.plans[scopeKey(s, actor) + ":" + date]) actions.push({ label: (ci?.cookingMinutes || profile.cookingMinutes) <= 20 ? "Find a quicker meal" : "Plan today's meals", to: "/family-planner" });
  else actions.push({ label: "Open grocery list", to: "/family-planner#groceries" });
  actions.push({ label: "Record a meal", to: "/today#meal-log" });
  return { date, week: weekOf(date), profile: visibleProfile(s, actor, actor, date, policy), members: memberIds(s, actor).map(id => visibleProfile(s, actor, id, date, policy)), household: home ? { ...s.households[home], isOwner: s.households[home].owner === actor } : null,
    checkIn: ci, metrics: metrics(dayProfile, latest(s, actor, date), date, policy), logs,
    intake: { complete, recordedKcal: complete ? Math.round(total.kcal) : null, values: complete ? total : null, note: complete ? "Recorded meals with reviewed nutrition." : "Incomplete diary or missing nutrition; no remaining-calorie calculation." },
    plan: safePlan(s, actor, s.plans[scopeKey(s, actor) + ":" + date], meals, date), actions: actions.slice(0, 3),
    policy: { status: policy.status, version: policy.version, pediatricEnabled: policy.status === "approved" && policy.pediatricInterpretationEnabled === true && Boolean(policy.pediatricReference && policy.pediatricReferenceSha256 === policy.pediatricReference.sha256), weightGoalsEnabled: policy.status === "approved" && policy.weightGoalsEnabled === true },
  };
}
function installAssistant(app, { store, authenticate, getMeals, policy = defaultPolicy, provider = null, providerConfiguration = "not-configured", adminIds = [], pilotIds = [], enabled = true }) {
  const express = require("express");
  const router = express.Router();
  const rates = new Map();
  router.use(async (req, res, next) => {
    try {
      req.actor = await authenticate(req);
      const bucket = Math.floor(Date.now() / 60000), key = req.actor.id + ":" + bucket;
      if (rates.size > 2000) for (const k of rates.keys()) if (!k.endsWith(":" + bucket)) rates.delete(k);
      rates.set(key, (rates.get(key) || 0) + 1);
      if (rates.get(key) > 90) fail("Please wait before making more requests.", 429);
      next();
    } catch (e) { next(e); }
  });
  const route = (method, path, handler) => router[method](path, async (req, res, next) => { try { await handler(req, res); } catch (e) { next(e); } });
  const read = async req => { const { data } = await store.read(); const meals = catalogWithNutrition(data, await getMeals()); return { s: data, actor: req.actor.id, date: currentDate(data, req.actor.id), meals }; };
  route("get", "/catalog", async (req, res) => { const { meals } = await read(req); res.json({ meals }); });
  route("get", "/today", async (req, res) => { const { s, actor, meals } = await read(req); res.json({ ...todayView(s, actor, policy, meals, req.query.date ? checkDate(req.query.date) : undefined), demo: req.actor.demo, assistantAccess: enabled && (req.actor.demo || pilotIds.includes(actor)) }); });
  route("get", "/profile", async (req, res) => {
    const { s, actor, date } = await read(req); const id = req.query.memberId || actor;
    memberAllowed(s, actor, id, date); res.json(visibleProfile(s, actor, id, date, policy));
  });
  route("put", "/profile", async (req, res) => {
    const actor = req.actor.id;
    const result = await mutate(store, s => {
      const date = currentDate(s, actor), id = req.body.memberId || actor;
      memberAllowed(s, actor, id, date, true);
      const old = s.profiles[id] || freshProfile(id), b = req.body;
      const p = { ...old };
      for (const key of ["name", "budget", "eatingOut", "usualActivity"]) if (b[key] !== undefined) p[key] = text(b[key], 160);
      if (!p.name) fail("Enter a display name.");
      if (b.birthDate !== undefined) { checkDate(b.birthDate); if (ageOn(b.birthDate, date) === null || ageOn(b.birthDate, date) < (old.guardianId ? 2 : 18) || ageOn(b.birthDate, date) > 110 || (old.guardianId && ageOn(b.birthDate, date) >= 18)) fail("Adult accounts must be 18+; child profiles must be ages 2–17."); p.birthDate = b.birthDate; }
      for (const [key, values] of Object.entries({ formulaSex: ["male", "female", "unspecified"], goal: GOALS, units: ["metric", "imperial"], activity: ["sedentary", "light", "moderate", "active"], diet: ["any", "vegetarian", "vegan"] })) if (b[key] !== undefined) { if (!values.includes(b[key])) fail("Invalid " + key + "."); p[key] = b[key]; }
      if (old.guardianId && ["gain", "loss"].includes(p.goal)) fail("Children's profiles support balanced eating and habits only.");
      if (b.timezone !== undefined) { try { localDate(b.timezone); } catch { fail("Choose a valid timezone."); } p.timezone = b.timezone; }
      for (const key of ["allergies", "avoid", "likes", "dislikes", "cuisines", "equipment"]) if (b[key] !== undefined) p[key] = list(b[key]);
      for (const [key, min, max] of [["cookingMinutes", 5, 240], ["mealsPerDay", 1, 6], ["usualActivityMinutes", 0, 600]]) if (b[key] !== undefined) { if (!Number.isInteger(b[key]) || b[key] < min || b[key] > max) fail("Invalid " + key + "."); p[key] = b[key]; }
      if (b.mealTimes !== undefined) { if (!b.mealTimes || !SLOTS.every(slot => /^([01]\d|2[0-3]):[0-5]\d$/.test(b.mealTimes[slot]))) fail("Enter valid meal times."); p.mealTimes = Object.fromEntries(SLOTS.map(slot => [slot, b.mealTimes[slot]])); }
      if (b.specialCare !== undefined) { if (typeof b.specialCare !== "boolean") fail("Invalid special care setting."); p.specialCare = b.specialCare; }
      if (b.aiConsent !== undefined) { if (typeof b.aiConsent !== "boolean") fail("Invalid conversation consent."); p.aiConsent = b.aiConsent; }
      if (b.sharing !== undefined) { if (!b.sharing || !["portions", "goals", "body"].every(k => typeof b.sharing[k] === "boolean")) fail("Invalid sharing settings."); p.sharing = Object.fromEntries(["portions", "goals", "body"].map(k => [k, b.sharing[k]])); }
      for (const key of ["portion", "targetWeightKg"]) if (b[key] !== undefined) { if (b[key] !== null && (!Number.isFinite(b[key]) || b[key] <= 0 || b[key] > (key === "portion" ? 10 : 500))) fail("Invalid " + key + "."); p[key] = b[key]; }
      if (old.guardianId) p.targetWeightKg = null;
      p.updatedAt = new Date().toISOString(); s.profiles[id] = p;
      return visibleProfile(s, actor, id, date, policy);
    }); res.json(result);
  });
  route("post", "/measurements", async (req, res) => {
    const result = await mutate(store, s => {
      const actor = req.actor.id, date = currentDate(s, actor), id = req.body.memberId || actor;
      memberAllowed(s, actor, id, date, true); const measured = checkDate(req.body.date);
      if (measured > date || measured < (s.profiles[id]?.birthDate || "1900-01-01")) fail("Measurement date must be between birth and today.");
      let values;
      try { values = measurementsInMetric(req.body); } catch (e) { fail(e.message); }
      const rows = s.measurements[id] ||= [];
      if (req.body.id && !rows.some(m => m.id === req.body.id)) fail("Measurement not found.", 404);
      const m = { id: req.body.id || uuid(), date: measured, ...values, updatedAt: new Date().toISOString() };
      s.measurements[id] = [...rows.filter(x => x.id !== m.id), m]; return m;
    }); res.status(201).json(result);
  });
  route("get", "/households", async (req, res) => {
    const { s, actor, date } = await read(req), id = householdOf(s, actor);
    res.json({ household: id ? { ...s.households[id], isOwner: s.households[id].owner === actor } : null, members: memberIds(s, actor).map(member => visibleProfile(s, actor, member, date, policy)) });
  });
  route("post", "/households", async (req, res) => {
    res.status(201).json(await mutate(store, s => {
      const actor = req.actor.id; if (householdOf(s, actor)) fail("You already belong to a family.", 409);
      const name = text(req.body.name); if (!name) fail("Enter a family name.");
      const children = memberIds(s, actor).filter(id => id !== actor);
      const id = uuid(); s.households[id] = { id, name, owner: actor }; s.memberships[actor] = { householdId: id }; s.profiles[actor] ||= freshProfile(actor);
      for (const child of children) s.memberships[child] = { householdId: id };
      return s.households[id];
    }));
  });
  route("post", "/members", async (req, res) => {
    res.status(201).json(await mutate(store, s => {
      const actor = req.actor.id, home = householdOf(s, actor); if (!home) fail("Create or join a family first.");
      const guardianAge = ageOn(ownProfile(s, actor).birthDate, currentDate(s, actor));
      if (guardianAge === null || guardianAge < 18) fail("Complete your adult Profile before creating a child's profile.");
      const date = currentDate(s, actor), age = ageOn(req.body.birthDate, date); if (age === null || age < 2 || age >= 18) fail("Child profiles must be ages 2–17.");
      const name = text(req.body.name); if (!name) fail("Enter the child's name.");
      const id = uuid(); s.profiles[id] = { ...freshProfile(id), name, birthDate: req.body.birthDate, guardianId: actor }; s.memberships[id] = { householdId: home };
      return visibleProfile(s, actor, id, date, policy);
    }));
  });
  route("post", "/invites", async (req, res) => {
    const token = randomBytes(32).toString("hex");
    await mutate(store, s => {
      const actor = req.actor.id, home = householdOf(s, actor); if (!home || s.households[home].owner !== actor) fail("Only the family owner can create invitations.", 403);
      s.invites[hash(token)] = { householdId: home, creator: actor, expires: Date.now() + 86400000, used: false };
    }); res.status(201).json({ token, expiresInHours: 24 });
  });
  route("post", "/invites/accept", async (req, res) => {
    if (req.actor.demo) fail("Sign in with an adult account to accept invitations.", 403);
    res.json(await mutate(store, s => {
      const actor = req.actor.id, p = ownProfile(s, actor), age = ageOn(p.birthDate, currentDate(s, actor));
      if (age === null || age < 18) fail("Complete your adult profile before joining a family.");
      if (householdOf(s, actor)) fail("Leave your current family first.", 409);
      const token = text(req.body.token, 64), invite = s.invites[hash(token)];
      if (!invite || invite.used || invite.expires <= Date.now() || !s.households[invite.householdId] || householdOf(s, invite.creator) !== invite.householdId) fail("Invitation expired or unavailable.", 404);
      invite.used = true; s.memberships[actor] = { householdId: invite.householdId }; return { joined: true };
    }));
  });
  route("post", "/households/leave", async (req, res) => {
    await mutate(store, s => {
      const actor = req.actor.id, home = householdOf(s, actor); if (!home) fail("You are not in a family.");
      const others = memberIds(s, actor).filter(id => id !== actor && !s.profiles[id]?.guardianId);
      if (s.households[home].owner === actor && others.length) fail("Transfer family ownership before leaving.", 409);
      const leaving = [actor, ...memberIds(s, actor).filter(id => s.profiles[id]?.guardianId === actor)];
      for (const id of leaving) delete s.memberships[id];
      if (!others.length) { delete s.households[home]; for (const [key, inv] of Object.entries(s.invites)) if (inv.householdId === home) delete s.invites[key]; }
    }); res.json({ left: true });
  });
  route("post", "/households/transfer", async (req, res) => {
    await mutate(store, s => { const actor = req.actor.id, home = householdOf(s, actor); if (!home || s.households[home].owner !== actor) fail("Only the owner can transfer ownership.", 403); const id = req.body.memberId; if (!memberIds(s, actor).includes(id) || s.profiles[id]?.guardianId) fail("Choose an adult family member."); s.households[home].owner = id; }); res.json({ transferred: true });
  });
  route("post", "/check-ins", async (req, res) => {
    res.json(await mutate(store, s => {
      const actor = req.actor.id, now = currentDate(s, actor), memberId = req.body.memberId || actor;
      memberAllowed(s, actor, memberId, now, true); const b = req.body, date = checkDate(b.date);
      if (!['sedentary', 'light', 'moderate', 'active'].includes(b.dayActivity) || !["planned", "completed", "none"].includes(b.activityStatus)) fail("Choose valid activity settings.");
      if (b.activityStatus === "completed" && date > now) fail("Future activity can be planned, not marked completed.");
      if (!Number.isInteger(b.activityMinutes) || b.activityMinutes < 0 || b.activityMinutes > 600 || !Number.isInteger(b.cookingMinutes) || b.cookingMinutes < 5 || b.cookingMinutes > 240) fail("Enter valid activity and cooking durations.");
      if (!b.locations || !SLOTS.every(slot => ["home", "outside", "unknown"].includes(b.locations[slot]))) fail("Choose a location for every meal.");
      const ci = { memberId, date, dayActivity: b.dayActivity, activity: text(b.activity || "", 200), activityMinutes: b.activityMinutes, activityStatus: b.activityStatus, cookingMinutes: b.cookingMinutes, locations: Object.fromEntries(SLOTS.map(slot => [slot, b.locations[slot]])) }; s.checkIns[memberId + ":" + date] = ci; return ci;
    }));
  });
  route("get", "/check-ins", async (req, res) => { const { s, actor, date } = await read(req); const id = req.query.memberId || actor; memberAllowed(s, actor, id, date, true); res.json(s.checkIns[id + ":" + checkDate(req.query.date || date)] || null); });
  route("get", "/meal-logs", async (req, res) => { const { s, actor, date } = await read(req); const id = req.query.memberId || actor; memberAllowed(s, actor, id, date, true); res.json(Object.values(s.logs).filter(l => l.memberId === id && l.date === checkDate(req.query.date || date))); });
  route("post", "/meal-logs", async (req, res) => {
    const meals = await getMeals();
    res.status(201).json(await mutate(store, s => {
      const actor = req.actor.id, now = currentDate(s, actor), id = req.body.memberId || actor, b = req.body;
      memberAllowed(s, actor, id, now, true); const date = checkDate(b.date);
      if (date > now || !SLOTS.includes(b.slot) || !["recorded", "unknown", "skipped"].includes(b.status)) fail("Choose a valid meal status and date.");
      const dishes = b.status === "recorded" ? (b.dishes || []).map(d => ({ mealId: d.mealId, portions: { [id]: d.servings } })) : [];
      // A diary records what actually happened, even when the food conflicts with a preference.
      if (dishes.length > 8 || dishes.some(d => !catalogWithNutrition(s, meals).some(m => m.id === d.mealId) || !Number.isFinite(d.portions[id]) || d.portions[id] <= 0 || d.portions[id] > 10)) fail("Choose valid recipes and actual servings.");
      const key = id + ":" + date + ":" + b.slot;
      const log = { id: key, memberId: id, date, slot: b.slot, status: b.status, dishes, note: text(b.note || "", 500) }; s.logs[key] = log; return log;
    }));
  });
  route("get", "/plan-proposals", async (req, res) => { const { s, actor, meals } = await read(req); res.json(Object.values(s.proposals).filter(p => !p.days && p.actor === actor && p.scope === scopeKey(s, actor) && p.status === "pending" && p.expires > Date.now()).map(p => safePlan(s, actor, p, meals, p.date))); });
  route("post", "/plan-proposals", async (req, res) => {
    const meals = await getMeals();
    res.status(201).json(await mutate(store, s => {
      const actor = req.actor.id, date = checkDate(req.body.date || currentDate(s, actor)), slots = req.body.slots || SLOTS;
      if (!Array.isArray(slots) || !slots.length || new Set(slots).size !== slots.length || !slots.every(slot => SLOTS.includes(slot))) fail("Choose valid meal slots.");
      const catalog = catalogWithNutrition(s, meals), p = proposal(s, actor, date, slots, catalog, req.body.selections, req.body.swap === true, new Set(), policy);
      return publicPlan(p, catalog);
    }));
  });
  route("post", "/plan-proposals/:id/confirm", async (req, res) => {
    const meals = await getMeals();
    res.json(await mutate(store, s => {
      const actor = req.actor.id, p = s.proposals[req.params.id];
      const catalog = catalogWithNutrition(s, meals);
      return confirmProposal(s, actor, p, catalog, policy);
    }));
  });
  route("post", "/weekly-proposals", async (req, res) => {
    const meals = await getMeals();
    res.status(201).json(await mutate(store, s => {
      const actor = req.actor.id, start = checkDate(req.body.start || weekOf(currentDate(s, actor)));
      if (weekOf(start) !== start) fail("Choose a week starting Monday.");
      const catalog = catalogWithNutrition(s, meals), days = [], used = new Set();
      for (let i = 0; i < 7; i++) {
        const date = new Date(start + "T12:00:00Z"); date.setUTCDate(date.getUTCDate() + i); const day = date.toISOString().slice(0, 10);
        let selections;
        if (req.body.reusePrevious === true) {
          date.setUTCDate(date.getUTCDate() - 7);
          const previous = s.plans[scopeKey(s, actor) + ":" + date.toISOString().slice(0, 10)];
          if (!previous) fail("Previous week has missing days. Generate a new week instead.", 409);
          selections = Object.fromEntries(projectPlan(s, actor, previous, day).entries.map(e => [e.slot, e.dishes]));
        }
        days.push(proposal(s, actor, day, SLOTS, catalog, selections, false, used, policy));
      }
      const p = { id: uuid(), actor, scope: scopeKey(s, actor), start, days: days.map(d => d.id), status: "pending", expires: Date.now() + 3600000 };
      s.proposals[p.id] = p; return { ...p, days: days.map(d => publicPlan(d, catalog)) };
    }));
  });
  route("post", "/demo-imports", async (req, res) => {
    const meals = await getMeals(), input = req.body.days;
    if (!Array.isArray(input) || !input.length || input.length > 7 || new Set(input.map(d => d.date)).size !== input.length) fail("Import one to seven distinct days.");
    res.status(201).json(await mutate(store, s => {
      const actor = req.actor.id, catalog = catalogWithNutrition(s, meals);
      const days = input.map(day => {
        const date = checkDate(day.date);
        if (!Array.isArray(day.entries) || !day.entries.length || day.entries.length > 3 || new Set(day.entries.map(e => e.slot)).size !== day.entries.length || !day.entries.every(e => SLOTS.includes(e.slot))) fail("Import valid meal slots.");
        const selections = Object.fromEntries(day.entries.map(entry => {
          if (!Array.isArray(entry.dishes) || !entry.dishes.length || entry.dishes.length > 8) fail("Import one to eight dishes per meal.");
          // Imported anonymous quantities belong only to the requesting adult. Family portions are explicitly edited later.
          return [entry.slot, entry.dishes.map(d => ({ mealId: text(d.mealId, 100), portions: { [actor]: d.servings } }))];
        }));
        return proposal(s, actor, date, day.entries.map(e => e.slot), catalog, selections, false, new Set(), policy);
      });
      const p = { id: uuid(), actor, scope: scopeKey(s, actor), start: days[0].date, days: days.map(d => d.id), status: "pending", importPreview: true, expires: Date.now() + 3600000 };
      s.proposals[p.id] = p; return { ...p, days: days.map(d => publicPlan(d, catalog)) };
    }));
  });
  route("get", "/plans", async (req, res) => {
    const { s, actor, meals, date } = await read(req); const start = checkDate(req.query.start || weekOf(date));
    const endDate = new Date(start + "T12:00:00Z"); endDate.setUTCDate(endDate.getUTCDate() + 6); const end = endDate.toISOString().slice(0, 10);
    res.json(Object.values(s.plans).filter(p => p.scope === scopeKey(s, actor) && p.date >= start && p.date <= end).sort((a, b) => a.date.localeCompare(b.date)).map(p => safePlan(s, actor, p, meals, p.date)));
  });
  route("post", "/plans/lock", async (req, res) => {
    const meals = await getMeals();
    await mutate(store, s => {
      const actor = req.actor.id, date = checkDate(req.body.date), plan = s.plans[scopeKey(s, actor) + ":" + date];
      const entry = plan?.entries.find(e => e.slot === req.body.slot);
      if (!entry || typeof req.body.locked !== "boolean") fail("Meal slot unavailable.", 404);
      const projected = projectPlan(s, actor, { entries: [entry] }, date).entries[0];
      if (projected && req.body.locked) validateDishes(s, actor, date, projected.dishes, catalogWithNutrition(s, meals));
      if (projected) projected.locked = req.body.locked;
      plan.entries = plan.entries.flatMap(e => e === entry ? (projected ? [projected] : []) : [e]);
      plan.updatedAt = new Date().toISOString();
    }); res.json({ saved: true });
  });
  route("get", "/pantry", async (req, res) => { const { s, actor } = await read(req); res.json(s.pantry[scopeKey(s, actor)] || []); });
  route("post", "/pantry", async (req, res) => {
    res.json(await mutate(store, s => { const key = scopeKey(s, req.actor.id); const rows = s.pantry[key] ||= []; if (req.body.remove) { s.pantry[key] = rows.filter(p => p.id !== req.body.remove); } else { const raw = text(req.body.text, 200); if (!raw) fail("Enter an ingredient."); rows.push({ id: uuid(), ...parseIngredient(raw) }); } return s.pantry[key]; }));
  });
  route("get", "/groceries", async (req, res) => {
    const { s, actor, meals, date } = await read(req), start = checkDate(req.query.start || weekOf(date));
    res.json(groceryView(s, actor, meals, start));
  });
  route("post", "/groceries/check", async (req, res) => {
    const raw = await getMeals();
    await mutate(store, s => {
      const actor = req.actor.id, start = checkDate(req.body.start), cart = groceryView(s, actor, catalogWithNutrition(s, raw), start);
      if (req.body.signature !== cart.signature) fail("The grocery quantities changed. Refresh the list before checking items.", 409);
      if (typeof req.body.checked !== "boolean" || !cart.items.some(i => i.key === req.body.key && !i.covered)) fail("Grocery item unavailable.");
      const key = scopeKey(s, actor) + ":" + start, saved = (s.groceryChecks ||= {})[key];
      const next = saved?.signature === cart.signature ? saved : { signature: cart.signature, checks: {} };
      next.checks[req.body.key] = req.body.checked; s.groceryChecks[key] = next;
    }); res.json({ saved: true });
  });
  route("post", "/feedback", async (req, res) => {
    const { meals } = await read(req);
    res.status(201).json(await mutate(store, s => {
      const b = req.body; if (!meals.some(m => m.id === b.mealId) || !["like", "dislike"].includes(b.rating) || !["taste", "ingredients", "time", "repeat", "other"].includes(b.reason)) fail("Choose a recipe, rating and reason.");
      const id = uuid(); s.feedback[id] = { id, actor: req.actor.id, mealId: b.mealId, rating: b.rating, reason: b.reason, at: Date.now() }; return { saved: true };
    }));
  });
  route("get", "/summary", async (req, res) => {
    const { s, actor, date } = await read(req), start = checkDate(req.query.start || weekOf(date)), end = new Date(start + "T12:00:00Z"); end.setUTCDate(end.getUTCDate() + 6);
    const logs = Object.values(s.logs).filter(l => l.memberId === actor && l.date >= start && l.date <= end.toISOString().slice(0, 10));
    const until = Date.parse(end.toISOString().slice(0, 10)) + 86400000;
    res.json({ start, recordedMeals: logs.filter(l => l.status === "recorded").length, unknownMeals: logs.filter(l => l.status === "unknown").length, checkIns: Object.values(s.checkIns).filter(c => c.memberId === actor && c.date >= start && c.date <= end.toISOString().slice(0, 10)).length, feedback: Object.values(s.feedback).filter(f => f.actor === actor && f.at >= Date.parse(start) && f.at < until).map(f => ({ mealId: f.mealId, rating: f.rating, reason: f.reason })), goalChanged: false });
  });
  route("get", "/assistant/status", async (req, res) => {
    const { s, actor, date } = await read(req), memberId = req.query.memberId || actor;
    memberAllowed(s, actor, memberId, date);
    const access = enabled && (req.actor.demo || pilotIds.includes(actor));
    const consent = s.profiles[memberId]?.aiConsent === true;
    res.json({ access, provider: provider ? "configured" : providerConfiguration, consent, canManageConsent: editable(s, actor, memberId, date), ready: Boolean(access && provider && consent), note: "Configured does not guarantee provider network availability." });
  });
  route("get", "/assistant/messages", async (req, res) => {
    const { s, actor } = await read(req), stamp = accessStamp(s, actor);
    res.json((s.messages[actor] || []).filter(m => m.stamp === stamp).map(({ role, text, at }) => ({ role, text, at })));
  });
  route("post", "/assistant/messages", async (req, res) => {
    if (!enabled) fail("Assistant is not enabled for this release.", 503);
    if (!req.actor.demo && !pilotIds.includes(req.actor.id)) fail("Assistant access must be enabled by the pilot administrator.", 403);
    const prompt = text(req.body.prompt, 2000); if (!prompt) fail("Enter a message.");
    const { s, actor, meals, date } = await read(req);
    const requested = req.body.memberId;
    if (!requested && memberIds(s, actor).length > 1) return res.json({ answer: /[\u00c0-\u1ef9]/.test(prompt) ? "Bạn muốn trao đổi về thành viên nào? Hãy chọn thành viên trước khi tiếp tục." : "Which family member is this about? Choose a member before continuing.", cards: [], missingInformation: ["memberId"], estimated: false, sources: [] });
    const memberId = requested || actor; memberAllowed(s, actor, memberId, date);
    const person = visibleProfile(s, actor, memberId, date, policy);
    const stamp = accessStamp(s, actor);
    // Only permitted, current context reaches a provider; no full store or health chat logging.
    const view = todayView(s, actor, policy, meals, date);
    const context = conversationContext(s, actor, memberId, date, meals, policy);
    const contextStamp = conversationStamp(s, memberId, context);
    let providerAttempted = false;
    let answer = safetyResponse(prompt, person, policy.status), providerStatus = answer ? "policy" : "offline", usage = null;
    const intent = answer ? null : planningIntent(prompt);
    const start = Date.now();
    const consent = s.profiles[memberId]?.aiConsent === true;
    if (provider && !consent && !answer && !intent) providerStatus = "consent-required";
    if (provider && consent && !answer && !intent) {
      providerAttempted = true;
      try {
        const response = await provider({ prompt, context, history: (s.messages[actor] || []).filter(m => m.stamp === stamp && m.memberId === memberId && m.contextStamp === contextStamp).slice(-12).map(m => ({ role: m.role, content: m.text })) });
        answer = typeof response === "string" ? response : response?.answer;
        if (typeof answer !== "string" || !answer.trim()) throw new Error("Empty provider response");
        usage = typeof response === "object" ? response?.usage || null : null; providerStatus = "available";
      }
      catch { providerStatus = "unavailable"; }
    }
    const vi = /[\u00c0-\u1ef9]/.test(prompt);
    if (intent?.needsDate) { answer = vi ? "Hãy chọn ngày hoặc tuần trong Family planner để xem trước thực đơn, hoặc ghi ngày theo YYYY-MM-DD trong tin nhắn. Kế hoạch chỉ thay đổi khi bạn xác nhận." : "Choose the date or week in Family planner to preview meals, or include a YYYY-MM-DD date in your message. Plans change only after confirmation."; providerStatus = "date-required"; }
    else if (intent) { answer = vi ? "Mình đã chuẩn bị bản xem trước bên dưới. Kiểm tra ngày, món và khẩu phần của từng người; kế hoạch chỉ thay đổi khi bạn xác nhận." : "Here is a meal preview. Check the date, dishes and each person's recipe servings; your plan changes only after confirmation."; providerStatus = "planning"; }
    if (!answer && providerStatus === "consent-required") answer = vi ? "Thành viên này chưa đồng ý sử dụng dữ liệu cho dịch vụ hội thoại. Họ có thể cập nhật lựa chọn trong Profile. Bạn vẫn có thể dùng các thẻ lập kế hoạch bên dưới." : "This member has not consented to using their context with the conversation provider. They can change this choice in Profile. Planning cards remain available.";
    if (!answer) answer = providerStatus === "offline" ? (vi ? "Chat AI chưa được kết nối hoặc bật trên máy chủ. Hiện tại mình chỉ có thể hỗ trợ các thao tác lập kế hoạch qua thẻ đề xuất. Hãy cấu hình dịch vụ AI để dùng hội thoại tự do." : "AI chat is not connected or enabled on the server. Meal preview actions are available, but free-form conversation requires the AI provider configuration.") : (vi ? "Dịch vụ AI chưa trả lời được lần này. Bạn có thể thử gửi lại; Profile và kế hoạch đã lưu vẫn dùng được." : "The AI provider could not reply this time. Try sending again; your profile and saved plans remain available.");
    // Never trust free-form model text as a source of numerical nutrition or executable actions.
    const numericNutrition = /\d+(?:[.,]\d+)?\s*(?:kcal|calories?\b|calo\b)|\b(?:bmi|bmr|tdee|calorie target)\b[^\n.!?]{0,40}\d|\d+(?:[.,]\d+)?\s*g\s*(?:protein|carbs?|carbohydrate|fat)\b/i.test(answer || "");
    if (providerStatus === "available" && (numericNutrition || /\b(saved|confirmed|updated|prescribed|diagnosed)\b|da luu|da cap nhat|da xac nhan/.test(clean(answer)) || safetyResponse(answer, person, policy.status))) { answer = vi ? "Mình có thể giúp bạn chọn món và điều chỉnh kế hoạch. Các chỉ số và giá trị dinh dưỡng đã kiểm tra nằm trong Profile và thẻ kế hoạch; hãy dùng các thao tác bên dưới." : "I can help choose meals and adjust your plan. Validated measurements and nutrition are shown in your Profile and plan cards. Use the actions below."; providerStatus = "filtered"; }
    const currentMeals = await getMeals();
    const result = await mutate(store, state => {
      if (accessStamp(state, actor) !== stamp) fail("Sharing permissions changed. Please send your message again.", 409);
      const currentCatalog = catalogWithNutrition(state, currentMeals);
      if (providerAttempted && (currentDate(state, actor) !== date || conversationStamp(state, memberId, conversationContext(state, actor, memberId, date, currentCatalog, policy)) !== contextStamp)) fail("Meal preferences or daily context changed. Please send your message again.", 409);
      const requestedDate = new Date(date + "T12:00:00Z"); requestedDate.setUTCDate(requestedDate.getUTCDate() + (intent?.offset || 0));
      const planDate = checkDate(intent?.explicitDate || requestedDate.toISOString().slice(0, 10));
      const preview = intent && !intent.needsDate ? publicPlan(proposal(state, actor, planDate, intent.slots, currentCatalog, undefined, intent.swap, new Set(), policy), currentCatalog) : null;
      const at = new Date().toISOString(), messages = state.messages[actor] ||= [];
      messages.push({ role: "user", text: prompt, at, stamp, memberId, contextStamp }, { role: "assistant", text: String(answer).slice(0, 6000), at, stamp, memberId, contextStamp }); state.messages[actor] = messages.slice(-100);
      state.events.push({ type: "assistant_response", providerStatus, durationMs: Date.now() - start, usage, at: Date.now() }); state.events = state.events.slice(-1000);
      return { answer: String(answer).slice(0, 6000), proposal: preview, cards: view.actions, sources: ["https://www.who.int/news-room/fact-sheets/detail/healthy-diet"], missingInformation: person.metrics?.missing || [], estimated: true, providerStatus };
    }); res.json(result);
  });
  route("get", "/nutrition/readiness", async (req, res) => {
    const { meals } = await read(req), verified = meals.filter(verifiedNutrition), vietnamese = verified.filter(m => /vietnam|viet nam/i.test(m.origin));
    res.json({ verified: verified.length, vietnamese: vietnamese.length, international: verified.length - vietnamese.length, target: { vietnamese: 30, international: 30 }, policyApproved: policy.status === "approved", ready: vietnamese.length >= 30 && verified.length - vietnamese.length >= 30 && policy.status === "approved", pending: meals.filter(m => !verifiedNutrition(m)).map(m => ({ id: m.id, name: m.name, origin: m.origin, sourceUrl: m.source_url || m.catalog_source_url || null })) });
  });
  route("put", "/nutrition/:mealId", async (req, res) => {
    if (!adminIds.includes(req.actor.id) || req.actor.demo) fail("Nutrition review requires a server-authorized reviewer.", 403);
    const { meals } = await read(req); if (!meals.some(m => m.id === req.params.mealId)) fail("Recipe unavailable.", 404);
    const b = req.body;
    if (!verifiedNutrition({ nutrition: b }) || !/^https:\/\//.test(b.sourceUrl) || !validDate(b.reviewedAt) || b.reviewedAt > localDate() || b.baseServings > 100 || typeof b.allergensReviewed !== "boolean" || !Array.isArray(b.dietTags)) fail("Supply verified nutrition, source, servings and reviewer information.");
    const n = { status: "verified", reviewedBy: req.actor.id, reviewedAt: b.reviewedAt, sourceUrl: b.sourceUrl, baseServings: b.baseServings, perServing: Object.fromEntries(["kcal", "protein", "carbohydrate", "fat"].map(k => [k, b.perServing[k]])), allergensReviewed: b.allergensReviewed, dietTags: list(b.dietTags), cookingMinutes: Number.isFinite(b.cookingMinutes) && b.cookingMinutes > 0 ? b.cookingMinutes : null, method: text(b.method || "Source nutrition, checked against recipe quantities", 300) };
    await mutate(store, s => { s.nutrition[req.params.mealId] = n; }); res.json({ saved: true });
  });
  route("get", "/nutrition/reviewer", async (req, res) => {
    if (!adminIds.includes(req.actor.id) || req.actor.demo) fail("Nutrition review requires a server-authorized reviewer.", 403);
    res.json({ reviewer: req.actor.id });
  });
  route("get", "/pilot/metrics", async (req, res) => {
    if (!adminIds.includes(req.actor.id) || req.actor.demo) fail("Pilot metrics require a server-authorized reviewer.", 403);
    const { data: s } = await store.read(), events = s.events || [];
    const replies = events.filter(e => e.type === "assistant_response"), durations = replies.map(e => e.durationMs).sort((a, b) => a - b);
    const usage = replies.reduce((sum, e) => ({ inputTokens: sum.inputTokens + (e.usage?.inputTokens || 0), outputTokens: sum.outputTokens + (e.usage?.outputTokens || 0) }), { inputTokens: 0, outputTokens: 0 });
    res.json({ window: "Last 1000 operational events; not a full audit log", responses: replies.length, p95ResponseMs: durations.length ? durations[Math.ceil(durations.length * 0.95) - 1] : null, statuses: replies.reduce((counts, e) => ({ ...counts, [e.providerStatus]: (counts[e.providerStatus] || 0) + 1 }), {}), usage, confirmedPlans: events.filter(e => e.type === "plan_confirmed").length, feedbackReasons: Object.values(s.feedback).reduce((counts, f) => ({ ...counts, [f.reason]: (counts[f.reason] || 0) + 1 }), {}), note: "Contains no names, measurements, tokens or conversation text. Token usage is reported only when supplied by the provider; no cost is inferred." });
  });
  route("get", "/nutrition/foods", async (req, res) => {
    if (!adminIds.includes(req.actor.id) || req.actor.demo) fail("Nutrition review requires a server-authorized reviewer.", 403);
    const query = text(req.query.q || "", 100); if (query.length < 2) fail("Use at least two characters.");
    res.json(await searchFoods(query, process.env.USDA_FDC_API_KEY));
  });
  route("post", "/recipe-imports", async (req, res) => {
    if (!adminIds.includes(req.actor.id) || req.actor.demo) fail("Recipe import requires a server-authorized reviewer.", 403);
    const { enrichMeal } = require("../ingredients"), b = req.body;
    const name = text(b.name), origin = text(b.origin), sourceUrl = text(b.sourceUrl, 500);
    if (!name || !origin || !/^https:\/\//.test(sourceUrl) || !Array.isArray(b.ingredients) || b.ingredients.length < 1 || b.ingredients.length > 40 || !Array.isArray(b.steps) || !b.steps.length || b.steps.length > 30) fail("Supply a source recipe, ingredients and cooking instructions.");
    const ingredients = b.ingredients.map(i => text(i, 250)), steps = b.steps.map(i => text(i, 1000));
    const mealTypes = list(b.mealTypes || SLOTS); if (!mealTypes.every(x => SLOTS.includes(x))) fail("Choose valid meal types.");
    const id = "reviewed-source-" + uuid();
    const meal = enrichMeal({ id, name, origin, source_url: sourceUrl, ingredients, recipes: steps.map((details, order) => ({ order: order + 1, details })), image_url: "", category: "balance" }, { mealTypes });
    await mutate(store, s => { (s.recipeCatalog ||= {})[id] = meal; }); res.status(201).json(meal);
  });
  router.use((req, res) => res.status(404).json({ error: "Assistant endpoint unavailable." }));
  router.use((error, req, res, next) => { void next; res.status(error.status || 503).json({ error: error.status ? error.message : "Assistant data is temporarily unavailable. Please retry." }); });
  app.use("/api/v1", router);
}
module.exports = { installAssistant, freshProfile, visibleProfile, accessStamp, validateDishes, proposal, todayView, catalogWithNutrition };
