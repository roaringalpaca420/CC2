import { useState, useEffect, useRef, useCallback } from "react";
import { generateCatFromSeed, renderCatSVG } from "./catGenerator";

// ── CAT DATABASE (fallback / legacy - procedural cats replace most encounters) ──
const CATS = [
  { id: "c1", name: "Whiskers", rarity: "COMMON", behavior: "PLAYFUL", callType: "PSPS", pitchMin: 200, pitchMax: 500, volumeMin: 40, volumeMax: 75, emoji: "🐱", color: "#F59E0B", desc: "A friendly tabby who loves attention" },
  { id: "c2", name: "Shadow", rarity: "COMMON", behavior: "SHY", callType: "PSPS", pitchMin: 180, pitchMax: 450, volumeMin: 30, volumeMax: 60, emoji: "🐈‍⬛", color: "#6B7280", desc: "A quiet dark cat who prefers gentle calls" },
  { id: "c3", name: "Marmalade", rarity: "COMMON", behavior: "DOMINANT", callType: "PSPS", pitchMin: 220, pitchMax: 520, volumeMin: 50, volumeMax: 80, emoji: "🧡", color: "#EA580C", desc: "A bold ginger with a confident strut" },
  { id: "c4", name: "Mittens", rarity: "COMMON", behavior: "PLAYFUL", callType: "PSPS", pitchMin: 250, pitchMax: 550, volumeMin: 35, volumeMax: 70, emoji: "🐾", color: "#8B5CF6", desc: "White paws, mischievous spirit" },
  { id: "c5", name: "Dusty", rarity: "COMMON", behavior: "SKITTISH", callType: "PSPS", pitchMin: 200, pitchMax: 480, volumeMin: 30, volumeMax: 55, emoji: "🐱", color: "#A8A29E", desc: "A nervous stray — tread lightly" },
  { id: "c6", name: "Luna", rarity: "UNCOMMON", behavior: "SHY", callType: "PSPS", pitchMin: 300, pitchMax: 600, volumeMin: 25, volumeMax: 55, emoji: "🌙", color: "#3B82F6", desc: "Appears at dusk. Silvery and elusive." },
  { id: "c7", name: "Blaze", rarity: "UNCOMMON", behavior: "DOMINANT", callType: "PSPS", pitchMin: 250, pitchMax: 500, volumeMin: 55, volumeMax: 85, emoji: "🔥", color: "#DC2626", desc: "Fiery attitude, demands a strong call" },
  { id: "c8", name: "Nimbus", rarity: "UNCOMMON", behavior: "PLAYFUL", callType: "PSPS", pitchMin: 280, pitchMax: 550, volumeMin: 35, volumeMax: 65, emoji: "☁️", color: "#06B6D4", desc: "Fluffy as a cloud, quick as the wind" },
  { id: "c9", name: "Phantom", rarity: "RARE", behavior: "SKITTISH", callType: "PSPS", pitchMin: 200, pitchMax: 400, volumeMin: 20, volumeMax: 50, emoji: "👻", color: "#7C3AED", desc: "Almost invisible. Requires perfect precision." },
  { id: "c10", name: "Goldie", rarity: "RARE", behavior: "SHY", callType: "PSPS", pitchMin: 280, pitchMax: 480, volumeMin: 30, volumeMax: 55, emoji: "✨", color: "#EAB308", desc: "A legendary golden-furred stray." },
];

const RARITY_CONFIG = {
  COMMON: { label: "Common", bg: "#374151", border: "#6B7280", threshold: 50 },
  UNCOMMON: { label: "Uncommon", bg: "#1E3A5F", border: "#3B82F6", threshold: 60 },
  RARE: { label: "Rare", bg: "#4C1D95", border: "#8B5CF6", threshold: 75 },
  LEGENDARY: { label: "Legendary", bg: "#7C2D12", border: "#F59E0B", threshold: 90 },
};

const BEHAVIOR_LABELS = { SHY: "Shy — be gentle", DOMINANT: "Dominant — be confident", PLAYFUL: "Playful — keep rhythm", SKITTISH: "Skittish — be precise" };

const MENTOR_LINES = {
  welcome: "G'day! I'm Bruce, your cat rescue guide. Tap SCAN to find some strays!",
  scanning: "Scanning the area... let's see what's lurking about...",
  nothing: "Nothing this time, mate. Give it another go!",
  loot: "No cat, but look what we found! Could come in handy.",
  encounter: "There's one! Quick — make your call. Match the pitch and volume!",
  success: "Brilliant! You've rescued this one. Welcome to the sanctuary!",
  fail_close: "So close! Your pitch was good but watch your volume next time.",
  fail: "The cat scarpered. Don't worry — plenty more out there!",
  rare_spawn: "Crikey! That's a rare one! Focus up, you've got this!",
  sanctuary: "Here's your sanctuary — every cat you've rescued, safe and sound.",
};

const LOOT_TABLE = [
  { name: "Catnip", emoji: "🌿", desc: "+Spawn rate next 3 scans" },
  { name: "Milk", emoji: "🥛", desc: "+10% call tolerance" },
  { name: "Toy Mouse", emoji: "🐭", desc: "Attracts playful cats" },
  { name: "Tuna Can", emoji: "🐟", desc: "+Rare spawn chance" },
];

// ── AUDIO ENGINE ──
function useAudioAnalyzer() {
  const ctxRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const [audioData, setAudioData] = useState({ pitch: 0, volume: 0, active: false });

  const autoCorrelate = useCallback((buf, sampleRate) => {
    let size = buf.length;
    let rms = 0;
    for (let i = 0; i < size; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / size);
    if (rms < 0.01) return -1;

    let r1 = 0, r2 = size - 1;
    const thresh = 0.2;
    for (let i = 0; i < size / 2; i++) { if (Math.abs(buf[i]) < thresh) { r1 = i; break; } }
    for (let i = 1; i < size / 2; i++) { if (Math.abs(buf[size - i]) < thresh) { r2 = size - i; break; } }

    buf = buf.slice(r1, r2);
    size = buf.length;
    const c = new Array(size).fill(0);
    for (let i = 0; i < size; i++) for (let j = 0; j < size - i; j++) c[i] += buf[j] * buf[j + i];

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < size; i++) {
      if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
    }
    let T0 = maxpos;
    let x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    let a = (x1 + x3 - 2 * x2) / 2;
    let b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);
    return sampleRate / T0;
  }, []);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      src.connect(analyser);
      analyserRef.current = analyser;

      const buf = new Float32Array(analyser.fftSize);
      const loop = () => {
        analyser.getFloatTimeDomainData(buf);
        const pitch = autoCorrelate(buf, ctx.sampleRate);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        const rms = Math.sqrt(sum / buf.length);
        const db = Math.max(0, Math.min(100, 20 * Math.log10(rms) + 90));
        setAudioData({ pitch: pitch > 0 ? Math.round(pitch) : 0, volume: Math.round(db), active: true });
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
    } catch (e) {
      console.error("Mic error:", e);
    }
  }, [autoCorrelate]);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (ctxRef.current) ctxRef.current.close();
    setAudioData({ pitch: 0, volume: 0, active: false });
  }, []);

  return { audioData, start, stop };
}

// ── COMPONENTS ──
const ScreenTitle = ({ children }) => (
  <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 28, fontWeight: 600, color: "#F8FAFC", margin: "0 0 8px", letterSpacing: 0.5 }}>{children}</h2>
);

const MentorBox = ({ text }) => (
  <div style={{ background: "linear-gradient(135deg, #1E3A5F 0%, #172554 100%)", border: "2px solid #3B82F6", borderRadius: 16, padding: "14px 18px", margin: "12px 0", display: "flex", gap: 12, alignItems: "flex-start" }}>
    <span style={{ fontSize: 28, flexShrink: 0 }}>🦘</span>
    <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: "#CBD5E1", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>"{text}"</p>
  </div>
);

const RarityBadge = ({ rarity }) => {
  const c = RARITY_CONFIG[rarity];
  return (
    <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, fontFamily: "'Nunito', sans-serif", background: c.bg, border: `2px solid ${c.border}`, color: c.border, letterSpacing: 1, textTransform: "uppercase" }}>{c.label}</span>
  );
};

const PitchMeter = ({ value, min, max, label }) => {
  const pct = max > min ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)) : 0;
  const inRange = value >= min && value <= max && value > 0;
  return (
    <div style={{ margin: "8px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: "#94A3B8" }}>{label}</span>
        <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: inRange ? "#4ADE80" : "#F87171", fontWeight: 700 }}>{value > 0 ? value : "—"}</span>
      </div>
      <div style={{ height: 10, background: "#1E293B", borderRadius: 5, overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", left: "0%", right: "0%", top: 0, bottom: 0, background: "rgba(74,222,128,0.15)", borderRadius: 5 }} />
        <div style={{
          position: "absolute", height: "100%", width: 4, borderRadius: 2,
          background: inRange ? "#4ADE80" : "#F87171",
          left: `${Math.min(98, Math.max(0, pct))}%`,
          transition: "left 0.1s ease-out, background 0.2s",
          boxShadow: inRange ? "0 0 8px #4ADE80" : "0 0 8px #F87171",
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
        <span style={{ fontSize: 10, color: "#475569" }}>{min}</span>
        <span style={{ fontSize: 10, color: "#475569" }}>{max}</span>
      </div>
    </div>
  );
};

const CatCard = ({ cat, small }) => (
  <div style={{
    background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
    border: `2px solid ${RARITY_CONFIG[cat.rarity].border}`,
    borderRadius: 16, padding: small ? 12 : 20, textAlign: "center",
    boxShadow: `0 0 20px ${RARITY_CONFIG[cat.rarity].border}33`,
    ...(small ? { display: "flex", alignItems: "center", gap: 12, textAlign: "left" } : {}),
  }}>
    <div style={{ width: small ? 64 : 120, height: small ? 64 : 120, flexShrink: 0, ...(small ? {} : { marginBottom: 8 }) }}>
      {cat.genes ? (
        <div style={{ width: "100%", height: "100%", overflow: "hidden", borderRadius: 12 }} dangerouslySetInnerHTML={{ __html: renderCatSVG(cat.genes) }} />
      ) : (
        <span style={{ fontSize: small ? 32 : 56, lineHeight: 1 }}>{cat.emoji}</span>
      )}
    </div>
    <div>
      <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: small ? 16 : 22, color: cat.color, fontWeight: 600 }}>{cat.name}</div>
      {!small && <RarityBadge rarity={cat.rarity} />}
      <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: small ? 11 : 13, color: "#94A3B8", marginTop: 4 }}>{cat.desc}</div>
      {small && <RarityBadge rarity={cat.rarity} />}
    </div>
  </div>
);

// ── MAIN APP ──
export default function CatCallPrototype() {
  const [screen, setScreen] = useState("HOME");
  const [mentor, setMentor] = useState(MENTOR_LINES.welcome);
  const [currentCat, setCurrentCat] = useState(null);
  const [lootDrop, setLootDrop] = useState(null);
  const [sanctuary, setSanctuary] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [callTimer, setCallTimer] = useState(0);
  const [callScore, setCallScore] = useState({ pitch: 0, volume: 0, total: 0 });
  const [scanCount, setScanCount] = useState(0);
  const [scanAnim, setScanAnim] = useState(false);
  const [resultType, setResultType] = useState(null);
  const timerRef = useRef(null);
  const scoreAccRef = useRef({ pitchHits: 0, volHits: 0, samples: 0 });
  const { audioData, start: startAudio, stop: stopAudio } = useAudioAnalyzer();

  const rollEncounter = () => {
    const r = Math.random() * 100;
    const streak = Math.min(scanCount * 2, 10);
    if (r < 35 - streak) return "NOTHING";
    if (r < 55 - streak) return "LOOT";
    if (r < 80) return "COMMON";
    if (r < 92) return "UNCOMMON";
    return "RARE";
  };

  const handleScan = () => {
    setScreen("SCANNING");
    setMentor(MENTOR_LINES.scanning);
    setScanAnim(true);
    setScanCount(c => c + 1);

    setTimeout(() => {
      setScanAnim(false);
      const result = rollEncounter();
      if (result === "NOTHING") {
        setMentor(MENTOR_LINES.nothing);
        setResultType("NOTHING");
        setScreen("RESULT");
        setScanCount(0);
      } else if (result === "LOOT") {
        const item = LOOT_TABLE[Math.floor(Math.random() * LOOT_TABLE.length)];
        setLootDrop(item);
        setInventory(inv => [...inv, item]);
        setMentor(MENTOR_LINES.loot);
        setResultType("LOOT");
        setScreen("RESULT");
        setScanCount(0);
      } else {
        const encounterId = `enc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const cat = generateCatFromSeed(encounterId, result);
        setCurrentCat(cat);
        setMentor(cat.rarity === "RARE" ? MENTOR_LINES.rare_spawn : MENTOR_LINES.encounter);
        setScreen("ENCOUNTER");
      }
    }, 2200);
  };

  const startCall = async () => {
    setScreen("CALLING");
    setCallTimer(5);
    scoreAccRef.current = { pitchHits: 0, volHits: 0, samples: 0 };
    await startAudio();

    let t = 5;
    timerRef.current = setInterval(() => {
      t--;
      setCallTimer(t);
      if (t <= 0) {
        clearInterval(timerRef.current);
        endCall();
      }
    }, 1000);
  };

  useEffect(() => {
    if (screen === "CALLING" && audioData.active && currentCat) {
      const acc = scoreAccRef.current;
      acc.samples++;
      if (audioData.pitch >= currentCat.pitchMin && audioData.pitch <= currentCat.pitchMax) acc.pitchHits++;
      if (audioData.volume >= currentCat.volumeMin && audioData.volume <= currentCat.volumeMax) acc.volHits++;
    }
  }, [audioData, screen, currentCat]);

  const endCall = () => {
    stopAudio();
    if (timerRef.current) clearInterval(timerRef.current);
    const acc = scoreAccRef.current;
    const s = acc.samples || 1;
    const pitchScore = Math.round((acc.pitchHits / s) * 100);
    const volScore = Math.round((acc.volHits / s) * 100);
    const total = Math.round(pitchScore * 0.55 + volScore * 0.45);
    setCallScore({ pitch: pitchScore, volume: volScore, total });
    const threshold = RARITY_CONFIG[currentCat.rarity].threshold;

    if (total >= threshold) {
      setSanctuary(prev => [...prev, { ...currentCat, capturedAt: new Date().toLocaleTimeString() }]);
      setMentor(MENTOR_LINES.success);
      setResultType("CAPTURE");
      setScanCount(0);
    } else if (total >= threshold - 15) {
      setMentor(MENTOR_LINES.fail_close);
      setResultType("FAIL");
    } else {
      setMentor(MENTOR_LINES.fail);
      setResultType("FAIL");
    }
    setScreen("RESULT");
  };

  useEffect(() => () => { stopAudio(); if (timerRef.current) clearInterval(timerRef.current); }, [stopAudio]);

  const containerStyle = {
    width: "100%", maxWidth: 420, minHeight: "100vh", margin: "0 auto",
    background: "linear-gradient(180deg, #0B1120 0%, #0F172A 40%, #1E1B2E 100%)",
    fontFamily: "'Nunito', sans-serif", position: "relative", overflow: "hidden",
    display: "flex", flexDirection: "column",
  };

  const btnStyle = (bg, glow) => ({
    padding: "14px 32px", borderRadius: 50, border: "none", cursor: "pointer",
    fontFamily: "'Fredoka', sans-serif", fontSize: 18, fontWeight: 600, color: "#FFF",
    background: bg, boxShadow: `0 0 24px ${glow}66, 0 4px 12px rgba(0,0,0,0.3)`,
    transition: "transform 0.15s, box-shadow 0.15s",
  });

  return (
    <div style={containerStyle}>
      <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet" />

      {/* ── HEADER ── */}
      <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1E293B" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 24 }}>🐱</span>
          <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 22, fontWeight: 700, color: "#F8FAFC", letterSpacing: 1 }}>CAT CALL</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { setScreen("SANCTUARY"); setMentor(MENTOR_LINES.sanctuary); }}
            style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 10, padding: "6px 14px", color: "#94A3B8", fontSize: 13, cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontWeight: 600 }}>
            🏠 {sanctuary.length}
          </button>
          <button onClick={() => setScreen("INVENTORY")}
            style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 10, padding: "6px 14px", color: "#94A3B8", fontSize: 13, cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontWeight: 600 }}>
            🎒 {inventory.length}
          </button>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column" }}>

        {/* HOME */}
        {screen === "HOME" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 20 }}>
            <div style={{ fontSize: 80, animation: "float 3s ease-in-out infinite" }}>🐱</div>
            <MentorBox text={mentor} />
            <button onClick={handleScan} style={btnStyle("linear-gradient(135deg, #3B82F6, #6366F1)", "#6366F1")}>
              📡 SCAN FOR CATS
            </button>
            <p style={{ fontSize: 12, color: "#475569", textAlign: "center" }}>Scans: {scanCount} | Rescued: {sanctuary.length}</p>
          </div>
        )}

        {/* SCANNING */}
        {screen === "SCANNING" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 24 }}>
            <div style={{ position: "relative", width: 160, height: 160 }}>
              <div style={{
                width: 160, height: 160, borderRadius: "50%", border: "3px solid #3B82F6",
                animation: "pulse-ring 1.5s ease-out infinite",
                position: "absolute", top: 0, left: 0,
              }} />
              <div style={{
                width: 120, height: 120, borderRadius: "50%", border: "2px solid #6366F1",
                animation: "pulse-ring 1.5s ease-out infinite 0.3s",
                position: "absolute", top: 20, left: 20,
              }} />
              <div style={{
                width: 80, height: 80, borderRadius: "50%", background: "radial-gradient(circle, #3B82F6 0%, transparent 70%)",
                animation: "pulse-ring 1.5s ease-out infinite 0.6s",
                position: "absolute", top: 40, left: 40,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32,
              }}>📡</div>
            </div>
            <MentorBox text={mentor} />
            <p style={{ color: "#6366F1", fontSize: 14, fontWeight: 600, animation: "blink 1s step-end infinite" }}>Scanning...</p>
          </div>
        )}

        {/* ENCOUNTER */}
        {screen === "ENCOUNTER" && currentCat && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
            <MentorBox text={mentor} />
            <div style={{ animation: "slide-up 0.5s ease-out" }}>
              <CatCard cat={currentCat} />
            </div>
            <div style={{ background: "#0F172A", borderRadius: 12, padding: 14, border: "1px solid #1E293B" }}>
              <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 6px", fontWeight: 600 }}>BEHAVIOR HINT</p>
              <p style={{ fontSize: 14, color: "#CBD5E1", margin: 0 }}>{BEHAVIOR_LABELS[currentCat.behavior]}</p>
            </div>
            <div style={{ background: "#0F172A", borderRadius: 12, padding: 14, border: "1px solid #1E293B" }}>
              <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 6px", fontWeight: 600 }}>CALL REQUIREMENTS</p>
              <p style={{ fontSize: 13, color: "#94A3B8", margin: "4px 0" }}>🎵 Pitch: {currentCat.pitchMin}–{currentCat.pitchMax} Hz</p>
              <p style={{ fontSize: 13, color: "#94A3B8", margin: "4px 0" }}>🔊 Volume: {currentCat.volumeMin}–{currentCat.volumeMax} dB</p>
              <p style={{ fontSize: 13, color: "#94A3B8", margin: "4px 0" }}>⏱️ Duration: 5 seconds</p>
              <p style={{ fontSize: 13, color: "#94A3B8", margin: "4px 0" }}>🎯 Score needed: {RARITY_CONFIG[currentCat.rarity].threshold}%</p>
            </div>
            <div style={{ flex: 1 }} />
            <button onClick={startCall} style={{ ...btnStyle("linear-gradient(135deg, #10B981, #059669)", "#10B981"), width: "100%" }}>
              🎤 START CALL
            </button>
          </div>
        )}

        {/* CALLING */}
        {screen === "CALLING" && currentCat && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <ScreenTitle>Calling {currentCat.name}...</ScreenTitle>
              <div style={{
                width: 52, height: 52, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                background: callTimer <= 2 ? "#7F1D1D" : "#1E293B", border: `3px solid ${callTimer <= 2 ? "#EF4444" : "#3B82F6"}`,
                fontFamily: "'Fredoka', sans-serif", fontSize: 22, color: "#FFF", fontWeight: 700,
                transition: "all 0.3s",
              }}>{callTimer}</div>
            </div>

            <div style={{ width: 100, height: 100, margin: "0 auto", animation: "float 1.5s ease-in-out infinite" }}>
              {currentCat.genes ? (
                <div style={{ width: "100%", height: "100%" }} dangerouslySetInnerHTML={{ __html: renderCatSVG(currentCat.genes) }} />
              ) : (
                <span style={{ fontSize: 56 }}>{currentCat.emoji}</span>
              )}
            </div>

            <div style={{ background: "#0F172A", borderRadius: 16, padding: 16, border: "1px solid #1E293B" }}>
              <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Live Voice Analysis</p>
              <PitchMeter value={audioData.pitch} min={currentCat.pitchMin} max={currentCat.pitchMax} label={`Pitch (Hz) — target: ${currentCat.pitchMin}–${currentCat.pitchMax}`} />
              <PitchMeter value={audioData.volume} min={currentCat.volumeMin} max={currentCat.volumeMax} label={`Volume (dB) — target: ${currentCat.volumeMin}–${currentCat.volumeMax}`} />

              <div style={{ marginTop: 12, display: "flex", gap: 16, justifyContent: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#64748B", marginBottom: 2 }}>PITCH</div>
                  <div style={{
                    fontSize: 18, fontWeight: 700, fontFamily: "'Fredoka', sans-serif",
                    color: audioData.pitch >= currentCat.pitchMin && audioData.pitch <= currentCat.pitchMax && audioData.pitch > 0 ? "#4ADE80" : "#F87171",
                  }}>{audioData.pitch > 0 ? `${audioData.pitch} Hz` : "—"}</div>
                </div>
                <div style={{ width: 1, background: "#1E293B" }} />
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#64748B", marginBottom: 2 }}>VOLUME</div>
                  <div style={{
                    fontSize: 18, fontWeight: 700, fontFamily: "'Fredoka', sans-serif",
                    color: audioData.volume >= currentCat.volumeMin && audioData.volume <= currentCat.volumeMax ? "#4ADE80" : "#F87171",
                  }}>{audioData.volume} dB</div>
                </div>
              </div>
            </div>

            <div style={{ background: callTimer <= 2 ? "rgba(239,68,68,0.1)" : "rgba(59,130,246,0.1)", borderRadius: 12, padding: 12, textAlign: "center", border: `1px solid ${callTimer <= 2 ? "#7F1D1D" : "#1E3A5F"}` }}>
              <p style={{ fontSize: 14, color: callTimer <= 2 ? "#FCA5A5" : "#93C5FD", margin: 0, fontWeight: 600 }}>
                {callTimer <= 2 ? "⚡ Hurry!" : "🎤 Make your best \"pspsps\" sound!"}
              </p>
            </div>
          </div>
        )}

        {/* RESULT */}
        {screen === "RESULT" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, justifyContent: "center" }}>
            {resultType === "NOTHING" && (
              <>
                <div style={{ fontSize: 64, textAlign: "center" }}>🍃</div>
                <ScreenTitle>Nothing Found</ScreenTitle>
                <MentorBox text={mentor} />
              </>
            )}
            {resultType === "LOOT" && lootDrop && (
              <>
                <div style={{ fontSize: 64, textAlign: "center", animation: "slide-up 0.4s ease-out" }}>{lootDrop.emoji}</div>
                <ScreenTitle>Item Found!</ScreenTitle>
                <div style={{ background: "#1E293B", borderRadius: 12, padding: 16, textAlign: "center", border: "1px solid #334155" }}>
                  <p style={{ fontSize: 18, color: "#F8FAFC", fontWeight: 700, margin: "0 0 4px", fontFamily: "'Fredoka', sans-serif" }}>{lootDrop.name}</p>
                  <p style={{ fontSize: 13, color: "#94A3B8", margin: 0 }}>{lootDrop.desc}</p>
                </div>
                <MentorBox text={mentor} />
              </>
            )}
            {resultType === "CAPTURE" && currentCat && (
              <>
                <div style={{ fontSize: 64, textAlign: "center", animation: "slide-up 0.5s ease-out" }}>🎉</div>
                <ScreenTitle>Cat Rescued!</ScreenTitle>
                <CatCard cat={currentCat} />
                <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                  <div style={{ background: "#064E3B", borderRadius: 10, padding: "8px 16px", textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "#6EE7B7" }}>PITCH</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#4ADE80", fontFamily: "'Fredoka', sans-serif" }}>{callScore.pitch}%</div>
                  </div>
                  <div style={{ background: "#064E3B", borderRadius: 10, padding: "8px 16px", textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "#6EE7B7" }}>VOLUME</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#4ADE80", fontFamily: "'Fredoka', sans-serif" }}>{callScore.volume}%</div>
                  </div>
                  <div style={{ background: "#064E3B", borderRadius: 10, padding: "8px 16px", textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "#6EE7B7" }}>TOTAL</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#4ADE80", fontFamily: "'Fredoka', sans-serif" }}>{callScore.total}%</div>
                  </div>
                </div>
                <MentorBox text={mentor} />
              </>
            )}
            {resultType === "FAIL" && currentCat && (
              <>
                <div style={{ fontSize: 64, textAlign: "center" }}>😿</div>
                <ScreenTitle>{currentCat.name} fled!</ScreenTitle>
                <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                  <div style={{ background: "#7F1D1D", borderRadius: 10, padding: "8px 16px", textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "#FCA5A5" }}>PITCH</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#F87171", fontFamily: "'Fredoka', sans-serif" }}>{callScore.pitch}%</div>
                  </div>
                  <div style={{ background: "#7F1D1D", borderRadius: 10, padding: "8px 16px", textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "#FCA5A5" }}>VOLUME</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#F87171", fontFamily: "'Fredoka', sans-serif" }}>{callScore.volume}%</div>
                  </div>
                  <div style={{ background: "#7F1D1D", borderRadius: 10, padding: "8px 16px", textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "#FCA5A5" }}>TOTAL</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#F87171", fontFamily: "'Fredoka', sans-serif" }}>{callScore.total}%</div>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: "#64748B", textAlign: "center" }}>Needed {RARITY_CONFIG[currentCat.rarity].threshold}% to capture</p>
                <MentorBox text={mentor} />
              </>
            )}
            <button onClick={() => { setScreen("HOME"); setMentor(MENTOR_LINES.welcome); setCurrentCat(null); setLootDrop(null); setResultType(null); }}
              style={{ ...btnStyle("linear-gradient(135deg, #3B82F6, #6366F1)", "#6366F1"), width: "100%", marginTop: 8 }}>
              📡 SCAN AGAIN
            </button>
          </div>
        )}

        {/* SANCTUARY */}
        {screen === "SANCTUARY" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <ScreenTitle>🏠 Sanctuary</ScreenTitle>
              <button onClick={() => { setScreen("HOME"); setMentor(MENTOR_LINES.welcome); }}
                style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 8, padding: "6px 14px", color: "#94A3B8", fontSize: 13, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                ← Back
              </button>
            </div>
            <MentorBox text={mentor} />
            {sanctuary.length === 0 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                <span style={{ fontSize: 48, opacity: 0.4 }}>🏚️</span>
                <p style={{ color: "#475569", fontSize: 14, textAlign: "center" }}>No cats rescued yet. Get scanning!</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, overflowY: "auto", flex: 1, paddingBottom: 20 }}>
                <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>{sanctuary.length} cat{sanctuary.length !== 1 ? "s" : ""} rescued</p>
                {sanctuary.map((cat, i) => (
                  <div key={i} style={{ animation: `slide-up 0.3s ease-out ${i * 0.05}s both` }}>
                    <CatCard cat={cat} small />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* INVENTORY */}
        {screen === "INVENTORY" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <ScreenTitle>🎒 Inventory</ScreenTitle>
              <button onClick={() => { setScreen("HOME"); setMentor(MENTOR_LINES.welcome); }}
                style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 8, padding: "6px 14px", color: "#94A3B8", fontSize: 13, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                ← Back
              </button>
            </div>
            {inventory.length === 0 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                <span style={{ fontSize: 48, opacity: 0.4 }}>🎒</span>
                <p style={{ color: "#475569", fontSize: 14, textAlign: "center" }}>No items yet. Keep scanning!</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {inventory.map((item, i) => (
                  <div key={i} style={{ background: "#1E293B", borderRadius: 12, padding: 14, display: "flex", alignItems: "center", gap: 12, border: "1px solid #334155" }}>
                    <span style={{ fontSize: 28 }}>{item.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 700, color: "#F8FAFC", fontSize: 14 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: "#94A3B8" }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(1.4); opacity: 0; } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        button:active { transform: scale(0.96) !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
      `}</style>
    </div>
  );
}
