import React, { useState } from "react";
import {
  Book,
  ChefHat,
  BookOpen,
  ChartColumn,
  Refrigerator,
  CookingPot,
  Menu,
  Plus,
  Mic,
  Sliders,
  ChevronDown,
} from "lucide-react"; // Sử dụng lucide-react cho các icon
const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const suggestButtons = [
    {
      icon: <Book size={18} className="text-orange-400" />,
      label: "Generate Recipe",
    },
    {
      icon: <ChefHat size={18} className="text-red-400" />,
      label: "Meal Planner",
    },
    { icon: <BookOpen size={18} />, label: "Cooking Assistant" },
    { icon: <ChartColumn size={18} />, label: "Nutrition Analyzer" },
    { icon: <Refrigerator size={18} />, label: "Fridge Clean-out" },
    { icon: <CookingPot size={18} />, label: "Kitchen Hacks" },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden text-[#e3e3e3] font-sans relative">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar min-h-0">
        <div className="max-w-2xl mx-auto w-full flex flex-col px-4 py-10">
          {/* Nếu chưa có tin nhắn -> Hiện giao diện "Hi Chef" y hệt của bạn */}
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center">
              {/* Giữ nguyên mb-60 của bạn */}
              <h1 className="text-4xl font-medium mb-2 tracking-tight">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-red-400 bg-clip-text text-transparent">
                  Hi Chef
                </span>
              </h1>
              <h2 className="text-4xl font-medium mb-8 text-black">
                What should we cook today?
              </h2>
              <div className="flex flex-wrap gap-2">
                {suggestButtons.map((btn, idx) => (
                  <button
                    key={idx}
                    className="flex items-center gap-2 bg-white border-black text-black hover:bg-slate-100 transition-colors px-4 py-2.5 rounded-full text-sm font-medium border border-transparent active:border-zinc-600"
                  >
                    {btn.icon}
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Nếu đã bắt đầu chat -> Hiện danh sách tin nhắn */
            <div className="flex flex-col gap-6 w-full pb-20">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-2xl max-w-[85%] ${
                    msg.role === "user"
                      ? "bg-zinc-100 text-black ml-auto"
                      : "bg-white text-black border border-zinc-200"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Input Section */}
      <footer className="flex-shrink-0 max-w-3xl mx-auto w-full pb-6 px-4">
        <div className="bg-white rounded-3xl p-4 shadow-xl border border-white/5">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask EatVibing"
            className="w-full bg-transparent border-none outline-none resize-none text-lg px-2 mb-4 placeholder-[#8e918f] text-black"
            rows={1}
          />
        </div>
        <p className="text-center text-[11px] text-black mt-4">
          EatVibing can make mistakes. Check important info.
        </p>
      </footer>
    </div>
  );
};

export default Chat;
