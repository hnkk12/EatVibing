import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SLOTS = ["Breakfast", "Lunch", "Dinner"];
const SHOPPING_KEY = "eatvibing_shopping_checked";

// ponytail: greedy round-robin capped at 2 uses/week per meal; if the category
// has too few meals to fill 21 slots without repeats it falls back to any
// meal in the category. Upgrade to a real scheduling algorithm if the menu
// grows large enough for that cap to matter.
const generateWeeklyPlan = (pool) => {
  if (!pool.length) return null;
  const usage = {};
  return DAYS.map((day) => {
    const meals = {};
    SLOTS.forEach((slot) => {
      const eligible = pool.filter((m) => (usage[m.id] || 0) < 2);
      const candidates = eligible.length ? eligible : pool;
      const picked = candidates[Math.floor(Math.random() * candidates.length)];
      usage[picked.id] = (usage[picked.id] || 0) + 1;
      meals[slot] = picked;
    });
    return { day, meals };
  });
};

const buildShoppingList = (weeklyPlan) => {
  const counts = {};
  weeklyPlan.forEach((d) =>
    Object.values(d.meals).forEach((meal) =>
      (meal.ingredients || []).forEach((ing) => {
        counts[ing.data] = (counts[ing.data] || 0) + 1;
      }),
    ),
  );
  return Object.entries(counts).map(([text, count]) => ({ text, count }));
};

const Guide = () => {
  const navigate = useNavigate();
  const categories = [
    { id: "what-to-eat", label: "What to eat today?", type: "feature" },
    { id: "weekly-plans", label: "Weekly Meal Plans", type: "feature" },
    { id: "divider", label: "", type: "divider" },
    { id: "trending", label: "Trending this week", type: "category" },
    { id: "all", label: "All meals", type: "category" },
    { id: "loss", label: "Weight Loss", type: "category" },
    { id: "gain", label: "Bulking", type: "category" },
    { id: "balance", label: "Balanced", type: "category" },
  ];

  const [meals, setMeals] = useState([]);
  const [mealsStatus, setMealsStatus] = useState("loading"); // loading | ok | error
  const [trending, setTrending] = useState([]);
  const [selectedCat, setSelectedCat] = useState("all");
  const [plannerDiet, setPlannerDiet] = useState("balance");
  const [weeklyPlan, setWeeklyPlan] = useState(null);
  const [shoppingList, setShoppingList] = useState(null);
  const [checked, setChecked] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SHOPPING_KEY)) || {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const fetchMeals = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await axios.get(`${baseUrl}/api/meals`);
        if (Array.isArray(res.data)) {
          setMeals(res.data);
          setMealsStatus("ok");
        } else {
          console.error("Meals response is not an array:", res.data);
          setMealsStatus("error");
        }
      } catch (error) {
        console.error("Error loading meals", error);
        setMealsStatus("error");
      }
    };
    fetchMeals();

    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    axios
      .get(`${baseUrl}/api/ratings/trending?days=7&limit=3`)
      .then((res) => {
        if (Array.isArray(res.data)) {
          setTrending(res.data);
        } else {
          console.error("Trending response is not an array:", res.data);
          setTrending([]);
        }
      })
      .catch((error) => {
        console.error("Error loading trending", error);
        setTrending([]);
      });
  }, []);

  useEffect(() => {
    localStorage.setItem(SHOPPING_KEY, JSON.stringify(checked));
  }, [checked]);

  const filteredMeals = meals.filter(
    (m) => selectedCat === "all" || m.category === selectedCat,
  );

  const handleRandomPick = () => {
    if (!meals.length) return;
    const pick = meals[Math.floor(Math.random() * meals.length)];
    navigate(`/recipe/${pick.id}`);
  };

  const handleGeneratePlan = () => {
    const pool = meals.filter((m) => m.category === plannerDiet);
    const plan = generateWeeklyPlan(pool);
    setWeeklyPlan(plan);
    setShoppingList(null);
  };

  const handleGenerateShoppingList = () => {
    if (!weeklyPlan) return;
    setShoppingList(buildShoppingList(weeklyPlan));
  };

  const toggleChecked = (text) => {
    setChecked((prev) => ({ ...prev, [text]: !prev[text] }));
  };

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
        </aside>

        {/* --- MAIN CONTENT RIGHT --- */}
        <main className="flex-1">
          {mealsStatus === "error" && (
            <div className="mb-8 text-sm text-red-500">
              Could not load meals from the server.
            </div>
          )}

          {/* Random Picker */}
          {selectedCat === "what-to-eat" && (
            <div className="mb-16 bg-white border border-gray-100 p-16 rounded-sm text-center shadow-sm">
              <h2 className="text-2xl font-light tracking-widest uppercase">
                Random Picker
              </h2>
              <p className="text-gray-400 mt-2 text-sm">
                Still wondering? Let EatVibing suggests meals for you.
              </p>
              <button
                onClick={handleRandomPick}
                disabled={mealsStatus !== "ok" || !meals.length}
                className="mt-8 px-10 py-3 border border-black hover:bg-black hover:text-white transition-all duration-500 uppercase text-xs tracking-[0.2em] disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black"
              >
                Generate Recipe
              </button>
            </div>
          )}

          {/* Trending this week (mục G: nhiều tương tác nhất -> guideline) */}
          {selectedCat === "trending" && (
            <h2 className="text-xl font-light tracking-widest uppercase mb-8">
              🔥 Trending this week
            </h2>
          )}

          {/* Recipe Gallery */}
          {(selectedCat === "trending" || (selectedCat !== "what-to-eat" && selectedCat !== "weekly-plans")) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
              {(selectedCat === "trending" ? trending : filteredMeals).map((meal) => (
                <Link
                  key={meal.id}
                  to={`/recipe/${meal.id}`}
                  className="group cursor-pointer block"
                >
                  <div className="relative aspect-[4/5] bg-white border border-gray-100 overflow-hidden flex items-center justify-center p-8 transition-all duration-700 group-hover:border-gray-300">
                    <img
                      src={meal.image_url}
                      alt={meal.name}
                      className="max-h-full max-w-full object-contain grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-black text-white text-[10px] py-3 text-center uppercase tracking-[0.2em]">
                      View Recipe
                    </div>
                  </div>

                  <div className="mt-6 flex justify-between items-baseline border-b border-transparent group-hover:border-gray-100 pb-2 transition-all">
                    <div className="max-w-[70%]">
                      <h3 className="text-[13px] font-medium text-gray-900 leading-tight uppercase tracking-tight">
                        {meal.name}
                      </h3>
                    </div>
                    <div className="text-[11px] font-bold text-gray-900 border-l border-gray-200 pl-3 uppercase tracking-tighter">
                      {meal.origin}
                    </div>
                  </div>
                </Link>
              ))}
              {selectedCat === "trending" && trending.length === 0 && (
                <p className="text-sm text-gray-400 col-span-full">
                  No trending meals this week.
                </p>
              )}
              {selectedCat !== "trending" && mealsStatus === "ok" && filteredMeals.length === 0 && (
                <p className="text-sm text-gray-400 col-span-full">
                  No meals in this category yet.
                </p>
              )}
            </div>
          )}

          {/* Weekly Meal Planner */}
          {selectedCat === "weekly-plans" && (
            <div>
              <div className="flex flex-wrap items-center gap-4 mb-10">
                <select
                  value={plannerDiet}
                  onChange={(e) => setPlannerDiet(e.target.value)}
                  className="border border-gray-200 px-4 py-2 text-xs uppercase tracking-widest"
                >
                  <option value="loss">Weight Loss</option>
                  <option value="gain">Bulking</option>
                  <option value="balance">Balanced</option>
                </select>
                <button
                  onClick={handleGeneratePlan}
                  disabled={mealsStatus !== "ok"}
                  className="px-6 py-2 border border-black hover:bg-black hover:text-white transition-all duration-300 uppercase text-xs tracking-[0.2em] disabled:opacity-30"
                >
                  Generate 7-day Plan
                </button>
                {weeklyPlan && (
                  <button
                    onClick={handleGenerateShoppingList}
                    className="px-6 py-2 border border-gray-300 hover:border-black transition-all duration-300 uppercase text-xs tracking-[0.2em]"
                  >
                    Tạo danh sách mua sắm
                  </button>
                )}
              </div>

              {!weeklyPlan && (
                <p className="text-sm text-gray-400">
                  Chọn chế độ ăn và bấm "Generate 7-day Plan" để tạo thực đơn tuần.
                </p>
              )}

              {weeklyPlan && (
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-7 gap-4 min-w-[900px]">
                    {weeklyPlan.map(({ day, meals: dayMeals }) => (
                      <div key={day} className="border border-gray-100 p-3">
                        <h3 className="text-[11px] uppercase tracking-widest font-bold mb-3 text-center">
                          {day}
                        </h3>
                        <div className="space-y-3">
                          {SLOTS.map((slot) => (
                            <Link
                              key={slot}
                              to={`/recipe/${dayMeals[slot].id}`}
                              className="block text-center hover:bg-gray-50 p-2 rounded"
                            >
                              <p className="text-[9px] uppercase text-gray-400 tracking-widest">
                                {slot}
                              </p>
                              <p className="text-[11px] font-medium leading-tight mt-1">
                                {dayMeals[slot].name}
                              </p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-6">
                    Chưa có dữ liệu calo trong bảng meals nên chưa ước tính được TDEE — thêm cột `calories` vào bảng `meals` nếu cần bật tính năng này.
                  </p>
                </div>
              )}

              {shoppingList && (
                <div className="mt-12 max-w-md">
                  <h3 className="text-[11px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-4">
                    Shopping List
                  </h3>
                  <ul className="space-y-2">
                    {shoppingList.map((item) => (
                      <li key={item.text} className="flex items-center gap-3 text-sm">
                        <input
                          type="checkbox"
                          checked={!!checked[item.text]}
                          onChange={() => toggleChecked(item.text)}
                          className="w-4 h-4"
                        />
                        <span className={checked[item.text] ? "line-through text-gray-300" : ""}>
                          {item.text}
                          {item.count > 1 ? ` (x${item.count})` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Guide;
