# Required nutrition policy review

Status: **awaiting a qualified specialist**. No person has approved this document or the default configuration.

Before enabling quantitative targets or pediatric interpretation, record the reviewer's name/credential, date, policy version, supporting sources and review expiration. Keep the signed review separately from the runtime configuration.

Review and specify:

1. Formula and eligible population: Mifflin–St Jeor inputs, age bounds, exclusions, necessary measurements, pregnancy/lactation, clinical conditions, eating-disorder risk and referral behavior. Confirm whether resting-energy estimates may be exposed independently of daily targets.
2. Whole-day activity levels: operational definitions, reviewed multipliers, planned versus actual activity and how routine/check-in map to levels. Confirm that separate MET estimates are never added twice.
3. Goal policy: whether maintain/gain/loss/balanced targets are permitted, reviewed adjustments, minimum/maximum boundaries, when to suppress estimates and how to explain uncertainty. Do not auto-compensate the following day.
4. Children and ages 18–19: guardian access, no automatic deficit, required sex/age fields, CDC reference version/hash and screening-band explanations. Decide referral wording and extreme-BMI handling. No child account chat in this MVP.
5. Recipe review: edible ingredient quantities, food identifiers and raw/cooked state, recipe yield, serving basis, nutrient method, allergen completeness, diet suitability, source date and reviewer. Check Vietnamese and international recipes individually.
6. Planner: limits on user-confirmed recipe portions, balanced multi-dish composition, whole-day nutrient checks, handling unknown meals and unverified dishes. Current code does not automatically optimize calorie allocations.
7. Pilot: score an independent bilingual holdout covering missing data, age boundaries, extreme requests, allergy changes, swapped recipes, shared profiles, stale plans and provider failure. All known-allergy, child-boundary and authorization cases must pass before inviting participants.

Runtime fields in `backend/assistant/policy.json` include `status`, `version`, `reviewedBy`, `reviewedAt`, `minimumAge`, `maximumAge`, `activityFactors`, `adjustments`, `energyBounds`, `mealShares`, `recipeServingBounds`, `weightGoalsEnabled`, `pediatricInterpretationEnabled` and optional `pediatricReferenceSha256`. Empty factors/bounds are deliberate. Single-recipe allocation also requires 30 Vietnamese and 30 international verified recipes; meal shares must sum to one and serving bounds must be explicitly reviewed. Do not fill these with generic internet constants and mark them approved without review.

Store provider processing approval separately through `ASSISTANT_PROVIDER_APPROVED`; clinical approval does not automatically authorize sending personal context to a vendor. No raw body measurements or birth dates are currently included in provider context.
