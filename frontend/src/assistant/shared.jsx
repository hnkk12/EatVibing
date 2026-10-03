import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAssistant } from "./AssistantContext";
import { supabase } from "../supabaseClient";
import "./assistant.css";
export function Shell({ title, description, children, compact = false }) {
  const { today, error, loading, refresh, api } = useAssistant();
  const [busy, setBusy] = useState(false), [failure, setFailure] = useState("");
  if (loading) return <div className="ai-skeleton" role="status">Loading your assistant…</div>;
  const startDemo = async () => { setBusy(true); setFailure(""); try { await api("/demo-session", {}); await refresh(); } catch (e) { setFailure(e.message); } finally { setBusy(false); } };
  return <section className={`ai-shell${compact ? " ai-shell-chat" : ""}`}>

    {!compact && <><div className="ai-heading"><div><h1>{title}</h1><p>{description}</p></div>{today && <span className="ai-pill">{today.date}</span>}</div>
    <nav className="ai-nav" aria-label="Assistant navigation">{[["/today", "Today"], ["/chat", "AI Assistant"], ["/profile", "Profile"], ["/family", "Family"], ["/family-planner", "Family planner"]].map(([to, label]) => <NavLink key={to} to={to}>{label}</NavLink>)}</nav></>}
    {!today ? <div className="ai-card ai-empty"><h2>Your assistant starts with you</h2><p>Sign in to keep your profile and family preferences together.</p><div className="ai-actions" style={{ justifyContent: "center" }}><button className="primary" onClick={() => supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + window.location.pathname } })}>Sign in with Google</button>{error?.status === 401 && <button disabled={busy} onClick={startDemo}>{busy ? "Starting…" : "Try local demo"}</button>}<button onClick={refresh}>Retry</button></div>{failure && <p className="ai-error" role="alert">{failure}</p>}{error?.status !== 401 && <p className="ai-error">{error?.message}</p>}<p className="ai-muted">Local demo uses a separate session and sample workflow. Personal data is stored on this computer.</p></div> : <>
      {today.demo && <div className="ai-banner">Local demo session · Data stays in the local database. Adult invitations require signed-in accounts.</div>}
      {children}
    </>}
  </section>;
}
export function Status({ error, message }) { return <>{error && <p className="ai-error" role="alert">{error}</p>}{message && <p className="ai-success" role="status">{message}</p>}</>; }
export function MemberSelect({ value, onChange, editableOnly = false, optional = false }) {
  const { today } = useAssistant();
  return <label>Family member<select value={value || ""} onChange={e => onChange(e.target.value)}>{optional && <option value="">Choose a member</option>}{(today?.members || []).filter(m => !editableOnly || m.editable).map(m => <option key={m.id} value={m.id}>{m.name}{m.child ? " · Child" : ""}</option>)}</select></label>;
}
export function Metrics({ value }) {
  if (!value) return null;
  return <><div className="ai-stats">{[["BMI", value.bmi, value.pediatric?.band || value.bmiCategory || "Screening measure"], ["Resting energy", value.restingKcal, "kcal/day · Estimated"], ["Daily energy need", value.estimatedNeedKcal, value.estimatedNeedKcal ? "kcal/day · Estimated" : "Awaiting specialist review"]].map(([title, number, note]) => <div className="ai-stat" key={title}><span>{title}</span><strong>{number ?? "—"}</strong><span>{note}</span></div>)}</div><p className="ai-muted">{value.bmiNote}</p>{value.pediatric && <p className="ai-muted">Reference: <a href={value.pediatric.source} target="_blank" rel="noreferrer">{value.pediatric.referenceVersion}</a></p>}{value.missing?.length > 0 && <p className="ai-muted">To estimate resting energy, add: {value.missing.join(", ")}</p>}<p className="ai-muted">Intake target: {value.targetKcal ? `${value.targetKcal} kcal/day` : "Not prescribed · policy review pending"}</p></>;
}
export function PlanCard({ plan, members = [], onConfirm, onLock, onSwap, busy = false }) {
  if (!plan) return null;
  return <div className="ai-card"><div className="ai-row"><h2>{plan.date}</h2>{plan.status === "pending" && <span className="ai-pill">Preview · Not saved</span>}</div>{plan.note && <p className="ai-muted">{plan.note}</p>}
    {plan.entries.map(entry => <div key={entry.slot}><div className="ai-row"><h3>{entry.slot[0].toUpperCase() + entry.slot.slice(1)}</h3>{entry.locked && <span className="ai-pill">Locked</span>}</div>{entry.dishes.map((dish, i) => <div className="ai-meal" key={dish.mealId + i}>{dish.image && <img src={dish.image} alt="" loading="lazy" />}<div><Link to={`/recipes/${dish.mealId}`}>{dish.name}</Link><small>{Object.entries(dish.portions).map(([id, servings]) => `${members.find(m => m.id === id)?.name || "Member"}: ${servings} recipe serving${servings === 1 ? "" : "s"}`).join(" · ")}</small><small>{dish.verified ? "Reviewed nutrition available" : "Nutrition / original servings may need review"}</small></div></div>)}
      <p className="ai-muted">{entry.nutrition?.complete ? `${entry.nutrition.values.kcal} kcal · whole meal, all participants` : "Nutrition total unavailable: recipe data needs review."}</p>
      {entry.nutrition?.complete && <p className="ai-muted">{Object.entries(entry.nutritionByMember || {}).map(([id, value]) => `${members.find(m => m.id === id)?.name || "Member"}: ${value.values?.kcal ?? "—"} kcal`).join(" · ")}</p>}
      {onLock && <div className="ai-actions"><button disabled={busy} onClick={() => onLock(entry.slot, !entry.locked)}>{entry.locked ? "Unlock meal" : "Keep this meal"}</button>{onSwap && <button disabled={busy || entry.locked} onClick={() => onSwap(entry.slot)}>Preview another meal</button>}</div>}
    </div>)}{onConfirm && <div className="ai-actions"><button className="primary" disabled={busy} onClick={() => onConfirm(plan.id)}>{busy ? "Saving…" : "Confirm & save to family planner"}</button></div>}
  </div>;
}
export function WeightChart({ measurements }) {
  const rows = [...measurements].sort((a, b) => a.date.localeCompare(b.date));
  if (rows.length < 2) return <p className="ai-muted">Add a second measurement to see your weight trend.</p>;
  const values = rows.map(r => r.weightKg), min = Math.min(...values) - 1, range = Math.max(...values) - min + 1;
  const dates = rows.map(r => Date.parse(r.date)), span = Math.max(1, dates.at(-1) - dates[0]);
  const points = rows.map((r, i) => [30 + (dates[i] - dates[0]) / span * 540, 115 - (r.weightKg - min) / range * 90]);
  return <svg viewBox="0 0 600 150" className="ai-chart" role="img" aria-label="Weight in kilograms by measurement date"><line x1="30" y1="120" x2="570" y2="120" stroke="#e4e4e7" /><polyline fill="none" stroke="#18181b" strokeWidth="3" points={points.map(p => p.join(",")).join(" ")} />{points.map(([x, y], i) => <circle key={rows[i].id} cx={x} cy={y} r="4" fill="#18181b"><title>{rows[i].date}: {rows[i].weightKg.toFixed(1)} kg</title></circle>)}<text x="30" y="143" fontSize="11" fill="#a1a1aa">{rows[0].date}</text><text x="490" y="143" fontSize="11" fill="#a1a1aa">{rows.at(-1).date}</text></svg>;
}
