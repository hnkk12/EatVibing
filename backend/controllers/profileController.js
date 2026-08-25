const { supabase } = require("../config/supabase");

// [GET] Lấy hồ sơ cá nhân hóa của user (chỉ số cơ thể, khẩu vị, dị ứng)
exports.getProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { data, error } = await supabase
      .from("user_indicator_settings")
      .select("visibility")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    res.status(200).json(data?.visibility || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// [POST] Tạo/cập nhật hồ sơ cá nhân hóa
exports.upsertProfile = async (req, res) => {
  try {
    const { userId, profile } = req.body;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const { error } = await supabase.from("user_indicator_settings").upsert(
      {
        user_id: userId,
        visibility: profile,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw error;
    res.status(200).json({ message: "Profile saved!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
