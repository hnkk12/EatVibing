import { useCallback, useEffect, useRef, useState } from "react";
import { Context } from "./dataContext";
import { api } from "./localApi";
import { supabase } from "./supabaseClient";
export default function LocalProvider({ children }) {
  const [meals, setMeals] = useState([]);
  const [state, setState] = useState({
    plan: "free",
    favorites: [],
    planner: [],
    shopping: [],
    pantry: [],
    collections: [],
    templates: [],
    notes: {},
    preferences: {
      people: 2,
      category: "all",
      avoid: [],
      origins: [],
      activeWeek: "",
    },
  });
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const generation = useRef(0);
  const load = useCallback(async () => {
    const epoch = ++generation.current;
    try {
      const [catalog, data] = await Promise.all([api("/meals"), api("/state")]);
      if (epoch !== generation.current) return;
      setMeals(catalog.meals);
      setState(data);
      setError("");
    } catch (e) {
      if (epoch === generation.current) setError(e.message);
    } finally {
      if (epoch === generation.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
    let active = true;
    const { data } = supabase.auth.onAuthStateChange(() => {
      generation.current++;
      setLoading(true);
      setNotice("");
      setState(previous => ({ ...previous, plan: "free", favorites: [], planner: [], shopping: [], pantry: [], collections: [], templates: [], notes: {}, preferences: { people: 2, category: "all", avoid: [], origins: [], activeWeek: "" } }));
      setTimeout(() => { if (active) load(); }, 0);
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, [load]);
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [notice]);
  async function mutate(route, body) {
    const epoch = generation.current;
    try {
      const result = await api(route, body);
      if (epoch !== generation.current) return false;
      if (result.state) {
        setState(result.state);
        if (result.meals) setMeals(result.meals);
      } else setState(result);
      return true;
    } catch (e) {
      if (epoch === generation.current) setNotice(e.message);
      return false;
    }
  }
  return (
    <Context.Provider
      value={{
        meals,
        state,
        setMeals,
        mutate,
        notice: setNotice,
        loading,
        error,
        load,
      }}
    >
      {children}
      {notice && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-zinc-900 text-white rounded-xl px-5 py-4 text-sm max-w-[90vw] flex items-center gap-4"
        >
          {notice}
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            ×
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
