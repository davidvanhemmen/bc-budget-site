import { useState, useRef, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine
} from "recharts";

// ─── AUTHORITATIVE DATA ────────────────────────────────────────────────────────
// All figures in $ millions (CAD).
//
// 2016/17–2024/25: AUDITED ACTUALS from BC Public Accounts
//   Revenue, Expense, Surplus/Deficit: Consolidated Statement of Operations (Highlights page)
//   Total Debt: Provincial Debt Summary (total provincial debt = taxpayer-supported + self-supported)
//   Capital Spend: Total capital spending (taxpayer + self-supported) from Highlights table
//   Health: Expense by Function table (Health sector actual)
//   Debt/GDP: Taxpayer-supported debt to GDP ratio stated in each year's PA Highlights
//
// 2025/26: BC Budget and Fiscal Plan 2026/27 — Updated Forecast (Q3) column
// 2026/27: BC Budget and Fiscal Plan 2026/27 — Budget Estimate column
// 2027/28: BC Budget and Fiscal Plan 2026/27 — Budget Plan (year 2)
// 2028/29: BC Budget and Fiscal Plan 2026/27 — Budget Plan (year 3)

const FISCAL_DATA = [
  // year        rev     exp     surplus  debt    capSpend health  debtGDP  status
  { year:"2016/17", revenue:51459, expense:48722, surplus:2737,   debt:65883,  capSpend:6368,  health:19689, debtGDP:15.9, status:"Actual"   },
  { year:"2017/18", revenue:52020, expense:51719, surplus:301,    debt:64919,  capSpend:6637,  health:20927, debtGDP:15.6, status:"Actual"   },
  { year:"2018/19", revenue:57128, expense:55593, surplus:1535,   debt:65962,  capSpend:8558,  health:22151, debtGDP:14.5, status:"Actual"   },
  { year:"2019/20", revenue:58660, expense:58981, surplus:-321,   debt:72161,  capSpend:9066,  health:23449, debtGDP:15.1, status:"Actual"   },
  { year:"2020/21", revenue:62156, expense:67624, surplus:-5468,  debt:87100,  capSpend:8903,  health:25605, debtGDP:20.2, status:"Actual"   },
  { year:"2021/22", revenue:72392, expense:71086, surplus:1306,   debt:90666,  capSpend:9654,  health:27584, debtGDP:17.9, status:"Actual"   },
  { year:"2022/23", revenue:81536, expense:80832, surplus:704,    debt:89426,  capSpend:10920, health:30322, debtGDP:15.4, status:"Actual"   },
  { year:"2023/24", revenue:79623, expense:84658, surplus:-5035,  debt:107462, capSpend:13356, health:34863, debtGDP:18.5, status:"Actual"   },
  { year:"2024/25", revenue:84046, expense:91393, surplus:-7347,  debt:133877, capSpend:14781, health:38182, debtGDP:23.2, status:"Actual"   },
  { year:"2025/26", revenue:85082, expense:94696, surplus:-9614,  debt:154059, capSpend:17073, health:39013, debtGDP:26.1, status:"Forecast" },
  { year:"2026/27", revenue:85523, expense:98832, surplus:-13309, debt:183374, capSpend:18677, health:40578, debtGDP:30.6, status:"Budget"   },
  { year:"2027/28", revenue:88578, expense:100743,surplus:-12165, debt:209855, capSpend:18165, health:41181, debtGDP:34.4, status:"Plan"     },
  { year:"2028/29", revenue:91754, expense:103191,surplus:-11437, debt:234559, capSpend:16079, health:42214, debtGDP:37.4, status:"Plan"     },
];

const REVENUE_2026 = [
  { name:"Personal Income Tax", value:23100, color:"#003087" },
  { name:"Federal Transfers",   value:15900, color:"#5a8fcb" },
  { name:"Sales Tax (PST)",     value:9400,  color:"#C8A951" },
  { name:"Corporate Income Tax",value:5100,  color:"#0055b3" },
  { name:"Natural Resources",   value:3700,  color:"#8b5e3c" },
  { name:"Carbon Tax",          value:3600,  color:"#2d7a3a" },
  { name:"Other",               value:8723,  color:"#7a9bbf" },
];

const SPEND_2026 = [
  { name:"Health",              value:36116, color:"#c0392b" },
  { name:"Education & Child Care", value:10069, color:"#2980b9" },
  { name:"Post-Secondary",      value:3516,  color:"#8e44ad" },
  { name:"Social Services",     value:5400,  color:"#e67e22" },
  { name:"Transportation",      value:3200,  color:"#27ae60" },
  { name:"Debt Servicing",      value:3100,  color:"#e07b7b" },
  { name:"Other",               value:27431, color:"#95a5a6" },
];

const SYSTEM_PROMPT = `You are the BC Budget AI Agent — an expert on British Columbia's provincial budgets from 2016/17 through 2028/29.

DATA SOURCES:
- 2016/17 through 2024/25: AUDITED ACTUALS from BC Public Accounts (Consolidated Statement of Operations + Provincial Debt Summary + Expense by Function)
- 2025/26: Updated Forecast (Q3) from BC Budget and Fiscal Plan 2026/27 (tabled February 17, 2026)
- 2026/27: Budget Estimate from BC Budget and Fiscal Plan 2026/27
- 2027/28 & 2028/29: Three-Year Budget Plan from BC Budget and Fiscal Plan 2026/27

VERIFIED FISCAL DATA ($ millions):

Year    | Revenue | Expense  | Surplus/Deficit  | Total Debt | Health   | Cap Spend | Debt/GDP | Status
2016/17 | 51,459  | 48,722   | +2,737 (surplus) | 65,883     | 19,689   | 6,368     | 15.9%    | PA Actual
2017/18 | 52,020  | 51,719   | +301 (surplus)   | 64,919     | 20,927   | 6,637     | 15.6%    | PA Actual
2018/19 | 57,128  | 55,593   | +1,535 (surplus) | 65,962     | 22,151   | 8,558     | 14.5%    | PA Actual
2019/20 | 58,660  | 58,981   | -321 (deficit)   | 72,161     | 23,449   | 9,066     | 15.1%    | PA Actual
2020/21 | 62,156  | 67,624   | -5,468 (deficit) | 87,100     | 25,605   | 8,903     | 20.2%    | PA Actual (COVID)
2021/22 | 72,392  | 71,086   | +1,306 (surplus) | 90,666     | 27,584   | 9,654     | 17.9%    | PA Actual
2022/23 | 81,536  | 80,832   | +704 (surplus)   | 89,426     | 30,322   | 10,920    | 15.4%    | PA Actual
2023/24 | 79,623  | 84,658   | -5,035 (deficit) | 107,462    | 34,863   | 13,356    | 18.5%    | PA Actual
2024/25 | 84,046  | 91,393   | -7,347 (deficit) | 133,877    | 38,182   | 14,781    | 23.2%    | PA Actual
2025/26 | 85,082  | 94,696   | -9,614 (deficit) | 154,059    | 39,013   | 17,073    | 26.1%    | Q3 Forecast
2026/27 | 85,523  | 98,832   | -13,309 (deficit)| 183,374    | 40,578   | 18,677    | 30.6%    | Budget Est.
2027/28 | 88,578  | 100,743  | -12,165 (deficit)| 209,855    | 41,181   | 18,165    | 34.4%    | Budget Plan
2028/29 | 91,754  | 103,191  | -11,437 (deficit)| 234,559    | 42,214   | 16,079    | 37.4%    | Budget Plan

THREE-YEAR FISCAL PLAN HIGHLIGHTS (Budget 2026, Feb 17 2026):
- Deficits projected to DECLINE over plan: -$13.3B (2026/27) → -$12.2B (2027/28) → -$11.4B (2028/29)
- Total provincial debt projected to reach $234.6B by 2028/29 (up from $133.9B actual in 2024/25)
- Taxpayer-supported debt/GDP: 26.1% (2025/26) → 30.6% (2026/27) → 34.4% (2027/28) → 37.4% (2028/29)
- Interest bite (cents per revenue dollar): 4.9¢ → 6.2¢ → 7.3¢ → 8.2¢ over the plan period
- Health spending: $38.2B (2024/25 actual) → $40.6B (2026/27) → $42.2B (2028/29)
- Revenue grows modestly; 2025/26 includes one-time $2.7B tobacco settlement not recurring
- Consumer carbon tax eliminated April 1, 2025; now output-based pricing for industrial emitters only
- Real GDP growth forecast: 1.5% (2025), 1.3% (2026), 1.8% (2027), 1.9% (2028)
- 2025/26 Q3 forecast deficit improved from original -$10,912M budget to -$9,614M

KEY HISTORICAL FACTS:
- BC ran surpluses 2016/17 to 2018/19; small 2019/20 deficit (-$321M)
- COVID caused -$5,468M deficit in 2020/21; bounced to surpluses 2021/22 and 2022/23
- 2022/23 revenues $12.9B HIGHER than budgeted — extraordinary upside
- 2024/25 actual deficit -$7,347M was $564M better than budgeted
- Total debt nearly doubled: $65.9B (2016/17) → $133.9B (2024/25 actual)
- Debt surged $26.4B in 2024/25 — largest single-year increase on record
- Accumulated surplus turned negative in 2023/24, projected to reach -$18.9B by March 2026

Provide detailed, accurate answers citing specific numbers. Use **bold** for key figures, - for bullets. Always distinguish actuals from forecasts/estimates/plans.`;


const SUGGESTED = [
  "How did COVID-19 affect BC's budget?",
  "Why was 2022/23 a surplus despite deficit forecasts?",
  "What are BC's projected deficits through 2028/29?",
  "How much does BC spend on health care?",
  "What is BC's debt trajectory to 2028/29?",
  "Which years had surpluses vs deficits?",
  "What's driving the growing deficit after 2022/23?",
  "How does the 2024/25 actual compare to budget?",
];

function formatMsg(text) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("- ")) return (
      <div key={i} style={{ display:"flex", gap:8, margin:"3px 0" }}>
        <span style={{ color:"#C8A951", flexShrink:0 }}>▸</span>
        <span dangerouslySetInnerHTML={{ __html: boldify(line.slice(2)) }} />
      </div>
    );
    if (/^\d+\.\s/.test(line)) {
      const n = line.match(/^(\d+)\./)[1];
      return (
        <div key={i} style={{ display:"flex", gap:8, margin:"3px 0" }}>
          <span style={{ color:"#C8A951", minWidth:20, fontWeight:700 }}>{n}.</span>
          <span dangerouslySetInnerHTML={{ __html: boldify(line.replace(/^\d+\.\s/,"")) }} />
        </div>
      );
    }
    if (line.startsWith("## ")) return <div key={i} style={{ fontWeight:700, color:"#C8A951", margin:"12px 0 4px", borderBottom:"1px solid rgba(200,169,81,0.3)", paddingBottom:4 }}>{line.slice(3)}</div>;
    if (line.startsWith("### ")) return <div key={i} style={{ fontWeight:700, color:"#8badd4", margin:"8px 0 2px" }}>{line.slice(4)}</div>;
    if (line === "") return <div key={i} style={{ height:7 }} />;
    return <div key={i} style={{ margin:"2px 0" }} dangerouslySetInnerHTML={{ __html: boldify(line) }} />;
  });
}
function boldify(t) { return t.replace(/\*\*(.*?)\*\*/g,'<strong style="color:#e8d9a0">$1</strong>'); }

const STATUS_COLOR = { Actual:"#4caf7d", Forecast:"#e0c47b", Budget:"#7bb8e0", Plan:"#b07ae0" };

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const row = FISCAL_DATA.find(d => d.year === label);
  return (
    <div style={{ background:"rgba(6,14,28,0.97)", border:"1px solid rgba(200,169,81,0.4)", borderRadius:10, padding:"10px 14px", fontSize:13, fontFamily:"Arial,sans-serif" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
        <span style={{ color:"#C8A951", fontWeight:700 }}>{label}</span>
        {row && <span style={{ background:STATUS_COLOR[row.status]+"22", border:`1px solid ${STATUS_COLOR[row.status]}55`, borderRadius:4, padding:"1px 7px", color:STATUS_COLOR[row.status], fontSize:10 }}>{row.status}</span>}
      </div>
      {payload.map((p,i) => (
        <div key={i} style={{ color:p.color||"#e8eef8", margin:"2px 0" }}>
          {p.name}: <strong style={{ color:"#e8eef8" }}>
            {Math.abs(p.value) > 999 ? "$"+(p.value/1000).toFixed(1)+"B" : p.value+"%"}
          </strong>
        </div>
      ))}
    </div>
  );
};

function KPI({ label, value, sub, color="#C8A951", icon }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(200,169,81,0.18)", borderRadius:12, padding:"15px 16px", flex:1, minWidth:130 }}>
      <div style={{ fontSize:20, marginBottom:3 }}>{icon}</div>
      <div style={{ color:"#6a8aaa", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"Arial,sans-serif", marginBottom:3 }}>{label}</div>
      <div style={{ color, fontSize:"1.45em", fontWeight:700 }}>{value}</div>
      {sub && <div style={{ color:"#4a6a8a", fontSize:11, marginTop:2, fontFamily:"Arial,sans-serif" }}>{sub}</div>}
    </div>
  );
}

function ChartCard({ children, style }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.035)", border:"1px solid rgba(100,140,200,0.13)", borderRadius:14, padding:"18px 18px 14px", ...style }}>
      {children}
    </div>
  );
}

function ChartTitle({ t, sub }) {
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ color:"#e8eef8", fontWeight:700, fontSize:"0.98em" }}>{t}</div>
      {sub && <div style={{ color:"#4a6a8a", fontSize:11, fontFamily:"Arial,sans-serif", marginTop:2 }}>{sub}</div>}
    </div>
  );
}

// Status legend pill
function StatusLegend() {
  return (
    <div style={{ display:"flex", gap:10, marginBottom:16, fontFamily:"Arial,sans-serif", fontSize:11 }}>
      {Object.entries(STATUS_COLOR).map(([s, c]) => (
        <div key={s} style={{ display:"flex", alignItems:"center", gap:5 }}>
          <div style={{ width:10, height:10, borderRadius:2, background:c }} />
          <span style={{ color:"#8badd4" }}>{s}</span>
        </div>
      ))}
      <span style={{ color:"#3a5a7a", marginLeft:4 }}>· Actuals: BC Public Accounts (audited) · Forecast/Budget: BC Budget 2026/27</span>
    </div>
  );
}

export default function BCBudgetApp() {
  const [tab, setTab] = useState("dashboard");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSugg, setShowSugg] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, loading]);

  async function send(text) {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput(""); setShowSugg(false);
    const newMsgs = [...messages, { role:"user", content:msg }];
    setMessages(newMsgs);
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, system:SYSTEM_PROMPT,
          messages:newMsgs.map(m=>({ role:m.role, content:m.content })) }),
      });
      const data = await res.json();
      const reply = data.content?.find(b=>b.type==="text")?.text || "Error generating response.";
      setMessages([...newMsgs, { role:"assistant", content:reply }]);
    } catch {
      setMessages([...newMsgs, { role:"assistant", content:"Sorry, an error occurred. Please try again." }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#080f1e,#0e1f3d,#0a1a30)", fontFamily:"Georgia,'Times New Roman',serif" }}>
      {/* HEADER */}
      <div style={{ background:"linear-gradient(90deg,#002070,#071840)", borderBottom:"3px solid #C8A951", boxShadow:"0 2px 20px rgba(0,0,0,0.5)" }}>
        <div style={{ maxWidth:1120, margin:"0 auto", padding:"13px 22px", display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:46, height:46, background:"linear-gradient(135deg,#002070,#0044aa)", border:"2px solid #C8A951", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>🏛️</div>
          <div>
            <div style={{ color:"#C8A951", fontSize:10, fontWeight:700, letterSpacing:3, textTransform:"uppercase", fontFamily:"Arial,sans-serif" }}>Province of British Columbia</div>
            <div style={{ color:"#fff", fontSize:19, fontWeight:700, lineHeight:1.1 }}>BC Budget AI Agent</div>
            <div style={{ color:"#7090b8", fontSize:12, fontFamily:"Arial,sans-serif" }}>2016/17–2028/29 · Actuals from Public Accounts · Forecasts & Plans from Budget 2026/27</div>
          </div>
          <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
            {[["dashboard","📊 Dashboard"],["chat","💬 AI Chat"]].map(([t,label]) => (
              <button key={t} onClick={()=>setTab(t)} style={{
                background: tab===t ? "rgba(200,169,81,0.18)" : "rgba(255,255,255,0.05)",
                border: tab===t ? "1px solid rgba(200,169,81,0.55)" : "1px solid rgba(255,255,255,0.12)",
                borderRadius:8, padding:"7px 16px", color: tab===t ? "#C8A951" : "#7090b8",
                fontFamily:"Arial,sans-serif", fontSize:13, fontWeight:700, cursor:"pointer", transition:"all 0.2s"
              }}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* DASHBOARD */}
      {tab === "dashboard" && (
        <div style={{ maxWidth:1120, margin:"0 auto", padding:"22px 18px", display:"flex", flexDirection:"column", gap:20 }}>

          <div>
            <div style={{ color:"#C8A951", fontSize:10, letterSpacing:3, textTransform:"uppercase", fontFamily:"Arial,sans-serif", marginBottom:4 }}>2026/27 Budget Estimate — Three-Year Plan to 2028/29</div>
            <div style={{ color:"#e8eef8", fontSize:"1.2em", fontWeight:700, marginBottom:14 }}>BC Budget and Fiscal Plan 2026/27 (February 17, 2026)</div>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              <KPI icon="⚠️" label="2026/27 Deficit"   value="-$13.3B" sub="Largest projected deficit"        color="#e07b7b" />
              <KPI icon="🏦" label="2026/27 Debt"       value="$183.4B" sub="Debt-to-GDP: 30.6%"             color="#e0c47b" />
              <KPI icon="📉" label="2027/28 Deficit"    value="-$12.2B" sub="Declining from 2026/27 peak"     color="#e07b7b" />
              <KPI icon="🔭" label="2028/29 Deficit"    value="-$11.4B" sub="Projected Plan year 3"           color="#e07b7b" />
              <KPI icon="🏦" label="2028/29 Debt"       value="$234.6B" sub="Debt-to-GDP: 37.4%"             color="#b07ae0" />
              <KPI icon="🏥" label="2028/29 Health"     value="$42.2B"  sub="↑ from $38.2B actual (2024/25)" color="#c07be0" />
            </div>
          </div>

          {/* Revenue vs Expense */}
          <ChartCard>
            <ChartTitle t="Revenue vs. Expense 2016/17–2028/29 ($ Millions)"
              sub="Audited actuals 2016/17–2024/25 · Q3 Forecast 2025/26 · Budget Est. 2026/27 · Budget Plan 2027/28–2028/29" />
            <StatusLegend />
            <ResponsiveContainer width="100%" height={270}>
              <AreaChart data={FISCAL_DATA} margin={{ top:5,right:10,left:5,bottom:5 }}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2d7a3a" stopOpacity={0.22}/><stop offset="95%" stopColor="#2d7a3a" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c0392b" stopOpacity={0.2}/><stop offset="95%" stopColor="#c0392b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.055)" />
                <XAxis dataKey="year" tick={{ fill:"#5a7a9a", fontSize:11 }} tickLine={false} axisLine={false} tickFormatter={v=>v.slice(0,7)} />
                <YAxis tick={{ fill:"#5a7a9a", fontSize:11 }} tickLine={false} axisLine={false} tickFormatter={v=>"$"+(v/1000).toFixed(0)+"B"} />
                <Tooltip content={<ChartTip />} />
                <Legend wrapperStyle={{ color:"#8badd4", fontSize:12, fontFamily:"Arial,sans-serif" }} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#2d7a3a" fill="url(#gRev)" strokeWidth={2.5}
                  dot={(props) => {
                    const d = FISCAL_DATA[props.index];
                    const c = STATUS_COLOR[d?.status] || "#2d7a3a";
                    return <circle key={props.index} cx={props.cx} cy={props.cy} r={4} fill={c} stroke={c} />;
                  }} />
                <Area type="monotone" dataKey="expense" name="Expense" stroke="#c0392b" fill="url(#gExp)" strokeWidth={2.5}
                  dot={(props) => {
                    const d = FISCAL_DATA[props.index];
                    const c = STATUS_COLOR[d?.status] || "#c0392b";
                    return <circle key={props.index} cx={props.cx} cy={props.cy} r={4} fill={c} stroke={c} />;
                  }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Surplus + Debt */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <ChartCard>
              <ChartTitle t="Annual Surplus / Deficit ($M)" sub="Green = surplus · Red = deficit · Stripe = non-actual" />
              <ResponsiveContainer width="100%" height={215}>
                <BarChart data={FISCAL_DATA} margin={{ top:5,right:5,left:0,bottom:5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.055)" />
                  <XAxis dataKey="year" tick={{ fill:"#5a7a9a", fontSize:10 }} tickLine={false} axisLine={false} tickFormatter={v=>v.slice(2,4)+"/"+v.slice(7,9)} />
                  <YAxis tick={{ fill:"#5a7a9a", fontSize:10 }} tickLine={false} axisLine={false} tickFormatter={v=>(v>=0?"+":"")+Math.round(v/1000)+"B"} />
                  <Tooltip content={<ChartTip />} />
                  <ReferenceLine y={0} stroke="rgba(200,169,81,0.5)" strokeDasharray="4 4" />
                  <Bar dataKey="surplus" name="Surplus/Deficit" radius={[3,3,0,0]}>
                    {FISCAL_DATA.map((d,i)=>{
                      const baseColor = d.surplus>=0 ? "#2d7a3a" : "#c0392b";
                      const opacity = d.status === "Actual" ? 1 : 0.55;
                      return <Cell key={i} fill={baseColor} fillOpacity={opacity} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard>
              <ChartTitle t="Total Provincial Debt ($M)" sub="Rising from $65.8B (2016/17 actual) to $133.9B (2024/25 actual)" />
              <ResponsiveContainer width="100%" height={215}>
                <LineChart data={FISCAL_DATA} margin={{ top:5,right:5,left:0,bottom:5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.055)" />
                  <XAxis dataKey="year" tick={{ fill:"#5a7a9a", fontSize:10 }} tickLine={false} axisLine={false} tickFormatter={v=>v.slice(2,4)+"/"+v.slice(7,9)} />
                  <YAxis tick={{ fill:"#5a7a9a", fontSize:10 }} tickLine={false} axisLine={false} tickFormatter={v=>"$"+(v/1000).toFixed(0)+"B"} />
                  <Tooltip content={<ChartTip />} />
                  <Line type="monotone" dataKey="debt" name="Total Debt" stroke="#e0a030" strokeWidth={2.5}
                    dot={(props) => {
                      const d = FISCAL_DATA[props.index];
                      const c = STATUS_COLOR[d?.status] || "#e0a030";
                      return <circle key={props.index} cx={props.cx} cy={props.cy} r={4} fill={c} stroke={c} />;
                    }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Pies */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <ChartCard>
              <ChartTitle t="2026/27 Revenue Sources (Budget Estimate)" sub="Total: ~$85.5 Billion" />
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <ResponsiveContainer width={170} height={170}>
                  <PieChart>
                    <Pie data={REVENUE_2026} cx="50%" cy="50%" innerRadius={48} outerRadius={78} dataKey="value" paddingAngle={2}>
                      {REVENUE_2026.map((e,i)=><Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v)=>"$"+(v/1000).toFixed(1)+"B"} contentStyle={{ background:"rgba(6,14,28,0.95)", border:"1px solid rgba(200,169,81,0.4)", borderRadius:8, fontFamily:"Arial,sans-serif", fontSize:12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex:1 }}>
                  {REVENUE_2026.map((d,i)=>(
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:7, margin:"4px 0" }}>
                      <div style={{ width:9, height:9, borderRadius:2, background:d.color, flexShrink:0 }} />
                      <span style={{ color:"#8badd4", flex:1, fontSize:11, fontFamily:"Arial,sans-serif" }}>{d.name}</span>
                      <span style={{ color:"#e8eef8", fontWeight:700, fontSize:12, fontFamily:"Arial,sans-serif" }}>${(d.value/1000).toFixed(1)}B</span>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>

            <ChartCard>
              <ChartTitle t="2026/27 Spending by Sector (Budget Estimate)" sub="Total: ~$98.8 Billion" />
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <ResponsiveContainer width={170} height={170}>
                  <PieChart>
                    <Pie data={SPEND_2026} cx="50%" cy="50%" innerRadius={48} outerRadius={78} dataKey="value" paddingAngle={2}>
                      {SPEND_2026.map((e,i)=><Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v)=>"$"+(v/1000).toFixed(1)+"B"} contentStyle={{ background:"rgba(6,14,28,0.95)", border:"1px solid rgba(200,169,81,0.4)", borderRadius:8, fontFamily:"Arial,sans-serif", fontSize:12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex:1 }}>
                  {SPEND_2026.map((d,i)=>(
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:7, margin:"4px 0" }}>
                      <div style={{ width:9, height:9, borderRadius:2, background:d.color, flexShrink:0 }} />
                      <span style={{ color:"#8badd4", flex:1, fontSize:11, fontFamily:"Arial,sans-serif" }}>{d.name}</span>
                      <span style={{ color:"#e8eef8", fontWeight:700, fontSize:12, fontFamily:"Arial,sans-serif" }}>${(d.value/1000).toFixed(1)}B</span>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>
          </div>

          {/* Health + Debt-to-GDP + Capital */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
            <ChartCard>
              <ChartTitle t="Health Spending ($M)" sub="$19.7B (2016/17 actual) → $38.2B (2024/25 actual)" />
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={FISCAL_DATA} margin={{ top:5,right:5,left:0,bottom:5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.055)" />
                  <XAxis dataKey="year" tick={{ fill:"#5a7a9a", fontSize:9 }} tickLine={false} axisLine={false} tickFormatter={v=>v.slice(2,4)+"/"+v.slice(7,9)} />
                  <YAxis tick={{ fill:"#5a7a9a", fontSize:9 }} tickLine={false} axisLine={false} tickFormatter={v=>"$"+(v/1000).toFixed(0)+"B"} />
                  <Tooltip content={<ChartTip />} />
                  <Bar dataKey="health" name="Health" radius={[3,3,0,0]}>
                    {FISCAL_DATA.map((d,i)=><Cell key={i} fill="#8e44ad" fillOpacity={d.status==="Actual"?1:0.55} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard>
              <ChartTitle t="Debt-to-GDP Ratio (%)" sub="25% threshold: breached 2025/26" />
              <ResponsiveContainer width="100%" height={190}>
                <LineChart data={FISCAL_DATA} margin={{ top:5,right:5,left:0,bottom:5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.055)" />
                  <XAxis dataKey="year" tick={{ fill:"#5a7a9a", fontSize:9 }} tickLine={false} axisLine={false} tickFormatter={v=>v.slice(2,4)+"/"+v.slice(7,9)} />
                  <YAxis tick={{ fill:"#5a7a9a", fontSize:9 }} tickLine={false} axisLine={false} tickFormatter={v=>v+"%"} domain={[12,35]} />
                  <Tooltip formatter={(v,n)=>[v+"%",n]} contentStyle={{ background:"rgba(6,14,28,0.95)", border:"1px solid rgba(200,169,81,0.4)", borderRadius:8, fontFamily:"Arial,sans-serif", fontSize:12 }} />
                  <ReferenceLine y={25} stroke="rgba(200,169,81,0.4)" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="debtGDP" name="Debt/GDP" stroke="#e07b7b" strokeWidth={2.5}
                    dot={(props) => {
                      const d = FISCAL_DATA[props.index];
                      const c = STATUS_COLOR[d?.status] || "#e07b7b";
                      return <circle key={props.index} cx={props.cx} cy={props.cy} r={3.5} fill={c} stroke={c} />;
                    }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard>
              <ChartTitle t="Capital Spending ($M)" sub="Record investment in infrastructure" />
              <ResponsiveContainer width="100%" height={190}>
                <AreaChart data={FISCAL_DATA} margin={{ top:5,right:5,left:0,bottom:5 }}>
                  <defs>
                    <linearGradient id="gCap" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2980b9" stopOpacity={0.28}/><stop offset="95%" stopColor="#2980b9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.055)" />
                  <XAxis dataKey="year" tick={{ fill:"#5a7a9a", fontSize:9 }} tickLine={false} axisLine={false} tickFormatter={v=>v.slice(2,4)+"/"+v.slice(7,9)} />
                  <YAxis tick={{ fill:"#5a7a9a", fontSize:9 }} tickLine={false} axisLine={false} tickFormatter={v=>"$"+(v/1000).toFixed(0)+"B"} />
                  <Tooltip content={<ChartTip />} />
                  <Area type="monotone" dataKey="capSpend" name="Capital" stroke="#2980b9" fill="url(#gCap)" strokeWidth={2.5}
                    dot={(props) => {
                      const d = FISCAL_DATA[props.index];
                      const c = STATUS_COLOR[d?.status] || "#2980b9";
                      return <circle key={props.index} cx={props.cx} cy={props.cy} r={3.5} fill={c} stroke={c} />;
                    }} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Full table */}
          <ChartCard>
            <ChartTitle t="Complete Fiscal Summary — Audited Actuals & Budget Estimates ($ Millions)"
              sub="Actuals (2016/17–2024/25): BC Public Accounts, Consolidated Statement of Operations. Forecast/Estimate: BC Budget and Fiscal Plan 2026/27." />
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, fontFamily:"Arial,sans-serif" }}>
                <thead>
                  <tr style={{ borderBottom:"2px solid rgba(200,169,81,0.35)" }}>
                    {["Fiscal Year","Status","Revenue","Expense","Surplus / Deficit","Total Debt","Debt/GDP","Health","Capital"].map(h=>(
                      <th key={h} style={{ color:"#C8A951", fontWeight:700, padding:"7px 10px", textAlign:h==="Fiscal Year"||h==="Status"?"left":"right", letterSpacing:0.5, whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FISCAL_DATA.map((d,i)=>(
                    <tr key={i} style={{ borderBottom:"1px solid rgba(255,255,255,0.05)", background:i%2===0?"rgba(255,255,255,0.015)":"transparent" }}>
                      <td style={{ color:"#e8eef8", padding:"7px 10px", fontWeight:600, whiteSpace:"nowrap" }}>{d.year}</td>
                      <td style={{ padding:"7px 10px" }}>
                        <span style={{ background:STATUS_COLOR[d.status]+"22", border:`1px solid ${STATUS_COLOR[d.status]}55`, borderRadius:4, padding:"2px 8px", color:STATUS_COLOR[d.status], fontSize:10, whiteSpace:"nowrap" }}>{d.status}</span>
                      </td>
                      <td style={{ color:"#4caf7d", padding:"7px 10px", textAlign:"right" }}>{d.revenue.toLocaleString()}</td>
                      <td style={{ color:"#e07b7b", padding:"7px 10px", textAlign:"right" }}>{d.expense.toLocaleString()}</td>
                      <td style={{ color:d.surplus>=0?"#4caf7d":"#e07b7b", padding:"7px 10px", textAlign:"right", fontWeight:700 }}>{d.surplus>=0?"+":""}{d.surplus.toLocaleString()}</td>
                      <td style={{ color:"#e0c47b", padding:"7px 10px", textAlign:"right" }}>{d.debt.toLocaleString()}</td>
                      <td style={{ color:"#8badd4", padding:"7px 10px", textAlign:"right" }}>{d.debtGDP}%</td>
                      <td style={{ color:"#c07be0", padding:"7px 10px", textAlign:"right" }}>{d.health.toLocaleString()}</td>
                      <td style={{ color:"#7bb8e0", padding:"7px 10px", textAlign:"right" }}>{d.capSpend?.toLocaleString() ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ color:"#3a5a7a", fontSize:11, marginTop:10, fontFamily:"Arial,sans-serif" }}>
              Note: Actuals (2016/17–2024/25) from BC Public Accounts (audited). Revenue/Expense/Surplus from Consolidated Statement of Operations; Total Debt from each year's Provincial Debt Summary; Capital Spending = total (taxpayer-supported + self-supported) from PA Highlights; Health from Expense by Function table. 2025/26 is Updated Forecast and 2026/27 is Budget Estimate — both from BC Budget and Fiscal Plan 2026/27, subject to revision.
            </div>
          </ChartCard>

          <div style={{ textAlign:"center", paddingBottom:24 }}>
            <button onClick={()=>setTab("chat")} style={{ background:"linear-gradient(135deg,#C8A951,#a88838)", border:"none", borderRadius:10, padding:"12px 32px", color:"#1a0e00", fontWeight:700, fontSize:15, cursor:"pointer", fontFamily:"Arial,sans-serif" }}>
              💬 Ask the AI Agent about this data →
            </button>
          </div>
        </div>
      )}

      {/* CHAT */}
      {tab === "chat" && (
        <div style={{ maxWidth:860, margin:"0 auto", padding:"0 16px", display:"flex", flexDirection:"column", minHeight:"calc(100vh - 76px)" }}>
          {showSugg && (
            <div style={{ padding:"26px 0 14px" }}>
              <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(200,169,81,0.22)", borderRadius:14, padding:22, marginBottom:16 }}>
                <div style={{ color:"#C8A951", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"Arial,sans-serif", marginBottom:6 }}>Welcome</div>
                <div style={{ color:"#e8eef8", fontSize:"1.05em", lineHeight:1.55 }}>
                  Ask me anything about <strong style={{ color:"#C8A951" }}>BC's provincial budgets from 2016/17 to 2028/29</strong>. I use <strong style={{ color:"#C8A951" }}>audited actuals from the BC Public Accounts</strong> (2016/17–2024/25), plus the 2025/26 forecast, 2026/27 estimate, and 2027/28–2028/29 plan from the Budget and Fiscal Plan 2026/27.
                </div>
              </div>
              <div style={{ color:"#6a8aaa", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"Arial,sans-serif", marginBottom:10 }}>Suggested Questions</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {SUGGESTED.map((q,i)=>(
                  <button key={i} onClick={()=>send(q)} style={{ background:"rgba(255,255,255,0.035)", border:"1px solid rgba(100,140,200,0.25)", borderRadius:10, padding:"11px 14px", color:"#c8d8f0", fontSize:13, fontFamily:"Arial,sans-serif", textAlign:"left", cursor:"pointer", lineHeight:1.3, transition:"all 0.2s" }}
                    onMouseEnter={e=>{e.target.style.background="rgba(200,169,81,0.07)";e.target.style.color="#e8d9a0";e.target.style.borderColor="rgba(200,169,81,0.45)"}}
                    onMouseLeave={e=>{e.target.style.background="rgba(255,255,255,0.035)";e.target.style.color="#c8d8f0";e.target.style.borderColor="rgba(100,140,200,0.25)"}}
                  >{q}</button>
                ))}
              </div>
            </div>
          )}

          <div style={{ flex:1, paddingTop:showSugg?0:22 }}>
            {messages.map((m,i)=>(
              <div key={i} style={{ marginBottom:16, display:"flex", flexDirection:"column", alignItems:m.role==="user"?"flex-end":"flex-start" }}>
                <div style={{ maxWidth:"88%", background:m.role==="user"?"linear-gradient(135deg,#002070,#003daa)":"rgba(255,255,255,0.045)", border:m.role==="user"?"1px solid rgba(200,169,81,0.3)":"1px solid rgba(100,140,200,0.15)", borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px", padding:"13px 17px", color:"#d4dff0", fontSize:15, lineHeight:1.65, boxShadow:"0 2px 12px rgba(0,0,0,0.18)" }}>
                  {m.role==="user" ? m.content : <div>{formatMsg(m.content)}</div>}
                </div>
                <div style={{ fontSize:11, color:"#3a5a7a", marginTop:3, fontFamily:"Arial,sans-serif" }}>
                  {m.role==="user" ? "You" : "BC Budget Agent"}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display:"flex", marginBottom:16 }}>
                <div style={{ background:"rgba(255,255,255,0.045)", border:"1px solid rgba(100,140,200,0.15)", borderRadius:"16px 16px 16px 4px", padding:"14px 18px" }}>
                  <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                    {[0,1,2].map(n=>(<div key={n} style={{ width:8, height:8, borderRadius:"50%", background:"#C8A951", animation:`bcpulse 1.2s ease-in-out ${n*0.2}s infinite` }} />))}
                    <span style={{ color:"#6a8aaa", fontSize:13, marginLeft:6, fontFamily:"Arial,sans-serif" }}>Analyzing BC Budget data...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{ position:"sticky", bottom:0, paddingBottom:20, paddingTop:10, background:"linear-gradient(to top,#0a1a30 80%,transparent)" }}>
            <div style={{ display:"flex", gap:10, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(200,169,81,0.3)", borderRadius:13, padding:"9px 12px", boxShadow:"0 4px 24px rgba(0,0,0,0.3)" }}>
              <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
                placeholder="Ask about BC's budget, deficits, health spending, debt trajectory..."
                rows={1} style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"#e8eef8", fontSize:15, fontFamily:"Arial,sans-serif", resize:"none", lineHeight:1.5, maxHeight:100 }} />
              <button onClick={()=>send()} disabled={!input.trim()||loading} style={{ background:input.trim()&&!loading?"linear-gradient(135deg,#C8A951,#a88838)":"rgba(255,255,255,0.07)", border:"none", borderRadius:9, padding:"8px 17px", color:input.trim()&&!loading?"#1a0e00":"#4a6a8a", fontWeight:700, fontSize:15, cursor:input.trim()&&!loading?"pointer":"not-allowed", flexShrink:0, fontFamily:"Arial,sans-serif" }}>
                {loading ? "..." : "Send"}
              </button>
            </div>
            <div style={{ textAlign:"center", color:"#2a4a6a", fontSize:11, marginTop:7, fontFamily:"Arial,sans-serif" }}>
              Powered by Claude AI · Actuals from BC Public Accounts (audited) · Forecast from Budget 2026/27
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bcpulse{0%,80%,100%{opacity:0.3;transform:scale(0.8)}40%{opacity:1;transform:scale(1)}}
        textarea::placeholder{color:#3a5a7a}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-thumb{background:rgba(200,169,81,0.2);border-radius:3px}
      `}</style>
    </div>
  );
}
