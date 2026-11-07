'use strict';
/* ============================================================
   ระบบเสริม: สัตว์เลี้ยง · ภารกิจประจำวัน · ความสำเร็จ
             · สำรอง/ย้ายเซฟ · ต่อสู้อัตโนมัติ + ความเร็ว · ติดตั้งแอป
   (ฟังก์ชันในไฟล์นี้ถูกเรียกจาก game.js)
   ============================================================ */

/* ---------------- สัตว์เลี้ยง ---------------- */
/* ได้จากบอสแต่ละด่าน (โอกาส 50% ต่อการล้มบอส จนกว่าจะได้) · เลเวลสูงสุด 10 */
const PETS = [
  { id: 'slime', zone: 'forest', n: 'น้องสไลม์', art: 'สไลม์พิษ', kind: 'heal', desc: (p) => `ฟื้น HP ${p}% ทุกเทิร์น`, pow: (lv) => 1.6 + lv * 0.26 },
  { id: 'bat', zone: 'cave', n: 'แมงมุมผลึก', art: 'แมงมุมคริสตัล', kind: 'drain', desc: (p) => `กัด ${p}% ของพลังโจมตี และดูดเลือดคืน`, pow: (lv) => 12 + lv * 2 },
  { id: 'scorp', zone: 'desert', n: 'แมงป่องจิ๋ว', art: 'แมงป่องยักษ์', kind: 'poison', desc: (p) => `ต่อย ${p}% + ทำให้ติดพิษ`, pow: (lv) => 15 + lv * 2.5 },
  { id: 'dragon', zone: 'volcano', n: 'มังกรน้อย', art: 'ซาลาแมนเดอร์', kind: 'fire', desc: (p) => `พ่นไฟ ${p}% ไม่สนเกราะ`, pow: (lv) => 28 + lv * 4 },
  { id: 'frog', zone: 'swamp', n: 'กบเขียว', art: 'มนุษย์คางคก', kind: 'mana', desc: (p) => `ฟื้น MP ${p}% ทุกเทิร์น`, pow: (lv) => 2.5 + lv * 0.35 },
  { id: 'penguin', zone: 'ice', n: 'ฮูกน้อย', art: 'นกฮูกหิมะ', kind: 'guard', desc: (p) => `ลดดาเมจที่ได้รับ ${p}% (ติดตัว)`, pow: (lv) => 4 + lv * 0.6 },
  { id: 'crab', zone: 'sea', n: 'หมึกน้อย', art: 'หมึกยักษ์', kind: 'attack', desc: (p) => `ฟาดหนวด ${p}% ของพลังโจมตี`, pow: (lv) => 28 + lv * 3.5 },
  { id: 'crow', zone: 'sky', n: 'ฮาร์ปี้น้อย', art: 'ฮาร์ปี้', kind: 'thunder', desc: (p) => `สายฟ้า ${p}% + โอกาส 15% ทำให้มึน`, pow: (lv) => 22 + lv * 3 },
  { id: 'ghost', zone: 'spirit', n: 'ผีน้อย', art: 'วิญญาณร้าย', kind: 'dodge', desc: (p) => `โอกาส ${p}% หลบการโจมตี (ติดตัว)`, pow: (lv) => 3 + lv * 0.5 },
  { id: 'wolf', hunter: true, n: 'หมาป่าเทา', img: 'pets/wolf.webp', kind: 'bite', desc: (p) => `ขย้ำ ${p}% ของพลังโจมตี (คู่หูนักล่า)`, pow: (lv) => 36 + lv * 4.5 },
  { id: 'eagle', hunter: true, n: 'อินทรีทอง', img: 'pets/eagle.webp', kind: 'dive', desc: (p) => `โฉบ ${p}% คริง่าย (คู่หูนักล่า)`, pow: (lv) => 30 + lv * 4 },
  { id: 'imp', zone: 'castle', n: 'ปีศาจจิ๋ว', art: 'ปีศาจ', kind: 'crit', desc: (p) => `แทงสามง่าม ${p}% (คริง่าย)`, pow: (lv) => 35 + lv * 4.5 },
];
const PET_MAX_LV = 10;
const petDef = (id) => PETS.find((p) => p.id === id);
const petExpNeed = (lv) => 8 + lv * 6;
const isHunter = () => !!S && S.cls === 'archer' && !!S.adv;
const petUsable = (d) => !d.hunter || isHunter();
const curPet = () => (S && S.pet && petUsable(petDef(S.pet) || {}) ? S.pets.find((p) => p.id === S.pet) : null);
/* นักล่าสายลมได้หมาป่ากับอินทรีเป็นคู่หู */
function grantHunterPets(s) {
  if (!(s.cls === 'archer' && s.adv)) return;
  for (const id of ['wolf', 'eagle']) if (!s.pets.some((p) => p.id === id)) s.pets.push({ id, lv: 1, exp: 0 });
}
const petPow = (pet) => Math.round(petDef(pet.id).pow(pet.lv) * 10) / 10;
const petSVG = (id, size) => { const d = petDef(id); return d.img ? `<img class="pet-img" src="${d.img}" alt="${d.n}" style="height:${size}px">` : monsterSVG(d.art, size); };

/* สัตว์เลี้ยงลงมือหลังผู้เล่น (ชนิดติดตัว guard/dodge ไม่ลงมือ) */
function petAct(st) {
  const pet = curPet(); if (!pet || !B || B.result || B.e.hp <= 0) return;
  const d = petDef(pet.id), p = petPow(pet) / 100, e = B.e;
  const hit = (mult, opt = {}) => { const r = calcDmg(st.atk, e.def, mult, { crit: opt.crit || 5, ignoreDef: opt.ignoreDef }); e.hp = Math.max(0, e.hp - r.dmg); return r; };
  switch (d.kind) {
    case 'heal': { const a = Math.min(Math.round(st.hp * p), st.hp - S.hp); if (a <= 0) return; S.hp += a; log(`🐾 ${d.n} ฟื้น HP ${fmt(a)}`); ev({ a: 'pet', kind: 'heal', text: `+${fmt(a)}` }); break; }
    case 'mana': { const a = Math.min(Math.round(st.mp * p), st.mp - S.mp); if (a <= 0) return; S.mp += a; log(`🐾 ${d.n} ฟื้น MP ${fmt(a)}`); ev({ a: 'pet', kind: 'mana', text: `+${fmt(a)} MP` }); break; }
    case 'drain': { const r = hit(p); const a = Math.min(Math.round(r.dmg * 0.35), st.hp - S.hp); S.hp += Math.max(0, a); log(`🐾 ${d.n} กัด ${fmt(r.dmg)} ดาเมจ`); ev({ a: 'pet', kind: 'hit', hits: [r] }); break; }
    case 'poison': { const r = hit(p); if (!B.poison) { B.poison = 3; B.poisonDmg = Math.round(st.atk * 0.35 + e.maxHp * 0.015); } log(`🐾 ${d.n} ต่อย ${fmt(r.dmg)} ดาเมจ`); ev({ a: 'pet', kind: 'poison', hits: [r] }); break; }
    case 'fire': { const r = hit(p, { ignoreDef: true }); log(`🐾 ${d.n} พ่นไฟ ${fmt(r.dmg)} ดาเมจ`); ev({ a: 'pet', kind: 'fire', hits: [r] }); break; }
    case 'attack': { const r = hit(p); log(`🐾 ${d.n} โจมตี ${fmt(r.dmg)} ดาเมจ`); ev({ a: 'pet', kind: 'hit', hits: [r] }); break; }
    case 'thunder': {
      const r = hit(p); log(`🐾 ${d.n} สายฟ้า ${fmt(r.dmg)} ดาเมจ`); ev({ a: 'pet', kind: 'thunder', hits: [r] });
      if (e.hp > 0 && Math.random() < 0.15 && !(B.isBoss && Math.random() < 0.5)) { B.stun = 1; B.charging = false; log(`💫 ${e.n} มึน!`); ev({ a: 'stun', text: 'มึน' }); }
      break;
    }
    case 'bite': { const r = hit(p); log(`🐾 ${d.n} ขย้ำ ${fmt(r.dmg)} ดาเมจ`); ev({ a: 'pet', kind: 'hit', hits: [r] }); break; }
    case 'dive': { const r = hit(p, { crit: 40 }); log(`🐾 ${d.n} โฉบ ${fmt(r.dmg)} ดาเมจ${r.crit ? ' คริ!' : ''}`); ev({ a: 'pet', kind: 'hit', hits: [r] }); break; }
    case 'crit': { const r = hit(p, { crit: 45 }); log(`🐾 ${d.n} แทง ${fmt(r.dmg)} ดาเมจ${r.crit ? ' คริ!' : ''}`); ev({ a: 'pet', kind: 'hit', hits: [r] }); break; }
    default: return;
  }
}
const petGuard = () => { const p = curPet(); return p && petDef(p.id).kind === 'guard' ? petPow(p) / 100 : 0; };
const petDodge = () => { const p = curPet(); return p && petDef(p.id).kind === 'dodge' ? petPow(p) / 100 : 0; };

function petGainExp(n) {
  const pet = curPet(); if (!pet || pet.lv >= PET_MAX_LV) return false;
  pet.exp += n;
  let up = false;
  while (pet.lv < PET_MAX_LV && pet.exp >= petExpNeed(pet.lv)) { pet.exp -= petExpNeed(pet.lv); pet.lv++; up = true; }
  return up;
}

function renderPets() {
  const owned = S.pets.length;
  let html = `<div class="row between"><h2>🐾 สัตว์เลี้ยง</h2><button class="small" data-a="go" data-v="town">← กลับ</button></div>
    <div class="muted" style="font-size:14px;margin-bottom:10px">มีแล้ว ${owned}/${PETS.length} ตัว · ได้จากการล้มบอส (โอกาส 50%) · พาไปด้วยได้ 1 ตัว ได้ EXP ทุกครั้งที่ชนะ</div>`;
  html += `<div class="pet-grid">${[...PETS].sort((a, b) => (isHunter() ? (b.hunter ? 1 : 0) - (a.hunter ? 1 : 0) : 0)).map((d) => {
    const pet = S.pets.find((p) => p.id === d.id);
    const z = ZONES.find((x) => x.id === d.zone);
    if (d.hunter && !isHunter()) return `<div class="pet-card locked"><div class="pet-art">${petSVG(d.id, 64)}</div><b>${d.n}</b><div class="muted" style="font-size:12px">🔒 เฉพาะนักล่าสายลม (นักธนูเลื่อนขั้น)</div></div>`;
    if (!pet) return `<div class="pet-card locked"><div class="pet-art">${monsterSVG(d.art, 64)}</div><b>???</b><div class="muted" style="font-size:12px">ได้จากบอส ${z.boss[0]}</div></div>`;
    const on = S.pet === d.id;
    return `<div class="pet-card ${on ? 'on' : ''}">
      <div class="pet-art">${petSVG(d.id, 64)}</div>
      <b>${d.n}</b><div class="muted" style="font-size:12px">Lv.${pet.lv}${pet.lv < PET_MAX_LV ? ` · EXP ${pet.exp}/${petExpNeed(pet.lv)}` : ' (สูงสุด)'}</div>
      <div style="font-size:12px;margin:4px 0">${d.desc(petPow(pet))}</div>
      <button class="small ${on ? '' : 'primary'}" data-a="pet" data-v="${on ? '' : d.id}">${on ? 'พักผ่อน' : 'พาไปด้วย'}</button>
    </div>`;
  }).join('')}</div>`;
  return html;
}

/* ---------------- ภารกิจประจำวัน ---------------- */
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const QUEST_TYPES = {
  kill: { name: (n) => `ล่ามอนสเตอร์ ${n} ตัว`, track: 'kills', need: () => pick([15, 20, 25]) },
  zone: { name: (n, q) => `ล่ามอนสเตอร์ใน${ZONES[q.zi].name} ${n} ตัว`, track: (q) => `zk_${ZONES[q.zi].id}`, need: () => pick([8, 10, 12]) },
  boss: { name: (n) => `ล้มบอส ${n} ตัว`, track: 'bossKills', need: () => pick([1, 2]) },
  skill: { name: (n) => `ใช้สกิล ${n} ครั้ง`, track: 'skills', need: () => pick([15, 20, 30]) },
  forge: { name: (n) => `ตีบวก ${n} ครั้ง`, track: 'forges', need: () => pick([3, 5]) },
  crit: { name: (n) => `โจมตีคริติคอล ${n} ครั้ง`, track: 'crits', need: () => pick([10, 15, 20]) },
};
const trackKey = (q) => { const t = QUEST_TYPES[q.type].track; return typeof t === 'function' ? t(q) : t; };
const trackVal = (k) => (S.track[k] || 0);
function track(k, n = 1) { if (S && S.track) S.track[k] = (S.track[k] || 0) + n; }

function ensureQuests() {
  const day = todayKey();
  if (S.quests && S.quests.day === day) return;
  let top = 0; ZONES.forEach((z, i) => { if (zoneUnlocked(i)) top = i; });
  const types = Object.keys(QUEST_TYPES).sort(() => Math.random() - 0.5).slice(0, 3);
  S.quests = {
    day, bonus: false,
    list: types.map((type) => {
      const q = { type, zi: top, claimed: false };
      q.need = QUEST_TYPES[type].need();
      q.start = trackVal(trackKey(q));
      q.gold = Math.round((40 + S.lv * 12) * (1 + q.need / 20) * DIFFS[S.diff].reward);
      q.bonus = pick(['charm', 'elixir', 'hp_l', 'mp_s']);
      return q;
    }),
  };
  save();
}
const questProg = (q) => Math.min(q.need, trackVal(trackKey(q)) - q.start);
const questDone = (q) => questProg(q) >= q.need;
const bonusName = { charm: '🧿 ยันต์คุ้มครอง', elixir: '🌟 น้ำอมฤต', hp_l: '🍷 ยาแดงใหญ่ ×2', mp_s: '💧 ยาฟ้า ×3' };
function giveBonus(b) {
  if (b === 'charm') S.charms++;
  else if (b === 'elixir') S.pots.elixir++;
  else if (b === 'hp_l') S.pots.hp_l += 2;
  else if (b === 'mp_s') S.pots.mp_s += 3;
}

/* ---------------- ความสำเร็จ ---------------- */
const ACH = [
  { id: 'k10', n: 'นักล่ามือใหม่', d: 'ล่ามอนสเตอร์ 10 ตัว', v: () => trackVal('kills'), need: 10, gold: 100 },
  { id: 'k100', n: 'นักล่าตัวจริง', d: 'ล่ามอนสเตอร์ 100 ตัว', v: () => trackVal('kills'), need: 100, gold: 800, charm: 1 },
  { id: 'k500', n: 'ผู้กวาดล้าง', d: 'ล่ามอนสเตอร์ 500 ตัว', v: () => trackVal('kills'), need: 500, gold: 5000, charm: 2 },
  { id: 'k2000', n: 'ตำนานนักล่า', d: 'ล่ามอนสเตอร์ 2,000 ตัว', v: () => trackVal('kills'), need: 2000, gold: 30000, charm: 5 },
  { id: 'b1', n: 'ล้มบอสตัวแรก', d: 'ล้มบอสได้ 1 ตัว', v: () => trackVal('bossKills'), need: 1, gold: 200 },
  { id: 'b10', n: 'ผู้พิชิตบอส', d: 'ล้มบอส 10 ครั้ง', v: () => trackVal('bossKills'), need: 10, gold: 2000, charm: 1 },
  { id: 'b50', n: 'เพชฌฆาตบอส', d: 'ล้มบอส 50 ครั้ง', v: () => trackVal('bossKills'), need: 50, gold: 15000, charm: 3 },
  { id: 'cN', n: 'ผู้กล้าแห่งแผ่นดิน', d: 'จบเกมโหมดปกติ', v: () => (S.clearedDiffs.normal ? 1 : 0), need: 1, gold: 5000, elixir: 3 },
  { id: 'cH', n: 'ผู้กล้าผู้ไม่ย่อท้อ', d: 'จบเกมโหมดยาก', v: () => (S.clearedDiffs.hard ? 1 : 0), need: 1, gold: 30000, charm: 5 },
  { id: 'cA', n: 'ตำนานที่แท้จริง', d: 'จบเกมโหมดขั้นสูง', v: () => (S.clearedDiffs.advanced ? 1 : 0), need: 1, gold: 100000, charm: 10 },
  { id: 'cN', n: 'ผู้พิชิตฝันร้าย', d: 'จบเกมโหมดฝันร้าย', v: () => (S.clearedDiffs.nightmare ? 1 : 0), need: 1, gold: 300000, charm: 20 },
  { id: 'l10', n: 'เติบโต', d: 'ถึง Lv.10', v: () => S.lv, need: 10, gold: 300 },
  { id: 'l30', n: 'นักรบเก๋า', d: 'ถึง Lv.30', v: () => S.lv, need: 30, gold: 3000 },
  { id: 'l51', n: 'สองมือสองอาวุธ', d: 'ถึง Lv.51', v: () => S.lv, need: 51, gold: 10000, charm: 2 },
  { id: 'adv', n: 'เลื่อนขั้นอาชีพ', d: `เลื่อนขั้นเป็นคลาสขั้นสูง (Lv.70)`, v: () => (S.adv ? 1 : 0), need: 1, gold: 20000, charm: 3 },
  { id: 'l80', n: 'ยอดฝีมือ', d: 'ถึง Lv.80', v: () => S.lv, need: 80, gold: 40000, charm: 4 },
  { id: 'f7', n: 'ช่างฝึกหัด', d: 'ตีบวกถึง +7', v: () => trackVal('forgeBest'), need: 7, gold: 1000 },
  { id: 'f10', n: 'ช่างฝีมือ', d: 'ตีบวกถึง +10', v: () => trackVal('forgeBest'), need: 10, gold: 5000, charm: 2 },
  { id: 'f15', n: 'ปรมาจารย์ช่าง', d: 'ตีบวกถึง +15', v: () => trackVal('forgeBest'), need: 15, gold: 50000, charm: 5 },
  { id: 'i50', n: 'นักสะสม', d: 'สะสมไอเทม 50 แบบ', v: () => collectionCount(), need: 50, gold: 3000 },
  { id: 'i100', n: 'พิพิธภัณฑ์เคลื่อนที่', d: 'สะสมไอเทม 100 แบบ', v: () => collectionCount(), need: 100, gold: 20000, charm: 3 },
  { id: 'p1', n: 'เพื่อนคู่ใจ', d: 'ได้สัตว์เลี้ยงตัวแรก', v: () => S.pets.length, need: 1, gold: 500 },
  { id: 'p5', n: 'คนรักสัตว์', d: 'มีสัตว์เลี้ยง 5 ตัว', v: () => S.pets.length, need: 5, gold: 5000, charm: 1 },
  { id: 'p10', n: 'ราชาแห่งสัตว์', d: 'มีสัตว์เลี้ยงครบ 10 ตัว', v: () => S.pets.length, need: 10, gold: 30000, charm: 5 },
  { id: 'pmax', n: 'เลี้ยงจนโต', d: 'สัตว์เลี้ยงถึง Lv.10', v: () => Math.max(0, ...S.pets.map((p) => p.lv)), need: 10, gold: 8000 },
  { id: 's100', n: 'จอมเวทย์มนตร์', d: 'ใช้สกิล 100 ครั้ง', v: () => trackVal('skills'), need: 100, gold: 1500 },
  { id: 'sk5', n: 'ฝึกฝนจนชำนาญ', d: 'สกิลใดก็ได้ถึง Lv.5', v: () => Math.max(1, ...Object.values(S.skillLv || {}).map((r) => r.lv)), need: 5, gold: 3000 },
  { id: 'sk10', n: 'ปรมาจารย์สกิล', d: 'สกิลใดก็ได้ถึง Lv.10', v: () => Math.max(1, ...Object.values(S.skillLv || {}).map((r) => r.lv)), need: 10, gold: 15000, charm: 3 },
  { id: 'q10', n: 'คนขยัน', d: 'ทำภารกิจประจำวัน 10 อย่าง', v: () => trackVal('questsDone'), need: 10, gold: 4000, charm: 2 },
];
const achProg = (a) => Math.min(a.need, a.v() || 0);
const achReady = (a) => !S.ach[a.id] && achProg(a) >= a.need;
const achRewardText = (a) => [`💰 ${fmt(a.gold)}`, a.charm ? `🧿 ×${a.charm}` : '', a.elixir ? `🌟 ×${a.elixir}` : ''].filter(Boolean).join(' · ');
const claimable = () => (S ? (S.quests ? S.quests.list.filter((q) => questDone(q) && !q.claimed).length + (allQuestsClaimed() && !S.quests.bonus ? 1 : 0) : 0) + ACH.filter(achReady).length : 0);
const allQuestsClaimed = () => S.quests && S.quests.list.every((q) => q.claimed);

let questTab = 'daily';
function renderQuests() {
  ensureQuests();
  const tab = (id, n) => `<button class="${questTab === id ? 'on' : ''}" data-a="qtab" data-v="${id}">${n}</button>`;
  let html = `<div class="row between"><h2>📋 ภารกิจ</h2><button class="small" data-a="go" data-v="town">← กลับ</button></div>
    <div class="tabs">${tab('daily', 'ประจำวัน')}${tab('ach', `ความสำเร็จ ${Object.keys(S.ach).length}/${ACH.length}`)}</div>`;
  if (questTab === 'daily') {
    html += `<div class="muted" style="font-size:13px;margin-bottom:8px">ภารกิจใหม่ทุกวัน (เที่ยงคืน) · ทำครบ 3 อย่างรับหีบโบนัส</div>`;
    html += S.quests.list.map((q, i) => {
      const pg = questProg(q), done = pg >= q.need;
      return `<div class="item quest ${q.claimed ? 'claimed' : done ? 'ready' : ''}">
        <span class="ico">${q.claimed ? '✅' : done ? '🎁' : { kill: '⚔️', zone: '🗺️', boss: '👑', skill: '✨', forge: '🔨', crit: '💥' }[q.type]}</span>
        <div class="info"><div class="nm">${QUEST_TYPES[q.type].name(q.need, q)}</div>
          ${bar('exp', pg, q.need, `${pg}/${q.need}`)}
          <div class="st">รางวัล 💰 ${fmt(q.gold)} · ${bonusName[q.bonus]}</div></div>
        ${q.claimed ? '' : `<button class="small ${done ? 'primary' : ''}" data-a="qclaim" data-v="${i}" ${done ? '' : 'disabled'}>รับ</button>`}
      </div>`;
    }).join('');
    const all = allQuestsClaimed();
    html += `<div class="item quest ${S.quests.bonus ? 'claimed' : all ? 'ready' : ''}"><span class="ico">🎁</span>
      <div class="info"><div class="nm">หีบโบนัสประจำวัน</div><div class="st">อุปกรณ์ระดับหายากขึ้นไป 1 ชิ้น + ยันต์คุ้มครอง</div></div>
      ${S.quests.bonus ? '<span class="tag">รับแล้ว</span>' : `<button class="small ${all ? 'primary' : ''}" data-a="qbonus" ${all ? '' : 'disabled'}>รับ</button>`}</div>`;
  } else {
    const list = [...ACH].sort((a, b) => (achReady(b) - achReady(a)) || (!!S.ach[a.id] - !!S.ach[b.id]));
    html += list.map((a) => {
      const pg = achProg(a), got = !!S.ach[a.id], ready = achReady(a);
      return `<div class="item quest ${got ? 'claimed' : ready ? 'ready' : ''}"><span class="ico">${got ? '🏆' : ready ? '🎁' : '🔒'}</span>
        <div class="info"><div class="nm">${a.n}</div><div class="st">${a.d}</div>
          ${got ? '' : bar('exp', pg, a.need, `${fmt(pg)}/${fmt(a.need)}`)}
          <div class="st">${achRewardText(a)}</div></div>
        ${got ? '' : `<button class="small ${ready ? 'primary' : ''}" data-a="aclaim" data-v="${a.id}" ${ready ? '' : 'disabled'}>รับ</button>`}</div>`;
    }).join('');
  }
  return html;
}

/* ---------------- สำรอง / ย้ายเซฟ ---------------- */
const BACKUP_KEY = 'thai-rpg-backup';
const CODE_PREFIX = 'TRPG1:';
function exportCode() {
  const json = JSON.stringify(S);
  return CODE_PREFIX + btoa(unescape(encodeURIComponent(json)));
}
function parseCode(code) {
  code = (code || '').trim().replace(/\s+/g, '');
  if (code.startsWith(CODE_PREFIX)) code = code.slice(CODE_PREFIX.length);
  const json = decodeURIComponent(escape(atob(code)));
  const s = JSON.parse(json);
  if (!s || !s.cls || !s.equip || !CLASSES[s.cls]) throw new Error('bad');
  return s;
}
function autoBackup() {
  if (!S) return;
  try {
    const prev = JSON.parse(localStorage.getItem(BACKUP_KEY) || 'null');
    if (prev && Date.now() - prev.t < 10 * 60 * 1000) return; // ทุก 10 นาที
    localStorage.setItem(BACKUP_KEY, JSON.stringify({ t: Date.now(), lv: S.lv, name: S.name, data: S }));
  } catch (e) { /* ignore */ }
}
const readBackup = () => { try { return JSON.parse(localStorage.getItem(BACKUP_KEY) || 'null'); } catch (e) { return null; } };

function renderSave() {
  const bk = readBackup();
  let html = `<div class="row between"><h2>💾 เซฟ & ตั้งค่า</h2><button class="small" data-a="go" data-v="${S ? 'town' : 'title'}">← กลับ</button></div>`;
  if (S) {
    html += `<div class="card"><h3 style="margin-top:0">📤 ส่งออกเซฟ</h3>
      <div class="muted" style="font-size:13px">เก็บรหัสนี้ไว้ (เช่น ส่งเข้า LINE ตัวเอง) แล้วนำไปใส่ในเครื่องอื่นหรือตอนเซฟหายได้</div>
      <textarea id="savecode" readonly class="code">${exportCode()}</textarea>
      <div class="row"><button class="primary" style="flex:1" data-a="copysave">📋 คัดลอกรหัส</button><button style="flex:1" data-a="dlsave">⬇️ ดาวน์โหลดไฟล์</button></div></div>`;
  }
  html += `<div class="card"><h3 style="margin-top:0">📥 นำเข้าเซฟ</h3>
      <div class="muted" style="font-size:13px">วางรหัสเซฟ หรือเลือกไฟล์เซฟ — ตัวละครปัจจุบันจะถูกแทนที่</div>
      <textarea id="importcode" class="code" placeholder="วางรหัส TRPG1:..."></textarea>
      <div class="row"><button class="primary" style="flex:1" data-a="importsave">นำเข้า</button>
        <label class="filebtn" style="flex:1">📂 เลือกไฟล์<input type="file" id="importfile" accept=".txt,text/plain" hidden></label></div></div>`;
  if (bk) html += `<div class="card"><h3 style="margin-top:0">🕒 สำรองอัตโนมัติ</h3>
      <div class="muted" style="font-size:13px">${esc(bk.name)} Lv.${bk.lv} · ${new Date(bk.t).toLocaleString('th-TH')}</div>
      <button style="width:100%;margin-top:8px" data-a="restorebk">กู้คืนจากสำรองอัตโนมัติ</button></div>`;
  if (S) html += `<div class="card"><h3 style="margin-top:0">⚙️ ตั้งค่าการต่อสู้</h3>
      <div class="row between"><span>ความเร็วเริ่มต้น</span><div class="row">${[1, 2, 3].map((n) => `<button class="small ${S.settings.speed === n ? 'primary' : ''}" data-a="speed" data-v="${n}">x${n}</button>`).join('')}</div></div>
      <div class="row between" style="margin-top:8px"><span>ออโต้: ล่าต่อเนื่องหลังชนะ</span><button class="small ${S.settings.chain ? 'primary' : ''}" data-a="chain">${S.settings.chain ? 'เปิด' : 'ปิด'}</button></div>
      <div class="row between" style="margin-top:8px"><span>ออโต้: หยุดเมื่อ HP ต่ำกว่า</span><div class="row">${[30, 50, 70].map((n) => `<button class="small ${S.settings.stopHp === n ? 'primary' : ''}" data-a="stophp" data-v="${n}">${n}%</button>`).join('')}</div></div></div>`;
  return html;
}

function doImport(text) {
  let s;
  try { s = parseCode(text); } catch (e) { toast('❌ รหัสเซฟไม่ถูกต้อง'); return; }
  if (!confirm(`นำเข้าเซฟของ ${s.name} (Lv.${s.lv})? ตัวละครปัจจุบันจะถูกแทนที่`)) return;
  S = migrate(s); save(); B = null; view = 'town';
  toast(`✅ นำเข้าเซฟ ${s.name} สำเร็จ`); render();
}

/* ---------------- ต่อสู้อัตโนมัติ + ความเร็ว ---------------- */
let autoTimer = null;
const gameSpeed = () => (S && S.settings ? S.settings.speed : 1);
function stopAuto(msg) {
  clearTimeout(autoTimer); autoTimer = null;
  if (S && S.settings.auto) { S.settings.auto = false; save(); if (msg) toast(msg); }
}
function scheduleAuto() {
  clearTimeout(autoTimer); autoTimer = null;
  if (!S || !S.settings.auto || view !== 'battle' || !B) return;
  if (B.result) {
    if (B.result === 'win' && (!B.isBoss || B.tower) && S.settings.chain && !B.rewards.ending && !(B.tower && B.tower.floor >= TOWER_FLOORS)) {
      const st = stats();
      if (S.hp / st.hp * 100 < S.settings.stopHp) { stopAuto(`🤖 หยุดออโต้: HP ต่ำกว่า ${S.settings.stopHp}%`); render(); return; }
      const zi = B.zi, tw = B.tower;
      autoTimer = setTimeout(() => { if (S.settings.auto && view === 'battle' && B && B.result) { if (tw) startTower(tw.d, tw.floor + 1, tw.w); else startBattle(zi, false); } }, 1100 / gameSpeed());
    } else if (B.result === 'lose') stopAuto('🤖 หยุดออโต้: พ่ายแพ้');
    return;
  }
  if (busy) return;
  autoTimer = setTimeout(() => { if (S.settings.auto && view === 'battle' && B && !B.result && !busy) autoStep(); }, 420 / gameSpeed());
}

/* เลือกคำสั่งให้อัตโนมัติ */
function autoStep() {
  const st = stats();
  const can = (id) => S.loadout.includes(id) && SKILLS[id] && S.mp >= skillCost(id) && skillOpen(SKILLS[id]);
  const use = (id) => playerAct('skill', id);
  if (B.charging) {
    for (const id of ['bash', 'trap', 'timestop', 'shadowstep', 'evade', 'divineshield']) if (can(id)) return use(id);
    return playerAct('defend');
  }
  if (S.hp < st.hp * 0.38) {
    for (const id of ['lifebless', 'heal', 'holystrike', 'avatar', 'bloodlust']) if (can(id)) return use(id);
    const pk = ['hp_l', 'hp_s', 'elixir'].find((k) => S.pots[k]);
    if (pk) return playerAct('item', pk);
  }
  if (S.mp < st.mp * 0.2 && can('drain')) return use('drain');
  if (B.isBoss) {
    if (!B.manaShield && can('manashield') && S.hp < st.hp * 0.7) return use('manashield');
    if (!B.ironwall && can('ironwall') && S.hp < st.hp * 0.6) return use('ironwall');
    if (!B.divine && can('divineshield') && S.hp < st.hp * 0.7) return use('divineshield');
    if (!B.avatar && can('emperor')) return use('emperor');
    if (!B.manaShield && can('astral') && S.hp < st.hp * 0.8) return use('astral');
    if (!B.focus && can('godeye')) return use('godeye');
    if (!B.avatar && can('avatar')) return use('avatar');
    for (const [id, k] of [['warcry', 'atkUp'], ['berserk', 'berserk'], ['focus', 'focus']]) if (!B[k] && can(id)) return use(id);
  }
  if (!B.poison && can('poison') && B.isBoss) return use('poison');
  if (!B.slow && can('icebolt') && B.isBoss) return use('icebolt');
  for (const id of ['genesis', 'starfall', 'heavenblade', 'apocalypse', 'thousand', 'judgment', 'arcanenova', 'phoenix', 'holystrike', 'blizzard', 'windarrow', 'earthsplit', 'meteor', 'lightning', 'arrowstorm', 'snipe', 'whirl', 'slash', 'fireball', 'aimshot', 'volley']) if (can(id) && S.mp - skillCost(id) >= st.mp * 0.15) return use(id);
  return playerAct('attack');
}

function battleToolbar() {
  const a = S.settings.auto;
  return `<div class="btool">
    <button class="small ${a ? 'auto-on' : ''}" data-a="auto">🤖 ออโต้ ${a ? 'เปิด' : 'ปิด'}</button>
    <button class="small" data-a="speed" data-v="${(S.settings.speed % 3) + 1}">⏩ x${S.settings.speed}</button>
    <button class="small ${S.settings.chain ? 'on' : ''}" data-a="chain" title="ล่าต่อเนื่องหลังชนะ (ออโต้)">🔁 ${S.settings.chain ? 'ล่าต่อ' : 'ไม่ล่าต่อ'}</button>
  </div>`;
}

/* ---------------- ติดตั้งแอป (PWA) ---------------- */
let installPrompt = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installPrompt = e; if (typeof render === 'function' && (view === 'title' || view === 'town')) render(); });
  if ('serviceWorker' in navigator && /^https:|^http:\/\/localhost/.test(location.href)) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
}
const isStandalone = () => typeof window !== 'undefined' && (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
const installButton = () => (installPrompt && !isStandalone() ? '<button class="install-btn" data-a="install">📲 ติดตั้งเป็นแอปบนมือถือ</button>' : '');

/* ---------------- ค่าเริ่มต้น / เซฟเก่า ---------------- */
function migrateExtras(s) {
  if (!s.pets) s.pets = [];
  if (s.pet === undefined) s.pet = null;
  grantHunterPets(s);
  if (!s.track) s.track = { kills: s.wins || 0, bossKills: Object.values(s.prog || {}).reduce((a, p) => a + Object.values(p.bossWins || {}).reduce((x, y) => x + y, 0), 0) };
  if (!s.ach) s.ach = {};
  if (!s.settings) s.settings = {};
  s.settings = { auto: false, speed: 1, chain: true, stopHp: 30, ...s.settings, auto: false };
  return s;
}

/* ---------------- เหตุการณ์จากเกม ---------------- */
function onVictoryExtras(rewards) {
  const z = ZONES[B.zi];
  track('kills'); track(`zk_${z.id}`); track('gold', rewards.gold);
  if (B.isBoss) {
    track('bossKills');
    const d = PETS.find((p) => p.zone === z.id);
    if (d) {
      const have = S.pets.find((p) => p.id === d.id);
      if (!have && Math.random() < 0.5) {
        S.pets.push({ id: d.id, lv: 1, exp: 0 });
        if (!S.pet) S.pet = d.id;
        rewards.pet = d;
      } else if (have && have.lv < PET_MAX_LV) { have.exp += 10; while (have.lv < PET_MAX_LV && have.exp >= petExpNeed(have.lv)) { have.exp -= petExpNeed(have.lv); have.lv++; } }
    }
  }
  rewards.petUp = petGainExp(B.isBoss ? 4 : 1) ? curPet() : null;
}

function extrasResultHTML(r) {
  let h = '';
  if (r.pet) h += `<div class="new-skill pet-new"><span>${petSVG(r.pet.id, 40)}</span><span>🐾 ได้สัตว์เลี้ยงใหม่: <b>${r.pet.n}</b>!</span><button class="small" data-a="go" data-v="pets">ดู</button></div>`;
  if (r.petUp) h += `<div class="muted" style="margin-top:6px">🐾 ${petDef(r.petUp.id).n} เลเวลอัพเป็น Lv.${r.petUp.lv}!</div>`;
  return h;
}

/* กดปุ่มของระบบเสริม — คืน true ถ้าจัดการแล้ว */
function featureClick(a, v, el) {
  switch (a) {
    case 'pet': S.pet = v || null; save(); toast(v ? `🐾 พา ${petDef(v).n} ไปด้วย` : 'ให้สัตว์เลี้ยงพักผ่อน'); return true;
    case 'qtab': questTab = v; return true;
    case 'qclaim': {
      const q = S.quests.list[+v]; if (!q || q.claimed || !questDone(q)) return true;
      q.claimed = true; S.gold += q.gold; giveBonus(q.bonus); track('questsDone'); save();
      toast(`🎁 รับ 💰${fmt(q.gold)} + ${bonusName[q.bonus]}`); return true;
    }
    case 'qbonus': {
      if (!allQuestsClaimed() || S.quests.bonus) return true;
      S.quests.bonus = true; S.charms++;
      const d = D(); const it = makeGear(maxTier(), Math.max(1, d.minR), d.maxR); addItem(it); save();
      toast(`🎁 ได้ ${it.icon} ${it.name} (${rarityName(it.rarity)}) + 🧿`); return true;
    }
    case 'aclaim': {
      const ac = ACH.find((x) => x.id === v); if (!ac || !achReady(ac)) return true;
      S.ach[ac.id] = Date.now(); S.gold += ac.gold; S.charms += ac.charm || 0; S.pots.elixir += ac.elixir || 0; save();
      toast(`🏆 ${ac.n}! ได้ ${achRewardText(ac)}`); return true;
    }
    case 'copysave': {
      const t = document.getElementById('savecode'); const code = t.value;
      (navigator.clipboard ? navigator.clipboard.writeText(code) : Promise.reject()).then(() => toast('📋 คัดลอกรหัสเซฟแล้ว'), () => { t.select(); document.execCommand('copy'); toast('📋 คัดลอกรหัสเซฟแล้ว'); });
      return false;
    }
    case 'dlsave': {
      const blob = new Blob([exportCode()], { type: 'text/plain' });
      const link = document.createElement('a'); link.href = URL.createObjectURL(blob);
      link.download = `ตำนานผู้กล้า-${S.name}-Lv${S.lv}.txt`; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 2000);
      return false;
    }
    case 'importsave': doImport(document.getElementById('importcode').value); return false;
    case 'restorebk': { const bk = readBackup(); if (bk && confirm(`กู้คืน ${bk.name} Lv.${bk.lv}?`)) { S = migrate(bk.data); save(); view = 'town'; toast('✅ กู้คืนแล้ว'); return true; } return false; }
    case 'auto': S.settings.auto = !S.settings.auto; save(); toast(S.settings.auto ? '🤖 เปิดต่อสู้อัตโนมัติ' : '🤖 ปิดต่อสู้อัตโนมัติ'); return true;
    case 'speed': S.settings.speed = +v; save(); return true;
    case 'chain': S.settings.chain = !S.settings.chain; save(); return true;
    case 'stophp': S.settings.stopHp = +v; save(); return true;
    case 'install': if (installPrompt) { installPrompt.prompt(); installPrompt.userChoice.finally(() => { installPrompt = null; render(); }); } return false;
    default: return false;
  }
}

if (typeof document !== 'undefined') document.addEventListener('change', (ev) => {
  if (ev.target.id !== 'importfile' || !ev.target.files[0]) return;
  const r = new FileReader(); r.onload = () => doImport(String(r.result)); r.readAsText(ev.target.files[0]);
});
