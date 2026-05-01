import React, { useState } from "react";

const Guide = () => {
  const categories = [
    { id: "what-to-eat", label: "What to eat today?", type: "feature" },
    { id: "weekly-plans", label: "Weekly Meal Plans", type: "feature" },
    { id: "divider", label: "", type: "divider" },
    { id: "all", label: "All meals", type: "category" },
    { id: "loss", label: "Weight Loss", type: "category" },
    { id: "gain", label: "Bulking", type: "category" },
    { id: "balance", label: "Balanced", type: "category" },
  ];

  const products = [
    {
      id: 1,
      name: "Salad Ức Gà Áp Chảo",
      origin: "Mỹ",
      category: "loss",
      image:
        "https://images.unsplash.com/photo-1540420773420-3366772f4492?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: 2,
      name: "Bún Chả Hà Nội",
      origin: "Việt",
      category: "balance",
      image:
        "https://images.unsplash.com/photo-1627318029524-747209da029b?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: 3,
      name: "Dimsum Tôm Hấp",
      origin: "Trung",
      category: "balance",
      image:
        "https://images.unsplash.com/photo-1563245372-f21724e3a16d?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: 4,
      name: "Steak Bò Khoai Tây",
      origin: "Âu",
      category: "gain",
      image:
        "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: 5,
      name: "Pasta Sốt Kem",
      origin: "Ý",
      category: "gain",
      image:
        "https://images.unsplash.com/photo-1645112481338-3560e9426f6d?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: 6,
      name: "Phở Bò Nam Định",
      origin: "Việt",
      category: "balance",
      image:
        "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?q=80&w=600&auto=format&fit=crop",
    },
  ];

  const [selectedCat, setSelectedCat] = useState("all");
  const filteredProducts = products.filter(
    (p) => selectedCat === "all" || p.category === selectedCat,
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
        </aside>

        {/* --- MAIN CONTENT RIGHT --- */}
        <main className="flex-1">
          {/* Render Nội dung Tool */}
          {selectedCat === "what-to-eat" && (
            <div className="mb-16 bg-white border border-gray-100 p-16 rounded-sm text-center shadow-sm">
              <h2 className="text-2xl font-light tracking-widest uppercase">
                Random Picker
              </h2>
              <p className="text-gray-400 mt-2 text-sm">
                Still wondering? Let EatVibing suggests meals for you.
              </p>
              <button className="mt-8 px-10 py-3 border border-black hover:bg-black hover:text-white transition-all duration-500 uppercase text-xs tracking-[0.2em]">
                Generate Recipe
              </button>
            </div>
          )}

          {/* Render Lưới Món Ăn */}
          {selectedCat !== "what-to-eat" && selectedCat !== "weekly-plans" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
              {filteredProducts.map((product) => (
                <div key={product.id} className="group cursor-pointer">
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
                </div>
              ))}
            </div>
          )}

          {/* Weekly Plans Placeholder */}
          {selectedCat === "weekly-plans" && (
            <div className="text-center py-40 border border-dashed border-gray-200 rounded-sm">
              <p className="text-gray-400 uppercase text-[10px] tracking-[0.3em]">
                Module under development
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Guide;
