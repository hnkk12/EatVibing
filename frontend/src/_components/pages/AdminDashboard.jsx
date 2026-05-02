import React, { useState } from "react";
import axios from "axios";
import { Plus, Trash2, Save, UploadCloud, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const [meal, setMeal] = useState({
    name: "",
    origin: "",
    category: "balance", // default
    image_url: "",
    ingredients: [""],
    recipes: [{ step_number: 1, content: "" }],
  });

  const [status, setStatus] = useState({
    loading: false,
    message: "",
    type: "",
  });

  // Handle basic inputs
  const handleChange = (e) => {
    setMeal({ ...meal, [e.target.name]: e.target.value });
  };

  // Dynamic Ingredients logic
  const addIngredient = () =>
    setMeal({ ...meal, ingredients: [...meal.ingredients, ""] });
  const removeIngredient = (index) => {
    const newIng = meal.ingredients.filter((_, i) => i !== index);
    setMeal({ ...meal, ingredients: newIng });
  };
  const handleIngChange = (index, value) => {
    const newIng = [...meal.ingredients];
    newIng[index] = value;
    setMeal({ ...meal, ingredients: newIng });
  };

  // Dynamic Recipe logic
  const addStep = () =>
    setMeal({
      ...meal,
      recipes: [
        ...meal.recipes,
        { step_number: meal.recipes.length + 1, content: "" },
      ],
    });

  const handleRecipeChange = (index, value) => {
    const newRec = [...meal.recipes];
    newRec[index].content = value;
    setMeal({ ...meal, recipes: newRec });
  };

  // Submit to Backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, message: "Uploading...", type: "info" });

    try {
      const response = await axios.post(
        "http://localhost:5000/api/meals",
        meal,
      );
      setStatus({
        loading: false,
        message: "Meal uploaded successfully!",
        type: "success",
      });
      // Reset form if needed
      setMeal({
        name: "",
        origin: "",
        category: "balance",
        image_url: "",
        ingredients: [""],
        recipes: [{ step_number: 1, content: "" }],
      });
    } catch (error) {
      console.error(error);
      setStatus({
        loading: false,
        message: "Error uploading meal. Check console.",
        type: "error",
      });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8 font-sans text-black">
      {" "}
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              to="/guide"
              className="text-zinc-400 hover:text-black flex items-center gap-1 text-sm mb-2"
            >
              <ChevronLeft size={16} /> Back to Guide
            </Link>
            <h1 className="text-3xl font-bold text-zinc-900">
              Admin Dashboard
            </h1>
            <p className="text-zinc-500">
              Upload new delicious recipes to EatVibing
            </p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={status.loading}
            className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-zinc-800 transition-all disabled:bg-zinc-400"
          >
            <Save size={20} />
            {status.loading ? "Saving..." : "Save Meal"}
          </button>
        </div>

        {status.message && (
          <div
            className={`mb-6 p-4 rounded-xl text-sm font-medium ${
              status.type === "success"
                ? "bg-green-100 text-green-700"
                : status.type === "error"
                  ? "bg-red-100 text-red-700"
                  : "bg-blue-100 text-blue-700"
            }`}
          >
            {status.message}
          </div>
        )}

        <form className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Basic Info */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <UploadCloud size={18} /> Basic Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
                    Meal Name
                  </label>
                  <input
                    name="name"
                    value={meal.name}
                    onChange={handleChange}
                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                    placeholder="e.g. Pho Bo"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
                      Origin
                    </label>
                    <input
                      name="origin"
                      value={meal.origin}
                      onChange={handleChange}
                      className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none"
                      placeholder="e.g. Vietnam"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
                      Category
                    </label>
                    <select
                      name="category"
                      value={meal.category}
                      onChange={handleChange}
                      className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none"
                    >
                      <option value="loss">Weight Loss</option>
                      <option value="gain">Bulking</option>
                      <option value="balance">Balanced</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
                    Image URL
                  </label>
                  <input
                    name="image_url"
                    value={meal.image_url}
                    onChange={handleChange}
                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>

            {/* Ingredients Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Ingredients</h2>
                <button
                  type="button"
                  onClick={addIngredient}
                  className="p-2 bg-zinc-100 rounded-full hover:bg-zinc-200"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="space-y-3">
                {meal.ingredients.map((ing, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      value={ing}
                      onChange={(e) => handleIngChange(idx, e.target.value)}
                      className="flex-1 p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm"
                      placeholder={`Ingredient ${idx + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeIngredient(idx)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Recipe Steps */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Cooking Steps</h2>
              <button
                type="button"
                onClick={addStep}
                className="p-2 bg-zinc-100 rounded-full hover:bg-zinc-200"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="space-y-6">
              {meal.recipes.map((step, idx) => (
                <div
                  key={idx}
                  className="relative pl-8 border-l-2 border-zinc-100 space-y-2"
                >
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-black text-[10px] text-white flex items-center justify-center font-bold">
                    {step.step_number}
                  </div>
                  <textarea
                    value={step.content}
                    onChange={(e) => handleRecipeChange(idx, e.target.value)}
                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none min-h-[100px]"
                    placeholder={`Describe step ${idx + 1}...`}
                  />
                </div>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;
