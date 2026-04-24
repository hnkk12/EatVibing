import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "./assets/vite.svg";
import heroImg from "./assets/hero.png";
import React from "react";
import Grid from "./_components/item_grid";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {
  Zap,
  Globe,
  CreditCard,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import "./App.css";
import Logo from "./_components/logo";
import Chat from "./_components/pages/Chat.jsx";
import Guide from "./_components/pages/Guide.jsx";
import RecommendPage from "./_components/pages/RecommendPage.jsx";
function Home() {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white font-sans">
      {/* LEFT SIDE: Sidebar (Fixed/Sticky on Desktop) */}
      <section className="w-full md:w-[400px] lg:w-[450px] bg-[#3d4a16] text-white p-8 md:p-12 md:h-screen md:sticky md:top-0 flex flex-col justify-between">
        <div>
          {/* Logo */}
          <Logo />
          {/* Hero Content */}
          <h1 className="text-5xl md:text-6xl font-normal leading-tight mb-6">
            Money Transfers Made <span className="text-[#b4eb77]">Simple</span>
          </h1>
          <p className="text-gray-300 text-lg mb-12">
            No personal credit checks or founder guarantee.
          </p>

          {/* Offerings Grid */}

          <Grid />
        </div>

        {/* Footer Links (Left) */}
        <div className="mt-12 md:mt-0 flex flex-wrap gap-4 text-sm text-gray-300">
          <a href="#" className="hover:text-white">
            Contact
          </a>
          <a href="#" className="hover:text-white">
            Social
          </a>
          <a href="#" className="hover:text-white">
            Address
          </a>
          <a href="#" className="hover:text-white">
            Legal Terms
          </a>
        </div>
      </section>

      {/* RIGHT SIDE: Scrollable Content */}
      <main className="flex-1 p-6 md:p-16 flex flex-col items-center justify-center">
        {/* Header (Top Right) - Hidden on Mobile if needed, or moved */}
        <div className="w-full flex justify-end mb-12 absolute top-8 right-8 hidden md:flex">
          <button className="bg-[#b4eb77] text-black px-6 py-2 rounded-md font-semibold hover:bg-[#a2d66a] transition-colors">
            Get started
          </button>
        </div>

        {/* Main Image & Badges Container */}
        <div className="relative w-full max-w-4xl mx-auto rounded-[40px] overflow-hidden shadow-2xl">
          <img
            src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=1000"
            alt="User smiling"
            className="w-full h-[500px] object-cover"
          />

          {/* Badges Overlay */}
          <div className="absolute inset-0 p-8 flex flex-col justify-between pointer-events-none">
            <div className="flex justify-between items-start">
              <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-4 py-2 flex items-center gap-2 text-white">
                <div className="bg-[#b4eb77] p-1 rounded-full text-black">
                  <CreditCard size={14} />
                </div>
                <span className="text-sm font-medium italic">
                  Interest earned!
                </span>
              </div>

              <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-4 py-2 flex items-center gap-2 text-white">
                <CheckCircle2 size={18} className="text-[#b4eb77]" />
                <span className="text-sm font-medium italic">Money sent!</span>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-6 py-3 flex items-center gap-2 text-white translate-y-4">
                <div className="bg-[#b4eb77] p-1 rounded-md text-black">
                  <ShieldCheck size={16} />
                </div>
                <span className="text-lg font-medium italic">
                  Payment recieved!
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="mt-20 text-center max-w-md">
          <h2 className="text-2xl md:text-3xl font-medium text-gray-800 leading-tight">
            We escalate transfer efficiency and productivity
          </h2>
        </div>

        {/* Partner Logos */}
        <div className="mt-20 flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-60 grayscale hover:grayscale-0 transition-all">
          <div className="flex items-center gap-1 font-bold text-[#3d4a16]">
            <Globe size={20} /> Blooming
          </div>
          <div className="flex items-center gap-1 font-bold text-[#3d4a16]">
            <Zap size={20} /> BuildRight
          </div>
          <div className="flex items-center gap-1 font-bold text-[#3d4a16]">
            <CheckCircle2 size={20} /> Flowbot
          </div>
          <div className="flex items-center gap-1 font-bold text-[#3d4a16]">
            EXPOR
          </div>
          <div className="flex items-center gap-1 font-bold text-[#3d4a16]">
            Redo
          </div>
        </div>
      </main>
    </div>
  );
}
function App() {
  return (
    <Router>
      <Routes>
        {/* Trang chủ hiển thị giao diện hiện tại */}
        <Route path="/" element={<Home />} />

        {/* Các trang con khi click vào Grid sẽ hiện ra ở đây */}
        <Route path="/ai-menu" element={<Chat />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="/recommendation" element={<RecommendPage />} />
      </Routes>
    </Router>
  );
}
export default App;
