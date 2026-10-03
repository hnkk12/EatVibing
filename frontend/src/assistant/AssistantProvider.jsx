import { useCallback, useEffect, useRef, useState } from "react";
import { AssistantContext } from "./AssistantContext";
import { assistantApi } from "./api";
import { supabase } from "../supabaseClient";
export default function AssistantProvider({ children }) {
  const [today, setToday] = useState(null), [error, setError] = useState(null), [loading, setLoading] = useState(true);
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const epoch = ++generation.current;
    try { const data = await assistantApi("/today"); if (epoch === generation.current) { setToday(data); setError(null); } }
    catch (e) { if (epoch === generation.current) { setError(e); setToday(null); } }
    finally { if (epoch === generation.current) setLoading(false); }
  }, []);
  useEffect(() => {
    let active = true;
    const { data } = supabase.auth.onAuthStateChange(() => {
      generation.current++; setToday(null); setLoading(true);
      // Avoid Supabase auth callback re-entry while getSession is locked.
      setTimeout(() => { if (active) refresh(); }, 0);
    });
    refresh();
    return () => { active = false; data.subscription.unsubscribe(); };
  }, [refresh]);
  return <AssistantContext.Provider value={{ today, error, loading, refresh, api: assistantApi }}>{children}</AssistantContext.Provider>;
}
