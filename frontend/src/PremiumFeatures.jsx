import { useState, useEffect, useContext } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  Heart,
  Check,
  Crown,
  X,
  Utensils,
  Plus,
} from "lucide-react";
import { Context } from "./dataContext";
import "./premium.css";
import "./planning.css";
import Planner from "./WeeklyPlanner";
import RecipeTools from "./RecipeTools";
import { cuisineFor } from "./cuisines";
const categories = {
  all: "All meals",
  balance: "Balanced",
  loss: "Weight Loss",
  gain: "Bulking",
};
const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
function FoodImage({ meal, className = "" }) {
  const [broken, setBroken] = useState(null);
  return broken === meal.image_url ? (
    <div className={`image-fallback ${className}`}>
      <Utensils size={36} />
      <span>{meal.name}</span>
      <small>Image unavailable</small>
    </div>
  ) : (
    <img
      className={className}
      src={meal.image_url}
      alt={meal.name}
      onError={() => setBroken(meal.image_url)}
      loading="lazy"
    />
  );
}
function Card({ meal }) {
  const { state, mutate } = useContext(Context);
  const saved = state.favorites.includes(meal.id);
  return (
    <article className="food-card">
      <div className="food-photo">
        <Link to={`/recipes/${meal.id}`}>
          <FoodImage meal={meal} />
        </Link>
        <span className="photo-tag">{categories[meal.category]}</span>
        <button
          className={`save-button ${saved ? "saved" : ""}`}
          aria-label={`${saved ? "Unsave" : "Save"} ${meal.name}`}
          onClick={() => mutate("/favorites", { meal: meal.id })}
        >
          <Heart size={18} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="card-meta">
        <span>{cuisineFor(meal.origin).label}</span>
        <span>{meal.ingredients.length} ingredients</span>
      </div>
      <Link to={`/recipes/${meal.id}`}>
        <h3>{meal.name}</h3>
      </Link>
      <Link className="card-link" to={`/recipes/${meal.id}`}>
        View Recipe <ArrowRight size={15} />
      </Link>
    </article>
  );
}
function Detail() {
  const { id } = useParams();
  const { loading, error, load } = useContext(Context);
  if (loading) return <p className="feature-panel">Loading recipe…</p>;
  if (error)
    return (
      <div className="feature-panel">
        {error}
        <button onClick={load}>Try again</button>
      </div>
    );
  return <RecipeDetail key={id} id={id} />;
}
function RecipeDetail({ id }) {
  const { meals, state, mutate, notice } = useContext(Context);
  const meal = meals.find((m) => m.id === id);
  const [checked, setChecked] = useState([]),
    [finished, setFinished] = useState([]),
    [day, setDay] = useState(state.currentDay || 0),
    [slot, setSlot] = useState("dinner"),
    [servings, setServings] = useState(
      meal?.baseServings || state.preferences?.people || 2,
    );
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  if (!meal)
    return (
      <div className="empty">
        <h2>Recipe not found</h2>
        <Link to="/guide">Back to recipes</Link>
      </div>
    );
  const toggle = (value, list, set) =>
    set(
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
    );
  return (
    <section className="page section detail">
      <Link className="back-link" to="/guide">
        <ArrowLeft size={16} /> Recipe library
      </Link>
      <div className="detail-top">
        <div className="detail-image">
          <FoodImage meal={meal} />
          <small>{meal.image_note}</small>
        </div>
        <div className="detail-intro">
          <span className="eyebrow">
            {cuisineFor(meal.origin).label} · {categories[meal.category]}
          </span>
          <h1>{meal.name}</h1>
          <p>{meal.description}</p>
          <div className="recipe-stats">
            <span>
              <b>{meal.ingredients.length}</b> ingredients
            </span>
            <span>
              <b>{meal.recipes.length}</b> cooking steps
            </span>
            <span>
              <b>{meal.recipe_language === "en" ? "EN" : "VI"}</b> recipe
            </span>
          </div>
          <button
            className="btn primary"
            onClick={() => mutate("/favorites", { meal: id })}
          >
            <Heart size={18} />
            {state.favorites.includes(id)
              ? "Remove from saved recipes"
              : "Save recipe"}
          </button>
          <div className="plan-add">
            <label htmlFor="recipe-day">
              {state.plan === "pro"
                ? "Add to weekly plan"
                : "Add to today’s plan"}
            </label>
            <div>
              <select
                id="recipe-day"
                aria-label="Recipe plan day"
                value={state.plan === "pro" ? day : state.currentDay}
                onChange={(e) => setDay(Number(e.target.value))}
              >
                {days.map(
                  (d, i) =>
                    (state.plan === "pro" || i === state.currentDay) && (
                      <option key={d} value={i}>
                        {d}
                      </option>
                    ),
                )}
              </select>
              <select
                aria-label="Recipe meal slot"
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
              >
                {["breakfast", "lunch", "dinner"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <button
                className="btn secondary"
                onClick={async () => {
                  if (
                    await mutate("/planner", {
                      day: state.plan === "pro" ? day : state.currentDay,
                      slot,
                      meal: id,
                      servings:
                        state.plan === "pro"
                          ? servings
                          : state.preferences.people,
                    })
                  )
                    notice("Meal added to your plan.");
                }}
              >
                <Plus size={17} />
                Add
              </button>
            </div>
          </div>
          {state.plan === "pro" && (
            <div className="plan-add">
              <label htmlFor="scaled-servings">Cook for how many people?</label>
              <input
                id="scaled-servings"
                type="number"
                min="1"
                max="20"
                value={servings}
                onChange={(e) => setServings(Number(e.target.value))}
              />
              <p className="subtle">
                {meal.baseServings
                  ? "Original recipe serves " +
                    meal.baseServings +
                    ". Measured ingredients adjust below."
                  : "Original serving count is unknown. Confirm it in recipe settings below to enable scaling."}
              </p>
            </div>
          )}
          {meal.source_url && (
            <a
              className="source-link"
              href={meal.source_url}
              target="_blank"
              rel="noreferrer"
            >
              Recipe source ↗
            </a>
          )}
        </div>
      </div>
      <div className="recipe-body">
        <aside className="ingredients-panel">
          <h2>Ingredients</h2>
          <p>Check off the ingredients you have prepared.</p>
          {meal.ingredients.map((item, i) => (
            <label key={i} className={checked.includes(i) ? "checked" : ""}>
              <input
                type="checkbox"
                checked={checked.includes(i)}
                onChange={() => toggle(i, checked, setChecked)}
              />
              <span>
                {state.plan === "pro" &&
                meal.baseServings &&
                meal.ingredients_structured?.[i]?.structured
                  ? Number(
                      (
                        (meal.ingredients_structured[i].quantity * servings) /
                        meal.baseServings
                      ).toFixed(2),
                    ) +
                    " " +
                    meal.ingredients_structured[i].unit +
                    " " +
                    meal.ingredients_structured[i].name
                  : item}
              </span>
            </label>
          ))}
          <small>
            {state.plan === "pro" && meal.baseServings
              ? "Measured quantities scale to your selected servings. Unmeasured ingredients keep source text."
              : "Quantities follow the original recipe."}
          </small>
        </aside>
        <div className="steps-panel">
          <div className="section-heading">
            <h2>Let's cook.</h2>
            <span>
              {finished.length}/{meal.recipes.length} steps
            </span>
          </div>
          {meal.recipe_language === "en" && (
            <p className="subtle">
              {meal.translation_language === "en" ? "English translation of the original recipe." : "Cooking instructions supplied by TheMealDB. See the recipe source for the original version."}
            </p>
          )}
          {meal.recipe_review_note && <p className="subtle">{meal.recipe_review_note}</p>}
          {meal.recipes.map((step, i) => (
            <article
              className={`recipe-step ${finished.includes(i) ? "complete" : ""}`}
              key={i}
            >
              <button
                aria-label={`Mark step ${i + 1}`}
                onClick={() => toggle(i, finished, setFinished)}
              >
                {finished.includes(i) ? (
                  <Check size={18} />
                ) : (
                  String(i + 1).padStart(2, "0")
                )}
              </button>
              <div>
                <h3>{step.title}</h3>
                <p>{step.details}</p>
                {step.image_url && (
                  <img src={step.image_url} alt={step.title} loading="lazy" />
                )}
              </div>
            </article>
          ))}
          {finished.length === meal.recipes.length && (
            <div className="success-panel">All done. Enjoy your meal!</div>
          )}
        </div>
      </div>
      <RecipeTools key={id + meal.baseServings} meal={meal} />
      <div className="section-heading">
        <h2>A little more inspiration.</h2>
      </div>
      <div className="food-grid">
        {meals
          .filter((m) => m.category === meal.category && m.id !== id)
          .slice(0, 4)
          .map((m) => (
            <Card meal={m} key={m.id} />
          ))}
      </div>
    </section>
  );
}
function Pricing() {
  const { state, mutate, notice, loading, error, load } = useContext(Context);
  const [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false);
  async function change(p) {
    setBusy(true);
    if (await mutate("/plan", { plan: p })) {
      setConfirm(false);
      notice(
        p === "pro"
          ? "Pro is active. No payment has been charged."
          : "Switched to Basic. Your saved content has been kept.",
      );
    }
    setBusy(false);
  }
  return (
    <section className="page section pricing">
      <span className="eyebrow">Good food, your way</span>
      <h1 className="page-title">
        More inspiration.
        <br />
        <em>Less planning.</em>
      </h1>
      <p>Choose the right plan for your kitchen.</p>
      {error && <p role="alert">{error} <button onClick={load}>Try again</button></p>}
      <div className="pricing-grid">
        {[
          {
            id: "free",
            name: "Basic",
            desc: "Everyday recipes and the essentials to get cooking.",
            price: "0",
          },
          {
            id: "pro",
            name: "Pro",
            desc: "A kitchen planned around you.",
            price: "10",
          },
        ].map((p) => (
          <article
            className={`pricing-card ${p.id === "pro" ? "featured" : ""}`}
            key={p.id}
          >
            {p.id === "pro" && (
              <span className="recommended">Full access</span>
            )}
            <span className="eyebrow">EatVibing {p.name}</span>
            <h2>
              {p.name}
              {p.id === "pro" && <Crown size={25} />}
            </h2>
            <p>{p.desc}</p>
            <div className="price">
              ${p.price}
              <span>/month</span>
            </div>
            <button
              disabled={loading || !!error || busy || state.plan === p.id}
              className={`btn ${p.id === "pro" ? "primary" : "secondary"}`}
              onClick={() =>
                p.id === "pro" ? setConfirm(true) : change("free")
              }
            >
              {loading
                ? "Loading plan…"
                : state.plan === p.id
                ? "Current plan"
                : p.id === "pro"
                  ? "Get Pro"
                  : "Choose Basic"}
              <ArrowRight size={17} />
            </button>
            <ul aria-label={`${p.name} features`}>
              {[
                { label: "AI Assistant", basic: false },
                { label: "Personalization", basic: false },
                { label: "Recipe library, search and cooking guides", basic: true },
                { label: "Saved recipes", basic: true, detail: p.id === "pro" ? "Unlimited" : "Up to 10" },
                { label: "Daily meal planner", basic: true },
                { label: "Personalized weekly meal plans", basic: false },
                { label: "Serving adjustments and cooking notes", basic: false },
                { label: "Recipe collections", basic: false },
                { label: "Smart grocery lists and pantry tracking", basic: false },
                { label: "Saved meal plans and grocery exports", basic: false },
              ].map((feature) => {
                const included = p.id === "pro" || feature.basic;
                return <li key={feature.label} className={included ? "feature-included" : "feature-unavailable"}>
                  {included ? <Check size={18} aria-hidden="true" /> : <X size={18} aria-hidden="true" />}
                  <span><span className="sr-only">{included ? "Included: " : "Not included: "}</span>{feature.label}{feature.detail && <small className="feature-limit">{feature.detail}</small>}</span>
                </li>;
              })}
            </ul>
          </article>
        ))}
      </div>
      <div className="faq">
        <h2>A few things to know.</h2>
        <details>
          <summary>How does Pro billing work?</summary>
          <p>
            Pro is listed at $10 per month. Online billing is not available yet,
            so activating Pro here does not collect a payment or start a recurring charge.
          </p>
        </details>
        <details>
          <summary>Where is my data stored?</summary>
          <p>
            Your plan, saved recipes, meal plans and grocery lists are saved
            on this device for this browser.
          </p>
        </details>
        <details>
          <summary>Will switching to Basic delete my meal plan?</summary>
          <p>
            Your saved content is kept. Pro lets you edit your full weekly meal plan.
            Basic includes up to 10 saved recipes and meal planning for today.
          </p>
        </details>
      </div>
      {confirm && (
        <div className="modal-backdrop">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="upgrade-title"
          >
            <button
              className="modal-close"
              aria-label="Close"
              onClick={() => setConfirm(false)}
            >
              <X />
            </button>
            <Crown size={32} />
            <h2 id="upgrade-title">Welcome to Pro.</h2>
            <p>
              Unlock personalized weekly planning, recipe collections and smart
              grocery lists. Pro is $10/month when billing becomes available.
              Activating it now does not collect a payment.
            </p>
            <button
              className="btn primary"
              disabled={busy}
              onClick={() => change("pro")}
            >
              {busy ? "Activating Pro…" : "Activate Pro"}
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
export { Detail, Pricing, Planner };
