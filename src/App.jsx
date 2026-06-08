import { useState, useEffect, useCallback } from "react";
import Darts from "./Darts";

/* ─── API ───────────────────────────────────────────── */
const API = "https://script.google.com/macros/s/AKfycbzq-SohecQc4eKbre6TJrW7T50isYP-IrAyMvRZpq5uYyaDPeIxDNivmB5rxY3w74xN/exec";

async function apiGet(action) {
  const res = await fetch(`${API}?action=${action}`);
  return res.json();
}
async function apiPost(data) {
  const res = await fetch(API, { method:"POST", body:JSON.stringify(data) });
  return res.json();
}

/* ─── STATIC DATA ───────────────────────────────────── */
const HOSTS = ["John","Melissa"];

const AVATARS = {
  "John":"👨‍🍳","Melissa":"👩‍🍳","The Mayor":"🎩",
  "Michele":"🕵️","Vice":"🕶️","April":"🎃",
  "Rashawn":"⚾","Tess":"⭐","Garrett":"👮","Lindsey":"🧮",
};

const CREW_NAMES = ["John","Melissa","The Mayor","Michele","Vice","April","Rashawn","Tess","Garrett","Lindsey"];

const DRINKS = [
  { name:"Tito's",               sub:"Handmade Vodka",      emoji:"🥃", color:"#d4a843", desc:"On the rocks, soda, whatever — the house standard.",                         fans:["The Mayor","April","Lindsey","Vice"] },
  { name:"Coors Banquet",        sub:"The Banquet Beer",    emoji:"🍺", color:"#c8960a", desc:"Cold, classic, always in the cooler.",                                        fans:["John","Garrett"] },
  { name:"Smoked Old Fashioned", sub:"Rashawn's Specialty", emoji:"🪵", color:"#c85a28", desc:"Bourbon, bitters, sugar cube — and Rashawn's smoke gun. The house cocktail.", fans:["Rashawn"] },
  { name:"MomWater",             sub:"Spiked Sparkling",    emoji:"💧", color:"#3a9ab8", desc:"Fruity, light, and dangerously drinkable.",                                   fans:["Melissa","Michele","Tess"] },
];

const BADGES = [
  { icon:"🌙", label:"Last Call",  desc:"Closed the bar 5x",    earned:true  },
  { icon:"⚡", label:"First In",   desc:"First to arrive 10x",  earned:true  },
  { icon:"🪵", label:"Smoke Show", desc:"Rashawn fired up 10x", earned:false },
  { icon:"🎯", label:"Dart King",  desc:"Won 10 in a row",      earned:false },
  { icon:"👑", label:"Regular",    desc:"50+ total visits",     earned:true  },
  { icon:"🔥", label:"On Fire",    desc:"5 visits in a week",   earned:false },
];

const tabs = ["Status","Crew","Menu","Board","Darts"];

/* ─── THEME ─────────────────────────────────────────── */
const bg      = "#1c1c1e";
const bgCard  = "#2a2a2e";
const bgCard2 = "#323236";
const border  = "rgba(255,255,255,0.1)";
const red     = "#ff4444";
const redDim  = "#cc2222";
const txt     = "#ffffff";
const txt2    = "#cccccc";
const txt3    = "#999999";
const dim     = "#666666";

/* ─── STYLES ─────────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Oswald:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap');

  @keyframes neonFlicker {
    0%,19%,21%,23%,25%,54%,56%,100% {
      text-shadow:0 0 4px #fff,0 0 11px #fff,0 0 19px #fff,
        0 0 40px #ff3333,0 0 80px #ff3333,0 0 100px #ff3333;
      opacity:1;
    }
    20%,24%,55%{ text-shadow:none; opacity:.82; }
  }
  @keyframes fadeUp {
    from{ opacity:0; transform:translateY(10px); }
    to{ opacity:1; transform:translateY(0); }
  }
  @keyframes dotBlink {
    0%,100%{ opacity:1; box-shadow:0 0 8px #ff3333; }
    50%{ opacity:.2; box-shadow:none; }
  }
  @keyframes tvScanline {
    0%{ top:-10%; }
    100%{ top:110%; }
  }
  @keyframes crtFlicker {
    0%,100%{ opacity:1; }
    93%{ opacity:.87; }
    94%{ opacity:1; }
  }
  @keyframes spin {
    from{ transform:rotate(0deg); }
    to{ transform:rotate(360deg); }
  }
  @keyframes welcomePulse {
    0%,100%{ box-shadow:0 0 0 0 rgba(255,68,68,0.4); }
    50%{ box-shadow:0 0 0 12px rgba(255,68,68,0); }
  }

  html,body{ margin:0; padding:0; background:${bg}; }
  .neon-title{ font-family:'Permanent Marker',cursive!important; animation:neonFlicker 5s infinite; color:#fff; }
  .dark-title{ font-family:'Permanent Marker',cursive!important; color:#5a2020; }
  .tab-content{ animation:fadeUp .22s ease forwards; }
  .live-dot{ animation:dotBlink 1.4s ease infinite; }
  .mono{ font-family:'Share Tech Mono',monospace!important; }
  .tv-screen{ animation:crtFlicker 9s infinite; }
  .tv-scanline{ position:absolute; left:0; right:0; height:18%; background:linear-gradient(transparent,rgba(255,255,255,0.02),transparent); animation:tvScanline 4s linear infinite; pointer-events:none; z-index:10; }
  .spinner{ animation:spin .8s linear infinite; display:inline-block; }
  .name-btn:active{ transform:scale(0.97); }
  *{ box-sizing:border-box; }
`;

/* ─── HELPERS ────────────────────────────────────────── */
function Label({ children, style={} }) {
  return (
    <div style={{
      fontSize:11, letterSpacing:3, textTransform:"uppercase",
      color:red, marginBottom:12,
      borderLeft:"3px solid "+red, paddingLeft:9,
      fontFamily:"'Oswald',sans-serif", fontWeight:600, ...style,
    }}>{children}</div>
  );
}

function Card({ children, highlight=false, onClick, style={} }) {
  return (
    <div onClick={onClick} style={{
      padding:"13px 15px", borderRadius:10, marginBottom:9,
      background:highlight ? "rgba(255,68,68,0.12)" : bgCard,
      border:`1px solid ${highlight ? "rgba(255,80,80,0.35)" : border}`,
      cursor:onClick?"pointer":"default",
      transition:"all .15s", ...style,
    }}>{children}</div>
  );
}

function Spinner() {
  return <span className="spinner" style={{ fontSize:16, color:red }}>⟳</span>;
}

/* ─── NAME PICKER ────────────────────────────────────── */
function NamePicker({ onSelect }) {
  return (
    <div style={{ background:bg, minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", padding:"40px 20px 30px", fontFamily:"'Oswald',sans-serif" }}>
      <style>{css}</style>
      <div style={{ display:"inline-block", background:"#120404", border:"2px solid rgba(255,60,60,0.25)", borderRadius:14, padding:"12px 32px 16px", marginBottom:10, boxShadow:"0 0 40px rgba(255,30,30,0.25)" }}>
        <div style={{ fontSize:9, letterSpacing:5, color:"rgba(255,120,120,0.45)", marginBottom:5, fontWeight:300, textAlign:"center" }}>✦ GARAGE BAR ✦</div>
        <div className="neon-title" style={{ fontSize:34, lineHeight:1.1, textAlign:"center" }}>The COCKpit</div>
      </div>
      <div style={{ fontSize:13, color:txt3, letterSpacing:2, marginBottom:28, textAlign:"center", marginTop:20 }}>WHO ARE YOU?</div>
      <div style={{ width:"100%", maxWidth:380, display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {CREW_NAMES.map(name=>(
          <button key={name} className="name-btn" onClick={()=>onSelect(name)} style={{
            display:"flex", alignItems:"center", gap:10,
            background:bgCard, border:`1px solid ${border}`,
            borderRadius:10, padding:"14px 16px",
            color:txt, cursor:"pointer",
            fontFamily:"'Oswald',sans-serif", fontWeight:600,
            fontSize:14, letterSpacing:.5, transition:"all .2s",
          }}>
            <span style={{ fontSize:24 }}>{AVATARS[name]||"👤"}</span>
            <span>{name}</span>
            {HOSTS.includes(name) && <span style={{ fontSize:8, color:red, background:"rgba(255,68,68,0.15)", padding:"2px 5px", borderRadius:3, letterSpacing:1, marginLeft:"auto" }}>HOST</span>}
          </button>
        ))}
      </div>
      <div style={{ marginTop:24, fontSize:11, color:dim, letterSpacing:.5, textAlign:"center", lineHeight:1.7 }}>
        Your choice is saved on this device.<br/>You won't be asked again.
      </div>
    </div>
  );
}

/* ─── TV WIDGET ──────────────────────────────────────── */
function TVWidget({ isHost, whatsOn, onSetWhatsOn }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(whatsOn||"");
  const [saving, setSaving]   = useState(false);
  const [tvOn, setTvOn]       = useState(true);

  useEffect(()=>{ setDraft(whatsOn||""); },[whatsOn]);

  const save = async () => {
    setSaving(true);
    await onSetWhatsOn(draft.trim()||"Nothing on");
    setSaving(false);
    setEditing(false);
  };

  return (
    <div style={{ background:"#120808", border:"3px solid #2a0a0a", borderRadius:10, overflow:"hidden", marginBottom:18, boxShadow:"0 0 0 1px rgba(255,50,50,0.12), 0 6px 24px rgba(0,0,0,0.5)" }}>
      <div style={{ background:"linear-gradient(180deg,#1e0a0a,#160606)", padding:"7px 12px 6px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:tvOn?"#ff3333":"#2a0808", boxShadow:tvOn?"0 0 6px #ff3333":"none" }} />
          <span className="mono" style={{ fontSize:9, color:"rgba(255,255,255,0.35)", letterSpacing:2 }}>TCL · COCKPIT TV</span>
        </div>
        <button onClick={()=>setTvOn(o=>!o)} style={{ background:"none", border:`1px solid rgba(255,255,255,0.15)`, borderRadius:3, color:tvOn?"#ff5050":"#444", fontSize:8, padding:"2px 8px", letterSpacing:1, fontFamily:"'Oswald',sans-serif", cursor:"pointer" }}>
          {tvOn?"ON":"OFF"}
        </button>
      </div>

      <div className="tv-screen" style={{ background:tvOn?"#080202":"#040000", minHeight:90, position:"relative", overflow:"hidden", transition:"background .4s", padding:"14px 16px" }}>
        <div className="tv-scanline" />
        <div style={{ position:"absolute", top:0, left:0, right:0, height:"35%", background:"linear-gradient(180deg,rgba(255,255,255,0.02),transparent)", pointerEvents:"none", zIndex:5 }} />
        {tvOn ? (
          <div style={{ position:"relative", zIndex:6 }}>
            <div className="mono" style={{ fontSize:8, color:red, letterSpacing:3, marginBottom:8 }}>ON THE TV</div>
            {!editing ? (
              <div>
                <div style={{ fontSize:22, color:txt, fontWeight:700, lineHeight:1.2, marginBottom:12 }}>{whatsOn||"Nothing on"}</div>
                {isHost ? (
                  <button onClick={()=>setEditing(true)} style={{ width:"100%", padding:"7px", background:"rgba(255,50,50,0.1)", border:"1px dashed rgba(255,80,80,0.3)", borderRadius:6, color:"#ff8080", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"'Oswald',sans-serif", fontWeight:500, cursor:"pointer" }}>
                    Edit
                  </button>
                ) : (
                  <div className="mono" style={{ textAlign:"center", fontSize:8, color:"#444", letterSpacing:2 }}>JOHN OR MELISSA CAN CHANGE THIS</div>
                )}
              </div>
            ) : (
              <div>
                <input autoFocus value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>e.key==="Enter"&&save()}
                  placeholder="e.g. Braves Game on ESPN"
                  style={{ width:"100%", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,80,80,0.4)", borderRadius:6, padding:"9px 11px", color:txt, fontSize:15, fontFamily:"'Oswald',sans-serif", outline:"none", marginBottom:8 }} />
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={save} disabled={saving} style={{ flex:1, padding:"8px", background:"rgba(255,50,50,0.2)", border:"1px solid rgba(255,80,80,0.5)", borderRadius:6, color:txt, fontSize:12, letterSpacing:2, textTransform:"uppercase", fontFamily:"'Oswald',sans-serif", fontWeight:700, cursor:"pointer" }}>
                    {saving?"...":"Save"}
                  </button>
                  <button onClick={()=>setEditing(false)} style={{ flex:1, padding:"8px", background:"rgba(255,255,255,0.05)", border:`1px solid ${border}`, borderRadius:6, color:txt3, fontSize:12, letterSpacing:2, textTransform:"uppercase", fontFamily:"'Oswald',sans-serif", fontWeight:500, cursor:"pointer" }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:60 }}>
            <span className="mono" style={{ fontSize:10, color:"#333", letterSpacing:4 }}>NO SIGNAL</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── EVENTS WIDGET ──────────────────────────────────── */
function EventsWidget({ events, isHost, onAdd, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft]       = useState({ date:"", title:"", note:"" });
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(null);

  const fmt = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T12:00:00");
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" });
  };

  const getDay = (dateStr) => {
    const d = new Date(dateStr + "T12:00:00");
    return isNaN(d) ? "" : d.getDate();
  };

  const getMon = (dateStr) => {
    const d = new Date(dateStr + "T12:00:00");
    return isNaN(d) ? "" : d.toLocaleDateString("en-US",{month:"short"});
  };

  const upcoming = (events||[]).filter(e => {
    if (!e.date) return false;
    const d = new Date(e.date + "T12:00:00");
    const today = new Date(); today.setHours(0,0,0,0);
    return d >= today;
  }).sort((a,b) => new Date(a.date) - new Date(b.date)).slice(0, 6);

  const submit = async () => {
    if (!draft.date || !draft.title.trim()) return;
    setSaving(true);
    await onAdd({ date:draft.date, title:draft.title.trim(), note:draft.note.trim() });
    setSaving(false);
    setDraft({ date:"", title:"", note:"" });
    setShowForm(false);
  };

  const handleDelete = async (e, idx) => {
    e.stopPropagation();
    setDeleting(idx);
    await onDelete(idx);
    setDeleting(null);
  };

  const inputStyle = {
    width:"100%", background:"rgba(255,255,255,0.07)",
    border:`1px solid rgba(255,80,80,0.3)`, borderRadius:7,
    padding:"10px 12px", color:txt, fontSize:14,
    fontFamily:"'Oswald',sans-serif", outline:"none", marginBottom:10,
  };

  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <Label style={{ margin:0 }}>Upcoming Events</Label>
        {isHost && !showForm && (
          <button onClick={()=>setShowForm(true)} style={{
            background:"rgba(255,68,68,0.12)", border:"1px solid rgba(255,80,80,0.3)",
            borderRadius:6, padding:"5px 12px", color:red,
            fontSize:10, letterSpacing:2, textTransform:"uppercase",
            fontFamily:"'Oswald',sans-serif", fontWeight:600, cursor:"pointer",
          }}>+ Add</button>
        )}
      </div>

      {/* Add event form — hosts only */}
      {showForm && isHost && (
        <div style={{ background:bgCard2, border:`1px solid rgba(255,80,80,0.25)`, borderRadius:10, padding:"16px", marginBottom:12 }}>
          <div style={{ fontSize:10, color:red, letterSpacing:2, marginBottom:12, fontFamily:"'Oswald',sans-serif", fontWeight:600 }}>NEW EVENT</div>
          <div style={{ fontSize:10, color:txt3, letterSpacing:1, marginBottom:5 }}>DATE</div>
          <input type="date" value={draft.date} onChange={e=>setDraft(d=>({...d,date:e.target.value}))}
            style={{ ...inputStyle, colorScheme:"dark" }} />
          <div style={{ fontSize:10, color:txt3, letterSpacing:1, marginBottom:5 }}>EVENT NAME</div>
          <input value={draft.title} onChange={e=>setDraft(d=>({...d,title:e.target.value}))}
            placeholder="e.g. UFC Night, Garrett's Birthday"
            style={inputStyle} />
          <div style={{ fontSize:10, color:txt3, letterSpacing:1, marginBottom:5 }}>NOTE (optional)</div>
          <input value={draft.note} onChange={e=>setDraft(d=>({...d,note:e.target.value}))}
            placeholder="e.g. Main card starts at 10"
            style={inputStyle} />
          <div style={{ display:"flex", gap:8, marginTop:4 }}>
            <button onClick={submit} disabled={saving||!draft.date||!draft.title.trim()} style={{
              flex:1, padding:"11px",
              background:"rgba(255,50,50,0.2)", border:"1px solid rgba(255,80,80,0.45)",
              borderRadius:7, color:txt,
              fontSize:12, letterSpacing:2, textTransform:"uppercase",
              fontFamily:"'Oswald',sans-serif", fontWeight:700, cursor:"pointer",
              opacity:(!draft.date||!draft.title.trim())?0.4:1,
            }}>{saving?"Saving...":"Save Event"}</button>
            <button onClick={()=>{ setShowForm(false); setDraft({date:"",title:"",note:""}); }} style={{
              flex:1, padding:"11px",
              background:"rgba(255,255,255,0.05)", border:`1px solid ${border}`,
              borderRadius:7, color:txt3,
              fontSize:12, letterSpacing:2, textTransform:"uppercase",
              fontFamily:"'Oswald',sans-serif", fontWeight:500, cursor:"pointer",
            }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Events list */}
      {upcoming.length === 0 && !showForm ? (
        <div style={{ padding:"16px", background:bgCard, borderRadius:10, border:`1px solid ${border}`, textAlign:"center", color:dim, fontSize:13 }}>
          {isHost ? "No upcoming events — tap + Add to schedule something" : "No upcoming events yet"}
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {upcoming.map((e,i) => (
            <div key={i} style={{
              display:"flex", alignItems:"center", gap:12,
              padding:"12px 14px", borderRadius:10,
              background:i===0?"rgba(255,68,68,0.1)":bgCard,
              border:`1px solid ${i===0?"rgba(255,80,80,0.3)":border}`,
            }}>
              {/* Date badge */}
              <div style={{ textAlign:"center", minWidth:44, background:"rgba(255,68,68,0.12)", borderRadius:8, padding:"6px 4px", border:"1px solid rgba(255,68,68,0.2)", flexShrink:0 }}>
                <div style={{ fontSize:9, color:red, letterSpacing:1, fontWeight:600, textTransform:"uppercase" }}>{getMon(e.date)}</div>
                <div style={{ fontSize:20, color:txt, fontWeight:700, lineHeight:1 }}>{getDay(e.date)}</div>
              </div>
              {/* Info */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:15, color:txt, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{e.title}</div>
                {e.note && <div style={{ fontSize:11, color:txt3, marginTop:2 }}>{e.note}</div>}
                <div style={{ fontSize:10, color:dim, marginTop:2, letterSpacing:.5 }}>{fmt(e.date)}</div>
              </div>
              {/* Next up badge or delete */}
              <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                {i===0 && <span style={{ fontSize:9, color:red, background:"rgba(255,68,68,0.15)", padding:"3px 8px", borderRadius:4, letterSpacing:1, fontFamily:"'Oswald',sans-serif", fontWeight:600 }}>NEXT UP</span>}
                {isHost && (
                  <button onClick={(ev)=>handleDelete(ev,i)} disabled={deleting===i} style={{
                    background:"rgba(255,255,255,0.05)", border:`1px solid ${border}`,
                    borderRadius:6, width:28, height:28,
                    color:deleting===i?"#555":dim, fontSize:14,
                    cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                  }}>{deleting===i?"...":"✕"}</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── WALK-IN MODAL ──────────────────────────────────── */
function WalkInModal({ onClose, onAdd }) {
  const [name, setName]     = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    const n = name.trim(); if(!n) return;
    setSaving(true); await onAdd(n); setSaving(false); onClose();
  };
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ background:"#242428", border:`1px solid rgba(255,80,80,0.3)`, borderRadius:12, padding:24, width:"100%", maxWidth:360 }}>
        <div style={{ fontSize:18, color:txt, fontWeight:700, marginBottom:4 }}>Walk-In Guest</div>
        <div style={{ fontSize:13, color:txt3, marginBottom:18 }}>Someone without the app just showed up.</div>
        <div style={{ fontSize:10, color:red, letterSpacing:2, marginBottom:6, fontFamily:"'Oswald',sans-serif", fontWeight:600 }}>NAME</div>
        <input autoFocus value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="Their name or nickname"
          style={{ width:"100%", background:"rgba(255,255,255,0.08)", border:`1px solid rgba(255,80,80,0.3)`, borderRadius:7, padding:"11px 13px", color:txt, fontSize:15, fontFamily:"'Oswald',sans-serif", outline:"none", marginBottom:14 }} />
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={submit} disabled={saving} style={{ flex:1, padding:"12px", background:"rgba(255,50,50,0.2)", border:"1px solid rgba(255,80,80,0.45)", borderRadius:8, color:txt, fontSize:13, letterSpacing:2, textTransform:"uppercase", fontFamily:"'Oswald',sans-serif", fontWeight:700, cursor:"pointer" }}>
            {saving?"Adding...":"Check In"}
          </button>
          <button onClick={onClose} style={{ flex:1, padding:"12px", background:"rgba(255,255,255,0.05)", border:`1px solid ${border}`, borderRadius:8, color:txt3, fontSize:13, letterSpacing:2, textTransform:"uppercase", fontFamily:"'Oswald',sans-serif", fontWeight:500, cursor:"pointer" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN APP ───────────────────────────────────────── */
export default function App() {
  const [myName, setMyName]         = useState(()=>localStorage.getItem("cockpit_user")||null);
  const [crew, setCrew]             = useState([]);
  const [tonight, setTonight]       = useState(null);
  const [events, setEvents]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [activeTab, setActiveTab]   = useState("Status");
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [showSwitch, setShowSwitch] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const isHost = HOSTS.includes(myName);

  const handleSelectName = (name) => {
    localStorage.setItem("cockpit_user", name);
    setMyName(name);
  };

  const fetchAll = useCallback(async () => {
    try {
      const [crewRes, tonightRes, eventsRes] = await Promise.all([
        apiGet("getCrew"),
        apiGet("getTonight"),
        apiGet("getEvents"),
      ]);
      if (crewRes.crew)       setCrew(crewRes.crew);
      if (tonightRes.tonight) setTonight(tonightRes.tonight);
      if (eventsRes.events)   setEvents(eventsRes.events);
      setError(null);
    } catch(e) {
      setError("Couldn't reach The Cockpit. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(()=>{
    if (myName) {
      fetchAll();
      const interval = setInterval(fetchAll, 30000);
      return ()=>clearInterval(interval);
    }
  },[myName, fetchAll]);

  /* ── ACTIONS ── */
  const toggleBar = async () => {
    const nowOpen = !(tonight?.isOpen===true||tonight?.isOpen==="TRUE");
    setActionLoading(true);
    if (!nowOpen) {
      await apiPost({ action:"logSession", attendees:checkedInNames.join(", ") });
      await apiPost({ action:"clearNight" });
    }
    await apiPost({ action:"setTonight", isOpen:nowOpen, openTime:"", whatsOn:tonight?.whatsOn||"Nothing on" });
    await fetchAll();
    setActionLoading(false);
  };

  const toggleCheckIn = async (name, currentStatus) => {
    const cin = currentStatus===true||currentStatus==="TRUE";
    setActionLoading(true);
    setCrew(c=>c.map(m=>m.name===name?{...m,checkedIn:!cin}:m));
    await apiPost({ action:"checkIn", name, checkedIn:!cin });
    await fetchAll();
    setActionLoading(false);
  };

  const setWhatsOn = async (whatsOn) => {
    await apiPost({ action:"setTonight", isOpen:tonight?.isOpen, openTime:tonight?.openTime, whatsOn });
    await fetchAll();
  };

  const addWalkIn = async (name) => {
    await apiPost({ action:"addWalkIn", name });
    await fetchAll();
  };

  const addEvent = async (event) => {
    await apiPost({ action:"addEvent", date:event.date, title:event.title, note:event.note });
    await fetchAll();
  };

  const deleteEvent = async (index) => {
    await apiPost({ action:"deleteEvent", index });
    await fetchAll();
  };

  /* ── DERIVED ── */
  const isOpen         = tonight?.isOpen===true||tonight?.isOpen==="TRUE";
  const walkins        = tonight?.walkins||[];
  const checkedInCrew  = crew.filter(m=>m.checkedIn===true||m.checkedIn==="TRUE");
  const checkedInNames = checkedInCrew.map(m=>m.name);
  const checkedInTotal = checkedInCrew.length + walkins.length;
  const hosts          = crew.filter(m=>m.isHost===true||m.isHost==="TRUE");
  const regulars       = crew.filter(m=>!(m.isHost===true||m.isHost==="TRUE"));
  const myData         = crew.find(m=>m.name===myName);
  const myCheckedIn    = checkedInNames.includes(myName);

  if (!myName) return <NamePicker onSelect={handleSelectName} />;

  if (loading) return (
    <div style={{ background:bg, minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, fontFamily:"'Oswald',sans-serif" }}>
      <style>{css}</style>
      <div className="neon-title" style={{ fontSize:32 }}>The COCKpit</div>
      <div style={{ color:dim, fontSize:11, letterSpacing:3 }}>OPENING UP...</div>
      <Spinner />
    </div>
  );

  if (error) return (
    <div style={{ background:bg, minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12, fontFamily:"'Oswald',sans-serif", padding:24 }}>
      <style>{css}</style>
      <div style={{ fontSize:32 }}>📡</div>
      <div style={{ color:txt, fontSize:15, textAlign:"center" }}>{error}</div>
      <button onClick={fetchAll} style={{ background:"rgba(255,50,50,0.15)", border:`1px solid rgba(255,80,80,0.4)`, borderRadius:6, padding:"11px 26px", color:txt, fontSize:12, letterSpacing:2, textTransform:"uppercase", fontFamily:"'Oswald',sans-serif", cursor:"pointer" }}>Try Again</button>
    </div>
  );

  return (
    <>
      <style>{css}</style>
      {showWalkIn && <WalkInModal onClose={()=>setShowWalkIn(false)} onAdd={addWalkIn} />}

      {showSwitch && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
          <div style={{ background:"#242428", border:`1px solid rgba(255,80,80,0.3)`, borderRadius:12, padding:24, width:"100%", maxWidth:360 }}>
            <div style={{ fontSize:16, color:txt, fontWeight:700, marginBottom:16, letterSpacing:1 }}>Switch User</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
              {CREW_NAMES.map(name=>(
                <button key={name} onClick={()=>{ handleSelectName(name); setShowSwitch(false); }} style={{ display:"flex", alignItems:"center", gap:8, background:myName===name?"rgba(255,50,50,0.18)":bgCard, border:`1px solid ${myName===name?"rgba(255,80,80,0.4)":border}`, borderRadius:8, padding:"10px 12px", color:txt, fontFamily:"'Oswald',sans-serif", fontWeight:600, fontSize:13, cursor:"pointer" }}>
                  <span style={{ fontSize:20 }}>{AVATARS[name]||"👤"}</span>
                  <span>{name}</span>
                </button>
              ))}
            </div>
            <button onClick={()=>setShowSwitch(false)} style={{ width:"100%", padding:"10px", background:"rgba(255,255,255,0.05)", border:`1px solid ${border}`, borderRadius:7, color:txt3, fontSize:11, letterSpacing:2, textTransform:"uppercase", fontFamily:"'Oswald',sans-serif", cursor:"pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ fontFamily:"'Oswald',sans-serif", background:bg, minHeight:"100vh", color:txt, maxWidth:430, margin:"0 auto", position:"relative", overflow:"hidden" }}>

        {/* Subtle red glow top */}
        <div style={{ position:"fixed", top:-120, left:"50%", transform:"translateX(-50%)", width:400, height:260, borderRadius:"50%", pointerEvents:"none", zIndex:0, background:isOpen?"radial-gradient(ellipse,rgba(255,30,30,0.1) 0%,transparent 70%)":"none", transition:"background 1.2s ease" }} />

        {/* ── HEADER ── */}
        <div style={{ textAlign:"center", padding:"26px 20px 16px", borderBottom:`1px solid ${border}`, position:"relative", zIndex:1, background:bg }}>
          <button onClick={()=>setShowSwitch(true)} style={{ position:"absolute", top:14, right:14, display:"flex", alignItems:"center", gap:6, background:bgCard, border:`1px solid ${border}`, borderRadius:20, padding:"5px 10px 5px 7px", cursor:"pointer" }}>
            <span style={{ fontSize:16 }}>{AVATARS[myName]||"👤"}</span>
            <span style={{ fontSize:11, color:txt2, fontFamily:"'Oswald',sans-serif", letterSpacing:.5, fontWeight:500 }}>{myName}</span>
          </button>

          {/* Neon sign */}
          <div style={{ display:"inline-block", background:"#120404", border:"2px solid rgba(255,50,50,0.2)", borderRadius:14, padding:"10px 28px 14px", marginBottom:14, boxShadow:isOpen?"0 0 36px rgba(255,20,20,0.25),inset 0 0 20px rgba(255,0,0,0.04)":"none", transition:"box-shadow 1.2s ease" }}>
            <div style={{ fontSize:9, letterSpacing:5, color:"rgba(255,120,120,0.4)", marginBottom:5, fontWeight:300 }}>✦ GARAGE BAR ✦</div>
            <div className={isOpen?"neon-title":"dark-title"} style={{ fontSize:36, lineHeight:1.1 }}>The COCKpit</div>
          </div>

          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:14 }}>
            <div className={isOpen?"live-dot":""} style={{ width:8, height:8, borderRadius:"50%", background:isOpen?"#ff3333":"#3a1010", transition:"background .6s" }} />
            <span style={{ fontSize:12, letterSpacing:3, textTransform:"uppercase", color:isOpen?"#ff6060":dim, fontWeight:500 }}>
              {isOpen?`Open Since ${tonight?.openTime||""}`: "Closed"}
            </span>
            {isOpen && <span style={{ background:"rgba(255,50,50,0.15)", border:"1px solid rgba(255,80,80,0.3)", borderRadius:5, padding:"3px 10px", fontSize:11, letterSpacing:1, color:"#ff8080" }}>{checkedInTotal} inside</span>}
          </div>

          {isHost && (
            <button onClick={toggleBar} disabled={actionLoading} style={{ background:isOpen?"rgba(255,50,50,0.1)":"rgba(255,50,50,0.2)", border:`1px solid ${isOpen?"rgba(255,80,80,0.25)":"rgba(255,80,80,0.5)"}`, borderRadius:7, padding:"9px 24px", color:isOpen?"#ff7070":txt, fontSize:12, letterSpacing:3, textTransform:"uppercase", fontFamily:"'Oswald',sans-serif", fontWeight:600, cursor:"pointer" }}>
              {actionLoading?"...":isOpen?"Lock Up":"Open The Bar"}
            </button>
          )}
        </div>

        {/* ── TABS ── */}
        <div style={{ display:"flex", borderBottom:`1px solid ${border}`, position:"sticky", top:0, background:bg, zIndex:10 }}>
          {tabs.map(tab=>(
            <button key={tab} onClick={()=>setActiveTab(tab)} style={{ flex:"1", padding:"13px 6px", background:"none", border:"none", borderBottom:activeTab===tab?`2px solid ${red}`:"2px solid transparent", color:activeTab===tab?txt:txt3, fontSize:11, letterSpacing:1, textTransform:"uppercase", fontFamily:"'Oswald',sans-serif", fontWeight:activeTab===tab?700:400, cursor:"pointer", transition:"color .18s" }}>
              {tab}
            </button>
          ))}
        </div>

        {/* ── CONTENT ── */}
        <div key={activeTab} className="tab-content" style={{ padding:"20px 16px", position:"relative", zIndex:1 }}>

          {/* STATUS */}
          {activeTab==="Status" && (
            <div>
              <Label>On the TV</Label>
              <TVWidget isHost={isHost} whatsOn={tonight?.whatsOn||"Nothing on"} onSetWhatsOn={setWhatsOn} />

              <EventsWidget events={events} isHost={isHost} onAdd={addEvent} onDelete={deleteEvent} />

              <Label>Your Check-In</Label>
              <button onClick={()=>toggleCheckIn(myName, myData?.checkedIn)} disabled={actionLoading} style={{
                width:"100%", padding:"16px",
                background:myCheckedIn?"rgba(255,50,50,0.12)":bgCard,
                border:`1px solid ${myCheckedIn?"rgba(255,80,80,0.4)":border}`,
                borderRadius:10, color:myCheckedIn?txt:txt3,
                fontSize:14, letterSpacing:3, textTransform:"uppercase",
                fontFamily:"'Oswald',sans-serif", fontWeight:700,
                boxShadow:myCheckedIn?"0 0 20px rgba(255,50,50,0.12)":"none",
                transition:"all .2s", cursor:"pointer",
              }}>
                {actionLoading?"...":myCheckedIn?"You're Inside — Tap to Leave":"Tap to Check In"}
              </button>

              {isHost && (
                <button onClick={()=>setShowWalkIn(true)} style={{ width:"100%", marginTop:10, padding:"13px", background:bgCard, border:`1px solid ${border}`, borderRadius:10, color:txt2, fontSize:12, letterSpacing:2, textTransform:"uppercase", fontFamily:"'Oswald',sans-serif", fontWeight:500, cursor:"pointer" }}>
                  Add Walk-In Guest
                </button>
              )}

              {walkins.length > 0 && (
                <div style={{ marginTop:16 }}>
                  <Label>Walk-Ins Tonight</Label>
                  {walkins.map((w,i)=>(
                    <Card key={i} highlight style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontSize:22 }}>🚶</span>
                      <span style={{ flex:1, fontSize:15, color:txt, fontWeight:600 }}>{w}</span>
                      <span style={{ fontSize:11, color:txt3, letterSpacing:1 }}>walk-in</span>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CREW */}
          {activeTab==="Crew" && (
            <div>
              <Label>Hosts</Label>
              {hosts.map(m=>{
                const cin=m.checkedIn===true||m.checkedIn==="TRUE";
                return (
                  <Card key={m.name} highlight={cin}>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <span style={{ fontSize:28 }}>{AVATARS[m.name]||"👤"}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:3 }}>
                          <span style={{ fontSize:16, color:txt, fontWeight:700 }}>{m.name}</span>
                          <span style={{ fontSize:9, color:red, background:"rgba(255,68,68,0.15)", padding:"2px 7px", borderRadius:3, letterSpacing:1 }}>HOST</span>
                        </div>
                        <div style={{ fontSize:12, color:txt2 }}>🥤 {m.drink}</div>
                        <div style={{ fontSize:11, color:dim, marginTop:2 }}>{m.visits} visits</div>
                      </div>
                      <div style={{ width:10, height:10, borderRadius:"50%", background:cin?"#ff3333":"#333", boxShadow:cin?"0 0 8px #ff3333":"none" }} />
                    </div>
                  </Card>
                );
              })}

              <div style={{ marginTop:16 }}>
                <Label>VIPs</Label>
                {regulars.map(m=>{
                  const cin=m.checkedIn===true||m.checkedIn==="TRUE";
                  return (
                    <Card key={m.name} highlight={cin} onClick={()=>toggleCheckIn(m.name,m.checkedIn)} style={{ cursor:"pointer" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                        <span style={{ fontSize:26 }}>{AVATARS[m.name]||"👤"}</span>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                            <span style={{ fontSize:15, color:txt, fontWeight:600 }}>{m.name}</span>
                            {m.name==="Rashawn" && <span style={{ fontSize:9, color:"#c85a28", background:"rgba(200,90,40,0.15)", padding:"2px 7px", borderRadius:3, letterSpacing:1 }}>SMOKE MASTER</span>}
                          </div>
                          <div style={{ fontSize:12, color:txt2 }}>🥤 {m.drink}</div>
                          <div style={{ fontSize:11, color:dim, marginTop:2 }}>{m.visits} visits</div>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ width:10, height:10, borderRadius:"50%", background:cin?"#ff3333":"#333", boxShadow:cin?"0 0 8px #ff3333":"none", marginLeft:"auto" }} />
                          <div style={{ fontSize:10, color:cin?"#ff6060":dim, marginTop:4, letterSpacing:1, fontWeight:600 }}>{cin?"IN":"OUT"}</div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {walkins.length > 0 && (
                <div style={{ marginTop:16 }}>
                  <Label>Walk-Ins</Label>
                  {walkins.map((w,i)=>(
                    <Card key={i} highlight style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontSize:22 }}>🚶</span>
                      <span style={{ flex:1, fontSize:15, color:txt, fontWeight:600 }}>{w}</span>
                      <span style={{ fontSize:11, color:txt3 }}>walk-in</span>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MENU */}
          {activeTab==="Menu" && (
            <div>
              <Label>The Usual Suspects</Label>
              {DRINKS.map((d,i)=>(
                <div key={i} style={{ padding:"16px", marginBottom:12, background:bgCard, border:`1px solid ${border}`, borderLeft:`4px solid ${d.color}`, borderRadius:10 }}>
                  <div style={{ display:"flex", gap:12 }}>
                    <span style={{ fontSize:32, lineHeight:1 }}>{d.emoji}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"baseline", gap:8, flexWrap:"wrap", marginBottom:5 }}>
                        <span style={{ fontSize:17, color:txt, fontWeight:700 }}>{d.name}</span>
                        <span style={{ fontSize:11, color:d.color, letterSpacing:.5 }}>{d.sub}</span>
                      </div>
                      <div style={{ fontSize:13, color:txt2, lineHeight:1.5 }}>{d.desc}</div>
                      <div style={{ display:"flex", gap:6, marginTop:10, flexWrap:"wrap" }}>
                        {d.fans.map(f=>(
                          <span key={f} style={{ fontSize:12, color:d.color, background:"rgba(255,255,255,0.06)", border:`1px solid ${d.color}44`, borderRadius:12, padding:"3px 11px" }}>{f}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* BOARD */}
          {activeTab==="Board" && (
            <div>
              <Label>Most Visits All-Time</Label>
              {[...crew].sort((a,b)=>Number(b.visits)-Number(a.visits)).map((m,i)=>(
                <Card key={m.name} highlight={i===0} style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <span style={{ fontSize:16, width:28, textAlign:"center", color:i===0?red:dim }}>
                    {i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}
                  </span>
                  <span style={{ fontSize:24 }}>{AVATARS[m.name]||"👤"}</span>
                  <span style={{ flex:1, fontSize:15, color:txt, fontWeight:600 }}>{m.name}</span>
                  {(m.isHost===true||m.isHost==="TRUE") && <span style={{ fontSize:9, color:red, background:"rgba(255,68,68,0.15)", padding:"2px 6px", borderRadius:3 }}>HOST</span>}
                  <span style={{ fontSize:16, color:i===0?red:txt2, fontWeight:i===0?700:400 }}>{m.visits}</span>
                </Card>
              ))}

              <div style={{ marginTop:22 }}>
                <Label>Badges</Label>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                  {BADGES.map((b,i)=>(
                    <div key={i} style={{ padding:"14px 8px", textAlign:"center", background:b.earned?bgCard2:bgCard, border:`1px solid ${b.earned?"rgba(255,80,80,0.2)":border}`, borderRadius:10, opacity:b.earned?1:.3, filter:b.earned?"none":"grayscale(1)" }}>
                      <div style={{ fontSize:26 }}>{b.icon}</div>
                      <div style={{ fontSize:11, color:b.earned?txt:dim, marginTop:7, fontWeight:600 }}>{b.label}</div>
                      <div style={{ fontSize:10, color:dim, marginTop:3, lineHeight:1.4 }}>{b.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* DARTS */}
          {activeTab==="Darts" && <Darts />}

        </div>

        {/* Footer */}
        <div style={{ height:44, borderTop:`1px solid ${border}`, display:"flex", alignItems:"center", justifyContent:"center", color:dim, fontSize:9, letterSpacing:4, textTransform:"uppercase", fontWeight:300 }}>
          Members Only · All Roads Lead to Happy Hour
        </div>
      </div>
    </>
  );
}
