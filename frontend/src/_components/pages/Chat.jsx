import React, { useState } from "react";
import {
  Image,
  Music,
  BookOpen,
  PenTool,
  Sun,
  Video,
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
      icon: <Image size={18} className="text-orange-400" />,
      label: "Create image",
    },
    {
      icon: <Music size={18} className="text-red-400" />,
      label: "Create music",
    },
    { icon: <BookOpen size={18} />, label: "Help me learn" },
    { icon: <PenTool size={18} />, label: "Write anything" },
    { icon: <Sun size={18} />, label: "Boost my day" },
    { icon: <Video size={18} />, label: "Create video" },
  ];

  return (
    <div className="flex flex-col h-full  text-[#e3e3e3] font-sans relative">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full custom-scrollbar">
        <div className="max-w-2xl mx-auto w-full flex flex-col justify-center min-h-full px-4 py-10">
          {/* Nếu chưa có tin nhắn -> Hiện giao diện "Hi Chef" y hệt của bạn */}
          {messages.length === 0 ? (
            <div className="mb-60">
              {" "}
              {/* Giữ nguyên mb-60 của bạn */}
              <h1 className="text-4xl font-medium mb-2 tracking-tight">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-red-400 bg-clip-text text-transparent">
                  Hi Chef
                </span>
              </h1>
              <h2 className="text-4xl font-medium mb-8 text-black">
                Where should we start?
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
      <footer className="max-w-3xl mx-auto w-full pb-10 px-4">
        <div className="bg- rounded-3xl p-4 shadow-xl border border-white/5">
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
          <div className="flex justify-between items-center">
            <div className="flex gap-4 text-[#c4c7c5]">
              <Plus
                className="cursor-pointer hover:text-white transition-colors"
                size={20}
              />
              <Sliders
                className="cursor-pointer hover:text-white transition-colors"
                size={20}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-sm font-medium text-[#c4c7c5] cursor-pointer hover:bg-[#2e2e2e] px-2 py-1 rounded-lg transition-colors">
                Fast <ChevronDown size={16} />
              </div>
              <Mic
                className="text-[#c4c7c5] cursor-pointer hover:text-white transition-colors"
                size={20}
              />
            </div>
          </div>
        </div>
        <p className="text-center text-[11px] text-black mt-4">
          EatVibing can make mistakes. Check important info.
        </p>
      </footer>
    </div>
  );
};

export default Chat;
