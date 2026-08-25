import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { ChevronLeft, Star } from "lucide-react";
import { supabase } from "../../supabaseClient";

const CATEGORY_LABEL = { loss: "Weight Loss", gain: "Bulking", balance: "Balanced" };

const RecipeDetail = () => {
  const { id } = useParams();
  const [meal, setMeal] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ok | notfound | error
  const [user, setUser] = useState(null);
  const [ratings, setRatings] = useState({ reviews: [], average: null, count: 0 });
  const [myScore, setMyScore] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadRatings = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/ratings/${id}`);
      setRatings(res.data);
    } catch (error) {
      console.error("Error loading ratings", error);
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    loadRatings();
  }, [id]);

  const submitRating = async () => {
    if (!user || !myScore) return;
    setSubmitting(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/ratings`, {
        mealId: id,
        userId: user.id,
        score: myScore,
        comment: myComment,
      });
      setMyScore(0);
      setMyComment("");
      await loadRatings();
    } catch (error) {
      console.error("Error submitting rating", error);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchMeal = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/meals`);
        const found = res.data.find((m) => String(m.id) === id);
        if (!found) {
          setStatus("notfound");
          return;
        }
        setMeal(found);
        setStatus("ok");
      } catch (error) {
        console.error("Error loading recipe", error);
        setStatus("error");
      }
    };
    fetchMeal();
  }, [id]);

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading...</div>;
  }
  if (status === "notfound" || status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-sm">
          {status === "notfound" ? "Recipe not found." : "Could not load recipe."}
        </p>
        <Link to="/guide" className="text-sm underline">Back to Guide</Link>
      </div>
    );
  }

  const steps = [...(meal.recipes || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/guide" className="text-gray-400 hover:text-black flex items-center gap-1 text-sm mb-8">
          <ChevronLeft size={16} /> Back to Guide
        </Link>

        {meal.image_url && (
          <div className="aspect-[16/9] bg-gray-50 border border-gray-100 overflow-hidden mb-8 flex items-center justify-center">
            <img src={meal.image_url} alt={meal.name} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex items-baseline justify-between border-b border-gray-100 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-light tracking-tight">{meal.name}</h1>
            <p className="text-gray-400 text-sm mt-1">{meal.origin}</p>
          </div>
          <span className="text-[11px] uppercase tracking-widest border border-gray-200 px-3 py-1 rounded-full text-gray-500">
            {CATEGORY_LABEL[meal.category] || meal.category}
          </span>
        </div>

        <section className="mb-12">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-4">
            Ingredients
          </h2>
          <ul className="space-y-2">
            {(meal.ingredients || []).map((ing) => (
              <li key={ing.id} className="flex items-center gap-3 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0" />
                {ing.data}
              </li>
            ))}
            {(!meal.ingredients || meal.ingredients.length === 0) && (
              <li className="text-sm text-gray-400">No ingredients listed.</li>
            )}
          </ul>
        </section>

        <section>
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-6">
            Cooking Steps
          </h2>
          <div className="space-y-8">
            {steps.map((step, idx) => (
              <div key={step.id} className="relative pl-10 border-l-2 border-gray-100">
                <div className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-black text-[11px] text-white flex items-center justify-center font-bold">
                  {step.order ?? idx + 1}
                </div>
                {step.title && <h3 className="font-medium mb-1">{step.title}</h3>}
                {step.img_url && (
                  <img src={step.img_url} alt={step.title || `Step ${idx + 1}`} className="w-full max-w-md rounded-xl mb-2" />
                )}
                <p className="text-sm text-gray-600 leading-relaxed">{step.details}</p>
              </div>
            ))}
            {steps.length === 0 && (
              <p className="text-sm text-gray-400">No cooking steps yet.</p>
            )}
          </div>
        </section>

        <section className="mt-12 border-t border-gray-100 pt-8">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-4">
            Ratings & Reviews
          </h2>

          {ratings.average && (
            <p className="text-sm mb-4">
              <span className="font-bold text-lg">{ratings.average.toFixed(1)}</span>
              <span className="text-gray-400"> / 5 ({ratings.count} đánh giá)</span>
            </p>
          )}

          {user ? (
            <div className="mb-8 bg-gray-50 p-4 rounded-xl">
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setMyScore(n)}>
                    <Star
                      size={22}
                      className={n <= myScore ? "text-yellow-500" : "text-gray-300"}
                      fill={n <= myScore ? "currentColor" : "none"}
                    />
                  </button>
                ))}
              </div>
              <textarea
                value={myComment}
                onChange={(e) => setMyComment(e.target.value)}
                placeholder="Bạn thấy món này thế nào?"
                rows={2}
                className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none mb-3"
              />
              <button
                onClick={submitRating}
                disabled={!myScore || submitting}
                className="px-6 py-2 bg-black text-white rounded-full text-xs font-semibold disabled:opacity-30"
              >
                {submitting ? "Đang gửi..." : "Gửi đánh giá"}
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-400 mb-8">Đăng nhập để đánh giá món này.</p>
          )}

          <div className="space-y-4">
            {ratings.reviews.map((r) => (
              <div key={r.id} className="border-b border-gray-50 pb-4">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={14}
                      className={n <= r.score ? "text-yellow-500" : "text-gray-200"}
                      fill={n <= r.score ? "currentColor" : "none"}
                    />
                  ))}
                </div>
                {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
              </div>
            ))}
            {ratings.count === 0 && (
              <p className="text-sm text-gray-400">Chưa có đánh giá nào.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default RecipeDetail;
