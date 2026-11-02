'use strict';
/* ============================================================
   ตำนานผู้กล้า — Thai RPG (turn-based)
   เก็บเลเวล • สะสมไอเทม • สู้บอส
   เซฟอัตโนมัติใน localStorage ของเบราว์เซอร์
   ============================================================ */

const SAVE_KEY = 'thai-rpg-save-v1';
const BOSS_UNLOCK_KILLS = 5;

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

const ZONES = [
  {
    id: 'forest', name: 'ป่าเขียวขจี', icon: '🌲', lv: 1, tier: 1, suffix: 'แห่งพงไพร',
    bg: 'linear-gradient(180deg,#1d3a2a,#13261c)',
    mobs: [
      { n: 'สไลม์', i: '🟢', hp: 30, atk: 8, def: 2, exp: 8, gold: 5 },
      { n: 'หมาป่า', i: '🐺', hp: 42, atk: 11, def: 3, exp: 12, gold: 7 },
      { n: 'ก็อบลิน', i: '👺', hp: 50, atk: 12, def: 4, exp: 15, gold: 10 },
    ],
    boss: { n: 'ราชาก็อบลิน', i: '👹', hp: 240, atk: 19, def: 7, exp: 90, gold: 80,
      unique: { slot: 'weapon', n: 'กระบองราชาก็อบลิน', i: '🏏', stats: { atk: 14, crit: 3 } } },
  },
  {
    id: 'cave', name: 'ถ้ำมืดมิด', icon: '🕳️', lv: 5, tier: 2, suffix: 'แห่งเงามืด',
    bg: 'linear-gradient(180deg,#25223a,#141221)',
    mobs: [
      { n: 'ค้างคาวแวมไพร์', i: '🦇', hp: 75, atk: 19, def: 6, exp: 26, gold: 15 },
      { n: 'แมงมุมยักษ์', i: '🕷️', hp: 90, atk: 21, def: 8, exp: 30, gold: 18 },
      { n: 'โครงกระดูก', i: '💀', hp: 100, atk: 23, def: 10, exp: 34, gold: 22 },
    ],
    boss: { n: 'นาคาพิษ', i: '🐍', hp: 520, atk: 33, def: 13, exp: 260, gold: 220,
      unique: { slot: 'armor', n: 'เกล็ดนาคา', i: '🐉', stats: { def: 16, hp: 70 } } },
  },
  {
    id: 'volcano', name: 'ภูเขาไฟ', icon: '🌋', lv: 10, tier: 3, suffix: 'แห่งเพลิง',
    bg: 'linear-gradient(180deg,#4a1d14,#22100c)',
    mobs: [
      { n: 'ภูตไฟ', i: '🔥', hp: 150, atk: 35, def: 12, exp: 55, gold: 35 },
      { n: 'โกเลมหิน', i: '🗿', hp: 200, atk: 33, def: 20, exp: 62, gold: 40 },
      { n: 'ซาลาแมนเดอร์', i: '🦎', hp: 170, atk: 39, def: 14, exp: 60, gold: 38 },
    ],
    boss: { n: 'มังกรเพลิง', i: '🐲', hp: 1000, atk: 54, def: 22, exp: 650, gold: 500,
      unique: { slot: 'accessory', n: 'หัวใจมังกร', i: '❤️‍🔥', stats: { atk: 12, hp: 120, crit: 8 } } },
  },
  {
    id: 'castle', name: 'ปราสาทจอมมาร', icon: '🏰', lv: 15, tier: 4, suffix: 'แห่งรัตติกาล',
    bg: 'linear-gradient(180deg,#2b1033,#12071a)',
    mobs: [
      { n: 'อัศวินดำ', i: '🛡️', hp: 270, atk: 54, def: 28, exp: 110, gold: 70 },
      { n: 'ปีศาจ', i: '😈', hp: 240, atk: 60, def: 22, exp: 115, gold: 75 },
      { n: 'ลิช', i: '🧟', hp: 250, atk: 64, def: 20, exp: 120, gold: 80 },
    ],
    boss: { n: 'จอมมาร', i: '👿', hp: 2300, atk: 82, def: 32, exp: 2000, gold: 2000,
      unique: { slot: 'weapon', n: 'ดาบสังหารมาร', i: '⚔️', stats: { atk: 45, crit: 10 } } },
  },
];

const RARITY = [
  { id: 'common', name: 'ธรรมดา', m: 1.0, w: 60 },
  { id: 'rare', name: 'หายาก', m: 1.4, w: 28 },
  { id: 'epic', name: 'มหากาพย์', m: 1.9, w: 10 },
  { id: 'legend', name: 'ตำนาน', m: 2.6, w: 2 },
];

const GEAR = {
  weapon: [{ k: 'sword', n: 'ดาบ', i: '🗡️' }, { k: 'axe', n: 'ขวาน', i: '🪓' }, { k: 'staff', n: 'คทา', i: '🪄' }, { k: 'bow', n: 'ธนู', i: '🏹' }],
  armor: [{ k: 'leather', n: 'เกราะหนัง', i: '🦺' }, { k: 'plate', n: 'เกราะเหล็ก', i: '🛡️' }, { k: 'robe', n: 'เสื้อคลุม', i: '🥋' }],
  accessory: [{ k: 'ring', n: 'แหวน', i: '💍' }, { k: 'amulet', n: 'สร้อยคอ', i: '📿' }],
};
const SLOT_NAME = { weapon: 'อาวุธ', armor: 'ชุดเกราะ', accessory: 'เครื่องประดับ' };
const STAT_NAME = { atk: 'โจมตี', def: 'ป้องกัน', hp: 'HP', mp: 'MP', crit: 'คริ%' };

const POTIONS = {
  hp_s: { n: 'ยาแดงเล็ก', i: '🧪', price: 15, desc: 'ฟื้น HP 60', hp: 60 },
  mp_s: { n: 'ยาฟ้า', i: '💧', price: 25, desc: 'ฟื้น MP 40', mp: 40 },
  hp_l: { n: 'ยาแดงใหญ่', i: '🍷', price: 60, desc: 'ฟื้น HP 250', hp: 250 },
  elixir: { n: 'น้ำอมฤต', i: '🌟', price: 300, desc: 'ฟื้น HP/MP เต็ม', full: true },
};

/* ---------------- สถานะเกม ---------------- */

let S = null;        // ข้อมูลที่เซฟ
let B = null;        // การต่อสู้ปัจจุบัน
let view = 'title';
let bagTab = 'gear';
let createState = { name: '', cls: 'warrior' };
let modal = null;
let busy = false;

function save() { if (S) try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } }
function load() {
  try { const raw = localStorage.getItem(SAVE_KEY); if (raw) return JSON.parse(raw); } catch (e) { /* ignore */ }
  return null;
}

function newGame(name, cls) {
  S = {
    v: 1, name, cls, lv: 1, exp: 0, gold: 60,
    hp: 0, mp: 0,
    equip: { weapon: null, armor: null, accessory: null },
    bag: [], pots: { hp_s: 3, mp_s: 2, hp_l: 0, elixir: 0 },
    zoneKills: {}, bossWins: {}, collection: {}, bestiary: {},
    uid: 1, wins: 0, cleared: false,
  };
  const starter = { warrior: ['sword', 'ดาบฝึกหัด', '🗡️'], mage: ['staff', 'คทาฝึกหัด', '🪄'], archer: ['bow', 'ธนูฝึกหัด', '🏹'] }[cls];
  S.equip.weapon = finalizeItem({ slot: 'weapon', key: `${starter[0]}:common`, name: starter[1], icon: starter[2], rarity: 'common', stats: { atk: 3 } });
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
  s.crit = clamp(s.crit, 0, 60);
  return s;
}

const expNeed = (lv) => Math.round(15 * Math.pow(lv, 1.6));
const zoneUnlocked = (i) => i === 0 || !!S.bossWins[ZONES[i - 1].id];
const maxTier = () => { let t = 1; ZONES.forEach((z, i) => { if (zoneUnlocked(i)) t = z.tier; }); return t; };

/* ---------------- ไอเทม ---------------- */

function rollRarity(min = 0) {
  const pool = RARITY.slice(min);
  let total = pool.reduce((a, r) => a + r.w, 0);
  let x = Math.random() * total;
  for (let i = 0; i < pool.length; i++) { x -= pool[i].w; if (x <= 0) return min + i; }
  return min;
}

function makeGear(tier, minRarity = 0) {
  const slot = pick(Object.keys(GEAR));
  const base = pick(GEAR[slot]);
  const ri = rollRarity(minRarity);
  const r = RARITY[ri];
  const roll = () => rand(0.85, 1.15) * r.m;
  const stats = {};
  if (slot === 'weapon') {
    stats.atk = Math.round((2 + tier * 4) * roll());
    if (ri >= 1) stats.crit = Math.round(tier * 1.2 * r.m);
  } else if (slot === 'armor') {
    stats.def = Math.round((1 + tier * 3) * roll());
    stats.hp = Math.round(tier * 15 * roll());
  } else {
    stats.hp = Math.round(tier * 12 * roll());
    stats.crit = Math.round((1 + tier) * r.m);
    if (ri >= 2) stats.atk = Math.round(tier * 2 * r.m);
  }
  const zone = ZONES[tier - 1];
  return finalizeItem({
    slot, key: `${base.k}:${r.id}`, name: `${base.n}${zone.suffix}`, icon: base.i, rarity: r.id, stats,
  });
}

function makeUnique(zone) {
  const u = zone.boss.unique;
  return finalizeItem({ slot: u.slot, key: `u:${zone.id}`, name: u.n, icon: u.i, rarity: 'unique', stats: { ...u.stats } });
}

function finalizeItem(it) {
  it.uid = S.uid++;
  const sum = (it.stats.atk || 0) * 3 + (it.stats.def || 0) * 3 + (it.stats.hp || 0) * 0.3 + (it.stats.crit || 0) * 4;
  it.value = Math.max(5, Math.round(sum * 1.5));
  return it;
}

function addItem(it) {
  S.bag.push(it);
  const isNew = !S.collection[it.key];
  S.collection[it.key] = true;
  return isNew;
}

const rarityName = (id) => id === 'unique' ? 'ไอเทมบอส' : RARITY.find((r) => r.id === id).name;
const statText = (st) => Object.entries(st).map(([k, v]) => `${STAT_NAME[k]} +${v}`).join(' · ');

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

/* ---------------- การต่อสู้ ---------------- */

function startBattle(zi, isBoss) {
  const zone = ZONES[zi];
  const tpl = isBoss ? zone.boss : pick(zone.mobs);
  const v = isBoss ? 1 : rand(0.9, 1.1);
  const e = {
    n: tpl.n, i: tpl.i,
    maxHp: Math.round(tpl.hp * v), atk: Math.round(tpl.atk * v), def: tpl.def,
    exp: Math.round(tpl.exp * v), gold: Math.round(tpl.gold * v),
  };
  e.hp = e.maxHp;
  B = {
    zi, isBoss, e, log: [`${e.i} ${e.n} ปรากฏตัว!`],
    eTurns: 0, charging: false, defending: false,
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
  B.fx = { target: 'enemy', text: `-${r.dmg}`, cls: r.crit ? 'crit' : 'dmg' };
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
    log(`คุณโจมตี ${e.n} ${r.crit ? '💥คริติคอล! ' : ''}${r.dmg} ดาเมจ`);
  } else if (act === 'skill') {
    const sk = CLASSES[S.cls].skills.find((s) => s.id === arg);
    if (!sk || S.mp < sk.mp || S.lv < sk.lv) return;
    S.mp -= sk.mp;
    if (sk.id === 'slash') {
      const r = hitEnemy(2);
      log(`${sk.icon} ${sk.name}! ${r.crit ? 'คริติคอล! ' : ''}${r.dmg} ดาเมจ`);
    } else if (sk.id === 'warcry') {
      B.atkUp = 4; // ลดลงตอนจบเทิร์นนี้ → เหลือ 3
      log(`${sk.icon} ${sk.name}! พลังโจมตีเพิ่มขึ้น 50%`);
      B.fx = { target: 'player', text: 'ATK↑', cls: 'heal' };
    } else if (sk.id === 'fireball') {
      const r = hitEnemy(2.3, { ignoreDef: true });
      log(`${sk.icon} ${sk.name}! ${r.crit ? 'คริติคอล! ' : ''}${r.dmg} ดาเมจ`);
    } else if (sk.id === 'heal') {
      const amt = Math.round(st.hp * 0.4);
      S.hp = Math.min(st.hp, S.hp + amt);
      B.fx = { target: 'player', text: `+${amt}`, cls: 'heal' };
      log(`${sk.icon} ${sk.name}! ฟื้น HP ${amt}`);
    } else if (sk.id === 'volley') {
      let total = 0, crits = 0;
      for (let k = 0; k < 3 && e.hp > 0; k++) { const r = hitEnemy(0.8, { bonusCrit: 10 }); total += r.dmg; if (r.crit) crits++; }
      B.fx = { target: 'enemy', text: `-${total}`, cls: crits ? 'crit' : 'dmg' };
      log(`${sk.icon} ${sk.name}! รวม ${total} ดาเมจ${crits ? ` (คริ ${crits} ดอก)` : ''}`);
    } else if (sk.id === 'poison') {
      const r = hitEnemy(1);
      B.poison = 3; B.poisonDmg = Math.round(st.atk * 0.6 + e.maxHp * 0.03);
      log(`${sk.icon} ${sk.name}! ${r.dmg} ดาเมจ และติดพิษ`);
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

  if (B.poison > 0) {
    e.hp = Math.max(0, e.hp - B.poisonDmg);
    B.poison--;
    log(`☠️ ${e.n} โดนพิษ ${B.poisonDmg} ดาเมจ`);
    if (e.hp <= 0) return victory();
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
  let { dmg } = calcDmg(e.atk, st.def, mult);
  if (B.defending) dmg = Math.max(1, Math.round(dmg * 0.35));
  S.hp = Math.max(0, S.hp - dmg);
  B.fx = { target: 'player', text: `-${dmg}`, cls: 'dmg' };
  log(`${text} คุณเสีย ${dmg} HP${B.defending ? ' (ป้องกันไว้)' : ''}`);
  B.defending = false;

  if (S.hp <= 0) return defeat();
  save();
  render();
}

function victory() {
  const z = ZONES[B.zi];
  const e = B.e;
  const rewards = { exp: e.exp, gold: e.gold, items: [], newItems: 0, levels: 0, pots: [] };
  S.gold += e.gold;
  S.wins++;
  S.bestiary[e.n] = (S.bestiary[e.n] || 0) + 1;

  if (B.isBoss) {
    const first = !S.bossWins[z.id];
    S.bossWins[z.id] = (S.bossWins[z.id] || 0) + 1;
    if (first || !S.collection[`u:${z.id}`] || Math.random() < 0.25) rewards.items.push(makeUnique(z));
    rewards.items.push(makeGear(z.tier, 2));
    if (z.id === 'castle' && !S.cleared) { S.cleared = true; rewards.ending = true; }
  } else {
    S.zoneKills[z.id] = (S.zoneKills[z.id] || 0) + 1;
    if (Math.random() < 0.28) rewards.items.push(makeGear(z.tier));
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
  else if (p.hp) { const a = Math.min(p.hp, st.hp - S.hp); S.hp += a; msg = `ฟื้น HP ${a}`; }
  else if (p.mp) { const a = Math.min(p.mp, st.mp - S.mp); S.mp += a; msg = `ฟื้น MP ${a}`; }
  if (inBattle) { log(`${p.i} ใช้${p.n} ${msg}`); B.fx = { target: 'player', text: msg, cls: 'heal' }; }
  else { toast(`${p.i} ${msg}`); save(); render(); }
}

/* ---------------- UI ---------------- */

const app = document.getElementById('app');

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 1800);
}

function bar(cls, cur, max, label) {
  const pct = max ? clamp((cur / max) * 100, 0, 100) : 0;
  return `<div class="row"><div class="bar ${cls}"><i style="width:${pct}%"></i></div><span class="barlabel">${label}</span></div>`;
}

function hud() {
  const st = stats();
  const c = CLASSES[S.cls];
  return `<div class="hud">
    <div class="row between">
      <div class="name">${c.icon} ${esc(S.name)} <span class="muted">Lv.${S.lv} ${c.name}</span></div>
      <div class="gold">💰 ${fmt(S.gold)}</div>
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
  return `<nav class="nav"><div class="in">${items.map(([v, i, n]) =>
    `<button data-a="go" data-v="${v}" class="${view === v || (view === 'shop' && v === 'town') ? 'on' : ''}"><span class="ico">${i}</span>${n}</button>`).join('')}</div></nav>`;
}

function render() {
  let html = '';
  if (view === 'title') html = renderTitle();
  else if (view === 'create') html = renderCreate();
  else {
    html = hud();
    if (view === 'town') html += renderTown();
    else if (view === 'shop') html += renderShop();
    else if (view === 'map') html += renderMap();
    else if (view === 'battle') html += renderBattle();
    else if (view === 'bag') html += renderBag();
    else if (view === 'collection') html += renderCollection();
    if (view !== 'battle') html += nav();
  }
  if (modal) html += modal;
  app.innerHTML = html;
  const lg = app.querySelector('.log'); if (lg) lg.scrollTop = 0;
}

function renderTitle() {
  const has = !!load();
  return `<div class="title-screen">
    <div class="logo">⚔️</div>
    <h1>ตำนานผู้กล้า</h1>
    <div class="muted">RPG ผจญภัยแบบเทิร์นเบส • เก็บเลเวล • สะสมไอเทม • โค่นบอส</div>
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
  return `<div class="card"><h2 style="margin-top:0">🏘️ หมู่บ้านเริ่มต้น</h2>
    <div class="muted">${S.cleared ? '🎉 คุณโค่นจอมมารแล้ว! โลกกลับมาสงบสุข — แต่ยังเก็บไอเทมต่อได้นะ' : 'จอมมารกำลังคุกคามแผ่นดิน... ผู้กล้า จงออกเดินทาง!'}</div></div>
  <div class="menu-grid">
    <button class="primary wide" data-a="go" data-v="map"><span class="ico">🗺️</span> ออกผจญภัย</button>
    <button data-a="inn" ${full ? 'disabled' : ''}><span class="ico">🏨</span>โรงเตี๊ยม<span class="subtle">พักฟื้นเต็ม ${innCost} 💰</span></button>
    <button data-a="go" data-v="shop"><span class="ico">🛒</span>ร้านค้า<span class="subtle">ยา & หีบสมบัติ</span></button>
    <button data-a="go" data-v="bag"><span class="ico">🎒</span>กระเป๋า<span class="subtle">${S.bag.length} ชิ้น</span></button>
    <button data-a="go" data-v="collection"><span class="ico">📖</span>สมุดสะสม<span class="subtle">${collectionCount()}/${collectionTotal()}</span></button>
  </div>
  <div class="card" style="margin-top:12px">
    <h3 style="margin-top:0">สถานะ</h3>
    <div class="row" style="align-items:flex-start">
    <div class="hero-stage small" data-a="go" data-v="bag">${heroSVG(S.cls, S.equip, 110)}</div>
    <div class="grid1 muted" style="flex:1">
      <div>⚔️ โจมตี: <b>${st.atk}</b></div><div>🛡️ ป้องกัน: <b>${st.def}</b></div>
      <div>❤️ HP สูงสุด: <b>${st.hp}</b></div><div>🎯 คริติคอล: <b>${st.crit}%</b></div>
      <div>🏆 ชนะทั้งหมด: <b>${S.wins}</b></div><div>👑 บอสที่ล้ม: <b>${Object.keys(S.bossWins).length}/4</b></div>
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
  <div class="card"><h3 style="margin-top:0">หีบสมบัติ</h3>
    <div class="item">
      <span class="ico">🎁</span>
      <div class="info"><div class="nm">หีบสมบัติ ${ZONES[maxTier() - 1].suffix}</div><div class="st">สุ่มอุปกรณ์ 1 ชิ้น (ระดับตามพื้นที่ล่าสุดที่ปลดล็อก)</div></div>
      <button class="small" data-a="chest" ${S.gold < chestPrice() ? 'disabled' : ''}>${chestPrice()} 💰</button>
    </div>
  </div>`;
}

function renderMap() {
  return `<h2>🗺️ แผนที่โลก</h2>` + ZONES.map((z, i) => {
    const open = zoneUnlocked(i);
    const kills = S.zoneKills[z.id] || 0;
    const bossOpen = kills >= BOSS_UNLOCK_KILLS;
    const beaten = S.bossWins[z.id];
    return `<div class="card zone ${open ? '' : 'locked'}" style="${open ? `background:${z.bg}` : ''}">
      <div class="ico">${open ? z.icon : '🔒'}</div>
      <div class="info">
        <h3>${z.name} <span class="muted">Lv.${z.lv}+</span></h3>
        ${open ? `<div class="muted">บอส: ${z.boss.i} ${z.boss.n} ${beaten ? '✅' : ''}</div>
          <div class="row" style="margin-top:8px;flex-wrap:wrap">
            <button class="small primary" data-a="hunt" data-v="${i}">⚔️ ล่ามอนสเตอร์</button>
            <button class="small danger" data-a="boss" data-v="${i}" ${bossOpen ? '' : 'disabled'}>👑 ท้าบอส ${bossOpen ? '' : `(${kills}/${BOSS_UNLOCK_KILLS})`}</button>
          </div>`
        : `<div class="muted">ต้องโค่นบอส ${ZONES[i - 1].boss.n} ก่อน</div>`}
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
  const tags = [];
  if (B.isBoss) tags.push('<span class="tag warn">👑 บอส</span>');
  if (B.charging) tags.push('<span class="tag warn">⚠️ กำลังชาร์จ</span>');
  if (B.poison) tags.push(`<span class="tag">☠️ พิษ ${B.poison}</span>`);
  const ptags = [];
  if (B.atkUp) ptags.push(`<span class="tag">📣 ATK↑ ${B.atkUp}</span>`);
  if (B.defending) ptags.push('<span class="tag">🛡️ ป้องกัน</span>');

  let html = `<div class="arena" style="background:${z.bg}">
    <div class="fighter">
      ${fx('enemy')}
      <div class="sprite ${B.isBoss ? 'boss' : ''} ${hitCls('enemy')} ${B.charging ? 'charge' : ''}">${e.i}</div>
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
      <button data-a="sub" data-v="skill" ${d}>✨ สกิล<span class="subtle">MP ${S.mp}/${st.mp}</span></button>
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
      <div class="muted">คุณถูกหามกลับหมู่บ้าน เสียทอง ${fmt(B.lostGold)} 💰</div></div>
      <button class="primary" style="width:100%" data-a="leave">🏘️ กลับหมู่บ้าน</button>`;
  }
  const r = B.rewards;
  const items = r.items.map((it) => `<div class="item b-${it.rarity}">
    <span class="ico">${it.icon}</span>
    <div class="info"><div class="nm r-${it.rarity}">${it.name}</div><div class="st">${rarityName(it.rarity)} · ${statText(it.stats)}</div></div>
  </div>`).join('');
  return `<div class="card">
    <h3 style="margin-top:0">🏆 ชัยชนะ!</h3>
    <div>✨ +${fmt(r.exp)} EXP &nbsp; <span class="gold">💰 +${fmt(r.gold)}</span></div>
    ${r.levels ? `<div class="up" style="font-family:Kanit;font-size:18px;margin-top:6px">⬆️ เลเวลอัพ! ตอนนี้ Lv.${S.lv} (ฟื้นฟูเต็ม)</div>` : ''}
    ${r.pots.length ? `<div style="margin-top:6px">ได้ ${r.pots.map((k) => `${POTIONS[k].i} ${POTIONS[k].n}`).join(', ')}</div>` : ''}
    ${items ? `<div style="margin-top:10px">${items}</div>` : ''}
    ${r.newItems ? `<div class="muted" style="margin-top:6px">📖 บันทึกไอเทมใหม่ลงสมุดสะสม ${r.newItems} ชิ้น</div>` : ''}
  </div>
  ${r.ending ? `<div class="card" style="text-align:center"><div class="big">🎉</div><h2>คุณโค่นจอมมารได้แล้ว!</h2><div class="muted">แผ่นดินกลับคืนสู่ความสงบ ขอบคุณที่เล่นนะ ผู้กล้า ${esc(S.name)}! เล่นต่อเพื่อสะสมไอเทมให้ครบได้</div></div>` : ''}
  <div class="actions">
    ${B.isBoss ? '' : `<button class="primary" data-a="hunt" data-v="${B.zi}">⚔️ สู้ต่อ</button>`}
    <button class="${B.isBoss ? 'primary full' : ''}" data-a="leave">🏘️ กลับเมือง</button>
  </div>`;
}

function renderBag() {
  const tab = (id, n) => `<button class="${bagTab === id ? 'on' : ''}" data-a="bagtab" data-v="${id}">${n}</button>`;
  const eq = (slot) => S.equip[slot] ? `<span class="r-${S.equip[slot].rarity}">${S.equip[slot].icon} ${S.equip[slot].name}</span>` : '<span class="muted">ว่าง</span>';
  let html = `<h2>🎒 กระเป๋า</h2>
  <div class="card row" style="align-items:center">
    <div class="hero-stage small">${heroSVG(S.cls, S.equip, 110)}</div>
    <div style="flex:1;font-size:14px;line-height:1.8">
      <div>⚔️ ${eq('weapon')}</div><div>🛡️ ${eq('armor')}</div><div>💍 ${eq('accessory')}</div>
    </div>
  </div>
  <div class="tabs">${tab('gear', 'อุปกรณ์')}${tab('equip', 'สวมใส่')}${tab('pots', 'ยา')}</div>`;
  if (bagTab === 'equip') {
    html += Object.keys(S.equip).map((slot) => {
      const it = S.equip[slot];
      return it ? `<div class="item b-${it.rarity}"><span class="ico">${it.icon}</span>
        <div class="info"><div class="nm r-${it.rarity}">${it.name}</div><div class="st">${SLOT_NAME[slot]} · ${statText(it.stats)}</div></div>
        <button class="small" data-a="unequip" data-v="${slot}">ถอด</button></div>`
        : `<div class="item"><span class="ico" style="opacity:.3">➖</span><div class="info"><div class="nm muted">${SLOT_NAME[slot]}: ว่าง</div></div></div>`;
    }).join('');
  } else if (bagTab === 'pots') {
    html += Object.entries(POTIONS).map(([k, p]) => `<div class="item"><span class="ico">${p.i}</span>
      <div class="info"><div class="nm">${p.n} ×${S.pots[k]}</div><div class="st">${p.desc}</div></div>
      <button class="small" data-a="drink" data-v="${k}" ${S.pots[k] ? '' : 'disabled'}>ใช้</button></div>`).join('');
  } else {
    if (!S.bag.length) html += `<div class="card muted" style="text-align:center">ยังไม่มีอุปกรณ์ — ไปล่ามอนสเตอร์หรือซื้อหีบสมบัติดูสิ!</div>`;
    else {
      const order = { unique: 0, legend: 1, epic: 2, rare: 3, common: 4 };
      const list = [...S.bag].sort((a, b) => order[a.rarity] - order[b.rarity] || b.value - a.value);
      html += `<div class="row between" style="margin-bottom:8px"><span class="muted">${S.bag.length} ชิ้น</span>
        <button class="small" data-a="sellcommon">ขายของธรรมดาทั้งหมด</button></div>`;
      html += list.map((it) => `<div class="item b-${it.rarity}"><span class="ico">${it.icon}</span>
        <div class="info"><div class="nm r-${it.rarity}">${it.name}</div>
          <div class="st">${SLOT_NAME[it.slot]} · ${rarityName(it.rarity)} · ${statText(it.stats)}</div>
          <div class="st">เทียบของที่ใส่: ${compareText(it)}</div></div>
        <div class="stack" style="display:flex;flex-direction:column;gap:6px">
          <button class="small primary" data-a="equip" data-v="${it.uid}">ใส่</button>
          <button class="small" data-a="sell" data-v="${it.uid}">ขาย ${it.value}</button>
        </div></div>`).join('');
    }
  }
  return html;
}

function collectionEntries() {
  const out = [];
  for (const slot of Object.keys(GEAR)) for (const b of GEAR[slot]) for (const r of RARITY)
    out.push({ key: `${b.k}:${r.id}`, icon: b.i, name: `${b.n} ${r.name}`, rarity: r.id });
  for (const z of ZONES) out.push({ key: `u:${z.id}`, icon: z.boss.unique.i, name: z.boss.unique.n, rarity: 'unique' });
  return out;
}
const collectionTotal = () => collectionEntries().length;
const collectionCount = () => collectionEntries().filter((e) => S.collection[e.key]).length;

function renderCollection() {
  const entries = collectionEntries();
  const got = collectionCount();
  const mons = ZONES.flatMap((z) => [...z.mobs, z.boss]);
  return `<h2>📖 สมุดสะสม</h2>
  <div class="card"><div class="row between"><b>ไอเทม</b><span class="muted">${got}/${entries.length} (${Math.round((got / entries.length) * 100)}%)</span></div>
    ${bar('exp', got, entries.length, '')}
    <div class="coll" style="margin-top:12px">${entries.map((e) => S.collection[e.key]
      ? `<div class="cell b-${e.rarity}">${e.icon}<small class="r-${e.rarity}">${e.name}</small></div>`
      : `<div class="cell no">❓<small>???</small></div>`).join('')}</div>
  </div>
  <div class="card"><b>สมุดมอนสเตอร์</b>
    <div class="coll" style="margin-top:12px">${mons.map((m) => S.bestiary[m.n]
      ? `<div class="cell">${m.i}<small>${m.n}<br>×${S.bestiary[m.n]}</small></div>`
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
    case 'go': view = v; B = null; break;
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
    case 'chest': {
      const cost = chestPrice();
      if (S.gold < cost) return;
      S.gold -= cost;
      const it = makeGear(maxTier());
      const isNew = addItem(it); save();
      toast(`🎁 ได้ ${it.icon} ${it.name} (${rarityName(it.rarity)})${isNew ? ' — ใหม่!' : ''}`); break;
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
      save(); toast(`สวมใส่ ${it.icon} ${it.name}`); break;
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
      if (it.rarity === 'unique' && !confirm(`ขาย ${it.name} จริงไหม? (ไอเทมบอส)`)) return;
      S.bag.splice(i, 1); S.gold += it.value; save(); toast(`ขายได้ ${it.value} 💰`); break;
    }
    case 'sellcommon': {
      const sell = S.bag.filter((x) => x.rarity === 'common');
      if (!sell.length) { toast('ไม่มีของธรรมดาให้ขาย'); return; }
      const g = sell.reduce((s, x) => s + x.value, 0);
      S.bag = S.bag.filter((x) => x.rarity !== 'common'); S.gold += g; save();
      toast(`ขาย ${sell.length} ชิ้น ได้ ${g} 💰`); break;
    }
    default: return;
  }
  render();
  if (a === 'go' || a === 'continue' || a === 'leave' || a === 'create') window.scrollTo(0, 0);
});

render();
