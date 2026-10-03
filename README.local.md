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

`/admin` creates local recipes and overrides each meal's image URL. Reload the library after saving. The original Home, Navbar, Chat and Community components are retained. The new family assistant is available locally through /today, /profile, /family and /chat. See README.assistant.md for authenticated setup, clinical gates and remaining release work. The random recipe picker is inside the original Guideline page. Added pricing, detail and planner pages use scoped neutral styles that do not alter the existing pages.

## Supabase migration draft

`supabase/migrations/202610020001_premium.sql` is a reviewable additive schema for a future authenticated release. It has not been applied. Subscription writes have no client policy; real payment entitlement updates must be made by trusted server code. Demo upgrades remain local.

`supabase/migrations/202610020002_planning_draft.sql` adds a draft for dated meal slots, preferences, saved plans, pantry, notes, collections and structured ingredients. It has not been applied. Planner limits and collection membership writes require trusted server endpoints in a future hosted release.

Research references:

- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/auth/managing-user-data
- https://www.themealdb.com/api.php

## Cuisine browsing and pagination

The Guideline and Saved pages show 12 recipes per page, numbered navigation and a result range. Search, category, region, country, collection and page are stored in URL parameters; changing a filter starts at page 1. Search matches dish names, ingredients, country names and cooking instructions, including Vietnamese without accents. The desktop sidebar sticks 24px from the viewport top and scrolls independently when its expanded country lists exceed the viewport. Mobile uses a stacked layout. The app container uses `overflow-x-clip` so it does not break document-level sticky positioning.

Country names in the existing Vietnamese catalog and TheMealDB English catalog are grouped under Asia, Europe, Americas and Other cuisines using `frontend/src/cuisines.js`. Country choices and counts come from the available catalog; countries without recipes are not shown. The current catalog contains 58 recipes across 22 countries. This categorizes the cuisine recorded by the source; it is not a certification of a dish's historical origin.

Twelve additional recipe records were retrieved from TheMealDB on 2026-10-03 with ingredient measurements, instructions, dish photographs and original source links. Imports fall back to `strCountry` where `strArea` is missing and link to the specific TheMealDB meal when no original URL is supplied. Standalone `STEP n` headings are excluded from the cooking-step count. The Sushi ingredient transcription was corrected against Good Food (rice unit, rice vinegar, soy sauce quantity and missing nori); its review note is retained in the catalog. Recipe variants are those of the linked authors. No serving counts, cooking times or nutrition values were estimated.

Recipe research and source checks:

- https://www.bbcgoodfood.com/recipes/simple-sushi
- https://www.bbcgoodfood.com/recipes/easy-pad-thai
- https://www.bbcgoodfood.com/recipes/must-make-moussaka
- https://www.bbcgoodfood.com/recipes/black-bean-meat-stew-feijoada
- https://www.japan.travel/en/local-specialities/local-foods/
- https://www.italia.it/en/italy/things-to-do/pasta-types-italian-formats-and-recipes

Validation: targeted frontend ESLint, production Vite build, backend tests, catalog integrity assertions and browser checks for sticky scrolling, page 2, country filtering, Vietnamese search, empty results and a 390px mobile viewport.

The full production build passes with the completed Community stylesheet.

## English interface

Cuisine menus display English region and country names. Vietnamese country aliases remain available for search. `backend/data/recipe-english.json` supplies English names, ingredients and cooking steps for the 30 original Supabase recipes. The local API applies these translations without modifying the source snapshot or writing to Supabase. Original ingredient lines and dish names remain available for Vietnamese search, ingredient avoidance and meal-type inference. Recipe IDs, saved meals and planner entries retain their existing identities. Cached generated grocery labels and warnings are translated for display without changing their keys or quantities. User-authored notes, pantry entries and custom recipes retain their submitted text.

## Pricing interface

Pricing displays Basic at $0/month and Pro at $10/month. Both cards list the same ten feature groups. Basic includes recipe browsing, ten saved recipes and daily planning; unavailable features use an X. All Pro features use green checkmarks. The Basic plan retains the internal `free` identifier so existing saved content and entitlements remain compatible. AI Assistant has a Pro access screen on the frontend; pilot access for the new assistant is granted separately by the authenticated server. Visible plan names, notices and upgrade links omit demo terminology. Community removes placeholder membership counts and uses descriptive browser-storage text.

The FAQ and Pro activation dialog explain that billing is not connected and activation does not collect payment. These UI changes do not create a payment integration or a recurring subscription.
