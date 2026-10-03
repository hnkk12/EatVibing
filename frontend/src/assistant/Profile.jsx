import { useEffect, useState } from "react";
import { useAssistant } from "./AssistantContext";
import { Shell, Status, MemberSelect, Metrics, WeightChart } from "./shared";
const listFields = { allergies: "Known allergies", avoid: "Ingredients to avoid", likes: "Favorite dishes", dislikes: "Disliked dishes", cuisines: "Cuisines (e.g. Vietnam, Italy)", equipment: "Kitchen equipment" };
function ProfileForm({ profile, onSaved }) {
  const { api, refresh } = useAssistant();
  const [form, setForm] = useState(profile), [busy, setBusy] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("");
  const change = (key, value) => setForm(f => ({ ...f, [key]: value }));
  return <form className="ai-card" onSubmit={async e => {
    e.preventDefault(); setBusy(true); setError(""); setMessage("");
    try { const next = await api("/profile", { ...form, memberId: profile.id }, "PUT"); onSaved(next); await refresh(); setMessage("Profile saved. Existing plans stay unchanged until you confirm a new proposal."); } catch (e) { setError(e.message); } finally { setBusy(false); }
  }}><h2>{profile.child ? "Child's profile" : "Your personal settings"}</h2><div className="ai-fields">
    <label>Display name<input required value={form.name} maxLength={120} onChange={e => change("name", e.target.value)} /></label>
    <label>Date of birth<input required type="date" value={form.birthDate} onChange={e => change("birthDate", e.target.value)} /></label>
    <label>Sex used by prediction formula<select value={form.formulaSex} onChange={e => change("formulaSex", e.target.value)}><option value="unspecified">Prefer not to specify</option><option value="male">Male</option><option value="female">Female</option></select></label>
    <label>Goal<select value={form.goal} onChange={e => change("goal", e.target.value)}><option value="balanced">Balanced eating</option><option value="maintain">Maintain weight</option>{!profile.child && <><option value="gain">Gain weight · specialist review needed</option><option value="loss">Lose weight · specialist review needed</option></>}</select></label>
    <label>Timezone<input required value={form.timezone} onChange={e => change("timezone", e.target.value)} /></label>
    <label>Measurement units<select value={form.units} onChange={e => change("units", e.target.value)}><option value="metric">Metric · cm / kg</option><option value="imperial">Imperial · inches / lb</option></select></label>
    <label>Typical daily activity<select value={form.activity} onChange={e => change("activity", e.target.value)}>{["sedentary", "light", "moderate", "active"].map(x => <option key={x} value={x}>{x}</option>)}</select></label>
    <label>Dietary preference<select value={form.diet} onChange={e => change("diet", e.target.value)}><option value="any">Any diet</option><option value="vegetarian">Vegetarian</option><option value="vegan">Vegan</option></select></label>
    <label>Cooking time (minutes)<input type="number" min="5" max="240" value={form.cookingMinutes} onChange={e => change("cookingMinutes", Number(e.target.value))} /></label>
    <label>Usual recipe portion (optional)<input type="number" min="0.1" max="10" step="0.1" placeholder="Confirm when planning" value={form.portion ?? ""} onChange={e => change("portion", e.target.value ? Number(e.target.value) : null)} /></label>
    {!profile.child && <label>Goal weight (kg, optional)<input type="number" min="5" max="500" step="0.1" value={form.targetWeightKg ?? ""} onChange={e => change("targetWeightKg", e.target.value ? Number(e.target.value) : null)} /></label>}
    <label>Budget / meal<input value={form.budget} placeholder="Optional, e.g. 100,000 VND" onChange={e => change("budget", e.target.value)} /></label>
    <label>Meals per day<input type="number" min="1" max="6" value={form.mealsPerDay} onChange={e => change("mealsPerDay", Number(e.target.value))} /></label>
    <label>Eating out pattern<input value={form.eatingOut} placeholder="Lunch at work on weekdays" onChange={e => change("eatingOut", e.target.value)} /></label>
    <label>Usual activity<input value={form.usualActivity} placeholder="Walking or gym" onChange={e => change("usualActivity", e.target.value)} /></label>
    <label>Usual activity duration (minutes)<input type="number" min="0" max="600" value={form.usualActivityMinutes} onChange={e => change("usualActivityMinutes", Number(e.target.value))} /></label>
    {Object.entries(form.mealTimes).map(([slot, time]) => <label key={slot}>{slot} time<input type="time" value={time} onChange={e => change("mealTimes", { ...form.mealTimes, [slot]: e.target.value })} /></label>)}
    {Object.entries(listFields).map(([key, label]) => <label className="wide" key={key}>{label}<input value={form[key].join(", ")} onChange={e => change(key, e.target.value.split(",").map(s => s.trimStart()))} placeholder="Separate with commas" /></label>)}
  </div><label className="ai-check"><input type="checkbox" checked={form.specialCare} onChange={e => change("specialCare", e.target.checked)} />Pregnancy, breastfeeding or medical nutrition needs · use general meal support</label>
  <details open><summary>Family sharing</summary><p className="ai-muted">Adults control their own data. Sharing meal preferences permits family planning; body measurements stay private by default.</p>{[["portions", "Share dietary preferences and portions"], ["goals", "Share my goal"], ["body", "Share BMI and measurement history"]].map(([key, label]) => <label className="ai-check" key={key}><input type="checkbox" checked={form.sharing[key]} onChange={e => change("sharing", { ...form.sharing, [key]: e.target.checked })} />{label}</label>)}</details>
  <label className="ai-check"><input type="checkbox" checked={form.aiConsent || false} onChange={e => change("aiConsent", e.target.checked)} />Allow the configured online AI service to use permitted meal preferences, daily context and conversation</label><p className="ai-muted">Optional. BMI, measurements and planning still work with this off. Raw body measurements and birth dates are excluded from provider context.</p>
  <Status error={error} message={message} /><div className="ai-actions"><button className="primary" disabled={busy}>Save profile</button></div></form>;
}
function MeasurementForm({ profile, reload }) {
  const { today, api, refresh } = useAssistant();
  const [date, setDate] = useState(today.date), [height, setHeight] = useState(""), [weight, setWeight] = useState(""), [waist, setWaist] = useState(""), [editing, setEditing] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const imperial = profile.units === "imperial";
  return <div className="ai-card"><h2>Measurements & history</h2><form onSubmit={async e => {
    e.preventDefault(); setBusy(true); setError(""); try { await api("/measurements", { memberId: profile.id, id: editing, date, height, weight, waist, units: profile.units }); setEditing(null); setHeight(""); setWeight(""); setWaist(""); await reload(); await refresh(); } catch (e) { setError(e.message); } finally { setBusy(false); }
  }}><div className="ai-fields"><label>Date measured<input type="date" required max={today.date} value={date} onChange={e => setDate(e.target.value)} /></label><label>Height ({imperial ? "inches" : "cm"})<input type="number" required step="0.01" value={height} onChange={e => setHeight(e.target.value)} /></label><label>Weight ({imperial ? "lb" : "kg"})<input type="number" required step="0.01" value={weight} onChange={e => setWeight(e.target.value)} /></label><label>Waist ({imperial ? "inches" : "cm"}, optional)<input type="number" step="0.01" value={waist} onChange={e => setWaist(e.target.value)} /></label></div><Status error={error} /><div className="ai-actions"><button className="primary" disabled={busy}>{editing ? "Save correction" : "Add measurement"}</button>{editing && <button type="button" onClick={() => setEditing(null)}>Cancel correction</button>}</div></form>
    <WeightChart measurements={profile.measurements || []} /><div className="ai-scroll"><table><thead><tr><th>Date</th><th>Height (cm)</th><th>Weight (kg)</th><th></th></tr></thead><tbody>{[...(profile.measurements || [])].sort((a, b) => b.date.localeCompare(a.date)).map(m => <tr key={m.id}><td>{m.date}</td><td>{m.heightCm.toFixed(1)}</td><td>{m.weightKg.toFixed(1)}</td><td><button className="ai-link" onClick={() => { setEditing(m.id); setDate(m.date); setHeight((m.heightCm / (imperial ? 2.54 : 1)).toFixed(2)); setWeight((m.weightKg / (imperial ? 0.45359237 : 1)).toFixed(2)); setWaist(m.waistCm ? (m.waistCm / (imperial ? 2.54 : 1)).toFixed(2) : ""); }}>Correct</button></td></tr>)}</tbody></table></div>
  </div>;
}
function Content() {
  const { today, api } = useAssistant();
  const [memberId, setMemberId] = useState(today.profile.id), [profile, setProfile] = useState(null), [error, setError] = useState("");
  useEffect(() => { let active = true; api("/profile?memberId=" + encodeURIComponent(memberId)).then(p => { if (active) { setProfile(p); setError(""); } }).catch(e => { if (active) setError(e.message); }); return () => { active = false; }; }, [memberId, api]);
  const reload = async () => setProfile(await api("/profile?memberId=" + encodeURIComponent(memberId)));
  return <><div className="ai-card"><MemberSelect value={memberId} onChange={id => { setMemberId(id); setProfile(null); }} /><Status error={error} /></div>{profile && <><div className="ai-card"><h2>{profile.name}'s indicators</h2>{profile.metrics ? <Metrics value={profile.metrics} /> : <p>Body indicators are private. This member can choose to share them.</p>}</div>{profile.editable ? <div className="ai-grid"><ProfileForm key={profile.id} profile={profile} onSaved={setProfile} /><MeasurementForm key={profile.id + profile.units} profile={profile} reload={reload} /></div> : <div className="ai-card"><p>This member manages their own profile.</p>{profile.measurements && <WeightChart measurements={profile.measurements} />}</div>}</>}</>;
}
export default function Profile() { return <Shell title="Your profile" description="A personal foundation for meals that fit your life."><Content /></Shell>; }
