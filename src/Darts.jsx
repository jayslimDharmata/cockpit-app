import { useState, useRef } from "react";

const FACE_IMG = "data:image/jpeg;base64,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";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Oswald:wght@400;600;700&family=Share+Tech+Mono&display=swap');

  @keyframes dartThrow {
    0%   { transform: translate(-200px, -200px) rotate(-45deg) scale(0.5); opacity:0; }
    60%  { transform: translate(0,0) rotate(-45deg) scale(1.1); opacity:1; }
    80%  { transform: translate(0,0) rotate(-45deg) scale(0.95); }
    100% { transform: translate(0,0) rotate(-45deg) scale(1); opacity:1; }
  }
  @keyframes scorePopup {
    0%   { transform: translateY(0) scale(0.5); opacity:0; }
    40%  { transform: translateY(-20px) scale(1.3); opacity:1; }
    100% { transform: translateY(-40px) scale(1); opacity:0; }
  }
  @keyframes shakeBoard {
    0%,100% { transform: rotate(0deg); }
    20%  { transform: rotate(-2deg); }
    40%  { transform: rotate(2deg); }
    60%  { transform: rotate(-1deg); }
    80%  { transform: rotate(1deg); }
  }
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(10px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes glowPulse {
    0%,100% { box-shadow: 0 0 0 4px #1a0808, 0 0 0 8px #2a0a0a, 0 0 30px rgba(255,32,32,0.3); }
    50%      { box-shadow: 0 0 0 4px #1a0808, 0 0 0 8px #2a0a0a, 0 0 50px rgba(255,32,32,0.6); }
  }
  @keyframes faceShake {
    0%,100% { transform: rotate(0deg) scale(1); }
    25% { transform: rotate(-6deg) scale(1.08); }
    75% { transform: rotate(6deg) scale(1.08); }
  }

  .board-shake { animation: shakeBoard 0.4s ease; }
  .dart-throw  { animation: dartThrow 0.35s cubic-bezier(.17,.67,.12,1) forwards; }
  .score-popup { animation: scorePopup 1s ease forwards; }
  .face-hit    { animation: faceShake 0.4s ease; }
  .tab-content { animation: fadeUp .2s ease forwards; }
  .mono        { font-family: 'Share Tech Mono', monospace !important; }
  * { box-sizing: border-box; touch-action: manipulation; }
`;

const RING_SCORES = [
  { r: 8,   score: "BULLSEYE", color: "#ff2020", pts: 50  },
  { r: 16,  score: "BULL",     color: "#1a8a1a", pts: 25  },
  { r: 60,  score: "TRIPLE",   color: "#ff2020", pts: 3   },
  { r: 75,  score: "DOUBLE",   color: "#1a8a1a", pts: 2   },
  { r: 110, score: "SINGLE",   color: "#1a0808", pts: 1   },
  { r: 125, score: "MISS",     color: "#0a0000", pts: 0   },
];

const REACTIONS = {
  "BULLSEYE": ["RIGHT IN THE FACE 😂", "BULLSEYE JULIA GULIA!!!", "SHE FELT THAT 💀", "HEADSHOT! 🎯", "DIRECT HIT — NO MORE VIOLATIONS!"],
  "BULL":     ["Close enough 😤", "BULL! She's sweating", "Almost got her!", "She's worried 🔥"],
  "TRIPLE":   ["TRIPLE! 🔥 Permit denied!", "Not bad!", "Julia's nervous 😅", "Triple zone!"],
  "DOUBLE":   ["Double! Application rejected 👍", "Not bad at all", "Double zone!", "Keep aiming"],
  "SINGLE":   ["Single... aim for the face 😂", "Barely counts", "She'll be back with more paperwork", "Try harder!"],
  "MISS":     ["MISS! She escapes... for now 😂", "Julia is safe 😅", "Nowhere close", "Did you read the code violation first?"],
};

function getReaction(score) {
  const opts = REACTIONS[score];
  return opts[Math.floor(Math.random() * opts.length)];
}

function getScoreForRadius(dist, boardR) {
  const pct = dist / boardR;
  if (pct <= 0.064) return RING_SCORES[0];
  if (pct <= 0.128) return RING_SCORES[1];
  if (pct <= 0.48)  return RING_SCORES[2];
  if (pct <= 0.60)  return RING_SCORES[3];
  if (pct <= 0.88)  return RING_SCORES[4];
  return RING_SCORES[5];
}

export default function Darts() {
  const boardRef = useRef(null);
  const [darts, setDarts]             = useState([]);
  const [scores, setScores]           = useState([]);
  const [total, setTotal]             = useState(0);
  const [shaking, setShaking]         = useState(false);
  const [faceHit, setFaceHit]         = useState(false);
  const [lastReaction, setLastReaction] = useState(null);
  const [popups, setPopups]           = useState([]);
  const [hits, setHits]               = useState(0);
  const [throws, setThrows]           = useState(0);

  const throwDart = (e) => {
    e.preventDefault();
    const board = boardRef.current;
    if (!board) return;
    const rect    = board.getBoundingClientRect();
    const cx      = rect.left + rect.width / 2;
    const cy      = rect.top  + rect.height / 2;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const dx      = clientX - cx;
    const dy      = clientY - cy;
    const dist    = Math.sqrt(dx*dx + dy*dy);
    const boardR  = rect.width / 2;

    const pctX = ((clientX - rect.left) / rect.width) * 100;
    const pctY = ((clientY - rect.top)  / rect.height) * 100;

    const zone     = getScoreForRadius(dist, boardR);
    const reaction = getReaction(zone.score);
    const isBull   = zone.pts >= 25;
    const isMiss   = zone.pts === 0;

    const newDart = { id: Date.now(), x: pctX, y: pctY, zone };
    setDarts(d => [...d.slice(-9), newDart]);
    setThrows(t => t + 1);

    if (!isMiss) {
      setTotal(t => t + zone.pts);
      setHits(h => h + 1);
    }
    setScores(s => [...s.slice(-4), { score: zone.score, pts: zone.pts, reaction }]);
    setLastReaction(reaction);

    const popup = {
      id: Date.now(), x: pctX, y: pctY,
      text: isMiss ? "MISS!" : `+${zone.pts}`,
      color: isBull ? "#ff2020" : isMiss ? "#555" : "#ffffff",
    };
    setPopups(p => [...p, popup]);
    setTimeout(() => setPopups(p => p.filter(x => x.id !== popup.id)), 1000);

    if (isBull) { setFaceHit(true); setTimeout(() => setFaceHit(false), 400); }
    setShaking(true);
    setTimeout(() => setShaking(false), 400);
  };

  const reset = () => {
    setDarts([]); setScores([]); setTotal(0);
    setLastReaction(null); setHits(0); setThrows(0);
  };

  const accuracy = throws > 0 ? Math.round((hits / throws) * 100) : 0;

  return (
    <>
      <style>{css}</style>
      <div style={{ fontFamily:"'Oswald',sans-serif", background:"#080000", minHeight:"100vh", color:"#ffffff", maxWidth:430, margin:"0 auto", padding:"20px 16px 30px" }}>

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:20 }}>
          <div style={{ fontSize:9, letterSpacing:5, color:"rgba(255,120,120,0.5)", marginBottom:4 }}>🎯 COCKPIT DARTS</div>
          <div style={{ fontFamily:"'Permanent Marker',cursive", fontSize:28, color:"#fff", textShadow:"0 0 20px rgba(255,32,32,0.6)", lineHeight:1.1 }}>
            Julia Gulia
          </div>
          <div style={{ fontSize:11, color:"#ff6060", letterSpacing:1, marginTop:4 }}>Code Compliance Dept.</div>
          <div className="mono" style={{ fontSize:9, color:"#444", letterSpacing:2, marginTop:4 }}>TAP THE BOARD TO THROW</div>
        </div>

        {/* Stats */}
        <div style={{ display:"flex", gap:8, marginBottom:16 }}>
          {[
            { label:"SCORE",    value: total,        color:"#ff5050" },
            { label:"THROWS",   value: throws,       color:"#ffffff" },
            { label:"ACCURACY", value: `${accuracy}%`, color:"#ffcc44" },
          ].map((s,i) => (
            <div key={i} style={{ flex:1, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"10px 8px", textAlign:"center" }}>
              <div style={{ fontSize:20, color:s.color, fontWeight:700 }}>{s.value}</div>
              <div className="mono" style={{ fontSize:8, color:"#555", letterSpacing:1, marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Board */}
        <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}>
          <div
            ref={boardRef}
            className={shaking ? "board-shake" : ""}
            onClick={throwDart}
            onTouchStart={throwDart}
            style={{
              width:290, height:290, borderRadius:"50%",
              position:"relative", cursor:"crosshair",
              background:"#0a0000",
              animation:"glowPulse 2s ease infinite",
              userSelect:"none",
            }}>

            {/* Rings */}
            {[...RING_SCORES].reverse().map((ring, i) => (
              <div key={i} style={{
                position:"absolute",
                width:`${(ring.r / 125) * 100}%`,
                height:`${(ring.r / 125) * 100}%`,
                borderRadius:"50%",
                background:ring.color,
                top:"50%", left:"50%",
                transform:"translate(-50%,-50%)",
                border:"1px solid rgba(255,255,255,0.08)",
              }} />
            ))}

            {/* Segment overlay */}
            <div style={{
              position:"absolute", inset:0, borderRadius:"50%",
              background:"conic-gradient(rgba(0,0,0,0.22) 0deg 18deg, transparent 18deg 36deg, rgba(0,0,0,0.22) 36deg 54deg, transparent 54deg 72deg, rgba(0,0,0,0.22) 72deg 90deg, transparent 90deg 108deg, rgba(0,0,0,0.22) 108deg 126deg, transparent 126deg 144deg, rgba(0,0,0,0.22) 144deg 162deg, transparent 162deg 180deg, rgba(0,0,0,0.22) 180deg 198deg, transparent 198deg 216deg, rgba(0,0,0,0.22) 216deg 234deg, transparent 234deg 252deg, rgba(0,0,0,0.22) 252deg 270deg, transparent 270deg 288deg, rgba(0,0,0,0.22) 288deg 306deg, transparent 306deg 324deg, rgba(0,0,0,0.22) 324deg 342deg, transparent 342deg 360deg)",
              pointerEvents:"none",
            }} />

            {/* Julia Gulia's face — bullseye */}
            <div style={{
              position:"absolute",
              width:"26%", height:"26%",
              borderRadius:"50%",
              top:"50%", left:"50%",
              transform:"translate(-50%,-50%)",
              overflow:"hidden",
              border:"3px solid #ff2020",
              boxShadow:"0 0 14px #ff2020, 0 0 4px rgba(255,32,32,0.8)",
              zIndex:10,
            }}>
              <img
                src={FACE_IMG}
                alt="Julia Gulia"
                className={faceHit ? "face-hit" : ""}
                style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center 20%" }}
              />
            </div>

            {/* Dart marks */}
            {darts.map(dart => (
              <div key={dart.id} className="dart-throw" style={{
                position:"absolute",
                left:`${dart.x}%`, top:`${dart.y}%`,
                transform:"translate(-50%,-50%) rotate(-45deg)",
                fontSize:18, zIndex:20, pointerEvents:"none",
                filter:`drop-shadow(0 0 4px ${dart.zone.pts >= 25 ? "#ff2020" : "#fff"})`,
              }}>🎯</div>
            ))}

            {/* Score popups */}
            {popups.map(p => (
              <div key={p.id} className="score-popup" style={{
                position:"absolute",
                left:`${p.x}%`, top:`${p.y}%`,
                transform:"translate(-50%,-50%)",
                fontSize:20, fontWeight:700, color:p.color,
                pointerEvents:"none", zIndex:30,
                textShadow:"0 0 8px rgba(0,0,0,0.9)",
                whiteSpace:"nowrap",
              }}>{p.text}</div>
            ))}
          </div>
        </div>

        {/* Reaction */}
        {lastReaction && (
          <div className="tab-content" style={{
            textAlign:"center", marginBottom:14,
            padding:"12px 16px", borderRadius:8,
            background:"rgba(255,32,32,0.08)",
            border:"1px solid rgba(255,80,80,0.25)",
            fontSize:14, color:"#ffffff", fontWeight:600, letterSpacing:.3,
          }}>
            {lastReaction}
          </div>
        )}

        {/* Recent throws */}
        {scores.length > 0 && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:10, color:"#ff6060", letterSpacing:3, marginBottom:8, borderLeft:"2px solid #ff2020", paddingLeft:8, fontWeight:600 }}>RECENT THROWS</div>
            {[...scores].reverse().map((s, i) => (
              <div key={i} style={{
                display:"flex", alignItems:"center", gap:10,
                padding:"8px 12px", marginBottom:6,
                background: i===0 ? "rgba(255,32,32,0.1)" : "rgba(255,255,255,0.03)",
                border:`1px solid ${i===0 ? "rgba(255,80,80,0.3)" : "rgba(255,255,255,0.07)"}`,
                borderRadius:7, opacity: 1 - (i * 0.18),
              }}>
                <span className="mono" style={{ fontSize:11, color: s.score==="MISS"?"#555":"#ff8080", minWidth:60 }}>{s.score}</span>
                <span style={{ fontSize:11, color:"#999", flex:1 }}>{s.reaction}</span>
                <span style={{ fontSize:14, color: s.pts===0?"#444":"#ffffff", fontWeight:700 }}>
                  {s.pts===0 ? "—" : `+${s.pts}`}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Reset */}
        <button onClick={reset} style={{
          width:"100%", padding:"13px",
          background:"rgba(255,255,255,0.04)",
          border:"1px dashed rgba(255,255,255,0.15)",
          borderRadius:8, color:"#555",
          fontSize:11, letterSpacing:3, textTransform:"uppercase",
          fontFamily:"'Oswald',sans-serif", fontWeight:500, cursor:"pointer",
        }}>🔄 New Game</button>
      </div>
    </>
  );
}
