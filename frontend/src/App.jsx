import { motion } from "framer-motion";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./_components/navbar";
import Hero from "./_components/hero";
import Chat from "./_components/pages/Chat";
import Guide from "./_components/pages/Guide";
import Community from "./_components/pages/Community";
import AdminDashboard from "./_components/pages/AdminDashBoard";
export default function App() {
  return (
    <BrowserRouter>
      <main className="h-screen overflow-x-hidden w-full bg-white relative overflow-hidden flex flex-col">
        {" "}
        {/* Background Ribbed Texture */}
        <div className="absolute inset-0 bg-ribbed opacity-40 pointer-events-none" />
        {/* Floating Gradient Accents */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-zinc-800/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-zinc-800/10 rounded-full blur-[100px]" />
        {/* Main Container Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="w-full flex flex-col flex-1 min-h-0 relative z-10 "
        >
          <Navbar />
          <Routes>
            <Route path="/" element={<Hero />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="/community" element={<Community />} />
            <Route path="/admin" element={<AdminDashboard />}></Route>
          </Routes>
        </motion.div>
      </main>
    </BrowserRouter>
  );
}
