/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "framer-motion";
import {
  Home,
  Brain,
  BookOpen,
  NotepadText,
  User,
  Asterisk,
  Layout,
  Search,
} from "lucide-react";
import Logo from "./_components/logo";
import { BrowserRouter } from "react-router-dom";
const Navbar = () => {
  return (
    <nav className="flex items-center justify-between px-8 py-6">
      {/* Logo */}
      <Logo />

      {/* Center Icons */}
      <div className="flex items-center gap-6 text-zinc-400">
        <Home className="w-5 h-5 cursor-pointer hover:text-zinc-900 transition-colors" />
        <Brain className="w-5 h-5 cursor-pointer hover:text-zinc-900 transition-colors" />
        <BookOpen className="w-5 h-5 cursor-pointer hover:text-zinc-900 transition-colors" />
        <NotepadText className="w-5 h-5 cursor-pointer hover:text-zinc-900 transition-colors" />
      </div>

      {/* Search & Profile */}
      <div className="flex items-center gap-4">
        <div className="relative group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-full text-sm font-medium focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 w-48 transition-all duration-300 group-hover:w-56"
          />
        </div>
        <div className="w-10 h-10 flex items-center justify-center rounded-full border border-zinc-200 hover:bg-zinc-50 cursor-pointer transition-colors">
          <User className="w-5 h-5 text-zinc-900" />
        </div>
      </div>
    </nav>
  );
};

const Hero = () => {
  return (
    <div className="relative flex-1 flex flex-col justify-center px-16 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-2xl"
      >
        <h1 className="font-display text-8xl font-bold leading-[0.88] tracking-tighter text-zinc-900 mb-12">
          Deliciously <br />
          effortless
          <br />
          dining
        </h1>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="inline-flex items-center gap-3 px-6 py-4 bg-white rounded-full shadow-sm border border-zinc-100 cursor-pointer hover:shadow-md transition-shadow duration-300"
        >
          <div className="bg-zinc-900 p-1 rounded-full">
            <Asterisk className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-medium tracking-tight text-zinc-900">
            Try AI Suggestion
          </span>
        </motion.div>
      </motion.div>

      {/* Decorative Walker Image (Absolute positioned) */}
      <div className="absolute right-0 bottom-0 top-0 w-1/2 flex items-end justify-center pointer-events-none overflow-hidden select-none">
        <motion.img
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 1 }}
          src="https://images.unsplash.com/photo-1476973422084-e0fa66df945c?auto=format&fit=crop&q=80&w=1200"
          alt="Minimalist person walking"
          className="h-[70%] object-contain mix-blend-multiply opacity-90"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <main className="h-screen w-screen bg-[#F7F7F7] relative overflow-hidden">
        {" "}
        {/* Background Ribbed Texture */}
        <div className="absolute inset-0 bg-ribbed opacity-40 pointer-events-none" />
        {/* Floating Gradient Accents */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-zinc-800/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-zinc-800/10 rounded-full blur-[100px]" />
        {/* Main Container Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="w-full h-full bg-[#F7F7F7] shadow-2xl overflow-hidden flex flex-col relative z-10 border border-white/20"
        >
          <Navbar />
          <Hero />
        </motion.div>
      </main>
    </BrowserRouter>
  );
}
