import React, { useState, useEffect } from "react";
import axios from "axios";
import { supabase } from "../../supabaseClient";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

const DIET_TAGS = ["Vegan", "Keto", "Nut-Free", "Low-Carb", "Gluten-Free"];
const GOALS = [
  { value: "loss", label: "Weight Loss" },
  { value: "gain", label: "Bulking" },
  { value: "balance", label: "Balanced" },
];

const emptyProfile = {
  height_cm: "",
  weight_kg: "",
  age: "",
  gender: "",
  goal: "balance",
  diet_tags: [],
  allergies: "",
};

const Profile = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(emptyProfile);
  const [status, setStatus] = useState({ loading: false, message: "", type: "" });
  const [isFirstTime, setIsFirstTime] = useState(false);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/profile/${user.id}`);
        if (res.data) {
          setProfile({
            ...emptyProfile,
            ...res.data,
            allergies: (res.data.allergies || []).join(", "),
            diet_tags: res.data.diet_tags || [],
          });
        } else {
          setIsFirstTime(true);
        }
      } catch (error) {
        console.error("Error loading profile", error);
      }
    };
    load();
  }, []);

  const bmi =
    profile.height_cm && profile.weight_kg
      ? (profile.weight_kg / (profile.height_cm / 100) ** 2).toFixed(1)
      : null;

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const toggleTag = (tag) => {
    setProfile((prev) => ({
      ...prev,
      diet_tags: prev.diet_tags.includes(tag)
        ? prev.diet_tags.filter((t) => t !== tag)
        : [...prev.diet_tags, tag],
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    setStatus({ loading: true, message: "", type: "" });
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/profile`, {
        userId: user.id,
        profile: {
          height_cm: Number(profile.height_cm) || null,
          weight_kg: Number(profile.weight_kg) || null,
          age: Number(profile.age) || null,
          gender: profile.gender || null,
          goal: profile.goal,
          diet_tags: profile.diet_tags,
          allergies: profile.allergies
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        },
      });
      setStatus({ loading: false, message: "Đã lưu hồ sơ!", type: "success" });
      setIsFirstTime(false);
    } catch (error) {
      console.error(error);
      setStatus({ loading: false, message: "Lưu thất bại, thử lại sau.", type: "error" });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-sm">Đăng nhập để thiết lập hồ sơ cá nhân.</p>
        <Link to="/" className="text-sm underline">Về trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans">
      <div className="max-w-xl mx-auto px-6 py-12">
        <Link to="/" className="text-gray-400 hover:text-black flex items-center gap-1 text-sm mb-6">
          <ChevronLeft size={16} /> Back
        </Link>

        <h1 className="text-3xl font-light tracking-tight mb-2">Hồ sơ cá nhân</h1>
        <p className="text-gray-400 text-sm mb-8">
          {isFirstTime
            ? "Chào mừng lần đầu! Điền vài thông tin để AI gợi ý chính xác hơn."
            : "Cập nhật chỉ số và khẩu vị để AI cá nhân hóa gợi ý."}
        </p>

        {status.message && (
          <div
            className={`mb-6 p-3 rounded-xl text-sm ${
              status.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {status.message}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Height (cm)</label>
              <input
                type="number"
                name="height_cm"
                value={profile.height_cm}
                onChange={handleChange}
                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Weight (kg)</label>
              <input
                type="number"
                name="weight_kg"
                value={profile.weight_kg}
                onChange={handleChange}
                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Age</label>
              <input
                type="number"
                name="age"
                value={profile.age}
                onChange={handleChange}
                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          {bmi && (
            <p className="text-sm text-zinc-500">
              BMI ước tính: <span className="font-bold text-black">{bmi}</span>
            </p>
          )}

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Gender</label>
            <select
              name="gender"
              value={profile.gender}
              onChange={handleChange}
              className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none"
            >
              <option value="">--</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Goal</label>
            <select
              name="goal"
              value={profile.goal}
              onChange={handleChange}
              className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none"
            >
              {GOALS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Diet tags</label>
            <div className="flex flex-wrap gap-2">
              {DIET_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-2 rounded-full text-xs font-medium border transition-colors ${
                    profile.diet_tags.includes(tag)
                      ? "bg-black text-white border-black"
                      : "bg-white text-zinc-500 border-zinc-200 hover:border-black"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
              Allergies / kiêng (phân cách bằng dấu phẩy)
            </label>
            <input
              name="allergies"
              value={profile.allergies}
              onChange={handleChange}
              placeholder="đậu phộng, cay"
              className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={status.loading}
            className="w-full py-3 bg-black text-white rounded-xl font-semibold hover:bg-zinc-800 transition-all disabled:bg-zinc-400"
          >
            {status.loading ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
