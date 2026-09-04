import { useState, useEffect, useCallback } from "react";
import { requestNotificationPermission, onForegroundMessage } from "./nativepush";

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
// Crew data is loaded dynamically from the Sheet
// Helpers that work with live crew data
function getAvatar(crewArr, name) {
  return crewArr.find(m=>m.name===name)?.avatar || "👤";
}

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

const tabs = ["Status","Crew","Weather","Board","Recs","Reviews"];

/* ─── THEME ─────────────────────────────────────────── */
const bg      = "#1c1c1e";
const bgCard  = "#2a2a2e";
const bgCard2 = "#323236";
const border  = "rgba(255,255,255,0.1)";
const red     = "#ff4444";
const redDim  = "#cc2222";
const txt     = "#ffffff";
const txt2    = "#cccccc";
const txt3    = "#aaaaaa";
const dim     = "#777777";

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

  html,body{ margin:0; padding:0; background:${bg}; font-size:16px; }
  * { -webkit-text-size-adjust: 100%; }
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
      fontSize:13, letterSpacing:3, textTransform:"uppercase",
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
function NamePicker({ onSelect, crew }) {
  return (
    <div style={{ background:bg, minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", padding:"40px 20px 30px", fontFamily:"'Oswald',sans-serif" }}>
      <style>{css}</style>
      <div style={{ display:"inline-block", background:"#120404", border:"2px solid rgba(255,60,60,0.25)", borderRadius:14, padding:"12px 32px 16px", marginBottom:10, boxShadow:"0 0 40px rgba(255,30,30,0.25)" }}>
        <div style={{ fontSize:9, letterSpacing:5, color:"rgba(255,120,120,0.45)", marginBottom:5, fontWeight:300, textAlign:"center" }}>✦ GARAGE BAR ✦</div>
        <div className="neon-title" style={{ fontSize:34, lineHeight:1.1, textAlign:"center" }}>The COCKpit</div>
      </div>
      <div style={{ fontSize:13, color:txt3, letterSpacing:2, marginBottom:28, textAlign:"center", marginTop:20 }}>WHO ARE YOU?</div>
      <div style={{ width:"100%", maxWidth:380, display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {crew.map(member=>(
          <button key={member.name} className="name-btn" onClick={()=>onSelect(member.name)} style={{
            display:"flex", alignItems:"center", gap:10,
            background:bgCard, border:`1px solid ${border}`,
            borderRadius:10, padding:"14px 16px",
            color:txt, cursor:"pointer",
            fontFamily:"'Oswald',sans-serif", fontWeight:600,
            fontSize:14, letterSpacing:.5, transition:"all .2s",
          }}>
            <span style={{ fontSize:24 }}>{member.avatar||"👤"}</span>
            <span>{member.name}</span>
            {(member.isHost===true||member.isHost==="TRUE") && <span style={{ fontSize:8, color:red, background:"rgba(255,68,68,0.15)", padding:"2px 5px", borderRadius:3, letterSpacing:1, marginLeft:"auto" }}>HOST</span>}
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
  const [draft, setDraft]       = useState({ date:"", title:"", note:"", time:"" });
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(null);

  const fmt = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T12:00:00");
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" });
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
    await onAdd({ date:draft.date, title:draft.title.trim(), note:draft.note.trim(), time:draft.time.trim() });
    setSaving(false);
    setDraft({ date:"", title:"", note:"", time:"" });
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
          <div style={{ fontSize:10, color:txt3, letterSpacing:1, marginBottom:5 }}>TIME ET (optional)</div>
          <input value={draft.time} onChange={e=>setDraft(d=>({...d,time:e.target.value}))}
            placeholder="e.g. 8:00 PM"
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
                <div style={{ fontSize:17, color:txt, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{e.title}</div>
                {e.note && <div style={{ fontSize:14, color:txt3, marginTop:3 }}>{e.note}</div>}
                <div style={{ fontSize:13, color:dim, marginTop:3, letterSpacing:.3 }}>{fmt(e.date)}{e.time ? " · " + e.time + " ET" : ""}</div>
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

/* ─── REVIEWS TAB ────────────────────────────────────── */
function Stars({ count, size=18, interactive=false, onSelect }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display:"flex", gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i}
          onClick={()=>interactive&&onSelect&&onSelect(i)}
          onMouseEnter={()=>interactive&&setHover(i)}
          onMouseLeave={()=>interactive&&setHover(0)}
          style={{
            fontSize:size, cursor:interactive?"pointer":"default",
            color:(hover||count)>=i?"#fbbc04":"#444",
            transition:"color .1s",
            lineHeight:1,
          }}>★</span>
      ))}
    </div>
  );
}

function ReviewsTab({ reviews, myName, isHost, onSubmit, onDelete }) {
  const [stars, setStars]   = useState(0);
  const [text, setText]     = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const avg = reviews.length
    ? (reviews.reduce((s,r) => s + Number(r.stars), 0) / reviews.length).toFixed(1)
    : null;

  const totalByStars = [5,4,3,2,1].map(s => ({
    s,
    count: reviews.filter(r=>Number(r.stars)===s).length,
    pct: reviews.length ? Math.round((reviews.filter(r=>Number(r.stars)===s).length/reviews.length)*100) : 0,
  }));

  const submit = async () => {
    if (!stars || !text.trim()) return;
    setSaving(true);
    await onSubmit(stars, text.trim());
    setSaving(false);
    setStars(0); setText(""); setShowForm(false);
  };

  const handleDelete = async (i) => {
    setDeleting(i);
    await onDelete(i);
    setDeleting(null);
  };

  const fmtDate = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    if (isNaN(d)) return ts;
    return d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
  };

  return (
    <div>
      {/* Google Reviews header */}
      <div style={{ background:bgCard, borderRadius:12, padding:"18px 16px", marginBottom:16, border:`1px solid ${border}` }}>
        {/* Business info */}
        <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:16, paddingBottom:16, borderBottom:`1px solid ${border}` }}>
          <div style={{ fontSize:36 }}>🍺</div>
          <div>
            <div style={{ fontSize:17, color:txt, fontWeight:700, lineHeight:1.2 }}>The Cockpit</div>
            <div style={{ fontSize:11, color:txt3, marginTop:2 }}>Garage Bar · Members Only</div>
            <div style={{ fontSize:11, color:"#4caf50", marginTop:2, fontWeight:500 }}>
              {reviews.length > 0
                ? (reviews.filter(r=>Number(r.stars)>=4).length / reviews.length > 0.7 ? "Usually packed on weekends" : "Mixed reviews")
                : "Be the first to review"}
            </div>
          </div>
        </div>

        {/* Rating summary */}
        {avg ? (
          <div style={{ display:"flex", gap:20, alignItems:"center", marginBottom:16 }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:52, color:txt, fontWeight:700, lineHeight:1 }}>{avg}</div>
              <Stars count={Math.round(Number(avg))} size={16} />
              <div style={{ fontSize:11, color:txt3, marginTop:4 }}>{reviews.length} review{reviews.length!==1?"s":""}</div>
            </div>
            <div style={{ flex:1 }}>
              {totalByStars.map(({s,count,pct})=>(
                <div key={s} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                  <span style={{ fontSize:11, color:txt3, minWidth:8 }}>{s}</span>
                  <span style={{ fontSize:11, color:"#fbbc04" }}>★</span>
                  <div style={{ flex:1, height:6, background:"#333", borderRadius:3, overflow:"hidden" }}>
                    <div style={{ width:`${pct}%`, height:"100%", background:"#fbbc04", borderRadius:3, transition:"width .4s" }} />
                  </div>
                  <span style={{ fontSize:11, color:txt3, minWidth:14, textAlign:"right" }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ textAlign:"center", padding:"12px 0", color:txt3, fontSize:13 }}>No reviews yet — be the first!</div>
        )}

        {/* Write a review button */}
        {!showForm && (
          <button onClick={()=>setShowForm(true)} style={{
            width:"100%", padding:"11px",
            background:"rgba(66,133,244,0.15)",
            border:"1px solid rgba(66,133,244,0.35)",
            borderRadius:8, color:"#6ab0ff",
            fontSize:13, letterSpacing:1,
            fontFamily:"'Oswald',sans-serif", fontWeight:600, cursor:"pointer",
          }}>✏️ Write a Review</button>
        )}

        {/* Review form */}
        {showForm && (
          <div style={{ marginTop:4 }}>
            <div style={{ fontSize:13, color:txt2, marginBottom:10, fontWeight:500 }}>Your rating</div>
            <div style={{ marginBottom:12 }}>
              <Stars count={stars} size={36} interactive onSelect={setStars} />
            </div>
            <textarea
              value={text}
              onChange={e=>setText(e.target.value)}
              placeholder={`Share your experience at The Cockpit, ${myName}...`}
              rows={4}
              style={{
                width:"100%", background:"rgba(255,255,255,0.07)",
                border:`1px solid rgba(255,255,255,0.15)`, borderRadius:8,
                padding:"10px 12px", color:txt, fontSize:13,
                fontFamily:"'Oswald',sans-serif", outline:"none",
                resize:"none", marginBottom:10, lineHeight:1.5,
              }}
            />
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={submit} disabled={saving||!stars||!text.trim()} style={{
                flex:1, padding:"11px",
                background:"rgba(66,133,244,0.2)", border:"1px solid rgba(66,133,244,0.4)",
                borderRadius:7, color:txt,
                fontSize:12, letterSpacing:1, textTransform:"uppercase",
                fontFamily:"'Oswald',sans-serif", fontWeight:700, cursor:"pointer",
                opacity:(!stars||!text.trim())?0.4:1,
              }}>{saving?"Posting...":"Post Review"}</button>
              <button onClick={()=>{setShowForm(false);setStars(0);setText("");}} style={{
                flex:1, padding:"11px",
                background:"rgba(255,255,255,0.05)", border:`1px solid ${border}`,
                borderRadius:7, color:txt3,
                fontSize:12, letterSpacing:1, textTransform:"uppercase",
                fontFamily:"'Oswald',sans-serif", fontWeight:500, cursor:"pointer",
              }}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Reviews list */}
      <Label>All Reviews</Label>
      {reviews.length === 0 ? (
        <div style={{ textAlign:"center", padding:"24px", color:dim, fontSize:13 }}>No reviews yet</div>
      ) : (
        [...reviews].reverse().map((r,i)=>(
          <div key={i} style={{ background:bgCard, border:`1px solid ${border}`, borderRadius:12, padding:"14px 15px", marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:8 }}>
              {/* Avatar */}
              <div style={{ width:38, height:38, borderRadius:"50%", background:bgCard2, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0, border:`1px solid ${border}` }}>
                {getAvatar(crew, r.name)}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
                  <span style={{ fontSize:14, color:txt, fontWeight:700 }}>{r.name}</span>
                  {(isHost || r.name===myName) && (
                    <button onClick={()=>handleDelete(reviews.length-1-i)} disabled={deleting===reviews.length-1-i} style={{ background:"none", border:"none", color:dim, fontSize:14, cursor:"pointer", padding:"0 4px", flexShrink:0 }}>
                      {deleting===reviews.length-1-i?"...":"✕"}
                    </button>
                  )}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:2 }}>
                  <Stars count={Number(r.stars)} size={13} />
                  <span style={{ fontSize:11, color:dim }}>· {fmtDate(r.date)}</span>
                </div>
              </div>
            </div>
            <div style={{ fontSize:15, color:txt2, lineHeight:1.6, paddingLeft:48 }}>{r.text}</div>
          </div>
        ))
      )}
    </div>
  );
}

/* ─── WEATHER TAB — WINDY RADAR ──────────────────────── */
const COCKPIT_LAT = 26.664539385673542;
const COCKPIT_LNG = -80.2249280388635;

function WeatherTab() {
  const [zoom, setZoom] = useState(10);

  const ZOOM_LEVELS = [
    { label:"Neighborhood", value:12 },
    { label:"County",       value:10 },
    { label:"Region",       value:8  },
    { label:"State",        value:7  },
  ];

  const windyUrl = `https://embed.windy.com/embed2.html?lat=${COCKPIT_LAT}&lon=${COCKPIT_LNG}&detailLat=${COCKPIT_LAT}&detailLon=${COCKPIT_LNG}&width=650&height=450&zoom=${zoom}&level=surface&overlay=rain&product=ecmwf&menu=&message=true&marker=true&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=mph&metricTemp=%C2%B0F&radarRange=-1`;

  return (
    <div>
      <Label>Live Radar — Wellington FL</Label>

      {/* Zoom selector */}
      <div style={{ display:"flex", gap:8, marginBottom:12 }}>
        {ZOOM_LEVELS.map(z => (
          <button key={z.value} onClick={()=>setZoom(z.value)} style={{
            flex:1, padding:"8px 4px",
            background:zoom===z.value?"rgba(255,68,68,0.15)":bgCard,
            border:`1px solid ${zoom===z.value?"rgba(255,80,80,0.4)":border}`,
            borderRadius:8, color:zoom===z.value?red:txt3,
            fontSize:11, fontFamily:"'Oswald',sans-serif",
            fontWeight:zoom===z.value?600:400,
            cursor:"pointer", transition:"all .15s",
            textAlign:"center",
          }}>
            {z.label}
          </button>
        ))}
      </div>

      {/* Windy embed */}
      <div style={{ borderRadius:12, overflow:"hidden", border:`1px solid ${border}`, marginBottom:10 }}>
        <iframe
          key={zoom}
          src={windyUrl}
          width="100%"
          height="420"
          frameBorder="0"
          style={{ display:"block" }}
          title="Weather Radar"
          allowFullScreen
        />
      </div>

      <div style={{ textAlign:"center", fontSize:11, color:dim }}>
        Powered by Windy.com · Rain overlay · Wellington FL
      </div>
    </div>
  );
}

/* ─── RECS TAB ───────────────────────────────────────── */
const CATEGORIES = [
  { key:"Restaurants",    label:"Restaurants",   icon:"🍽️" },
  { key:"Contractors",    label:"Contractors",   icon:"🔨" },
  { key:"Services",       label:"Services",      icon:"🏥" },
  { key:"Shopping",       label:"Shopping",      icon:"🛒" },
  { key:"Entertainment",  label:"Entertainment", icon:"🎉" },
  { key:"Sketchy Folks",  label:"Sketchy Folks", icon:"👀" },
  { key:"Other",          label:"Other",         icon:"📦" },
];

function RecsTab({ recs, myName, isHost, onAdd, onDelete, onEdit }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [showForm, setShowForm]             = useState(false);
  const [editingIndex, setEditingIndex]     = useState(null);
  const [saving, setSaving]                 = useState(false);
  const [deleting, setDeleting]             = useState(null);
  const [draft, setDraft] = useState({
    business:"", verdict:"recommend", comment:"", link:"", category:"Restaurants"
  });

  const filtered = activeCategory === "All" ? recs : recs.filter(r => r.category === activeCategory);

  const openAdd = () => {
    const defaultCat = activeCategory === "All" ? "Restaurants" : activeCategory;
    setDraft({ business:"", verdict:"recommend", comment:"", link:"", category:defaultCat });
    setEditingIndex(null);
    setShowForm(true);
  };

  const openEdit = (rec, idx) => {
    setDraft({ business:rec.business, verdict:rec.verdict, comment:rec.comment||"", link:rec.link||"", category:rec.category });
    setEditingIndex(idx);
    setShowForm(true);
  };

  const submit = async () => {
    if (!draft.business.trim()) return;
    setSaving(true);
    if (editingIndex !== null) {
      await onEdit(editingIndex, draft);
    } else {
      await onAdd(draft);
    }
    setSaving(false);
    setShowForm(false);
    setEditingIndex(null);
  };

  const handleDelete = async (realIndex) => {
    setDeleting(realIndex);
    await onDelete(realIndex);
    setDeleting(null);
  };

  const inputStyle = {
    width:"100%", background:"rgba(255,255,255,0.07)",
    border:`1px solid rgba(255,255,255,0.15)`, borderRadius:7,
    padding:"10px 12px", color:txt, fontSize:14,
    fontFamily:"'Oswald',sans-serif", outline:"none", marginBottom:10,
  };

  return (
    <div>
      {/* Category filter pills */}
      <div style={{ display:"flex", overflowX:"auto", scrollbarWidth:"none", gap:8, marginBottom:16, paddingBottom:4 }}>
        {/* All pill */}
        <button onClick={()=>{ setActiveCategory("All"); setShowForm(false); }} style={{
          flex:"0 0 auto", padding:"8px 14px",
          background:activeCategory==="All"?"rgba(255,68,68,0.15)":bgCard,
          border:`1px solid ${activeCategory==="All"?"rgba(255,80,80,0.4)":border}`,
          borderRadius:20, color:activeCategory==="All"?red:txt3,
          fontSize:13, fontFamily:"'Oswald',sans-serif", fontWeight:activeCategory==="All"?600:400,
          cursor:"pointer", whiteSpace:"nowrap", transition:"all .15s",
        }}>
          All {recs.length > 0 && <span style={{ marginLeft:4, fontSize:11 }}>{recs.length}</span>}
        </button>
        {CATEGORIES.map(cat => (
          <button key={cat.key} onClick={()=>{ setActiveCategory(cat.key); setShowForm(false); }} style={{
            flex:"0 0 auto", padding:"8px 14px",
            background:activeCategory===cat.key?"rgba(255,68,68,0.15)":bgCard,
            border:`1px solid ${activeCategory===cat.key?"rgba(255,80,80,0.4)":border}`,
            borderRadius:20, color:activeCategory===cat.key?red:txt3,
            fontSize:13, fontFamily:"'Oswald',sans-serif", fontWeight:activeCategory===cat.key?600:400,
            cursor:"pointer", whiteSpace:"nowrap", transition:"all .15s",
          }}>
            {cat.icon} {cat.label}
            {recs.filter(r=>r.category===cat.key).length > 0 && (
              <span style={{ marginLeft:6, fontSize:11, color:activeCategory===cat.key?red:dim }}>
                {recs.filter(r=>r.category===cat.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {!showForm && (
        <button onClick={openAdd} style={{
          width:"100%", padding:"12px", marginBottom:16,
          background:"rgba(255,68,68,0.1)", border:"1px dashed rgba(255,80,80,0.3)",
          borderRadius:10, color:red,
          fontSize:13, letterSpacing:2, textTransform:"uppercase",
          fontFamily:"'Oswald',sans-serif", fontWeight:600, cursor:"pointer",
        }}>+ Add Entry</button>
      )}

      {/* Form */}
      {showForm && (
        <div style={{ background:bgCard2, border:`1px solid rgba(255,80,80,0.2)`, borderRadius:10, padding:"16px", marginBottom:16 }}>
          <div style={{ fontSize:13, color:red, letterSpacing:2, marginBottom:14, fontFamily:"'Oswald',sans-serif", fontWeight:600 }}>
            {editingIndex !== null ? "EDIT ENTRY" : "NEW ENTRY"}
          </div>

          {/* Verdict toggle */}
          <div style={{ display:"flex", gap:8, marginBottom:12 }}>
            {["recommend","avoid"].map(v => (
              <button key={v} onClick={()=>setDraft(d=>({...d,verdict:v}))} style={{
                flex:1, padding:"10px",
                background:draft.verdict===v
                  ? (v==="recommend"?"rgba(76,175,80,0.2)":"rgba(255,68,68,0.2)")
                  : "rgba(255,255,255,0.04)",
                border:`1px solid ${draft.verdict===v
                  ? (v==="recommend"?"rgba(76,175,80,0.5)":"rgba(255,80,80,0.5)")
                  : border}`,
                borderRadius:8, cursor:"pointer",
                color:draft.verdict===v ? (v==="recommend"?"#4caf50":red) : txt3,
                fontSize:13, fontFamily:"'Oswald',sans-serif", fontWeight:600,
                textTransform:"uppercase", letterSpacing:1,
              }}>
                {v==="recommend" ? "👍 Recommend" : "👎 Avoid"}
              </button>
            ))}
          </div>

          <div style={{ fontSize:11, color:txt3, letterSpacing:1, marginBottom:5 }}>CATEGORY</div>
          <select value={draft.category} onChange={e=>setDraft(d=>({...d,category:e.target.value}))} style={{
            width:"100%", background:"rgba(255,255,255,0.07)",
            border:`1px solid rgba(255,255,255,0.15)`, borderRadius:7,
            padding:"10px 12px", color:txt, fontSize:14,
            fontFamily:"'Oswald',sans-serif", outline:"none", marginBottom:10,
            appearance:"none", cursor:"pointer",
          }}>
            {CATEGORIES.map(cat => (
              <option key={cat.key} value={cat.key} style={{ background:"#2a2a2e" }}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>

          <div style={{ fontSize:11, color:txt3, letterSpacing:1, marginBottom:5 }}>BUSINESS / PERSON / VEHICLE</div>
          <input value={draft.business} onChange={e=>setDraft(d=>({...d,business:e.target.value}))}
            placeholder="e.g. Mario's Pizza, White Dodge RAM, Bob's Plumbing"
            style={inputStyle} />

          <div style={{ fontSize:11, color:txt3, letterSpacing:1, marginBottom:5 }}>COMMENT (optional)</div>
          <input value={draft.comment} onChange={e=>setDraft(d=>({...d,comment:e.target.value}))}
            placeholder="One liner — keep it short"
            style={inputStyle} />

          <div style={{ fontSize:11, color:txt3, letterSpacing:1, marginBottom:5 }}>LINK (optional)</div>
          <input value={draft.link} onChange={e=>setDraft(d=>({...d,link:e.target.value}))}
            placeholder="https://..."
            style={inputStyle} />

          <div style={{ display:"flex", gap:8 }}>
            <button onClick={submit} disabled={saving||!draft.business.trim()} style={{
              flex:1, padding:"11px",
              background:"rgba(255,68,68,0.18)", border:"1px solid rgba(255,80,80,0.45)",
              borderRadius:7, color:txt,
              fontSize:13, letterSpacing:2, textTransform:"uppercase",
              fontFamily:"'Oswald',sans-serif", fontWeight:700, cursor:"pointer",
              opacity:!draft.business.trim()?0.4:1,
            }}>{saving?"Saving...":"Save"}</button>
            <button onClick={()=>{ setShowForm(false); setEditingIndex(null); }} style={{
              flex:1, padding:"11px",
              background:"rgba(255,255,255,0.05)", border:`1px solid ${border}`,
              borderRadius:7, color:txt3,
              fontSize:13, letterSpacing:2, textTransform:"uppercase",
              fontFamily:"'Oswald',sans-serif", fontWeight:500, cursor:"pointer",
            }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Entries list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:"30px", color:dim, fontSize:14 }}>
          {activeCategory === "All" ? "Nothing here yet — add the first entry" : "Nothing in this category yet"}
        </div>
      ) : (
        filtered.map((rec, i) => {
          const realIndex = recs.indexOf(rec);
          const isRecommend = rec.verdict === "recommend";
          return (
            <div key={i} style={{
              padding:"14px 16px", marginBottom:10,
              background:bgCard,
              border:`1px solid ${border}`,
              borderLeft:`4px solid ${isRecommend?"#4caf50":red}`,
              borderRadius:10,
            }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                <span style={{ fontSize:22, flexShrink:0, marginTop:2 }}>{isRecommend?"👍":"👎"}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:17, color:txt, fontWeight:700, lineHeight:1.2 }}>{rec.business}</div>
                  {activeCategory === "All" && (
                    <div style={{ fontSize:11, color:dim, marginTop:2, letterSpacing:1 }}>
                      {CATEGORIES.find(c=>c.key===rec.category)?.icon} {rec.category}
                    </div>
                  )}
                  {rec.comment && <div style={{ fontSize:13, color:txt2, marginTop:4, lineHeight:1.4 }}>{rec.comment}</div>}
                  {rec.link && (
                    <a href={rec.link.startsWith("http")?rec.link:"https://"+rec.link}
                      target="_blank" rel="noopener noreferrer"
                      style={{ fontSize:12, color:"#7ab8c8", marginTop:4, display:"block", textDecoration:"none", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      🔗 {rec.link.replace(/^https?:\/\//,"")}
                    </a>
                  )}
                  <div style={{ fontSize:11, color:dim, marginTop:6 }}>
                    {rec.name} · {rec.date}
                  </div>
                </div>
                <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                  {(rec.name===myName||isHost) && (
                    <>
                      <button onClick={()=>openEdit(rec, realIndex)} style={{ background:"rgba(255,255,255,0.06)", border:`1px solid ${border}`, borderRadius:6, padding:"5px 8px", color:txt3, fontSize:12, cursor:"pointer" }}>✏️</button>
                      <button onClick={()=>handleDelete(realIndex)} disabled={deleting===realIndex} style={{ background:"rgba(255,50,50,0.08)", border:"1px solid rgba(255,80,80,0.2)", borderRadius:6, padding:"5px 8px", color:red, fontSize:12, cursor:"pointer" }}>
                        {deleting===realIndex?"...":"✕"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

/* ─── SCHEDULE OPENING ───────────────────────────────── */
function ScheduleOpening({ scheduledTime, onSet }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState("");
  const [saving, setSaving]   = useState(false);

  const save = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    await onSet(draft.trim());
    setSaving(false);
    setEditing(false);
    setDraft("");
  };

  if (editing) return (
    <div style={{ display:"flex", gap:8, alignItems:"center", marginTop:4 }}>
      <input
        autoFocus
        value={draft}
        onChange={e=>setDraft(e.target.value)}
        onKeyDown={e=>e.key==="Enter"&&save()}
        placeholder="e.g. 7 PM or 6:30 PM"
        style={{
          background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,149,0,0.35)",
          borderRadius:7, padding:"7px 12px", color:txt, fontSize:14,
          fontFamily:"'Oswald',sans-serif", outline:"none", width:160,
        }}
      />
      <button onClick={save} disabled={saving} style={{
        background:"rgba(255,149,0,0.15)", border:"1px solid rgba(255,149,0,0.4)",
        borderRadius:7, padding:"7px 14px", color:"#ffaa00",
        fontSize:12, letterSpacing:1, fontFamily:"'Oswald',sans-serif",
        fontWeight:600, cursor:"pointer",
      }}>{saving?"...":"Set"}</button>
      <button onClick={()=>setEditing(false)} style={{
        background:"none", border:`1px solid ${border}`,
        borderRadius:7, padding:"7px 10px", color:dim,
        fontSize:12, cursor:"pointer", fontFamily:"'Oswald',sans-serif",
      }}>Cancel</button>
    </div>
  );

  return (
    <button onClick={()=>setEditing(true)} style={{
      background:"none", border:"none",
      color:dim, fontSize:12, letterSpacing:1,
      cursor:"pointer", fontFamily:"'Oswald',sans-serif",
      textDecoration:"underline", textDecorationStyle:"dotted",
      marginTop:2,
    }}>
      {scheduledTime ? "Change scheduled time" : "🕐 Schedule an opening time"}
    </button>
  );
}

/* ─── CLAP LOADER ────────────────────────────────────── */
function ClapLoader() {
  const [phase, setPhase] = useState(0);
  // phase 0 = hands apart, 1 = CLAP, 2 = apart, 3 = CLAP, 4 = fade to title

  useEffect(() => {
    const timings = [
      [120,  1],   // first clap
      [320,  2],   // apart
      [440,  3],   // second clap
      [640,  4],   // show title
    ];
    const timers = timings.map(([ms, p]) => setTimeout(() => setPhase(p), ms));
    return () => timers.forEach(clearTimeout);
  }, []);

  const isClap = phase === 1 || phase === 3;

  return (
    <div style={{
      background:bg, minHeight:"100vh",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      fontFamily:"'Oswald',sans-serif",
      overflow:"hidden",
    }}>
      <style>{css}
        {`
        @keyframes clapLeft {
          0%   { transform: translateX(0) rotate(0deg); }
          100% { transform: translateX(38px) rotate(15deg); }
        }
        @keyframes clapRight {
          0%   { transform: translateX(0) rotate(0deg) scaleX(-1); }
          100% { transform: translateX(-38px) rotate(-15deg) scaleX(-1); }
        }
        @keyframes apartLeft {
          0%   { transform: translateX(38px) rotate(15deg); }
          100% { transform: translateX(0) rotate(0deg); }
        }
        @keyframes apartRight {
          0%   { transform: translateX(-38px) rotate(-15deg) scaleX(-1); }
          100% { transform: translateX(0) rotate(0deg) scaleX(-1); }
        }
        @keyframes clapFlash {
          0%   { opacity:0; transform:scale(0.4); }
          40%  { opacity:1; transform:scale(1.3); }
          100% { opacity:0; transform:scale(1); }
        }
        @keyframes titleReveal {
          0%   { opacity:0; transform:translateY(16px); }
          100% { opacity:1; transform:translateY(0); }
        }
        @keyframes clapShake {
          0%,100% { transform:translate(-50%,-50%) scale(1); }
          25%     { transform:translate(-48%,-52%) scale(1.05); }
          75%     { transform:translate(-52%,-48%) scale(1.05); }
        }
        .clap-left-go   { animation: clapLeft  0.12s ease-out forwards; }
        .clap-right-go  { animation: clapRight 0.12s ease-out forwards; }
        .apart-left-go  { animation: apartLeft  0.14s ease-out forwards; }
        .apart-right-go { animation: apartRight 0.14s ease-out forwards; }
        .clap-flash     { animation: clapFlash 0.25s ease-out forwards; }
        .title-reveal   { animation: titleReveal 0.5s ease forwards; }
        `}
      </style>

      {/* Hands */}
      <div style={{ position:"relative", height:120, width:220, display:"flex", alignItems:"center", justifyContent:"center" }}>

        {/* Impact flash */}
        {isClap && (
          <div className="clap-flash" style={{
            position:"absolute", top:"50%", left:"50%",
            transform:"translate(-50%,-50%)",
            fontSize:48, zIndex:10, pointerEvents:"none",
            lineHeight:1,
          }}>✨</div>
        )}

        {/* Left hand */}
        <div className={
          phase===1?"clap-left-go":
          phase===2?"apart-left-go":
          phase===3?"clap-left-go":
          phase===4?"apart-left-go":""
        } style={{
          fontSize:72, lineHeight:1,
          display:"inline-block",
          transformOrigin:"right center",
          marginRight:8,
        }}>👏</div>

      </div>

      {/* CLAP text burst */}
      {isClap && (
        <div className="clap-flash" style={{
          fontSize:28, fontWeight:900, color:red,
          letterSpacing:6, fontFamily:"'Oswald',sans-serif",
          textShadow:`0 0 20px ${red}`,
          marginTop:-20,
        }}>CLAP</div>
      )}

      {/* Title fades in after claps */}
      {phase === 4 && (
        <div className="title-reveal" style={{ textAlign:"center", marginTop:32 }}>
          <div style={{ fontSize:9, letterSpacing:5, color:"rgba(255,120,120,0.45)", marginBottom:6, fontWeight:300 }}>✦ GARAGE BAR ✦</div>
          <div className="neon-title" style={{ fontSize:36 }}>The COCKpit</div>
          <div style={{ color:dim, fontSize:11, letterSpacing:3, marginTop:16 }}>
            <span className="spinner">⟳</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── MAIN APP ───────────────────────────────────────── */
export default function App() {
  const [myName, setMyName]         = useState(()=>localStorage.getItem("cockpit_user")||null);
  const [crew, setCrew]             = useState([]);
  const [tonight, setTonight]       = useState(null);
  const [events, setEvents]         = useState([]);
  const [reviews, setReviews]       = useState([]);
  const [recs, setRecs]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [notifBanner, setNotifBanner] = useState(null);
  const [notifAsked, setNotifAsked] = useState(()=>localStorage.getItem("cockpit_notif_asked")||false);
  const [error, setError]           = useState(null);
  const [activeTab, setActiveTab]   = useState("Status");
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [showSwitch, setShowSwitch] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const isHost = crew.find(m=>m.name===myName)?.isHost===true || crew.find(m=>m.name===myName)?.isHost==="TRUE";

  const handleSelectName = (name) => {
    localStorage.setItem("cockpit_user", name);
    setMyName(name);
  };

  const fetchAll = useCallback(async () => {
    try {
      const [crewRes, tonightRes, eventsRes, reviewsRes, recsRes] = await Promise.all([
        apiGet("getCrew"),
        apiGet("getTonight"),
        apiGet("getEvents"),
        apiGet("getReviews"),
        apiGet("getRecs"),
      ]);
      if (crewRes.crew)        setCrew(crewRes.crew);
      if (tonightRes.tonight)  setTonight(tonightRes.tonight);
      if (eventsRes.events)    setEvents(eventsRes.events);
      if (reviewsRes.reviews)  setReviews(reviewsRes.reviews);
      if (recsRes.recs)        setRecs(recsRes.recs);
      setError(null);
    } catch(e) {
      setError("Couldn't reach The Cockpit. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(()=>{
    // Always fetch crew so NamePicker has data even before name is chosen
    if (!myName) {
      apiGet("getCrew").then(res => {
        if (res.crew) setCrew(res.crew);
        setLoading(false);
      }).catch(()=>setLoading(false));
      return;
    }
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return ()=>clearInterval(interval);
  },[myName, fetchAll]);

  // Request notification permission once per device
  useEffect(() => {
    if (myName && !notifAsked && "Notification" in window) {
      const t = setTimeout(async () => {
        try {
          localStorage.setItem("cockpit_notif_asked", "true");
          setNotifAsked(true);
          console.log("Cockpit: requesting notification permission for", myName);
          const token = await requestNotificationPermission(myName);
          console.log("Cockpit: got token", token ? "YES" : "NO", token);
        } catch(err) {
          console.error("Cockpit: notification setup failed", err);
        }
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [myName, notifAsked]);

  // Show banner for foreground notifications (app is open)
  useEffect(() => {
    if (!myName) return;
    const unsub = onForegroundMessage((payload) => {
      const title = payload.notification?.title || "The Cockpit";
      const body  = payload.notification?.body  || "";
      setNotifBanner({ title, body });
      setTimeout(() => setNotifBanner(null), 5000);
    });
    return unsub;
  }, [myName]);

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
    await apiPost({ action:"addEvent", date:event.date, title:event.title, note:event.note, time:event.time });
    await fetchAll();
  };

  const deleteEvent = async (index) => {
    await apiPost({ action:"deleteEvent", index });
    await fetchAll();
  };

  const submitReview = async (stars, text) => {
    await apiPost({ action:"addReview", name:myName, stars, text });
    await fetchAll();
  };

  const deleteReview = async (index) => {
    await apiPost({ action:"deleteReview", index });
    await fetchAll();
  };

  const sendCockKnock = async () => {
    await apiPost({ action:"cockKnock", name:myName });
    await fetchAll();
  };

  const denyKnock = async () => {
    await apiPost({ action:"denyKnock" });
    await fetchAll();
  };

  const addRec = async (rec) => {
    await apiPost({ action:"addRec", ...rec, name:myName });
    await fetchAll();
  };

  const deleteRec = async (index) => {
    await apiPost({ action:"deleteRec", index });
    await fetchAll();
  };

  const editRec = async (index, rec) => {
    await apiPost({ action:"editRec", index, ...rec });
    await fetchAll();
  };

  const sendJuliaAlert = async () => {
    await apiPost({ action:"juliaAlert" });
  };

  const setScheduledTime = async (time) => {
    await apiPost({ action:"setScheduled", time });
    await fetchAll();
  };

  /* ── CLEAN OPEN TIME ── */
  const cleanTime = (t) => {
    if (!t) return "";
    const s = String(t);
    // If it looks like a proper time (e.g. "8:42 PM") just return it
    if (/^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(s.trim())) return s.trim();
    // If it's a date string or ISO, try to extract just the time
    const d = new Date(s);
    if (!isNaN(d)) return d.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",timeZone:"America/New_York"});
    return "";
  };
  const isOpen         = tonight?.isOpen===true||tonight?.isOpen==="TRUE";
  const walkins        = tonight?.walkins||[];
  const checkedInCrew  = crew.filter(m=>m.checkedIn===true||m.checkedIn==="TRUE");
  const checkedInNames = checkedInCrew.map(m=>m.name);
  const checkedInTotal = checkedInCrew.length + walkins.length;
  const hosts          = crew.filter(m=>m.isHost===true||m.isHost==="TRUE");
  const regulars       = crew.filter(m=>!(m.isHost===true||m.isHost==="TRUE"));
  const myData         = crew.find(m=>m.name===myName);
  const myCheckedIn    = checkedInNames.includes(myName);

  if (!myName) {
    if (loading || crew.length === 0) return (
      <div style={{ background:bg, minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, fontFamily:"'Oswald',sans-serif" }}>
        <style>{css}</style>
        <div className="neon-title" style={{ fontSize:32 }}>The COCKpit</div>
        <Spinner />
      </div>
    );
    return <NamePicker onSelect={handleSelectName} crew={crew} />;
  }

  if (loading) return <ClapLoader />;

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
            <div style={{ fontSize:18, color:txt, fontWeight:700, marginBottom:16, letterSpacing:1 }}>Switch User</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
              {crew.map(member=>(
                <button key={member.name} onClick={()=>{ handleSelectName(member.name); setShowSwitch(false); }} style={{ display:"flex", alignItems:"center", gap:8, background:myName===member.name?"rgba(255,50,50,0.18)":bgCard, border:`1px solid ${myName===member.name?"rgba(255,80,80,0.4)":border}`, borderRadius:8, padding:"10px 12px", color:txt, fontFamily:"'Oswald',sans-serif", fontWeight:600, fontSize:13, cursor:"pointer" }}>
                  <span style={{ fontSize:20 }}>{member.avatar||"👤"}</span>
                  <span>{member.name}</span>
                </button>
              ))}
            </div>
            <button onClick={()=>setShowSwitch(false)} style={{ width:"100%", padding:"10px", background:"rgba(255,255,255,0.05)", border:`1px solid ${border}`, borderRadius:7, color:txt3, fontSize:11, letterSpacing:2, textTransform:"uppercase", fontFamily:"'Oswald',sans-serif", cursor:"pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ fontFamily:"'Oswald',sans-serif", background:bg, minHeight:"100vh", color:txt, maxWidth:430, margin:"0 auto", position:"relative", overflow:"hidden" }}>

        {/* Foreground notification banner */}
        {notifBanner && (
          <div onClick={()=>setNotifBanner(null)} style={{
            position:"fixed", top:16, left:"50%", transform:"translateX(-50%)",
            width:"calc(100% - 32px)", maxWidth:400,
            background:"#1e1e22", border:`1px solid rgba(255,80,80,0.4)`,
            borderRadius:12, padding:"14px 16px",
            boxShadow:"0 8px 32px rgba(0,0,0,0.6)",
            zIndex:2000, cursor:"pointer",
            animation:"fadeUp .3s ease",
          }}>
            <div style={{ display:"flex", gap:12, alignItems:"center" }}>
              <span style={{ fontSize:28 }}>🍺</span>
              <div>
                <div style={{ fontSize:14, color:txt, fontWeight:700 }}>{notifBanner.title}</div>
                {notifBanner.body && <div style={{ fontSize:12, color:txt2, marginTop:2 }}>{notifBanner.body}</div>}
              </div>
              <span style={{ marginLeft:"auto", color:dim, fontSize:18 }}>✕</span>
            </div>
          </div>
        )}

        {/* Subtle red glow top */}
        <div style={{ position:"fixed", top:-120, left:"50%", transform:"translateX(-50%)", width:400, height:260, borderRadius:"50%", pointerEvents:"none", zIndex:0, background:isOpen?"radial-gradient(ellipse,rgba(255,30,30,0.1) 0%,transparent 70%)":"none", transition:"background 1.2s ease" }} />

        {/* ── HEADER ── */}
        <div style={{ textAlign:"center", padding:"26px 20px 16px", borderBottom:`1px solid ${border}`, position:"relative", zIndex:1, background:bg }}>
          <button onClick={()=>setShowSwitch(true)} style={{ position:"absolute", top:14, right:14, display:"flex", alignItems:"center", gap:6, background:bgCard, border:`1px solid ${border}`, borderRadius:20, padding:"5px 10px 5px 7px", cursor:"pointer" }}>
            <span style={{ fontSize:16 }}>{getAvatar(crew, myName)}</span>
            <span style={{ fontSize:11, color:txt2, fontFamily:"'Oswald',sans-serif", letterSpacing:.5, fontWeight:500 }}>{myName}</span>
          </button>

          {/* Neon sign */}
          <div style={{ display:"inline-block", background:"#120404", border:"2px solid rgba(255,50,50,0.2)", borderRadius:14, padding:"10px 28px 14px", marginBottom:14, boxShadow:isOpen?"0 0 36px rgba(255,20,20,0.25),inset 0 0 20px rgba(255,0,0,0.04)":"none", transition:"box-shadow 1.2s ease" }}>
            <div style={{ fontSize:9, letterSpacing:5, color:"rgba(255,120,120,0.4)", marginBottom:5, fontWeight:300 }}>✦ GARAGE BAR ✦</div>
            <div className={isOpen?"neon-title":"dark-title"} style={{ fontSize:36, lineHeight:1.1 }}>The COCKpit</div>
          </div>

          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:14 }}>
            <div className={isOpen?"live-dot":""} style={{ width:8, height:8, borderRadius:"50%", background:isOpen?"#ff3333":"#3a1010", transition:"background .6s" }} />
            <span style={{ fontSize:16, letterSpacing:3, textTransform:"uppercase", color:isOpen?"#ff6060":dim, fontWeight:500 }}>
              {isOpen?`Open Since ${cleanTime(tonight?.openTime)}`: "Closed"}
            </span>
            {isOpen && <span style={{ background:"rgba(255,50,50,0.15)", border:"1px solid rgba(255,80,80,0.3)", borderRadius:5, padding:"3px 10px", fontSize:11, letterSpacing:1, color:"#ff8080" }}>{checkedInTotal} inside</span>}
          </div>

          {/* Scheduled time display — show to everyone when set */}
          {!isOpen && tonight?.scheduledTime && (
            <div style={{ marginBottom:12, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              <span style={{ fontSize:14, color:"#ffaa00", fontWeight:600, letterSpacing:1 }}>
                🕐 Scheduled to open tonight at {tonight.scheduledTime}
              </span>
              {isHost && (
                <button onClick={()=>setScheduledTime("")} style={{ background:"none", border:"none", color:dim, fontSize:14, cursor:"pointer", padding:"0 4px" }}>✕</button>
              )}
            </div>
          )}

          {isHost && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
              <button onClick={toggleBar} disabled={actionLoading} style={{ background:isOpen?"rgba(255,50,50,0.1)":"rgba(255,50,50,0.2)", border:`1px solid ${isOpen?"rgba(255,80,80,0.25)":"rgba(255,80,80,0.5)"}`, borderRadius:7, padding:"9px 24px", color:isOpen?"#ff7070":txt, fontSize:12, letterSpacing:3, textTransform:"uppercase", fontFamily:"'Oswald',sans-serif", fontWeight:600, cursor:"pointer" }}>
                {actionLoading?"...":isOpen?"Lock Up":"Open The Bar"}
              </button>
              {!isOpen && <ScheduleOpening scheduledTime={tonight?.scheduledTime} onSet={setScheduledTime} />}
            </div>
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
                fontSize:16, letterSpacing:3, textTransform:"uppercase",
                fontFamily:"'Oswald',sans-serif", fontWeight:700,
                boxShadow:myCheckedIn?"0 0 20px rgba(255,50,50,0.12)":"none",
                transition:"all .2s", cursor:"pointer",
              }}>
                {actionLoading?"...":myCheckedIn?"You're Inside — Tap to Leave":"Tap to Check In"}
              </button>

              {/* Quick Actions — separated from check-in */}
              <div style={{ marginTop:28, marginBottom:14, display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.08)" }} />
                <div style={{ fontSize:11, color:dim, letterSpacing:3, fontFamily:"'Oswald',sans-serif", fontWeight:500 }}>QUICK ACTIONS</div>
                <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.08)" }} />
              </div>

              {/* Julia Alert — always visible */}
              <button onClick={sendJuliaAlert} style={{
                width:"100%", marginTop:10, padding:"16px",
                background:"rgba(255,200,0,0.08)",
                border:"1px solid rgba(255,200,0,0.3)",
                borderRadius:10, color:"#ffcc00",
                fontSize:15, letterSpacing:2, textTransform:"uppercase",
                fontFamily:"'Oswald',sans-serif", fontWeight:700,
                cursor:"pointer", transition:"all .2s",
              }}>
                🚨 Julia Alert
              </button>

              {/* Cock Knock — only show when bar is closed and you're not a host */}
              {!isOpen && !isHost && (
                <div style={{ marginTop:10 }}>
                  <button onClick={sendCockKnock} disabled={actionLoading} style={{
                    width:"100%", padding:"16px",
                    background:"rgba(255,149,0,0.1)",
                    border:"1px solid rgba(255,149,0,0.35)",
                    borderRadius:10, color:"#ffaa00",
                    fontSize:15, letterSpacing:2, textTransform:"uppercase",
                    fontFamily:"'Oswald',sans-serif", fontWeight:700,
                    cursor:"pointer", transition:"all .2s",
                  }}>
                    🚪 Cock Knock
                  </button>
                  {(tonight?.knocks || 0) > 0 && (
                    <div style={{
                      marginTop:10, padding:"12px 16px",
                      background:"rgba(255,149,0,0.07)",
                      border:"1px solid rgba(255,149,0,0.2)",
                      borderRadius:10, textAlign:"center",
                    }}>
                      <div style={{ fontSize:28, marginBottom:4 }}>🚪</div>
                      <div style={{ fontSize:16, color:"#ffaa00", fontWeight:700 }}>
                        There are currently {tonight.knocks} Cock Knocker{tonight.knocks === 1 ? "" : "s"}
                      </div>
                      <div style={{ fontSize:13, color:dim, marginTop:4 }}>
                        John & Melissa have been notified 🚪
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Show knock counter to hosts too */}
              {!isOpen && isHost && (tonight?.knocks || 0) > 0 && (
                <div style={{
                  marginTop:10, padding:"14px 16px",
                  background:"rgba(255,149,0,0.07)",
                  border:"1px solid rgba(255,149,0,0.2)",
                  borderRadius:10, textAlign:"center",
                }}>
                  <div style={{ fontSize:28, marginBottom:4 }}>🚪</div>
                  <div style={{ fontSize:16, color:"#ffaa00", fontWeight:700, marginBottom:4 }}>
                    There are currently {tonight.knocks} Cock Knocker{tonight.knocks === 1 ? "" : "s"}
                  </div>
                  <div style={{ fontSize:13, color:dim, marginBottom:12 }}>
                    {(tonight.knockers||[]).join(", ")}
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={denyKnock} style={{
                      flex:1, padding:"10px",
                      background:"rgba(255,50,50,0.15)",
                      border:"1px solid rgba(255,80,80,0.35)",
                      borderRadius:8, color:red,
                      fontSize:12, letterSpacing:2, textTransform:"uppercase",
                      fontFamily:"'Oswald',sans-serif", fontWeight:700, cursor:"pointer",
                    }}>🚫 Deny</button>
                    <div style={{ flex:1, padding:"10px", fontSize:12, color:dim, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      or open the bar
                    </div>
                  </div>
                </div>
              )}

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
                      <span style={{ fontSize:28 }}>{getAvatar(crew, m.name)}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:3 }}>
                          <span style={{ fontSize:18, color:txt, fontWeight:700 }}>{m.name}</span>
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
                        <span style={{ fontSize:26 }}>{getAvatar(crew, m.name)}</span>
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

          {/* WEATHER */}
          {activeTab==="Weather" && <WeatherTab />}

          {/* BOARD */}
          {activeTab==="Board" && (
            <div>
              <Label>Most Visits All-Time</Label>
              {[...crew].sort((a,b)=>Number(b.visits)-Number(a.visits)).map((m,i)=>(
                <Card key={m.name} highlight={i===0} style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <span style={{ fontSize:16, width:28, textAlign:"center", color:i===0?red:dim }}>
                    {i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}
                  </span>
                  <span style={{ fontSize:24 }}>{getAvatar(crew, m.name)}</span>
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

          {/* RECS */}
          {activeTab==="Recs" && (
            <RecsTab
              recs={recs}
              myName={myName}
              isHost={isHost}
              onAdd={addRec}
              onDelete={deleteRec}
              onEdit={editRec}
            />
          )}

          {/* REVIEWS */}
          {activeTab==="Reviews" && (
            <ReviewsTab
              reviews={reviews}
              myName={myName}
              isHost={isHost}
              onSubmit={submitReview}
              onDelete={deleteReview}
            />
          )}

        </div>

        {/* Footer */}
        <div style={{ height:44, borderTop:`1px solid ${border}`, display:"flex", alignItems:"center", justifyContent:"center", color:dim, fontSize:9, letterSpacing:4, textTransform:"uppercase", fontWeight:300 }}>
          Members Only · All Roads Lead to Happy Hour
        </div>
      </div>
    </>
  );
}
