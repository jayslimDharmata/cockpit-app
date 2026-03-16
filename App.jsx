import { useState, useEffect, useCallback } from "react";

/* ─── API ───────────────────────────────────────────── */
const API = "https://script.google.com/macros/s/AKfycbzq-SohecQc4eKbre6TJrW7T50isYP-IrAyMvRZpq5uYyaDPeIxDNivmB5rxY3w74xN/exec";

async function apiGet(action) {
  const res = await fetch(`${API}?action=${action}`);
  return res.json();
}

async function apiPost(data) {
  const res = await fetch(API, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
}

/* ─── STATIC DATA ───────────────────────────────────── */
const HOSTS = ["John", "Melissa"];

const AVATARS = {
  "John": "👨‍🍳", "Melissa": "👩‍🍳", "The Mayor": "🎩",
  "Michele": "💃", "Vice": "😏", "April": "🌸",
  "Rashawn": "🔥", "Tess": "⭐", "Garrett": "🤙",
  "Lindsey": "🦋", "Jay": "🕶️",
};

const CREW_NAMES = ["John","Melissa","The Mayor","Michele","Vice","April","Rashawn","Tess","Garrett","Lindsey","Jay"];

const DRINKS = [
  { name:"Tito's",               sub:"Handmade Vodka",      emoji:"🥃", color:"#e8c07a", desc:"On the rocks, soda, whatever — the house standard.",                         fans:["The Mayor","April","Lindsey","Jay"] },
  { name:"Coors Banquet",        sub:"The Banquet Beer",    emoji:"🍺", color:"#f0c040", desc:"Cold, classic, always in the cooler.",                                        fans:["John","Vice","Garrett"] },
  { name:"Smoked Old Fashioned", sub:"Rashawn's Specialty", emoji:"🪵", color:"#e07850", desc:"Bourbon, bitters, sugar cube — and Rashawn's smoke gun. The house cocktail.", fans:["Rashawn"] },
  { name:"MomWater",             sub:"Spiked Sparkling",    emoji:"💧", color:"#7ad0e8", desc:"Fruity, light, and dangerously drinkable.",                                   fans:["Melissa","Michele","Tess"] },
];

const BADGES = [
  { icon:"🌙", label:"Last Call",  desc:"Closed the bar 5x",    earned:true  },
  { icon:"⚡", label:"First In",   desc:"First to arrive 10x",  earned:true  },
  { icon:"🪵", label:"Smoke Show", desc:"Rashawn fired up 10x", earned:false },
  { icon:"🎯", label:"Dart King",  desc:"Won 10 in a row",      earned:false },
  { icon:"👑", label:"Regular",    desc:"50+ total visits",     earned:true  },
  { icon:"🔥", label:"On Fire",    desc:"5 visits in a week",   earned:false },
];

const TV_PRESETS = [
  { label:"No game on",        icon:"📺", detail:"" },
  { label:"Braves Game",       icon:"⚾", detail:"ATL · ESPN" },
  { label:"Heat Game",         icon:"🏀", detail:"MIA · Bally Sports" },
  { label:"Lightning Game",    icon:"🏒", detail:"TB · ESPN+" },
  { label:"Bucs Game",         icon:"🏈", detail:"TB · NBC" },
  { label:"UFC / Boxing",      icon:"🥊", detail:"Main card live" },
  { label:"Golf",              icon:"⛳", detail:"Live on CBS" },
  { label:"NASCAR",            icon:"🏁", detail:"Live on FOX" },
  { label:"Something else...", icon:"🎲", detail:"" },
];

const tabs = ["Status","Crew","Menu","Board"];

/* ─── STYLES ────────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Oswald:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap');

  @keyframes neonFlicker {
    0%,19%,21%,23%,25%,54%,56%,100% {
      text-shadow:0 0 4px #fff,0 0 11px #fff,0 0 19px #fff,
        0 0 40px #ff2020,0 0 80px #ff2020,0 0 100px #ff2020;
      opacity:1;
    }
    20%,24%,55% { text-shadow:none; opacity:.82; }
  }
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(10px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes dotBlink {
    0%,100% { opacity:1;  box-shadow:0 0 8px #ff2020; }
    50%      { opacity:.2; box-shadow:none; }
  }
  @keyframes tvScanline {
    0%   { top:-10%; }
    100% { top:110%; }
  }
  @keyframes crtFlicker {
    0%,100% { opacity:1; }
    93%     { opacity:.87; }
    94%     { opacity:1; }
  }
  @keyframes channelFlip {
    0%  { opacity:0; transform:scaleY(0.04); }
    40% { opacity:1; transform:scaleY(1.02); }
    100%{ transform:scaleY(1); }
  }
  @keyframes spin {
    from { transform:rotate(0deg); }
    to   { transform:rotate(360deg); }
  }
  @keyframes welcomePulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(255,32,32,0.4); }
    50%     { box-shadow: 0 0 0 12px rgba(255,32,32,0); }
  }

  html, body { margin:0; padding:0; background:#080000; }

  .neon-title   { font-family:'Permanent Marker',cursive!important; animation:neonFlicker 5s infinite; color:#fff; }
  .dark-title   { font-family:'Permanent Marker',cursive!important; color:#4a1010; }
  .tab-content  { animation:fadeUp .22s ease forwards; }
  .live-dot     { animation:dotBlink 1.4s ease infinite; }
  .mono         { font-family:'Share Tech Mono',monospace!important; }
  .tv-screen    { animation:crtFlicker 9s infinite; }
  .tv-scanline  { position:absolute; left:0; right:0; height:18%; background:linear-gradient(transparent,rgba(255,255,255,0.025),transparent); animation:tvScanline 4s linear infinite; pointer-events:none; z-index:10; }
  .channel-flip { animation:channelFlip .3s ease forwards; }
  .spinner      { animation:spin .8s linear infinite; display:inline-block; }
  .name-btn:hover { transform:translateY(-2px); background:rgba(255,32,32,0.18) !important; border-color:rgba(255,80,80,0.5) !important; }
  * { box-sizing:border-box; }
`;

const txt  = "#ffffff";
const txt2 = "#cccccc";
const txt3 = "#999999";
const dim  = "#555555";

/* ─── HELPERS ───────────────────────────────────────── */
function Label({ children, style={} }) {
  return (
    <div style={{
      fontSize:11, letterSpacing:3, textTransform:"uppercase",
      color:"#ff6060", marginBottom:12,
      borderLeft:"2px solid #ff2020", paddingLeft:9,
      fontFamily:"'Oswald',sans-serif", fontWeight:600, ...style,
    }}>{children}</div>
  );
}

function Card({ children, highlight=false, onClick, style={} }) {
  return (
    <div onClick={onClick} style={{
      padding:"12px 14px", borderRadius:9, marginBottom:8,
      background:highlight?"rgba(255,32,32,0.12)":"rgba(255,255,255,0.05)",
      border:`1px solid ${highlight?"rgba(255,80,80,0.4)":"rgba(255,255,255,0.1)"}`,
      cursor:onClick?"pointer":"default",
      transition:"all .15s", ...style,
    }}>{children}</div>
  );
}

function Spinner() {
  return <span className="spinner" style={{ fontSize:16, color:"#ff5050" }}>⟳</span>;
}

/* ─── NAME PICKER SCREEN ────────────────────────────── */
function NamePicker({ onSelect }) {
  return (
    <div style={{ background:"#080000", minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", padding:"40px 20px 30px", fontFamily:"'Oswald',sans-serif" }}>
      <style>{css}</style>

      {/* Sign */}
      <div style={{ display:"inline-block", background:"rgba(18,0,0,0.75)", border:"2px solid rgba(255,50,50,0.22)", borderRadius:14, padding:"12px 32px 16px", marginBottom:10, boxShadow:"0 0 40px rgba(255,20,20,0.3)" }}>
        <div style={{ fontSize:9, letterSpacing:5, color:"rgba(255,120,120,0.45)", marginBottom:5, fontWeight:300, textAlign:"center" }}>✦ GARAGE BAR ✦</div>
        <div className="neon-title" style={{ fontSize:34, lineHeight:1.1, textAlign:"center" }}>The COCKpit</div>
      </div>

      <div style={{ fontSize:13, color:txt3, letterSpacing:2, marginBottom:32, textAlign:"center" }}>WHO ARE YOU?</div>

      <div style={{ width:"100%", maxWidth:380, display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {CREW_NAMES.map(name => (
          <button key={name} className="name-btn" onClick={() => onSelect(name)} style={{
            display:"flex", alignItems:"center", gap:10,
            background:"rgba(255,255,255,0.05)",
            border:"1px solid rgba(255,255,255,0.12)",
            borderRadius:10, padding:"14px 16px",
            color:txt, cursor:"pointer",
            fontFamily:"'Oswald',sans-serif", fontWeight:600,
            fontSize:14, letterSpacing:.5,
            transition:"all .2s",
          }}>
            <span style={{ fontSize:24 }}>{AVATARS[name] || "👤"}</span>
            <span>{name}</span>
            {HOSTS.includes(name) && (
              <span style={{ fontSize:8, color:"#ff8080", background:"rgba(255,32,32,0.2)", padding:"2px 5px", borderRadius:3, letterSpacing:1, marginLeft:"auto" }}>HOST</span>
            )}
          </button>
        ))}
      </div>

      <div style={{ marginTop:24, fontSize:10, color:dim, letterSpacing:1, textAlign:"center", lineHeight:1.6 }}>
        Your choice is saved on this device.<br/>You won't be asked again.
      </div>
    </div>
  );
}

/* ─── TV WIDGET ─────────────────────────────────────── */
function TVWidget({ isHost, whatsOn, onSetWhatsOn }) {
  const [tvOn, setTvOn]             = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [flipping, setFlipping]     = useState(false);
  const [selected, setSelected]     = useState(0);
  const [customText, setCustomText] = useState("");
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    const idx = TV_PRESETS.findIndex(p => p.label === whatsOn);
    if (idx >= 0) setSelected(idx);
    else if (whatsOn && whatsOn !== "No game on") {
      setSelected(TV_PRESETS.length - 1);
      setCustomText(whatsOn);
    }
  }, [whatsOn]);

  const current  = TV_PRESETS[selected];
  const isCustom = selected === TV_PRESETS.length - 1;

  const pick = async (i) => {
    setFlipping(true);
    setSelected(i);
    setTimeout(() => setFlipping(false), 160);
    if (i !== TV_PRESETS.length - 1) {
      setSaving(true);
      await onSetWhatsOn(TV_PRESETS[i].label);
      setSaving(false);
      setShowPicker(false);
    }
  };

  const saveCustom = async () => {
    if (!customText.trim()) return;
    setSaving(true);
    await onSetWhatsOn(customText.trim());
    setSaving(false);
    setShowPicker(false);
  };

  return (
    <div style={{ background:"#0a0202", border:"3px solid #1e0808", borderRadius:10, overflow:"hidden", marginBottom:18, boxShadow:"0 0 0 1px rgba(255,32,32,0.15), 0 8px 32px rgba(0,0,0,0.7)" }}>
      <div style={{ background:"linear-gradient(180deg,#1e0a0a,#130505)", padding:"7px 12px 6px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:tvOn?"#ff2020":"#2a0808", boxShadow:tvOn?"0 0 6px #ff2020":"none" }} />
          <span className="mono" style={{ fontSize:9, color:"rgba(255,255,255,0.4)", letterSpacing:2 }}>TCL · COCKPIT TV</span>
        </div>
        <button onClick={()=>setTvOn(o=>!o)} style={{ background:"none", border:"1px solid rgba(255,255,255,0.15)", borderRadius:3, color:tvOn?"#ff5050":"#444", fontSize:8, padding:"2px 8px", letterSpacing:1, fontFamily:"'Oswald',sans-serif", cursor:"pointer" }}>
          {tvOn ? "ON" : "OFF"}
        </button>
      </div>

      <div className="tv-screen" style={{ background:tvOn?"#060101":"#020000", minHeight:100, position:"relative", overflow:"hidden", transition:"background .4s" }}>
        <div className="tv-scanline" />
        <div style={{ position:"absolute", top:0, left:0, right:0, height:"35%", background:"linear-gradient(180deg,rgba(255,255,255,0.03),transparent)", pointerEvents:"none", zIndex:5 }} />

        {tvOn ? (
          <div className={flipping ? "channel-flip" : ""} style={{ padding:"14px 16px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:10 }}>
              <div style={{ fontSize:40, lineHeight:1, filter:"drop-shadow(0 0 10px rgba(255,100,50,.5))" }}>{current.icon}</div>
              <div style={{ flex:1 }}>
                <div className="mono" style={{ fontSize:8, color:"#ff6060", letterSpacing:3, marginBottom:4 }}>▶ ON THE TV</div>
                <div style={{ fontSize:18, color:txt, fontWeight:700, lineHeight:1.2 }}>
                  {isCustom && customText ? customText : current.label}
                </div>
                {!isCustom && current.detail && <div style={{ fontSize:11, color:txt2, marginTop:4 }}>{current.detail}</div>}
              </div>
              {saving && <Spinner />}
            </div>

            {isHost && !showPicker && (
              <button onClick={()=>setShowPicker(true)} style={{ width:"100%", padding:"7px", background:"rgba(255,32,32,0.1)", border:"1px dashed rgba(255,80,80,0.35)", borderRadius:6, color:"#ff9090", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"'Oswald',sans-serif", fontWeight:500, cursor:"pointer" }}>
                ✏️ Change What's On
              </button>
            )}
            {!isHost && <div className="mono" style={{ textAlign:"center", fontSize:8, color:"#333", letterSpacing:2 }}>JOHN OR MELISSA CAN CHANGE THIS</div>}

            {showPicker && isHost && (
              <div style={{ marginTop:10 }}>
                <div className="mono" style={{ fontSize:8, color:"#ff6060", letterSpacing:2, marginBottom:8 }}>WHAT'S ON?</div>
                <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                  {TV_PRESETS.map((p, i) => (
                    <button key={i} onClick={()=>pick(i)} style={{ display:"flex", alignItems:"center", gap:10, background:selected===i?"rgba(255,32,32,0.18)":"rgba(255,255,255,0.04)", border:`1px solid ${selected===i?"rgba(255,80,80,0.4)":"rgba(255,255,255,0.08)"}`, borderRadius:7, padding:"8px 12px", color:selected===i?txt:txt2, fontSize:12, fontFamily:"'Oswald',sans-serif", fontWeight:selected===i?600:400, cursor:"pointer", textAlign:"left" }}>
                      <span style={{ fontSize:18, minWidth:24 }}>{p.icon}</span>
                      <div>
                        <div>{p.label}</div>
                        {p.detail && <div style={{ fontSize:10, color:txt3, marginTop:1 }}>{p.detail}</div>}
                      </div>
                    </button>
                  ))}
                </div>
                {isCustom && (
                  <div style={{ marginTop:8 }}>
                    <input value={customText} onChange={e=>setCustomText(e.target.value)} placeholder="e.g. 🎬 Top Gun" style={{ width:"100%", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,80,80,0.35)", borderRadius:5, padding:"8px 10px", color:txt, fontSize:12, fontFamily:"'Oswald',sans-serif", outline:"none", marginBottom:8 }} />
                    <button onClick={saveCustom} style={{ width:"100%", padding:"8px", background:"rgba(255,32,32,0.15)", border:"1px solid rgba(255,80,80,0.45)", borderRadius:6, color:txt, fontSize:11, letterSpacing:2, textTransform:"uppercase", fontFamily:"'Oswald',sans-serif", fontWeight:600, cursor:"pointer" }}>Set It</button>
                  </div>
                )}
                <button onClick={()=>setShowPicker(false)} style={{ width:"100%", marginTop:6, padding:"7px", background:"none", border:"none", color:dim, fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"'Oswald',sans-serif", cursor:"pointer" }}>▲ Cancel</button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:100 }}>
            <span className="mono" style={{ fontSize:10, color:"#333", letterSpacing:4 }}>NO SIGNAL</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── WALK-IN MODAL ─────────────────────────────────── */
function WalkInModal({ onClose, onAdd }) {
  const [name, setName]     = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const n = name.trim();
    if (!n) return;
    setSaving(true);
    await onAdd(n);
    setSaving(false);
    onClose();
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ background:"#120404", border:"1px solid rgba(255,80,80,0.35)", borderRadius:12, padding:24, width:"100%", maxWidth:360 }}>
        <div style={{ fontSize:18, color:txt, fontWeight:700, marginBottom:4 }}>👋 Walk-In</div>
        <div style={{ fontSize:12, color:txt3, marginBottom:18 }}>Someone without the app just showed up.</div>
        <div style={{ fontSize:10, color:"#ff8080", letterSpacing:2, marginBottom:6, fontFamily:"'Oswald',sans-serif", fontWeight:500 }}>NAME</div>
        <input autoFocus value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="Their name or nickname"
          style={{ width:"100%", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,80,80,0.35)", borderRadius:6, padding:"10px 12px", color:txt, fontSize:14, fontFamily:"'Oswald',sans-serif", outline:"none", marginBottom:14 }} />
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={submit} disabled={saving} style={{ flex:1, padding:"11px", background:"rgba(255,32,32,0.18)", border:"1px solid rgba(255,80,80,0.5)", borderRadius:7, color:txt, fontSize:12, letterSpacing:2, textTransform:"uppercase", fontFamily:"'Oswald',sans-serif", fontWeight:700, cursor:"pointer" }}>
            {saving ? "Adding..." : "Check In"}
          </button>
          <button onClick={onClose} style={{ flex:1, padding:"11px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:7, color:txt3, fontSize:12, letterSpacing:2, textTransform:"uppercase", fontFamily:"'Oswald',sans-serif", fontWeight:500, cursor:"pointer" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN APP ──────────────────────────────────────── */
export default function App() {
  const [myName, setMyName]         = useState(() => localStorage.getItem("cockpit_user") || null);
  const [crew, setCrew]             = useState([]);
  const [tonight, setTonight]       = useState(null);
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

  /* ── FETCH ── */
  const fetchAll = useCallback(async () => {
    try {
      const [crewRes, tonightRes] = await Promise.all([
        apiGet("getCrew"),
        apiGet("getTonight"),
      ]);
      if (crewRes.crew)       setCrew(crewRes.crew);
      if (tonightRes.tonight) setTonight(tonightRes.tonight);
      setError(null);
    } catch(e) {
      setError("Couldn't reach The Cockpit. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (myName) {
      fetchAll();
      const interval = setInterval(fetchAll, 30000);
      return () => clearInterval(interval);
    }
  }, [myName, fetchAll]);

  /* ── ACTIONS ── */
  const toggleBar = async () => {
    const nowOpen = !(tonight?.isOpen === true || tonight?.isOpen === "TRUE");
    setActionLoading(true);
    const openTime = nowOpen ? new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}) : "";
    if (!nowOpen) {
      await apiPost({ action:"logSession", attendees: checkedInNames.join(", ") });
      await apiPost({ action:"clearNight" });
    }
    await apiPost({ action:"setTonight", isOpen:nowOpen, openTime, whatsOn: tonight?.whatsOn || "No game on" });
    await fetchAll();
    setActionLoading(false);
  };

  const toggleCheckIn = async (name, currentStatus) => {
    const cin = currentStatus === true || currentStatus === "TRUE";
    setActionLoading(true);
    setCrew(c => c.map(m => m.name===name ? {...m, checkedIn:!cin} : m));
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

  /* ── DERIVED STATE ── */
  const isOpen         = tonight?.isOpen === true || tonight?.isOpen === "TRUE";
  const walkins        = tonight?.walkins || [];
  const checkedInCrew  = crew.filter(m => m.checkedIn === true || m.checkedIn === "TRUE");
  const checkedInNames = checkedInCrew.map(m => m.name);
  const checkedInTotal = checkedInCrew.length + walkins.length;
  const hosts          = crew.filter(m => m.isHost === true || m.isHost === "TRUE");
  const regulars       = crew.filter(m => !(m.isHost === true || m.isHost === "TRUE"));
  const myData         = crew.find(m => m.name === myName);
  const myCheckedIn    = checkedInNames.includes(myName);

  /* ── NAME PICKER ── */
  if (!myName) return <NamePicker onSelect={handleSelectName} />;

  /* ── LOADING ── */
  if (loading) return (
    <div style={{ background:"#080000", minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, fontFamily:"'Oswald',sans-serif" }}>
      <style>{css}</style>
      <div className="neon-title" style={{ fontSize:32 }}>The COCKpit</div>
      <div style={{ color:dim, fontSize:11, letterSpacing:3 }}>OPENING UP...</div>
      <Spinner />
    </div>
  );

  /* ── ERROR ── */
  if (error) return (
    <div style={{ background:"#080000", minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12, fontFamily:"'Oswald',sans-serif", padding:24 }}>
      <style>{css}</style>
      <div style={{ fontSize:32 }}>📡</div>
      <div style={{ color:txt, fontSize:14, textAlign:"center" }}>{error}</div>
      <button onClick={fetchAll} style={{ background:"rgba(255,32,32,0.15)", border:"1px solid rgba(255,80,80,0.4)", borderRadius:6, padding:"10px 24px", color:txt, fontSize:11, letterSpacing:2, textTransform:"uppercase", fontFamily:"'Oswald',sans-serif", cursor:"pointer" }}>Try Again</button>
    </div>
  );

  return (
    <>
      <style>{css}</style>
      {showWalkIn && <WalkInModal onClose={()=>setShowWalkIn(false)} onAdd={addWalkIn} />}

      {/* Switch user modal */}
      {showSwitch && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
          <div style={{ background:"#120404", border:"1px solid rgba(255,80,80,0.35)", borderRadius:12, padding:24, width:"100%", maxWidth:360 }}>
            <div style={{ fontSize:16, color:txt, fontWeight:700, marginBottom:16, letterSpacing:1 }}>Switch User</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
              {CREW_NAMES.map(name => (
                <button key={name} onClick={()=>{ handleSelectName(name); setShowSwitch(false); }} style={{ display:"flex", alignItems:"center", gap:8, background:myName===name?"rgba(255,32,32,0.18)":"rgba(255,255,255,0.05)", border:`1px solid ${myName===name?"rgba(255,80,80,0.4)":"rgba(255,255,255,0.1)"}`, borderRadius:8, padding:"10px 12px", color:txt, fontFamily:"'Oswald',sans-serif", fontWeight:600, fontSize:13, cursor:"pointer" }}>
                  <span style={{ fontSize:20 }}>{AVATARS[name]||"👤"}</span>
                  <span>{name}</span>
                </button>
              ))}
            </div>
            <button onClick={()=>setShowSwitch(false)} style={{ width:"100%", padding:"10px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:7, color:txt3, fontSize:11, letterSpacing:2, textTransform:"uppercase", fontFamily:"'Oswald',sans-serif", cursor:"pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ fontFamily:"'Oswald',sans-serif", background:"#080000", minHeight:"100vh", color:txt, maxWidth:430, margin:"0 auto", position:"relative", overflow:"hidden" }}>

        {/* Ambient glow */}
        <div style={{ position:"fixed", top:-140, left:"50%", transform:"translateX(-50%)", width:500, height:320, borderRadius:"50%", pointerEvents:"none", zIndex:0, background:isOpen?"radial-gradient(ellipse,rgba(255,20,20,0.2) 0%,transparent 65%)":"radial-gradient(ellipse,rgba(40,0,0,0.1) 0%,transparent 65%)", transition:"background 1.2s ease" }} />
        <div style={{ position:"fixed", inset:0, background:"radial-gradient(ellipse at center,transparent 50%,rgba(0,0,0,0.65) 100%)", pointerEvents:"none", zIndex:0 }} />

        {/* ── HEADER ── */}
        <div style={{ textAlign:"center", padding:"26px 20px 16px", borderBottom:"1px solid rgba(255,80,80,0.18)", position:"relative", zIndex:1 }}>

          {/* Current user + switch */}
          <button onClick={()=>setShowSwitch(true)} style={{ position:"absolute", top:12, right:14, display:"flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:20, padding:"5px 10px 5px 6px", cursor:"pointer" }}>
            <span style={{ fontSize:16 }}>{AVATARS[myName]||"👤"}</span>
            <span style={{ fontSize:10, color:txt2, fontFamily:"'Oswald',sans-serif", letterSpacing:1 }}>{myName}</span>
          </button>

          {/* Neon sign */}
          <div style={{ display:"inline-block", background:"rgba(18,0,0,0.75)", border:"2px solid rgba(255,50,50,0.22)", borderRadius:14, padding:"10px 28px 14px", marginBottom:14, boxShadow:isOpen?"0 0 40px rgba(255,20,20,0.3),inset 0 0 24px rgba(255,0,0,0.04)":"none", transition:"box-shadow 1.2s ease" }}>
            <div style={{ fontSize:9, letterSpacing:5, color:"rgba(255,120,120,0.45)", marginBottom:5, fontWeight:300 }}>✦ GARAGE BAR ✦</div>
            <div className={isOpen?"neon-title":"dark-title"} style={{ fontSize:36, lineHeight:1.1 }}>The COCKpit</div>
          </div>

          {/* Status */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:14 }}>
            <div className={isOpen?"live-dot":""} style={{ width:8, height:8, borderRadius:"50%", background:isOpen?"#ff2020":"#2a0a0a", transition:"background .6s" }} />
            <span style={{ fontSize:12, letterSpacing:3, textTransform:"uppercase", color:isOpen?"#ff7070":dim, fontWeight:500 }}>
              {isOpen ? `Open Since ${tonight?.openTime || ""}` : "Closed"}
            </span>
            {isOpen && <span style={{ background:"rgba(255,32,32,0.15)", border:"1px solid rgba(255,80,80,0.3)", borderRadius:4, padding:"2px 9px", fontSize:10, letterSpacing:1, color:"#ff9090" }}>{checkedInTotal} inside</span>}
          </div>

          {isHost && (
            <button onClick={toggleBar} disabled={actionLoading} style={{ background:isOpen?"rgba(255,32,32,0.1)":"rgba(255,32,32,0.2)", border:`1px solid ${isOpen?"rgba(255,80,80,0.28)":"rgba(255,80,80,0.55)"}`, borderRadius:6, padding:"8px 22px", color:isOpen?"#ff8080":txt, fontSize:11, letterSpacing:3, textTransform:"uppercase", fontFamily:"'Oswald',sans-serif", fontWeight:600, cursor:"pointer" }}>
              {actionLoading ? "..." : isOpen ? "🔒  Close The Bar" : "🟢  Open The Bar"}
            </button>
          )}
        </div>

        {/* ── TABS ── */}
        <div style={{ display:"flex", borderBottom:"1px solid rgba(255,80,80,0.14)", position:"sticky", top:0, background:"rgba(8,0,0,0.97)", backdropFilter:"blur(8px)", zIndex:10 }}>
          {tabs.map(tab=>(
            <button key={tab} onClick={()=>setActiveTab(tab)} style={{ flex:"1", padding:"13px 8px", background:"none", border:"none", borderBottom:activeTab===tab?"2px solid #ff3030":"2px solid transparent", color:activeTab===tab?txt:txt3, fontSize:11, letterSpacing:2, textTransform:"uppercase", fontFamily:"'Oswald',sans-serif", fontWeight:activeTab===tab?600:400, cursor:"pointer", transition:"color .18s" }}>
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
              <TVWidget isHost={isHost} whatsOn={tonight?.whatsOn || "No game on"} onSetWhatsOn={setWhatsOn} />

              <Label>Your Check-In</Label>
              <button onClick={()=>toggleCheckIn(myName, myData?.checkedIn)} disabled={actionLoading} style={{
                width:"100%", padding:"15px",
                background:myCheckedIn?"rgba(255,32,32,0.12)":"rgba(255,255,255,0.05)",
                border:`1px solid ${myCheckedIn?"rgba(255,80,80,0.4)":"rgba(255,255,255,0.12)"}`,
                borderRadius:8, color:myCheckedIn?txt:txt3,
                fontSize:13, letterSpacing:3, textTransform:"uppercase",
                fontFamily:"'Oswald',sans-serif", fontWeight:700,
                boxShadow:myCheckedIn?"0 0 20px rgba(255,32,32,0.15)":"none",
                transition:"all .2s", cursor:"pointer",
              }}>
                {actionLoading ? "..." : myCheckedIn ? `✅  You're Inside — Tap to Leave` : `👋  Tap to Check In`}
              </button>

              {isHost && (
                <button onClick={()=>setShowWalkIn(true)} style={{ width:"100%", marginTop:10, padding:"12px", background:"rgba(255,255,255,0.04)", border:"1px dashed rgba(255,255,255,0.18)", borderRadius:8, color:txt2, fontSize:11, letterSpacing:3, textTransform:"uppercase", fontFamily:"'Oswald',sans-serif", fontWeight:500, cursor:"pointer" }}>
                  🚶 Add Walk-In Guest
                </button>
              )}

              {walkins.length > 0 && (
                <div style={{ marginTop:16 }}>
                  <Label>Walk-Ins Tonight</Label>
                  {walkins.map((w,i)=>(
                    <Card key={i} highlight style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontSize:22 }}>🚶</span>
                      <span style={{ flex:1, fontSize:14, color:txt, fontWeight:600 }}>{w}</span>
                      <span style={{ fontSize:10, color:txt3, letterSpacing:1 }}>walk-in</span>
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
                const cin = m.checkedIn===true||m.checkedIn==="TRUE";
                return (
                  <Card key={m.name} highlight={cin}>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <span style={{ fontSize:26 }}>{AVATARS[m.name]||"👤"}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:2 }}>
                          <span style={{ fontSize:15, color:txt, fontWeight:700 }}>{m.name}</span>
                          <span style={{ fontSize:9, color:"#ff8080", background:"rgba(255,32,32,0.18)", padding:"2px 7px", borderRadius:3, letterSpacing:1 }}>HOST</span>
                        </div>
                        <div style={{ fontSize:11, color:"#ff9090" }}>🥤 {m.drink}</div>
                        <div style={{ fontSize:10, color:dim, marginTop:1 }}>{m.visits} visits</div>
                      </div>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:cin?"#ff2020":"#222", boxShadow:cin?"0 0 6px #ff2020":"none" }} />
                    </div>
                  </Card>
                );
              })}

              <div style={{ marginTop:16 }}>
                <Label>VIPs</Label>
                {regulars.map(m=>{
                  const cin = m.checkedIn===true||m.checkedIn==="TRUE";
                  return (
                    <Card key={m.name} highlight={cin} onClick={()=>toggleCheckIn(m.name, m.checkedIn)} style={{ cursor:"pointer" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                        <span style={{ fontSize:24 }}>{AVATARS[m.name]||"👤"}</span>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                            <span style={{ fontSize:14, color:txt, fontWeight:600 }}>{m.name}</span>
                            {m.name==="Rashawn" && <span style={{ fontSize:9, color:"#e07850", background:"rgba(224,120,80,0.18)", padding:"2px 7px", borderRadius:3, letterSpacing:1 }}>SMOKE MASTER</span>}
                          </div>
                          <div style={{ fontSize:11, color:"#ff9090" }}>🥤 {m.drink}</div>
                          <div style={{ fontSize:10, color:dim, marginTop:1 }}>{m.visits} visits</div>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ width:8, height:8, borderRadius:"50%", background:cin?"#ff2020":"#222", boxShadow:cin?"0 0 6px #ff2020":"none", marginLeft:"auto" }} />
                          <div style={{ fontSize:9, color:cin?"#ff7070":dim, marginTop:4, letterSpacing:1 }}>{cin?"IN":"OUT"}</div>
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
                      <span style={{ flex:1, fontSize:14, color:txt, fontWeight:600 }}>{w}</span>
                      <span style={{ fontSize:10, color:txt3 }}>walk-in</span>
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
                <div key={i} style={{ padding:"16px", marginBottom:12, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)", borderLeft:`3px solid ${d.color}`, borderRadius:10 }}>
                  <div style={{ display:"flex", gap:12 }}>
                    <span style={{ fontSize:30, lineHeight:1 }}>{d.emoji}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"baseline", gap:8, flexWrap:"wrap", marginBottom:4 }}>
                        <span style={{ fontSize:16, color:txt, fontWeight:700 }}>{d.name}</span>
                        <span style={{ fontSize:10, color:d.color, letterSpacing:1 }}>{d.sub}</span>
                      </div>
                      <div style={{ fontSize:12, color:txt2, lineHeight:1.5, fontWeight:300 }}>{d.desc}</div>
                      <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>
                        {d.fans.map(f=>(
                          <span key={f} style={{ fontSize:11, color:d.color, background:"rgba(255,255,255,0.06)", border:`1px solid ${d.color}44`, borderRadius:12, padding:"2px 10px" }}>{f}</span>
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
                  <span style={{ fontSize:14, width:26, textAlign:"center", color:i===0?"#ff5050":dim }}>
                    {i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}
                  </span>
                  <span style={{ fontSize:22 }}>{AVATARS[m.name]||"👤"}</span>
                  <span style={{ flex:1, fontSize:14, color:txt, fontWeight:600 }}>{m.name}</span>
                  {(m.isHost===true||m.isHost==="TRUE") && <span style={{ fontSize:9, color:"#ff8080", background:"rgba(255,32,32,0.18)", padding:"2px 6px", borderRadius:3 }}>HOST</span>}
                  <span style={{ fontSize:14, color:i===0?"#ff5050":txt2, fontWeight:i===0?700:400, minWidth:28, textAlign:"right" }}>{m.visits}</span>
                </Card>
              ))}

              <div style={{ marginTop:22 }}>
                <Label>Badges</Label>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:9 }}>
                  {BADGES.map((b,i)=>(
                    <div key={i} style={{ padding:"13px 8px", textAlign:"center", background:b.earned?"rgba(255,32,32,0.09)":"rgba(255,255,255,0.03)", border:`1px solid ${b.earned?"rgba(255,80,80,0.25)":"rgba(255,255,255,0.07)"}`, borderRadius:10, opacity:b.earned?1:.32, filter:b.earned?"none":"grayscale(1)" }}>
                      <div style={{ fontSize:24 }}>{b.icon}</div>
                      <div style={{ fontSize:10, color:b.earned?txt:dim, marginTop:6, fontWeight:600 }}>{b.label}</div>
                      <div style={{ fontSize:9, color:dim, marginTop:3, lineHeight:1.3 }}>{b.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ height:44, borderTop:"1px solid rgba(255,80,80,0.08)", display:"flex", alignItems:"center", justifyContent:"center", color:dim, fontSize:9, letterSpacing:4, textTransform:"uppercase", fontWeight:300 }}>
          Members Only · All Roads Lead to Happy Hour
        </div>
      </div>
    </>
  );
}
