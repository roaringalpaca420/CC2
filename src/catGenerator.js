/**
 * Procedural cat generator - extracted from cat_style_editor_V2
 * Uses seeded RNG for deterministic, unique cats per encounter
 */
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash string to number for seeding */
function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)];
const lerp = (a, b, t) => a + (b - a) * t;
const hexLerp = (h1, h2, t) => {
  const p = (s, i) => parseInt(s.slice(i, i + 2), 16);
  return `#${[1, 3, 5].map((i) => Math.round(lerp(p(h1, i), p(h2, i), t)).toString(16).padStart(2, "0")).join("")}`;
};

const FURS = [
  { base: "#F0A040", dark: "#C47E28", light: "#FCEACC", inner: "#FCDCB0", name: "Orange Tabby" },
  { base: "#383845", dark: "#1E1E2A", light: "#5A5A70", inner: "#555568", name: "Charcoal" },
  { base: "#F2EDE6", dark: "#D8D2CA", light: "#FDFCFA", inner: "#FFF8F2", name: "White" },
  { base: "#9494A8", dark: "#72728A", light: "#C0C0D0", inner: "#B4B4C6", name: "Gray" },
  { base: "#D4722A", dark: "#A85818", light: "#F0C4A0", inner: "#ECB488", name: "Ginger" },
  { base: "#F2DDB8", dark: "#DCC49A", light: "#FBF4E8", inner: "#F8EED8", name: "Cream" },
  { base: "#7A5C3A", dark: "#5C4028", light: "#B89878", inner: "#A08060", name: "Brown" },
  { base: "#C0A888", dark: "#A08868", light: "#E0D4C4", inner: "#D4C4B0", name: "Fawn" },
  { base: "#5C3A28", dark: "#3E2418", light: "#8A6A50", inner: "#7A5840", name: "Chocolate" },
  { base: "#B8BCC8", dark: "#969AA6", light: "#DCDEE8", inner: "#D0D4E0", name: "Silver" },
  { base: "#4A4A5C", dark: "#2E2E40", light: "#6E6E84", inner: "#606076", name: "Smoke" },
  { base: "#B8A090", dark: "#988070", light: "#D8CCC0", inner: "#CCC0B4", name: "Lilac" },
];

const EYE_COLORS = ["#4ADE80", "#3B82F6", "#F59E0B", "#8B5CF6", "#06B6D4", "#EAB308", "#EC4899", "#FB923C", "#2DD4BF", "#22C55E", "#F97316", "#A78BFA"];
const SPOT_COLORS = [["#D4722A", "#E8943A"], ["#2D2D3A", "#4A4A5C"], ["#F0EDE8", "#D8D2CA"], ["#7A5C3A", "#A08060"]];
const NAME_SUFFIXES = ["Whiskers", "Paws", "Shadow", "Blaze", "Luna", "Mittens", "Nimbus", "Dusty", "Phantom", "Goldie", "Ember", "Ash", "Mocha", "Pearl", "Storm"];

const PATTERNS = ["solid", "solid", "tabby", "tabby", "tuxedo", "calico", "bicolor", "spots", "socks"];

/** Rarity affects which furs/patterns are allowed. Higher rarity = more options. */
const FUR_BY_RARITY = { COMMON: [0, 1, 2, 3, 4, 5], UNCOMMON: [0, 1, 2, 3, 4, 5, 6, 7], RARE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], LEGENDARY: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] };
const PATTERN_BY_RARITY = { COMMON: ["solid", "tabby"], UNCOMMON: ["solid", "tabby", "tuxedo", "bicolor"], RARE: ["solid", "tabby", "tuxedo", "calico", "bicolor", "spots", "socks"], LEGENDARY: PATTERNS };

/** Generate random genes from seeded RNG. Rarity affects fur/pattern pool. */
export function randomGenes(rng, rarity = "COMMON") {
  const furPool = (FUR_BY_RARITY[rarity] ?? FUR_BY_RARITY.COMMON).map((i) => FURS[i]);
  const patternPool = PATTERN_BY_RARITY[rarity] ?? PATTERN_BY_RARITY.COMMON;
  const fur = pick(furPool, rng);
  return {
    furBase: fur.base,
    furDark: fur.dark,
    furLight: fur.light,
    furInner: fur.inner,
    furName: fur.name,
    eyeColor: pick(EYE_COLORS, rng),
    eyeColor2: rng() > 0.88 ? pick(EYE_COLORS, rng) : null,
    bodyW: 0.85 + rng() * 0.3,
    bodyH: 0.85 + rng() * 0.3,
    earType: Math.floor(rng() * 4),
    eyeType: Math.floor(rng() * 4),
    tailType: Math.floor(rng() * 4),
    mouthType: Math.floor(rng() * 4),
    pattern: pick(patternPool, rng),
    spotColors: pick(SPOT_COLORS, rng),
    seed: Math.floor(rng() * 999999),
  };
}

/** Generate a display name from genes + rng */
function generateName(genes, rng) {
  const suffix = pick(NAME_SUFFIXES, rng);
  if (genes.furName === "Orange Tabby" || genes.furName === "Ginger") return suffix === "Blaze" ? "Blaze" : suffix === "Ember" ? "Ember" : suffix;
  if (genes.furName === "Charcoal" || genes.furName === "Smoke") return suffix === "Shadow" ? "Shadow" : suffix;
  if (genes.furName === "White") return suffix === "Pearl" ? "Pearl" : suffix;
  return `${genes.furName.split(" ")[0]} ${suffix}`.replace(/^(\w)/, (m) => m.toUpperCase());
}

const BEHAVIORS = ["SHY", "DOMINANT", "PLAYFUL", "SKITTISH"];

/** Generate cat from encounter seed. Returns full cat object for the game. */
export function generateCatFromSeed(encounterId, rarity) {
  const seedNum = hashString(encounterId);
  const rng = mulberry32(seedNum);
  const genes = randomGenes(rng, rarity);
  const behavior = pick(BEHAVIORS, rng);

  const name = generateName(genes, rng);
  const desc = `${genes.furName} with ${["pointed", "round", "folded", "wide"][genes.earType]} ears. ${genes.eyeColor2 ? "Odd-eyed. " : ""}${genes.pattern} coat.`;

  const RARITY_PITCH = { COMMON: [200, 500], UNCOMMON: [250, 550], RARE: [200, 480], LEGENDARY: [280, 500] };
  const RARITY_VOL = { COMMON: [40, 75], UNCOMMON: [35, 70], RARE: [30, 60], LEGENDARY: [35, 65] };
  const BEHAVIOR_SHIFT = { SHY: [0, -20], DOMINANT: [30, 20], PLAYFUL: [0, 0], SKITTISH: [-20, -25] };
  const [pBase, pRange] = RARITY_PITCH[rarity];
  const [vBase, vRange] = RARITY_VOL[rarity];
  const [pShift, vShift] = BEHAVIOR_SHIFT[behavior] || [0, 0];

  const pitchMin = Math.max(100, pBase + pShift);
  const pitchMax = Math.min(800, pBase + pRange + pShift);
  const volumeMin = Math.max(20, vBase + vShift);
  const volumeMax = Math.min(95, vBase + vRange + vShift);

  return {
    id: encounterId,
    seed: seedNum,
    genes,
    name,
    desc,
    rarity,
    behavior,
    callType: "PSPS",
    pitchMin,
    pitchMax,
    volumeMin,
    volumeMax,
    emoji: "🐱",
    color: genes.furBase,
  };
}

/** Default style for in-game cats (matches kawaii-ish game aesthetic) */
const GAME_STYLE = {
  bodyScale: 0.85,
  headSize: 1.15,
  headSquash: 1.05,
  earSize: 0.9,
  earWidth: 1.0,
  eyeSize: 1.2,
  eyeSpacing: 0.92,
  tailLength: 0.9,
  tailCurl: 0.85,
  legLength: 0.75,
  legThickness: 0.9,
  lineWeight: 0.5,
  lineColor: "#4A4060",
  noseSize: 0.8,
  noseColor: "#F9A8D4",
  padColor: "#F9A8D4",
  blush: 0.5,
  whiskers: 0.5,
  shadow: 0.5,
  patternIntensity: 0.65,
  bgEnabled: false,
  bellyShow: 0.5,
  cheekFluff: 0.3,
  earTufts: 0.2,
  pawPads: 0.6,
  furTexture: 0.25,
};

/** Render cat SVG from genes. Use GAME_STYLE for in-app display. */
export function renderCatSVG(genes, style = GAME_STYLE) {
  const s = style;
  const g = genes;
  const P = [];
  const cx = 100, bodyY = 138, bodyW = 50 * s.bodyScale * g.bodyW, bodyH = 44 * s.bodyScale * g.bodyH;
  const headY = 88, headRx = 34 * s.headSize * (s.headSquash || 1), headRy = 30 * s.headSize;
  const earH = 34 * s.earSize, earW = 15 * s.earSize * (s.earWidth || 1);
  const eyeR = 7.5 * s.eyeSize, eyeSp = 14 * s.eyeSpacing;
  const legW = 13 * s.legThickness, legH = 20 * s.legLength, tailLen = 48 * s.tailLength;
  const base = g.furBase, dark = g.furDark, light = g.furLight, inner = g.furInner;
  const ec = g.eyeColor, ec2 = g.eyeColor2 || ec;
  const shade = hexLerp(base, "#000000", 0.15), highlight = hexLerp(base, "#FFFFFF", 0.2);
  const ln = s.lineColor, lw = s.lineWeight || 0, did = `c${g.seed || 0}`;
  P.push(`<defs>
<radialGradient id="${did}_bg" cx="45%" cy="35%"><stop offset="0%" stop-color="${highlight}" stop-opacity="0.4"/><stop offset="100%" stop-color="${base}" stop-opacity="0"/></radialGradient>
<radialGradient id="${did}_eL" cx="38%" cy="35%"><stop offset="0%" stop-color="${hexLerp(ec, "#FFF", 0.5)}"/><stop offset="50%" stop-color="${ec}"/><stop offset="100%" stop-color="${hexLerp(ec, "#000", 0.3)}"/></radialGradient>
<radialGradient id="${did}_eR" cx="38%" cy="35%"><stop offset="0%" stop-color="${hexLerp(ec2, "#FFF", 0.5)}"/><stop offset="50%" stop-color="${ec2}"/><stop offset="100%" stop-color="${hexLerp(ec2, "#000", 0.3)}"/></radialGradient>
<filter id="${did}_sf" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1"/></filter>
</defs>`);
  if (s.bgEnabled && s.bgColor) P.push(`<circle cx="${cx}" cy="118" r="92" fill="${s.bgColor}"/>`);
  if (s.shadow > 0) P.push(`<ellipse cx="${cx}" cy="${bodyY + bodyH + legH - 2}" rx="${bodyW * 0.75}" ry="${3 + s.shadow * 5}" fill="#000" opacity="${(s.shadow * 0.14).toFixed(2)}" filter="url(#${did}_sf)"/>`);
  const tx = cx + bodyW * 0.82, ty = bodyY - bodyH * 0.1, tc = s.tailCurl ?? 1;
  if (g.tailType === 0) { const d = `M${tx},${ty} C${tx + tailLen * 0.5},${ty - tailLen * 0.3} ${tx + tailLen * 0.7},${ty - tailLen * 0.9} ${tx + tailLen * 0.3},${ty - tailLen} S${tx - tailLen * 0.1},${ty - tailLen * 0.6} ${tx + tailLen * 0.05},${ty - tailLen * 0.5}`; P.push(`<path d="${d}" fill="none" stroke="${base}" stroke-width="${9 * tc}" stroke-linecap="round"/>`); P.push(`<path d="${d}" fill="none" stroke="${highlight}" stroke-width="${4 * tc}" stroke-linecap="round" opacity="0.25"/>`); if (lw > 0) P.push(`<path d="${d}" fill="none" stroke="${ln}" stroke-width="${lw * 0.6}" stroke-linecap="round" opacity="0.3"/>`); }
  else if (g.tailType === 1) { P.push(`<path d="M${tx},${ty} Q${tx + tailLen * 0.4},${ty - tailLen * 0.5} ${tx + tailLen * 0.3},${ty - tailLen * 0.85}" fill="none" stroke="${base}" stroke-width="${9 * tc}" stroke-linecap="round"/>`); P.push(`<path d="M${tx},${ty} Q${tx + tailLen * 0.4},${ty - tailLen * 0.5} ${tx + tailLen * 0.3},${ty - tailLen * 0.85}" fill="none" stroke="${highlight}" stroke-width="${4 * tc}" stroke-linecap="round" opacity="0.2"/>`); }
  else if (g.tailType === 2) { const fx = tx + tailLen * 0.3, fy = ty - tailLen * 0.7; P.push(`<path d="M${tx},${ty} Q${tx + tailLen * 0.45},${ty - tailLen * 0.35} ${fx},${fy}" fill="none" stroke="${base}" stroke-width="${8 * tc}" stroke-linecap="round"/>`); P.push(`<ellipse cx="${fx}" cy="${fy}" rx="${10 * tc}" ry="${12 * tc}" fill="${base}"/>`); P.push(`<ellipse cx="${fx - 2}" cy="${fy - 2}" rx="${6 * tc}" ry="${7 * tc}" fill="${highlight}" opacity="0.2"/>`); }
  else P.push(`<path d="M${tx},${ty} Q${tx + 14},${ty - 10} ${tx + 18},${ty - 18}" fill="none" stroke="${base}" stroke-width="${10 * tc}" stroke-linecap="round"/>`);
  const bTop = bodyY - bodyH, bBot = bodyY + bodyH * 0.65;
  const bp = `M${cx - bodyW * 0.85},${bodyY - bodyH * 0.2} Q${cx - bodyW * 0.9},${bTop + bodyH * 0.3} ${cx - bodyW * 0.4},${bTop} Q${cx},${bTop - bodyH * 0.15} ${cx + bodyW * 0.4},${bTop} Q${cx + bodyW * 0.9},${bTop + bodyH * 0.3} ${cx + bodyW * 0.85},${bodyY - bodyH * 0.2} Q${cx + bodyW * 0.95},${bodyY + bodyH * 0.2} ${cx + bodyW * 0.7},${bBot} Q${cx},${bBot + bodyH * 0.2} ${cx - bodyW * 0.7},${bBot} Q${cx - bodyW * 0.95},${bodyY + bodyH * 0.2} ${cx - bodyW * 0.85},${bodyY - bodyH * 0.2}Z`;
  P.push(`<path d="${bp}" fill="${base}"/>`);
  P.push(`<ellipse cx="${cx - bodyW * 0.1}" cy="${bodyY - bodyH * 0.15}" rx="${bodyW * 0.55}" ry="${bodyH * 0.5}" fill="url(#${did}_bg)"/>`);
  if ((s.bellyShow ?? 0) > 0) P.push(`<ellipse cx="${cx}" cy="${bodyY + bodyH * 0.15}" rx="${bodyW * 0.38 * s.bellyShow}" ry="${bodyH * 0.45 * s.bellyShow}" fill="${light}" opacity="${(0.3 + s.bellyShow * 0.3).toFixed(2)}"/>`);
  if (lw > 0) P.push(`<path d="${bp}" fill="none" stroke="${ln}" stroke-width="${lw}" opacity="0.4"/>`);
  const pi = s.patternIntensity ?? 0.5;
  if (g.pattern === "tabby" && pi > 0) { for (let i = 0; i < 5; i++) { const y = bodyY - bodyH * 0.4 + i * bodyH * 0.22, w = bodyW * (0.7 - i * 0.04), wave = i % 2 === 0 ? -3 : 3; P.push(`<path d="M${cx - w},${y} Q${cx},${y + wave} ${cx + w},${y}" fill="none" stroke="${dark}" stroke-width="${1.5 + pi}" opacity="${(0.15 + pi * 0.12).toFixed(2)}" stroke-linecap="round"/>`); } }
  else if (g.pattern === "tuxedo" && pi > 0) P.push(`<path d="M${cx - bodyW * 0.3},${bodyY} Q${cx},${bodyY - bodyH * 0.3} ${cx + bodyW * 0.3},${bodyY} Q${cx + bodyW * 0.3},${bBot} ${cx},${bBot + 4} Q${cx - bodyW * 0.3},${bBot} ${cx - bodyW * 0.3},${bodyY}Z" fill="#F5F0EB" opacity="${(0.45 + pi * 0.35).toFixed(2)}"/>`);
  else if (g.pattern === "calico" && pi > 0) [[-0.3, -0.2, 14], [0.25, 0.1, 12], [-0.05, 0.35, 11], [0.35, -0.05, 9]].forEach(([dx, dy, r], i) => { P.push(`<ellipse cx="${cx + bodyW * dx}" cy="${bodyY + bodyH * dy}" rx="${r * (0.6 + pi * 0.4)}" ry="${r * (0.5 + pi * 0.35)}" fill="${g.spotColors[i % g.spotColors.length]}" opacity="${(0.3 + pi * 0.25).toFixed(2)}"/>`); });
  else if (g.pattern === "bicolor" && pi > 0) P.push(`<path d="M${cx},${bodyY - bodyH} Q${cx + bodyW},${bodyY - bodyH} ${cx + bodyW * 0.85},${bodyY} Q${cx + bodyW},${bBot} ${cx},${bBot + 4}Z" fill="#F5F0EB" opacity="${(0.5 + pi * 0.35).toFixed(2)}"/>`);
  else if (g.pattern === "spots" && pi > 0) [[-0.28, -0.15, 9], [0.22, 0.05, 8], [-0.08, 0.3, 10], [0.3, 0.25, 7], [-0.35, 0.15, 6]].forEach(([dx, dy, r], i) => { P.push(`<circle cx="${cx + bodyW * dx}" cy="${bodyY + bodyH * dy}" r="${r * (0.5 + pi * 0.4)}" fill="${g.spotColors[i % g.spotColors.length]}" opacity="${(0.25 + pi * 0.2).toFixed(2)}"/>`); });
  const legY = bBot - 4, l1x = cx - bodyW * 0.38, l2x = cx + bodyW * 0.24;
  P.push(`<rect x="${l1x - legW * 0.4}" y="${legY + 2}" width="${legW}" height="${legH}" rx="${legW * 0.4}" fill="${shade}"/>`);
  P.push(`<rect x="${l2x + legW * 0.4}" y="${legY + 2}" width="${legW}" height="${legH}" rx="${legW * 0.4}" fill="${shade}"/>`);
  [l1x, l2x].forEach(lx => { P.push(`<rect x="${lx}" y="${legY}" width="${legW}" height="${legH}" rx="${legW * 0.4}" fill="${base}"/>`); if (lw > 0) P.push(`<rect x="${lx}" y="${legY}" width="${legW}" height="${legH}" rx="${legW * 0.4}" fill="none" stroke="${ln}" stroke-width="${lw * 0.6}" opacity="0.3"/>`); if ((s.pawPads ?? 0) > 0) { const py = legY + legH - legW * 0.3, pcx = lx + legW * 0.5; P.push(`<ellipse cx="${pcx}" cy="${py}" rx="${legW * 0.35}" ry="${legW * 0.25}" fill="${s.padColor}" opacity="${(s.pawPads * 0.7).toFixed(2)}"/>`); [[-0.22, -0.35], [0, -0.45], [0.22, -0.35]].forEach(([bx, by]) => P.push(`<circle cx="${pcx + legW * bx}" cy="${py + legW * by}" r="${legW * 0.12}" fill="${s.padColor}" opacity="${(s.pawPads * 0.6).toFixed(2)}"/>`)); } if (g.pattern === "socks" && pi > 0) P.push(`<rect x="${lx}" y="${legY + legH * 0.5}" width="${legW}" height="${legH * 0.5}" rx="${legW * 0.4}" fill="#F5F0EB" opacity="${(0.6 + pi * 0.3).toFixed(2)}"/>`); });
  P.push(`<ellipse cx="${cx}" cy="${headY}" rx="${headRx}" ry="${headRy}" fill="${base}"/>`);
  P.push(`<ellipse cx="${cx - headRx * 0.15}" cy="${headY - headRy * 0.2}" rx="${headRx * 0.6}" ry="${headRy * 0.5}" fill="${highlight}" opacity="0.15"/>`);
  if (lw > 0) P.push(`<ellipse cx="${cx}" cy="${headY}" rx="${headRx}" ry="${headRy}" fill="none" stroke="${ln}" stroke-width="${lw}" opacity="0.4"/>`);
  if (g.pattern === "tabby" && pi > 0) P.push(`<path d="M${cx - headRx * 0.35},${headY - headRy * 0.3} L${cx - headRx * 0.15},${headY - headRy * 0.55} L${cx},${headY - headRy * 0.35} L${cx + headRx * 0.15},${headY - headRy * 0.55} L${cx + headRx * 0.35},${headY - headRy * 0.3}" fill="none" stroke="${dark}" stroke-width="${1.2 + pi * 0.5}" opacity="${(0.2 + pi * 0.15).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>`);
  const earBY = headY - headRy * 0.62;
  const drawEar = (ex, dir) => {
    if (g.earType === 0) { const tip = [ex + dir * earW * 0.3, earBY - earH]; P.push(`<path d="M${ex - dir * earW * 0.2},${earBY + 4} Q${tip[0] - dir * 2},${tip[1] + earH * 0.2} ${tip[0]},${tip[1]} Q${tip[0] + dir * 4},${tip[1] + earH * 0.25} ${ex + dir * earW * 0.9},${earBY + 2}Z" fill="${base}"/>`); P.push(`<path d="M${ex + dir * earW * 0.0},${earBY + 2} Q${tip[0] - dir * 1},${tip[1] + earH * 0.3} ${ex + dir * earW * 0.3 * 0.65},${earBY - earH * 0.7} Q${ex + dir * earW * 0.45},${earBY - earH * 0.45} ${ex + dir * earW * 0.6},${earBY + 2}Z" fill="${inner}" opacity="0.7"/>`); if (lw > 0) P.push(`<path d="M${ex - dir * earW * 0.2},${earBY + 4} Q${tip[0] - dir * 2},${tip[1] + earH * 0.2} ${tip[0]},${tip[1]} Q${tip[0] + dir * 4},${tip[1] + earH * 0.25} ${ex + dir * earW * 0.9},${earBY + 2}" fill="none" stroke="${ln}" stroke-width="${lw * 0.7}" opacity="0.35"/>`); if ((s.earTufts ?? 0) > 0) P.push(`<line x1="${tip[0]}" y1="${tip[1]}" x2="${tip[0] + dir * 3}" y2="${tip[1] - 6 * s.earTufts}" stroke="${base}" stroke-width="2" stroke-linecap="round"/>`); P.push(`<line x1="${tip[0]}" y1="${tip[1]}" x2="${tip[0]}" y2="${tip[1] - 7 * s.earTufts}" stroke="${base}" stroke-width="1.5" stroke-linecap="round"/>`); }
    else if (g.earType === 1) { P.push(`<path d="M${ex - dir * earW * 0.3},${earBY + 4} Q${ex - dir * earW * 0.5},${earBY - earH * 0.4} ${ex + dir * earW * 0.1},${earBY - earH * 0.85} Q${ex + dir * earW * 0.7},${earBY - earH * 0.7} ${ex + dir * earW * 0.8},${earBY - earH * 0.3} Q${ex + dir * earW * 0.7},${earBY + 2} ${ex + dir * earW * 0.4},${earBY + 4}Z" fill="${base}"/>`); P.push(`<path d="M${ex - dir * earW * 0.1},${earBY + 2} Q${ex - dir * earW * 0.2},${earBY - earH * 0.25} ${ex + dir * earW * 0.15},${earBY - earH * 0.55} Q${ex + dir * earW * 0.5},${earBY - earH * 0.45} ${ex + dir * earW * 0.5},${earBY - earH * 0.15} Q${ex + dir * earW * 0.4},${earBY + 2}Z" fill="${inner}" opacity="0.6"/>`); }
    else if (g.earType === 2) { P.push(`<path d="M${ex - dir * earW * 0.2},${earBY + 4} Q${ex + dir * earW * 0.1},${earBY - earH * 0.35} ${ex + dir * earW * 0.6},${earBY - earH * 0.25} Q${ex + dir * earW * 0.7},${earBY - earH * 0.05} ${ex + dir * earW * 0.5},${earBY + 4}Z" fill="${base}"/>`); P.push(`<path d="M${ex - dir * earW * 0.2},${earBY + 4} Q${ex + dir * earW * 0.1},${earBY - earH * 0.35} ${ex + dir * earW * 0.6},${earBY - earH * 0.25} Q${ex + dir * earW * 0.7},${earBY - earH * 0.05} ${ex + dir * earW * 0.5},${earBY + 4}Z" fill="${shade}" opacity="0.2"/>`); }
    else { P.push(`<path d="M${ex - dir * earW * 0.4},${earBY + 4} Q${ex - dir * earW * 0.8},${earBY - earH * 0.6} ${ex + dir * earW * 0.2},${earBY - earH * 0.9} Q${ex + dir * earW * 1.0},${earBY - earH * 0.5} ${ex + dir * earW * 0.7},${earBY + 4}Z" fill="${base}"/>`); P.push(`<path d="M${ex - dir * earW * 0.15},${earBY + 2} Q${ex - dir * earW * 0.4},${earBY - earH * 0.35} ${ex + dir * earW * 0.2},${earBY - earH * 0.55} Q${ex + dir * earW * 0.65},${earBY - earH * 0.3} ${ex + dir * earW * 0.45},${earBY + 2}Z" fill="${inner}" opacity="0.6"/>`); }
  };
  drawEar(cx - headRx * 0.55, -1); drawEar(cx + headRx * 0.55, 1);
  if ((s.cheekFluff ?? 0) > 0) { const cf = s.cheekFluff; P.push(`<ellipse cx="${cx - headRx * 0.75}" cy="${headY + headRy * 0.25}" rx="${headRx * 0.25 * cf}" ry="${headRy * 0.2 * cf}" fill="${base}"/>`); P.push(`<ellipse cx="${cx + headRx * 0.75}" cy="${headY + headRy * 0.25}" rx="${headRx * 0.25 * cf}" ry="${headRy * 0.2 * cf}" fill="${base}"/>`); if (cf > 0.5) [-1, 1].forEach(sd => { for (let a = -6; a <= 6; a += 6) P.push(`<line x1="${cx + sd * headRx * 0.8}" y1="${headY + headRy * 0.25 + a * cf * 0.2}" x2="${cx + sd * headRx * 0.8 + sd * 5 * cf}" y2="${headY + headRy * 0.25 + a * cf * 0.25}" stroke="${shade}" stroke-width="0.7" opacity="0.18" stroke-linecap="round"/>`); }); }
  const eyeY = headY + headRy * 0.02, eLX = cx - eyeSp, eRX = cx + eyeSp;
  const drawEye = (ex, gid) => {
    if (g.eyeType === 0) { const r = eyeR; P.push(`<circle cx="${ex}" cy="${eyeY}" r="${r * 1.05}" fill="white"/>`); P.push(`<circle cx="${ex + r * 0.08}" cy="${eyeY - r * 0.05}" r="${r * 0.68}" fill="url(#${gid})"/>`); P.push(`<ellipse cx="${ex + r * 0.1}" cy="${eyeY}" rx="${r * 0.28}" ry="${r * 0.35}" fill="#0F0F1A"/>`); P.push(`<circle cx="${ex + r * 0.28}" cy="${eyeY - r * 0.3}" r="${r * 0.22}" fill="white" opacity="0.9"/>`); P.push(`<circle cx="${ex - r * 0.15}" cy="${eyeY + r * 0.25}" r="${r * 0.1}" fill="white" opacity="0.6"/>`); P.push(`<path d="M${ex - r * 1.1},${eyeY - r * 0.5} Q${ex},${eyeY - r * 1.2} ${ex + r * 1.1},${eyeY - r * 0.5}" fill="none" stroke="${shade}" stroke-width="${0.8 + lw * 0.3}" opacity="0.3" stroke-linecap="round"/>`); }
    else if (g.eyeType === 1) { const r = eyeR * 1.3; P.push(`<circle cx="${ex}" cy="${eyeY}" r="${r}" fill="white"/>`); P.push(`<circle cx="${ex + r * 0.06}" cy="${eyeY - r * 0.03}" r="${r * 0.72}" fill="url(#${gid})"/>`); P.push(`<ellipse cx="${ex + r * 0.08}" cy="${eyeY + r * 0.02}" rx="${r * 0.3}" ry="${r * 0.38}" fill="#0F0F1A"/>`); P.push(`<circle cx="${ex + r * 0.3}" cy="${eyeY - r * 0.32}" r="${r * 0.24}" fill="white" opacity="0.95"/>`); P.push(`<circle cx="${ex - r * 0.2}" cy="${eyeY + r * 0.2}" r="${r * 0.13}" fill="white" opacity="0.7"/>`); P.push(`<circle cx="${ex + r * 0.15}" cy="${eyeY + r * 0.35}" r="${r * 0.07}" fill="white" opacity="0.5"/>`); }
    else if (g.eyeType === 2) P.push(`<path d="M${ex - eyeR * 1.1},${eyeY + eyeR * 0.1} Q${ex},${eyeY - eyeR * 0.9} ${ex + eyeR * 1.1},${eyeY + eyeR * 0.1}" fill="none" stroke="${ln || "#1a1a2e"}" stroke-width="${2 + lw * 0.5}" stroke-linecap="round" opacity="0.7"/>`);
    else { const r = eyeR; P.push(`<path d="M${ex - r},${eyeY} Q${ex},${eyeY - r * 0.9} ${ex + r},${eyeY} Q${ex},${eyeY + r * 0.7} ${ex - r},${eyeY}Z" fill="white"/>`); P.push(`<path d="M${ex - r * 0.85},${eyeY} Q${ex},${eyeY - r * 0.75} ${ex + r * 0.85},${eyeY} Q${ex},${eyeY + r * 0.55} ${ex - r * 0.85},${eyeY}Z" fill="url(#${gid})"/>`); P.push(`<ellipse cx="${ex}" cy="${eyeY}" rx="${r * 0.15}" ry="${r * 0.5}" fill="#0F0F1A"/>`); P.push(`<circle cx="${ex + r * 0.2}" cy="${eyeY - r * 0.2}" r="${r * 0.12}" fill="white" opacity="0.8"/>`); }
  };
  drawEye(eLX, `${did}_eL`); drawEye(eRX, `${did}_eR`);
  const nY = headY + headRy * 0.38, nw = 4.2 * (s.noseSize ?? 1), nh = 3 * (s.noseSize ?? 1);
  P.push(`<path d="M${cx},${nY - nh} Q${cx - nw},${nY - nh * 0.3} ${cx - nw * 0.8},${nY + nh * 0.3} Q${cx},${nY + nh} ${cx + nw * 0.8},${nY + nh * 0.3} Q${cx + nw},${nY - nh * 0.3} ${cx},${nY - nh}Z" fill="${s.noseColor || "#F9A8D4"}"/>`);
  P.push(`<ellipse cx="${cx - nw * 0.15}" cy="${nY - nh * 0.3}" rx="${nw * 0.3}" ry="${nh * 0.25}" fill="white" opacity="0.3"/>`);
  P.push(`<line x1="${cx}" y1="${nY + nh}" x2="${cx}" y2="${nY + nh + 3.5 * (s.noseSize ?? 1)}" stroke="${ln || "#1a1a2e"}" stroke-width="${0.8 + lw * 0.3}" opacity="0.5"/>`);
  const mY = nY + nh + 4 * (s.noseSize ?? 1), mW = 6.5 * (s.noseSize ?? 1);
  if (g.mouthType === 0) P.push(`<path d="M${cx - mW},${mY} Q${cx - mW * 0.5},${mY + mW * 0.5} ${cx},${mY + mW * 0.15} Q${cx + mW * 0.5},${mY + mW * 0.5} ${cx + mW},${mY}" fill="none" stroke="${ln || "#1a1a2e"}" stroke-width="${1 + lw * 0.3}" stroke-linecap="round" opacity="0.6"/>`);
  else if (g.mouthType === 1) { P.push(`<path d="M${cx - mW},${mY} Q${cx - mW * 0.5},${mY + mW * 0.5} ${cx},${mY + mW * 0.15} Q${cx + mW * 0.5},${mY + mW * 0.5} ${cx + mW},${mY}" fill="none" stroke="${ln || "#1a1a2e"}" stroke-width="${1 + lw * 0.3}" stroke-linecap="round" opacity="0.6"/>`); P.push(`<ellipse cx="${cx}" cy="${mY + mW * 0.45}" rx="${mW * 0.35}" ry="${mW * 0.3}" fill="#F9A8D4"/>`); P.push(`<ellipse cx="${cx - mW * 0.08}" cy="${mY + mW * 0.38}" rx="${mW * 0.15}" ry="${mW * 0.1}" fill="#FECDD3" opacity="0.5"/>`); }
  else if (g.mouthType === 2) { P.push(`<ellipse cx="${cx}" cy="${mY + mW * 0.15}" rx="${mW * 0.55}" ry="${mW * 0.4}" fill="#2d1b2e"/>`); P.push(`<ellipse cx="${cx}" cy="${mY + mW * 0.35}" rx="${mW * 0.35}" ry="${mW * 0.15}" fill="#F9A8D4" opacity="0.5"/>`); }
  else P.push(`<line x1="${cx - mW * 0.7}" y1="${mY}" x2="${cx + mW * 0.7}" y2="${mY}" stroke="${ln || "#1a1a2e"}" stroke-width="${1 + lw * 0.3}" stroke-linecap="round" opacity="0.4"/>`);
  if ((s.whiskers ?? 0) > 0) { const wL = 26 * s.whiskers, wY = nY + nh + 1; [-1, 1].forEach(sd => { const wb = cx + sd * headRx * 0.55; for (let i = -1; i <= 1; i++) { const ang = i * 10, dr = i === 1 ? 3 : i === -1 ? -1 : 1; P.push(`<path d="M${wb},${wY + ang * 0.2} Q${wb + sd * wL * 0.5},${wY + ang * 0.3 + dr} ${wb + sd * wL},${wY + ang * 0.5 + dr * 1.5}" fill="none" stroke="${ln || "#1a1a2e"}" stroke-width="${0.7 + lw * 0.15}" opacity="${(0.25 + s.whiskers * 0.2).toFixed(2)}" stroke-linecap="round"/>`); } }); }
  if ((s.blush ?? 0) > 0) { const bR = eyeR * 0.8; P.push(`<ellipse cx="${eLX - eyeR * 0.4}" cy="${eyeY + eyeR * 1.4}" rx="${bR}" ry="${bR * 0.55}" fill="#FDA4AF" opacity="${(s.blush * 0.35).toFixed(2)}" filter="url(#${did}_sf)"/>`); P.push(`<ellipse cx="${eRX + eyeR * 0.4}" cy="${eyeY + eyeR * 1.4}" rx="${bR}" ry="${bR * 0.55}" fill="#FDA4AF" opacity="${(s.blush * 0.35).toFixed(2)}" filter="url(#${did}_sf)"/>`); }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="5 10 190 195" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">${P.join("")}</svg>`;
}
