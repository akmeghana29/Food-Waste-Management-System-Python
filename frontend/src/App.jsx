import { useState, useEffect } from "react";
import { createPrediction, getPredictionHistory, getDashboardStats } from "./api";
const bgimg = "/images/bgimg3.avif";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  primary:    "#7C9473",
  light:      "#CFDAC8",
  pale:       "#E8EAE6",
  muted:      "#CDD0CB",
  glass:      "rgba(207,218,200,0.13)",
  glassBorder:"rgba(207,218,200,0.28)",
  glassHover: "rgba(207,218,200,0.22)",
  text:       "#E8EAE6",
  textMuted:  "rgba(232,234,230,0.65)",
  textDark:   "rgba(232,234,230,0.38)",
};

const PIE_COLORS = ["#7C9473","#CFDAC8","#E8EAE6","#CDD0CB"];

function GlassCard({ title, children, accent, style = {}, animDelay = 0 }) {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), animDelay);
    return () => clearTimeout(t);
  }, [animDelay]);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? C.glassHover : C.glass,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${C.glassBorder}`,
        borderTop: `2.5px solid ${accent || C.primary}`,
        borderRadius: 18,
        padding: "24px 28px",
        transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)",
        transform: visible
          ? hovered ? "translateY(-5px) scale(1.012)" : "translateY(0) scale(1)"
          : "translateY(28px)",
        opacity: visible ? 1 : 0,
        boxShadow: hovered ? "0 24px 56px rgba(0,0,0,0.4)" : "0 8px 32px rgba(0,0,0,0.25)",
        ...style,
      }}
    >
      {title && (
        <p style={{
          margin: "0 0 16px", fontWeight: 700, fontSize: 10,
          letterSpacing: 2.5, textTransform: "uppercase", color: C.light,
        }}>
          {title}
        </p>
      )}
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: 1.2, textTransform: "uppercase" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputBase = {
  padding: "9px 12px",
  borderRadius: 9,
  border: `1.5px solid ${C.glassBorder}`,
  fontSize: 13,
  color: C.text,
  background: "rgba(20,28,18,0.35)",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  transition: "all 0.25s ease",
  fontFamily: "'DM Sans', sans-serif",
};

function FocusInput({ type = "text", ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      {...props}
      style={{
        ...inputBase,
        borderColor: focused ? C.primary : C.glassBorder,
        background: focused ? "rgba(124,148,115,0.18)" : "rgba(20,28,18,0.35)",
        boxShadow: focused ? `0 0 0 3px rgba(124,148,115,0.15)` : "none",
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function FocusSelect({ children, value, onChange }) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      value={value}
      onChange={onChange}
      style={{
        ...inputBase,
        borderColor: focused ? C.primary : C.glassBorder,
        background: focused ? "rgba(124,148,115,0.18)" : "rgba(20,28,18,0.35)",
        boxShadow: focused ? `0 0 0 3px rgba(124,148,115,0.15)` : "none",
        cursor: "pointer",
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {children}
    </select>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(18,26,16,0.92)", backdropFilter: "blur(10px)",
      border: `1px solid ${C.glassBorder}`, borderRadius: 10,
      padding: "10px 14px", fontSize: 12, color: C.text,
    }}>
      <p style={{ fontWeight: 700, marginBottom: 4, color: C.light }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || C.muted }}>{p.name}: <strong>{p.value} kg</strong></p>
      ))}
    </div>
  );
}

function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

function getMealName(inputData = {}) {
  const meal = ["Breakfast", "Brunch", "Lunch", "Dinner", "Snacks"].find(
    (name) => inputData[`meal_${name}`] === 1
  );
  return meal || "Unknown";
}

function formatShortDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export default function App() {
  const today = new Date();
  const [headerVisible, setHeaderVisible] = useState(false);
  const [btnHovered, setBtnHovered]       = useState(false);
  const [prediction, setPrediction]       = useState(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");
  const [dashboardStats, setDashboardStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState("");

  const [form, setForm] = useState({
    week_number:                    getWeekNumber(today),
    month:                          today.getMonth() + 1,
    day_of_week_encoded:            today.getDay() === 0 ? 6 : today.getDay() - 1,
    is_weekend:                     [5,6].includes(today.getDay() === 0 ? 6 : today.getDay() - 1) ? 1 : 0,
    is_holiday:                     0,
    is_vacation_period:             0,
    is_event_day:                   0,
    hostel_capacity:                "",
    students_present:               "",
    prev_day_same_meal_consumed_kg: "",
    last_7_days_avg_consumed_kg:    "",
    last_7_days_avg_wasted_kg:      "",
    meal_type:                      "Lunch",
    menu_category_encoded:          0,
    event_type:                     "None",
  });

  useEffect(() => {
    const t = setTimeout(() => setHeaderVisible(true), 80);
    loadDashboardData();
    return () => clearTimeout(t);
  }, []);

  async function loadDashboardData() {
    setDataLoading(true);
    setDataError("");

    try {
      const [statsResponse, historyResponse] = await Promise.all([
        getDashboardStats(),
        getPredictionHistory(50),
      ]);

      setDashboardStats(statsResponse);
      setHistory(historyResponse.history || []);
    } catch (err) {
      setDataError(err.message || "Unable to load dashboard data.");
    } finally {
      setDataLoading(false);
    }
  }

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setPrediction(null);

    const mealCols = {
      meal_Breakfast: 0,
      meal_Brunch: 0,
      meal_Dinner: 0,
      meal_Lunch: 0,
      meal_Snacks: 0,
    };
    mealCols[`meal_${form.meal_type}`] = 1;

    const eventCols = {
      event_College_Event: 0,
      event_Festival: 0,
    };

    if (form.event_type === "College_Event") {
      eventCols.event_College_Event = 1;
    }

    if (form.event_type === "Festival") {
      eventCols.event_Festival = 1;
    }

    const payload = {
      week_number: parseInt(form.week_number, 10),
      month: parseInt(form.month, 10),
      is_weekend: parseInt(form.is_weekend, 10),
      is_holiday: parseInt(form.is_holiday, 10),
      is_vacation_period: parseInt(form.is_vacation_period, 10),
      is_event_day: parseInt(form.is_event_day, 10),
      hostel_capacity: parseInt(form.hostel_capacity, 10),
      students_present: parseInt(form.students_present, 10),
      prev_day_same_meal_consumed_kg: parseFloat(form.prev_day_same_meal_consumed_kg),
      last_7_days_avg_consumed_kg: parseFloat(form.last_7_days_avg_consumed_kg),
      last_7_days_avg_wasted_kg: parseFloat(form.last_7_days_avg_wasted_kg),
      menu_category_encoded: parseInt(form.menu_category_encoded, 10),
      day_of_week_encoded: parseInt(form.day_of_week_encoded, 10),
      ...mealCols,
      ...eventCols,
    };

    for (const [key, value] of Object.entries(payload)) {
      if (Number.isNaN(value)) {
        setError(`Please fill all fields. (${key} is empty)`);
        return;
      }
    }

    if (payload.hostel_capacity <= 0) {
      setError("Hostel capacity must be greater than zero.");
      return;
    }

    if (payload.students_present > payload.hostel_capacity) {
      setError("Students present cannot exceed hostel capacity.");
      return;
    }

    setLoading(true);

    try {
      const response = await createPrediction(payload);
      setPrediction(response.predicted_food_waste);
      await loadDashboardData();
    } catch (error) {
      setError(error.message || "Unable to generate prediction. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const days   = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const optStyle = { background:"#1a2a18", color: C.text };

  const chronologicalHistory = [...history].reverse();

  const mealGroups = ["Breakfast", "Brunch", "Lunch", "Dinner", "Snacks"]
    .map((meal) => {
      const records = history.filter(
        (record) => getMealName(record.input_data) === meal
      );
      const average = records.length
        ? records.reduce((sum, record) => sum + record.predicted_food_waste, 0) / records.length
        : 0;

      return {
        meal,
        predicted: Number(average.toFixed(2)),
        count: records.length,
      };
    })
    .filter((item) => item.count > 0);

  const lineData = chronologicalHistory.slice(-7).map((record) => ({
    day: formatShortDate(record.created_at),
    consumed: Number(record.input_data?.last_7_days_avg_consumed_kg ?? 0),
  }));

  const pieData = ["Breakfast", "Brunch", "Lunch", "Dinner", "Snacks"]
    .map((meal) => ({
      name: meal,
      value: history.filter(
        (record) => getMealName(record.input_data) === meal
      ).length,
    }))
    .filter((item) => item.value > 0);

  return (
    <div style={{ minHeight:"100vh", fontFamily:"'DM Sans', sans-serif", position:"relative", overflowX:"hidden" }}>

      {/* Background */}
      <div style={{
        position:"fixed", inset:0, zIndex:0,
        backgroundImage:`url(${bgimg})`,
        backgroundSize:"cover", backgroundPosition:"center 10%", backgroundAttachment:"fixed",
        filter:"brightness(0.38) saturate(0.75)",
      }} />
      <div style={{
        position:"fixed", inset:0, zIndex:1,
        background:"linear-gradient(155deg,rgba(14,22,12,0.75) 0%,rgba(26,36,22,0.6) 100%)",
      }} />

      <div style={{ position:"relative", zIndex:2 }}>

        {/* Header */}
        <header style={{
          background:"rgba(15,22,13,0.6)", backdropFilter:"blur(22px)", WebkitBackdropFilter:"blur(22px)",
          borderBottom:`1px solid ${C.glassBorder}`,
          padding:"0 40px", height:64,
          display:"flex", alignItems:"center", justifyContent:"space-between",
          position:"sticky", top:0, zIndex:100,
          transform: headerVisible ? "translateY(0)" : "translateY(-100%)",
          opacity: headerVisible ? 1 : 0,
          transition:"all 0.65s cubic-bezier(0.4,0,0.2,1)",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{
              width:38, height:38, borderRadius:11,
              background:`linear-gradient(135deg,${C.primary},${C.light})`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:19, boxShadow:`0 4px 16px rgba(124,148,115,0.45)`,
            }}>🍽️</div>
            <div>
              <div style={{ fontWeight:800, fontSize:16, color:C.text, letterSpacing:0.3 }}>FMS</div>
              <div style={{ fontSize:10, color:C.textMuted, letterSpacing:0.5 }}>Food Waste Management System</div>
            </div>
          </div>
          <div style={{
            fontSize:11, color:C.textMuted,
            background:C.glass, border:`1px solid ${C.glassBorder}`,
            padding:"6px 16px", borderRadius:20, letterSpacing:0.3,
          }}>
            {today.toLocaleDateString("en-IN",{ weekday:"long", year:"numeric", month:"long", day:"numeric" })}
          </div>
        </header>

        <main style={{ maxWidth:1220, margin:"0 auto", padding:"36px 24px 48px" }}>

          {/* Title */}
          <div style={{ marginBottom:30, animation:"fadeUp 0.7s ease both" }}>
            <h1 style={{ margin:0, fontSize:28, fontWeight:900, color:C.text, letterSpacing:-0.5 }}>
              Meal Quantity Predictor
            </h1>
            <p style={{ margin:"6px 0 0", color:C.textMuted, fontSize:13 }}>
              Enter today's details to get an AI-powered food preparation estimate
            </p>
          </div>

          {/* Top row */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:22, marginBottom:22 }}>

            {/* Form */}
            <GlassCard title="Input Details" accent={C.primary} animDelay={150}>
              <form onSubmit={handleSubmit}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:13, marginBottom:13 }}>

                  <Field label="Week Number">
                    <FocusInput type="number" min={1} max={52} value={form.week_number}
                      onChange={e => set("week_number", e.target.value)} />
                  </Field>

                  <Field label="Month">
                    <FocusSelect value={form.month} onChange={e => set("month", e.target.value)}>
                      {months.map((m,i) => <option key={i} value={i+1} style={optStyle}>{m}</option>)}
                    </FocusSelect>
                  </Field>

                  <Field label="Day of Week">
                    <FocusSelect value={form.day_of_week_encoded}
                      onChange={e => { const d=parseInt(e.target.value); set("day_of_week_encoded",d); set("is_weekend",d>=5?1:0); }}>
                      {days.map((d,i) => <option key={i} value={i} style={optStyle}>{d}</option>)}
                    </FocusSelect>
                  </Field>

                  <Field label="Meal Type">
                    <FocusSelect value={form.meal_type} onChange={e => set("meal_type", e.target.value)}>
                      {["Breakfast","Brunch","Lunch","Dinner","Snacks"].map(m =>
                        <option key={m} style={optStyle}>{m}</option>)}
                    </FocusSelect>
                  </Field>

                  <Field label="Menu Category">
                    <FocusSelect value={form.menu_category_encoded} onChange={e => set("menu_category_encoded", e.target.value)}>
                      <option value={0} style={optStyle}>Regular</option>
                      <option value={1} style={optStyle}>Special</option>
                    </FocusSelect>
                  </Field>

                  <Field label="Event Type">
                    <FocusSelect value={form.event_type}
                      onChange={e => { set("event_type",e.target.value); set("is_event_day",e.target.value==="None"?0:1); }}>
                      <option value="None"          style={optStyle}>None</option>
                      <option value="College_Event" style={optStyle}>College Event</option>
                      <option value="Festival"      style={optStyle}>Festival</option>
                    </FocusSelect>
                  </Field>

                  <Field label="Hostel Capacity">
                    <FocusInput type="number" placeholder="e.g. 500"
                      value={form.hostel_capacity} onChange={e => set("hostel_capacity", e.target.value)} />
                  </Field>

                  <Field label="Students Present">
                    <FocusInput type="number" placeholder="e.g. 420"
                      value={form.students_present} onChange={e => set("students_present", e.target.value)} />
                  </Field>

                  <Field label="Prev Day Same Meal (kg)">
                    <FocusInput type="number" step="0.1" placeholder="e.g. 65.5"
                      value={form.prev_day_same_meal_consumed_kg}
                      onChange={e => set("prev_day_same_meal_consumed_kg", e.target.value)} />
                  </Field>

                  <Field label="7-Day Avg Consumed (kg)">
                    <FocusInput type="number" step="0.1" placeholder="e.g. 180.0"
                      value={form.last_7_days_avg_consumed_kg}
                      onChange={e => set("last_7_days_avg_consumed_kg", e.target.value)} />
                  </Field>

                  <Field label="7-Day Avg Wasted (kg)">
                    <FocusInput type="number" step="0.1" placeholder="e.g. 12.5"
                      value={form.last_7_days_avg_wasted_kg}
                      onChange={e => set("last_7_days_avg_wasted_kg", e.target.value)} />
                  </Field>
                </div>

                {/* Toggle pills */}
                <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
                  {[["is_holiday","Holiday"],["is_vacation_period","Vacation Period"],["is_weekend","Weekend"]].map(([key,label]) => (
                    <div key={key} onClick={() => set(key, form[key] ? 0 : 1)} style={{
                      display:"flex", alignItems:"center", gap:8, cursor:"pointer",
                      padding:"7px 16px", borderRadius:20,
                      background: form[key] ? `rgba(124,148,115,0.3)` : "rgba(20,28,18,0.3)",
                      border:`1.5px solid ${form[key] ? C.primary : C.glassBorder}`,
                      fontSize:12, fontWeight:600,
                      color: form[key] ? C.light : C.textMuted,
                      transition:"all 0.25s ease",
                      userSelect:"none",
                      boxShadow: form[key] ? `0 0 12px rgba(124,148,115,0.3)` : "none",
                    }}>
                      <span style={{
                        width:12, height:12, borderRadius:"50%",
                        background: form[key] ? C.primary : "transparent",
                        border:`2px solid ${form[key] ? C.primary : C.textMuted}`,
                        display:"inline-block",
                        transition:"all 0.25s ease",
                        boxShadow: form[key] ? `0 0 8px ${C.primary}` : "none",
                      }} />
                      {label}
                    </div>
                  ))}
                </div>

                {/* Submit */}
                <button
                  type="submit" disabled={loading}
                  onMouseEnter={() => setBtnHovered(true)}
                  onMouseLeave={() => setBtnHovered(false)}
                  style={{
                    width:"100%", padding:"13px 0",
                    background: loading ? "rgba(124,148,115,0.2)"
                      : btnHovered ? `linear-gradient(135deg,${C.light},${C.primary})`
                      : `linear-gradient(135deg,${C.primary},${C.light})`,
                    color: loading ? C.textMuted : "#162012",
                    border:`1.5px solid ${loading ? C.glassBorder : C.primary}`,
                    borderRadius:12, fontSize:13, fontWeight:800,
                    cursor: loading ? "not-allowed" : "pointer",
                    letterSpacing:1.2, transition:"all 0.3s ease",
                    transform: btnHovered && !loading ? "translateY(-3px)" : "translateY(0)",
                    boxShadow: btnHovered && !loading ? `0 10px 28px rgba(124,148,115,0.5)` : "none",
                    textTransform:"uppercase",
                  }}>
                  {loading ? "Predicting…" : " Predict Food Quantity"}
                </button>

                {error && (
                  <p style={{ marginTop:10, fontSize:11, color:C.muted, textAlign:"center", opacity:0.8 }}>
                    {error}
                  </p>
                )}
              </form>
            </GlassCard>

            {/* Right col */}
            <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

              <GlassCard title="Prediction Output" accent={C.light} animDelay={260}>
                <div style={{ textAlign:"center", padding:"14px 0" }}>
                  {prediction ? (
                    <div style={{ animation:"popIn 0.5s cubic-bezier(0.4,0,0.2,1) both" }}>
                      <div style={{
                        fontSize:62, fontWeight:900, lineHeight:1,
                        color:C.light, letterSpacing:-2,
                        textShadow:`0 0 40px rgba(207,218,200,0.55)`,
                      }}>{prediction}</div>
                      <div style={{ fontSize:13, color:C.textMuted, marginTop:6, fontWeight:600 }}>
                        kilograms to prepare
                      </div>
                      <div style={{
                        marginTop:16, padding:"9px 14px",
                        background:`rgba(124,148,115,0.2)`,
                        border:`1px solid ${C.primary}`,
                        borderRadius:10, fontSize:11,
                        color:C.light, fontWeight:700, letterSpacing:0.8,
                      }}>
                        ✓ Prediction Ready
                      </div>
                    </div>
                  ) : (
                    <div style={{ color:C.textDark, fontSize:12, padding:"28px 0", lineHeight:2 }}>
                      Fill the form and click<br/>
                      <span style={{ color:C.textMuted, fontWeight:700, fontSize:13 }}>Predict Food Quantity</span>
                    </div>
                  )}
                </div>
              </GlassCard>

              <GlassCard title="Live Dashboard Stats" accent={C.muted} animDelay={360}>
                {dataLoading ? (
                  <p style={{ color:C.textMuted, fontSize:12 }}>Loading saved statistics...</p>
                ) : dataError ? (
                  <p style={{ color:C.muted, fontSize:12 }}>{dataError}</p>
                ) : (
                  [
                    { label:"Total Predictions", value: dashboardStats?.total_predictions ?? 0 },
                    { label:"Average Predicted Quantity", value:`${dashboardStats?.average_waste ?? 0} kg` },
                    { label:"Highest Predicted Quantity", value:`${dashboardStats?.highest_waste ?? 0} kg` },
                    { label:"Latest Prediction", value: dashboardStats?.latest_prediction ? `${dashboardStats.latest_prediction.predicted_food_waste} kg` : "—" },
                  ].map((item, i, arr) => (
                    <div key={item.label} style={{
                      display:"flex", justifyContent:"space-between", alignItems:"center",
                      gap:10, padding:"9px 0",
                      borderBottom:i < arr.length - 1 ? `1px solid rgba(207,218,200,0.12)` : "none",
                    }}>
                      <span style={{ fontSize:11, color:C.textMuted }}>{item.label}</span>
                      <span style={{
                        fontSize:11, fontWeight:800, color:C.light,
                        background:"rgba(124,148,115,0.25)", padding:"3px 9px",
                        borderRadius:20, border:"1px solid rgba(124,148,115,0.4)",
                        textAlign:"right",
                      }}>{item.value}</span>
                    </div>
                  ))
                )}
                <button
                  type="button"
                  onClick={loadDashboardData}
                  disabled={dataLoading}
                  style={{
                    marginTop:12, padding:"7px 12px", borderRadius:8,
                    border:`1px solid ${C.glassBorder}`,
                    background:"rgba(124,148,115,0.18)", color:C.light,
                    fontSize:11, fontWeight:700,
                  }}
                >
                  Refresh dashboard data
                </button>
              </GlassCard>
            </div>
          </div>

          {/* Charts */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:22 }}>

            <GlassCard title="Average Predicted Quantity by Meal" accent={C.primary} animDelay={420}>
              {mealGroups.length ? (
                <ResponsiveContainer width="100%" height={195}>
                  <BarChart data={mealGroups} barSize={18}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(207,218,200,0.08)" />
                    <XAxis dataKey="meal" tick={{ fontSize:9, fill:C.textMuted }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize:10, fill:C.textMuted }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="predicted" fill={C.primary} radius={[4,4,0,0]} name="Average predicted" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ color:C.textMuted, fontSize:12, padding:"55px 0", textAlign:"center" }}>
                  {dataLoading ? "Loading prediction history..." : "No saved predictions yet."}
                </p>
              )}
            </GlassCard>

            <GlassCard title="Recent Consumption Estimates" accent={C.light} animDelay={520}>
              {lineData.length ? (
                <ResponsiveContainer width="100%" height={195}>
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(207,218,200,0.08)" />
                    <XAxis dataKey="day" tick={{ fontSize:9, fill:C.textMuted }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize:10, fill:C.textMuted }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="consumed" stroke={C.light}
                      strokeWidth={2.5} dot={{ r:4, fill:C.light, strokeWidth:0 }}
                      activeDot={{ r:6, fill:C.pale }} name="7-day avg consumed" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ color:C.textMuted, fontSize:12, padding:"55px 0", textAlign:"center" }}>
                  {dataLoading ? "Loading prediction history..." : "No saved predictions yet."}
                </p>
              )}
            </GlassCard>

            <GlassCard title="Prediction Distribution by Meal" accent={C.muted} animDelay={620}>
              {pieData.length ? (
                <ResponsiveContainer width="100%" height={195}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={46} outerRadius={74}
                      paddingAngle={4} dataKey="value" nameKey="name">
                      {pieData.map((_,i) => <Cell key={i} fill={["#7C9473","#CFDAC8","#E8EAE6","#CDD0CB","#AAB99F"][i]} opacity={0.9} />)}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} predictions`, "Count"]} contentStyle={{
                      background:"rgba(18,26,16,0.92)", border:`1px solid ${C.glassBorder}`,
                      borderRadius:10, fontSize:12, color:C.text,
                    }} />
                    <Legend wrapperStyle={{ fontSize:10, color:C.textMuted }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ color:C.textMuted, fontSize:12, padding:"55px 0", textAlign:"center" }}>
                  {dataLoading ? "Loading prediction history..." : "No saved predictions yet."}
                </p>
              )}
            </GlassCard>
          </div>

          <GlassCard title="Recent Prediction History" accent={C.primary} animDelay={700} style={{ marginTop:22 }}>
            {dataLoading ? (
              <p style={{ color:C.textMuted, fontSize:12 }}>Loading history...</p>
            ) : dataError ? (
              <p style={{ color:C.muted, fontSize:12 }}>{dataError}</p>
            ) : history.length === 0 ? (
              <p style={{ color:C.textMuted, fontSize:12 }}>No predictions have been saved yet.</p>
            ) : (
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", minWidth:560, fontSize:12, color:C.text }}>
                  <thead>
                    <tr style={{ color:C.light, textAlign:"left" }}>
                      {["Date", "Meal", "Students Present", "7-Day Avg Consumed", "Predicted Quantity"].map((heading) => (
                        <th key={heading} style={{ padding:"10px 12px", borderBottom:`1px solid ${C.glassBorder}`, whiteSpace:"nowrap" }}>{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice(0, 10).map((record) => (
                      <tr key={record.record_id}>
                        <td style={{ padding:"10px 12px", borderBottom:"1px solid rgba(207,218,200,0.1)" }}>{formatShortDate(record.created_at)}</td>
                        <td style={{ padding:"10px 12px", borderBottom:"1px solid rgba(207,218,200,0.1)" }}>{getMealName(record.input_data)}</td>
                        <td style={{ padding:"10px 12px", borderBottom:"1px solid rgba(207,218,200,0.1)" }}>{record.input_data?.students_present ?? "—"}</td>
                        <td style={{ padding:"10px 12px", borderBottom:"1px solid rgba(207,218,200,0.1)" }}>{record.input_data?.last_7_days_avg_consumed_kg ?? "—"} kg</td>
                        <td style={{ padding:"10px 12px", borderBottom:"1px solid rgba(207,218,200,0.1)", color:C.light, fontWeight:800 }}>{record.predicted_food_waste} kg</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </main>

        {/* Footer */}
        <footer style={{
          textAlign:"center", padding:"22px 20px",
          borderTop:`1px solid ${C.glassBorder}`,
          background:"rgba(14,20,12,0.5)", backdropFilter:"blur(14px)",
        }}>
          <p style={{ margin:0, fontSize:13, color:C.textMuted, fontWeight:500 }}>
            Made for <span style={{ color:C.light, fontWeight:700 }}>Mandela Girls Hostel · Sharda University, Greater Noida</span>
          </p>
          <p style={{ margin:"5px 0 0", fontSize:11, color:C.textDark }}>
            Developed by <span style={{ color:C.muted, fontWeight:700 }}>A Kirti Meghana</span>
          </p>
        </footer>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(22px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes popIn {
          0%  { opacity:0; transform:scale(0.82); }
          70% { transform:scale(1.05); }
          100%{ opacity:1; transform:scale(1); }
        }
        input::placeholder { color: rgba(207,218,200,0.3); }
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button { -webkit-appearance:none; margin:0; }
        * { scrollbar-width:thin; scrollbar-color:rgba(124,148,115,0.35) transparent; }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-thumb { background:rgba(124,148,115,0.35); border-radius:3px; }
      `}</style>
    </div>
  );
}
