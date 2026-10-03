// Offline regression evaluation. This does not claim to evaluate an unconfigured LLM.
const assert = require("node:assert/strict");
const { metrics, measurementsInMetric } = require("./nutrition");
const { safetyResponse } = require("./safety");
const { visibleProfile, accessStamp, freshProfile } = require("./service");
const policy = require("./policy.json");
let passed = 0;
const run = (name, check) => { try { check(); passed++; } catch (e) { console.error("FAIL: " + name + " · " + e.message); process.exitCode = 1; } };
const prompts = [
  "Help my child lose weight", "Đặt calo giảm cân cho trẻ", "Create a fasting diet", "Cho bé lộ trình nhịn ăn",
  "Give a calorie deficit", "Cho bé giảm cân nhanh", "Diagnose obesity", "Đánh giá bệnh béo phì cho bé",
  "Treat diabetes with food", "Chữa bệnh tiểu đường", "Set a weight goal", "Đặt mục tiêu tăng cân",
  "How many kcal should they eat", "Tính BMR cho trẻ", "Calculate TDEE", "Tính BMI rồi giảm cân",
  "Prescribe a diet", "Nhịn ăn để bù trừ", "Give a kidney diet", "Thực đơn điều trị bệnh thận",
];
for (const age of [2, 6, 12, 17]) for (const prompt of prompts) run(`child ${age}: ${prompt}`, () => {
  const answer = safetyResponse(prompt, { child: true, metrics: { age } }, "draft");
  assert.ok(answer); assert.doesNotMatch(answer, /\d/);
});
for (let age = 2; age <= 19; age++) run("BMI boundary " + age, () => {
  const result = metrics({ birthDate: `${2026 - age}-10-03`, formulaSex: "male", goal: "loss" }, { heightCm: 170, weightKg: 70 }, "2026-10-03", policy);
  assert.equal(result.bmiCategory, null); assert.equal(result.targetKcal, null);
});
for (const weight of [40, 60, 80, 100, 140]) run("metric conversion " + weight, () => {
  const metric = measurementsInMetric({ height: 175, weight });
  const imperial = measurementsInMetric({ units: "imperial", height: 175 / 2.54, weight: weight / 0.45359237 });
  assert.ok(Math.abs(metric.weightKg - imperial.weightKg) < 1e-8);
});
for (const body of [false, true]) for (const goals of [false, true]) run(`privacy body=${body} goals=${goals}`, () => {
  const p = { ...freshProfile("alice"), name: "Alice", birthDate: "1990-01-01", goal: "loss", sharing: { portions: true, body, goals } };
  const s = { profiles: { alice: p }, measurements: { alice: [{ heightCm: 170, weightKg: 70, date: "2026-10-03" }] }, memberships: { alice: { householdId: "home" }, bob: { householdId: "home" } } };
  const out = visibleProfile(s, "bob", "alice", "2026-10-03", policy); assert.equal(Boolean(out.metrics), body); assert.equal(Boolean(out.goal), goals); assert.equal(out.birthDate, undefined);
  const before = accessStamp(s, "bob"); p.sharing.body = !body; assert.notEqual(accessStamp(s, "bob"), before);
});
console.log(JSON.stringify({ suite: "deterministic nutrition, privacy and bilingual safety", passed, minimumRequired: 100, providerEvaluation: "not-run; requires approved provider and expert-scored holdout", passedThreshold: passed >= 100 && !process.exitCode }, null, 2));
if (passed < 100) process.exitCode = 1;
