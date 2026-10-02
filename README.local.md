# EatVibing — local review

Branch: `local/saas-premium`. No changes are pushed.

## Run

Requires Node.js 24 (built-in SQLite).

```powershell
cd D:\AISC\EatVibing-https\backend
npm ci
npm run start:local
```

In a second terminal:

```powershell
cd D:\AISC\EatVibing-https\frontend
npm ci
npm run dev -- --host 127.0.0.1
```

Visit http://127.0.0.1:5173.

## Data

The local API reads Supabase `meals`, `ingredients`, and `recipes`. It never writes to Supabase. A snapshot supports offline startup; successful remote reads update the local cache. `backend/data/source-meals.json` contains additional recipes and corresponding dish photographs from TheMealDB, with source links. Supabase recipes retain their existing illustration URLs; they are labeled as illustrations because they may not depict the exact recipe. No nutritional estimates or cooking times are invented.

SQLite `backend/data/eatvibing.sqlite` stores the cached catalog, custom recipes, image overrides, visitor demo plans, favorites, planner, shopping checklist and plan events. The database is ignored by Git. A random browser visitor ID persists in localStorage. This is a local demo identity, not production authentication. The local API listens only on 127.0.0.1. Do not expose it publicly.

Free: full catalog, recipe details, search, category suggestions, 10 saved recipes and breakfast/lunch/dinner for today (Bangkok time). Pro demo: unlimited favorites and named collections, planning preferences, 21 weekly meal slots, locked meals, single-slot swaps, multiple dated weeks, reusable named plans, pantry quantities, aggregated groceries, text export, recipe notes and serving adjustments. Upgrade/downgrade changes local entitlements only; no payment integration. Downgrading retains data and blocks Pro mutations.

Preferences select the source recipe category, cuisine, people and avoided ingredients. Automatic generation minimizes repetition, prefers pantry matches and keeps locked meals; manual selection remains available. Generation validates all 21 slots before committing, so impossible filters leave the existing week intact. Meal tags are initially inferred from recipe names and can be confirmed on detail pages. Recipe categories are not verified nutrition targets. Ingredient text matching is not a guarantee about allergens.

Serving counts are not invented. On a Pro recipe detail page, confirm **Original recipe serves** from the source before scaling quantities. Unknown serving counts retain source quantities and appear in grocery warnings. Structured ingredient rows in `ev_recipe_ingredients` retain name, quantity, unit and original text. The parser handles common fractions, grams/kilograms, millilitres/litres and a limited English/Vietnamese alias dictionary. Compatible measured items are summed across every scheduled occurrence, including repeats, then pantry quantities are subtracted. Different units and ambiguous source measures stay separate. Grocery regeneration preserves checkmarks only when the remaining quantity is unchanged; plan/pantry/metadata changes mark the list outdated.

The previous daily planner is migrated once into dinner slots for the current week. Original tables are retained. New local tables store preferences, dated slots, reusable templates, pantry, grocery snapshots, notes, collections, serving metadata and structured ingredients. Recipe serving metadata is shared within this local catalog; notes and personal planning data are scoped to the local visitor.

## Checks

```powershell
cd D:\AISC\EatVibing-https\backend
npm test
cd ..\frontend
npx eslint src/PremiumFeatures.jsx src/WeeklyPlanner.jsx src/RecipeTools.jsx src/LocalProvider.jsx src/_components/pages/Guide.jsx
npm run build
```

The tests use an isolated SQLite database and a temporary HTTP server. They cover Free limits, Pro endpoint gates, 21-slot generation, locks, swaps, atomic failed generation, cross-visitor ownership, grocery arithmetic, pantry subtraction, checklist invalidation, templates, notes, collections, servings and downgrade data retention.

`/admin` creates local recipes and overrides each meal's image URL. Reload the library after saving. The original Home, Navbar, Chat and Community components are retained. Existing AI chat needs the original AI service configuration; the local server does not start that integration. The random recipe picker is inside the original Guideline page. Added pricing, detail and planner pages use scoped neutral styles that do not alter the existing pages.

## Supabase migration draft

`supabase/migrations/202610020001_premium.sql` is a reviewable additive schema for a future authenticated release. It has not been applied. Subscription writes have no client policy; real payment entitlement updates must be made by trusted server code. Demo upgrades remain local.

`supabase/migrations/202610020002_planning_draft.sql` adds a draft for dated meal slots, preferences, saved plans, pantry, notes, collections and structured ingredients. It has not been applied. Planner limits and collection membership writes require trusted server endpoints in a future hosted release.

Research references:

- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/auth/managing-user-data
- https://www.themealdb.com/api.php
