import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { Context } from "../../dataContext";
import { Planner } from "../../PremiumFeatures";
import { PersonalizedSuggestions } from "../../WeeklyPlanner";
import { CollectionManager } from "../../RecipeTools";

const Guide = ({ saved = false }) => {
  const { meals, state, mutate, loading, error, load } = useContext(Context);
  const [query, setQuery] = useState("");
  const [collection, setCollection] = useState("");
  const categories = [
    { id: "what-to-eat", label: "What to eat today?", type: "feature" },
    { id: "weekly-plans", label: "Weekly Meal Plans", type: "feature" },
    { id: "divider", label: "", type: "divider" },
    { id: "all", label: "All meals", type: "category" },
    { id: "loss", label: "Weight Loss", type: "category" },
    { id: "gain", label: "Bulking", type: "category" },
    { id: "balance", label: "Balanced", type: "category" },
  ];

  const products = meals.map((meal) => ({ ...meal, image: meal.image_url }));

  const [selectedCat, setSelectedCat] = useState("all");
  const filteredProducts = products.filter(
    (p) =>
      (!saved || state.favorites.includes(p.id)) &&
      (!saved ||
        !collection ||
        state.collections
          ?.find((c) => c.id === collection)
          ?.meals.includes(p.id)) &&
      (selectedCat === "all" || p.category === selectedCat) &&
      `${p.name} ${p.origin} ${p.ingredients.join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans selection:bg-black selection:text-white">
      <div className="max-w-[1440px] mx-auto px-6 py-12 flex gap-12">
        {/* --- SIDEBAR LEFT --- */}
        <aside className="w-1/5 sticky top-12 self-start">
          <h2 className="text-gray-400 uppercase tracking-[0.2em] text-[10px] font-bold mb-8">
            EatVibing Navigation
          </h2>

          <ul className="space-y-6">
            {categories.map((cat, index) => {
              if (cat.type === "divider") {
                return (
                  <div key={index} className="h-[1px] bg-gray-200 my-8 mr-12" />
                );
              }
              return (
                <li key={cat.id} className="group flex items-center text-sm">
                  <div
                    className={`w-1 h-1 rounded-full bg-black mr-4 transition-all duration-300 ${
                      selectedCat === cat.id
                        ? "scale-100 opacity-100"
                        : "scale-0 opacity-0"
                    }`}
                  />
                  <button
                    onClick={() => setSelectedCat(cat.id)}
                    className={`transition-all duration-300 text-left uppercase tracking-wider text-[12px] ${
                      selectedCat === cat.id
                        ? "text-black font-bold"
                        : "text-gray-400 hover:text-black"
                    }`}
                  >
                    {cat.label}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-8 space-y-4 border-t border-zinc-100 pt-6 text-xs text-zinc-500">
            <Link className="block hover:text-black" to="/saved">
              Saved recipes
            </Link>
            <Link className="block hover:text-black" to="/pricing">
              {state.plan === "pro"
                ? "Pro demo · Manage plan"
                : "Free · Explore Pro"}
            </Link>
            <Link className="block hover:text-black" to="/admin">
              Add a meal locally
            </Link>
          </div>
        </aside>

        {/* --- MAIN CONTENT RIGHT --- */}
        <main className="flex-1 min-w-0">
          {loading && (
            <p className="text-sm text-zinc-400 mb-6">Loading recipes…</p>
          )}
          {error && (
            <div className="mb-6 text-sm text-red-500">
              {error} <button onClick={load}>Try again</button>
            </div>
          )}
          {selectedCat !== "what-to-eat" && selectedCat !== "weekly-plans" && (
            <div className="flex justify-between items-center gap-4 mb-8">
              <p className="text-xs text-zinc-400">
                {saved ? "Saved recipes" : "All recipes"} ·{" "}
                {filteredProducts.length}
              </p>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search recipes"
                placeholder="Search meals or ingredients…"
                className="border border-zinc-200 rounded-full px-4 py-2 text-xs w-64 max-w-[65%] outline-none focus:border-black"
              />
            </div>
          )}
          {saved && (
            <CollectionManager selected={collection} onSelect={setCollection} />
          )}
          {/* Render Nội dung Tool */}
          {selectedCat === "what-to-eat" && <PersonalizedSuggestions />}

          {/* Render Lưới Món Ăn */}
          {selectedCat !== "what-to-eat" && selectedCat !== "weekly-plans" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
              {filteredProducts.map((product) => (
                <div key={product.id} className="group cursor-pointer">
                  <Link
                    to={"/recipes/" + product.id}
                    aria-label={"View recipe: " + product.name}
                  >
                    {/* Image Container */}
                    <div className="relative aspect-[4/5] bg-white border border-gray-100 overflow-hidden flex items-center justify-center p-8 transition-all duration-700 group-hover:border-gray-300">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="max-h-full max-w-full object-contain grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                      />
                      {/* Quick View Overlay (Optional) */}
                      <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-black text-white text-[10px] py-3 text-center uppercase tracking-[0.2em]">
                        View Recipe
                      </div>
                    </div>

                    {/* Info Row */}
                    <div className="mt-6 flex justify-between items-baseline border-b border-transparent group-hover:border-gray-100 pb-2 transition-all">
                      <div className="max-w-[70%]">
                        <h3 className="text-[13px] font-medium text-gray-900 leading-tight uppercase tracking-tight">
                          {product.name}
                        </h3>
                      </div>
                      {/* Mục Origin (thay thế giá tiền) */}
                      <div className="text-[11px] font-bold text-gray-900 border-l border-gray-200 pl-3 uppercase tracking-tighter">
                        {product.origin}
                      </div>
                    </div>
                  </Link>
                  <button
                    onClick={() => mutate("/favorites", { meal: product.id })}
                    className="text-[10px] uppercase tracking-wider text-zinc-400 hover:text-black mt-3"
                  >
                    {state.favorites.includes(product.id)
                      ? "♥ Saved · Remove"
                      : "♡ Save recipe"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {!loading &&
            !error &&
            selectedCat !== "what-to-eat" &&
            selectedCat !== "weekly-plans" &&
            !filteredProducts.length && (
              <p className="text-sm text-zinc-400 py-12">
                {saved
                  ? "No saved recipes yet. Save a meal from the guideline."
                  : "No matching recipes."}
              </p>
            )}
          {/* Weekly Plans */}
          {selectedCat === "weekly-plans" && (
            <div className="premium-features">
              <Planner />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Guide;
