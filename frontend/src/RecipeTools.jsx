import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { Context } from "./dataContext";
export default function RecipeTools({ meal }) {
  const { state, mutate, notice } = useContext(Context);
  const [original, setOriginal] = useState(meal.baseServings || ""),
    [types, setTypes] = useState(meal.mealTypes || ["lunch", "dinner"]),
    [note, setNote] = useState(state.notes?.[meal.id] || ""),
    [collection, setCollection] = useState("");
  if (state.plan !== "pro")
    return (
      <div className="feature-panel">
        <h2>Make this recipe yours</h2>
        <p>
          Pro unlocks serving adjustments, personal cooking notes and recipe
          collections.
        </p>
        <Link className="btn secondary" to="/pricing">
          Explore Pro demo
        </Link>
      </div>
    );
  return (
    <div className="feature-panel">
      <h2>Your recipe settings</h2>
      <p>
        Confirm the original recipe's serving count before scaling. These
        settings only update local recipe metadata.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (
            await mutate("/recipe-metadata", {
              meal: meal.id,
              baseServings: Number(original),
              mealTypes: types,
            })
          )
            notice("Recipe serving count and meal tags saved.");
        }}
      >
        <div className="feature-fields">
          <label>
            Original recipe serves
            <input
              required
              aria-label="Original recipe serves"
              min="1"
              max="20"
              type="number"
              value={original}
              onChange={(e) => setOriginal(e.target.value)}
              placeholder="Confirm from source"
            />
          </label>
          <fieldset>
            <legend>Meal tags</legend>
            {["breakfast", "lunch", "dinner"].map((type) => (
              <label key={type} className="inline-check">
                <input
                  type="checkbox"
                  checked={types.includes(type)}
                  onChange={() =>
                    setTypes(
                      types.includes(type)
                        ? types.filter((t) => t !== type)
                        : [...types, type],
                    )
                  }
                />
                {type}
              </label>
            ))}
          </fieldset>
        </div>
        <button className="btn secondary" disabled={!types.length}>
          Save recipe settings
        </button>
      </form>
      <form
        className="note-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await mutate("/notes", { meal: meal.id, content: note }))
            notice("Cooking note saved.");
        }}
      >
        <label htmlFor="recipe-note">My cooking notes</label>
        <textarea
          id="recipe-note"
          value={note}
          maxLength="3000"
          onChange={(e) => setNote(e.target.value)}
          placeholder="Use less chilli next time…"
        />
        <button className="btn secondary">Save note</button>
      </form>
      <div className="inline-feature-form">
        <select
          aria-label="Recipe collection"
          value={collection}
          onChange={(e) => setCollection(e.target.value)}
        >
          <option value="">Choose a collection</option>
          {(state.collections || []).map((c) => (
            <option value={c.id} key={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          className="btn secondary"
          disabled={!collection}
          onClick={() => mutate("/collections", { collection, meal: meal.id })}
        >
          {state.collections
            ?.find((c) => c.id === collection)
            ?.meals.includes(meal.id)
            ? "Remove from collection"
            : "Add to collection"}
        </button>
        <Link to="/saved" className="text-link">
          Manage collections →
        </Link>
      </div>
    </div>
  );
}
export function CollectionManager({ selected, onSelect }) {
  const { state, mutate, notice } = useContext(Context);
  const [name, setName] = useState(""),
    [rename, setRename] = useState("");
  if (state.plan !== "pro")
    return (
      <p className="text-xs text-zinc-400 mb-6">
        Free saves up to 10 recipes.{" "}
        <Link to="/pricing" className="text-black">
          Pro adds unlimited saves and collections.
        </Link>
      </p>
    );
  const active = state.collections?.find((c) => c.id === selected);
  return (
    <div className="border border-zinc-100 bg-white p-5 mb-8 text-sm">
      <h2 className="font-semibold mb-4">Recipe collections</h2>
      <form
        className="flex flex-wrap gap-3 mb-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await mutate("/collections", { name })) {
            setName("");
            notice("Collection created.");
          }
        }}
      >
        <input
          className="border border-zinc-200 rounded-lg p-2"
          aria-label="Collection name"
          required
          maxLength="80"
          placeholder="Quick lunches / Family favorites"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="bg-black text-white px-4 rounded-lg">
          Create collection
        </button>
      </form>
      <select
        className="border border-zinc-200 rounded-lg p-2"
        aria-label="Filter saved collection"
        value={selected}
        onChange={(e) => {
          onSelect(e.target.value);
          setRename("");
        }}
      >
        <option value="">All saved recipes</option>
        {(state.collections || []).map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} ({c.meals.length})
          </option>
        ))}
      </select>
      {active && (
        <form
          className="flex flex-wrap gap-3 mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            mutate("/collections", { id: active.id, name: rename });
          }}
        >
          <input
            className="border border-zinc-200 rounded-lg p-2"
            aria-label="Rename collection"
            required
            maxLength="80"
            placeholder={active.name}
            value={rename}
            onChange={(e) => setRename(e.target.value)}
          />
          <button className="border border-zinc-200 rounded-lg px-4">
            Rename
          </button>
          <button
            type="button"
            className="text-zinc-500"
            onClick={async () => {
              if (await mutate("/collections", { remove: active.id }))
                onSelect("");
            }}
          >
            Delete collection
          </button>
        </form>
      )}
      <p className="text-xs text-zinc-400 mt-4">
        Add recipes to a collection from their detail pages. Removing a
        collection keeps its saved recipes.
      </p>
    </div>
  );
}
