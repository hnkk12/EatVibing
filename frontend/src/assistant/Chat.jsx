import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Book, ChefHat, BookOpen, ChartColumn, Refrigerator, CookingPot, ArrowUp } from "lucide-react";
import { useAssistant } from "./AssistantContext";
import { Shell, MemberSelect, Status, PlanCard } from "./shared";
function Content() {
  const { today, api, refresh } = useAssistant();
  const [messages, setMessages] = useState([]), [input, setInput] = useState(""), [memberId, setMemberId] = useState(today.profile.id), [cards, setCards] = useState(today.actions), [preview, setPreview] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState(""), [connection, setConnection] = useState(null), [historyLoaded, setHistoryLoaded] = useState(false);
  const sending = useRef(false);
  const end = useRef(null);
  useEffect(() => { let active = true; api("/assistant/messages").then(rows => { if (active) setMessages(rows); }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setHistoryLoaded(true); }); return () => { active = false; }; }, [api]);
  useEffect(() => { let active = true; api("/assistant/status?memberId=" + encodeURIComponent(memberId || today.profile.id)).then(data => { if (active) setConnection(data); }).catch(() => { if (active) setConnection(null); }); return () => { active = false; }; }, [api, memberId, today.profile.id]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [messages, preview]);
  const run = async action => { setBusy(true); setError(""); try { await action(); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  const send = () => { const prompt = input.trim(); if (!prompt || busy || sending.current || !historyLoaded) return; sending.current = true; run(async () => {
    const pendingId = "pending-" + Date.now(); setMessages(rows => [...rows, { role: "user", text: prompt, pendingId }]);
    try {
      const result = await api("/assistant/messages", { prompt, ...(memberId ? { memberId } : {}) });
      setMessages(rows => [...rows, { role: "assistant", text: result.answer }]);
      setCards(result.cards || []); setPreview(result.proposal || null);
      if (!result.missingInformation?.includes("memberId")) setInput("");
    } catch (e) { setMessages(rows => rows.filter(m => m.pendingId !== pendingId)); throw e; }
    finally { sending.current = false; }
  }); };
  return <div className="ai-chat"><div className="ai-chat-context"><MemberSelect optional value={memberId} onChange={setMemberId} /><p>Meal changes are previewed before saving.</p>{connection && (!connection.access ? <p role="status">AI Assistant access has not been enabled for this account.</p> : connection.provider !== "configured" ? <p role="status">AI chat is not connected. Meal previews still work.</p> : !connection.consent ? <p role="status">AI chat needs this member's consent. <Link to="/profile">Review in Profile</Link>.</p> : <p role="status">AI chat is connected.</p>)}</div>
    {messages.length === 0 && <div className="ai-chat-welcome"><h1><span className="ai-chat-greeting">Hi Chef</span></h1><h2>What should we cook today?</h2><div className="ai-suggestions"><button disabled={busy} onClick={() => run(async () => setPreview(await api("/plan-proposals", { date: today.date })))}><Book size={18} className="text-orange-400" />Generate Recipe</button><Link to="/family-planner"><ChefHat size={18} className="text-red-400" />Meal Planner</Link><button onClick={() => setInput("Help me cook with the ingredients I have.")}><BookOpen size={18} />Cooking Assistant</button><Link to="/profile"><ChartColumn size={18} />Nutrition Analyzer</Link><Link to="/family-planner#groceries"><Refrigerator size={18} />Fridge Clean-out</Link><button onClick={() => setInput("Share practical kitchen tips for today's meals.")}><CookingPot size={18} />Kitchen Hacks</button></div></div>}
    {messages.map((m, i) => <div className={`ai-bubble ${m.role}`} key={i}>{m.text}</div>)}
    <div className="ai-actions">{cards.map(card => <Link className="ai-button" key={card.to} to={card.to}>{card.label}</Link>)}</div>
    {preview && <PlanCard plan={preview} members={today.members} busy={busy} onConfirm={id => run(async () => { await api(`/plan-proposals/${id}/confirm`, {}); setPreview(null); await refresh(); })} />}
    <div ref={end} style={{ height: 1, scrollMarginBottom: 220 }} />
    <footer className="ai-chat-footer"><Status error={error} /><form className="ai-chat-form" onSubmit={e => { e.preventDefault(); send(); }}><label><span className="sr-only">Message</span><textarea value={input} maxLength={2000} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }} placeholder="Ask EatVibing" rows={1} /></label><div className="ai-actions"><button className="primary" aria-label="Send message" disabled={busy || !historyLoaded || !input.trim()}>{busy ? "Thinking…" : <ArrowUp size={18} />}</button></div></form><p>EatVibing can make mistakes. Check important info.</p></footer>
  </div>;
}
export default function Chat() { return <Shell compact title="AI Assistant" description="Personal context. Practical food choices. Plans you control."><Content /></Shell>; }
