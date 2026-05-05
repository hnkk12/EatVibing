import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import axios from "axios";
import { supabase } from "../../supabaseClient";
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
  ArrowUp,
} from "lucide-react";
const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  //scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  //load history when accessing tab
  useEffect(() => {
    const fetchHistory = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        try {
          const response = await axios.get(
            `http://localhost:5000/api/ai/history/${user.id}`,
          );

          //map data from DB to text for UI
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
  }, []);

  //send message function
  const handleSend = async (customPrompt) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || isLoading) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      alert("Login to save chat history");
      return;
    }

    //add user message to UI
    const userMsg = { role: "user", text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    try {
      //API calling to backend
      const response = await axios.post("http://localhost:5000/api/ai/chat", {
        prompt: textToSend,
        userId: user.id,
      });

      //add AI responses to UI
      const aiMsg = { role: "assistant", text: response.data.answer };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("AI error", error);
      const errorMsg = {
        role: "assistant",
        text: "Sorry Chef, there were some unexpected errors, please try again!",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

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
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden text-[#e3e3e3] font-sans relative bg-white">
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
                    onClick={() => handleSend(btn.label)}
                    className="flex items-center gap-2 bg-white border-black text-black hover:bg-slate-100 transition-colors px-4 py-2.5 rounded-full text-sm font-medium border border-transparent active:border-zinc-600"
                  >
                    {btn.icon}
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* -> Hiện danh sách tin nhắn */
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
                  {msg.role === "user" ? (
                    msg.text
                  ) : (
                    <div className="prose prose-sm max-w-none prose-zinc">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef}></div>
            </div>
          )}
        </div>
      </main>

      {/* Input Section */}
      <footer className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/90 to-transparent pb-6 px-4 z-20">
        <div className="max-w-3xl mx-auto w-full">
          <div className="bg-white rounded-3xl p-4 shadow-2xl border border-zinc-200">
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
        </div>
        <p className="text-center text-[11px] text-black mt-4">
          EatVibing can make mistakes. Check important info.
        </p>
      </footer>
    </div>
  );
};

export default Chat;
