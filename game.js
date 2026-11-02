'use strict';
/* ============================================================
   ตำนานผู้กล้า — Thai RPG (turn-based)
   เก็บเลเวล • สะสมไอเทม • ตีบวก • สู้บอส 10 ด่าน • 3 ระดับความยาก
   เซฟอัตโนมัติใน localStorage ของเบราว์เซอร์
   ============================================================ */

const SAVE_KEY = 'thai-rpg-save-v1';
const SAVE_VERSION = 2;
const BOSS_UNLOCK_KILLS = 5;
const MAX_PLUS = 15;

const rand = (a, b) => Math.random() * (b - a) + a;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n) => Math.round(n).toLocaleString('th-TH');

/* ---------------- ข้อมูลเกม ---------------- */

const CLASSES = {
  warrior: {
    name: 'นักรบ', icon: '🧔🏻‍♂️', desc: 'เลือดเยอะ เกราะหนา ตีแรง เหมาะกับมือใหม่',
    base: { hp: 130, mp: 30, atk: 13, def: 9, crit: 5 },
    grow: { hp: 16, mp: 3, atk: 3, def: 2, crit: 0.3 },
    skills: [
      { id: 'slash', name: 'ฟันสะบั้น', icon: '💥', mp: 8, lv: 1, desc: 'โจมตีแรง 200%' },
      { id: 'warcry', name: 'คำรามศึก', icon: '📣', mp: 12, lv: 5, desc: 'พลังโจมตี +50% 3 เทิร์น' },
    ],
  },
  mage: {
    name: 'จอมเวท', icon: '🧙🏻', desc: 'เวทแรงทะลุเกราะ รักษาตัวเองได้ แต่ตัวบาง',
    base: { hp: 90, mp: 70, atk: 15, def: 5, crit: 5 },
    grow: { hp: 10, mp: 8, atk: 3.5, def: 1, crit: 0.3 },
    skills: [
      { id: 'fireball', name: 'ลูกไฟ', icon: '🔥', mp: 10, lv: 1, desc: 'เวท 230% ไม่สนเกราะ' },
      { id: 'heal', name: 'แสงรักษา', icon: '✨', mp: 15, lv: 5, desc: 'ฟื้น HP 40%' },
    ],
  },
  archer: {
    name: 'นักธนู', icon: '🧝🏻', desc: 'คริติคอลสูง ยิงหลายดอก ใช้พิษได้',
    base: { hp: 105, mp: 45, atk: 12, def: 6, crit: 15 },
    grow: { hp: 12, mp: 5, atk: 3, def: 1.5, crit: 0.6 },
    skills: [
      { id: 'volley', name: 'ฝนธนู', icon: '🌧️', mp: 9, lv: 1, desc: 'ยิง 3 ดอก ดอกละ 80%' },
      { id: 'poison', name: 'ธนูพิษ', icon: '☠️', mp: 12, lv: 5, desc: 'โจมตี 100% + พิษ 3 เทิร์น' },
    ],
  },
};

/* มอนสเตอร์: [ชื่อ, ไอคอน, ตัวคูณHP, ตัวคูณโจมตี, ตัวคูณป้องกัน]
   ค่าพลังจริงคำนวณจากเลเวลพื้นที่ (ดู monsterBase) — ความยากที่สูงขึ้นจะบวกเลเวลเพิ่ม */
const ZONES = [
  { id: 'forest', name: 'ป่าเขียวขจี', icon: '🌲', lv: 1, suffix: 'แห่งพงไพร', bg: 'linear-gradient(180deg,#1d3a2a,#13261c)',
    mobs: [['สไลม์', '🟢', 0.75, 0.8, 0.7], ['หมาป่า', '🐺', 1, 1, 1], ['ก็อบลิน', '👺', 1.2, 1.1, 1.2]],
    boss: ['ราชาก็อบลิน', '👹'],
    unique: { slot: 'weapon', n: 'กระบองราชาก็อบลิน', i: '🏏', bonus: { crit: 3 } } },
  { id: 'cave', name: 'ถ้ำมืดมิด', icon: '🕳️', lv: 4, suffix: 'แห่งเงามืด', bg: 'linear-gradient(180deg,#25223a,#141221)',
    mobs: [['ค้างคาวแวมไพร์', '🦇', 0.85, 1, 0.8], ['แมงมุมยักษ์', '🕷️', 1, 1.05, 1], ['โครงกระดูก', '💀', 1.15, 1.1, 1.2]],
    boss: ['นาคาพิษ', '🐍'],
    unique: { slot: 'armor', n: 'เกล็ดนาคา', i: '🐉', bonus: { hpMul: 1.25 } } },
  { id: 'desert', name: 'ทะเลทรายร้อนระอุ', icon: '🏜️', lv: 7, suffix: 'แห่งผืนทราย', bg: 'linear-gradient(180deg,#5a4320,#2c1f0e)',
    mobs: [['แมงป่องยักษ์', '🦂', 0.9, 1.1, 1.1], ['อูฐคลั่ง', '🐪', 1.2, 0.95, 0.9], ['มัมมี่', '🧟‍♂️', 1.1, 1.05, 1]],
    boss: ['สฟิงซ์ทองคำ', '🦁'],
    unique: { slot: 'accessory', n: 'ดวงตาสฟิงซ์', i: '👁️', bonus: { crit: 6 } } },
  { id: 'volcano', name: 'ภูเขาไฟ', icon: '🌋', lv: 10, suffix: 'แห่งเพลิง', bg: 'linear-gradient(180deg,#4a1d14,#22100c)',
    mobs: [['ภูตไฟ', '🔥', 0.85, 1.15, 0.8], ['โกเลมหิน', '🗿', 1.25, 0.95, 1.5], ['ซาลาแมนเดอร์', '🦎', 1, 1.1, 1]],
    boss: ['มังกรเพลิง', '🐲'],
    unique: { slot: 'accessory', n: 'หัวใจมังกร', i: '❤️‍🔥', bonus: { atkAdd: 2 } } },
  { id: 'swamp', name: 'หนองน้ำพิษ', icon: '🐸', lv: 13, suffix: 'แห่งบึงพิษ', bg: 'linear-gradient(180deg,#24391c,#0f1a0b)',
    mobs: [['กบยักษ์', '🐸', 1, 0.95, 0.9], ['จระเข้', '🐊', 1.25, 1.1, 1.3], ['ยุงพิษ', '🦟', 0.7, 1.2, 0.6]],
    boss: ['แม่มดหนองน้ำ', '🧙‍♀️'],
    unique: { slot: 'weapon', n: 'คทาแม่มดหนองน้ำ', i: '🔮', bonus: { mp: 8 } } },
  { id: 'ice', name: 'ธารน้ำแข็ง', icon: '❄️', lv: 16, suffix: 'แห่งเหมันต์', bg: 'linear-gradient(180deg,#26445e,#101d2b)',
    mobs: [['หมีขั้วโลก', '🐻‍❄️', 1.25, 1.05, 1.1], ['ตุ๊กตาหิมะคลั่ง', '☃️', 0.9, 1, 1.2], ['เพนกวินนักรบ', '🐧', 0.9, 1.1, 0.9]],
    boss: ['แมมมอธน้ำแข็ง', '🦣'],
    unique: { slot: 'armor', n: 'เกราะน้ำแข็งนิรันดร์', i: '🧊', bonus: { defMul: 1.2 } } },
  { id: 'sea', name: 'วิหารใต้สมุทร', icon: '🌊', lv: 19, suffix: 'แห่งห้วงสมุทร', bg: 'linear-gradient(180deg,#123b55,#081722)',
    mobs: [['ฉลามคลั่ง', '🦈', 1.05, 1.2, 0.9], ['ปูเหล็ก', '🦀', 1, 0.95, 1.6], ['แมงกะพรุนไฟฟ้า', '🪼', 0.8, 1.15, 0.7]],
    boss: ['คราเคน', '🐙'],
    unique: { slot: 'weapon', n: 'ตรีศูลสมุทร', i: '🔱', bonus: { atkMul: 1.1 } } },
  { id: 'sky', name: 'เกาะลอยฟ้า', icon: '☁️', lv: 22, suffix: 'แห่งฟากฟ้า', bg: 'linear-gradient(180deg,#3d5b8f,#1a2640)',
    mobs: [['ภูตลมพายุ', '🌪️', 0.9, 1.15, 0.8], ['อีกาสายฟ้า', '🐦‍⬛', 0.85, 1.2, 0.8], ['ยักษ์เมฆ', '⛈️', 1.35, 1, 1.2]],
    boss: ['พญาครุฑ', '🦅'],
    unique: { slot: 'accessory', n: 'ปีกพญาครุฑ', i: '🪽', bonus: { crit: 8 } } },
  { id: 'spirit', name: 'ดินแดนวิญญาณ', icon: '👻', lv: 25, suffix: 'แห่งยมโลก', bg: 'linear-gradient(180deg,#2d2140,#0e0916)',
    mobs: [['วิญญาณร้าย', '👻', 0.85, 1.2, 0.7], ['ตุ๊กตาต้องสาป', '🪆', 1, 1.05, 1.1], ['อัศวินกระดูก', '☠️', 1.2, 1.1, 1.3]],
    boss: ['เจ้าแห่งยมโลก', '🧛'],
    unique: { slot: 'armor', n: 'ผ้าคลุมยมโลก', i: '🧥', bonus: { hpMul: 1.15, mp: 6 } } },
  { id: 'castle', name: 'ปราสาทจอมมาร', icon: '🏰', lv: 28, suffix: 'แห่งรัตติกาล', bg: 'linear-gradient(180deg,#2b1033,#12071a)',
    mobs: [['อัศวินดำ', '🛡️', 1.1, 1, 1.3], ['ปีศาจ', '😈', 1, 1.1, 1], ['ลิช', '🧟', 0.95, 1.2, 0.9]],
    boss: ['จอมมาร', '👿'],
    unique: { slot: 'weapon', n: 'ดาบสังหารมาร', i: '⚔️', bonus: { atkMul: 1.25, crit: 10 } } },
];
const FINAL_ZONE = ZONES.length - 1;

const DIFFS = {
  normal: { name: 'ปกติ', icon: '🟢', off: 0, mul: { hp: 1, atk: 1, def: 1 }, tierAdd: 0, stars: '', minR: 0, maxR: 3, bossMinR: 2, reward: 1, enrage: 0, eCrit: 0,
    desc: 'ผจญภัยครั้งแรก ไอเทมสูงสุดระดับตำนาน' },
  hard: { name: 'ยาก', icon: '🟠', off: 28, mul: { hp: 1.3, atk: 1.25, def: 1.15 }, tierAdd: 10, stars: '★', minR: 1, maxR: 4, bossMinR: 3, reward: 1.3, enrage: 0.3, eCrit: 5,
    desc: 'มอนสเตอร์ +28 เลเวล · บอสคลั่งเมื่อเลือดต่ำ · ดรอประดับเทพนิยาย' },
  advanced: { name: 'ขั้นสูง', icon: '🔴', off: 56, mul: { hp: 1.6, atk: 1.5, def: 1.3 }, tierAdd: 20, stars: '★★', minR: 2, maxR: 5, bossMinR: 4, reward: 1.6, enrage: 0.5, eCrit: 10,
    desc: 'มอนสเตอร์ +56 เลเวล · บอสคลั่งเร็ว · ดรอประดับเทพเจ้า' },
};
const DIFF_ORDER = ['normal', 'hard', 'advanced'];

const RARITY = [
  { id: 'common', name: 'ธรรมดา', m: 1.0, w: 60, cost: 1 },
  { id: 'rare', name: 'หายาก', m: 1.4, w: 28, cost: 1.3 },
  { id: 'epic', name: 'มหากาพย์', m: 1.9, w: 10, cost: 1.7 },
  { id: 'legend', name: 'ตำนาน', m: 2.6, w: 2.2, cost: 2.2 },
  { id: 'mythic', name: 'เทพนิยาย', m: 3.4, w: 0.8, cost: 3 },
  { id: 'divine', name: 'เทพเจ้า', m: 4.4, w: 0.3, cost: 4 },
];
const RARITY_ORDER = { unique: 0, divine: 1, mythic: 2, legend: 3, epic: 4, rare: 5, common: 6 };

/* m = ตัวคูณโจมตี, c = ตัวคูณคริ, mp = ให้ MP, minTier = ระดับไอเทมขั้นต่ำที่จะดรอป (อาวุธระดับสูง) */
const GEAR = {
  weapon: [
    { k: 'sword', n: 'ดาบ', i: '🗡️', m: 1, c: 1 },
    { k: 'axe', n: 'ขวาน', i: '🪓', m: 1.08, c: 0.8 },
    { k: 'staff', n: 'คทา', i: '🪄', m: 1, c: 1, mp: 1 },
    { k: 'bow', n: 'ธนู', i: '🏹', m: 0.95, c: 1.4 },
    { k: 'greatsword', n: 'ดาบใหญ่', i: '⚔️', m: 1.3, c: 0.9, minTier: 5, high: true },
    { k: 'ngao', n: 'ง้าว', i: '🔱', m: 1.22, c: 1.2, minTier: 5, high: true },
    { k: 'scythe', n: 'เคียวมรณะ', i: '🌙', m: 1.18, c: 1.7, minTier: 6, high: true },
    { k: 'crystal', n: 'คทาคริสตัล', i: '💎', m: 1.2, c: 1.1, mp: 2, minTier: 6, high: true },
    { k: 'crossbow', n: 'หน้าไม้', i: '🎯', m: 1.15, c: 1.9, minTier: 7, high: true },
  ],
  armor: [{ k: 'leather', n: 'เกราะหนัง', i: '🦺' }, { k: 'plate', n: 'เกราะเหล็ก', i: '🛡️' }, { k: 'robe', n: 'เสื้อคลุม', i: '🥋' }],
  accessory: [{ k: 'ring', n: 'แหวน', i: '💍' }, { k: 'amulet', n: 'สร้อยคอ', i: '📿' }],
};
const SLOT_NAME = { weapon: 'อาวุธ', armor: 'ชุดเกราะ', accessory: 'เครื่องประดับ' };
const MAIN_STAT = { weapon: 'atk', armor: 'def', accessory: 'hp' };
const STAT_NAME = { atk: 'โจมตี', def: 'ป้องกัน', hp: 'HP', mp: 'MP', crit: 'คริ%' };

/* อัตราสำเร็จการตีบวก จาก +N ไป +N+1 (index = ค่าบวกปัจจุบัน) */
const FORGE_RATE = [1, 1, 1, 0.85, 0.75, 0.65, 0.55, 0.45, 0.38, 0.3, 0.25, 0.2, 0.15, 0.1, 0.06];
const FORGE_SAFE = 6; // ตีพลาดก่อน +7 ไม่ลดระดับ

const POTIONS = {
  hp_s: { n: 'ยาแดงเล็ก', i: '🧪', price: 15, desc: 'ฟื้น HP 15% (ขั้นต่ำ 60)', hp: 60, hpPct: 0.15 },
  mp_s: { n: 'ยาฟ้า', i: '💧', price: 25, desc: 'ฟื้น MP 30% (ขั้นต่ำ 40)', mp: 40, mpPct: 0.3 },
  hp_l: { n: 'ยาแดงใหญ่', i: '🍷', price: 60, desc: 'ฟื้น HP 40% (ขั้นต่ำ 250)', hp: 250, hpPct: 0.4 },
  elixir: { n: 'น้ำอมฤต', i: '🌟', price: 300, desc: 'ฟื้น HP/MP เต็ม', full: true },
};

/* ---------------- สถานะเกม ---------------- */

let S = null;        // ข้อมูลที่เซฟ
let B = null;        // การต่อสู้ปัจจุบัน
let view = 'title';
let bagTab = 'gear';
let createState = { name: '', cls: 'warrior' };
let forgeSel = null;
let forgeUseCharm = false;
let forgeFx = null;
let busy = false;

function save() { if (S) try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } }
function load() {
  try { const raw = localStorage.getItem(SAVE_KEY); if (raw) return migrate(JSON.parse(raw)); } catch (e) { /* ignore */ }
  return null;
}

/* อัปเกรดเซฟเก่า (v1: 4 ด่าน ไม่มีความยาก/ตีบวก) */
function migrate(s) {
  if (!s) return s;
  if (!s.v || s.v < 2) {
    s.diff = 'normal';
    s.prog = { normal: { zoneKills: s.zoneKills || {}, bossWins: s.bossWins || {} } };
    s.clearedDiffs = s.cleared ? { normal: true } : {};
    delete s.zoneKills; delete s.bossWins; delete s.cleared;
    s.charms = 0;
    const fix = (it) => {
      if (!it || it.base) return;
      it.base = { ...it.stats }; it.plus = 0;
      const zi = ZONES.findIndex((z) => it.name.includes(z.suffix));
      it.tier = it.rarity === 'unique' ? Math.max(1, ZONES.findIndex((z) => it.key === `u:${z.id}`) + 1) : Math.max(1, zi + 1);
    };
    s.bag.forEach(fix); Object.values(s.equip).forEach(fix);
    s.v = 2;
  }
  for (const k of Object.keys(POTIONS)) if (s.pots[k] == null) s.pots[k] = 0;
  if (s.charms == null) s.charms = 0;
  return s;
}

const D = () => DIFFS[S.diff];
function P() {
  if (!S.prog[S.diff]) S.prog[S.diff] = { zoneKills: {}, bossWins: {} };
  return S.prog[S.diff];
}

function newGame(name, cls) {
  S = {
    v: SAVE_VERSION, name, cls, lv: 1, exp: 0, gold: 60,
    hp: 0, mp: 0,
    equip: { weapon: null, armor: null, accessory: null },
    bag: [], pots: { hp_s: 3, mp_s: 2, hp_l: 0, elixir: 0 }, charms: 0,
    diff: 'normal', prog: { normal: { zoneKills: {}, bossWins: {} } }, clearedDiffs: {},
    collection: {}, bestiary: {},
    uid: 1, wins: 0,
  };
  const starter = { warrior: ['sword', 'ดาบฝึกหัด', '🗡️'], mage: ['staff', 'คทาฝึกหัด', '🪄'], archer: ['bow', 'ธนูฝึกหัด', '🏹'] }[cls];
  S.equip.weapon = finalizeItem({ slot: 'weapon', key: `${starter[0]}:common`, name: starter[1], icon: starter[2], rarity: 'common', tier: 1, stats: { atk: 3 } });
  S.collection[S.equip.weapon.key] = true;
  const st = stats();
  S.hp = st.hp; S.mp = st.mp;
  save();
}

function stats() {
  const c = CLASSES[S.cls];
  const s = {};
  for (const k of ['hp', 'mp', 'atk', 'def', 'crit']) s[k] = c.base[k] + c.grow[k] * (S.lv - 1);
  for (const slot of Object.keys(S.equip)) {
    const it = S.equip[slot];
    if (it) for (const k in it.stats) s[k] = (s[k] || 0) + it.stats[k];
  }
  for (const k in s) s[k] = Math.round(s[k]);
  s.crit = clamp(s.crit, 0, 75);
  return s;
}

const expNeed = (lv) => Math.round(15 * Math.pow(lv, 1.6));
const zoneUnlocked = (i) => i === 0 || (!!P().bossWins[ZONES[i - 1].id] && zoneUnlocked(i - 1));
const zoneLevel = (zi) => ZONES[zi].lv + D().off;
const zoneTier = (zi) => zi + 1 + D().tierAdd;
const maxTier = () => { let t = 1; ZONES.forEach((z, i) => { if (zoneUnlocked(i)) t = zoneTier(i); }); return t; };
const bossesBeaten = () => ZONES.filter((z) => P().bossWins[z.id]).length;
const anyCleared = () => Object.keys(S.clearedDiffs || {}).length > 0;

/* ค่าพลังพื้นฐานของมอนสเตอร์ตามเลเวลพื้นที่ */
function monsterBase(Z) {
  return {
    hp: 28 + 14 * Z + 0.25 * Z * Z,
    atk: 8 + 2.9 * Z + 0.03 * Z * Z,
    def: 2 + 1.1 * Z,
    exp: 6 + 5 * Z + 0.12 * Z * Z,
    gold: 5 + 4 * Z,
  };
}

/* ---------------- ไอเทม ---------------- */

function rollRarity(min = 0, max = 3) {
  const pool = RARITY.slice(min, max + 1);
  const total = pool.reduce((a, r) => a + r.w, 0);
  let x = Math.random() * total;
  for (let i = 0; i < pool.length; i++) { x -= pool[i].w; if (x <= 0) return min + i; }
  return min;
}

const tierSuffix = (tier) => ZONES[(tier - 1) % ZONES.length].suffix + ['', '★', '★★'][Math.min(2, Math.floor((tier - 1) / ZONES.length))];

function makeGear(tier, minR, maxR, forceSlot) {
  const slot = forceSlot || pick(Object.keys(GEAR));
  const base = pick(GEAR[slot].filter((b) => tier >= (b.minTier || 1)));
  const ri = rollRarity(minR, maxR);
  const r = RARITY[ri];
  const roll = () => rand(0.85, 1.15) * r.m;
  const stats = {};
  if (slot === 'weapon') {
    stats.atk = Math.round((2 + tier * 4) * roll() * base.m);
    if (ri >= 1 || base.c > 1.2) stats.crit = Math.max(1, Math.round(tier * 1.2 * r.m * base.c * (ri >= 1 ? 1 : 0.4)));
    if (base.mp) stats.mp = Math.round(tier * 3 * r.m * base.mp);
  } else if (slot === 'armor') {
    stats.def = Math.round((1 + tier * 3) * roll());
    stats.hp = Math.round(tier * 15 * roll());
  } else {
    stats.hp = Math.round(tier * 12 * roll());
    stats.crit = Math.round((1 + tier) * r.m);
    if (ri >= 2) stats.atk = Math.round(tier * 2 * r.m);
  }
  return finalizeItem({ slot, key: `${base.k}:${r.id}`, name: `${base.n}${tierSuffix(tier)}`, icon: base.i, rarity: r.id, tier, stats });
}

function makeUnique(zone, tier) {
  const u = zone.unique, b = u.bonus || {};
  const m = 2.9;
  const st = {};
  if (u.slot === 'weapon') {
    st.atk = (2 + tier * 4) * m * (b.atkMul || 1);
    st.crit = tier * 1.2 * 2.6 + (b.crit || 0);
  } else if (u.slot === 'armor') {
    st.def = (1 + tier * 3) * m * (b.defMul || 1);
    st.hp = tier * 15 * m * (b.hpMul || 1);
  } else {
    st.hp = tier * 12 * m;
    st.crit = (1 + tier) * 2.6 + (b.crit || 0);
    st.atk = tier * (2 + (b.atkAdd || 0)) * 2.6;
  }
  if (b.mp) st.mp = tier * b.mp;
  for (const k in st) st[k] = Math.round(st[k]);
  const stars = ['', ' ★', ' ★★'][Math.min(2, Math.floor((tier - 1) / ZONES.length))];
  return finalizeItem({ slot: u.slot, key: `u:${zone.id}`, name: u.n + stars, icon: u.i, rarity: 'unique', tier, stats: st });
}

function finalizeItem(it) {
  it.uid = S.uid++;
  it.plus = it.plus || 0;
  it.base = { ...it.stats };
  refreshItem(it);
  return it;
}

/* คำนวณค่าพลังจริงจากค่าพื้นฐาน + ระดับตีบวก */
function plusStats(it, plus) {
  const out = {};
  const main = MAIN_STAT[it.slot];
  for (const k in it.base) {
    const v = it.base[k];
    let nv = Math.round(v * (1 + 0.1 * plus));
    if (k === main) nv = Math.max(nv, v + plus * (k === 'hp' ? 5 : 1));
    out[k] = nv;
  }
  return out;
}

function refreshItem(it) {
  it.stats = plusStats(it, it.plus);
  const s = it.stats;
  const sum = (s.atk || 0) * 3 + (s.def || 0) * 3 + (s.hp || 0) * 0.3 + (s.crit || 0) * 4 + (s.mp || 0) * 0.5;
  it.value = Math.max(5, Math.round(sum * 1.5));
}

function addItem(it) {
  S.bag.push(it);
  const isNew = !S.collection[it.key];
  S.collection[it.key] = true;
  return isNew;
}

const rarityName = (id) => id === 'unique' ? 'ไอเทมบอส' : RARITY.find((r) => r.id === id).name;
const statText = (st) => Object.entries(st).map(([k, v]) => `${STAT_NAME[k]} +${v}`).join(' · ');
const itemName = (it) => `${it.plus ? `<b class="plus">+${it.plus}</b> ` : ''}${esc(it.name)}`;
const itemNameText = (it) => `${it.plus ? `+${it.plus} ` : ''}${it.name}`;

function compareText(it) {
  const cur = S.equip[it.slot];
  const keys = new Set([...Object.keys(it.stats), ...Object.keys(cur ? cur.stats : {})]);
  const parts = [];
  for (const k of keys) {
    const d = (it.stats[k] || 0) - (cur ? cur.stats[k] || 0 : 0);
    if (d) parts.push(`<span class="${d > 0 ? 'up' : 'down'}">${STAT_NAME[k]} ${d > 0 ? '+' : ''}${d}</span>`);
  }
  return parts.length ? parts.join(' ') : '<span class="muted">เท่าเดิม</span>';
}

/* ---------------- ตีบวก ---------------- */

const rarityCost = (r) => (r === 'unique' ? 2.5 : RARITY.find((x) => x.id === r).cost);
const forgeCost = (it) => Math.round((15 + it.tier * 12) * rarityCost(it.rarity) * (1 + it.plus * 0.55));
const charmPrice = () => 100 + maxTier() * 40;

function findItem(uid) {
  for (const slot of Object.keys(S.equip)) if (S.equip[slot] && S.equip[slot].uid === uid) return S.equip[slot];
  return S.bag.find((x) => x.uid === uid) || null;
}

function forge(it) {
  if (!it || it.plus >= MAX_PLUS) return;
  const cost = forgeCost(it);
  if (S.gold < cost) { toast('ทองไม่พอ'); return; }
  const useCharm = forgeUseCharm && S.charms > 0 && it.plus > FORGE_SAFE;
  S.gold -= cost;
  if (Math.random() < FORGE_RATE[it.plus]) {
    it.plus++;
    forgeFx = { ok: true, text: `✨ สำเร็จ! ${it.name} เป็น +${it.plus}` };
  } else if (it.plus > FORGE_SAFE) {
    if (useCharm) { S.charms--; forgeFx = { ok: false, text: `🧿 ล้มเหลว แต่ยันต์คุ้มครองไว้ ยังเป็น +${it.plus}` }; }
    else { it.plus--; forgeFx = { ok: false, text: `💥 ล้มเหลว! ลดเหลือ +${it.plus}` }; }
  } else {
    forgeFx = { ok: false, text: `💨 ล้มเหลว! ยังเป็น +${it.plus}` };
  }
  refreshItem(it);
  const st = stats(); S.hp = Math.min(S.hp, st.hp); S.mp = Math.min(S.mp, st.mp);
  save();
}

/* ---------------- การต่อสู้ ---------------- */

function startBattle(zi, isBoss) {
  const zone = ZONES[zi];
  const Z = zoneLevel(zi);
  const mb = monsterBase(Z);
  const d = D();
  let e;
  if (isBoss) {
    e = { n: zone.boss[0], i: zone.boss[1], maxHp: mb.hp * 7, atk: mb.atk * 1.6, def: mb.def * 1.3, exp: mb.exp * 8, gold: mb.gold * 10 };
  } else {
    const t = pick(zone.mobs), v = rand(0.9, 1.1);
    e = { n: t[0], i: t[1], maxHp: mb.hp * t[2] * v, atk: mb.atk * t[3] * v, def: mb.def * t[4], exp: mb.exp * v * (t[2] + t[3]) / 2, gold: mb.gold * v };
  }
  e.maxHp *= d.mul.hp; e.atk *= d.mul.atk; e.def *= d.mul.def;
  e.exp *= d.reward; e.gold *= d.reward;
  for (const k of ['maxHp', 'atk', 'def', 'exp', 'gold']) e[k] = Math.round(e[k]);
  e.hp = e.maxHp;
  e.lv = Z;
  B = {
    zi, isBoss, e, log: [`${e.i} ${e.n} ปรากฏตัว!`],
    eTurns: 0, charging: false, defending: false, enraged: false,
    atkUp: 0, poison: 0, poisonDmg: 0,
    fx: null, sub: null, result: null,
  };
  view = 'battle';
  render();
}

function calcDmg(atk, def, mult, opt = {}) {
  const base = atk * mult * rand(0.9, 1.1);
  let d = opt.ignoreDef ? base : base - def * 0.5;
  d = Math.max(d, base * 0.15);
  const crit = Math.random() * 100 < (opt.crit || 0);
  if (crit) d *= 1.6;
  return { dmg: Math.max(1, Math.round(d)), crit };
}

function log(msg) { B.log.unshift(msg); if (B.log.length > 30) B.log.pop(); }

function hitEnemy(mult, opt = {}) {
  const st = stats();
  const atk = st.atk * (B.atkUp > 0 ? 1.5 : 1);
  const r = calcDmg(atk, B.e.def, mult, { crit: st.crit + (opt.bonusCrit || 0), ignoreDef: opt.ignoreDef });
  B.e.hp = Math.max(0, B.e.hp - r.dmg);
  B.fx = { target: 'enemy', text: `-${fmt(r.dmg)}`, cls: r.crit ? 'crit' : 'dmg' };
  return r;
}

function playerAct(act, arg) {
  if (busy || !B || B.result) return;
  const st = stats();
  const e = B.e;
  B.sub = null;
  B.defending = false;

  if (act === 'attack') {
    const r = hitEnemy(1);
    log(`คุณโจมตี ${e.n} ${r.crit ? '💥คริติคอล! ' : ''}${fmt(r.dmg)} ดาเมจ`);
  } else if (act === 'skill') {
    const sk = CLASSES[S.cls].skills.find((s) => s.id === arg);
    if (!sk || S.mp < sk.mp || S.lv < sk.lv) return;
    S.mp -= sk.mp;
    if (sk.id === 'slash') {
      const r = hitEnemy(2);
      log(`${sk.icon} ${sk.name}! ${r.crit ? 'คริติคอล! ' : ''}${fmt(r.dmg)} ดาเมจ`);
    } else if (sk.id === 'warcry') {
      B.atkUp = 4; // ลดลงตอนจบเทิร์นนี้ → เหลือ 3
      log(`${sk.icon} ${sk.name}! พลังโจมตีเพิ่มขึ้น 50%`);
      B.fx = { target: 'player', text: 'ATK↑', cls: 'heal' };
    } else if (sk.id === 'fireball') {
      const r = hitEnemy(2.3, { ignoreDef: true });
      log(`${sk.icon} ${sk.name}! ${r.crit ? 'คริติคอล! ' : ''}${fmt(r.dmg)} ดาเมจ`);
    } else if (sk.id === 'heal') {
      const amt = Math.round(st.hp * 0.4);
      S.hp = Math.min(st.hp, S.hp + amt);
      B.fx = { target: 'player', text: `+${fmt(amt)}`, cls: 'heal' };
      log(`${sk.icon} ${sk.name}! ฟื้น HP ${fmt(amt)}`);
    } else if (sk.id === 'volley') {
      let total = 0, crits = 0;
      for (let k = 0; k < 3 && e.hp > 0; k++) { const r = hitEnemy(0.8, { bonusCrit: 10 }); total += r.dmg; if (r.crit) crits++; }
      B.fx = { target: 'enemy', text: `-${fmt(total)}`, cls: crits ? 'crit' : 'dmg' };
      log(`${sk.icon} ${sk.name}! รวม ${fmt(total)} ดาเมจ${crits ? ` (คริ ${crits} ดอก)` : ''}`);
    } else if (sk.id === 'poison') {
      const r = hitEnemy(1);
      B.poison = 3; B.poisonDmg = Math.round(st.atk * 0.6 + e.maxHp * 0.03);
      log(`${sk.icon} ${sk.name}! ${fmt(r.dmg)} ดาเมจ และติดพิษ`);
    }
  } else if (act === 'defend') {
    B.defending = true;
    const gain = Math.round(st.mp * 0.08);
    S.mp = Math.min(st.mp, S.mp + gain);
    log(`🛡️ คุณตั้งท่าป้องกัน (ฟื้น MP ${gain})`);
  } else if (act === 'item') {
    const p = POTIONS[arg];
    if (!p || !S.pots[arg]) return;
    usePotion(arg, true);
  } else if (act === 'flee') {
    if (B.isBoss) return;
    if (Math.random() < 0.65) {
      log('🏃 หนีสำเร็จ!');
      B.result = 'fled';
      save(); render();
      return;
    }
    log('🏃 หนีไม่พ้น!');
  }

  if (B.atkUp > 0) B.atkUp--;
  if (e.hp <= 0) return victory();
  busy = true;
  render();
  setTimeout(enemyTurn, 650);
}

function enemyTurn() {
  busy = false;
  if (!B || B.result) return;
  const e = B.e;
  const st = stats();
  const d = D();

  if (B.poison > 0) {
    e.hp = Math.max(0, e.hp - B.poisonDmg);
    B.poison--;
    log(`☠️ ${e.n} โดนพิษ ${fmt(B.poisonDmg)} ดาเมจ`);
    if (e.hp <= 0) return victory();
  }

  if (B.isBoss && d.enrage && !B.enraged && e.hp <= e.maxHp * d.enrage) {
    B.enraged = true;
    e.atk = Math.round(e.atk * 1.3);
    log(`😡 ${e.n} คลั่ง! พลังโจมตีเพิ่มขึ้น`);
  }

  B.eTurns++;
  let mult = 1, text;
  if (B.charging) {
    mult = 2.6; B.charging = false; text = `💢 ${e.n} ปล่อยท่าไม้ตาย!`;
  } else if (B.isBoss && B.eTurns % 3 === 0) {
    B.charging = true;
    log(`⚠️ ${e.n} กำลังรวบรวมพลัง! เทิร์นหน้ากด "ป้องกัน" ดีที่สุด`);
    B.fx = null;
    render();
    return;
  } else if (Math.random() < 0.15) {
    mult = 1.4; text = `${e.n} โจมตีอย่างดุเดือด!`;
  } else {
    text = `${e.n} โจมตี`;
  }
  let { dmg, crit } = calcDmg(e.atk, st.def, mult, { crit: d.eCrit });
  if (B.defending) dmg = Math.max(1, Math.round(dmg * 0.35));
  S.hp = Math.max(0, S.hp - dmg);
  B.fx = { target: 'player', text: `-${fmt(dmg)}`, cls: 'dmg' };
  log(`${text}${crit ? ' (คริติคอล!)' : ''} คุณเสีย ${fmt(dmg)} HP${B.defending ? ' (ป้องกันไว้)' : ''}`);
  B.defending = false;

  if (S.hp <= 0) return defeat();
  save();
  render();
}

function victory() {
  const z = ZONES[B.zi];
  const e = B.e;
  const d = D();
  const tier = zoneTier(B.zi);
  const rewards = { exp: e.exp, gold: e.gold, items: [], newItems: 0, levels: 0, pots: [], charm: 0 };
  S.gold += e.gold;
  S.wins++;
  S.bestiary[e.n] = (S.bestiary[e.n] || 0) + 1;

  if (B.isBoss) {
    const first = !P().bossWins[z.id];
    P().bossWins[z.id] = (P().bossWins[z.id] || 0) + 1;
    if (first || Math.random() < 0.25) rewards.items.push(makeUnique(z, tier));
    rewards.items.push(makeGear(tier, d.bossMinR, d.maxR));
    if (Math.random() < 0.5) { S.charms++; rewards.charm = 1; }
    if (B.zi === FINAL_ZONE && !S.clearedDiffs[S.diff]) { S.clearedDiffs[S.diff] = true; rewards.ending = S.diff; }
  } else {
    P().zoneKills[z.id] = (P().zoneKills[z.id] || 0) + 1;
    if (Math.random() < 0.28) rewards.items.push(makeGear(tier, d.minR, d.maxR));
    if (Math.random() < 0.3) {
      const k = Math.random() < 0.6 ? 'hp_s' : (Math.random() < 0.7 ? 'mp_s' : 'hp_l');
      S.pots[k]++; rewards.pots.push(k);
    }
  }
  for (const it of rewards.items) if (addItem(it)) rewards.newItems++;
  rewards.levels = gainExp(e.exp);

  log(`🏆 ชนะ ${e.n}!`);
  B.result = 'win';
  B.rewards = rewards;
  B.fx = null;
  save();
  render();
}

function gainExp(n) {
  S.exp += n;
  let ups = 0;
  while (S.exp >= expNeed(S.lv)) {
    S.exp -= expNeed(S.lv);
    S.lv++; ups++;
  }
  if (ups) { const st = stats(); S.hp = st.hp; S.mp = st.mp; }
  return ups;
}

function defeat() {
  const lost = Math.floor(S.gold * 0.3);
  S.gold -= lost;
  const st = stats();
  S.hp = Math.round(st.hp * 0.5); S.mp = Math.round(st.mp * 0.5);
  B.result = 'lose';
  B.lostGold = lost;
  log('💀 คุณพ่ายแพ้...');
  save();
  render();
}

function usePotion(k, inBattle) {
  const p = POTIONS[k];
  const st = stats();
  if (!S.pots[k]) return;
  S.pots[k]--;
  let msg;
  if (p.full) { S.hp = st.hp; S.mp = st.mp; msg = 'ฟื้นฟูเต็ม!'; }
  else if (p.hp) { const a = Math.min(Math.max(p.hp, Math.round(st.hp * p.hpPct)), st.hp - S.hp); S.hp += a; msg = `ฟื้น HP ${fmt(a)}`; }
  else if (p.mp) { const a = Math.min(Math.max(p.mp, Math.round(st.mp * p.mpPct)), st.mp - S.mp); S.mp += a; msg = `ฟื้น MP ${fmt(a)}`; }
  if (inBattle) { log(`${p.i} ใช้${p.n} ${msg}`); B.fx = { target: 'player', text: msg, cls: 'heal' }; }
  else { toast(`${p.i} ${msg}`); save(); render(); }
}

function setDifficulty(k) {
  if (!DIFFS[k] || (k !== 'normal' && !S.clearedDiffs.normal)) return;
  S.diff = k;
  P();
  const st = stats(); S.hp = st.hp; S.mp = st.mp;
  save();
  toast(`${DIFFS[k].icon} เปลี่ยนเป็นโหมด${DIFFS[k].name}`);
}

/* ---------------- UI ---------------- */

const app = document.getElementById('app');

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 2000);
}

function bar(cls, cur, max, label) {
  const pct = max ? clamp((cur / max) * 100, 0, 100) : 0;
  return `<div class="row"><div class="bar ${cls}"><i style="width:${pct}%"></i></div><span class="barlabel">${label}</span></div>`;
}

function hud() {
  const st = stats();
  const c = CLASSES[S.cls];
  const d = D();
  return `<div class="hud">
    <div class="row between">
      <div class="name">${c.icon} ${esc(S.name)} <span class="muted">Lv.${S.lv} ${c.name}</span></div>
      <div class="row" style="gap:10px"><span class="diff-badge d-${S.diff}">${d.icon} ${d.name}</span><span class="gold">💰 ${fmt(S.gold)}</span></div>
    </div>
    <div class="bars">
      ${bar('hp', S.hp, st.hp, `HP ${fmt(S.hp)}/${fmt(st.hp)}`)}
      ${bar('mp', S.mp, st.mp, `MP ${fmt(S.mp)}/${fmt(st.mp)}`)}
      ${bar('exp', S.exp, expNeed(S.lv), `EXP ${fmt(S.exp)}/${fmt(expNeed(S.lv))}`)}
    </div>
  </div>`;
}

function nav() {
  const items = [['town', '🏘️', 'เมือง'], ['map', '🗺️', 'ผจญภัย'], ['bag', '🎒', 'กระเป๋า'], ['collection', '📖', 'สะสม']];
  const sub = { shop: 'town', forge: 'town', diff: 'town' };
  return `<nav class="nav"><div class="in">${items.map(([v, i, n]) =>
    `<button data-a="go" data-v="${v}" class="${view === v || sub[view] === v ? 'on' : ''}"><span class="ico">${i}</span>${n}</button>`).join('')}</div></nav>`;
}

function render() {
  let html = '';
  if (view === 'title') html = renderTitle();
  else if (view === 'create') html = renderCreate();
  else {
    html = hud();
    if (view === 'town') html += renderTown();
    else if (view === 'shop') html += renderShop();
    else if (view === 'forge') html += renderForge();
    else if (view === 'diff') html += renderDiff();
    else if (view === 'map') html += renderMap();
    else if (view === 'battle') html += renderBattle();
    else if (view === 'bag') html += renderBag();
    else if (view === 'collection') html += renderCollection();
    if (view !== 'battle') html += nav();
  }
  app.innerHTML = html;
  const lg = app.querySelector('.log'); if (lg) lg.scrollTop = 0;
}

function renderTitle() {
  const has = !!load();
  return `<div class="title-screen">
    <div class="logo">⚔️</div>
    <h1>ตำนานผู้กล้า</h1>
    <div class="muted">RPG ผจญภัยแบบเทิร์นเบส • 10 ด่าน 10 บอส • ตีบวกอาวุธ • 3 ระดับความยาก</div>
    <div class="stack">
      ${has ? '<button class="primary" data-a="continue">▶ เล่นต่อ</button>' : ''}
      <button class="${has ? '' : 'primary'}" data-a="newgame">✨ เริ่มเกมใหม่</button>
    </div>
  </div>`;
}

function renderCreate() {
  const cs = createState;
  return `<div class="stack" style="padding-top:20px">
    <h2>สร้างตัวละคร</h2>
    <div class="card">
      <div class="muted" style="margin-bottom:6px">ชื่อผู้กล้า</div>
      <input type="text" id="pname" maxlength="16" placeholder="เช่น ไอ้เข้ม" value="${esc(cs.name)}" />
    </div>
    <div class="hero-stage">${heroSVG(cs.cls, { weapon: { key: { warrior: 'sword', mage: 'staff', archer: 'bow' }[cs.cls] + ':common', rarity: 'common' } }, 130)}</div>
    <div class="muted">เลือกอาชีพ</div>
    <div class="class-pick">
      ${Object.entries(CLASSES).map(([k, c]) => `
        <button data-a="pickcls" data-v="${k}" class="${cs.cls === k ? 'sel' : ''}">
          <span class="ico">${c.icon}</span>
          <span><b>${c.name}</b><span class="subtle">${c.desc}</span>
          <span class="subtle">สกิล: ${c.skills.map((s) => `${s.icon}${s.name}${s.lv > 1 ? ` (Lv.${s.lv})` : ''}`).join(' · ')}</span></span>
        </button>`).join('')}
    </div>
    <button class="primary" style="width:100%" data-a="create">เริ่มผจญภัย!</button>
    <button class="ghost" style="width:100%" data-a="go" data-v="title">ย้อนกลับ</button>
  </div>`;
}

function renderTown() {
  const st = stats();
  const innCost = innPrice();
  const full = S.hp >= st.hp && S.mp >= st.mp;
  const d = D();
  const msg = S.clearedDiffs[S.diff]
    ? `🎉 คุณโค่นจอมมารในโหมด${d.name}แล้ว! ${S.diff === 'advanced' ? 'คุณคือตำนานที่แท้จริง' : 'ลองท้าทายความยากที่สูงขึ้นดูสิ'}`
    : 'จอมมารกำลังคุกคามแผ่นดิน... ผู้กล้า จงออกเดินทาง!';
  return `<div class="card"><h2 style="margin-top:0">🏘️ หมู่บ้านเริ่มต้น</h2>
    <div class="muted">${msg}</div></div>
  <div class="menu-grid">
    <button class="primary wide" data-a="go" data-v="map"><span class="ico">🗺️</span> ออกผจญภัย</button>
    <button data-a="inn" ${full ? 'disabled' : ''}><span class="ico">🏨</span>โรงเตี๊ยม<span class="subtle">พักฟื้นเต็ม ${fmt(innCost)} 💰</span></button>
    <button data-a="go" data-v="shop"><span class="ico">🛒</span>ร้านค้า<span class="subtle">ยา หีบ & ยันต์</span></button>
    <button data-a="go" data-v="forge"><span class="ico">⚒️</span>ช่างตีเหล็ก<span class="subtle">ตีบวกอุปกรณ์</span></button>
    <button data-a="go" data-v="diff" class="${anyCleared() ? 'glow-btn' : ''}"><span class="ico">${anyCleared() ? '🎚️' : '🔒'}</span>ระดับความยาก<span class="subtle">${anyCleared() ? `ตอนนี้: ${d.name}` : 'ปลดล็อกเมื่อจบเกม'}</span></button>
  </div>
  <div class="card" style="margin-top:12px">
    <h3 style="margin-top:0">สถานะ</h3>
    <div class="row" style="align-items:flex-start">
    <div class="hero-stage small" data-a="go" data-v="bag">${heroSVG(S.cls, S.equip, 110)}</div>
    <div class="grid1 muted" style="flex:1">
      <div>⚔️ โจมตี: <b>${fmt(st.atk)}</b></div><div>🛡️ ป้องกัน: <b>${fmt(st.def)}</b></div>
      <div>❤️ HP สูงสุด: <b>${fmt(st.hp)}</b></div><div>🎯 คริติคอล: <b>${st.crit}%</b></div>
      <div>🏆 ชนะทั้งหมด: <b>${fmt(S.wins)}</b></div><div>👑 บอสที่ล้ม: <b>${bossesBeaten()}/${ZONES.length}</b></div>
    </div></div>
  </div>
  <button class="ghost small" style="width:100%;margin-top:6px" data-a="reset">🗑️ ลบเซฟ เริ่มใหม่</button>`;
}

const innPrice = () => 10 + S.lv * 3;
const chestPrice = () => 60 + maxTier() * 60;

function renderShop() {
  return `<div class="row between"><h2>🛒 ร้านค้า</h2><button class="small" data-a="go" data-v="town">← กลับ</button></div>
  <div class="card"><h3 style="margin-top:0">ยา</h3>
    ${Object.entries(POTIONS).map(([k, p]) => `<div class="item">
      <span class="ico">${p.i}</span>
      <div class="info"><div class="nm">${p.n} <span class="muted">(มี ${S.pots[k]})</span></div><div class="st">${p.desc}</div></div>
      <button class="small" data-a="buy" data-v="${k}" ${S.gold < p.price ? 'disabled' : ''}>${p.price} 💰</button>
    </div>`).join('')}
  </div>
  <div class="card"><h3 style="margin-top:0">ของพิเศษ</h3>
    <div class="item">
      <span class="ico">🎁</span>
      <div class="info"><div class="nm">หีบสมบัติ ${tierSuffix(maxTier())}</div><div class="st">สุ่มอุปกรณ์ 1 ชิ้น (ระดับตามพื้นที่ล่าสุดที่ปลดล็อก)</div></div>
      <button class="small" data-a="chest" ${S.gold < chestPrice() ? 'disabled' : ''}>${fmt(chestPrice())} 💰</button>
    </div>
    <div class="item">
      <span class="ico">🧿</span>
      <div class="info"><div class="nm">ยันต์คุ้มครอง <span class="muted">(มี ${S.charms})</span></div><div class="st">ใช้ตอนตีบวก +7 ขึ้นไป ถ้าล้มเหลวจะไม่ลดระดับ</div></div>
      <button class="small" data-a="buycharm" ${S.gold < charmPrice() ? 'disabled' : ''}>${fmt(charmPrice())} 💰</button>
    </div>
  </div>`;
}

function renderForge() {
  const all = [...Object.values(S.equip).filter(Boolean), ...S.bag.slice().sort((a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity] || b.value - a.value)];
  let sel = forgeSel != null ? findItem(forgeSel) : null;
  if (!sel && S.equip.weapon) { sel = S.equip.weapon; forgeSel = sel.uid; }
  let html = `<div class="row between"><h2>⚒️ ช่างตีเหล็ก</h2><button class="small" data-a="go" data-v="town">← กลับ</button></div>`;
  if (sel) {
    const maxed = sel.plus >= MAX_PLUS;
    const next = maxed ? null : plusStats(sel, sel.plus + 1);
    const rate = maxed ? 0 : FORGE_RATE[sel.plus];
    const cost = forgeCost(sel);
    const risky = sel.plus > FORGE_SAFE;
    const equipped = Object.values(S.equip).includes(sel);
    html += `<div class="card forge-card b-${sel.rarity}">
      <div class="forge-top">
        <div class="forge-ico ${forgeFx ? (forgeFx.ok ? 'ok' : 'fail') : ''}">${sel.icon}</div>
        <div style="flex:1;min-width:0">
          <div class="nm r-${sel.rarity}" style="font-family:Kanit;font-size:18px">${itemName(sel)}</div>
          <div class="muted" style="font-size:13px">${SLOT_NAME[sel.slot]} · ${rarityName(sel.rarity)}${equipped ? ' · <span class="up">สวมอยู่</span>' : ''}</div>
          <div class="plusbar">${Array.from({ length: MAX_PLUS }, (_, i) => `<i class="${i < sel.plus ? 'on' : ''} ${i >= FORGE_SAFE ? 'risk' : ''}"></i>`).join('')}</div>
        </div>
      </div>
      ${forgeFx ? `<div class="forge-msg ${forgeFx.ok ? 'up' : 'down'}">${forgeFx.text}</div>` : ''}
      <div class="forge-stats">
        ${Object.keys(sel.stats).map((k) => `<div><span class="muted">${STAT_NAME[k]}</span> <b>${fmt(sel.stats[k])}</b>${next ? ` <span class="up">→ ${fmt(next[k])}</span>` : ''}</div>`).join('')}
      </div>
      ${maxed ? '<div class="up" style="text-align:center;font-family:Kanit;margin-top:8px">🌟 ตีบวกสูงสุดแล้ว!</div>' : `
      <div class="row between" style="margin-top:10px;font-size:14px">
        <span>โอกาสสำเร็จ <b class="${rate >= 0.7 ? 'up' : rate >= 0.35 ? 'gold' : 'down'}">${Math.round(rate * 100)}%</b></span>
        <span class="muted">${risky ? 'ถ้าล้มเหลวจะลด -1' : 'ล้มเหลวไม่ลดระดับ'}</span>
      </div>
      ${risky ? `<label class="charm-toggle"><input type="checkbox" data-a="charm" ${forgeUseCharm ? 'checked' : ''} ${S.charms ? '' : 'disabled'}/> ใช้ยันต์คุ้มครอง 🧿 (มี ${S.charms})</label>` : ''}
      <button class="primary" style="width:100%;margin-top:10px" data-a="forge" ${S.gold < cost ? 'disabled' : ''}>🔨 ตีบวก +${sel.plus + 1} — ${fmt(cost)} 💰</button>`}
    </div>`;
  } else {
    html += `<div class="card muted" style="text-align:center">ยังไม่มีอุปกรณ์ให้ตีบวก</div>`;
  }
  html += `<div class="muted" style="margin:6px 0">เลือกอุปกรณ์</div>`;
  html += all.map((it) => `<div class="item b-${it.rarity} ${sel && it.uid === sel.uid ? 'sel' : ''}" data-a="forgesel" data-v="${it.uid}">
    <span class="ico">${it.icon}</span>
    <div class="info"><div class="nm r-${it.rarity}">${itemName(it)}</div>
      <div class="st">${Object.values(S.equip).includes(it) ? '✅ สวมอยู่ · ' : ''}${statText(it.stats)}</div></div>
  </div>`).join('');
  return html;
}

function renderDiff() {
  let html = `<div class="row between"><h2>🎚️ ระดับความยาก</h2><button class="small" data-a="go" data-v="town">← กลับ</button></div>`;
  if (!anyCleared()) html += `<div class="card muted">🔒 โค่นจอมมารในโหมดปกติให้ได้ก่อน แล้วจะเลือกโหมด <b>ยาก</b> และ <b>ขั้นสูง</b> ได้</div>`;
  html += `<div class="card muted" style="font-size:14px">เปลี่ยนความยากได้ตลอด เลเวล ทอง และไอเทมติดตัวไปด้วย ส่วนความคืบหน้าด่านแยกกันในแต่ละโหมด</div>`;
  html += DIFF_ORDER.map((k) => {
    const d = DIFFS[k];
    const locked = k !== 'normal' && !S.clearedDiffs.normal;
    const prog = S.prog[k] ? ZONES.filter((z) => S.prog[k].bossWins[z.id]).length : 0;
    const cur = S.diff === k;
    return `<div class="card diff-card d-${k} ${cur ? 'cur' : ''} ${locked ? 'locked' : ''}">
      <div class="row between"><h3 style="margin:0">${locked ? '🔒' : d.icon} ${d.name} ${S.clearedDiffs[k] ? '🏆' : ''}</h3>
        <span class="muted">มอนสเตอร์ Lv.${ZONES[0].lv + d.off}–${ZONES[FINAL_ZONE].lv + d.off}</span></div>
      <div class="muted" style="font-size:14px;margin:6px 0">${d.desc}</div>
      <div class="row between"><span class="muted" style="font-size:13px">บอสที่ล้ม ${prog}/${ZONES.length} · รางวัล ×${d.reward}</span>
        ${cur ? '<span class="tag">กำลังเล่น</span>' : `<button class="small ${locked ? '' : 'primary'}" data-a="setdiff" data-v="${k}" ${locked ? 'disabled' : ''}>เลือก</button>`}</div>
    </div>`;
  }).join('');
  return html;
}

function renderMap() {
  const d = D();
  return `<h2>🗺️ แผนที่โลก <span class="diff-badge d-${S.diff}">${d.icon} ${d.name}</span></h2>` + ZONES.map((z, i) => {
    const open = zoneUnlocked(i);
    const kills = P().zoneKills[z.id] || 0;
    const bossOpen = kills >= BOSS_UNLOCK_KILLS;
    const beaten = P().bossWins[z.id];
    return `<div class="card zone ${open ? '' : 'locked'}" style="${open ? `background:${z.bg}` : ''}">
      <div class="ico">${open ? z.icon : '🔒'}</div>
      <div class="info">
        <h3><span class="muted">${i + 1}.</span> ${z.name} <span class="muted">Lv.${zoneLevel(i)}+</span></h3>
        ${open ? `<div class="muted">บอส: ${z.boss[1]} ${z.boss[0]} ${beaten ? '✅' : ''}</div>
          <div class="row" style="margin-top:8px;flex-wrap:wrap">
            <button class="small primary" data-a="hunt" data-v="${i}">⚔️ ล่ามอนสเตอร์</button>
            <button class="small danger" data-a="boss" data-v="${i}" ${bossOpen ? '' : 'disabled'}>👑 ท้าบอส ${bossOpen ? '' : `(${kills}/${BOSS_UNLOCK_KILLS})`}</button>
          </div>`
        : `<div class="muted">ต้องโค่นบอส ${ZONES[i - 1].boss[0]} ก่อน</div>`}
      </div>
    </div>`;
  }).join('');
}

function renderBattle() {
  const z = ZONES[B.zi];
  const e = B.e;
  const st = stats();
  const fx = (t) => (B.fx && B.fx.target === t ? `<span class="float ${B.fx.cls}">${B.fx.text}</span>` : '');
  const hitCls = (t) => (B.fx && B.fx.target === t && B.fx.cls !== 'heal' ? 'hit' : '');
  const tags = [`<span class="tag">Lv.${e.lv}</span>`];
  if (B.isBoss) tags.push('<span class="tag warn">👑 บอส</span>');
  if (B.enraged) tags.push('<span class="tag warn">😡 คลั่ง</span>');
  if (B.charging) tags.push('<span class="tag warn">⚠️ กำลังชาร์จ</span>');
  if (B.poison) tags.push(`<span class="tag">☠️ พิษ ${B.poison}</span>`);
  const ptags = [];
  if (B.atkUp) ptags.push(`<span class="tag">📣 ATK↑ ${B.atkUp}</span>`);
  if (B.defending) ptags.push('<span class="tag">🛡️ ป้องกัน</span>');

  let html = `<div class="arena" style="background:${z.bg}">
    <div class="fighter">
      ${fx('enemy')}
      <div class="sprite ${B.isBoss ? 'boss' : ''} ${hitCls('enemy')} ${B.charging || B.enraged ? 'charge' : ''}">${e.i}</div>
      <div class="enemy-name">${e.n}</div>
      ${bar('hp', e.hp, e.maxHp, `${fmt(e.hp)}/${fmt(e.maxHp)}`)}
      <div>${tags.join('')}</div>
    </div>
    <div class="fighter" style="margin-top:18px">
      ${fx('player')}
      <div class="hero-battle ${hitCls('player')} ${B.fx && B.fx.target === 'enemy' ? 'lunge' : ''}">${heroSVG(S.cls, S.equip, 96)}</div>
      <div>${ptags.join('')}</div>
    </div>
  </div>
  <div class="log">${B.log.map((l) => `<div>${l}</div>`).join('')}</div>`;

  if (B.result) {
    html += battleResult();
  } else if (B.sub === 'skill') {
    html += `<div class="actions">${CLASSES[S.cls].skills.map((s) => {
      const locked = S.lv < s.lv;
      return `<button data-a="skill" data-v="${s.id}" ${locked || S.mp < s.mp || busy ? 'disabled' : ''}>
        ${s.icon} ${s.name}<span class="subtle">${locked ? `ปลดล็อก Lv.${s.lv}` : `${s.mp} MP · ${s.desc}`}</span></button>`;
    }).join('')}<button class="full ghost" data-a="sub" data-v="">← ย้อนกลับ</button></div>`;
  } else if (B.sub === 'item') {
    html += `<div class="actions">${Object.entries(POTIONS).map(([k, p]) =>
      `<button data-a="useitem" data-v="${k}" ${!S.pots[k] || busy ? 'disabled' : ''}>${p.i} ${p.n} ×${S.pots[k]}<span class="subtle">${p.desc}</span></button>`
    ).join('')}<button class="full ghost" data-a="sub" data-v="">← ย้อนกลับ</button></div>`;
  } else {
    const d = busy ? 'disabled' : '';
    html += `<div class="actions">
      <button class="primary" data-a="attack" ${d}>⚔️ โจมตี</button>
      <button data-a="sub" data-v="skill" ${d}>✨ สกิล<span class="subtle">MP ${fmt(S.mp)}/${fmt(st.mp)}</span></button>
      <button data-a="defend" ${d}>🛡️ ป้องกัน<span class="subtle">ลดดาเมจ 65%</span></button>
      <button data-a="sub" data-v="item" ${d}>🧪 ไอเทม</button>
      ${B.isBoss ? '' : `<button class="full ghost" data-a="flee" ${d}>🏃 หนี (65%)</button>`}
    </div>`;
  }
  return html;
}

function battleResult() {
  if (B.result === 'fled') {
    return `<div class="actions"><button class="primary" data-a="hunt" data-v="${B.zi}">⚔️ หาศัตรูใหม่</button><button data-a="leave">🏘️ กลับเมือง</button></div>`;
  }
  if (B.result === 'lose') {
    return `<div class="card" style="text-align:center"><div class="big">💀</div><h2>พ่ายแพ้...</h2>
      <div class="muted">คุณถูกหามกลับหมู่บ้าน เสียทอง ${fmt(B.lostGold)} 💰</div>
      <div class="muted" style="margin-top:6px;font-size:13px">💡 ลองเก็บเลเวลเพิ่ม เปลี่ยนอุปกรณ์ หรือไปตีบวกที่ช่างตีเหล็ก</div></div>
      <button class="primary" style="width:100%" data-a="leave">🏘️ กลับหมู่บ้าน</button>`;
  }
  const r = B.rewards;
  const items = r.items.map((it) => `<div class="item b-${it.rarity}">
    <span class="ico">${it.icon}</span>
    <div class="info"><div class="nm r-${it.rarity}">${itemName(it)}</div><div class="st">${rarityName(it.rarity)} · ${statText(it.stats)}</div></div>
  </div>`).join('');
  let ending = '';
  if (r.ending) {
    const nextOpts = DIFF_ORDER.filter((k) => k !== S.diff);
    const title = { normal: 'คุณโค่นจอมมารได้แล้ว!', hard: 'พิชิตโหมดยากสำเร็จ!', advanced: 'พิชิตโหมดขั้นสูง — ตำนานที่แท้จริง!' }[r.ending];
    ending = `<div class="card ending" style="text-align:center"><div class="big">🎉</div><h2>${title}</h2>
      <div class="muted">ขอบคุณที่เล่นนะ ผู้กล้า ${esc(S.name)}! เลือกความยากเพื่อผจญภัยต่อ (เลเวลและไอเทมติดตัวไปด้วย)</div>
      <div class="diff-pick">${nextOpts.map((k) => `<button class="d-${k}" data-a="setdiff" data-v="${k}">${DIFFS[k].icon} ${DIFFS[k].name}<span class="subtle">Lv.${ZONES[0].lv + DIFFS[k].off}+</span></button>`).join('')}
        <button data-a="leave">อยู่โหมด${DIFFS[S.diff].name}ต่อ</button></div></div>`;
  }
  return `<div class="card">
    <h3 style="margin-top:0">🏆 ชัยชนะ!</h3>
    <div>✨ +${fmt(r.exp)} EXP &nbsp; <span class="gold">💰 +${fmt(r.gold)}</span></div>
    ${r.levels ? `<div class="up" style="font-family:Kanit;font-size:18px;margin-top:6px">⬆️ เลเวลอัพ! ตอนนี้ Lv.${S.lv} (ฟื้นฟูเต็ม)</div>` : ''}
    ${r.pots.length ? `<div style="margin-top:6px">ได้ ${r.pots.map((k) => `${POTIONS[k].i} ${POTIONS[k].n}`).join(', ')}</div>` : ''}
    ${r.charm ? '<div style="margin-top:6px">ได้ 🧿 ยันต์คุ้มครอง</div>' : ''}
    ${items ? `<div style="margin-top:10px">${items}</div>` : ''}
    ${r.newItems ? `<div class="muted" style="margin-top:6px">📖 บันทึกไอเทมใหม่ลงสมุดสะสม ${r.newItems} ชิ้น</div>` : ''}
  </div>
  ${ending}
  ${ending ? '' : `<div class="actions">
    ${B.isBoss ? '' : `<button class="primary" data-a="hunt" data-v="${B.zi}">⚔️ สู้ต่อ</button>`}
    ${B.isBoss && B.zi < FINAL_ZONE ? `<button class="primary" data-a="go" data-v="map">🗺️ ไปด่านต่อไป</button>` : ''}
    <button class="${B.isBoss && B.zi === FINAL_ZONE ? 'primary full' : ''}" data-a="leave">🏘️ กลับเมือง</button>
  </div>`}`;
}

function renderBag() {
  const tab = (id, n) => `<button class="${bagTab === id ? 'on' : ''}" data-a="bagtab" data-v="${id}">${n}</button>`;
  const eq = (slot) => S.equip[slot] ? `<span class="r-${S.equip[slot].rarity}">${S.equip[slot].icon} ${itemName(S.equip[slot])}</span>` : '<span class="muted">ว่าง</span>';
  let html = `<h2>🎒 กระเป๋า</h2>
  <div class="card row" style="align-items:center">
    <div class="hero-stage small">${heroSVG(S.cls, S.equip, 110)}</div>
    <div style="flex:1;font-size:14px;line-height:1.8;min-width:0">
      <div>⚔️ ${eq('weapon')}</div><div>🛡️ ${eq('armor')}</div><div>💍 ${eq('accessory')}</div>
      <button class="small" style="margin-top:6px" data-a="go" data-v="forge">⚒️ ไปตีบวก</button>
    </div>
  </div>
  <div class="tabs">${tab('gear', 'อุปกรณ์')}${tab('equip', 'สวมใส่')}${tab('pots', 'ยา')}</div>`;
  if (bagTab === 'equip') {
    html += Object.keys(S.equip).map((slot) => {
      const it = S.equip[slot];
      return it ? `<div class="item b-${it.rarity}"><span class="ico">${it.icon}</span>
        <div class="info"><div class="nm r-${it.rarity}">${itemName(it)}</div><div class="st">${SLOT_NAME[slot]} · ${statText(it.stats)}</div></div>
        <button class="small" data-a="unequip" data-v="${slot}">ถอด</button></div>`
        : `<div class="item"><span class="ico" style="opacity:.3">➖</span><div class="info"><div class="nm muted">${SLOT_NAME[slot]}: ว่าง</div></div></div>`;
    }).join('');
  } else if (bagTab === 'pots') {
    html += Object.entries(POTIONS).map(([k, p]) => `<div class="item"><span class="ico">${p.i}</span>
      <div class="info"><div class="nm">${p.n} ×${S.pots[k]}</div><div class="st">${p.desc}</div></div>
      <button class="small" data-a="drink" data-v="${k}" ${S.pots[k] ? '' : 'disabled'}>ใช้</button></div>`).join('');
    html += `<div class="item"><span class="ico">🧿</span><div class="info"><div class="nm">ยันต์คุ้มครอง ×${S.charms}</div><div class="st">ใช้ที่ช่างตีเหล็ก</div></div></div>`;
  } else {
    if (!S.bag.length) html += `<div class="card muted" style="text-align:center">ยังไม่มีอุปกรณ์ — ไปล่ามอนสเตอร์หรือซื้อหีบสมบัติดูสิ!</div>`;
    else {
      const list = [...S.bag].sort((a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity] || b.value - a.value);
      html += `<div class="row between" style="margin-bottom:8px"><span class="muted">${S.bag.length} ชิ้น</span>
        <button class="small" data-a="sellcommon">ขายของธรรมดา/หายากทั้งหมด</button></div>`;
      html += list.map((it) => `<div class="item b-${it.rarity}"><span class="ico">${it.icon}</span>
        <div class="info"><div class="nm r-${it.rarity}">${itemName(it)}</div>
          <div class="st">${SLOT_NAME[it.slot]} · ${rarityName(it.rarity)} · ${statText(it.stats)}</div>
          <div class="st">เทียบของที่ใส่: ${compareText(it)}</div></div>
        <div class="stack" style="display:flex;flex-direction:column;gap:6px">
          <button class="small primary" data-a="equip" data-v="${it.uid}">ใส่</button>
          <button class="small" data-a="sell" data-v="${it.uid}">ขาย ${fmt(it.value)}</button>
        </div></div>`).join('');
    }
  }
  return html;
}

function collectionEntries() {
  const out = [];
  for (const slot of Object.keys(GEAR)) for (const b of GEAR[slot]) for (const r of RARITY)
    out.push({ key: `${b.k}:${r.id}`, icon: b.i, name: `${b.n} ${r.name}`, rarity: r.id });
  for (const z of ZONES) out.push({ key: `u:${z.id}`, icon: z.unique.i, name: z.unique.n, rarity: 'unique' });
  return out;
}
const collectionTotal = () => collectionEntries().length;
const collectionCount = () => collectionEntries().filter((e) => S.collection[e.key]).length;

function renderCollection() {
  const entries = collectionEntries();
  const got = collectionCount();
  const mons = ZONES.flatMap((z) => [...z.mobs.map((m) => ({ n: m[0], i: m[1] })), { n: z.boss[0], i: z.boss[1] }]);
  const monsGot = mons.filter((m) => S.bestiary[m.n]).length;
  return `<h2>📖 สมุดสะสม</h2>
  <div class="card"><div class="row between"><b>ไอเทม</b><span class="muted">${got}/${entries.length} (${Math.round((got / entries.length) * 100)}%)</span></div>
    ${bar('exp', got, entries.length, '')}
    <div class="coll" style="margin-top:12px">${entries.map((e) => S.collection[e.key]
      ? `<div class="cell b-${e.rarity}">${e.icon}<small class="r-${e.rarity}">${e.name}</small></div>`
      : `<div class="cell no">❓<small>???</small></div>`).join('')}</div>
  </div>
  <div class="card"><div class="row between"><b>สมุดมอนสเตอร์</b><span class="muted">${monsGot}/${mons.length}</span></div>
    <div class="coll" style="margin-top:12px">${mons.map((m) => S.bestiary[m.n]
      ? `<div class="cell">${m.i}<small>${m.n}<br>×${fmt(S.bestiary[m.n])}</small></div>`
      : `<div class="cell no">❓<small>???</small></div>`).join('')}</div>
  </div>`;
}

/* ---------------- การกดปุ่ม ---------------- */

document.addEventListener('input', (ev) => { if (ev.target.id === 'pname') createState.name = ev.target.value; });

document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-a]');
  if (!el || el.disabled) return;
  const a = el.dataset.a, v = el.dataset.v;

  switch (a) {
    case 'go': view = v; B = null; forgeFx = null; break;
    case 'continue': S = load(); view = 'town'; break;
    case 'newgame':
      if (load() && !confirm('มีเซฟเก่าอยู่ เริ่มใหม่จะลบเซฟเดิม ตกลงไหม?')) return;
      createState = { name: '', cls: 'warrior' }; view = 'create'; break;
    case 'pickcls': createState.cls = v; break;
    case 'create': {
      const name = (createState.name || '').trim() || 'ผู้กล้านิรนาม';
      newGame(name, createState.cls); view = 'town';
      toast(`ยินดีต้อนรับ ${name}!`); break;
    }
    case 'reset':
      if (!confirm('ลบเซฟทั้งหมดและเริ่มใหม่?')) return;
      localStorage.removeItem(SAVE_KEY); S = null; view = 'title'; break;
    case 'inn': {
      const cost = innPrice();
      if (S.gold < cost) { toast('ทองไม่พอ'); return; }
      S.gold -= cost; const st = stats(); S.hp = st.hp; S.mp = st.mp; save(); toast('😴 พักผ่อนจนสดชื่น!'); break;
    }
    case 'buy': {
      const p = POTIONS[v];
      if (S.gold < p.price) return;
      S.gold -= p.price; S.pots[v]++; save(); toast(`ซื้อ ${p.i} ${p.n}`); break;
    }
    case 'buycharm': {
      const c = charmPrice();
      if (S.gold < c) return;
      S.gold -= c; S.charms++; save(); toast('ซื้อ 🧿 ยันต์คุ้มครอง'); break;
    }
    case 'chest': {
      const cost = chestPrice();
      if (S.gold < cost) return;
      S.gold -= cost;
      const d = D();
      const it = makeGear(maxTier(), d.minR, d.maxR);
      const isNew = addItem(it); save();
      toast(`🎁 ได้ ${it.icon} ${it.name} (${rarityName(it.rarity)})${isNew ? ' — ใหม่!' : ''}`); break;
    }
    case 'forgesel': forgeSel = +v; forgeFx = null; break;
    case 'charm': forgeUseCharm = el.checked; return;
    case 'forge': forge(findItem(forgeSel)); break;
    case 'setdiff': {
      if (v === S.diff) { B = null; view = 'town'; break; }
      const d = DIFFS[v];
      if (!confirm(`เปลี่ยนเป็นโหมด${d.name}? (มอนสเตอร์เริ่มที่ Lv.${ZONES[0].lv + d.off})`)) return;
      setDifficulty(v); B = null; busy = false; view = 'map'; break;
    }
    case 'hunt': startBattle(+v, false); return;
    case 'boss': startBattle(+v, true); return;
    case 'leave': B = null; view = 'town'; busy = false; break;
    case 'attack': playerAct('attack'); return;
    case 'defend': playerAct('defend'); return;
    case 'flee': playerAct('flee'); return;
    case 'skill': playerAct('skill', v); return;
    case 'useitem': playerAct('item', v); return;
    case 'sub': B.sub = v || null; break;
    case 'bagtab': bagTab = v; break;
    case 'drink': usePotion(v, false); return;
    case 'equip': {
      const i = S.bag.findIndex((x) => x.uid === +v); if (i < 0) return;
      const it = S.bag.splice(i, 1)[0];
      if (S.equip[it.slot]) S.bag.push(S.equip[it.slot]);
      S.equip[it.slot] = it;
      const st = stats(); S.hp = Math.min(S.hp, st.hp); S.mp = Math.min(S.mp, st.mp);
      save(); toast(`สวมใส่ ${it.icon} ${itemNameText(it)}`); break;
    }
    case 'unequip': {
      const it = S.equip[v]; if (!it) return;
      S.bag.push(it); S.equip[v] = null;
      const st = stats(); S.hp = Math.min(S.hp, st.hp); S.mp = Math.min(S.mp, st.mp);
      save(); break;
    }
    case 'sell': {
      const i = S.bag.findIndex((x) => x.uid === +v); if (i < 0) return;
      const it = S.bag[i];
      if ((it.rarity === 'unique' || it.plus >= 5 || RARITY_ORDER[it.rarity] <= RARITY_ORDER.mythic) && !confirm(`ขาย ${itemNameText(it)} จริงไหม?`)) return;
      S.bag.splice(i, 1); S.gold += it.value; save(); toast(`ขายได้ ${fmt(it.value)} 💰`); break;
    }
    case 'sellcommon': {
      const sell = S.bag.filter((x) => (x.rarity === 'common' || x.rarity === 'rare') && !x.plus);
      if (!sell.length) { toast('ไม่มีของธรรมดา/หายากให้ขาย'); return; }
      const g = sell.reduce((s, x) => s + x.value, 0);
      S.bag = S.bag.filter((x) => !sell.includes(x)); S.gold += g; save();
      toast(`ขาย ${sell.length} ชิ้น ได้ ${fmt(g)} 💰`); break;
    }
    default: return;
  }
  render();
  if (['go', 'continue', 'leave', 'create', 'setdiff'].includes(a)) window.scrollTo(0, 0);
});

render();
