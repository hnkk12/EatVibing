const { supabase } = require("../config/supabase");

// [GET] Danh sách đánh giá + điểm trung bình của 1 món ăn
exports.getRatings = async (req, res) => {
  try {
    const { mealId } = req.params;
    const { data, error } = await supabase
      .from("ratings_reviews")
      .select("*")
      .eq("meal_id", mealId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    const average = data.length
      ? data.reduce((sum, r) => sum + r.score, 0) / data.length
      : null;
    res.status(200).json({ reviews: data, average, count: data.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// [POST] Thêm đánh giá (ponytail: cho phép 1 user đánh giá nhiều lần, chưa có
// ràng buộc unique(meal_id,user_id) — nâng cấp lên upsert nếu cần "sửa" đánh giá cũ)
exports.addRating = async (req, res) => {
  try {
    const { mealId, userId, score, comment } = req.body;
    if (!mealId || !userId || !score) {
      return res.status(400).json({ error: "mealId, userId, score are required" });
    }
    const { data, error } = await supabase
      .from("ratings_reviews")
      .insert([{ meal_id: mealId, user_id: userId, score, comment: comment || null }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// [GET] Món ăn nhiều đánh giá nhất trong N ngày gần đây -> đưa vào guideline
// ponytail: gom nhóm bằng JS thay vì SQL GROUP BY, đủ dùng cho quy mô dev hiện tại
exports.getTrending = async (req, res) => {
  try {
    const days = Number(req.query.days) || 7;
    const limit = Number(req.query.limit) || 3;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data: reviews, error } = await supabase
      .from("ratings_reviews")
      .select("meal_id")
      .gte("created_at", since);
    if (error) throw error;

    const counts = {};
    reviews.forEach((r) => {
      counts[r.meal_id] = (counts[r.meal_id] || 0) + 1;
    });
    const topIds = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => Number(id));

    if (!topIds.length) return res.status(200).json([]);

    const { data: meals, error: mealErr } = await supabase
      .from("meals")
      .select("id, name, origin, category, image_url")
      .in("id", topIds);
    if (mealErr) throw mealErr;

    const result = topIds
      .map((id) => {
        const meal = meals.find((m) => m.id === id);
        return meal ? { ...meal, interactionCount: counts[id] } : null;
      })
      .filter(Boolean);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
