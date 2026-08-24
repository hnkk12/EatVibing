import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { supabase } from "../../supabaseClient";
import api from "../../config/api";
import {
  Book,
  ChefHat,
  BookOpen,
  ChartColumn,
  Refrigerator,
  CookingPot,
  ArrowUp,
  Loader2,
} from "lucide-react";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load history when accessing tab
  useEffect(() => {
    const fetchHistory = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user) {
        try {
          const response = await api.get(`/ai/history/${user.id}`);
          const history = response.data.map((m) => ({
            role: m.role,
            text: m.content,
          }));
          setMessages(history);
        } catch (error) {
          console.error("Error when loading history chat", error);
        }
      }
    };
    fetchHistory();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setCurrentUser(session?.user || null);
      }
    );
    return () => authListener?.subscription?.unsubscribe();
  }, []);

  // Send message function
  const handleSend = async (customPrompt) => {
    const textToSend = (customPrompt || input).trim();
    if (!textToSend || isLoading) return;

    // Add user message to UI
    const userMsg = { role: "user", text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await api.post("/ai/chat", {
        prompt: textToSend,
        userId: currentUser?.id || null,
      });

      const aiMsg = { role: "assistant", text: response.data.answer };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("AI error", error);
      const errorMsg = {
        role: "assistant",
        text: "Xin lỗi Chef, hệ thống AI đang bận hoặc có lỗi kết nối. Vui lòng thử lại sau giây lát!",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestButtons = [
    {
      icon: <Book size={18} className="text-orange-500" />,
      label: "Gợi ý công thức",
      prompt: "Hãy gợi ý cho tôi 1 công thức món ăn ngon, dễ làm và đầy đủ dinh dưỡng cho hôm nay.",
    },
    {
      icon: <ChefHat size={18} className="text-red-500" />,
      label: "Lập thực đơn",
      prompt: "Hãy lập cho tôi thực đơn 1 ngày (sáng, trưa, tối) cân bằng dinh dưỡng và lành mạnh.",
    },
    {
      icon: <Refrigerator size={18} className="text-blue-500" />,
      label: "Dọn tủ lạnh",
      prompt: "Tôi có trứng, cà chua, hành lá và thịt băm. Hãy gợi ý các món ngon có thể nấu từ những nguyên liệu này.",
    },
    {
      icon: <ChartColumn size={18} className="text-green-500" />,
      label: "Phân tích calo",
      prompt: "Một bát phở bò tái nạm chứa khoảng bao nhiêu calo và macro dinh dưỡng (protein, carb, fat)?",
    },
    {
      icon: <BookOpen size={18} className="text-purple-500" />,
      label: "Chế độ giảm cân",
      prompt: "Gợi ý cho tôi 3 món ăn ít calo nhưng giàu đạm để hỗ trợ giảm cân hiệu quả.",
    },
    {
      icon: <CookingPot size={18} className="text-amber-500" />,
      label: "Mẹo nhà bếp",
      prompt: "Chia sẻ 3 mẹo bảo quản rau củ tươi lâu trong tủ lạnh không bị úng dập.",
    },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden text-zinc-900 font-sans relative bg-white">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar min-h-0">
        <div className="max-w-2xl mx-auto w-full flex flex-col px-4 py-10 pb-36">
          {/* Welcome Screen */}
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center my-auto pt-10">
              <h1 className="text-4xl md:text-5xl font-bold mb-2 tracking-tight">
                <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-lime-600 bg-clip-text text-transparent">
                  Hi Chef
                </span>
              </h1>
              <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-zinc-800">
                Hôm nay chúng ta nấu món gì?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {suggestButtons.map((btn, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(btn.prompt)}
                    className="flex items-center gap-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-800 transition-all p-3.5 rounded-2xl text-sm font-medium text-left shadow-sm hover:shadow"
                  >
                    <div className="p-2 bg-white rounded-xl shadow-xs border border-zinc-100">
                      {btn.icon}
                    </div>
                    <span>{btn.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Chat Messages List */
            <div className="flex flex-col gap-6 w-full">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-5 rounded-2xl max-w-[90%] md:max-w-[85%] text-sm md:text-base leading-relaxed ${
                    msg.role === "user"
                      ? "bg-zinc-900 text-white ml-auto rounded-tr-none shadow-md"
                      : "bg-zinc-50 text-zinc-900 border border-zinc-200 mr-auto rounded-tl-none shadow-xs"
                  }`}
                >
                  {msg.role === "user" ? (
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  ) : (
                    <div className="prose prose-sm md:prose-base max-w-none prose-zinc dark:prose-invert">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 p-4 bg-zinc-50 border border-zinc-200 rounded-2xl rounded-tl-none w-fit text-zinc-500 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-700" />
                  <span>Chef AI đang suy nghĩ công thức...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Input Section */}
      <footer className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/95 to-transparent pb-6 px-4 z-20">
        <div className="max-w-2xl mx-auto w-full">
          <div className="bg-white rounded-3xl p-3 shadow-xl border border-zinc-200 flex items-center gap-2 focus-within:ring-2 focus-within:ring-zinc-900 transition-all">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Hỏi EatVibing về công thức, nguyên liệu..."
              className="w-full bg-transparent border-none outline-none resize-none text-sm md:text-base px-3 py-1 placeholder-zinc-400 text-zinc-900 max-h-32"
              rows={1}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="p-3 bg-zinc-900 text-white rounded-2xl hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer"
              title="Gửi tin nhắn"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowUp className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-center text-[11px] text-zinc-400 mt-2">
            EatVibing AI có thể đưa ra gợi ý chưa hoàn toàn chính xác. Hãy kiểm tra lại trước khi áp dụng.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Chat;
