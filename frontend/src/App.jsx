import { motion as Motion } from "framer-motion";
import { useContext } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Context } from "./dataContext";
import Navbar from "./_components/navbar";
import Hero from "./_components/hero";
import Chat from "./assistant/Chat";
import AssistantProvider from "./assistant/AssistantProvider";
import { useAssistant } from "./assistant/AssistantContext";
import Today from "./assistant/Today";
import Profile from "./assistant/Profile";
import Family from "./assistant/Family";
import FamilyPlanner from "./assistant/Planner";
import NutritionReview from "./assistant/NutritionReview";
import Guide from "./_components/pages/Guide";
import Community from "./_components/pages/Community";
import AdminDashboard from "./_components/pages/AdminDashboard";
import LocalProvider from "./LocalProvider";
import { Detail, Pricing, Planner } from "./PremiumFeatures";

function AssistantAccess() {
  const { state, loading, error, load } = useContext(Context);
  const { today } = useAssistant();
  if (!today || today.demo || today.assistantAccess) return <Chat />;
  if (loading) return <p className="p-12 text-sm text-zinc-500">Loading your plan…</p>;
  if (error) return <div className="p-12 text-sm text-red-500">{error} <button onClick={load}>Try again</button></div>;
  if (state.plan === "pro") return <Chat />;
  return <div className="premium-features"><section className="page section"><div className="locked-panel"><span className="eyebrow">Pro feature</span><h1>Your AI cooking assistant</h1><p>Upgrade to Pro to use AI Assistant and get help with recipes, ingredients and cooking.</p><Link className="btn primary" to="/pricing">Explore Pro</Link></div></section></div>;
}
function PlannerAccess() {
  const { state } = useContext(Context);
  return state.hostedAssistant ? <FamilyPlanner /> : <div className="premium-features"><Planner /></div>;
}
export default function App() {
  return (
    <BrowserRouter>
      <LocalProvider>
        <AssistantProvider>
        <main className="min-h-screen w-full bg-white relative overflow-x-clip flex flex-col">
          {/* Background Ribbed Texture */}
          <div className="absolute inset-0 bg-ribbed opacity-40 pointer-events-none" />
          {/* Floating Gradient Accents */}
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-zinc-800/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-zinc-800/10 rounded-full blur-[100px]" />
          {/* Main Container Card */}
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="w-full flex flex-col flex-1 min-h-0 relative z-10 "
          >
            <Navbar />
            <Routes>
              <Route path="/" element={<Hero />} />
              <Route path="/chat" element={<AssistantAccess />} />
              <Route path="/today" element={<Today />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/family" element={<Family />} />
              <Route path="/family-planner" element={<FamilyPlanner />} />
              <Route path="/nutrition-review" element={<NutritionReview />} />
              <Route path="/guide" element={<Guide />} />
              <Route path="/community" element={<Community />} />
              <Route
                path="/recipes/:id"
                element={
                  <div className="premium-features">
                    <Detail />
                  </div>
                }
              />
              <Route
                path="/pricing"
                element={
                  <div className="premium-features">
                    <Pricing />
                  </div>
                }
              />
              <Route
                path="/planner"
                element={<PlannerAccess />}
              />
              <Route path="/saved" element={<Guide saved />} />
              <Route path="/admin" element={<AdminDashboard />}></Route>
            </Routes>
          </Motion.div>
        </main>
        </AssistantProvider>
      </LocalProvider>
    </BrowserRouter>
  );
}
