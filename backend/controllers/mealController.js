const supabase = require("../config/supabase");

// [GET] Lấy tất cả món ăn kèm nguyên liệu và công thức
exports.getAllMeals = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("meals")
      .select("*, ingredients(*), recipes(*)");
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// [POST] Thêm món ăn mới (Atomic Insert)
exports.createMeal = async (req, res) => {
  try {
    const { name, origin, category, image_url, ingredients, recipes } =
      req.body;

    // 1. Insert vào bảng meals
    const { data: meal, error: mealErr } = await supabase
      .from("meals")
      .insert([{ name, origin, category, image_url }])
      .select()
      .single();
    if (mealErr) throw mealErr;

    // 2. Insert ingredients nếu có
    if (ingredients?.length) {
      const ingData = ingredients.map((i) => ({ meal_id: meal.id, data: i }));
      const { error: ingErr } = await supabase.from("ingredients").insert(ingData);
      if (ingErr) throw ingErr;
    }

    // 3. Insert recipes nếu có
    if (recipes?.length) {
      const recData = recipes.map((r) => ({ ...r, meal_id: meal.id }));
      const { error: recErr } = await supabase.from("recipes").insert(recData);
      if (recErr) throw recErr;
    }

    res.status(201).json({ message: "Created!", id: meal.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// [DELETE] Xóa món ăn (Nhờ ON DELETE CASCADE trong DB nên nó sẽ tự xóa hết con)
exports.deleteMeal = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("meals").delete().eq("id", id);
    if (error) throw error;
    res.status(200).json({ message: "Deleted!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
