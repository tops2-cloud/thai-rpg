'use strict';
/* ============================================================
   โหมดกิลด์นักล่า (เซฟแยกจากโหมดเนื้อเรื่อง: thai-rpg-hunter-v1)
   - แรงค์กิลด์ F → S: สะสมแต้มจากการล่าและภารกิจกิลด์ แรงค์สูงขึ้นเปิดด่านใหม่
   - ปราบมอนแล้วมีโอกาสที่ "วิญญาณอสูร" หลุดออกมา (บอส = แน่นอน)
     เลือกได้ 1 อย่าง: ดูดสกิลของมัน หรือ รับมันเป็นพวก (ได้ซ้ำ = เลเวลอัพ)
   - อาชีพลับ: ปลดล็อกจากเงื่อนไขที่ไม่บอกตรงๆ ใส่ได้ทีละ 1 อาชีพ
   ใช้ระบบต่อสู้/ด่าน/มอนสเตอร์เดิมทั้งหมด · ฟังก์ชันในไฟล์นี้ถูกเรียกจาก game.js
   (ห้ามใช้ค่าคงที่ของ game.js ตอนโหลดไฟล์ เพราะ game.js โหลดทีหลัง)
   ============================================================ */

const hm = () => !!S && S.mode === 'hunter';

/* ---------------- แรงค์กิลด์ ---------------- */
const HM_RANKS = [
  { r: 'F', n: 'มือใหม่', pts: 0, slots: 2, color: '#a79fc4' },
  { r: 'E', n: 'ฝึกหัด', pts: 25, slots: 2, color: '#8be04b' },
  { r: 'D', n: 'นักล่า', pts: 70, slots: 3, color: '#4ba3ff' },
  { r: 'C', n: 'นักล่าชำนาญ', pts: 150, slots: 3, color: '#2ee6c8' },
  { r: 'B', n: 'นักล่าระดับสูง', pts: 280, slots: 4, color: '#c06bff' },
  { r: 'A', n: 'ยอดนักล่า', pts: 460, slots: 4, color: '#ffad33' },
  { r: 'S', n: 'ตำนานนักล่า', pts: 750, slots: 5, color: '#ff5b8a' },
];
const HM_OFFER_CHANCE = 0.3; // มอนธรรมดา: โอกาสวิญญาณหลุด (บอส 100%)
const HM_SKILL_MAX = 10;

/* แรงค์ที่ต้องมีเพื่อเข้าด่าน: ทวีปแรก 2 ด่านต่อแรงค์ (F..B) · ทวีป 2 ครึ่งแรก A ครึ่งหลัง S */
function hmZoneRank(i) {
  const w = zoneWorld(ZONES[i]), k = worldZoneIdx(w).indexOf(i);
  return w === 'w1' ? Math.min(4, Math.floor(k / 2)) : k < 5 ? 5 : 6;
}
const hmZoneRankOk = (i) => hmZoneRank(i) <= S.hunter.rank;
const hmLockText = (i) => `🏛️ ต้องเป็นนักล่าแรงค์ ${HM_RANKS[hmZoneRank(i)].r} ก่อน (เลื่อนแรงค์ที่กิลด์)`;
const hmNext = () => HM_RANKS[S.hunter.rank + 1] || null;
const hmCanPromote = () => !!hmNext() && S.hunter.pts >= hmNext().pts;

/* ---------------- ธาตุของมอนสเตอร์ (ตามด่าน) ---------------- */
const HM_ELEM = {
  forest: { n: 'พฤกษา', i: '🌿', atk: 'หนามพฤกษา', pet: 'heal' },
  cave: { n: 'ปฐพี', i: '🪨', atk: 'ปฐพีแตก', pet: 'drain' },
  desert: { n: 'ผืนทราย', i: '🏜️', atk: 'กรงเล็บทราย', pet: 'crit' },
  volcano: { n: 'เพลิง', i: '🔥', atk: 'เปลวเพลิง', pet: 'fire' },
  swamp: { n: 'พิษ', i: '☠️', atk: 'พิษร้าย', pet: 'poison' },
  ice: { n: 'น้ำแข็ง', i: '❄️', atk: 'หอกเหมันต์', pet: 'guard' },
  sea: { n: 'สมุทร', i: '🌊', atk: 'คลื่นดูดกลืน', pet: 'attack' },
  sky: { n: 'อสนี', i: '⚡', atk: 'อสนีบาต', pet: 'thunder' },
  spirit: { n: 'วิญญาณ', i: '👻', atk: 'เงามรณะ', pet: 'dodge' },
  castle: { n: 'อสูร', i: '😈', atk: 'โทสะอสูร', pet: 'crit' },
};

/* ตารางมอนสเตอร์: ชื่อ → ด่าน ธาตุ ค่าพลัง (สร้างตอนใช้ครั้งแรก) */
let HM_MON = null;
function hmMon(name) {
  if (!HM_MON) {
    HM_MON = {};
    ZONES.forEach((z, zi) => {
      const el = z.scene || z.id;
      z.mobs.forEach((m) => { HM_MON[m[0]] = { n: m[0], i: m[1], zi, el, t: [m[2], m[3], m[4]], boss: false }; });
      for (const b of [z.boss, z.bossFinal]) if (b) HM_MON[b[0]] = { n: b[0], i: b[1], zi, el, t: [1.3, 1.3, 1.1], boss: true };
    });
  }
  return HM_MON[name] || null;
}

/* ---------------- อาชีพลับ ---------------- */
const hmSkillEls = () => Object.keys(S.hunter.skills).map((n) => (hmMon(n) || {}).el).filter(Boolean);
const hmAllies = () => S.pets.filter((p) => p.id.startsWith('m:')).map((p) => hmMon(p.id.slice(2))).filter(Boolean);
const HM_JOBS = [
  { id: 'flame', n: 'จอมเวทเพลิงอสูร', i: '🔥', bonus: 'สกิลอสูรธาตุเพลิงแรง ×1.6 · พลังโจมตี +10%',
    hint: 'ว่ากันว่าผู้ที่กลืนกินเปลวเพลิงของอสูรได้มากพอ จะได้ยินเสียงเรียกจากปล่องภูเขาไฟ...',
    ok: () => hmSkillEls().filter((e) => e === 'volcano').length >= 5 },
  { id: 'soul', n: 'ผู้คุมวิญญาณ', i: '👻', bonus: 'พวกอสูรแรงขึ้น ×1.6 · HP +10%',
    hint: 'ดวงวิญญาณจะยอมรับเฉพาะผู้ที่มีพวกพ้องจากดินแดนแห่งความตาย...',
    ok: () => hmAllies().filter((m) => m.el === 'spirit').length >= 3 },
  { id: 'devour', n: 'ผู้กลืนกินพลัง', i: '🌀', bonus: 'สกิลอสูรทุกแบบแรง ×1.25 · ใช้ MP น้อยลง 25% · ช่องสกิลอสูร +1',
    hint: 'ยิ่งกลืนกินพลังหลากหลายเท่าไร ร่างกายยิ่งเปลี่ยนไป...',
    ok: () => S.hunter.absorbed >= 25 && new Set(hmSkillEls()).size >= 5 },
  { id: 'beast', n: 'ราชันอสูร', i: '👑', bonus: 'ค่าพลังทั้งหมด +12% · พวกอสูรแรงขึ้น ×1.3',
    hint: 'มีเพียงนักล่าแรงค์สูงที่นำฝูงอสูรขนาดใหญ่ เท่านั้นที่อสูรจะยอมเรียกว่า "ราชา"...',
    ok: () => hmAllies().length >= 12 && S.hunter.rank >= 4 },
];
const hmJob = () => (S && S.hunter && S.hunter.job) || null;
function hmCheckJobs() {
  const fresh = HM_JOBS.filter((j) => !S.hunter.jobs[j.id] && j.ok());
  for (const j of fresh) {
    S.hunter.jobs[j.id] = true;
    if (!S.hunter.job) S.hunter.job = j.id;
    toast(`🔓 ปลดล็อกอาชีพลับ: ${j.i} ${j.n}!`);
  }
  return fresh;
}
function hmStatMods(s) {
  const j = hmJob();
  if (j === 'beast') for (const k of ['hp', 'mp', 'atk', 'def']) s[k] *= 1.12;
  if (j === 'flame') s.atk *= 1.1;
  if (j === 'soul') s.hp *= 1.1;
}
const hmSlots = () => HM_RANKS[S.hunter.rank].slots + (hmJob() === 'devour' ? 1 : 0);
const hmAllyMul = () => (hmJob() === 'soul' ? 1.6 : hmJob() === 'beast' ? 1.3 : 1);

/* ---------------- เซฟ ---------------- */
function hmMigrate(s) {
  s.hunter = { rank: 0, pts: 0, skills: {}, load: [], quests: [], jobs: {}, job: null, absorbed: 0, tamed: 0, tab: 'rank', ...(s.hunter || {}) };
  return s;
}

/* ---------------- สกิลอสูร ---------------- */
function hmSkillDef(name) {
  const m = hmMon(name); if (!m) return null;
  const E = HM_ELEM[m.el];
  const lv = (S.hunter.skills[name] || {}).lv || 1;
  const type = m.boss ? 'boss' : m.t[2] >= 1.3 ? 'guard' : m.t[0] >= 1.25 ? 'regen' : 'atk';
  const pow = (1 + 0.1 * (lv - 1)) * (hmJob() === 'flame' && m.el === 'volcano' ? 1.6 : 1) * (hmJob() === 'devour' ? 1.25 : 1);
  const mul = type === 'boss' ? 1.6 : 1;
  const P = (x) => Math.round(x * pow * mul * 100);
  const word = type === 'guard' ? `เกราะ${E.n}` : type === 'regen' ? `ฟื้นฟู${E.n}` : type === 'boss' ? `${E.atk}ราชัน` : E.atk;
  const atkDesc = {
    forest: `โจมตี ${P(1.5)}% + ฟื้น HP 8%`,
    cave: `โจมตี ${P(1.7)}% เจาะเกราะ 60%`,
    desert: `ฟัน 3 ครั้ง ครั้งละ ${P(0.7)}% (+25% คริ)`,
    volcano: `เพลิง ${P(2)}% ไม่สนเกราะ`,
    swamp: `โจมตี ${P(1.2)}% + พิษ 3 เทิร์น`,
    ice: `โจมตี ${P(1.5)}% + ศัตรูโจมตีเบาลง 30%`,
    sea: `โจมตี ${P(1.6)}% + ดูดเลือด 40%`,
    sky: `สายฟ้า ${P(1.7)}% + โอกาส 30% ทำให้มึน`,
    spirit: `เวทมืด ${P(1.5)}% ไม่สนเกราะ + ฟื้น MP 10%`,
    castle: `โจมตี ${P(2.6)}% แลกกับ HP 8%`,
  }[m.el];
  const desc = type === 'guard' ? `ป้องกัน +60% 3 เทิร์น + ฟื้น HP ${Math.round(10 * pow)}%`
    : type === 'regen' ? `ฟื้น HP ${Math.round(30 * pow)}%` : atkDesc;
  return { id: name, mon: name, icon: m.i, el: m.el, elIcon: E.i, type, lv, pow, mul, word, name: `${word} (${name})`, desc };
}
function hmCost(sk, st) {
  const pct = { atk: 0.13, guard: 0.11, regen: 0.14, boss: 0.2 }[sk.type];
  return Math.max(5, Math.round((st || stats()).mp * pct * (hmJob() === 'devour' ? 0.75 : 1)));
}

/* ใช้สกิลอสูรในการต่อสู้ — คืน false ถ้าใช้ไม่ได้ (ไม่เสียเทิร์น) */
function hmUseSkill(id, st, e) {
  const H = S.hunter;
  if (!H.load.includes(id) || !H.skills[id]) return false;
  const sk = hmSkillDef(id); if (!sk) return false;
  const cost = hmCost(sk, st);
  if (S.mp < cost) return false;
  S.mp -= cost;
  const heal = (amt) => { amt = Math.max(0, Math.min(Math.round(amt), st.hp - S.hp)); S.hp += amt; return amt; };
  if (sk.type === 'guard') {
    B.ironwall = 4;
    const a = heal(st.hp * 0.1 * sk.pow);
    log(`${sk.icon} ${sk.name}! ป้องกัน +60%${a ? ` · ฟื้น HP ${fmt(a)}` : ''}`);
    ev({ a: 'aura', kind: 'shield', text: 'DEF↑' });
  } else if (sk.type === 'regen') {
    const a = heal(st.hp * 0.3 * sk.pow);
    log(`${sk.icon} ${sk.name}! ฟื้น HP ${fmt(a)}`);
    ev({ a: 'aura', kind: 'heal', text: `+${fmt(a)}` });
  } else {
    const m = sk.mul;
    B.skillMul = sk.pow; B.curSkill = null;
    switch (sk.el) {
      case 'forest': { const h = [hitEnemy(1.5 * m)]; const a = heal(st.hp * 0.08); hitLog(sk, h, a ? ` · ฟื้น HP ${fmt(a)}` : ''); ev({ a: 'melee', big: true, hits: h }); break; }
      case 'cave': { const h = [hitEnemy(1.7 * m, { pierce: 0.6 })]; hitLog(sk, h); ev({ a: 'melee', big: true, quake: true, hits: h }); break; }
      case 'desert': { const h = multiHit(3, 0.7 * m, { bonusCrit: 25 }); hitLog(sk, h); ev({ a: 'melee', hits: h, spin: true }); break; }
      case 'volcano': { const h = [hitEnemy(2 * m, { ignoreDef: true })]; hitLog(sk, h); ev({ a: 'proj', kind: 'fire', big: true, hits: h }); break; }
      case 'swamp': {
        const h = [hitEnemy(1.2 * m)]; B.poison = 3; B.poisonDmg = Math.round(st.atk * 0.6 * sk.pow * m);
        hitLog(sk, h, ' · ศัตรูติดพิษ'); ev({ a: 'proj', kind: 'poison', hits: h }); break;
      }
      case 'ice': { const h = [hitEnemy(1.5 * m)]; B.slow = 2; hitLog(sk, h, ' · ศัตรูหนาวสั่น'); ev({ a: 'proj', kind: 'ice', hits: h }); break; }
      case 'sea': { const h = [hitEnemy(1.6 * m)]; const a = heal(h[0].dmg * 0.4); hitLog(sk, h, a ? ` · ดูดเลือด ${fmt(a)}` : ''); ev({ a: 'melee', big: true, hits: h }); break; }
      case 'sky': { const h = [hitEnemy(1.7 * m)]; hitLog(sk, h); ev({ a: 'bolt', hits: h }); if (e.hp > 0 && Math.random() < 0.3) tryStun('ช็อก'); break; }
      case 'spirit': {
        const h = [hitEnemy(1.5 * m, { ignoreDef: true })]; const g = Math.min(Math.round(st.mp * 0.1), st.mp - S.mp); S.mp += g;
        hitLog(sk, h, g ? ` · ฟื้น MP ${fmt(g)}` : ''); ev({ a: 'proj', kind: 'dark', hits: h }); break;
      }
      case 'castle': {
        const h = [hitEnemy(2.6 * m)]; const c = Math.min(Math.round(st.hp * 0.08), S.hp - 1); S.hp -= Math.max(0, c);
        hitLog(sk, h, ` · เสีย HP ${fmt(c)}`); ev({ a: 'melee', big: true, quake: true, hits: h }); break;
      }
    }
    B.skillMul = 1;
  }
  track('skills');
  return true;
}

function hmBattleButtons() {
  const H = S.hunter;
  const list = H.load.filter((id) => H.skills[id]);
  if (!list.length) return Object.keys(H.skills).length ? '' : '<div class="hm-hint">👹 ยังไม่มีสกิลอสูร — ปราบมอนแล้วรอวิญญาณหลุดออกมา</div>';
  const st = stats();
  return `<div class="skill-bar hm-bar" style="grid-template-columns:repeat(${Math.max(list.length, hmSlots())},1fr)">${list.map((id) => {
    const sk = hmSkillDef(id), c = hmCost(sk, st), no = S.mp < c;
    return `<button class="skill-btn hm-sk ${no ? 'nomp' : ''}" data-a="mskill" data-v="${esc(id)}" ${no || busy ? 'disabled' : ''} title="${esc(sk.name)}: ${sk.desc}">
      ${sk.lv > 1 ? `<span class="sk-lv ${sk.lv >= HM_SKILL_MAX ? 'max' : ''}">Lv.${sk.lv}</span>` : ''}
      <span class="sk-ico">${sk.icon}</span><span class="sk-nm">${sk.word}</span><span class="sk-mp">${c} MP</span></button>`;
  }).join('')}</div>`;
}

/* ---------------- พวกอสูร (ใช้ระบบสัตว์เลี้ยงเดิม: id = 'm:<ชื่อมอน>') ---------------- */
function hmAllyDef(name) {
  const m = hmMon(name); if (!m) return null;
  const kind = HM_ELEM[m.el].pet;
  const base = PETS.find((p) => p.kind === kind && !p.hunter && !p.ally);
  const bm = m.boss ? 1.5 : 1;
  return { id: `m:${name}`, ally: true, n: `${m.boss ? '👑' : ''}${name}`, art: name, kind, el: m.el,
    desc: base.desc, pow: (lv) => base.pow(lv) * bm * hmAllyMul() };
}
/* ลงทะเบียนพวกอสูรของเซฟนี้เข้า PETS (เรียกทุกครั้งก่อน render) */
let hmSig = null;
function hmSync() {
  const ids = hm() ? S.pets.filter((p) => p.id.startsWith('m:')).map((p) => p.id) : [];
  const sig = ids.join('|');
  if (sig === hmSig) return;
  hmSig = sig;
  for (let i = PETS.length - 1; i >= 0; i--) if (PETS[i].ally) PETS.splice(i, 1);
  for (const id of ids) { const d = hmAllyDef(id.slice(2)); if (d) PETS.push(d); }
}

/* ---------------- หลังชนะ ---------------- */
const hmPending = () => !!(S && S.mode === 'hunter' && B && B.rewards && B.rewards.hunt && !B.rewards.hunt.done);
function hmOnVictory(r) {
  if (!hm() || B.tower || B.wb || B.rush) return;
  const H = S.hunter, z = ZONES[B.zi], zr = hmZoneRank(B.zi);
  const ready = hmCanPromote();
  const first = B.isBoss && P().bossWins[z.id] === 1;
  const pts = B.isBoss ? (first ? 10 + 5 * zr : 3 + zr) : 1 + zr;
  H.pts += pts; r.hmPts = pts;
  for (const q of H.quests) {
    if (q.have >= q.need) continue;
    if ((q.t === 'hunt' && !B.isBoss && q.zi === B.zi) || (q.t === 'boss' && B.isBoss && q.zi === B.zi)) q.have++;
  }
  r.hmReady = !ready && hmCanPromote();
  if (hmMon(B.e.n) && (B.isBoss || Math.random() < HM_OFFER_CHANCE)) r.hunt = { n: B.e.n, done: false };
}

function hmResultHTML(r) {
  let h = '';
  if (r.hmPts) h += `<div class="hm-pts">🏛️ แต้มกิลด์ +${r.hmPts}${r.hmReady ? ' <b class="up">· พร้อมเลื่อนแรงค์แล้ว!</b>' : ''}</div>`;
  const o = r.hunt;
  if (!o) return h;
  if (o.done) return `${h}<div class="hm-offer done">${o.msg}</div>`;
  const sk = hmSkillDef(o.n), have = S.hunter.skills[o.n], pet = S.pets.find((p) => p.id === `m:${o.n}`), ad = hmAllyDef(o.n);
  return `${h}<div class="hm-offer">
    <div class="hm-offer-top"><span class="hm-offer-art">${monsterSVG(o.n, 60)}</span>
      <div><b>วิญญาณของ${esc(o.n)}หลุดออกมา!</b><div class="muted">เลือกได้ 1 อย่าง</div></div></div>
    <div class="hm-offer-btns">
      <button class="primary" data-a="hmabsorb">🌀 ดูดสกิล<span class="subtle">${sk.icon} ${sk.word}${have ? ` Lv.${have.lv}→${Math.min(HM_SKILL_MAX, have.lv + 1)}` : ' (ใหม่)'}<br>${sk.desc}</span></button>
      <button data-a="hmtame">🐾 รับเป็นพวก<span class="subtle">${pet ? `มีแล้ว Lv.${pet.lv} → ได้ EXP` : '(ใหม่)'}<br>${ad.desc(Math.round(ad.pow((pet || { lv: 1 }).lv) * 10) / 10)}</span></button>
    </div>
    <button class="ghost small hm-release" data-a="hmrelease">ปล่อยไป</button>
  </div>`;
}

function hmAbsorb(n) {
  const H = S.hunter, cur = H.skills[n];
  H.absorbed++;
  hmQuestTick('absorb');
  if (cur) {
    if (cur.lv >= HM_SKILL_MAX) { S.gold += 200 + S.lv * 20; return `🌀 สกิลนี้เลเวลสูงสุดแล้ว แปลงเป็นทอง 💰 ${fmt(200 + S.lv * 20)}`; }
    cur.lv++;
    return `🌀 ${hmSkillDef(n).icon} ${hmSkillDef(n).word} เลเวลอัพเป็น Lv.${cur.lv}!`;
  }
  H.skills[n] = { lv: 1 };
  const sk = hmSkillDef(n);
  if (H.load.length < hmSlots()) { H.load.push(n); return `🌀 ได้สกิลอสูร ${sk.icon} ${sk.word} ใส่ช่องให้แล้ว`; }
  return `🌀 ได้สกิลอสูร ${sk.icon} ${sk.word} (ช่องเต็ม ไปจัดที่กิลด์)`;
}
function hmTame(n) {
  const id = `m:${n}`, H = S.hunter;
  H.tamed++;
  hmQuestTick('tame');
  const have = S.pets.find((p) => p.id === id);
  if (have) {
    if (have.lv >= PET_MAX_LV) { S.gold += 200 + S.lv * 20; return `🐾 ${n} เลเวลสูงสุดแล้ว แปลงเป็นทอง 💰 ${fmt(200 + S.lv * 20)}`; }
    have.exp += 15; const old = have.lv;
    while (have.lv < PET_MAX_LV && have.exp >= petExpNeed(have.lv)) { have.exp -= petExpNeed(have.lv); have.lv++; }
    return have.lv > old ? `🐾 ${n} แข็งแกร่งขึ้น! Lv.${have.lv}` : `🐾 ${n} ได้ EXP +15`;
  }
  S.pets.push({ id, lv: 1, exp: 0 });
  hmSync();
  if (!curPet()) { S.pet = id; return `🐾 ${n} กลายเป็นพวกของคุณ และติดตามไปต่อสู้แล้ว!`; }
  return `🐾 ${n} กลายเป็นพวกของคุณ! (เปลี่ยนตัวที่พาไปได้ที่กิลด์)`;
}

/* ---------------- ภารกิจกิลด์ (บอร์ด 3 ใบ) ---------------- */
function hmNewQuest() {
  const open = ZONES.map((z, i) => i).filter((i) => zoneUnlocked(i));
  const zi = pick(open.length ? open.slice(-3) : [0]);
  const zr = hmZoneRank(zi), R = S.hunter.rank;
  const g = monsterBase(zoneLevel(zi)).gold;
  const t = pick(['hunt', 'hunt', 'hunt', 'boss', 'absorb', 'tame']);
  if (t === 'hunt') { const need = pick([5, 8, 10]); return { t, zi, need, have: 0, pts: 4 + need + 3 * zr, gold: Math.round(g * need * 2) }; }
  if (t === 'boss') return { t, zi, need: 1, have: 0, pts: 12 + 4 * zr, gold: Math.round(g * 15) };
  return { t, need: 1, have: 0, pts: 8 + 3 * R, gold: Math.round(g * 8) };
}
function hmQuestName(q) {
  const z = q.zi != null ? ZONES[q.zi] : null;
  return { hunt: `ล่ามอนสเตอร์ใน${z && z.name} ${q.need} ตัว`, boss: `ปราบบอส ${z && bossOf(z)[0]}`, absorb: 'ดูดสกิลจากวิญญาณอสูร 1 ครั้ง', tame: 'รับอสูรเป็นพวก 1 ครั้ง' }[q.t];
}
function hmQuestTick(t) { for (const q of S.hunter.quests) if (q.t === t && q.have < q.need) q.have++; }
function hmEnsureQuests() { while (S.hunter.quests.length < 3) S.hunter.quests.push(hmNewQuest()); }
const hmQuestsDone = () => S.hunter.quests.filter((q) => q.have >= q.need).length;

/* ---------------- หน้ากิลด์ ---------------- */
function hmTownButton() {
  const R = HM_RANKS[S.hunter.rank], n = hmNext();
  hmEnsureQuests();
  const alert = hmCanPromote() || hmQuestsDone();
  return `<button class="wide hm-guild-btn ${alert ? 'glow-btn' : ''}" data-a="go" data-v="guild">
    <span class="hm-rank sm" style="--rk:${R.color}">${R.r}</span>
    <span><b>กิลด์นักล่า</b>${hmQuestsDone() ? ` <span class="badge">${hmQuestsDone()}</span>` : ''}
    <span class="subtle">${hmCanPromote() ? '⬆️ พร้อมเลื่อนแรงค์!' : n ? `แต้ม ${fmt(S.hunter.pts)}/${fmt(n.pts)} สู่แรงค์ ${n.r}` : 'แรงค์สูงสุดแล้ว'}</span></span></button>`;
}

function hmRenderGuild() {
  hmEnsureQuests();
  const H = S.hunter;
  const tabs = [['rank', '🏛️ แรงค์'], ['skills', '🌀 สกิลอสูร'], ['allies', '🐾 พวกอสูร'], ['jobs', '🔮 อาชีพลับ']];
  let html = `<div class="row between"><h2>🏛️ กิลด์นักล่า</h2><button class="small" data-a="go" data-v="town">← กลับ</button></div>
    <div class="tabs hm-tabs">${tabs.map(([k, n]) => `<button class="${H.tab === k ? 'on' : ''}" data-a="hmtab" data-v="${k}">${n}</button>`).join('')}</div>`;
  if (H.tab === 'skills') html += hmSkillsTab();
  else if (H.tab === 'allies') html += hmAlliesTab();
  else if (H.tab === 'jobs') html += hmJobsTab();
  else html += hmRankTab();
  return html;
}

function hmRankTab() {
  const H = S.hunter, R = HM_RANKS[H.rank], n = hmNext();
  const opens = n ? ZONES.map((z, i) => i).filter((i) => hmZoneRank(i) === H.rank + 1).map((i) => `${ZONES[i].icon} ${ZONES[i].name}`) : [];
  return `<div class="card hm-rank-card">
    <div class="hm-rank" style="--rk:${R.color}">${R.r}</div>
    <div style="flex:1;min-width:0">
      <b style="font-family:Kanit;font-size:18px">แรงค์ ${R.r} · ${R.n}</b>
      <div class="muted">แต้มกิลด์ ${fmt(H.pts)}${n ? ` / ${fmt(n.pts)}` : ''} · ช่องสกิลอสูร ${hmSlots()} ช่อง</div>
      ${n ? `<div style="margin:6px 0">${bar('exp', H.pts, n.pts, '')}</div>
        <div class="muted" style="font-size:13px">แรงค์ ${n.r} เปิด: ${opens.join(', ') || '-'}${n.slots > R.slots ? ` · ช่องสกิล +${n.slots - R.slots}` : ''}</div>
        <button class="${hmCanPromote() ? 'primary glow-btn' : ''}" style="width:100%;margin-top:8px" data-a="hmpromote" ${hmCanPromote() ? '' : 'disabled'}>⬆️ สอบเลื่อนเป็นแรงค์ ${n.r}</button>`
        : '<div class="up" style="margin-top:6px">👑 คุณคือตำนานของกิลด์!</div>'}
    </div></div>
  <h3>📋 บอร์ดภารกิจ</h3>
  ${H.quests.map((q, i) => {
    const done = q.have >= q.need;
    return `<div class="card hm-quest ${done ? 'done' : ''}">
      <div style="flex:1;min-width:0"><b>${hmQuestName(q)}</b>
        <div class="muted" style="font-size:13px">รางวัล 🏛️ ${q.pts} แต้ม · 💰 ${fmt(q.gold)}</div>
        ${bar('exp', q.have, q.need, `${q.have}/${q.need}`)}</div>
      <div class="row" style="flex-direction:column;gap:6px">
        <button class="small ${done ? 'primary' : ''}" data-a="hmclaim" data-v="${i}" ${done ? '' : 'disabled'}>รับรางวัล</button>
        ${done ? '' : `<button class="small ghost" data-a="hmdrop" data-v="${i}">เปลี่ยน</button>`}
      </div></div>`;
  }).join('')}
  <div class="muted" style="font-size:13px">💡 ล่ามอนได้แต้มตามแรงค์ของด่าน · บอสครั้งแรกได้แต้มเยอะ · มอนธรรมดามีโอกาส ${Math.round(HM_OFFER_CHANCE * 100)}% ที่วิญญาณจะหลุดออกมา บอสหลุดทุกครั้ง</div>`;
}

function hmSkillsTab() {
  const H = S.hunter, st = stats(), slots = hmSlots();
  while (H.load.length > slots) H.load.pop();
  const owned = Object.keys(H.skills).map(hmSkillDef).filter(Boolean)
    .sort((a, b) => (H.load.includes(b.id) ? 1 : 0) - (H.load.includes(a.id) ? 1 : 0) || b.lv - a.lv);
  const typeName = { atk: 'โจมตี', boss: 'ราชัน', guard: 'ป้องกัน', regen: 'ฟื้นฟู' };
  return `<div class="muted" style="font-size:14px;margin-bottom:8px">ใส่ได้ ${slots} ช่อง (เพิ่มตามแรงค์) · ดูดสกิลเดิมซ้ำ = เลเวลอัพ (สูงสุด Lv.${HM_SKILL_MAX})</div>
  <div class="skill-bar" style="grid-template-columns:repeat(${slots},1fr)">${Array.from({ length: slots }, (_, i) => {
    const id = H.load[i];
    if (!id) return `<button class="skill-btn empty" disabled><span class="sk-ico">➕</span><span class="sk-nm">ว่าง</span></button>`;
    const sk = hmSkillDef(id);
    return `<button class="skill-btn hm-sk" data-a="hmunload" data-v="${esc(id)}" title="แตะเพื่อถอด"><span class="sk-ico">${sk.icon}</span><span class="sk-nm">${sk.word}</span><span class="sk-mp">ถอด ✕</span></button>`;
  }).join('')}</div>
  ${owned.length ? owned.map((sk) => {
    const on = H.load.includes(sk.id);
    return `<div class="card hm-skill ${on ? 'on' : ''}">
      <span class="hm-sk-art">${monsterSVG(sk.mon, 44, sk.icon)}</span>
      <div style="flex:1;min-width:0"><b>${sk.elIcon} ${sk.word}</b> <span class="muted">Lv.${sk.lv} · ${typeName[sk.type]}</span>
        <div class="muted" style="font-size:12px">จาก${esc(sk.mon)}</div>
        <div style="font-size:13px">${sk.desc} · ${hmCost(sk, st)} MP</div></div>
      ${on ? '<span class="muted">ใส่อยู่</span>' : `<button class="small primary" data-a="hmload" data-v="${esc(sk.id)}" ${H.load.length >= slots ? 'disabled' : ''}>ใส่</button>`}
    </div>`;
  }).join('') : '<div class="card muted">ยังไม่มีสกิลอสูร ไปล่ามอนแล้วเลือก "ดูดสกิล" เมื่อวิญญาณหลุดออกมา</div>'}`;
}

function hmAlliesTab() {
  const list = S.pets.filter((p) => p.id.startsWith('m:'));
  if (!list.length) return '<div class="card muted">ยังไม่มีพวกอสูร ไปล่ามอนแล้วเลือก "รับเป็นพวก" เมื่อวิญญาณหลุดออกมา</div>';
  return `<div class="muted" style="font-size:14px;margin-bottom:8px">มีพวก ${list.length} ตัว · พาไปต่อสู้ได้ 1 ตัว · ได้ EXP ทุกครั้งที่ชนะ · รับตัวเดิมซ้ำ = ได้ EXP</div>
  <div class="pet-grid">${list.sort((a, b) => b.lv - a.lv).map((p) => {
    const d = petDef(p.id); if (!d) return '';
    const on = S.pet === p.id;
    return `<div class="pet-card ${on ? 'on' : ''}">
      <div class="pet-art">${monsterSVG(d.art, 64)}</div>
      <b>${esc(d.n)}</b><div class="muted" style="font-size:12px">${HM_ELEM[d.el].i} ${HM_ELEM[d.el].n} · Lv.${p.lv}${p.lv < PET_MAX_LV ? ` · EXP ${p.exp}/${petExpNeed(p.lv)}` : ' (สูงสุด)'}</div>
      <div style="font-size:12px;margin:4px 0">${d.desc(petPow(p))}</div>
      <button class="small ${on ? '' : 'primary'}" data-a="pet" data-v="${on ? '' : esc(p.id)}">${on ? 'พักผ่อน' : 'พาไปด้วย'}</button>
    </div>`;
  }).join('')}</div>`;
}

function hmJobsTab() {
  const H = S.hunter;
  return `<div class="muted" style="font-size:14px;margin-bottom:8px">อาชีพลับปลดล็อกจากเงื่อนไขลึกลับ ใส่ได้ทีละ 1 อาชีพ (เสริมจากอาชีพหลัก ${className()})</div>
  ${HM_JOBS.map((j) => {
    const got = H.jobs[j.id], on = H.job === j.id;
    if (!got) return `<div class="card hm-job locked"><span class="hm-job-ico">❔</span><div><b>???</b><div class="muted" style="font-size:13px;font-style:italic">"${j.hint}"</div></div></div>`;
    return `<div class="card hm-job ${on ? 'on' : ''}"><span class="hm-job-ico">${j.i}</span>
      <div style="flex:1"><b>${j.n}</b><div style="font-size:13px">${j.bonus}</div></div>
      <button class="small ${on ? '' : 'primary'}" data-a="hmjob" data-v="${on ? '' : j.id}">${on ? 'ถอด' : 'ใช้อาชีพนี้'}</button></div>`;
  }).join('')}`;
}

/* ---------------- กดปุ่ม — คืน true ถ้าต้อง render ---------------- */
function hmClick(a, v) {
  if (!hm()) return false;
  const H = S.hunter;
  switch (a) {
    case 'mskill': playerAct('mskill', v); return false; // playerAct render เองแล้ว
    case 'hmtab': H.tab = v; return true;
    case 'hmabsorb': case 'hmtame': case 'hmrelease': {
      const o = B && B.rewards && B.rewards.hunt; if (!o || o.done) return true;
      o.done = true;
      o.msg = a === 'hmabsorb' ? hmAbsorb(o.n) : a === 'hmtame' ? hmTame(o.n) : `🕊️ ปล่อยวิญญาณของ${o.n}ไปแล้ว`;
      hmCheckJobs();
      B.hmk = (B.hmk || 0) + 1;
      save(); return true;
    }
    case 'hmpromote': {
      if (!hmCanPromote()) return true;
      H.rank++;
      const R = HM_RANKS[H.rank];
      toast(`🎉 เลื่อนเป็นนักล่าแรงค์ ${R.r} · ${R.n}!`);
      hmCheckJobs(); save(); return true;
    }
    case 'hmclaim': {
      const q = H.quests[+v]; if (!q || q.have < q.need) return true;
      H.pts += q.pts; S.gold += q.gold; H.quests.splice(+v, 1); hmEnsureQuests(); save();
      toast(`📋 ภารกิจสำเร็จ! 🏛️ +${q.pts} แต้ม · 💰 +${fmt(q.gold)}`); return true;
    }
    case 'hmdrop': H.quests.splice(+v, 1); hmEnsureQuests(); save(); return true;
    case 'hmload': if (H.skills[v] && !H.load.includes(v) && H.load.length < hmSlots()) { H.load.push(v); save(); } return true;
    case 'hmunload': H.load = H.load.filter((x) => x !== v); save(); return true;
    case 'hmjob': H.job = v && H.jobs[v] ? v : null; { const st = stats(); S.hp = Math.min(S.hp, st.hp); S.mp = Math.min(S.mp, st.mp); } save();
      toast(v ? `🔮 ใช้อาชีพลับ ${HM_JOBS.find((j) => j.id === v).n}` : 'ถอดอาชีพลับแล้ว'); return true;
  }
  return false;
}
