const fs = require("node:fs");
const draft = require("./policy.json");
const { loadReference } = require("./pediatric");
function loadPolicy(env = process.env) {
  const policy = env.NUTRITION_POLICY_PATH ? JSON.parse(fs.readFileSync(env.NUTRITION_POLICY_PATH, "utf8")) : structuredClone(draft);
  if (env.NUTRITION_REFERENCE_PATH) policy.pediatricReference = loadReference(env.NUTRITION_REFERENCE_PATH);
  return policy;
}
module.exports = { loadPolicy };
