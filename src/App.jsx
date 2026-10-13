import { useState, useEffect, useCallback, useRef } from "react";
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

/* ─── SEASONAL THEME ─────────────────────────────────── */
function getSeason() {
  const now = new Date();
  const m = now.getMonth() + 1; // 1-12
  const d = now.getDate();
  if (m === 10) return "halloween";                          // Oct 1-31
  if (m === 11 && d <= 27) return "thanksgiving";           // Nov 1-27
  if (m === 12 && d <= 25) return "christmas";              // Dec 1-25
  return "default";
}

const SEASON = getSeason();

const THEMES = {
  default: {
    accent: "#ff4444",
    accentDim: "#cc2222",
    accentGlow: "rgba(255,68,68,0.25)",
    bgTop: "#1c1c1e",
    bgCard: "#2a2a2e",
    bgCard2: "#323236",
    neonColor: "#ff3333",
    dotColor: "#ff3333",
    label: null,
    tabExtra: null,
  },
  halloween: {
    accent: "#ff6600",
    accentDim: "#cc4400",
    accentGlow: "rgba(255,102,0,0.25)",
    bgTop: "#1a0d00",
    bgCard: "#2a1a08",
    bgCard2: "#362210",
    neonColor: "#ff6600",
    dotColor: "#ff6600",
    label: "🎃",
    tabExtra: "🎃 Games",
  },
  thanksgiving: {
    accent: "#d4a850",
    accentDim: "#a8832c",
    accentGlow: "rgba(212,168,80,0.25)",
    bgTop: "#1a1200",
    bgCard: "#2a1e08",
    bgCard2: "#342810",
    neonColor: "#d4a850",
    dotColor: "#d4a850",
    label: "🍂",
    tabExtra: null,
  },
  christmas: {
    accent: "#2d8a4e",
    accentDim: "#1d6035",
    accentGlow: "rgba(45,138,78,0.25)",
    bgTop: "#001a0a",
    bgCard: "#0a2414",
    bgCard2: "#102e1a",
    neonColor: "#2d8a4e",
    dotColor: "#2d8a4e",
    label: "🎄",
    tabExtra: null,
  },
};

const T = THEMES[SEASON];

/* ─── STATIC DATA ───────────────────────────────────── */
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

/* ─── HALLOWEEN TRIVIA POOL ──────────────────────────── */
const COCKPIT_QUESTIONS = [
  {
    q: "John received a trophy from another Cockpit VIP for being the 'Best Helper.' What animal was on top of the trophy?",
    options: ["A rooster", "A cock", "An eagle", "A lion"],
    a: 1,
  },
  {
    q: "Myles recently said his first words. What were they?",
    options: ["Mama", "Dada", "Beer", "Bar's open"],
    a: 1,
  },
  {
    q: "The Kulpas just got a new pup. What breed is it?",
    options: ["Golden Retriever", "French Bulldog", "Chihuahua", "Bullmastiff"],
    a: 1,
  },
  {
    q: "What is the latest renovation the Good Doctor has made to his place?",
    options: ["A new deck", "A new skylight", "A hot tub", "A home bar"],
    a: 1,
  },
  {
    q: "Rashawn recently made a big change at work. What was it?",
    options: ["Got a promotion", "Switched companies", "No longer remote", "Started his own business"],
    a: 2,
  },
  {
    q: "What is Steve's favorite NFL team?",
    options: ["Eagles", "Jets", "Giants", "Cowboys"],
    a: 2,
  },
  {
    q: "Garrett and Lindsey have what famous horror movie villain painted on their garage?",
    options: ["Freddy Krueger", "Michael Myers", "Jason Voorhees", "Pennywise"],
    a: 3,
  },
];

const HALLOWEEN_QUESTIONS = [
  {
    q: "What does the word 'Halloween' come from?",
    options: ["Holy Evening", "Harvest Night", "All Hallows' Eve", "Ghost Day"],
    a: 2,
  },
  {
    q: "In what country did the Halloween tradition originate?",
    options: ["England", "USA", "Ireland", "Scotland"],
    a: 2,
  },
  {
    q: "What vegetable was originally used to carve jack-o'-lanterns before pumpkins?",
    options: ["Beet", "Turnip", "Squash", "Potato"],
    a: 1,
  },
  {
    q: "Which classic monster is afraid of garlic?",
    options: ["Werewolf", "Frankenstein", "Vampire", "Mummy"],
    a: 2,
  },
  {
    q: "What is a group of witches called?",
    options: ["A coven", "A clan", "A circle", "A hex"],
    a: 0,
  },
  {
    q: "How many bones are in the human body?",
    options: ["108", "206", "300", "512"],
    a: 1,
  },
  {
    q: "What is the name of the town in 'The Nightmare Before Christmas'?",
    options: ["Spooky Hollow", "Halloween Town", "Pumpkin Ville", "Shadow Falls"],
    a: 1,
  },
  {
    q: "In which US state is Salem, known for its 1692 witch trials?",
    options: ["New York", "Connecticut", "Massachusetts", "Maine"],
    a: 2,
  },
  {
    q: "What does a black cat crossing your path supposedly mean?",
    options: ["Good luck", "Rain is coming", "Bad luck", "A visitor is near"],
    a: 2,
  },
  {
    q: "Which horror movie features a killer named Michael Myers?",
    options: ["Friday the 13th", "Scream", "Halloween", "Nightmare on Elm Street"],
    a: 2,
  },
  {
    q: "What candy is most popular on Halloween in the US?",
    options: ["Candy corn", "Reese's", "Snickers", "Kit Kat"],
    a: 1,
  },
  {
    q: "What is the fear of Halloween called?",
    options: ["Spectrophobia", "Samhainophobia", "Cucurbitaphobia", "Nocturnophobia"],
    a: 1,
  },
  {
    q: "Which planet is nicknamed the 'Death Star' due to its skull-like appearance on Halloween?",
    options: ["Mars", "Saturn", "The Moon", "Mimas"],
    a: 3,
  },
  {
    q: "What does a werewolf transform under?",
    options: ["A blood moon", "A full moon", "Any moon", "Solar eclipse"],
    a: 1,
  },
  {
    q: "In the movie 'Hocus Pocus', what are the names of the three witch sisters?",
    options: ["Mary, Sarah, Winifred", "Agatha, Zelda, Morticia", "Bellatrix, Narcissa, Andromeda", "Hex, Wanda, Salem"],
    a: 0,
  },
  {
    q: "What is a zombie's supposed favorite food?",
    options: ["Eyeballs", "Brains", "Fingers", "Hearts"],
    a: 1,
  },
  {
    q: "Which insect is often associated with witches?",
    options: ["Butterfly", "Grasshopper", "Spider", "Dragonfly"],
    a: 2,
  },
  {
    q: "What mythical creature rises from a coffin and drinks blood?",
    options: ["Ghoul", "Banshee", "Vampire", "Wraith"],
    a: 2,
  },
  {
    q: "What is the name of the headless horseman's horse in 'Sleepy Hollow'?",
    options: ["Daredevil", "Diablo", "Gunpowder", "Shadowfax"],
    a: 2,
  },
  {
    q: "What flower blooms at Halloween and is associated with Mexican Day of the Dead?",
    options: ["Rose", "Marigold", "Sunflower", "Lily"],
    a: 1,
  },
  {
    q: "Which color besides orange is most associated with Halloween?",
    options: ["Purple", "Red", "Black", "Green"],
    a: 2,
  },
  {
    q: "How many eyes does a spider have (most species)?",
    options: ["2", "4", "6", "8"],
    a: 3,
  },
  {
    q: "What is the traditional Halloween game that involves trying to grab apples floating in water?",
    options: ["Bobbing for apples", "Apple dipping", "Float-and-grab", "Harvest dunk"],
    a: 0,
  },
  {
    q: "Which Shakespeare play features three witches who chant 'Double, double toil and trouble'?",
    options: ["Hamlet", "Macbeth", "King Lear", "Othello"],
    a: 1,
  },
  {
    q: "What is the term for a fear of spiders?",
    options: ["Entomophobia", "Arachnophobia", "Vermiphobia", "Ophidiophobia"],
    a: 1,
  },
  {
    q: "In folklore, what must you do to kill a vampire?",
    options: ["Shoot it with silver bullets", "Stake through the heart", "Drown it in holy water", "Expose it to moonlight"],
    a: 1,
  },
];

/* ─── THEME CONSTANTS ────────────────────────────────── */
const bg      = T.bgTop;
const bgCard  = T.bgCard;
const bgCard2 = T.bgCard2;
const border  = "rgba(255,255,255,0.1)";
const red     = T.accent;
const redDim  = T.accentDim;
const txt     = "#ffffff";
const txt2    = "#cccccc";
const txt3    = "#aaaaaa";
const dim     = "#777777";

/* ─── SEASONAL CSS ANIMATIONS ────────────────────────── */
const batCSS = SEASON === "halloween" ? `
  @keyframes batFly {
    0%   { transform: translateX(-60px) translateY(0px) scaleX(1); opacity:0; }
    10%  { opacity:1; }
    45%  { transform: translateX(48vw) translateY(-30px) scaleX(1); }
    55%  { transform: translateX(52vw) translateY(-30px) scaleX(-1); }
    90%  { opacity:1; }
    100% { transform: translateX(110vw) translateY(10px) scaleX(-1); opacity:0; }
  }
  @keyframes batWing {
    0%,100% { transform: scaleY(1); }
    50%     { transform: scaleY(0.5); }
  }
  .bat-container {
    position: fixed; top:0; left:0; width:100%; height:100%;
    pointer-events:none; z-index:0; overflow:hidden;
  }
  .bat {
    position: absolute;
    font-size: 22px;
    animation: batFly linear infinite;
    filter: drop-shadow(0 0 4px rgba(255,102,0,0.4));
  }
` : "";

const leafCSS = SEASON === "thanksgiving" ? `
  @keyframes leafFall {
    0%   { transform: translateX(0) rotate(0deg); opacity:0; }
    10%  { opacity:1; }
    90%  { opacity:0.7; }
    100% { transform: translateX(80px) rotate(720deg) translateY(100vh); opacity:0; }
  }
  .leaf { position:fixed; top:-40px; pointer-events:none; z-index:0; font-size:22px; animation:leafFall linear infinite; }
` : "";

const snowCSS = SEASON === "christmas" ? `
  @keyframes snowFall {
    0%   { transform: translateX(0) translateY(-10px); opacity:0; }
    10%  { opacity:1; }
    90%  { opacity:0.8; }
    100% { transform: translateX(30px) translateY(100vh); opacity:0; }
  }
  .snowflake { position:fixed; top:-20px; pointer-events:none; z-index:0; font-size:16px; animation:snowFall linear infinite; color:rgba(255,255,255,0.7); }
` : "";

/* ─── BASE CSS ───────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Oswald:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap');

  @keyframes neonFlicker {
    0%,19%,21%,23%,25%,54%,56%,100% {
      text-shadow:0 0 4px #fff,0 0 11px #fff,0 0 19px #fff,
        0 0 40px ${T.neonColor},0 0 80px ${T.neonColor},0 0 100px ${T.neonColor};
      opacity:1;
    }
    20%,24%,55%{ text-shadow:none; opacity:.82; }
  }
  @keyframes fadeUp {
    from{ opacity:0; transform:translateY(10px); }
    to{ opacity:1; transform:translateY(0); }
  }
  @keyframes dotBlink {
    0%,100%{ opacity:1; box-shadow:0 0 8px ${T.dotColor}; }
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
    0%,100%{ box-shadow:0 0 0 0 ${T.accentGlow}; }
    50%{ box-shadow:0 0 0 12px rgba(255,68,68,0); }
  }
  @keyframes ghostPop {
    0%{ transform:scale(0) translateY(10px); opacity:0; }
    50%{ transform:scale(1.2) translateY(-4px); opacity:1; }
    100%{ transform:scale(1) translateY(0); opacity:1; }
  }
  @keyframes ghostWiggle {
    0%,100%{ transform:rotate(-5deg); }
    50%{ transform:rotate(5deg); }
  }
  @keyframes ghostFly {
    0%{ transform:translateY(0) scale(1); opacity:1; }
    100%{ transform:translateY(-60px) scale(0.3); opacity:0; }
  }
  @keyframes scoreFlash {
    0%{ transform:scale(1); }
    50%{ transform:scale(1.4); color:${T.accent}; }
    100%{ transform:scale(1); }
  }

  html,body{ margin:0; padding:0; background:${bg}; font-size:16px; }
  * { -webkit-text-size-adjust: 100%; }
  .neon-title{ font-family:'Permanent Marker',cursive!important; animation:neonFlicker 5s infinite; color:#fff; }
  .dark-title{ font-family:'Permanent Marker',cursive!important; color:#5a2020; }
  .tab-content{ animation:fadeUp .22s ease forwards; }
  .live-dot{ animation:dotBlink 1.4s ease infinite; }
  .mono{ font-family:'Share Tech Mono',monospace!important; }
  .tv-screen{ animation:crtFlicker 9s infinite; }
  .tv-scanline{ position:absolute; left:0; right:0; height:18%; background:linear-gradient(transparent,rgba(255,255,255,0.025),transparent); animation:tvScanline 4s linear infinite; pointer-events:none; z-index:10; }
  .spinner{ animation:spin .8s linear infinite; display:inline-block; }
  .name-btn:active{ transform:scale(0.97); }
  *{ box-sizing:border-box; }
  ${batCSS}
  ${leafCSS}
  ${snowCSS}
`;

/* ─── SEASONAL DECORATIONS ───────────────────────────── */
function SeasonalDecorations() {
  if (SEASON === "halloween") {
    return (
      <div className="bat-container" aria-hidden="true">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bat" style={{
            top: `${10 + i * 18}%`,
            animationDuration: `${8 + i * 3}s`,
            animationDelay: `${i * 2.5}s`,
          }}>🦇</div>
        ))}
      </div>
    );
  }
  if (SEASON === "thanksgiving") {
    return (
      <>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="leaf" style={{
            left: `${10 + i * 15}%`,
            animationDuration: `${6 + i * 2}s`,
            animationDelay: `${i * 1.8}s`,
          }}>🍂</div>
        ))}
      </>
    );
  }
  if (SEASON === "christmas") {
    return (
      <>
        {[...Array(10)].map((_, i) => (
          <div key={i} className="snowflake" style={{
            left: `${i * 10}%`,
            animationDuration: `${5 + (i % 3) * 2}s`,
            animationDelay: `${i * 0.8}s`,
            fontSize: `${12 + (i % 3) * 6}px`,
          }}>❄</div>
        ))}
      </>
    );
  }
  return null;
}

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
      background:highlight ? `rgba(${SEASON==="halloween"?"255,102,0":"255,68,68"},0.12)` : bgCard,
      border:`1px solid ${highlight ? `rgba(${SEASON==="halloween"?"255,120,0":"255,80,80"},0.35)` : border}`,
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
      <SeasonalDecorations />
      <div style={{ position:"relative", zIndex:1, display:"inline-block", background:"#120404", border:"2px solid rgba(255,60,60,0.25)", borderRadius:14, padding:"12px 32px 16px", marginBottom:10, boxShadow:"0 0 40px rgba(255,30,30,0.25)" }}>
        <div style={{ fontSize:9, letterSpacing:5, color:"rgba(255,120,120,0.45)", marginBottom:5, fontWeight:300, textAlign:"center" }}>✦ GARAGE BAR ✦</div>
        <div className="neon-title" style={{ fontSize:34, lineHeight:1.1, textAlign:"center" }}>The COCKpit</div>
        {T.label && <div style={{ textAlign:"center", fontSize:20, marginTop:4 }}>{T.label}</div>}
      </div>
      <div style={{ position:"relative", zIndex:1, fontSize:13, color:txt3, letterSpacing:2, marginBottom:28, textAlign:"center", marginTop:20 }}>WHO ARE YOU?</div>
      <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:380, display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
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
      <div style={{ position:"relative", zIndex:1, marginTop:24, fontSize:11, color:dim, letterSpacing:.5, textAlign:"center", lineHeight:1.7 }}>
        Your choice is saved on this device.<br/>You won't be asked again.
      </div>
    </div>
  );
}

/* ─── TV WIDGET (Retro CRT, no on/off toggle) ────────── */
function TVWidget({ isHost, whatsOn, onSetWhatsOn }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(whatsOn||"");
  const [saving, setSaving]   = useState(false);

  useEffect(()=>{ setDraft(whatsOn||""); },[whatsOn]);

  const save = async () => {
    setSaving(true);
    await onSetWhatsOn(draft.trim()||"Nothing on");
    setSaving(false);
    setEditing(false);
  };

  const hasContent = whatsOn && whatsOn !== "Nothing on";

  return (
    <div style={{ marginBottom:18 }}>
      {/* CRT outer shell */}
      <div style={{
        background:"linear-gradient(145deg,#1a1a1a,#111)",
        border:"3px solid #1e1e1e",
        borderRadius:18,
        padding:"10px 10px 14px",
        boxShadow:"0 8px 32px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05), 0 0 0 1px rgba(255,255,255,0.04)",
        position:"relative",
      }}>
        {/* TV screen bezel */}
        <div style={{
          background:"#0a0a0a",
          border:"2px solid #000",
          borderRadius:12,
          overflow:"hidden",
          position:"relative",
          minHeight:100,
          boxShadow:"inset 0 2px 12px rgba(0,0,0,0.8), inset 0 0 40px rgba(0,0,0,0.5)",
        }}>
          {/* Phosphor screen glow */}
          <div style={{
            position:"absolute", inset:0, zIndex:1, pointerEvents:"none",
            background:`radial-gradient(ellipse at 50% 40%, ${hasContent ? "rgba(255,140,50,0.04)" : "rgba(0,200,100,0.02)"} 0%, transparent 70%)`,
          }} />
          {/* Scanline overlay */}
          <div className="tv-screen" style={{ position:"relative", zIndex:2 }}>
            <div className="tv-scanline" style={{ zIndex:3 }} />
            <div style={{
              position:"absolute", inset:0, zIndex:2, pointerEvents:"none",
              backgroundImage:"repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 3px)",
            }} />
            {/* Content */}
            <div style={{ position:"relative", zIndex:4, padding:"18px 16px 14px" }}>
              <div className="mono" style={{ fontSize:8, color:"rgba(180,220,180,0.5)", letterSpacing:3, marginBottom:10, textTransform:"uppercase" }}>
                ▶ ON THE TV
              </div>
              {!editing ? (
                <div>
                  <div style={{
                    fontSize: hasContent ? 20 : 16,
                    color: hasContent ? "#e8e0c8" : "rgba(180,180,180,0.5)",
                    fontWeight:700,
                    lineHeight:1.3,
                    marginBottom:14,
                    fontFamily:"'Oswald',sans-serif",
                    textShadow: hasContent ? "0 0 12px rgba(255,220,150,0.3)" : "none",
                    letterSpacing: hasContent ? 0.5 : 2,
                  }}>
                    {whatsOn || "NOTHING ON"}
                  </div>
                  {isHost ? (
                    <button onClick={()=>setEditing(true)} style={{
                      padding:"6px 14px",
                      background:"rgba(255,255,255,0.06)",
                      border:"1px solid rgba(255,255,255,0.15)",
                      borderRadius:5, color:"rgba(200,200,200,0.7)",
                      fontSize:10, letterSpacing:2, textTransform:"uppercase",
                      fontFamily:"'Oswald',sans-serif", fontWeight:500, cursor:"pointer",
                    }}>Edit</button>
                  ) : (
                    <div className="mono" style={{ fontSize:8, color:"rgba(150,150,150,0.4)", letterSpacing:2 }}>
                      JOHN OR MELISSA CAN CHANGE THIS
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <input autoFocus value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>e.key==="Enter"&&save()}
                    placeholder="e.g. Braves Game on ESPN"
                    style={{
                      width:"100%",
                      background:"rgba(255,255,255,0.1)",
                      border:"1px solid rgba(255,255,255,0.25)",
                      borderRadius:6, padding:"9px 11px",
                      color:"#e8e0c8", fontSize:15,
                      fontFamily:"'Oswald',sans-serif", outline:"none", marginBottom:8,
                    }} />
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={save} disabled={saving} style={{ flex:1, padding:"8px", background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:6, color:"#e8e0c8", fontSize:12, letterSpacing:2, textTransform:"uppercase", fontFamily:"'Oswald',sans-serif", fontWeight:700, cursor:"pointer" }}>
                      {saving?"...":"Save"}
                    </button>
                    <button onClick={()=>setEditing(false)} style={{ flex:1, padding:"8px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:6, color:"rgba(150,150,150,0.7)", fontSize:12, letterSpacing:2, textTransform:"uppercase", fontFamily:"'Oswald',sans-serif", fontWeight:500, cursor:"pointer" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TV bottom controls row */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:8, paddingLeft:4, paddingRight:4 }}>
          <div className="mono" style={{ fontSize:8, color:"rgba(255,255,255,0.2)", letterSpacing:2 }}>TCL · COCKPIT TV</div>
          <div style={{ display:"flex", gap:6 }}>
            {[...Array(3)].map((_,i)=>(
              <div key={i} style={{ width:8, height:8, borderRadius:"50%", background:i===0?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)" }} />
            ))}
          </div>
        </div>
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
            background:`rgba(${SEASON==="halloween"?"255,102,0":"255,68,68"},0.12)`,
            border:`1px solid rgba(${SEASON==="halloween"?"255,120,0":"255,80,80"},0.3)`,
            borderRadius:6, padding:"5px 12px", color:red,
            fontSize:10, letterSpacing:2, textTransform:"uppercase",
            fontFamily:"'Oswald',sans-serif", fontWeight:600, cursor:"pointer",
          }}>+ Add</button>
        )}
      </div>

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
            <button onClick={()=>{ setShowForm(false); setDraft({date:"",title:"",note:"",time:""}); }} style={{
              flex:1, padding:"11px",
              background:"rgba(255,255,255,0.05)", border:`1px solid ${border}`,
              borderRadius:7, color:txt3,
              fontSize:12, letterSpacing:2, textTransform:"uppercase",
              fontFamily:"'Oswald',sans-serif", fontWeight:500, cursor:"pointer",
            }}>Cancel</button>
          </div>
        </div>
      )}

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
              background:i===0?`rgba(${SEASON==="halloween"?"255,102,0":"255,68,68"},0.1)`:bgCard,
              border:`1px solid ${i===0?`rgba(${SEASON==="halloween"?"255,120,0":"255,80,80"},0.3)`:border}`,
            }}>
              <div style={{ textAlign:"center", minWidth:44, background:`rgba(${SEASON==="halloween"?"255,102,0":"255,68,68"},0.12)`, borderRadius:8, padding:"6px 4px", border:`1px solid rgba(${SEASON==="halloween"?"255,120,0":"255,68,68"},0.2)`, flexShrink:0 }}>
                <div style={{ fontSize:9, color:red, letterSpacing:1, fontWeight:600, textTransform:"uppercase" }}>{getMon(e.date)}</div>
                <div style={{ fontSize:20, color:txt, fontWeight:700, lineHeight:1 }}>{getDay(e.date)}</div>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:17, color:txt, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{e.title}</div>
                {e.note && <div style={{ fontSize:14, color:txt3, marginTop:3 }}>{e.note}</div>}
                <div style={{ fontSize:13, color:dim, marginTop:3, letterSpacing:.3 }}>{fmt(e.date)}{e.time ? " · " + e.time + " ET" : ""}</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                {i===0 && <span style={{ fontSize:9, color:red, background:`rgba(${SEASON==="halloween"?"255,102,0":"255,68,68"},0.15)`, padding:"3px 8px", borderRadius:4, letterSpacing:1, fontFamily:"'Oswald',sans-serif", fontWeight:600 }}>NEXT UP</span>}
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
          style={{ fontSize:size, cursor:interactive?"pointer":"default", color:(hover||count)>=i?"#fbbc04":"#444", transition:"color .1s", lineHeight:1 }}>★</span>
      ))}
    </div>
  );
}

function ReviewsTab({ reviews, myName, isHost, crew, onSubmit, onDelete }) {
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
      <div style={{ background:bgCard, borderRadius:12, padding:"18px 16px", marginBottom:16, border:`1px solid ${border}` }}>
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

        {avg ? (
          <div style={{ display:"flex", gap:20, alignItems:"center", marginBottom:16 }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:52, color:txt, fontWeight:700, lineHeight:1 }}>{avg}</div>
              <Stars count={Math.round(Number(avg))} size={16} />
              <div style={{ fontSize:11, color:txt3, marginTop:4 }}>{reviews.length} review{reviews.length!==1?"s":""}</div>
            </div>
            <div style={{ flex:1 }}>
              {totalByStars.map(({s,pct})=>(
                <div key={s} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:11, color:txt3, minWidth:8 }}>{s}</span>
                  <div style={{ flex:1, height:6, background:"rgba(255,255,255,0.08)", borderRadius:3, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${pct}%`, background:"#fbbc04", borderRadius:3 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {!showForm && (
          <button onClick={()=>setShowForm(true)} style={{ width:"100%", padding:"11px", background:`rgba(${SEASON==="halloween"?"255,102,0":"255,50,50"},0.15)`, border:`1px solid rgba(${SEASON==="halloween"?"255,120,0":"255,80,80"},0.35)`, borderRadius:8, color:txt, fontSize:13, letterSpacing:2, textTransform:"uppercase", fontFamily:"'Oswald',sans-serif", fontWeight:700, cursor:"pointer" }}>
            Write a Review
          </button>
        )}

        {showForm && (
          <div style={{ marginTop:8 }}>
            <div style={{ fontSize:11, color:txt3, marginBottom:8, letterSpacing:1 }}>YOUR RATING</div>
            <Stars count={stars} size={32} interactive onSelect={setStars} />
            <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Tell us about your experience..."
              style={{ width:"100%", background:"rgba(255,255,255,0.07)", border:`1px solid rgba(255,255,255,0.15)`, borderRadius:8, padding:"11px 13px", color:txt, fontSize:14, fontFamily:"'Oswald',sans-serif", outline:"none", marginTop:12, marginBottom:10, resize:"vertical", minHeight:80 }} />
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={submit} disabled={saving||!stars||!text.trim()} style={{ flex:1, padding:"11px", background:"rgba(251,188,4,0.15)", border:"1px solid rgba(251,188,4,0.35)", borderRadius:7, color:txt, fontSize:12, letterSpacing:2, textTransform:"uppercase", fontFamily:"'Oswald',sans-serif", fontWeight:700, cursor:"pointer", opacity:(!stars||!text.trim())?0.4:1 }}>{saving?"Posting...":"Post Review"}</button>
              <button onClick={()=>{ setShowForm(false); setStars(0); setText(""); }} style={{ flex:1, padding:"11px", background:"rgba(255,255,255,0.05)", border:`1px solid ${border}`, borderRadius:7, color:txt3, fontSize:12, letterSpacing:2, textTransform:"uppercase", fontFamily:"'Oswald',sans-serif", fontWeight:500, cursor:"pointer" }}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {reviews.map((r,i) => (
        <div key={i} style={{ background:bgCard, borderRadius:12, padding:"16px", marginBottom:12, border:`1px solid ${border}` }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:24 }}>{getAvatar([], r.name)}</span>
              <div>
                <div style={{ fontSize:15, color:txt, fontWeight:700 }}>{r.name}</div>
                <div style={{ fontSize:11, color:dim, marginTop:1 }}>{fmtDate(r.timestamp)}</div>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <Stars count={Number(r.stars)} size={14} />
              {(r.name===myName||isHost) && (
                <button onClick={()=>handleDelete(i)} disabled={deleting===i} style={{ background:"rgba(255,50,50,0.08)", border:"1px solid rgba(255,80,80,0.2)", borderRadius:5, padding:"4px 8px", color:red, fontSize:11, cursor:"pointer" }}>
                  {deleting===i?"...":"✕"}
                </button>
              )}
            </div>
          </div>
          <div style={{ fontSize:14, color:txt2, lineHeight:1.5 }}>{r.text}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── WEATHER TAB ────────────────────────────────────── */
function WeatherTab() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) { setErr("Location unavailable"); setLoading(false); return; }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude: lat, longitude: lon } = pos.coords;
        const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=5`);
        const d = await r.json();
        setWeather(d);
      } catch(e) { setErr("Couldn't load weather"); }
      setLoading(false);
    }, () => { setErr("Location permission denied"); setLoading(false); });
  }, []);

  const wmoDesc = (code) => {
    if (code === 0) return "Clear Sky";
    if (code <= 3) return "Partly Cloudy";
    if (code <= 49) return "Foggy";
    if (code <= 67) return "Rainy";
    if (code <= 77) return "Snowy";
    if (code <= 82) return "Showers";
    if (code <= 99) return "Thunderstorm";
    return "Unknown";
  };

  const wmoIcon = (code) => {
    if (code === 0) return "☀️";
    if (code <= 3) return "⛅";
    if (code <= 49) return "🌫️";
    if (code <= 67) return "🌧️";
    if (code <= 77) return "❄️";
    if (code <= 82) return "🌦️";
    return "⛈️";
  };

  const dayLabel = (iso, i) => {
    if (i === 0) return "Today";
    if (i === 1) return "Tomorrow";
    return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { weekday:"short" });
  };

  if (loading) return <div style={{ textAlign:"center", padding:40, color:dim }}><Spinner /></div>;
  if (err) return <div style={{ textAlign:"center", padding:40, color:dim, fontSize:14 }}>{err}</div>;
  if (!weather) return null;

  const cw = weather.current_weather;
  const daily = weather.daily;

  return (
    <div>
      <div style={{ background:bgCard, borderRadius:14, padding:"20px 18px", marginBottom:16, border:`1px solid ${border}` }}>
        <div style={{ fontSize:12, color:dim, letterSpacing:2, marginBottom:4, fontFamily:"'Oswald',sans-serif" }}>RIGHT NOW</div>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ fontSize:56 }}>{wmoIcon(cw.weathercode)}</div>
          <div>
            <div style={{ fontSize:48, color:txt, fontWeight:700, lineHeight:1 }}>{Math.round(cw.temperature)}°F</div>
            <div style={{ fontSize:15, color:txt2, marginTop:4 }}>{wmoDesc(cw.weathercode)}</div>
            <div style={{ fontSize:12, color:dim, marginTop:2 }}>Wind {Math.round(cw.windspeed)} mph</div>
          </div>
        </div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {daily.time.slice(0,5).map((iso, i) => (
          <div key={iso} style={{ background:bgCard, borderRadius:10, padding:"12px 16px", border:`1px solid ${border}`, display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:26 }}>{wmoIcon(daily.weathercode[i])}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:15, color:txt, fontWeight:600 }}>{dayLabel(iso, i)}</div>
              <div style={{ fontSize:12, color:dim, marginTop:1 }}>{daily.precipitation_probability_max[i]}% rain</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:16, color:txt, fontWeight:700 }}>{Math.round(daily.temperature_2m_max[i])}°</div>
              <div style={{ fontSize:13, color:dim }}>{Math.round(daily.temperature_2m_min[i])}°</div>
            </div>
          </div>
        ))}
      </div>
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
      <input autoFocus value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>e.key==="Enter"&&save()} placeholder="e.g. 7 PM or 6:30 PM"
        style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,149,0,0.35)", borderRadius:7, padding:"7px 12px", color:txt, fontSize:14, fontFamily:"'Oswald',sans-serif", outline:"none", width:160 }} />
      <button onClick={save} disabled={saving} style={{ background:"rgba(255,149,0,0.15)", border:"1px solid rgba(255,149,0,0.4)", borderRadius:7, padding:"7px 14px", color:"#ffaa00", fontSize:12, letterSpacing:1, fontFamily:"'Oswald',sans-serif", fontWeight:600, cursor:"pointer" }}>{saving?"...":"Set"}</button>
      <button onClick={()=>setEditing(false)} style={{ background:"none", border:`1px solid ${border}`, borderRadius:7, padding:"7px 10px", color:dim, fontSize:12, cursor:"pointer", fontFamily:"'Oswald',sans-serif" }}>Cancel</button>
    </div>
  );

  return (
    <button onClick={()=>setEditing(true)} style={{ background:"none", border:"none", color:dim, fontSize:12, letterSpacing:1, cursor:"pointer", fontFamily:"'Oswald',sans-serif", textDecoration:"underline", textDecorationStyle:"dotted", marginTop:2 }}>
      {scheduledTime ? "Change scheduled time" : "🕐 Schedule an opening time"}
    </button>
  );
}

/* ─── CLAP LOADER ────────────────────────────────────── */
function ClapLoader() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const timings = [[120,1],[320,2],[440,3],[640,4]];
    const timers = timings.map(([ms, p]) => setTimeout(() => setPhase(p), ms));
    return () => timers.forEach(clearTimeout);
  }, []);
  const isClap = phase === 1 || phase === 3;
  return (
    <div style={{ background:bg, minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"'Oswald',sans-serif", overflow:"hidden" }}>
      <style>{css}
        {`
        @keyframes clapLeft { 0%{ transform:translateX(0) rotate(0deg); } 100%{ transform:translateX(38px) rotate(15deg); } }
        @keyframes clapRight { 0%{ transform:translateX(0) rotate(0deg) scaleX(-1); } 100%{ transform:translateX(-38px) rotate(-15deg) scaleX(-1); } }
        @keyframes apartLeft { 0%{ transform:translateX(38px) rotate(15deg); } 100%{ transform:translateX(0) rotate(0deg); } }
        @keyframes apartRight { 0%{ transform:translateX(-38px) rotate(-15deg) scaleX(-1); } 100%{ transform:translateX(0) rotate(0deg) scaleX(-1); } }
        @keyframes clapFlash { 0%{ opacity:0; transform:scale(0.4); } 40%{ opacity:1; transform:scale(1.3); } 100%{ opacity:0; transform:scale(1); } }
        @keyframes titleReveal { 0%{ opacity:0; transform:translateY(16px); } 100%{ opacity:1; transform:translateY(0); } }
        .clap-left-go   { animation:clapLeft  0.12s ease-out forwards; }
        .clap-right-go  { animation:clapRight 0.12s ease-out forwards; }
        .apart-left-go  { animation:apartLeft  0.14s ease-out forwards; }
        .apart-right-go { animation:apartRight 0.14s ease-out forwards; }
        .clap-flash     { animation:clapFlash 0.25s ease-out forwards; }
        .title-reveal   { animation:titleReveal 0.5s ease forwards; }
        `}
      </style>
      <div style={{ position:"relative", height:120, width:220, display:"flex", alignItems:"center", justifyContent:"center" }}>
        {isClap && <div className="clap-flash" style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", fontSize:48, zIndex:10, pointerEvents:"none", lineHeight:1 }}>✨</div>}
        <div className={phase===1?"clap-left-go":phase===2?"apart-left-go":phase===3?"clap-left-go":phase===4?"apart-left-go":""} style={{ fontSize:72, lineHeight:1, display:"inline-block", transformOrigin:"right center", marginRight:8 }}>👏</div>
      </div>
      {isClap && <div className="clap-flash" style={{ fontSize:28, fontWeight:900, color:red, letterSpacing:6, fontFamily:"'Oswald',sans-serif", textShadow:`0 0 20px ${red}`, marginTop:-20 }}>CLAP</div>}
      {phase === 4 && (
        <div className="title-reveal" style={{ textAlign:"center", marginTop:32 }}>
          <div style={{ fontSize:9, letterSpacing:5, color:"rgba(255,120,120,0.45)", marginBottom:6, fontWeight:300 }}>✦ GARAGE BAR ✦</div>
          <div className="neon-title" style={{ fontSize:36 }}>The COCKpit</div>
          <div style={{ color:dim, fontSize:11, letterSpacing:3, marginTop:16 }}><span className="spinner">⟳</span></div>
        </div>
      )}
    </div>
  );
}

/* ─── WHACK-A-GHOST ──────────────────────────────────── */
function WhackAGhost() {
  const GRID = 9;
  const [active, setActive]     = useState(null);    // index 0-8
  const [score, setScore]       = useState(0);
  const [highScore, setHighScore] = useState(() => { try { return parseInt(localStorage.getItem("wag_hi")||"0"); } catch(e){ return 0; } });
  const [misses, setMisses]     = useState(0);
  const [gameState, setGameState] = useState("idle"); // idle | playing | dead
  const [whacked, setWhacked]   = useState(null);
  const intervalRef = useRef(null);
  const timeoutRef  = useRef(null);
  const speedRef    = useRef(1000);
  const MAX_MISSES  = 3;

  const pickNext = useCallback((currentScore) => {
    const speed = Math.max(350, 1000 - currentScore * 30);
    speedRef.current = speed;
    const idx = Math.floor(Math.random() * GRID);
    setActive(idx);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setActive(a => {
        if (a === idx) {
          // missed
          setMisses(m => {
            const next = m + 1;
            if (next >= MAX_MISSES) {
              setGameState("dead");
              clearInterval(intervalRef.current);
              return next;
            }
            return next;
          });
          return null;
        }
        return a;
      });
    }, speed);
  }, []);

  const startGame = () => {
    setScore(0); setMisses(0); setWhacked(null); setActive(null);
    setGameState("playing");
    speedRef.current = 1000;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimeout(() => pickNext(0), 400);
  };

  useEffect(() => {
    if (gameState !== "playing") return;
    intervalRef.current = setInterval(() => {
      setScore(s => {
        pickNext(s);
        return s;
      });
    }, speedRef.current + 100);
    return () => { clearInterval(intervalRef.current); if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [gameState, pickNext]);

  // Clear interval on unmount
  useEffect(() => () => { clearInterval(intervalRef.current); clearTimeout(timeoutRef.current); }, []);

  const whack = (idx) => {
    if (gameState !== "playing" || active !== idx) return;
    clearTimeout(timeoutRef.current);
    setActive(null);
    setWhacked(idx);
    setTimeout(() => setWhacked(null), 300);
    setScore(s => {
      const next = s + 1;
      if (next > highScore) {
        setHighScore(next);
        try { localStorage.setItem("wag_hi", String(next)); } catch(e){}
      }
      clearInterval(intervalRef.current);
      setTimeout(() => pickNext(next), Math.max(300, speedRef.current - 20));
      return next;
    });
  };

  const hearts = Array.from({ length: MAX_MISSES }, (_, i) => i < MAX_MISSES - misses);

  return (
    <div style={{ textAlign:"center" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div>
          <div style={{ fontSize:28, fontWeight:700, color:red, fontFamily:"'Oswald',sans-serif" }}>{score}</div>
          <div style={{ fontSize:10, color:dim, letterSpacing:2 }}>SCORE</div>
        </div>
        <div>
          <div style={{ fontSize:16 }}>{hearts.map((alive,i)=><span key={i}>{alive?"❤️":"🖤"}</span>)}</div>
          <div style={{ fontSize:10, color:dim, letterSpacing:2, marginTop:2 }}>LIVES</div>
        </div>
        <div>
          <div style={{ fontSize:18, fontWeight:700, color:T.accent, fontFamily:"'Oswald',sans-serif" }}>{highScore}</div>
          <div style={{ fontSize:10, color:dim, letterSpacing:2 }}>BEST</div>
        </div>
      </div>

      {gameState === "idle" && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:40, marginBottom:8 }}>👻</div>
          <div style={{ fontSize:14, color:txt2, marginBottom:16 }}>Tap ghosts before they disappear!</div>
          <button onClick={startGame} style={{ padding:"14px 36px", background:`rgba(${SEASON==="halloween"?"255,102,0":"255,68,68"},0.2)`, border:`1px solid ${red}`, borderRadius:10, color:txt, fontSize:16, letterSpacing:2, textTransform:"uppercase", fontFamily:"'Oswald',sans-serif", fontWeight:700, cursor:"pointer" }}>
            Start Game
          </button>
        </div>
      )}

      {gameState === "dead" && (
        <div style={{ marginBottom:20, padding:"16px", background:"rgba(255,0,0,0.06)", borderRadius:12, border:"1px solid rgba(255,50,50,0.2)" }}>
          <div style={{ fontSize:32, marginBottom:6 }}>💀</div>
          <div style={{ fontSize:18, color:txt, fontWeight:700, marginBottom:4 }}>Game Over!</div>
          <div style={{ fontSize:14, color:txt2, marginBottom:4 }}>Score: {score}</div>
          {score >= highScore && score > 0 && <div style={{ fontSize:12, color:T.accent, marginBottom:12, fontWeight:600 }}>🏆 NEW HIGH SCORE!</div>}
          <button onClick={startGame} style={{ padding:"12px 28px", background:`rgba(${SEASON==="halloween"?"255,102,0":"255,68,68"},0.2)`, border:`1px solid ${red}`, borderRadius:8, color:txt, fontSize:14, letterSpacing:2, textTransform:"uppercase", fontFamily:"'Oswald',sans-serif", fontWeight:700, cursor:"pointer" }}>
            Play Again
          </button>
        </div>
      )}

      {/* Ghost grid */}
      {(gameState === "playing" || gameState === "dead") && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:10, marginBottom:16 }}>
          {[...Array(GRID)].map((_, i) => {
            const isActive = active === i;
            const isWhacked = whacked === i;
            return (
              <div key={i} onClick={() => whack(i)} style={{
                height:90, borderRadius:12,
                background: isActive ? `rgba(${SEASON==="halloween"?"255,102,0":"255,68,68"},0.12)` : bgCard,
                border: `1px solid ${isActive ? red : border}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                cursor: isActive ? "pointer" : "default",
                transition:"background .1s, border-color .1s",
                userSelect:"none",
                animation: isWhacked ? "ghostFly 0.3s ease forwards" : isActive ? "ghostPop 0.25s ease forwards" : "none",
              }}>
                {isActive && <span style={{ fontSize:40, display:"block", animation:"ghostWiggle 0.5s ease infinite" }}>👻</span>}
                {isWhacked && <span style={{ fontSize:32 }}>💥</span>}
              </div>
            );
          })}
        </div>
      )}

      {gameState === "playing" && (
        <div style={{ fontSize:11, color:dim, letterSpacing:2 }}>SPEED: {Math.round(10 - (1000-speedRef.current)/70)}/10</div>
      )}
    </div>
  );
}

/* ─── COCKPIT TRIVIA ─────────────────────────────────── */
function CockpitTrivia() {
  const [gameState, setGameState] = useState("idle");  // idle | playing | done
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent]     = useState(0);
  const [selected, setSelected]   = useState(null);
  const [answers, setAnswers]     = useState([]);
  const [showResult, setShowResult] = useState(false);

  const startGame = () => {
    // Pick 5 random unique questions
    const cockpitPick = COCKPIT_QUESTIONS[Math.floor(Math.random() * COCKPIT_QUESTIONS.length)];
    const halloweenPicks = [...HALLOWEEN_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 4);
    const shuffled = [cockpitPick, ...halloweenPicks].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setCurrent(0);
    setSelected(null);
    setAnswers([]);
    setShowResult(false);
    setGameState("playing");
  };

  const handleSelect = (idx) => {
    if (selected !== null) return;
    setSelected(idx);
    setShowResult(true);
  };

  const handleNext = () => {
    const correct = selected === questions[current].a;
    const newAnswers = [...answers, correct];
    setAnswers(newAnswers);
    setSelected(null);
    setShowResult(false);
    if (current + 1 >= questions.length) {
      setGameState("done");
    } else {
      setCurrent(c => c + 1);
    }
  };

  const score = answers.filter(Boolean).length;

  if (gameState === "idle") return (
    <div style={{ textAlign:"center", padding:"20px 0" }}>
      <div style={{ fontSize:44, marginBottom:12 }}>🎃</div>
      <div style={{ fontSize:20, color:txt, fontWeight:700, marginBottom:6, fontFamily:"'Oswald',sans-serif" }}>Cockpit Trivia</div>
      <div style={{ fontSize:14, color:txt2, marginBottom:20, lineHeight:1.5 }}>5 random questions from our big pool.<br/>Halloween spookiness + Cockpit inside knowledge.</div>
      <button onClick={startGame} style={{ padding:"14px 36px", background:`rgba(${SEASON==="halloween"?"255,102,0":"255,68,68"},0.2)`, border:`1px solid ${red}`, borderRadius:10, color:txt, fontSize:16, letterSpacing:2, textTransform:"uppercase", fontFamily:"'Oswald',sans-serif", fontWeight:700, cursor:"pointer" }}>
        Start Trivia
      </button>
    </div>
  );

  if (gameState === "done") {
    const pct = Math.round((score / questions.length) * 100);
    const emoji = score === 5 ? "🏆" : score >= 3 ? "🎃" : "💀";
    const msg = score === 5 ? "Perfect score! You're a Cockpit legend." : score >= 3 ? "Not bad — the ghosts approve." : "The ghosts are judging you.";
    return (
      <div style={{ textAlign:"center", padding:"20px 0" }}>
        <div style={{ fontSize:52, marginBottom:12 }}>{emoji}</div>
        <div style={{ fontSize:24, color:txt, fontWeight:700, marginBottom:4, fontFamily:"'Oswald',sans-serif" }}>{score} / {questions.length}</div>
        <div style={{ fontSize:14, color:txt2, marginBottom:20 }}>{msg}</div>
        <div style={{ marginBottom:24 }}>
          {questions.map((q,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", marginBottom:6, background:bgCard, borderRadius:8, border:`1px solid ${border}`, textAlign:"left" }}>
              <span style={{ fontSize:18 }}>{answers[i]?"✅":"❌"}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, color:txt, fontWeight:600 }}>{q.q.slice(0,60)}{q.q.length>60?"...":""}</div>
                {!answers[i] && <div style={{ fontSize:11, color:T.accent, marginTop:2 }}>Answer: {q.options[q.a]}</div>}
              </div>
            </div>
          ))}
        </div>
        <button onClick={startGame} style={{ padding:"12px 28px", background:`rgba(${SEASON==="halloween"?"255,102,0":"255,68,68"},0.2)`, border:`1px solid ${red}`, borderRadius:8, color:txt, fontSize:14, letterSpacing:2, textTransform:"uppercase", fontFamily:"'Oswald',sans-serif", fontWeight:700, cursor:"pointer" }}>
          Play Again
        </button>
      </div>
    );
  }

  const q = questions[current];
  return (
    <div>
      {/* Progress */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
        <div style={{ flex:1, height:4, background:"rgba(255,255,255,0.08)", borderRadius:2, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${((current)/questions.length)*100}%`, background:red, borderRadius:2, transition:"width .3s" }} />
        </div>
        <div style={{ fontSize:11, color:dim, letterSpacing:2, whiteSpace:"nowrap" }}>{current+1}/{questions.length}</div>
      </div>

      <div style={{ background:bgCard, borderRadius:12, padding:"18px 16px", marginBottom:14, border:`1px solid ${border}` }}>
        <div style={{ fontSize:16, color:txt, fontWeight:600, lineHeight:1.5, marginBottom:4 }}>{q.q}</div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
        {q.options.map((opt, i) => {
          let bg = bgCard;
          let borderColor = border;
          let textColor = txt2;
          if (showResult) {
            if (i === q.a) { bg = "rgba(76,175,80,0.15)"; borderColor = "rgba(76,175,80,0.5)"; textColor = "#4caf50"; }
            else if (i === selected) { bg = "rgba(255,50,50,0.15)"; borderColor = "rgba(255,80,80,0.5)"; textColor = red; }
          } else if (selected === i) {
            bg = `rgba(${SEASON==="halloween"?"255,102,0":"255,68,68"},0.15)`;
            borderColor = red;
            textColor = txt;
          }
          return (
            <button key={i} onClick={()=>handleSelect(i)} disabled={selected !== null} style={{
              padding:"13px 16px", background:bg,
              border:`1px solid ${borderColor}`,
              borderRadius:10, color:textColor,
              fontSize:15, fontFamily:"'Oswald',sans-serif",
              fontWeight:500, textAlign:"left",
              cursor:selected===null?"pointer":"default",
              transition:"all .15s",
              display:"flex", alignItems:"center", gap:10,
            }}>
              <span style={{ fontSize:12, color:dim, minWidth:18 }}>{["A","B","C","D"][i]}.</span>
              {opt}
              {showResult && i === q.a && <span style={{ marginLeft:"auto", fontSize:18 }}>✓</span>}
              {showResult && i === selected && i !== q.a && <span style={{ marginLeft:"auto", fontSize:18 }}>✗</span>}
            </button>
          );
        })}
      </div>

      {showResult && (
        <button onClick={handleNext} style={{ width:"100%", padding:"14px", background:`rgba(${SEASON==="halloween"?"255,102,0":"255,68,68"},0.2)`, border:`1px solid ${red}`, borderRadius:10, color:txt, fontSize:14, letterSpacing:2, textTransform:"uppercase", fontFamily:"'Oswald',sans-serif", fontWeight:700, cursor:"pointer" }}>
          {current + 1 >= questions.length ? "See Results" : "Next Question →"}
        </button>
      )}
    </div>
  );
}

/* ─── HALLOWEEN GAMES TAB ────────────────────────────── */
function HalloweenGamesTab() {
  const [game, setGame] = useState(null);

  if (game === "whack") return (
    <div>
      <button onClick={()=>setGame(null)} style={{ background:"none", border:"none", color:dim, fontSize:13, cursor:"pointer", marginBottom:16, padding:0, fontFamily:"'Oswald',sans-serif", letterSpacing:1 }}>← Back to Games</button>
      <Label>Whack-a-Ghost</Label>
      <WhackAGhost />
    </div>
  );

  if (game === "trivia") return (
    <div>
      <button onClick={()=>setGame(null)} style={{ background:"none", border:"none", color:dim, fontSize:13, cursor:"pointer", marginBottom:16, padding:0, fontFamily:"'Oswald',sans-serif", letterSpacing:1 }}>← Back to Games</button>
      <Label>Cockpit Trivia</Label>
      <CockpitTrivia />
    </div>
  );

  return (
    <div>
      <div style={{ textAlign:"center", marginBottom:24, paddingTop:4 }}>
        <div style={{ fontSize:40, marginBottom:6 }}>🎃</div>
        <div style={{ fontSize:22, color:txt, fontWeight:700, fontFamily:"'Oswald',sans-serif", letterSpacing:1 }}>Halloween Games</div>
        <div style={{ fontSize:12, color:dim, marginTop:4, letterSpacing:2 }}>GONE NOV 1 — ENJOY WHILE IT LASTS</div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <button onClick={()=>setGame("whack")} style={{ padding:"22px 18px", background:`rgba(255,102,0,0.1)`, border:`1px solid rgba(255,120,0,0.35)`, borderRadius:14, textAlign:"left", cursor:"pointer", width:"100%" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ fontSize:42 }}>👻</div>
            <div>
              <div style={{ fontSize:18, color:txt, fontWeight:700, fontFamily:"'Oswald',sans-serif" }}>Whack-a-Ghost</div>
              <div style={{ fontSize:13, color:txt2, marginTop:3 }}>Tap ghosts before they vanish. Gets faster. How long can you last?</div>
            </div>
            <div style={{ marginLeft:"auto", fontSize:20, color:dim }}>›</div>
          </div>
        </button>

        <button onClick={()=>setGame("trivia")} style={{ padding:"22px 18px", background:`rgba(255,102,0,0.1)`, border:`1px solid rgba(255,120,0,0.35)`, borderRadius:14, textAlign:"left", cursor:"pointer", width:"100%" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ fontSize:42 }}>🧠</div>
            <div>
              <div style={{ fontSize:18, color:txt, fontWeight:700, fontFamily:"'Oswald',sans-serif" }}>Cockpit Trivia</div>
              <div style={{ fontSize:13, color:txt2, marginTop:3 }}>5 questions per round. Halloween spookiness + inside Cockpit knowledge.</div>
            </div>
            <div style={{ marginLeft:"auto", fontSize:20, color:dim }}>›</div>
          </div>
        </button>
      </div>
    </div>
  );
}

/* ─── MAIN APP ───────────────────────────────────────── */
export default function App() {
  const tabs = SEASON === "halloween"
    ? ["Status", "Crew", "Weather", "Reviews", "🎃 Games"]
    : ["Status", "Crew", "Weather", "Reviews"];

  const [myName, setMyName]           = useState(()=>localStorage.getItem("cockpit_user")||null);
  const [crew, setCrew]               = useState([]);
  const [tonight, setTonight]         = useState(null);
  const [events, setEvents]           = useState([]);
  const [reviews, setReviews]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [notifBanner, setNotifBanner] = useState(null);
  const [notifAsked, setNotifAsked]   = useState(()=>localStorage.getItem("cockpit_notif_asked")||false);
  const [error, setError]             = useState(null);
  const [activeTab, setActiveTab]     = useState("Status");
  const [showWalkIn, setShowWalkIn]   = useState(false);
  const [showSwitch, setShowSwitch]   = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const isHost = crew.find(m=>m.name===myName)?.isHost===true || crew.find(m=>m.name===myName)?.isHost==="TRUE";

  const handleSelectName = (name) => {
    localStorage.setItem("cockpit_user", name);
    setMyName(name);
  };

  const fetchAll = useCallback(async () => {
    try {
      const [crewRes, tonightRes, eventsRes, reviewsRes] = await Promise.all([
        apiGet("getCrew"),
        apiGet("getTonight"),
        apiGet("getEvents"),
        apiGet("getReviews"),
      ]);
      if (crewRes.crew)        setCrew(crewRes.crew);
      if (tonightRes.tonight)  setTonight(tonightRes.tonight);
      if (eventsRes.events)    setEvents(eventsRes.events);
      if (reviewsRes.reviews)  setReviews(reviewsRes.reviews);
      setError(null);
    } catch(e) {
      setError("Couldn't reach The Cockpit. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(()=>{
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
  const isOpen         = tonight?.isOpen===true||tonight?.isOpen==="TRUE";
  const walkins        = tonight?.walkins||[];
  const checkedInCrew  = crew.filter(m=>m.checkedIn===true||m.checkedIn==="TRUE");
  const checkedInNames = checkedInCrew.map(m=>m.name);
  const checkedInTotal = checkedInCrew.length + walkins.length;
  const hosts          = crew.filter(m=>m.isHost===true||m.isHost==="TRUE");
  const regulars       = crew.filter(m=>!(m.isHost===true||m.isHost==="TRUE"));
  const myData         = crew.find(m=>m.name===myName);
  const myCheckedIn    = checkedInNames.includes(myName);

  const toggleBar = async () => {
    const nowOpen = !isOpen;
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

  const sendJuliaAlert = async () => {
    await apiPost({ action:"juliaAlert" });
  };

  const setScheduledTime = async (time) => {
    await apiPost({ action:"setScheduled", time });
    await fetchAll();
  };

  const cleanTime = (t) => {
    if (!t) return "";
    const s = String(t);
    if (/^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(s.trim())) return s.trim();
    const d = new Date(s);
    if (!isNaN(d)) return d.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",timeZone:"America/New_York"});
    return "";
  };

  /* ── RENDER ── */
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

  // All crew sorted by visits for Crew tab
  const crewByVisits = [...crew].sort((a,b)=>Number(b.visits)-Number(a.visits));

  return (
    <>
      <style>{css}</style>
      <SeasonalDecorations />
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

        {/* Seasonal top glow */}
        <div style={{ position:"fixed", top:-120, left:"50%", transform:"translateX(-50%)", width:400, height:260, borderRadius:"50%", pointerEvents:"none", zIndex:0, background:isOpen?`radial-gradient(ellipse,${T.accentGlow} 0%,transparent 70%)`:"none", transition:"background 1.2s ease" }} />

        {/* ── HEADER ── */}
        <div style={{ textAlign:"center", padding:"26px 20px 16px", borderBottom:`1px solid ${border}`, position:"relative", zIndex:1, background:bg }}>
          <button onClick={()=>setShowSwitch(true)} style={{ position:"absolute", top:14, right:14, display:"flex", alignItems:"center", gap:6, background:bgCard, border:`1px solid ${border}`, borderRadius:20, padding:"5px 10px 5px 7px", cursor:"pointer" }}>
            <span style={{ fontSize:16 }}>{getAvatar(crew, myName)}</span>
            <span style={{ fontSize:11, color:txt2, fontFamily:"'Oswald',sans-serif", letterSpacing:.5, fontWeight:500 }}>{myName}</span>
          </button>

          <div style={{ display:"inline-block", background:"#120404", border:"2px solid rgba(255,50,50,0.2)", borderRadius:14, padding:"10px 28px 14px", marginBottom:14, boxShadow:isOpen?`0 0 36px ${T.accentGlow},inset 0 0 20px rgba(255,0,0,0.04)`:"none", transition:"box-shadow 1.2s ease" }}>
            <div style={{ fontSize:9, letterSpacing:5, color:"rgba(255,120,120,0.4)", marginBottom:5, fontWeight:300 }}>✦ GARAGE BAR ✦ {T.label||""}</div>
            <div className={isOpen?"neon-title":"dark-title"} style={{ fontSize:36, lineHeight:1.1 }}>The COCKpit</div>
          </div>

          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:14 }}>
            <div className={isOpen?"live-dot":""} style={{ width:8, height:8, borderRadius:"50%", background:isOpen?T.dotColor:"#3a1010", transition:"background .6s" }} />
            <span style={{ fontSize:16, letterSpacing:3, textTransform:"uppercase", color:isOpen?"#ff6060":dim, fontWeight:500 }}>
              {isOpen?`Open Since ${cleanTime(tonight?.openTime)}`:"Closed"}
            </span>
            {isOpen && <span style={{ background:"rgba(255,50,50,0.15)", border:"1px solid rgba(255,80,80,0.3)", borderRadius:5, padding:"3px 10px", fontSize:11, letterSpacing:1, color:"#ff8080" }}>{checkedInTotal} inside</span>}
          </div>

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
        <div style={{ display:"flex", borderBottom:`1px solid ${border}`, position:"sticky", top:0, background:bg, zIndex:10, overflowX:"auto" }}>
          {tabs.map(tab=>(
            <button key={tab} onClick={()=>setActiveTab(tab)} style={{
              flex:"1", padding:"13px 6px", background:"none", border:"none",
              borderBottom:activeTab===tab?`2px solid ${red}`:"2px solid transparent",
              color:activeTab===tab?txt:txt3,
              fontSize:tab.length > 6 ? 9 : 11,
              letterSpacing:.5, textTransform:"uppercase",
              fontFamily:"'Oswald',sans-serif",
              fontWeight:activeTab===tab?700:400,
              cursor:"pointer", transition:"color .18s",
              whiteSpace:"nowrap",
              minWidth:0,
            }}>
              {tab}
            </button>
          ))}
        </div>

        {/* ── CONTENT ── */}
        <div key={activeTab} className="tab-content" style={{ padding:"20px 16px", position:"relative", zIndex:1 }}>

          {/* STATUS */}
          {activeTab==="Status" && (
            <div>
              {/* Bar open/closed status card */}
              <div style={{ marginBottom:20 }}>
                <div style={{
                  padding:"16px",
                  background: isOpen ? `rgba(${SEASON==="halloween"?"255,102,0":"255,50,50"},0.07)` : bgCard,
                  border: `1px solid ${isOpen ? `rgba(${SEASON==="halloween"?"255,120,0":"255,80,80"},0.25)` : border}`,
                  borderRadius:12,
                  display:"flex", alignItems:"center", gap:14,
                }}>
                  <div style={{ width:14, height:14, borderRadius:"50%", background:isOpen?T.dotColor:"#2a2a2a", boxShadow:isOpen?`0 0 10px ${T.dotColor}`:"none", flexShrink:0 }} className={isOpen?"live-dot":""} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:20, color:txt, fontWeight:700, letterSpacing:1 }}>
                      {isOpen ? "Bar is Open 🍺" : "Bar is Closed"}
                    </div>
                    {isOpen && tonight?.openTime && (
                      <div style={{ fontSize:13, color:txt3, marginTop:2 }}>Open since {cleanTime(tonight.openTime)}</div>
                    )}
                    {!isOpen && tonight?.scheduledTime && (
                      <div style={{ fontSize:13, color:"#ffaa00", marginTop:2 }}>Opening at {tonight.scheduledTime}</div>
                    )}
                    {isOpen && <div style={{ fontSize:13, color:txt3, marginTop:2 }}>{checkedInTotal} {checkedInTotal===1?"person":"people"} inside</div>}
                  </div>
                </div>
              </div>

              {/* Events */}
              <EventsWidget events={events} isHost={isHost} onAdd={addEvent} onDelete={deleteEvent} />

              {/* TV Widget */}
              <Label>On the TV</Label>
              <TVWidget isHost={isHost} whatsOn={tonight?.whatsOn||"Nothing on"} onSetWhatsOn={setWhatsOn} />

              {/* Check-In */}
              <Label>Your Check-In</Label>
              <button onClick={()=>toggleCheckIn(myName, myData?.checkedIn)} disabled={actionLoading} style={{
                width:"100%", padding:"16px",
                background:myCheckedIn?`rgba(${SEASON==="halloween"?"255,102,0":"255,50,50"},0.12)`:bgCard,
                border:`1px solid ${myCheckedIn?`rgba(${SEASON==="halloween"?"255,120,0":"255,80,80"},0.4)`:border}`,
                borderRadius:10, color:myCheckedIn?txt:txt3,
                fontSize:16, letterSpacing:3, textTransform:"uppercase",
                fontFamily:"'Oswald',sans-serif", fontWeight:700,
                boxShadow:myCheckedIn?`0 0 20px ${T.accentGlow}`:"none",
                transition:"all .2s", cursor:"pointer",
              }}>
                {actionLoading?"...":myCheckedIn?"You're Inside — Tap to Leave":"Tap to Check In"}
              </button>

              {/* Quick Actions */}
              <div style={{ marginTop:28, marginBottom:14, display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.08)" }} />
                <div style={{ fontSize:11, color:dim, letterSpacing:3, fontFamily:"'Oswald',sans-serif", fontWeight:500 }}>QUICK ACTIONS</div>
                <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.08)" }} />
              </div>

              <button onClick={sendJuliaAlert} style={{ width:"100%", marginTop:10, padding:"16px", background:"rgba(255,200,0,0.08)", border:"1px solid rgba(255,200,0,0.3)", borderRadius:10, color:"#ffcc00", fontSize:15, letterSpacing:2, textTransform:"uppercase", fontFamily:"'Oswald',sans-serif", fontWeight:700, cursor:"pointer", transition:"all .2s" }}>
                🚨 Julia Alert
              </button>

              {!isOpen && !isHost && (
                <div style={{ marginTop:10 }}>
                  <button onClick={sendCockKnock} disabled={actionLoading} style={{ width:"100%", padding:"16px", background:"rgba(255,149,0,0.1)", border:"1px solid rgba(255,149,0,0.35)", borderRadius:10, color:"#ffaa00", fontSize:15, letterSpacing:2, textTransform:"uppercase", fontFamily:"'Oswald',sans-serif", fontWeight:700, cursor:"pointer", transition:"all .2s" }}>
                    🚪 Cock Knock
                  </button>
                  {(tonight?.knocks || 0) > 0 && (
                    <div style={{ marginTop:10, padding:"12px 16px", background:"rgba(255,149,0,0.07)", border:"1px solid rgba(255,149,0,0.2)", borderRadius:10, textAlign:"center" }}>
                      <div style={{ fontSize:28, marginBottom:4 }}>🚪</div>
                      <div style={{ fontSize:16, color:"#ffaa00", fontWeight:700 }}>
                        {tonight.knocks} Cock Knocker{tonight.knocks===1?"":"s"}
                      </div>
                      <div style={{ fontSize:13, color:dim, marginTop:4 }}>John & Melissa have been notified 🚪</div>
                    </div>
                  )}
                </div>
              )}

              {!isOpen && isHost && (tonight?.knocks || 0) > 0 && (
                <div style={{ marginTop:10, padding:"14px 16px", background:"rgba(255,149,0,0.07)", border:"1px solid rgba(255,149,0,0.2)", borderRadius:10, textAlign:"center" }}>
                  <div style={{ fontSize:28, marginBottom:4 }}>🚪</div>
                  <div style={{ fontSize:16, color:"#ffaa00", fontWeight:700, marginBottom:4 }}>
                    {tonight.knocks} Cock Knocker{tonight.knocks===1?"":"s"}
                  </div>
                  <div style={{ fontSize:13, color:dim, marginBottom:12 }}>
                    {(tonight.knockers||[]).join(", ")}
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={denyKnock} style={{ flex:1, padding:"10px", background:"rgba(255,50,50,0.15)", border:"1px solid rgba(255,80,80,0.35)", borderRadius:8, color:red, fontSize:12, letterSpacing:2, textTransform:"uppercase", fontFamily:"'Oswald',sans-serif", fontWeight:700, cursor:"pointer" }}>🚫 Deny</button>
                    <div style={{ flex:1, padding:"10px", fontSize:12, color:dim, display:"flex", alignItems:"center", justifyContent:"center" }}>or open the bar</div>
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

          {/* CREW — merged with Board */}
          {activeTab==="Crew" && (
            <div>
              {/* Leaderboard */}
              <Label>Leaderboard</Label>
              {crewByVisits.map((m,i)=>{
                const cin = m.checkedIn===true||m.checkedIn==="TRUE";
                const isHostMember = m.isHost===true||m.isHost==="TRUE";
                return (
                  <div key={m.name} onClick={()=>!isHostMember&&toggleCheckIn(m.name,m.checkedIn)} style={{
                    display:"flex", alignItems:"center", gap:12,
                    padding:"13px 15px", borderRadius:10, marginBottom:8,
                    background:cin?`rgba(${SEASON==="halloween"?"255,102,0":"255,68,68"},0.1)`:bgCard,
                    border:`1px solid ${cin?`rgba(${SEASON==="halloween"?"255,120,0":"255,80,80"},0.35)`:border}`,
                    cursor:isHostMember?"default":"pointer",
                    transition:"all .15s",
                  }}>
                    {/* Rank */}
                    <div style={{ width:28, textAlign:"center", flexShrink:0 }}>
                      {i===0 ? <span style={{ fontSize:18 }}>🥇</span>
                        : i===1 ? <span style={{ fontSize:18 }}>🥈</span>
                        : i===2 ? <span style={{ fontSize:18 }}>🥉</span>
                        : <span style={{ fontSize:13, color:dim, fontWeight:600 }}>#{i+1}</span>}
                    </div>
                    {/* Avatar */}
                    <span style={{ fontSize:26 }}>{getAvatar(crew, m.name)}</span>
                    {/* Info */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                        <span style={{ fontSize:16, color:txt, fontWeight:700 }}>{m.name}</span>
                        {isHostMember && <span style={{ fontSize:8, color:red, background:"rgba(255,68,68,0.15)", padding:"2px 6px", borderRadius:3, letterSpacing:1 }}>HOST</span>}
                        {m.name==="Rashawn" && <span style={{ fontSize:8, color:"#c85a28", background:"rgba(200,90,40,0.15)", padding:"2px 6px", borderRadius:3, letterSpacing:1 }}>SMOKE MASTER</span>}
                      </div>
                      <div style={{ fontSize:12, color:txt3, marginTop:2 }}>🥤 {m.drink}</div>
                    </div>
                    {/* Visits + status */}
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <div style={{ fontSize:20, color:i===0?red:txt2, fontWeight:i===0?700:500 }}>{m.visits}</div>
                      <div style={{ fontSize:9, color:dim, letterSpacing:1 }}>VISITS</div>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:cin?T.dotColor:"#333", boxShadow:cin?`0 0 6px ${T.dotColor}`:"none", marginLeft:"auto", marginTop:4 }} />
                    </div>
                  </div>
                );
              })}

              {/* Walk-ins */}
              {walkins.length > 0 && (
                <div style={{ marginTop:16 }}>
                  <Label>Walk-Ins Tonight</Label>
                  {walkins.map((w,i)=>(
                    <Card key={i} highlight style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontSize:22 }}>🚶</span>
                      <span style={{ flex:1, fontSize:15, color:txt, fontWeight:600 }}>{w}</span>
                      <span style={{ fontSize:11, color:txt3 }}>walk-in</span>
                    </Card>
                  ))}
                </div>
              )}

              {/* Badges */}
              <div style={{ marginTop:22 }}>
                <Label>Badges</Label>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                  {BADGES.map((b,i)=>(
                    <div key={i} style={{ padding:"14px 8px", textAlign:"center", background:b.earned?bgCard2:bgCard, border:`1px solid ${b.earned?`rgba(${SEASON==="halloween"?"255,102,0":"255,80,80"},0.2)`:border}`, borderRadius:10, opacity:b.earned?1:.3, filter:b.earned?"none":"grayscale(1)" }}>
                      <div style={{ fontSize:26 }}>{b.icon}</div>
                      <div style={{ fontSize:11, color:b.earned?txt:dim, marginTop:7, fontWeight:600 }}>{b.label}</div>
                      <div style={{ fontSize:10, color:dim, marginTop:3, lineHeight:1.4 }}>{b.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* WEATHER */}
          {activeTab==="Weather" && <WeatherTab />}

          {/* REVIEWS */}
          {activeTab==="Reviews" && (
            <ReviewsTab
              reviews={reviews}
              myName={myName}
              isHost={isHost}
              crew={crew}
              onSubmit={submitReview}
              onDelete={deleteReview}
            />
          )}

          {/* HALLOWEEN GAMES */}
          {activeTab==="🎃 Games" && <HalloweenGamesTab />}

        </div>

        {/* Footer */}
        <div style={{ height:44, borderTop:`1px solid ${border}`, display:"flex", alignItems:"center", justifyContent:"center", color:dim, fontSize:9, letterSpacing:4, textTransform:"uppercase", fontWeight:300 }}>
          Members Only · All Roads Lead to Happy Hour {T.label||""}
        </div>
      </div>
    </>
  );
}
