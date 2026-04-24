import React from "react";
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
import Logo from "../logo";
const Chat = () => {
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
    <div className="flex flex-col h-screen bg-[#3f4d13] text-[#e3e3e3] font-sans p-4">
      {/* Header */}
      <header className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-4">
          <Logo />
        </div>
        <div className="flex items-center gap-3">
          <div className="border border-zinc-700 px-3 py-0.5 rounded text-xs font-bold text-zinc-400">
            PRO
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-red-500 border border-zinc-600 overflow-hidden">
            <img src="https://via.placeholder.com/32" alt="Avatar" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full flex flex-col justify-center mb-32">
        <h1 className="text-4xl font-medium mb-2 tracking-tight">
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-red-400 bg-clip-text text-transparent">
            Hi Ha
          </span>
        </h1>
        <h2 className="text-4xl font-medium mb-8 text-black">
          Where should we start?
        </h2>

        {/* Suggestion Chips */}
        <div className="flex flex-wrap gap-2">
          {suggestButtons.map((btn, idx) => (
            <button
              key={idx}
              className="flex items-center gap-2 bg-[#1e1e1e] hover:bg-[#2e2e2e] transition-colors px-4 py-2.5 rounded-full text-sm font-medium border border-transparent active:border-zinc-600"
            >
              {btn.icon}
              {btn.label}
            </button>
          ))}
        </div>
      </main>

      {/* Input Section */}
      <footer className="max-w-3xl mx-auto w-full pb-6">
        <div className="bg-[#1e1e20] rounded-3xl p-4 shadow-xl">
          <textarea
            placeholder="Ask Gemini"
            className="w-full bg-transparent border-none outline-none resize-none text-lg px-2 mb-4 placeholder-[#8e918f]"
            rows="1"
          />
          <div className="flex justify-between items-center">
            <div className="flex gap-4 text-[#c4c7c5]">
              <Plus className="cursor-pointer hover:text-white" size={20} />
              <Sliders className="cursor-pointer hover:text-white" size={20} />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-sm font-medium text-[#c4c7c5] cursor-pointer hover:bg-[#2e2e2e] px-2 py-1 rounded-lg">
                Fast <ChevronDown size={16} />
              </div>
              <Mic
                className="text-[#c4c7c5] cursor-pointer hover:text-white"
                size={20}
              />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Chat;
