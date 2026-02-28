import { useState, useMemo } from "react";

/* ═══ PRNG ═══ */
function m32(a){return function(){a|=0;a=(a+0x6d2b79f5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296};}
const pick=(a,r)=>a[Math.floor(r()*a.length)];
const hx=(h,i)=>parseInt(h.slice(i,i+2),16);
const lerp=(a,b,t)=>a+(b-a)*t;
const hexL=(h1,h2,t)=>`#${[1,3,5].map(i=>Math.round(lerp(hx(h1,i),hx(h2,i),t)).toString(16).padStart(2,"0")).join("")}`;

/* ═══ BREED PROFILES ═══ */
const BREEDS={
domestic:{name:"Domestic",rarity:"common",bodyW:1,bodyH:1,headSz:1,legL:1,legT:1,earSz:1,earW:1,tailL:1,tailT:1,mane:0,unique:null},
bengal:{name:"Bengal",rarity:"rare",bodyW:0.95,bodyH:1.05,headSz:0.95,legL:1.08,legT:0.95,earSz:0.95,earW:1,tailL:1.05,tailT:0.9,mane:0,unique:"rosettes"},
tiger:{name:"Tiger",rarity:"ultra",bodyW:1.2,bodyH:1.15,headSz:1.1,legL:1,legT:1.2,earSz:0.85,earW:1.1,tailL:1.1,tailT:1.1,mane:0,unique:"tigerStripes"},
lion:{name:"Lion",rarity:"ultra",bodyW:1.3,bodyH:1.2,headSz:1.25,legL:1.1,legT:1.25,earSz:0.7,earW:1,tailL:1.15,tailT:0.9,mane:1,unique:"tailTuft"},
panther:{name:"Panther",rarity:"ultra",bodyW:1.1,bodyH:1.1,headSz:1.05,legL:1.15,legT:1.1,earSz:0.9,earW:1,tailL:1.2,tailT:0.95,mane:0,unique:"sleek"},
cheetah:{name:"Cheetah",rarity:"ultra",bodyW:0.8,bodyH:0.9,headSz:0.75,legL:1.45,legT:0.7,earSz:0.85,earW:0.9,tailL:1.3,tailT:0.8,mane:0,unique:"tearMarks"},
lynx:{name:"Lynx",rarity:"ultra",bodyW:1.05,bodyH:0.95,headSz:1.12,legL:0.95,legT:1.1,earSz:1.2,earW:0.9,tailL:0.35,tailT:1.2,mane:0,unique:"earTufts"},
cougar:{name:"Cougar",rarity:"ultra",bodyW:1.05,bodyH:1.15,headSz:0.88,legL:1.25,legT:1.05,earSz:0.9,earW:1,tailL:1.3,tailT:0.95,mane:0,unique:"tawny"},
jaguar:{name:"Jaguar",rarity:"ultra",bodyW:1.25,bodyH:1.05,headSz:1.18,legL:0.95,legT:1.3,earSz:0.85,earW:1.1,tailL:1,tailT:1.1,mane:0,unique:"bigRosettes"},
};

/* ═══ ELEMENTS ═══ */
const ELEMENTS={
none:{name:"Normal",fur:null,eye:null,glow:null,aura:null},
fire:{name:"Fire",fur:["#FF6B35","#CC3300","#FF9500"],eye:"#FF4500",glow:"#FF6B0044",aura:"#FF4500",particles:"flame"},
ice:{name:"Ice",fur:["#A5F3FC","#67E8F9","#E0F2FE"],eye:"#06B6D4",glow:"#06B6D444",aura:"#22D3EE",particles:"frost"},
lightning:{name:"Lightning",fur:["#FDE68A","#FBBF24","#F0F9FF"],eye:"#EAB308",glow:"#EAB30844",aura:"#FACC15",particles:"spark"},
galaxy:{name:"Galaxy",fur:["#4C1D95","#2E1065","#7C3AED"],eye:"#C084FC",glow:"#8B5CF644",aura:"#A78BFA",particles:"star"},
unicorn:{name:"Unicorn",fur:["#FBCFE8","#C4B5FD","#A7F3D0"],eye:"#EC4899",glow:"#EC489944",aura:"#F472B6",particles:"sparkle"},
};

/* ═══ EXPRESSIONS ═══ */
const EXPRS={
happy:{name:"Happy",eyeMod:"happy",mouth:"wSmile"},
neutral:{name:"Neutral",eyeMod:"normal",mouth:"line"},
angry:{name:"Angry",eyeMod:"angry",mouth:"frown"},
blep:{name:"Blep",eyeMod:"happy",mouth:"blep"},
meow:{name:"Meow",eyeMod:"normal",mouth:"open"},
fierce:{name:"Fierce",eyeMod:"fierce",mouth:"teeth"},
sleepy:{name:"Sleepy",eyeMod:"sleepy",mouth:"line"},
surprised:{name:"Surprised",eyeMod:"big",mouth:"smallO"},
};

/* ═══ FACE PATTERNS ═══ */
const FACE_PATTERNS=["none","tabbyM","tuxedoMask","halfFace","bandit","blaze","capAndSaddle"];

/* ═══ FUR COLORS ═══ */
const FURS=[
{base:"#F0A040",dark:"#C47E28",light:"#FCEACC",inner:"#FCDCB0",name:"Orange"},
{base:"#383845",dark:"#1E1E2A",light:"#5A5A70",inner:"#555568",name:"Charcoal"},
{base:"#F2EDE6",dark:"#D8D2CA",light:"#FDFCFA",inner:"#FFF8F2",name:"White"},
{base:"#9494A8",dark:"#72728A",light:"#C0C0D0",inner:"#B4B4C6",name:"Gray"},
{base:"#D4722A",dark:"#A85818",light:"#F0C4A0",inner:"#ECB488",name:"Ginger"},
{base:"#F2DDB8",dark:"#DCC49A",light:"#FBF4E8",inner:"#F8EED8",name:"Cream"},
{base:"#7A5C3A",dark:"#5C4028",light:"#B89878",inner:"#A08060",name:"Brown"},
{base:"#C0A888",dark:"#A08868",light:"#E0D4C4",inner:"#D4C4B0",name:"Fawn"},
{base:"#5C3A28",dark:"#3E2418",light:"#8A6A50",inner:"#7A5840",name:"Chocolate"},
{base:"#B8BCC8",dark:"#969AA6",light:"#DCDEE8",inner:"#D0D4E0",name:"Silver"},
{base:"#B8A090",dark:"#988070",light:"#D8CCC0",inner:"#CCC0B4",name:"Lilac"},
{base:"#1A1A2E",dark:"#0A0A18",light:"#2D2D42",inner:"#222238",name:"Black"},
];
const EYE_COLS=["#4ADE80","#3B82F6","#F59E0B","#8B5CF6","#06B6D4","#EAB308","#EC4899","#FB923C","#2DD4BF","#A78BFA","#F97316","#22C55E"];

/* ═══ RARITY TIERS ═══ */
const RARITY_INFO={common:{color:"#94A3B8",label:"Common"},uncommon:{color:"#4ADE80",label:"Uncommon"},rare:{color:"#3B82F6",label:"Rare"},ultra:{color:"#A78BFA",label:"Ultra Rare"},legendary:{color:"#F59E0B",label:"Legendary"},mythic:{color:"#EC4899",label:"Mythic"}};

/* ═══════════════════════════════════════ */
/*  V3 CAT RENDERER                       */
/* ═══════════════════════════════════════ */

function renderCatSVG(cfg){
const{genes:g,breed:brKey,element:elKey,expression:exKey,pose,style:s}=cfg;
const br=BREEDS[brKey]||BREEDS.domestic;
const el=ELEMENTS[elKey]||ELEMENTS.none;
const ex=EXPRS[exKey]||EXPRS.happy;
const P=[];
const did=`c${g.seed}`;

let base=g.furBase,dark=g.furDark,light=g.furLight,inner=g.furInner;
if(el.fur){base=el.fur[0];dark=el.fur[1];light=el.fur[2];inner=hexL(el.fur[0],"#FFFFFF",0.3);}
if(br.unique==="sleek"){base="#1A1A2E";dark="#0A0A18";light="#2D2D42";inner="#222238";}
if(br.unique==="tawny"){base="#C4956A";dark="#A07848";light="#E8CEB0";inner="#D4B890";}
const shade=hexL(base,"#000000",0.15),hl=hexL(base,"#FFFFFF",0.2);
const ec=el.eye||g.eyeColor,ec2=g.eyeColor2||ec;
const ln=s.lineColor,lw=s.lineWeight;

const isSide=pose==="standL"||pose==="standR";
const isLay=pose==="laying";
const flip=pose==="standL"?-1:1;

const rarMod=g.rarityMod||1;
const bW=50*s.bodyScale*br.bodyW*(isSide?1.35:1)*g.bodyW;
const bH=44*s.bodyScale*br.bodyH*(isLay?0.7:1)*g.bodyH;
const hSz=30*s.headSize*br.headSz*rarMod;
const hRx=hSz*(s.headSquash||1)*(isSide?0.95:1);
const hRy=hSz*(isSide?1.0:1);
const eH=34*s.earSize*br.earSz,eW=15*s.earSize*br.earW;
const eyR=7.5*s.eyeSize,eySp=14*s.eyeSpacing;
const lgW=13*s.legThickness*br.legT,lgH=20*s.legLength*br.legL;
const tLen=48*s.tailLength*br.tailL,tThk=s.tailCurl*br.tailT;

let cx=100,bodyY=138,headY=88;
if(isSide){cx=100;bodyY=128;headY=82;}
if(isLay){bodyY=148;headY=100;cx=100;}

P.push(`<defs>
<radialGradient id="${did}_bg" cx="45%" cy="35%"><stop offset="0%" stop-color="${hl}" stop-opacity="0.4"/><stop offset="100%" stop-color="${base}" stop-opacity="0"/></radialGradient>
<radialGradient id="${did}_eL" cx="38%" cy="35%"><stop offset="0%" stop-color="${hexL(ec,'#FFF',0.5)}"/><stop offset="50%" stop-color="${ec}"/><stop offset="100%" stop-color="${hexL(ec,'#000',0.3)}"/></radialGradient>
<radialGradient id="${did}_eR" cx="38%" cy="35%"><stop offset="0%" stop-color="${hexL(ec2,'#FFF',0.5)}"/><stop offset="50%" stop-color="${ec2}"/><stop offset="100%" stop-color="${hexL(ec2,'#000',0.3)}"/></radialGradient>
<filter id="${did}_gl"><feGaussianBlur stdDeviation="3"/></filter>
<filter id="${did}_sf"><feGaussianBlur stdDeviation="1"/></filter>
${el.glow?`<radialGradient id="${did}_aura"><stop offset="0%" stop-color="${el.glow}"/><stop offset="100%" stop-color="transparent"/></radialGradient>`:""}
</defs>`);

if(el.glow)P.push(`<ellipse cx="${cx}" cy="${bodyY}" rx="${bW*1.5}" ry="${bH*1.5}" fill="url(#${did}_aura)" class="el-pulse"/>`);

if(s.shadow>0)P.push(`<ellipse cx="${cx}" cy="${bodyY+bH+lgH-2}" rx="${bW*0.8}" ry="${3+s.shadow*5}" fill="#000" opacity="${(s.shadow*0.12).toFixed(2)}" filter="url(#${did}_sf)"/>`);

const drawTail=()=>{
let tx,ty,d;
if(isSide){tx=cx-flip*bW*0.9;ty=bodyY-bH*0.1;d=`M${tx},${ty} C${tx-flip*tLen*0.4},${ty-tLen*0.3} ${tx-flip*tLen*0.6},${ty-tLen*0.8} ${tx-flip*tLen*0.3},${ty-tLen}`;}
else if(isLay){tx=cx-bW*0.8;ty=bodyY;d=`M${tx},${ty} Q${tx-tLen*0.4},${ty+tLen*0.2} ${tx-tLen*0.6},${ty+tLen*0.1}`;}
else{tx=cx+bW*0.82;ty=bodyY-bH*0.1;d=`M${tx},${ty} C${tx+tLen*0.5},${ty-tLen*0.3} ${tx+tLen*0.7},${ty-tLen*0.9} ${tx+tLen*0.3},${ty-tLen}`;}
P.push(`<path d="${d}" fill="none" stroke="${base}" stroke-width="${9*tThk}" stroke-linecap="round"/>`);
P.push(`<path d="${d}" fill="none" stroke="${hl}" stroke-width="${4*tThk}" stroke-linecap="round" opacity="0.2"/>`);
if(lw>0)P.push(`<path d="${d}" fill="none" stroke="${ln}" stroke-width="${lw*0.6}" stroke-linecap="round" opacity="0.3"/>`);
if(br.unique==="tailTuft"){const pts=d.split(/[, ]/);const lx=parseFloat(pts[pts.length-2])||tx+tLen*0.3;const ly=parseFloat(pts[pts.length-1])||ty-tLen;P.push(`<ellipse cx="${lx}" cy="${ly}" rx="${8*tThk}" ry="${10*tThk}" fill="${dark}"/>`);P.push(`<ellipse cx="${lx-1}" cy="${ly-1}" rx="${5*tThk}" ry="${6*tThk}" fill="${base}" opacity="0.4"/>`);}
if(el.particles==="flame")P.push(`<circle cx="${tx}" cy="${ty-5}" r="6" fill="#FF6B35" opacity="0.6" class="el-flicker"/>`);
};
drawTail();

const bTop=bodyY-bH,bBot=bodyY+bH*0.65;
let bodyPath;
if(isSide){
bodyPath=`M${cx-bW*0.85},${bodyY} Q${cx-bW*0.9},${bTop} ${cx-bW*0.3},${bTop-bH*0.1} Q${cx+bW*0.1},${bTop-bH*0.2} ${cx+bW*0.5},${bTop} Q${cx+bW*0.95},${bTop+bH*0.3} ${cx+bW*0.85},${bodyY+bH*0.3} Q${cx+bW*0.7},${bBot+bH*0.1} ${cx-bW*0.7},${bBot+bH*0.1} Q${cx-bW*0.95},${bodyY+bH*0.3} ${cx-bW*0.85},${bodyY}Z`;
}else if(isLay){
bodyPath=`M${cx-bW},${bodyY-bH*0.3} Q${cx-bW*0.5},${bodyY-bH*0.6} ${cx},${bodyY-bH*0.5} Q${cx+bW*0.5},${bodyY-bH*0.6} ${cx+bW},${bodyY-bH*0.3} Q${cx+bW*1.05},${bodyY+bH*0.1} ${cx+bW*0.7},${bodyY+bH*0.4} Q${cx},${bodyY+bH*0.55} ${cx-bW*0.7},${bodyY+bH*0.4} Q${cx-bW*1.05},${bodyY+bH*0.1} ${cx-bW},${bodyY-bH*0.3}Z`;
}else{
bodyPath=`M${cx-bW*0.85},${bodyY-bH*0.2} Q${cx-bW*0.9},${bTop+bH*0.3} ${cx-bW*0.4},${bTop} Q${cx},${bTop-bH*0.15} ${cx+bW*0.4},${bTop} Q${cx+bW*0.9},${bTop+bH*0.3} ${cx+bW*0.85},${bodyY-bH*0.2} Q${cx+bW*0.95},${bodyY+bH*0.2} ${cx+bW*0.7},${bBot} Q${cx},${bBot+bH*0.2} ${cx-bW*0.7},${bBot} Q${cx-bW*0.95},${bodyY+bH*0.2} ${cx-bW*0.85},${bodyY-bH*0.2}Z`;
}
P.push(`<path d="${bodyPath}" fill="${base}"/>`);
P.push(`<ellipse cx="${cx}" cy="${bodyY-bH*0.15}" rx="${bW*0.5}" ry="${bH*0.45}" fill="url(#${did}_bg)"/>`);
if(s.bellyShow>0&&!isSide)P.push(`<ellipse cx="${cx}" cy="${bodyY+bH*0.15}" rx="${bW*0.35*s.bellyShow}" ry="${bH*0.4*s.bellyShow}" fill="${light}" opacity="${(0.3+s.bellyShow*0.3).toFixed(2)}"/>`);
if(lw>0)P.push(`<path d="${bodyPath}" fill="none" stroke="${ln}" stroke-width="${lw}" opacity="0.35"/>`);

if(br.unique==="tigerStripes"||brKey==="tiger"){for(let i=0;i<7;i++){const y=bodyY-bH*0.45+i*bH*0.17;const w=bW*(0.75-Math.abs(i-3)*0.05);P.push(`<path d="M${cx-w},${y} Q${cx-w*0.3},${y-(i%2?3:-3)} ${cx},${y} Q${cx+w*0.3},${y+(i%2?3:-3)} ${cx+w},${y}" fill="none" stroke="${dark}" stroke-width="${2.5+s.patternIntensity}" opacity="${(0.25+s.patternIntensity*0.2).toFixed(2)}" stroke-linecap="round"/>`);}}
if(br.unique==="rosettes"||br.unique==="bigRosettes"){const sz=br.unique==="bigRosettes"?1.4:1;[[-0.3,-0.2],[0.2,0.05],[-0.1,0.3],[0.3,-0.1],[-0.25,0.15],[0.15,0.25]].forEach(([dx,dy])=>{P.push(`<circle cx="${cx+bW*dx}" cy="${bodyY+bH*dy}" r="${(6+s.patternIntensity*3)*sz}" fill="none" stroke="${dark}" stroke-width="${1.5}" opacity="${(0.3+s.patternIntensity*0.2).toFixed(2)}"/>`);P.push(`<circle cx="${cx+bW*dx}" cy="${bodyY+bH*dy}" r="${(3+s.patternIntensity*1.5)*sz}" fill="${dark}" opacity="${(0.15+s.patternIntensity*0.1).toFixed(2)}"/>`);});}
if(!br.unique&&g.pattern==="tabby"){for(let i=0;i<5;i++){const y=bodyY-bH*0.4+i*bH*0.22,w=bW*(0.7-i*0.04);P.push(`<path d="M${cx-w},${y} Q${cx},${y+(i%2?-3:3)} ${cx+w},${y}" fill="none" stroke="${dark}" stroke-width="${1.5+s.patternIntensity}" opacity="${(0.15+s.patternIntensity*0.12).toFixed(2)}" stroke-linecap="round"/>`);}}
if(!br.unique&&g.pattern==="tuxedo")P.push(`<path d="M${cx-bW*0.3},${bodyY} Q${cx},${bodyY-bH*0.3} ${cx+bW*0.3},${bodyY} Q${cx+bW*0.3},${bBot} ${cx},${bBot+4} Q${cx-bW*0.3},${bBot} ${cx-bW*0.3},${bodyY}Z" fill="#F5F0EB" opacity="${(0.45+s.patternIntensity*0.35).toFixed(2)}"/>`);
if(!br.unique&&g.pattern==="calico")[[-0.3,-0.2,14],[0.25,0.1,12],[-0.05,0.35,11]].forEach(([dx,dy,r])=>P.push(`<ellipse cx="${cx+bW*dx}" cy="${bodyY+bH*dy}" rx="${r*(0.6+s.patternIntensity*0.4)}" ry="${r*(0.5+s.patternIntensity*0.35)}" fill="${g.spotColors[0]}" opacity="${(0.3+s.patternIntensity*0.25).toFixed(2)}"/>`));
if(g.pattern==="spots"&&!br.unique)[[-0.28,-0.15,8],[0.22,0.05,7],[-0.08,0.3,9],[0.3,0.2,6]].forEach(([dx,dy,r])=>P.push(`<circle cx="${cx+bW*dx}" cy="${bodyY+bH*dy}" r="${r*(0.5+s.patternIntensity*0.4)}" fill="${dark}" opacity="${(0.25+s.patternIntensity*0.2).toFixed(2)}"/>`));

if(elKey==="galaxy"){for(let i=0;i<15;i++){const sx=cx+bW*(Math.sin(i*2.3)*0.7);const sy=bodyY+bH*(Math.cos(i*1.7)*0.6);P.push(`<circle cx="${sx}" cy="${sy}" r="${1+i%3}" fill="white" opacity="${0.3+i%4*0.15}" class="el-twinkle" style="animation-delay:${i*0.2}s"/>`);}P.push(`<ellipse cx="${cx}" cy="${bodyY}" rx="${bW*0.6}" ry="${bH*0.5}" fill="url(#${did}_bg)" opacity="0.3"/>`);}

const legY=isLay?bodyY+bH*0.15:bBot-4;
if(isSide){
const fLeg1=cx-bW*0.55,fLeg2=cx+bW*0.35;
const bLeg1=cx-bW*0.45,bLeg2=cx+bW*0.45;
[bLeg1-3,bLeg2+3].forEach(lx=>P.push(`<rect x="${lx}" y="${legY}" width="${lgW}" height="${lgH}" rx="${lgW*0.4}" fill="${shade}"/>`));
[fLeg1,fLeg2].forEach(lx=>{P.push(`<rect x="${lx}" y="${legY}" width="${lgW}" height="${lgH}" rx="${lgW*0.4}" fill="${base}"/>`);if(lw>0)P.push(`<rect x="${lx}" y="${legY}" width="${lgW}" height="${lgH}" rx="${lgW*0.4}" fill="none" stroke="${ln}" stroke-width="${lw*0.6}" opacity="0.3"/>`);
if(s.pawPads>0){const py=legY+lgH-lgW*0.3,pcx=lx+lgW*0.5;P.push(`<ellipse cx="${pcx}" cy="${py}" rx="${lgW*0.35}" ry="${lgW*0.25}" fill="${s.padColor}" opacity="${(s.pawPads*0.7).toFixed(2)}"/>`);[[-0.22,-0.35],[0,-0.45],[0.22,-0.35]].forEach(([bx,by])=>P.push(`<circle cx="${pcx+lgW*bx}" cy="${py+lgW*by}" r="${lgW*0.12}" fill="${s.padColor}" opacity="${(s.pawPads*0.6).toFixed(2)}"/>`))}});
}else if(isLay){
const layLegH=lgH*0.6;
[[cx-bW*0.6,legY,8],[cx-bW*0.3,legY+3,5],[cx+bW*0.2,legY+3,5],[cx+bW*0.55,legY,-2]].forEach(([lx,ly,rot])=>{
P.push(`<rect x="${lx}" y="${ly}" width="${lgW}" height="${layLegH}" rx="${lgW*0.4}" fill="${base}" transform="rotate(${rot},${lx+lgW/2},${ly})"/>`);
if(s.pawPads>0){const py=ly+layLegH-lgW*0.25,pcx=lx+lgW*0.5;P.push(`<ellipse cx="${pcx}" cy="${py}" rx="${lgW*0.3}" ry="${lgW*0.22}" fill="${s.padColor}" opacity="${(s.pawPads*0.6).toFixed(2)}" transform="rotate(${rot},${pcx},${py})"/>`);}});
}else{
const bl1=cx-bW*0.5,bl2=cx+bW*0.38;
const fl1=cx-bW*0.35,fl2=cx+bW*0.22;
[bl1,bl2].forEach(lx=>P.push(`<rect x="${lx}" y="${legY+2}" width="${lgW}" height="${lgH}" rx="${lgW*0.4}" fill="${shade}"/>`));
[fl1,fl2].forEach(lx=>{P.push(`<rect x="${lx}" y="${legY}" width="${lgW}" height="${lgH}" rx="${lgW*0.4}" fill="${base}"/>`);if(lw>0)P.push(`<rect x="${lx}" y="${legY}" width="${lgW}" height="${lgH}" rx="${lgW*0.4}" fill="none" stroke="${ln}" stroke-width="${lw*0.6}" opacity="0.3"/>`);
if(s.pawPads>0){const py=legY+lgH-lgW*0.3,pcx=lx+lgW*0.5;P.push(`<ellipse cx="${pcx}" cy="${py}" rx="${lgW*0.35}" ry="${lgW*0.25}" fill="${s.padColor}" opacity="${(s.pawPads*0.7).toFixed(2)}"/>`);[[-0.22,-0.35],[0,-0.45],[0.22,-0.35]].forEach(([bx,by])=>P.push(`<circle cx="${pcx+lgW*bx}" cy="${py+lgW*by}" r="${lgW*0.12}" fill="${s.padColor}" opacity="${(s.pawPads*0.6).toFixed(2)}"/>`))}
if(g.pattern==="socks")P.push(`<rect x="${lx}" y="${legY+lgH*0.5}" width="${lgW}" height="${lgH*0.5}" rx="${lgW*0.4}" fill="#F5F0EB" opacity="0.7"/>`);
});
}

const hdX=isSide?cx+flip*bW*0.45:cx;
const hdY=isLay?headY:headY;
P.push(`<ellipse cx="${hdX}" cy="${hdY}" rx="${hRx}" ry="${hRy}" fill="${base}"/>`);
P.push(`<ellipse cx="${hdX-hRx*0.15}" cy="${hdY-hRy*0.2}" rx="${hRx*0.55}" ry="${hRy*0.45}" fill="${hl}" opacity="0.15"/>`);
if(lw>0)P.push(`<ellipse cx="${hdX}" cy="${hdY}" rx="${hRx}" ry="${hRy}" fill="none" stroke="${ln}" stroke-width="${lw}" opacity="0.35"/>`);

if(br.mane>0){const mR=hRx*1.45;for(let a=0;a<12;a++){const ang=(a/12)*Math.PI*2;const mx=hdX+Math.cos(ang)*mR*0.9;const my=hdY+Math.sin(ang)*mR*0.8+hRy*0.15;const mr=mR*0.35+Math.sin(a*1.5)*mR*0.08;P.push(`<ellipse cx="${mx}" cy="${my}" rx="${mr}" ry="${mr*0.8}" fill="${dark}" opacity="0.5"/>`);}for(let a=0;a<8;a++){const ang=(a/8)*Math.PI*2+0.2;const mx=hdX+Math.cos(ang)*mR*0.75;const my=hdY+Math.sin(ang)*mR*0.65+hRy*0.1;P.push(`<ellipse cx="${mx}" cy="${my}" rx="${mR*0.28}" ry="${mR*0.22}" fill="${base}" opacity="0.6"/>`);}P.push(`<ellipse cx="${hdX}" cy="${hdY}" rx="${hRx}" ry="${hRy}" fill="${base}"/>`);}

if(g.facePattern==="tabbyM")P.push(`<path d="M${hdX-hRx*0.35},${hdY-hRy*0.3} L${hdX-hRx*0.15},${hdY-hRy*0.55} L${hdX},${hdY-hRy*0.35} L${hdX+hRx*0.15},${hdY-hRy*0.55} L${hdX+hRx*0.35},${hdY-hRy*0.3}" fill="none" stroke="${dark}" stroke-width="${1.2+s.patternIntensity*0.5}" opacity="0.25" stroke-linecap="round" stroke-linejoin="round"/>`);
if(g.facePattern==="tuxedoMask")P.push(`<ellipse cx="${hdX}" cy="${hdY+hRy*0.15}" rx="${hRx*0.5}" ry="${hRy*0.6}" fill="#F5F0EB" opacity="0.5"/>`);
if(g.facePattern==="halfFace")P.push(`<path d="M${hdX},${hdY-hRy} Q${hdX+hRx},${hdY-hRy} ${hdX+hRx},${hdY} Q${hdX+hRx},${hdY+hRy} ${hdX},${hdY+hRy}Z" fill="${dark}" opacity="0.3"/>`);
if(g.facePattern==="bandit")P.push(`<rect x="${hdX-hRx*0.8}" y="${hdY-hRy*0.25}" width="${hRx*1.6}" height="${hRy*0.35}" rx="${hRy*0.15}" fill="${dark}" opacity="0.35"/>`);
if(g.facePattern==="blaze")P.push(`<path d="M${hdX-hRx*0.08},${hdY-hRy*0.9} Q${hdX-hRx*0.15},${hdY} ${hdX-hRx*0.05},${hdY+hRy*0.3} L${hdX+hRx*0.05},${hdY+hRy*0.3} Q${hdX+hRx*0.15},${hdY} ${hdX+hRx*0.08},${hdY-hRy*0.9}Z" fill="#F5F0EB" opacity="0.5"/>`);
if(br.unique==="tearMarks"){[-1,1].forEach(sd=>{const ex=hdX+sd*eySp;P.push(`<path d="M${ex+sd*2},${hdY+hRy*0.15} Q${ex+sd*3},${hdY+hRy*0.5} ${ex+sd*1},${hdY+hRy*0.85}" fill="none" stroke="#1a1a2e" stroke-width="2" opacity="0.5" stroke-linecap="round"/>`);});}

const earBY=hdY-hRy*0.62;
const drawEar=(ex,dir)=>{
const tip=[ex+dir*eW*0.3,earBY-eH];
P.push(`<path d="M${ex-dir*eW*0.2},${earBY+4} Q${tip[0]-dir*2},${tip[1]+eH*0.2} ${tip[0]},${tip[1]} Q${tip[0]+dir*4},${tip[1]+eH*0.25} ${ex+dir*eW*0.9},${earBY+2}Z" fill="${base}"/>`);
P.push(`<path d="M${ex+dir*eW*0.0},${earBY+2} Q${tip[0]-dir*1},${tip[1]+eH*0.3} ${ex+dir*eW*0.2},${earBY-eH*0.7} Q${ex+dir*eW*0.45},${earBY-eH*0.45} ${ex+dir*eW*0.6},${earBY+2}Z" fill="${inner}" opacity="0.7"/>`);
if(lw>0)P.push(`<path d="M${ex-dir*eW*0.2},${earBY+4} Q${tip[0]-dir*2},${tip[1]+eH*0.2} ${tip[0]},${tip[1]} Q${tip[0]+dir*4},${tip[1]+eH*0.25} ${ex+dir*eW*0.9},${earBY+2}" fill="none" stroke="${ln}" stroke-width="${lw*0.7}" opacity="0.3"/>`);
if(br.unique==="earTufts"||s.earTufts>0){const t=br.unique==="earTufts"?1.2:s.earTufts;P.push(`<line x1="${tip[0]}" y1="${tip[1]}" x2="${tip[0]+dir*4}" y2="${tip[1]-8*t}" stroke="${dark}" stroke-width="2.5" stroke-linecap="round"/>`);P.push(`<line x1="${tip[0]}" y1="${tip[1]}" x2="${tip[0]}" y2="${tip[1]-9*t}" stroke="${dark}" stroke-width="2" stroke-linecap="round"/>`);P.push(`<line x1="${tip[0]}" y1="${tip[1]}" x2="${tip[0]-dir*2}" y2="${tip[1]-7*t}" stroke="${dark}" stroke-width="1.5" stroke-linecap="round"/>`);}
if(elKey==="unicorn"&&dir===1)P.push(`<polygon points="${hdX},${earBY-eH*0.6} ${hdX-5},${earBY+4} ${hdX+5},${earBY+4}" fill="url(#${did}_eL)" class="el-shimmer"/><line x1="${hdX-3}" y1="${earBY-eH*0.1}" x2="${hdX+3}" y2="${earBY-eH*0.15}" stroke="white" stroke-width="1" opacity="0.5"/><line x1="${hdX-2}" y1="${earBY-eH*0.3}" x2="${hdX+4}" y2="${earBY-eH*0.35}" stroke="white" stroke-width="1" opacity="0.4"/>`);
};
drawEar(hdX-hRx*0.55,-1);drawEar(hdX+hRx*0.55,1);

if(s.cheekFluff>0){const cf=s.cheekFluff;P.push(`<ellipse cx="${hdX-hRx*0.75}" cy="${hdY+hRy*0.25}" rx="${hRx*0.25*cf}" ry="${hRy*0.2*cf}" fill="${base}"/>`);P.push(`<ellipse cx="${hdX+hRx*0.75}" cy="${hdY+hRy*0.25}" rx="${hRx*0.25*cf}" ry="${hRy*0.2*cf}" fill="${base}"/>`);}
if(brKey==="lynx"){P.push(`<ellipse cx="${hdX-hRx*0.8}" cy="${hdY+hRy*0.2}" rx="${hRx*0.3}" ry="${hRy*0.25}" fill="${base}"/>`);P.push(`<ellipse cx="${hdX+hRx*0.8}" cy="${hdY+hRy*0.2}" rx="${hRx*0.3}" ry="${hRy*0.25}" fill="${base}"/>`);}

const eyeY=hdY+hRy*0.02;
const drawEye=(exx,gid)=>{
const r=eyR;
if(ex.eyeMod==="sleepy"){P.push(`<path d="M${exx-r*1.1},${eyeY+r*0.1} Q${exx},${eyeY-r*0.9} ${exx+r*1.1},${eyeY+r*0.1}" fill="none" stroke="${ln||'#1a1a2e'}" stroke-width="${2+lw*0.5}" stroke-linecap="round" opacity="0.7"/>`);return;}
if(ex.eyeMod==="angry"){
P.push(`<path d="M${exx-r},${eyeY-r*0.2} Q${exx},${eyeY-r*0.9} ${exx+r},${eyeY+r*0.1} Q${exx},${eyeY+r*0.6} ${exx-r},${eyeY-r*0.2}Z" fill="white"/>`);
P.push(`<circle cx="${exx}" cy="${eyeY}" r="${r*0.5}" fill="url(#${gid})"/>`);P.push(`<ellipse cx="${exx}" cy="${eyeY}" rx="${r*0.2}" ry="${r*0.35}" fill="#0F0F1A"/>`);
P.push(`<line x1="${exx-r*1.2}" y1="${eyeY-r*0.9}" x2="${exx+r*0.5}" y2="${eyeY-r*0.4}" stroke="${ln||'#1a1a2e'}" stroke-width="${1.5+lw*0.3}" opacity="0.7" stroke-linecap="round"/>`);return;}
if(ex.eyeMod==="fierce"){
P.push(`<path d="M${exx-r},${eyeY} Q${exx},${eyeY-r*0.9} ${exx+r},${eyeY} Q${exx},${eyeY+r*0.5} ${exx-r},${eyeY}Z" fill="white"/>`);
P.push(`<path d="M${exx-r*0.85},${eyeY} Q${exx},${eyeY-r*0.7} ${exx+r*0.85},${eyeY} Q${exx},${eyeY+r*0.4} ${exx-r*0.85},${eyeY}Z" fill="url(#${gid})"/>`);
P.push(`<ellipse cx="${exx}" cy="${eyeY}" rx="${r*0.15}" ry="${r*0.5}" fill="#0F0F1A"/>`);P.push(`<circle cx="${exx+r*0.2}" cy="${eyeY-r*0.2}" r="${r*0.12}" fill="white" opacity="0.8"/>`);return;}
if(ex.eyeMod==="big"){const rr=r*1.4;P.push(`<circle cx="${exx}" cy="${eyeY}" r="${rr}" fill="white"/>`);P.push(`<circle cx="${exx}" cy="${eyeY}" r="${rr*0.7}" fill="url(#${gid})"/>`);P.push(`<ellipse cx="${exx}" cy="${eyeY}" rx="${rr*0.28}" ry="${rr*0.4}" fill="#0F0F1A"/>`);P.push(`<circle cx="${exx+rr*0.25}" cy="${eyeY-rr*0.3}" r="${rr*0.22}" fill="white" opacity="0.9"/>`);P.push(`<circle cx="${exx-rr*0.15}" cy="${eyeY+rr*0.2}" r="${rr*0.1}" fill="white" opacity="0.6"/>`);return;}
const isHappy=ex.eyeMod==="happy";
P.push(`<circle cx="${exx}" cy="${eyeY}" r="${r*1.05}" fill="white"/>`);
P.push(`<circle cx="${exx+r*0.08}" cy="${eyeY-r*0.05}" r="${r*0.68}" fill="url(#${gid})"/>`);
P.push(`<ellipse cx="${exx+r*0.1}" cy="${eyeY}" rx="${r*0.28}" ry="${r*0.35}" fill="#0F0F1A"/>`);
P.push(`<circle cx="${exx+r*0.28}" cy="${eyeY-r*0.3}" r="${r*0.22}" fill="white" opacity="0.9"/>`);
P.push(`<circle cx="${exx-r*0.15}" cy="${eyeY+r*0.25}" r="${r*0.1}" fill="white" opacity="0.6"/>`);
if(isHappy)P.push(`<path d="M${exx-r*1.1},${eyeY-r*0.5} Q${exx},${eyeY-r*1.15} ${exx+r*1.1},${eyeY-r*0.5}" fill="none" stroke="${shade}" stroke-width="${0.8+lw*0.3}" opacity="0.25" stroke-linecap="round"/>`);
if(el.eye)P.push(`<circle cx="${exx}" cy="${eyeY}" r="${r*1.3}" fill="${el.glow}" class="el-pulse" opacity="0.3"/>`);
};
drawEye(hdX-eySp,`${did}_eL`);drawEye(hdX+eySp,`${did}_eR`);

const nY=hdY+hRy*0.38,nw=4.2*s.noseSize,nh=3*s.noseSize;
P.push(`<path d="M${hdX},${nY-nh} Q${hdX-nw},${nY-nh*0.3} ${hdX-nw*0.8},${nY+nh*0.3} Q${hdX},${nY+nh} ${hdX+nw*0.8},${nY+nh*0.3} Q${hdX+nw},${nY-nh*0.3} ${hdX},${nY-nh}Z" fill="${s.noseColor}"/>`);
P.push(`<ellipse cx="${hdX-nw*0.15}" cy="${nY-nh*0.3}" rx="${nw*0.3}" ry="${nh*0.25}" fill="white" opacity="0.3"/>`);
P.push(`<line x1="${hdX}" y1="${nY+nh}" x2="${hdX}" y2="${nY+nh+3.5*s.noseSize}" stroke="${ln||'#1a1a2e'}" stroke-width="${0.8+lw*0.3}" opacity="0.5"/>`);

const mY=nY+nh+4*s.noseSize,mW=6.5*s.noseSize;
if(ex.mouth==="wSmile")P.push(`<path d="M${hdX-mW},${mY} Q${hdX-mW*0.5},${mY+mW*0.5} ${hdX},${mY+mW*0.15} Q${hdX+mW*0.5},${mY+mW*0.5} ${hdX+mW},${mY}" fill="none" stroke="${ln||'#1a1a2e'}" stroke-width="${1+lw*0.3}" stroke-linecap="round" opacity="0.6"/>`);
if(ex.mouth==="frown")P.push(`<path d="M${hdX-mW},${mY+mW*0.3} Q${hdX},${mY-mW*0.2} ${hdX+mW},${mY+mW*0.3}" fill="none" stroke="${ln||'#1a1a2e'}" stroke-width="${1.2+lw*0.3}" stroke-linecap="round" opacity="0.6"/>`);
if(ex.mouth==="line")P.push(`<line x1="${hdX-mW*0.7}" y1="${mY}" x2="${hdX+mW*0.7}" y2="${mY}" stroke="${ln||'#1a1a2e'}" stroke-width="${1+lw*0.3}" stroke-linecap="round" opacity="0.4"/>`);
if(ex.mouth==="blep"){P.push(`<path d="M${hdX-mW},${mY} Q${hdX-mW*0.5},${mY+mW*0.5} ${hdX},${mY+mW*0.15} Q${hdX+mW*0.5},${mY+mW*0.5} ${hdX+mW},${mY}" fill="none" stroke="${ln||'#1a1a2e'}" stroke-width="${1+lw*0.3}" stroke-linecap="round" opacity="0.6"/>`);P.push(`<ellipse cx="${hdX}" cy="${mY+mW*0.45}" rx="${mW*0.35}" ry="${mW*0.3}" fill="#F9A8D4"/>`);P.push(`<ellipse cx="${hdX-mW*0.08}" cy="${mY+mW*0.38}" rx="${mW*0.15}" ry="${mW*0.1}" fill="#FECDD3" opacity="0.5"/>`);}
if(ex.mouth==="open"){P.push(`<ellipse cx="${hdX}" cy="${mY+mW*0.15}" rx="${mW*0.6}" ry="${mW*0.45}" fill="#2d1b2e"/>`);P.push(`<ellipse cx="${hdX}" cy="${mY+mW*0.4}" rx="${mW*0.4}" ry="${mW*0.15}" fill="#F9A8D4" opacity="0.5"/>`);}
if(ex.mouth==="teeth"){P.push(`<ellipse cx="${hdX}" cy="${mY+mW*0.1}" rx="${mW*0.65}" ry="${mW*0.5}" fill="#2d1b2e"/>`);P.push(`<polygon points="${hdX-mW*0.25},${mY-mW*0.05} ${hdX-mW*0.15},${mY+mW*0.25} ${hdX-mW*0.05},${mY-mW*0.05}" fill="white" opacity="0.9"/>`);P.push(`<polygon points="${hdX+mW*0.05},${mY-mW*0.05} ${hdX+mW*0.15},${mY+mW*0.25} ${hdX+mW*0.25},${mY-mW*0.05}" fill="white" opacity="0.9"/>`);P.push(`<ellipse cx="${hdX}" cy="${mY+mW*0.4}" rx="${mW*0.35}" ry="${mW*0.15}" fill="#F9A8D4" opacity="0.5"/>`);}
if(ex.mouth==="smallO")P.push(`<ellipse cx="${hdX}" cy="${mY+mW*0.1}" rx="${mW*0.3}" ry="${mW*0.3}" fill="#2d1b2e"/>`);

if(s.whiskers>0){const wL=26*s.whiskers,wY=nY+nh+1;[-1,1].forEach(sd=>{const wb=hdX+sd*hRx*0.55;for(let i=-1;i<=1;i++){const ang=i*10,dr=i===1?3:i===-1?-1:1;P.push(`<path d="M${wb},${wY+ang*0.2} Q${wb+sd*wL*0.5},${wY+ang*0.3+dr} ${wb+sd*wL},${wY+ang*0.5+dr*1.5}" fill="none" stroke="${ln||'#1a1a2e'}" stroke-width="${0.7+lw*0.15}" opacity="${(0.25+s.whiskers*0.2).toFixed(2)}" stroke-linecap="round"/>`);}});}
if(s.blush>0){const bR=eyR*0.8;P.push(`<ellipse cx="${hdX-eySp-eyR*0.4}" cy="${eyeY+eyR*1.4}" rx="${bR}" ry="${bR*0.55}" fill="#FDA4AF" opacity="${(s.blush*0.35).toFixed(2)}" filter="url(#${did}_sf)"/>`);P.push(`<ellipse cx="${hdX+eySp+eyR*0.4}" cy="${eyeY+eyR*1.4}" rx="${bR}" ry="${bR*0.55}" fill="#FDA4AF" opacity="${(s.blush*0.35).toFixed(2)}" filter="url(#${did}_sf)"/>`);}

if(el.particles==="flame"){for(let i=0;i<8;i++){const fx=cx+bW*(Math.sin(i*1.1)*0.9);const fy=bodyY-bH*0.3-i*5;P.push(`<path d="M${fx},${fy} Q${fx-3},${fy-8} ${fx},${fy-14} Q${fx+3},${fy-8} ${fx},${fy}Z" fill="${["#FF6B35","#FF4500","#FBBF24"][i%3]}" opacity="${0.4+i%3*0.15}" class="el-flame" style="animation-delay:${i*0.15}s"/>`);}P.push(`<ellipse cx="${cx}" cy="${bodyY-bH*0.5}" rx="${bW*0.6}" ry="${bH*0.3}" fill="#FF4500" opacity="0.08" class="el-pulse"/>`);}
if(el.particles==="frost"){for(let i=0;i<10;i++){const fx=cx+bW*(Math.sin(i*2.1)*1.1);const fy=bodyY+bH*(Math.cos(i*1.7)*0.8);P.push(`<polygon points="${fx},${fy-5} ${fx+2},${fy-1} ${fx+5},${fy} ${fx+2},${fy+1} ${fx},${fy+5} ${fx-2},${fy+1} ${fx-5},${fy} ${fx-2},${fy-1}" fill="#A5F3FC" opacity="${0.3+i%3*0.15}" class="el-twinkle" style="animation-delay:${i*0.3}s" transform="rotate(${i*30},${fx},${fy})"/>`);}P.push(`<ellipse cx="${cx}" cy="${bodyY}" rx="${bW}" ry="${bH*0.8}" fill="#06B6D4" opacity="0.05" class="el-pulse"/>`);}
if(el.particles==="spark"){for(let i=0;i<6;i++){const sx=cx+bW*(Math.sin(i*1.8)*1.0);const sy=bodyY-bH*0.2+bH*(Math.cos(i*2.3)*0.7);const ex2=sx+(Math.random()>0.5?1:-1)*12;const ey=sy-10;P.push(`<path d="M${sx},${sy} L${sx+3},${sy-6} L${sx-2},${sy-4} L${ex2},${ey}" fill="none" stroke="${["#FBBF24","#FDE68A","#FFF"][i%3]}" stroke-width="1.5" opacity="${0.5+i%3*0.2}" class="el-flicker" style="animation-delay:${i*0.2}s" stroke-linecap="round"/>`);}P.push(`<ellipse cx="${cx}" cy="${bodyY}" rx="${bW*0.8}" ry="${bH*0.6}" fill="#EAB308" opacity="0.06" class="el-pulse"/>`);}
if(el.particles==="star"){for(let i=0;i<20;i++){const sx=cx+bW*(Math.sin(i*2.5)*1.2);const sy=bodyY+bH*(Math.cos(i*1.9)*1.0)-10;P.push(`<circle cx="${sx}" cy="${sy}" r="${1+i%3*0.7}" fill="white" opacity="${0.2+i%4*0.15}" class="el-twinkle" style="animation-delay:${i*0.15}s"/>`);}P.push(`<ellipse cx="${cx}" cy="${bodyY-bH*0.2}" rx="${bW*0.7}" ry="${bH*0.5}" fill="#7C3AED" opacity="0.06" class="el-pulse"/>`);}
if(el.particles==="sparkle"){for(let i=0;i<12;i++){const sx=cx+bW*(Math.sin(i*2.0)*1.1);const sy=bodyY+bH*(Math.cos(i*1.6)*0.9)-5;const sz=2+i%3;P.push(`<path d="M${sx},${sy-sz} L${sx+sz*0.3},${sy-sz*0.3} L${sx+sz},${sy} L${sx+sz*0.3},${sy+sz*0.3} L${sx},${sy+sz} L${sx-sz*0.3},${sy+sz*0.3} L${sx-sz},${sy} L${sx-sz*0.3},${sy-sz*0.3}Z" fill="${["#FBCFE8","#C4B5FD","#A7F3D0","#FDE68A"][i%4]}" opacity="${0.4+i%3*0.15}" class="el-twinkle" style="animation-delay:${i*0.2}s"/>`);}P.push(`<ellipse cx="${cx}" cy="${bodyY}" rx="${bW*0.9}" ry="${bH*0.7}" fill="#EC4899" opacity="0.05" class="el-pulse"/>`);}

return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-5 5 210 205">${P.join("")}</svg>`;
}

function makeGenes(rng,brKey,elKey){
const br=BREEDS[brKey];const fur=pick(FURS,rng);
const rarityRoll=rng();
let rarMod=1,rarity=br.rarity||"common";
if(rarityRoll<0.02){rarMod=rng()>0.5?0.65:1.45;rarity="legendary";}
else if(rarityRoll<0.08){rarMod=rng()>0.5?0.75:1.3;rarity="rare";}
if(elKey!=="none"){rarity=rarityRoll<0.01?"mythic":"legendary";}
if(["tiger","lion","panther","cheetah","lynx","cougar","jaguar"].includes(brKey))rarity="ultra";
return{seed:Math.floor(rng()*999999),furBase:fur.base,furDark:fur.dark,furLight:fur.light,furInner:fur.inner,furName:fur.name,eyeColor:pick(EYE_COLS,rng),eyeColor2:rng()>0.9?pick(EYE_COLS,rng):null,bodyW:0.88+rng()*0.24,bodyH:0.88+rng()*0.24,pattern:pick(["solid","solid","tabby","tuxedo","calico","spots","socks"],rng),spotColors:[pick(["#D4722A","#E8943A","#2D2D3A"],rng)],facePattern:pick(FACE_PATTERNS,rng),rarityMod:rarMod,rarity,gender:rng()>0.5?"male":"female"};
}

const Slider=({label,value,min,max,step,onChange})=>(<div style={{marginBottom:4}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:10,color:"#94A3B8",fontWeight:600}}>{label}</span><span style={{fontSize:10,color:"#CBD5E1",fontFamily:"monospace"}}>{value.toFixed(step<0.1?2:1)}</span></div><input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(parseFloat(e.target.value))} style={{width:"100%",height:4,appearance:"none",background:"#1E293B",borderRadius:3,outline:"none",cursor:"pointer"}}/></div>);

const Pill=({label,active,onClick,color})=>(<button onClick={onClick} style={{padding:"5px 10px",borderRadius:20,border:active?`2px solid ${color||"#818CF8"}`:"1px solid #334155",background:active?"#1E1B4B":"#0F172A",color:active?"#F8FAFC":"#94A3B8",fontSize:11,cursor:"pointer",fontWeight:active?700:500,whiteSpace:"nowrap",transition:"all 0.15s"}}>{label}</button>);

const Section=({title,open,toggle,children})=>(<div style={{background:"#0F172A",borderRadius:12,border:"1px solid #1E293B",overflow:"hidden",marginBottom:6}}><button onClick={toggle} style={{width:"100%",padding:"8px 12px",background:"none",border:"none",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}><span style={{fontSize:12,color:"#F8FAFC",fontWeight:600}}>{title}</span><span style={{fontSize:10,color:"#64748B"}}>{open?"▲":"▼"}</span></button>{open&&<div style={{padding:"4px 12px 10px"}}>{children}</div>}</div>);

const DEFAULT_STYLE={bodyScale:0.85,headSize:1.2,headSquash:1.08,earSize:0.82,earWidth:1.0,eyeSize:1.45,eyeSpacing:0.88,tailLength:0.85,tailCurl:0.85,legLength:0.7,legThickness:0.85,lineWeight:0.4,lineColor:"#4A4060",noseSize:0.75,noseColor:"#F9A8D4",padColor:"#F9A8D4",blush:0.7,whiskers:0.4,shadow:0.5,patternIntensity:0.6,cheekFluff:0.5,earTufts:0,pawPads:0.7,bellyShow:0.5,furTexture:0.3,roundness:1,bgEnabled:false,bgColor:"transparent",bgStyle:"none"};

export default function CatEditorV3(){
const[style,setStyle]=useState({...DEFAULT_STYLE});
const[breed,setBreed]=useState("domestic");
const[element,setElement]=useState("none");
const[expression,setExpr]=useState("happy");
const[pose,setPose]=useState("sitting");
const[genes,setGenes]=useState(()=>makeGenes(m32(42),"domestic","none"));
const[gallery,setGallery]=useState([]);
const[openPanels,setOpen]=useState({style:false,detail:false});
const[showExport,setShowExport]=useState(false);

const up=(k,v)=>setStyle(s=>({...s,[k]:v}));
const togglePanel=k=>setOpen(o=>({...o,[k]:!o[k]}));

const rollCat=()=>{
const rng=m32(Date.now());
setGenes(makeGenes(rng,breed,element));
};

const svg=useMemo(()=>renderCatSVG({genes,breed,element,expression,pose,style}),[genes,breed,element,expression,pose,style]);

const rarityInfo=RARITY_INFO[genes.rarity]||RARITY_INFO.common;

return(<div style={{width:"100%",maxWidth:480,minHeight:"100vh",margin:"0 auto",background:"linear-gradient(180deg,#0B1120 0%,#0F172A 50%,#1A1530 100%)",fontFamily:"'Nunito',sans-serif",display:"flex",flexDirection:"column"}}>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet"/>

<div style={{padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid #1E293B"}}>
<div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:18}}>🐾</span><span style={{fontFamily:"'Fredoka',sans-serif",fontSize:16,fontWeight:700,color:"#F8FAFC"}}>CAT CALL V3</span></div>
<button onClick={()=>setShowExport(!showExport)} style={{background:showExport?"#6366F1":"#1E293B",border:"1px solid #334155",borderRadius:8,padding:"3px 8px",color:"#F8FAFC",fontSize:10,cursor:"pointer",fontWeight:600}}>{showExport?"← Back":"{ }"}</button>
</div>

<div style={{flex:1,padding:"8px 12px",display:"flex",flexDirection:"column",gap:6,overflowY:"auto"}}>
{showExport?(<pre style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:12,padding:14,fontSize:10,color:"#CBD5E1",overflow:"auto",flex:1,whiteSpace:"pre-wrap",margin:0}}>{JSON.stringify({style,breed,element},null,2)}</pre>):(<>
<div style={{background:"transparent",borderRadius:16,padding:4,display:"flex",justifyContent:"center",alignItems:"center",minHeight:260,position:"relative"}}>
<div style={{width:260,height:260}} dangerouslySetInnerHTML={{__html:svg}}/>
<div style={{position:"absolute",top:8,right:8,background:"#0F172ACC",border:`1px solid ${rarityInfo.color}`,borderRadius:8,padding:"3px 8px",display:"flex",alignItems:"center",gap:4}}>
<div style={{width:6,height:6,borderRadius:3,background:rarityInfo.color}}/>
<span style={{fontSize:10,color:rarityInfo.color,fontWeight:700}}>{rarityInfo.label}</span>
</div>
<div style={{position:"absolute",top:8,left:8,background:"#0F172ACC",borderRadius:8,padding:"3px 8px"}}>
<span style={{fontSize:12}}>{genes.gender==="female"?"♀":"♂"}</span>
<span style={{fontSize:10,color:"#94A3B8",marginLeft:2}}>{genes.gender}</span>
</div>
<div style={{position:"absolute",bottom:4,left:"50%",transform:"translateX(-50%)",background:"#0F172ACC",borderRadius:8,padding:"2px 10px",display:"flex",gap:6,alignItems:"center"}}>
<span style={{fontSize:10,color:"#CBD5E1",fontWeight:600}}>{BREEDS[breed].name}</span>
{element!=="none"&&<span style={{fontSize:10,color:ELEMENTS[element].aura,fontWeight:700}}>⚡ {ELEMENTS[element].name}</span>}
<span style={{fontSize:9,color:"#64748B"}}>{genes.furName} · {genes.facePattern!=="none"?genes.facePattern:genes.pattern}</span>
</div>
</div>

<div style={{display:"flex",gap:6}}>
<button onClick={rollCat} style={{flex:1,padding:8,borderRadius:8,border:"none",cursor:"pointer",fontFamily:"'Fredoka',sans-serif",fontSize:12,fontWeight:600,color:"#FFF",background:"linear-gradient(135deg,#6366F1,#8B5CF6)"}}>🎲 New</button>
<button onClick={()=>{setGallery(g=>[{svg,genes:{...genes},breed,element,expression,pose,style:{...style},id:Date.now()},...g].slice(0,30));}} style={{flex:1,padding:8,borderRadius:8,border:"none",cursor:"pointer",fontFamily:"'Fredoka',sans-serif",fontSize:12,fontWeight:600,color:"#FFF",background:"linear-gradient(135deg,#10B981,#059669)"}}>📸 Save</button>
<button onClick={()=>{setGenes(prev=>({...prev,gender:prev.gender==="male"?"female":"male"}));}} style={{padding:8,borderRadius:8,border:"1px solid #334155",background:"#0F172A",cursor:"pointer",fontSize:12}}>{genes.gender==="female"?"♀":"♂"}</button>
</div>

<div><p style={{fontSize:10,color:"#64748B",margin:"0 0 4px",fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>Breed</p>
<div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{Object.entries(BREEDS).map(([k,b])=>(<Pill key={k} label={b.name} active={breed===k} color={RARITY_INFO[b.rarity]?.color} onClick={()=>{setBreed(k);const rng=m32(Date.now());setGenes(makeGenes(rng,k,element));}}/>))}</div></div>

<div><p style={{fontSize:10,color:"#64748B",margin:"0 0 4px",fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>Element</p>
<div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{Object.entries(ELEMENTS).map(([k,e])=>(<Pill key={k} label={e.name} active={element===k} color={e.aura||"#818CF8"} onClick={()=>{setElement(k);const rng=m32(Date.now()+1);setGenes(makeGenes(rng,breed,k));}}/>))}</div></div>

<div><p style={{fontSize:10,color:"#64748B",margin:"0 0 4px",fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>Expression</p>
<div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{Object.entries(EXPRS).map(([k,e])=>(<Pill key={k} label={e.name} active={expression===k} onClick={()=>setExpr(k)}/>))}</div></div>

<div><p style={{fontSize:10,color:"#64748B",margin:"0 0 4px",fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>Pose</p>
<div style={{display:"flex",gap:4}}>{[["sitting","Sitting"],["standR","Stand →"],["standL","← Stand"],["laying","Laying"]].map(([k,l])=>(<Pill key={k} label={l} active={pose===k} onClick={()=>setPose(k)}/>))}</div></div>

<Section title="📐 Proportions" open={openPanels.style} toggle={()=>togglePanel("style")}>
{[{key:"bodyScale",label:"Body",min:0.5,max:1.3,step:0.05},{key:"headSize",label:"Head",min:0.6,max:1.5,step:0.05},{key:"headSquash",label:"Head W",min:0.8,max:1.3,step:0.05},{key:"earSize",label:"Ears",min:0.4,max:1.4,step:0.05},{key:"eyeSize",label:"Eyes",min:0.5,max:1.8,step:0.05},{key:"eyeSpacing",label:"Eye Sp",min:0.6,max:1.2,step:0.05},{key:"legLength",label:"Legs",min:0.3,max:1.3,step:0.05},{key:"legThickness",label:"Leg W",min:0.6,max:1.3,step:0.05},{key:"tailLength",label:"Tail",min:0.3,max:1.4,step:0.05},{key:"tailCurl",label:"Tail W",min:0.4,max:1.5,step:0.05}].map(sl=><Slider key={sl.key} {...sl} value={style[sl.key]} onChange={v=>up(sl.key,v)}/>)}
</Section>

<Section title="✨ Details" open={openPanels.detail} toggle={()=>togglePanel("detail")}>
{[{key:"lineWeight",label:"Outline",min:0,max:3.5,step:0.1},{key:"noseSize",label:"Nose",min:0.4,max:1.3,step:0.05},{key:"cheekFluff",label:"Cheeks",min:0,max:1.2,step:0.1},{key:"earTufts",label:"Ear Tufts",min:0,max:1.2,step:0.1},{key:"blush",label:"Blush",min:0,max:1,step:0.1},{key:"whiskers",label:"Whiskers",min:0,max:1.2,step:0.1},{key:"pawPads",label:"Paw Beans",min:0,max:1,step:0.1},{key:"bellyShow",label:"Belly",min:0,max:1,step:0.1},{key:"shadow",label:"Shadow",min:0,max:1,step:0.1},{key:"patternIntensity",label:"Pattern",min:0,max:1.5,step:0.1}].map(sl=><Slider key={sl.key} {...sl} value={style[sl.key]} onChange={v=>up(sl.key,v)}/>)}
</Section>

{gallery.length>0&&(<div>
<p style={{fontSize:10,color:"#64748B",margin:"0 0 4px",fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>Gallery ({gallery.length})</p>
<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5}}>
{gallery.map(g=>(<div key={g.id} onClick={()=>{setGenes({...g.genes});setBreed(g.breed);setElement(g.element);setExpr(g.expression);setPose(g.pose);setStyle({...g.style});}} style={{background:"#080C18",borderRadius:8,padding:2,border:`1px solid ${RARITY_INFO[g.genes.rarity]?.color||"#1E293B"}33`,cursor:"pointer",aspectRatio:"1",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
<div style={{width:"100%",height:"100%"}} dangerouslySetInnerHTML={{__html:g.svg}}/>
<div style={{position:"absolute",bottom:2,right:2,width:5,height:5,borderRadius:3,background:RARITY_INFO[g.genes.rarity]?.color||"#64748B"}}/>
</div>))}
</div></div>)}
</>)}
</div>

<style>{`
input[type="range"]::-webkit-slider-thumb{appearance:none;width:12px;height:12px;border-radius:50%;background:#818CF8;border:2px solid #A5B4FC;cursor:pointer}
input[type="range"]::-moz-range-thumb{width:12px;height:12px;border-radius:50%;background:#818CF8;border:2px solid #A5B4FC;cursor:pointer}
button:active{transform:scale(0.96)!important}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#334155;border-radius:4px}
@keyframes elPulse{0%,100%{opacity:0.15;transform:scale(1)}50%{opacity:0.3;transform:scale(1.05)}}
@keyframes elFlame{0%{transform:translateY(0) scale(1);opacity:0.5}50%{transform:translateY(-8px) scale(1.2);opacity:0.8}100%{transform:translateY(-16px) scale(0.5);opacity:0}}
@keyframes elTwinkle{0%,100%{opacity:0.15}50%{opacity:0.8}}
@keyframes elFlicker{0%,100%{opacity:0.7}30%{opacity:0.2}60%{opacity:0.9}80%{opacity:0.3}}
@keyframes elShimmer{0%{fill-opacity:0.6}50%{fill-opacity:1}100%{fill-opacity:0.6}}
.el-pulse{animation:elPulse 2.5s ease-in-out infinite}
.el-flame{animation:elFlame 1.2s ease-out infinite}
.el-twinkle{animation:elTwinkle 1.8s ease-in-out infinite}
.el-flicker{animation:elFlicker 0.8s linear infinite}
.el-shimmer{animation:elShimmer 2s ease-in-out infinite}
`}</style>
</div>);
}
