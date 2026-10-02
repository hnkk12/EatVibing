import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { Context } from "./dataContext";
import { api } from "./localApi";
const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const slots = ["breakfast", "lunch", "dinner"];
const title = (s) => s[0].toUpperCase() + s.slice(1);
export function PreferenceForm() {
  const { state, mutate, meals, notice } = useContext(Context);
  const p = state.preferences || {
    people: 2,
    category: "all",
    avoid: [],
    origins: [],
    activeWeek: "",
  };
  const [people, setPeople] = useState(p.people),
    [category, setCategory] = useState(p.category),
    [avoid, setAvoid] = useState(p.avoid.join(", ")),
    [origin, setOrigin] = useState(p.origins[0] || ""),
    [week, setWeek] = useState(p.activeWeek),
    [busy, setBusy] = useState(false);
  if (state.plan !== "pro") return null;
  return (
    <form
      className="feature-panel"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        if (
          await mutate("/preferences", {
            people: Number(people),
            category,
            avoid: avoid
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            origins: origin ? [origin] : [],
            activeWeek: week,
          })
        )
          notice(
            "Preferences saved. Existing meals stay unchanged until you regenerate.",
          );
        setBusy(false);
      }}
    >
      <h2>Planning preferences</h2>
      <div className="feature-fields">
        <label>
          People
          <input
            aria-label="People"
            required
            type="number"
            min="1"
            max="20"
            value={people}
            onChange={(e) => setPeople(e.target.value)}
          />
        </label>
        <label>
          Recipe category
          <select
            aria-label="Recipe category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">All meals</option>
            <option value="balance">Balanced</option>
            <option value="loss">Weight Loss</option>
            <option value="gain">Bulking</option>
          </select>
        </label>
        <label>
          Cuisine
          <select
            aria-label="Cuisine"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          >
            <option value="">Any cuisine</option>
            {[...new Set(meals.map((m) => m.origin))].sort().map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </label>
        <label>
          Week starting Monday
          <input
            required
            aria-label="Week starting Monday"
            type="date"
            value={week}
            onChange={(e) => setWeek(e.target.value)}
          />
        </label>
        <label className="wide-field">
          Ingredients to avoid
          <input
            aria-label="Ingredients to avoid"
            value={avoid}
            onChange={(e) => setAvoid(e.target.value)}
            placeholder="mushroom, shrimp, peanuts…"
          />
        </label>
      </div>
      <p className="subtle">
        Ingredient matching uses recipe text and known aliases. Always verify
        ingredients for allergies. Categories follow the source; they are not
        nutrition targets.
      </p>
      <button disabled={busy} className="btn secondary">
        {busy ? "Saving…" : "Save preferences"}
      </button>
    </form>
  );
}
function Pantry() {
  const { state, mutate } = useContext(Context);
  const [text, setText] = useState("");
  return (
    <div className="feature-panel">
      <h2>What is in your pantry?</h2>
      <p>
        These quantities are subtracted from your grocery list. Mass and volume
        are kept separate.
      </p>
      <form
        className="inline-feature-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await mutate("/pantry", { text })) setText("");
        }}
      >
        <input
          aria-label="Pantry ingredient"
          required
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="200 g chicken breast"
        />
        <button className="btn secondary">Add ingredient</button>
      </form>
      <ul className="plain-feature-list">
        {(state.pantry || []).map((p) => (
          <li key={p.id}>
            <span>{p.raw}</span>
            <button
              aria-label={`Remove pantry ${p.raw}`}
              onClick={() => mutate("/pantry", { remove: p.id })}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      {!state.pantry?.length && (
        <p className="subtle">
          Add measured ingredients such as 500 ml milk or 2 pieces egg.
        </p>
      )}
    </div>
  );
}
function SavedPlans() {
  const { state, mutate, notice } = useContext(Context);
  const [name, setName] = useState("");
  return (
    <div className="feature-panel">
      <h2>Saved plans</h2>
      <p>
        Keep a week you like and apply it to the selected week. Applying
        replaces that week's meals.
      </p>
      <form
        className="inline-feature-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await mutate("/templates", { name })) {
            setName("");
            notice("Weekly plan saved.");
          }
        }}
      >
        <input
          aria-label="Plan name"
          required
          maxLength="80"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Busy Week / Family Favorites"
        />
        <button className="btn secondary" disabled={!state.planner.length}>
          Save this week
        </button>
      </form>
      <ul className="plain-feature-list">
        {(state.templates || []).map((t) => (
          <li key={t.id}>
            <span>
              {t.name}
              <small>{t.count} meals</small>
            </span>
            <button
              onClick={async () => {
                if (await mutate("/templates", { apply: t.id }))
                  notice("Saved plan applied to the selected week.");
              }}
            >
              Use this plan
            </button>
            <button
              onClick={() => mutate("/templates", { remove: t.id })}
              aria-label={`Delete plan ${t.name}`}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
      {!state.templates?.length && (
        <p className="subtle">Your saved weeks will appear here.</p>
      )}
    </div>
  );
}
function GroceryList() {
  const { state, mutate } = useContext(Context);
  const [showCovered, setShowCovered] = useState(false);
  function download() {
    const text = [
      "EatVibing grocery list",
      `Week: ${state.preferences.activeWeek}`,
      state.shoppingStale
        ? "OUTDATED: regenerate after changing meals or pantry."
        : "",
      ...state.shopping.map(
        (i) =>
          `${i.covered ? "[pantry]" : i.checked ? "[x]" : "[ ]"} ${i.label}${!i.structured && i.occurrences > 1 ? ` (used in ${i.occurrences} meals; verify total amount)` : ""}`,
      ),
      ...(state.shoppingWarnings || []),
    ].join("\n");
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "eatvibing-grocery-list.txt";
    a.click();
    URL.revokeObjectURL(url);
  }
  const list = state.shopping || [],
    visible = list.filter((i) => showCovered || !i.covered);
  return (
    <div className="shopping-panel">
      <div className="section-heading">
        <div>
          <h2>Smart grocery list</h2>
          <p>
            Combined across every scheduled meal, adjusted for verified servings
            and reduced by pantry quantities.
          </p>
        </div>
        <button
          className="btn secondary"
          disabled={!state.planner.length}
          onClick={() => mutate("/shopping", { generate: true })}
        >
          Generate from plan
        </button>
      </div>
      {state.shoppingStale && (
        <p className="feature-warning" role="status">
          Your plan, pantry or recipe servings changed. Regenerate this list
          before shopping.
        </p>
      )}
      {list.length ? (
        <>
          <label className="inline-check">
            <input
              type="checkbox"
              checked={showCovered}
              onChange={(e) => setShowCovered(e.target.checked)}
            />
            Show ingredients already covered by pantry (
            {list.filter((i) => i.covered).length})
          </label>
          <div className="shopping-grid">
            {visible.map((i) => (
              <label
                key={i.key}
                className={i.checked || i.covered ? "checked" : ""}
              >
                <input
                  type="checkbox"
                  checked={!!i.checked || i.covered}
                  disabled={i.covered || state.shoppingStale}
                  onChange={() =>
                    mutate("/shopping", { key: i.key, checked: !i.checked })
                  }
                />
                <span>
                  {i.label}
                  {i.available > 0 && (
                    <small>
                      {i.available} {i.unit} available in pantry
                    </small>
                  )}
                  {!i.structured && (
                    <small>
                      Source measure · {i.occurrences} meal occurrence(s) ·
                      verify quantity
                    </small>
                  )}
                </span>
              </label>
            ))}
          </div>
          {!visible.length && (
            <p>All measured ingredients are already covered by your pantry.</p>
          )}
          <details className="feature-warning">
            <summary>
              Quantity and serving checks ({state.shoppingWarnings?.length || 0}
              )
            </summary>
            <ul>
              {(state.shoppingWarnings || []).map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
            <p>
              Set original serving counts on recipe pages to enable accurate
              scaling. Ambiguous measures are retained for manual checking.
            </p>
          </details>
          <button
            className="text-link"
            onClick={download}
            disabled={state.shoppingStale}
          >
            Download list as .txt →
          </button>
        </>
      ) : (
        <p className="subtle">Add meals, then generate your grocery list.</p>
      )}
    </div>
  );
}
export default function WeeklyPlanner() {
  const { meals, state, mutate, loading, error, load, notice } =
    useContext(Context);
  const [choice, setChoice] = useState(null),
    [query, setQuery] = useState(""),
    [busy, setBusy] = useState(false);
  const pro = state.plan === "pro",
    p = state.preferences || { people: 2, activeWeek: "" };
  const selectedDays = pro ? days.map((_, i) => i) : [state.currentDay ?? 0];
  if (loading) return <p className="feature-panel">Loading your plan…</p>;
  if (error)
    return (
      <div className="feature-panel">
        {error}
        <button onClick={load}>Try again</button>
      </div>
    );
  return (
    <section className="page section planner-feature">
      <div className="section-heading">
        <div>
          <h1 className="page-title">
            {pro ? "Weekly Meal Plans" : "Your daily plan"}
          </h1>
          <p>
            {pro
              ? "Breakfast, lunch and dinner for all 7 days."
              : "Free lets you choose breakfast, lunch and dinner for today."}
          </p>
          <small>
            {pro ? p.activeWeek : state.today} · {pro ? "Pro demo" : "Free"}
          </small>
        </div>
        {pro ? (
          <button
            className="btn primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              if (await mutate("/planner/generate", {}))
                notice("Weekly plan generated. Locked meals were kept.");
              setBusy(false);
            }}
          >
            {busy ? "Planning…" : "Generate weekly plan"}
          </button>
        ) : (
          <Link className="btn secondary" to="/pricing">
            Unlock the full week with Pro →
          </Link>
        )}
      </div>
      {pro && <PreferenceForm key={JSON.stringify(p)} />}
      <div className={`week-grid ${pro ? "" : "daily-grid"}`}>
        {selectedDays.map((day) => (
          <article className="day-card" key={day}>
            <span className="eyebrow">{days[day]}</span>
            {slots.map((slot) => {
              const entry = state.planner.find(
                  (e) => e.day === day && e.slot === slot,
                ),
                meal = meals.find((m) => m.id === entry?.meal);
              return (
                <section className="meal-slot" key={slot}>
                  <h3>{title(slot)}</h3>
                  {meal ? (
                    <>
                      <Link to={`/recipes/${meal.id}`}>
                        <img
                          src={meal.image_url}
                          alt={meal.name}
                          loading="lazy"
                        />
                        <h4>{meal.name}</h4>
                      </Link>
                      <small>
                        {meal.baseServings
                          ? `${entry.servings} people · quantities scaled`
                          : "Source quantities · set original servings"}
                      </small>
                      {pro && (
                        <label className="inline-check">
                          <input
                            type="checkbox"
                            aria-label={`Lock ${days[day]} ${slot}`}
                            checked={!!entry.locked}
                            onChange={() =>
                              mutate("/planner", {
                                ...entry,
                                locked: !entry.locked,
                              })
                            }
                          />
                          Keep this meal
                        </label>
                      )}
                      <div className="slot-actions">
                        <button
                          onClick={() => {
                            setChoice({ day, slot });
                            setQuery("");
                          }}
                          disabled={!!entry.locked}
                        >
                          Choose another
                        </button>
                        {pro && (
                          <button
                            disabled={!!entry.locked}
                            onClick={() =>
                              mutate("/planner/swap", { day, slot })
                            }
                          >
                            Suggest swap
                          </button>
                        )}
                        <button
                          disabled={!!entry.locked}
                          aria-label={`Remove ${days[day]} ${slot}`}
                          onClick={() =>
                            mutate("/planner", { day, slot, meal: null })
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      className="add-day"
                      onClick={() => setChoice({ day, slot })}
                    >
                      + Choose {slot}
                    </button>
                  )}
                </section>
              );
            })}
          </article>
        ))}
      </div>
      {pro ? (
        <>
          <SavedPlans />
          <Pantry />
          <GroceryList />
        </>
      ) : (
        <div className="feature-panel">
          <h2>More than a daily plan</h2>
          <p>
            Pro plans all 7 days, follows your preferences, saves reusable weeks
            and combines shopping quantities.
          </p>
          <Link className="btn secondary" to="/pricing">
            Explore Pro demo
          </Link>
        </div>
      )}
      {choice && (
        <div className="modal-backdrop">
          <div
            className="modal picker"
            role="dialog"
            aria-modal="true"
            aria-labelledby="meal-picker-title"
          >
            <button
              className="modal-close"
              aria-label="Close meal picker"
              onClick={() => setChoice(null)}
            >
              ×
            </button>
            <h2 id="meal-picker-title">
              {days[choice.day]} · {title(choice.slot)}
            </h2>
            <input
              className="picker-search"
              aria-label="Search recipes for plan"
              placeholder="Search recipes…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <p className="subtle">
              Choose any recipe manually. Automatic planning follows meal tags
              and preferences.
            </p>
            <div className="picker-list">
              {meals
                .filter((m) =>
                  m.name.toLowerCase().includes(query.toLowerCase()),
                )
                .map((m) => (
                  <button
                    key={m.id}
                    onClick={async () => {
                      if (
                        await mutate("/planner", {
                          day: choice.day,
                          slot: choice.slot,
                          meal: m.id,
                        })
                      )
                        setChoice(null);
                    }}
                  >
                    <img src={m.image_url} alt={m.name} />
                    <span>
                      {m.name}
                      <small>{m.origin}</small>
                    </span>
                    +
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
export function PersonalizedSuggestions() {
  const { state, notice } = useContext(Context);
  const [category, setCategory] = useState("all"),
    [meal, setMeal] = useState(null),
    [busy, setBusy] = useState(false);
  return (
    <div className="mb-16 bg-white border border-gray-100 p-16 rounded-sm text-center shadow-sm">
      <h2 className="text-2xl font-light tracking-widest uppercase">
        {state.plan === "pro" ? "Personalized Picker" : "Random Picker"}
      </h2>
      <p className="text-gray-400 mt-2 text-sm">
        {state.plan === "pro"
          ? "Your preferences and pantry ingredients guide each suggestion."
          : "Find something to cook today."}
      </p>
      {state.plan === "pro" ? (
        <div className="premium-features text-left">
          <PreferenceForm key={JSON.stringify(state.preferences)} />
        </div>
      ) : (
        <select
          className="mt-6 border border-zinc-200 p-2 text-xs"
          aria-label="Suggestion category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="all">All meals</option>
          <option value="balance">Balanced</option>
          <option value="loss">Weight Loss</option>
          <option value="gain">Bulking</option>
        </select>
      )}
      <button
        disabled={busy}
        className="mt-8 px-10 py-3 border border-black hover:bg-black hover:text-white transition-all duration-500 uppercase text-xs tracking-[0.2em]"
        onClick={async () => {
          setBusy(true);
          try {
            setMeal((await api("/suggestions", { category })).meal);
          } catch (e) {
            notice(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Finding a recipe…" : "Generate Recipe"}
      </button>
      {meal && (
        <Link className="block mt-8 text-black" to={`/recipes/${meal.id}`}>
          <img
            className="w-40 h-40 object-cover mx-auto mb-4"
            src={meal.image_url}
            alt={meal.name}
          />
          <p className="text-sm">{meal.name} → View Recipe</p>
        </Link>
      )}
    </div>
  );
}
