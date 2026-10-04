# EatVibing family assistant

Vietnamese system inventory and roadmap: [Bảng chức năng, công việc đã làm và kế hoạch hệ thống](docs/ke-hoach-he-thong.md).

Implemented on 2026-10-03. The interface remains English; deterministic chat responses support Vietnamese and English. This is a reviewable implementation with a local demo and an authenticated server entry point. It has not been deployed, clinically approved or tested with real pilot families.

## What works

- `/profile`: personal preferences, goals, daily routine, cooking conditions, timezone, metric/imperial measurements, corrections, dated measurement history and weight chart. BMI is computed, never entered. Adults aged 20+ receive screening categories; ages 2–19 never receive adult categories. Resting energy uses the versioned Mifflin–St Jeor calculation when eligible and complete.
- `/family`: one active household, accepted adult invitations, separate adult profiles, independent sharing controls, guardian-managed children aged 2–17, leaving and transferring household ownership. Children reaching 18 are frozen pending a separate adult-account transition; the application does not silently transfer their data.
- `/today`: planned/completed activity, whole-day activity level, home/outside/unknown meals, cooking time, contextual actions and food diary. Unknown school meals stay unknown. An incomplete diary does not produce a complete intake total.
- `/family-planner`: multiple dishes and participant servings, manual portions, day/week previews, explicit confirmation, weekly atomic saves, previous-week reuse, locks, swaps, pantry, grocery subtraction, quantity-dependent checkmarks, text download and weekly feedback. Automatic portions are recipe servings for users to confirm, not clinical portion prescriptions.
- `/chat`: preserved URL, renamed AI Assistant, relevant history and permitted context, member clarification, meal/swap previews, tomorrow/date handling and confirmation. Qualitative conversation uses the approved provider only with member consent. Planning, profiles and diaries continue to work without a provider. Broad week/day-of-week requests link to date selection rather than guessing.
- `/nutrition-review`: server-authorized recipe import, nutrition review, allergen/diet metadata, source tracking, USDA FoodData Central lookup and readiness counts. Existing recipe IDs are preserved.
- `/api/v1/pilot/metrics`: authorized aggregate provider status, response p95, token usage, plan confirmations and feedback reasons. It contains no health fields, auth tokens or conversation text. It is a bounded operational view, not a complete analytics or audit system.

## Local review

Node.js 24 is required for built-in SQLite. Start the backend with `npm run start:local` in `backend`, then `npm run dev -- --host 127.0.0.1` in `frontend`. Open `/today` and choose the local demo entry. A random, expiring HttpOnly cookie identifies this demo; it is separate from the older recipe planner's browser visitor identity. Local demo records are not imported into real accounts automatically.

Optional isolated review configuration:

```powershell
$env:LOCAL_API_PORT = '5010'
$env:LOCAL_DB_PATH = 'D:\AISC\EatVibing-https\backend\data\assistant-review.sqlite'
npm run start:local
```

In the frontend shell set `$env:API_PROXY_TARGET = 'http://127.0.0.1:5010'` before running Vite. The local API binds loopback and must not be exposed as the authenticated production service.

## Authenticated deployment setup

1. Review and apply `supabase/migrations/202610030001_family_assistant.sql` to the intended Supabase project. It is additive and has **not** been applied by this task.
2. Configure server values from `backend/.env.assistant.example`: Supabase URL and service-role key, exact `APP_ORIGIN`, pilot account IDs, reviewer IDs and optional provider/USDA credentials. Configure public frontend Supabase URL/anon key from `frontend/.env.assistant.example`. Never put the service-role key or provider key in a Vite variable.
3. Start `npm run start:assistant` from `backend`, build the frontend and route same-origin `/api` requests through an HTTPS reverse proxy to the loopback server. `backend/server.js` uses this authenticated entry point as well.
4. Validate real Supabase sign-in, expired/revoked tokens, invitation acceptance, migrations and two separate households in staging. Local tests mock token verification; no production credentials were available for live verification.
5. Leave `ASSISTANT_PROVIDER_APPROVED=false` until quality, reliability and data-processing review are complete. Chat access is granted by `ASSISTANT_PILOT_IDS`, independent of demo Free/Pro billing.

The authenticated entry point serves the existing catalog/detail pages and routes `/planner` to the family planner. Older premium visitor mutations remain local-only and return HTTP 410 in hosted mode. Payment, favorites/collections migration and real premium entitlements are outside this implementation's hosted workflow.

## Data and authorization

Every `/api/v1` request derives identity from `auth.getUser(bearerToken)`; body `userId`, visitor ID and client entitlement fields are not trusted. API projections check current household membership and sharing on every read. Body history and goals are shared independently. Changing sharing or AI consent invalidates history reuse and in-flight provider replies. Proposals are checked again against current profile, check-in, plan, pantry and catalog before saving. Confirmation is idempotent; failed weekly validation commits no days.

SQLite and Supabase use the same versioned store contract. The Supabase migration is a **service-only, compare-and-set JSON document**, with browser table/RPC access revoked and RLS enabled. This supports an isolated pilot and atomic operations, but all families currently share one persistence row. Before broad production rollout, normalize household/member rows, add indexed queries, per-entity RLS, migration/backfill tooling, retention/export/deletion workflows, durable audit events and measured concurrency/rate-limit handling. Do not treat the current persistence adapter as a scalable multi-tenant production schema.

Conversation data is private to the requesting adult. Provider context is intentionally minimized; measurements and birth dates are not sent. Guardian records stay with the guardian after leaving a household. An adult account transition at 18 requires explicit identity/consent work and is currently blocked rather than inferred.

The 2026-10-04 review fixes restrict provider plan context to the selected consenting member's dishes, portions and nutrition. Other household participants, portions and totals are excluded. Provider history is reused only for the same current context; legacy messages without a context fingerprint are excluded from provider history. If the selected profile, restrictions, daily context, plan or supplied recipe context changes while a provider request is pending, its reply is rejected with HTTP 409 and is not saved. Fingerprints of private profile fields remain local to the server.

Saved plans, groceries, locked previews, confirmation replies and previous-week reuse re-project participation under current permissions. Departed or non-sharing members' portions are omitted. Slots with no remaining participants disappear from the projection; unlocking can remove their stale slot. Unlocking also remains available to repair a conflicting meal, while locking and confirming still validate current allergies and dietary suitability.

## Clinical gates and recipe preparation

`backend/assistant/policy.json` is a draft. Daily energy factors, goal adjustments, energy bounds and pediatric interpretation remain off until a qualified reviewer supplies an approved, versioned policy. Set `NUTRITION_POLICY_PATH` to the reviewed JSON; restart the service after policy changes. The configuration is not a substitute for the review described in `docs/nutrition-policy-review.md`.

Daily needs use a single whole-day factor. No exercise MET value is added to that factor, and planned exercise never becomes completed automatically. Targets require approved adjustments and bounds; AI never supplies these constants. Special-care profiles and incomplete/out-of-scope records receive general meal guidance. Neither next-day compensation nor automatic goal changes are implemented.

Pediatric BMI needs `NUTRITION_REFERENCE_PATH` pointing to the original CDC BMI-for-age CSV, plus an approved policy with `pediatricInterpretationEnabled=true` and `pediatricReferenceSha256` matching the bytes loaded. The loader validates required columns and row count. Age/sex-specific screening bands use P5/P85/P95; it does not invent extreme percentiles. The CDC CSV was not installed because the official download returned access denied during this task. Pediatric interpretation stays disabled.

`backend/data/nutrition-review-queue.json` contains **60 pending candidates**, targeting 30 Vietnamese and 30 international recipes. It is a preparation queue, **not 60 verified recipes**. Some Vietnamese candidates still need source recipes and quantified ingredients. No serving counts, nutrient values or clinical approval were fabricated. Reviewers can import sourced recipes and enter checked per-serving values using `/nutrition-review`; readiness requires both 30/30 verified recipes and policy approval. USDA searches require `USDA_FDC_API_KEY` and never automatically certify a recipe.

Recipe imports retain source ingredients and steps. Ingredient parsing supports common mass/volume units, but cannot reliably infer edible yield, raw/cooked state, cup-to-gram density or ambiguous source measures. Such rows produce grocery warnings. Ingredient-level food identifiers and a comprehensive reviewed nutrient-calculation pipeline remain data preparation work; entered recipe nutrition is reviewed per-serving data.

## Explicit demo import

In Family planner, open **Import a demo plan**, select a JSON file and inspect every proposed day before **Confirm full week**. Imported servings belong only to the requesting profile. Household IDs, account IDs, visitor IDs, history and private profiles are never imported. Family participation can be edited explicitly afterward.

```json
{
  "days": [{
    "date": "2026-10-05",
    "entries": [{
      "slot": "dinner",
      "dishes": [{ "mealId": "EXISTING_RECIPE_ID", "servings": 1 }]
    }]
  }]
}
```

Use IDs from `/api/v1/catalog`. Importing unavailable recipes or conflicting dietary ingredients fails without overwriting saved plans. There is no automatic export/import of the legacy browser planner database.

## API map

`GET /api/v1/assistant/status` reports whether server configuration, account access and member consent allow provider conversation. It never returns keys or provider URLs and does not claim to have tested the provider network. A missing `.env` produces an explicit not-connected notice; meal previews remain available. Chat renders POST replies directly, preserves failed drafts, uses a request timeout and guards against duplicate UI submissions. Numbered cooking steps are allowed; numerical nutrition targets remain filtered.

All paths below are under `/api/v1`, authenticated except the local-only demo-session initializer.

| Path | Operations |
| --- | --- |
| `/profile`, `/measurements` | Read/update permitted profile; append or correct dated measurements |
| `/households`, `/members`, `/invites`, `/invites/accept` | Household, guardian children, accepted invitations |
| `/check-ins`, `/meal-logs`, `/today` | Daily context, actual/unknown intake and Today projection |
| `/plan-proposals`, `/weekly-proposals`, `/plan-proposals/:id/confirm` | Explicit day/week previews and revalidated commits |
| `/plans`, `/plans/lock`, `/demo-imports` | Confirmed plans, locking and chosen demo file previews |
| `/pantry`, `/groceries`, `/groceries/check` | Household ingredients and quantity-dependent checklist |
| `/assistant/messages`, `/feedback`, `/summary` | Permitted history, qualitative assistant and weekly recap |
| `/catalog`, `/nutrition/readiness` | Recipes and verified-data readiness |
| `/recipe-imports`, `/nutrition/:mealId`, `/nutrition/foods`, `/pilot/metrics` | Authorized review and operational metrics |

Assistant responses keep `answer`, adding proposal/cards, missing information, sources, estimate status and provider status. Model prose is never executed as a write. Free-form numerical nutrition and claims of saved actions are filtered; reviewed structured cards remain authoritative. This conservative filter is not a guarantee that every qualitative model statement is correct.

## Verification and remaining release work

```powershell
cd backend
npm test
npm run eval:assistant
cd ..\frontend
npx eslint src/assistant src/App.jsx src/LocalProvider.jsx src/localApi.js src/supabaseClient.js src/_components/navbar.jsx
npm run build
```

The backend suite covers BMI/units/age boundaries, separate identities, privacy revocation, child guards, history correction, stale/expired proposals, multi-dish arithmetic, atomic weeks, pantry/checklist invalidation, offline provider, future activity, explicit import and existing premium regressions. The 107-case evaluation is deterministic/offline: it is **not** a live LLM assessment or an expert-scored holdout.

Latest local validation on 2026-10-04: **43 backend checks passed** (including subtests), **107 offline cases passed**, targeted frontend ESLint including Community passed and Vite production build passed. Regression coverage includes per-member provider plan context, current/legacy history, in-flight restrictions/consent/check-in/plan/catalog changes, withdrawn/departed participants, grocery quantities, unlocking and previous-week reuse. The build reports a bundle-size advisory and an outdated Browserslist database; neither is a build failure. `git diff --check` passed. Earlier browser checks on 2026-10-03 covered desktop and 390px mobile without horizontal overflow; previously found duplicate React keys were corrected. This fix did not repeat live browser or external-service verification.

Desktop and a 390px mobile browser were checked using synthetic local profiles, family creation, check-in, unknown school lunch, chat preview and confirmed plans. Screenshots are under `artifacts/assistant`. No real health data was used.

Before a real 10–20-family pilot: complete verified 30/30 recipe data and specialist review; configure and test the real Supabase/provider environment; score at least 100 diverse Vietnamese/English live-provider holdout cases; finish participant consent/retention and adult transition procedures; measure check-in completion, p95 responses and provider cost with real telemetry. Current ranking uses preferences, cuisine, pantry, reviewed cooking time, feedback and diversity. A gated single-recipe energy allocation helper requires approved `mealShares` summing to one, `recipeServingBounds`, an eligible adult target and the full 30/30 verified catalog. It never allocates child deficits or clamps quantities while claiming a target is met. Manual portions take precedence; other adults' targets require both body and goal sharing. Whole-day optimization across multiple dishes and nutrient constraints remains future work. Cost totals require agreed provider pricing; token counts alone are not cost. No fine-tuning was performed.

## Research references

- [WHO healthy diet](https://www.who.int/news-room/fact-sheets/detail/healthy-diet)
- [CDC BMI](https://www.cdc.gov/bmi/index.html) and [growth chart data files](https://www.cdc.gov/growthcharts/cdc-data-files.htm)
- [NIDDK guidance for children](https://www.niddk.nih.gov/health-information/weight-management/helping-your-child-who-is-overweight)
- [Mifflin–St Jeor study](https://pubmed.ncbi.nlm.nih.gov/2305711/)
- [USDA FoodData Central API guide](https://fdc.nal.usda.gov/api-guide/)
- [Supabase getUser](https://supabase.com/docs/reference/javascript/auth-getuser)
- [OpenAI optimizing LLM accuracy](https://developers.openai.com/api/docs/guides/optimizing-llm-accuracy)
