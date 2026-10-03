const fs = require("node:fs");
const { createHash } = require("node:crypto");
const VERSION = "CDC-2000-BMI-for-age";
const SOURCE = "https://www.cdc.gov/growthcharts/data/zscore/bmiagerev.csv";
function loadReference(path) {
  const bytes = fs.readFileSync(path), lines = bytes.toString("utf8").replace(/^\uFEFF/, "").trim().split(/\r?\n/);
  const headers = lines.shift().split(",").map(h => h.replace(/["\s]/g, "").toLowerCase());
  if (!["sex", "agemos", "l", "m", "s", "p5", "p85", "p95"].every(h => headers.includes(h))) throw new Error("Invalid CDC BMI reference headers.");
  const rows = lines.map(line => Object.fromEntries(line.split(",").map((v, i) => [headers[i], Number(v.replace(/"/g, ""))])));
  if (rows.length < 400 || rows.some(r => ![1, 2].includes(r.sex) || !Number.isFinite(r.agemos) || !Number.isFinite(r.l) || !(r.m > 0 && r.s > 0 && r.p5 < r.p85 && r.p85 < r.p95))) throw new Error("Incomplete CDC BMI reference.");
  return { version: VERSION, source: SOURCE, sha256: createHash("sha256").update(bytes).digest("hex"), rows };
}
function bmiForAge(profile, measurement, date, policy) {
  const ref = policy.pediatricReference;
  if (!measurement || policy.status !== "approved" || !policy.reviewedBy || !policy.reviewedAt || policy.pediatricInterpretationEnabled !== true || ref?.version !== VERSION || policy.pediatricReferenceSha256 !== ref.sha256) return null;
  const sex = profile.formulaSex === "male" ? 1 : profile.formulaSex === "female" ? 2 : null;
  if (!sex || !profile.birthDate) return null;
  const birth = new Date(profile.birthDate + "T12:00:00Z"), at = new Date(date + "T12:00:00Z");
  let months = (at.getUTCFullYear() - birth.getUTCFullYear()) * 12 + at.getUTCMonth() - birth.getUTCMonth();
  if (at.getUTCDate() < birth.getUTCDate()) months--;
  if (months < 24 || months >= 240) return null;
  const row = ref.rows.find(r => r.sex === sex && r.agemos === months + 0.5);
  if (!row) return null;
  const bmi = measurement.weightKg / (measurement.heightCm / 100) ** 2;
  const band = bmi < row.p5 ? "Below 5th percentile" : bmi < row.p85 ? "5th to below 85th percentile" : bmi < row.p95 ? "85th to below 95th percentile" : "At or above 95th percentile";
  return { band, referenceVersion: ref.version, source: ref.source, ageMonths: months, note: "Age- and sex-specific screening band. High BMI needs specialist assessment; no extended percentile is calculated." };
}
module.exports = { VERSION, SOURCE, loadReference, bmiForAge };
