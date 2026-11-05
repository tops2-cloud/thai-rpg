'use strict';
/* ============================================================
   ตำนานผู้กล้า — Thai RPG (turn-based)
   เก็บเลเวล • สะสมไอเทม • ตีบวก • สู้บอส 10 ด่าน • 3 ระดับความยาก
   เซฟอัตโนมัติใน localStorage ของเบราว์เซอร์
   ============================================================ */

const SAVE_KEY = 'thai-rpg-save-v1';
const SAVE_VERSION = 3;
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
  },
  mage: {
    name: 'จอมเวท', icon: '🧙🏻', desc: 'เวทแรงทะลุเกราะ รักษาตัวเองได้ แต่ตัวบาง',
    base: { hp: 90, mp: 70, atk: 15, def: 5, crit: 5 },
    grow: { hp: 10, mp: 8, atk: 3.5, def: 1, crit: 0.3 },
  },
  archer: {
    name: 'นักธนู', icon: '🧝🏻', desc: 'คริติคอลสูง ยิงหลายดอก ใช้พิษได้',
    base: { hp: 105, mp: 45, atk: 12, def: 6, crit: 15 },
    grow: { hp: 12, mp: 5, atk: 3, def: 1.5, crit: 0.6 },
  },
};

/* สกิล 8 แบบต่ออาชีพ ปลดล็อกตามเลเวล เลือกใส่ได้ 4 ช่อง */
const SKILLS = {
  // นักรบ
  slash: { cls: 'warrior', lv: 1, mp: 8, name: 'ฟันสะบั้น', icon: '💥', desc: 'โจมตีแรง 200%' },
  warcry: { cls: 'warrior', lv: 3, mp: 12, name: 'คำรามศึก', icon: '📣', desc: 'พลังโจมตี +50% 3 เทิร์น' },
  bash: { cls: 'warrior', lv: 5, mp: 14, name: 'กระแทกโล่', icon: '🔨', desc: 'โจมตี 130% + ศัตรูมึน 1 เทิร์น ยกเลิกการชาร์จได้ (บอสติด 50%)' },
  ironwall: { cls: 'warrior', lv: 8, mp: 12, name: 'กำแพงเหล็ก', icon: '🧱', desc: 'ป้องกัน +60% 3 เทิร์น' },
  whirl: { cls: 'warrior', lv: 12, mp: 18, name: 'พายุดาบ', icon: '🌀', desc: 'ฟัน 3 ครั้ง ครั้งละ 90%' },
  bloodlust: { cls: 'warrior', lv: 16, mp: 16, name: 'ดาบดูดเลือด', icon: '🩸', desc: 'โจมตี 170% ฟื้น HP ครึ่งหนึ่งของดาเมจ' },
  earthsplit: { cls: 'warrior', lv: 20, mp: 30, name: 'ผ่าปฐพี', icon: '⛰️', desc: 'โจมตี 350% เจาะเกราะครึ่งหนึ่ง' },
  berserk: { cls: 'warrior', lv: 25, mp: 20, name: 'คลั่งศึก', icon: '😤', desc: 'พลังโจมตี ×2 แต่ป้องกัน -30% 3 เทิร์น' },
  // จอมเวท
  fireball: { cls: 'mage', lv: 1, mp: 10, name: 'ลูกไฟ', icon: '🔥', desc: 'เวท 230% ไม่สนเกราะ' },
  icebolt: { cls: 'mage', lv: 3, mp: 10, name: 'หอกน้ำแข็ง', icon: '🧊', desc: 'เวท 170% + ศัตรูโจมตีเบาลง 30% 2 เทิร์น' },
  heal: { cls: 'mage', lv: 5, mp: 15, name: 'แสงรักษา', icon: '✨', desc: 'ฟื้น HP 40%' },
  manashield: { cls: 'mage', lv: 8, mp: 14, name: 'เกราะมานา', icon: '🔵', desc: 'รับดาเมจลดลง 50% 3 เทิร์น' },
  lightning: { cls: 'mage', lv: 12, mp: 20, name: 'สายฟ้าฟาด', icon: '⚡', desc: 'เวท 300% ไม่สนเกราะ' },
  drain: { cls: 'mage', lv: 16, mp: 4, name: 'ดูดพลังเวท', icon: '💫', desc: 'เวท 120% + ฟื้น MP 20%' },
  meteor: { cls: 'mage', lv: 20, mp: 34, name: 'อุกกาบาต', icon: '☄️', desc: 'เวท 3 ลูก ลูกละ 140% ไม่สนเกราะ' },
  timestop: { cls: 'mage', lv: 25, mp: 24, name: 'หยุดเวลา', icon: '⏳', desc: 'ศัตรูหยุด 1 เทิร์น (บอสติด 50%) + ฟื้น HP 15%' },
  // นักธนู
  volley: { cls: 'archer', lv: 1, mp: 9, name: 'ฝนธนู', icon: '🌧️', desc: 'ยิง 3 ดอก ดอกละ 80% (+10% คริ)' },
  aimshot: { cls: 'archer', lv: 3, mp: 10, name: 'เล็งจุดตาย', icon: '🎯', desc: 'ยิง 180% โอกาสคริ +40%' },
  poison: { cls: 'archer', lv: 5, mp: 12, name: 'ธนูพิษ', icon: '☠️', desc: 'ยิง 100% + พิษ 3 เทิร์น' },
  evade: { cls: 'archer', lv: 8, mp: 10, name: 'ก้าวหลบ', icon: '💨', desc: 'หลบการโจมตีครั้งถัดไป (รวมท่าไม้ตาย)' },
  trap: { cls: 'archer', lv: 12, mp: 16, name: 'กับดักหนาม', icon: '🪤', desc: 'ยิง 100% + ศัตรูติดกับดัก 1 เทิร์น (บอสติด 50%)' },
  snipe: { cls: 'archer', lv: 16, mp: 18, name: 'ยิงทะลวง', icon: '🏹', desc: 'ยิง 260% ไม่สนเกราะ' },
  arrowstorm: { cls: 'archer', lv: 20, mp: 28, name: 'พายุศร', icon: '🌪️', desc: 'ยิง 5 ดอก ดอกละ 75% (+15% คริ)' },
  focus: { cls: 'archer', lv: 25, mp: 16, name: 'ตั้งสมาธิ', icon: '🧘', desc: 'พลังโจมตี +30% คริ +40% 3 เทิร์น' },
};
const SKILL_SLOTS = 4;

/* เลเวลสกิล: ใช้บ่อยแล้วเก่งขึ้น (สูงสุด Lv.10)
   ทุกเลเวล: แรง/ฮีล +8% · MP -3% · Lv.5 และ Lv.10: บัฟนานขึ้น +1 เทิร์น */
const SKILL_MAX_LV = 10;
const BUFF_SKILLS = new Set(['warcry', 'ironwall', 'berserk', 'manashield', 'focus']);
const skillUseNeed = (lv) => 8 + lv * 6;              // ครั้งที่ต้องใช้เพื่อขึ้นเลเวลถัดไป
const skillLv = (id) => (S && S.skillLv && S.skillLv[id] ? S.skillLv[id].lv : 1);
const skillPow = (id) => 1 + 0.08 * (skillLv(id) - 1);
const skillCost = (id) => Math.max(1, Math.round(SKILLS[id].mp * (1 - 0.03 * (skillLv(id) - 1))));
const skillDur = (id) => 4 + (skillLv(id) >= 5 ? 1 : 0) + (skillLv(id) >= 10 ? 1 : 0);
const stunResist = (id) => Math.max(0.2, 0.5 - 0.03 * (skillLv(id) - 1));
function skillGainXp(id) {
  if (!S.skillLv) S.skillLv = {};
  const r = S.skillLv[id] || (S.skillLv[id] = { lv: 1, xp: 0 });
  if (r.lv >= SKILL_MAX_LV) return false;
  r.xp++;
  if (r.xp < skillUseNeed(r.lv)) return false;
  r.xp = 0; r.lv++;
  return true;
}
const skillsOf = (cls) => Object.entries(SKILLS).filter(([, sk]) => sk.cls === cls).map(([id, sk]) => ({ id, ...sk }));
const defaultLoadout = (cls, lv) => {
  const ids = skillsOf(cls).filter((sk) => sk.lv <= lv).map((sk) => sk.id).slice(0, SKILL_SLOTS);
  while (ids.length < SKILL_SLOTS) ids.push(null);
  return ids;
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
    unique: { slot: 'necklace', n: 'ดวงตาสฟิงซ์', i: '👁️', bonus: { crit: 6 } } },
  { id: 'volcano', name: 'ภูเขาไฟ', icon: '🌋', lv: 10, suffix: 'แห่งเพลิง', bg: 'linear-gradient(180deg,#4a1d14,#22100c)',
    mobs: [['ภูตไฟ', '🔥', 0.85, 1.15, 0.8], ['โกเลมหิน', '🗿', 1.25, 0.95, 1.5], ['ซาลาแมนเดอร์', '🦎', 1, 1.1, 1]],
    boss: ['มังกรเพลิง', '🐲'],
    unique: { slot: 'necklace', n: 'หัวใจมังกร', i: '❤️‍🔥', bonus: { atkAdd: 2 } } },
  { id: 'swamp', name: 'หนองน้ำพิษ', icon: '🐸', lv: 13, suffix: 'แห่งบึงพิษ', bg: 'linear-gradient(180deg,#24391c,#0f1a0b)',
    mobs: [['กบยักษ์', '🐸', 1, 0.95, 0.9], ['จระเข้', '🐊', 1.25, 1.1, 1.3], ['ยุงพิษ', '🦟', 0.7, 1.2, 0.6]],
    boss: ['แม่มดหนองน้ำ', '🧙‍♀️'],
    unique: { slot: 'weapon', n: 'คทาแม่มดหนองน้ำ', i: '🌿', bonus: { mp: 8 } } },
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
    unique: { slot: 'cape', n: 'ปีกพญาครุฑ', i: '🪽', bonus: { crit: 8 } } },
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
  hard: { name: 'ยาก', icon: '🟠', off: 28, mul: { hp: 1.6, atk: 1.75, def: 1.15 }, tierAdd: 10, stars: '★', minR: 1, maxR: 4, bossMinR: 3, reward: 1.3, enrage: 0.3, eCrit: 5,
    desc: 'มอนสเตอร์ +28 เลเวล · บอสคลั่งเมื่อเลือดต่ำ · ดรอประดับเทพนิยาย' },
  advanced: { name: 'ขั้นสูง', icon: '🔴', off: 56, mul: { hp: 2.2, atk: 2.25, def: 1.3 }, tierAdd: 20, stars: '★★', minR: 2, maxR: 5, bossMinR: 4, reward: 1.6, enrage: 0.5, eCrit: 10,
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

/* m = ตัวคูณโจมตี, c = ตัวคูณคริ, mp = ให้ MP, minTier = ระดับไอเทมขั้นต่ำที่จะดรอป (อาวุธระดับสูง)
   h2 = อาวุธสองมือ (แรงกว่า ×1.4 · ก่อน Lv.51 ใช้มือซ้ายไม่ได้) */
const GEAR = {
  weapon: [
    { k: 'sword', n: 'ดาบ', i: '🗡️', m: 1, c: 1 },
    { k: 'axe', n: 'ขวาน', i: '🪓', m: 1.08, c: 0.8 },
    { k: 'staff', n: 'คทา', i: '🪄', m: 1, c: 1, mp: 1 },
    { k: 'bow', n: 'ธนู', i: '🏹', m: 0.95, c: 1.4, h2: true },
    { k: 'greatsword', n: 'ดาบใหญ่', i: '⚔️', m: 1.3, c: 0.9, minTier: 5, h2: true },
    { k: 'ngao', n: 'ง้าว', i: '🔱', m: 1.22, c: 1.2, minTier: 5, h2: true },
    { k: 'scythe', n: 'เคียวมรณะ', i: '🌙', m: 1.18, c: 1.7, minTier: 6, h2: true },
    { k: 'crystal', n: 'คทาคริสตัล', i: '💎', m: 1.2, c: 1.1, mp: 2, minTier: 6 },
    { k: 'crossbow', n: 'หน้าไม้', i: '🎯', m: 1.15, c: 1.9, minTier: 7, h2: true },
  ],
  offhand: [{ k: 'shield', n: 'โล่', i: '🔰' }, { k: 'orb', n: 'ลูกแก้ววิเศษ', i: '🔮' }, { k: 'dagger', n: 'มีดสั้น', i: '🔪' }],
  helmet: [{ k: 'helm', n: 'หมวกเหล็ก', i: '🪖' }, { k: 'circlet', n: 'รัดเกล้า', i: '💠' }, { k: 'chada', n: 'ชฎา', i: '👑', minTier: 5 }],
  armor: [{ k: 'leather', n: 'เกราะหนัง', i: '🦺' }, { k: 'plate', n: 'เกราะเหล็ก', i: '🛡️' }, { k: 'robe', n: 'เสื้อคลุม', i: '🥋' }],
  boots: [{ k: 'boots', n: 'รองเท้าหนัง', i: '👢' }, { k: 'greaves', n: 'รองเท้าเหล็ก', i: '🥾' }],
  cape: [{ k: 'cape', n: 'ผ้าคลุม', i: '🧣' }],
  necklace: [{ k: 'amulet', n: 'สร้อยคอ', i: '📿' }],
  ring: [{ k: 'ring', n: 'แหวน', i: '💍' }],
};
const GEAR_WEIGHT = { weapon: 3, offhand: 2, helmet: 2, armor: 2, boots: 2, cape: 1.2, necklace: 1.2, ring: 2 };
const TWO_HAND = new Set(['bow', 'crossbow', 'greatsword', 'ngao', 'scythe', 'u:sea']);
const isTwoHand = (it) => !!it && it.slot === 'weapon' && TWO_HAND.has(gearKind(it));
/* ช่องสวมใส่ 9 ช่อง */
const EQUIP_SLOTS = ['weapon', 'offhand', 'helmet', 'armor', 'boots', 'cape', 'necklace', 'ring1', 'ring2'];
const SLOT_NAME = { weapon: 'มือขวา', offhand: 'มือซ้าย', helmet: 'หมวก', armor: 'ชุดเกราะ', boots: 'รองเท้า', cape: 'ผ้าคลุม', necklace: 'สร้อยคอ', ring1: 'แหวนขวา', ring2: 'แหวนซ้าย' };
const SHORT_SLOT = { weapon: 'มือขวา', offhand: 'มือซ้าย', ring1: 'แหวนขวา', ring2: 'แหวนซ้าย' };
const CAT_NAME = { weapon: 'อาวุธ', offhand: 'มือซ้าย', helmet: 'หมวก', armor: 'ชุดเกราะ', boots: 'รองเท้า', cape: 'ผ้าคลุม', necklace: 'สร้อยคอ', ring: 'แหวน' };
const SLOT_ICON = { weapon: '⚔️', offhand: '🔰', helmet: '🪖', armor: '🛡️', boots: '👢', cape: '🧣', necklace: '📿', ring1: '💍', ring2: '💍' };
/* ถืออาวุธ 2 มือ: กดโจมตีจะตี 2 ครั้ง — ครั้งแรกมือขวาเต็มแรง ครั้งที่ 2 มือซ้ายแรง 50%
   (เช่น ครั้งแรก 100 + ครั้งที่ 2 50 = 150) */
const OFFHAND_HIT_RATE = 0.5;
const DUAL_LV = 51; // Lv.51 ขึ้นไป (มากกว่า 50): ใส่อาวุธสองมือที่มือซ้ายได้ด้วย
const freeDual = () => !!S && S.lv >= DUAL_LV;
const STAT_NAME = { atk: 'โจมตี', atk2: 'ตีครั้งที่ 2', def: 'ป้องกัน', hp: 'HP', mp: 'MP', crit: 'คริ%' };

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
let bagFilter = 'all';
let createState = { name: '', cls: 'warrior' };
let forgeSel = null;
let forgeUseCharm = false;
let forgeFx = null;
let busy = false;
let battleSeq = 0;
const ev = (o) => { if (B) B.events.push(o); };
const offWeapon = () => (S.equip.offhand && S.equip.offhand.slot === 'weapon' ? S.equip.offhand : null);
const dualWield = () => !!offWeapon() || gearKind(S.equip.offhand) === 'dagger';
/* พลังโจมตีของการตีครั้งที่ 2: ค่าพลังตัวละคร โดยเปลี่ยนอาวุธมือขวาเป็นอาวุธมือซ้าย (ดาเมจที่ได้ ×50%) */
function offhandAtk(st) {
  const off = offWeapon(); if (!off) return 0;
  const main = S.equip.weapon;
  return Math.max(1, (st || stats()).atk - (main ? main.stats.atk || 0 : 0) + (off.stats.atk || 0));
}

function save() { if (S) try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); autoBackup(); } catch (e) { /* ignore */ } }
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
  if (s.v < 3) {
    const catOf = (it) => {
      const k = gearKind(it);
      if (k === 'ring') return 'ring';
      if (k === 'u:sky') return 'cape';
      return 'necklace';
    };
    const fix = (it) => {
      if (!it) return;
      if (it.slot === 'accessory') it.slot = catOf(it);
      if (isTwoHand(it)) { for (const k in it.base) it.base[k] = Math.round(it.base[k] * 1.4); refreshItem(it); }
    };
    s.bag.forEach(fix);
    const old = s.equip; Object.values(old).forEach(fix);
    s.equip = Object.fromEntries(EQUIP_SLOTS.map((k) => [k, null]));
    s.equip.weapon = old.weapon || null; s.equip.armor = old.armor || null;
    const acc = old.accessory;
    if (acc) s.equip[acc.slot === 'ring' ? 'ring1' : acc.slot] = acc;
    s.v = 3;
  }
  for (const k of Object.keys(POTIONS)) if (s.pots[k] == null) s.pots[k] = 0;
  if (s.charms == null) s.charms = 0;
  if (!Array.isArray(s.loadout)) s.loadout = defaultLoadout(s.cls, s.lv);
  if (!s.skillLv) s.skillLv = {};
  migrateExtras(s);
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
    equip: Object.fromEntries(EQUIP_SLOTS.map((k) => [k, null])),
    bag: [], pots: { hp_s: 3, mp_s: 2, hp_l: 0, elixir: 0 }, charms: 0,
    diff: 'normal', prog: { normal: { zoneKills: {}, bossWins: {} } }, clearedDiffs: {},
    collection: {}, bestiary: {},
    uid: 1, wins: 0, loadout: defaultLoadout(cls, 1), skillLv: {},
  };
  migrateExtras(S);
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
  for (const slot of EQUIP_SLOTS) {
    const it = S.equip[slot];
    if (!it) continue;
    const st = effStats(it, slot);
    for (const k in st) s[k] = (s[k] || 0) + st[k];
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
  // ×1.3 HP / ×1.4 ATK ชดเชยช่องสวมใส่ 9 ช่อง + เลเวลสกิล
  return {
    hp: (28 + 14 * Z + 0.25 * Z * Z) * 1.3,
    atk: (8 + 2.9 * Z + 0.03 * Z * Z) * 1.4,
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

/* สูตรค่าพลังของอุปกรณ์แต่ละประเภท — ค่าแรกคือค่าหลัก (ใช้ตอนตีบวก) */
function slotStats(cat, b, t, roll, rm, ri) {
  const st = {};
  if (cat === 'weapon') {
    const h = b.h2 ? 1.4 : 1;
    st.atk = (2 + t * 4) * roll() * (b.m || 1) * h;
    if (ri >= 1 || (b.c || 1) > 1.2) st.crit = Math.max(1, t * 1.2 * rm * (b.c || 1) * (ri >= 1 ? 1 : 0.4) * (b.h2 ? 1.2 : 1));
    if (b.mp) st.mp = t * 3 * rm * b.mp;
  } else if (cat === 'offhand') {
    if (b.k === 'shield') { st.def = (1 + t * 2) * roll(); st.hp = t * 8 * roll(); }
    else if (b.k === 'orb') { st.atk = (1 + t * 1.6) * roll(); st.mp = t * 5 * rm; st.crit = (1 + t * 0.5) * rm; }
    else { st.atk = (1 + t * 2.2) * roll(); st.crit = (1 + t * 0.8) * rm; }
  } else if (cat === 'helmet') {
    const m = { helm: 1.15, circlet: 0.75, chada: 1.2 }[b.k] || 1;
    st.def = (1 + t * 1.5) * roll() * m; st.hp = t * 7 * roll();
    if (b.k !== 'helm') st.mp = t * 3 * rm;
    if (b.k === 'chada') st.crit = (1 + t * 0.5) * rm;
  } else if (cat === 'armor') {
    st.def = (1 + t * 3) * roll(); st.hp = t * 15 * roll();
  } else if (cat === 'boots') {
    st.def = (1 + t) * roll() * (b.k === 'greaves' ? 1.3 : 1); st.hp = t * 5 * roll();
    if (b.k === 'boots') st.crit = (1 + t * 0.3) * rm;
  } else if (cat === 'cape') {
    st.hp = t * 9 * roll(); st.def = t * 0.8 * roll();
    if (ri >= 2) st.crit = t * 0.6 * rm;
  } else if (cat === 'necklace') {
    st.hp = t * 10 * roll(); st.crit = (1 + t) * rm * 0.8;
    if (ri >= 2) st.atk = t * 1.6 * rm;
  } else { // ring
    st.atk = (1 + t) * roll(); st.crit = (1 + t * 0.4) * rm;
    if (ri >= 1) st.hp = t * 4 * rm;
  }
  for (const k in st) st[k] = Math.max(1, Math.round(st[k]));
  return st;
}

function pickCategory() {
  const total = Object.values(GEAR_WEIGHT).reduce((a, b) => a + b, 0);
  let x = Math.random() * total;
  for (const [k, w] of Object.entries(GEAR_WEIGHT)) { x -= w; if (x <= 0) return k; }
  return 'weapon';
}

function makeGear(tier, minR, maxR, forceSlot) {
  const cat = forceSlot || pickCategory();
  const base = pick(GEAR[cat].filter((b) => tier >= (b.minTier || 1)));
  const ri = rollRarity(minR, maxR);
  const r = RARITY[ri];
  const stats = slotStats(cat, base, tier, () => rand(0.85, 1.15) * r.m, r.m, ri);
  return finalizeItem({ slot: cat, key: `${base.k}:${r.id}`, name: `${base.n}${tierSuffix(tier)}`, icon: base.i, rarity: r.id, tier, stats });
}

function makeUnique(zone, tier) {
  const u = zone.unique, b = u.bonus || {};
  const kind = { forest: 'sword', swamp: 'staff', sea: 'ngao', castle: 'sword', cave: 'plate', ice: 'plate', spirit: 'robe', desert: 'amulet', volcano: 'amulet', sky: 'cape' }[zone.id];
  const baseDef = (GEAR[u.slot] || []).find((g) => g.k === kind) || { k: kind };
  const st = slotStats(u.slot, { ...baseDef, h2: TWO_HAND.has(`u:${zone.id}`) }, tier, () => 2.9, 2.6, 3);
  if (b.atkMul && st.atk) st.atk *= b.atkMul;
  if (b.defMul && st.def) st.def *= b.defMul;
  if (b.hpMul && st.hp) st.hp *= b.hpMul;
  if (b.crit) st.crit = (st.crit || 0) + b.crit;
  if (b.atkAdd) st.atk = (st.atk || 0) + tier * b.atkAdd * 2.6;
  if (b.mp) st.mp = (st.mp || 0) + tier * b.mp;
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
  const main = Object.keys(it.base)[0];
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

/* ค่าพลังที่ได้จริงเมื่อใส่ในช่องนั้น (ก่อน Lv.51 อาวุธมือซ้ายได้ 60%) */
function effStats(it, slot) {
  if (slot === 'offhand' && it.slot === 'weapon') {
    // อาวุธมือซ้าย: พลังโจมตีไปอยู่ที่การตีครั้งที่ 2 (50%), ค่าอื่นได้ครึ่งหนึ่ง
    const o = { atk2: Math.round((it.stats.atk || 0) * OFFHAND_HIT_RATE) };
    for (const k in it.stats) if (k !== 'atk') o[k] = Math.round(it.stats[k] * OFFHAND_HIT_RATE);
    return o;
  }
  return it.stats;
}

/* ช่องที่ไอเทมชิ้นนี้ใส่ได้ */
function equipTargets(it) {
  if (it.slot === 'weapon') return isTwoHand(it) && !freeDual() ? ['weapon'] : ['weapon', 'offhand'];
  if (it.slot === 'ring') return ['ring1', 'ring2'];
  return [it.slot];
}
const itemScore = (st) => (st.atk || 0) * 3 + (st.atk2 || 0) * 3 + (st.def || 0) * 3 + (st.hp || 0) * 0.4 + (st.crit || 0) * 3 + (st.mp || 0) * 0.3;
function defaultTarget(it) {
  if (it.slot === 'ring') {
    if (!S.equip.ring1) return 'ring1';
    if (!S.equip.ring2) return 'ring2';
    return itemScore(S.equip.ring1.stats) <= itemScore(S.equip.ring2.stats) ? 'ring1' : 'ring2';
  }
  return equipTargets(it)[0];
}

/* ไอเทมที่จะถูกถอดออก ถ้าใส่ชิ้นนี้ลงช่อง target */
function displaced(it, target) {
  const out = [];
  if (S.equip[target]) out.push([S.equip[target], target]);
  if (freeDual()) return out;
  // ก่อน Lv.51: อาวุธสองมือถือคู่กับ "อาวุธ" อีกเล่มไม่ได้ (แต่โล่/ลูกแก้ว/มีดสั้นใส่คู่ได้เสมอ)
  if (target === 'weapon' && isTwoHand(it) && S.equip.offhand && S.equip.offhand.slot === 'weapon') out.push([S.equip.offhand, 'offhand']);
  if (target === 'offhand' && it.slot === 'weapon' && isTwoHand(S.equip.weapon)) out.push([S.equip.weapon, 'weapon']);
  return out;
}

function compareText(it, target) {
  target = target || defaultTarget(it);
  const now = effStats(it, target);
  const lose = {};
  for (const [x, sl] of displaced(it, target)) { const st = effStats(x, sl); for (const k in st) lose[k] = (lose[k] || 0) + st[k]; }
  const keys = new Set([...Object.keys(now), ...Object.keys(lose)]);
  const parts = [];
  for (const k of keys) {
    const d = (now[k] || 0) - (lose[k] || 0);
    if (d) parts.push(`<span class="${d > 0 ? 'up' : 'down'}">${STAT_NAME[k]} ${d > 0 ? '+' : ''}${d}</span>`);
  }
  return parts.length ? parts.join(' ') : '<span class="muted">เท่าเดิม</span>';
}

function equipItem(it, target) {
  target = target || defaultTarget(it);
  if (!equipTargets(it).includes(target)) return;
  const i = S.bag.indexOf(it);
  if (i < 0) return;
  S.bag.splice(i, 1);
  const off = displaced(it, target);
  for (const [x, sl] of off) { S.equip[sl] = null; S.bag.push(x); }
  S.equip[target] = it;
  const st = stats(); S.hp = Math.min(S.hp, st.hp); S.mp = Math.min(S.mp, st.mp);
  save();
  const extra = off.filter(([, sl]) => sl !== target).map(([x]) => itemNameText(x));
  toast(`สวมใส่ ${it.icon} ${itemNameText(it)} (${SLOT_NAME[target]})${extra.length ? ` · ถอด ${extra.join(', ')}` : ''}`);
}

/* ---------------- ตีบวก ---------------- */

const rarityCost = (r) => (r === 'unique' ? 2.5 : RARITY.find((x) => x.id === r).cost);
const forgeCost = (it) => Math.round((15 + it.tier * 12) * rarityCost(it.rarity) * (1 + it.plus * 0.55));
const charmPrice = () => 100 + maxTier() * 40;

function findItem(uid) {
  for (const slot of EQUIP_SLOTS) if (S.equip[slot] && S.equip[slot].uid === uid) return S.equip[slot];
  return S.bag.find((x) => x.uid === uid) || null;
}

function forge(it) {
  if (!it || it.plus >= MAX_PLUS) return;
  const cost = forgeCost(it);
  if (S.gold < cost) { toast('ทองไม่พอ'); return; }
  track('forges');
  const useCharm = forgeUseCharm && S.charms > 0 && it.plus > FORGE_SAFE;
  S.gold -= cost;
  if (Math.random() < FORGE_RATE[it.plus]) {
    it.plus++;
    forgeFx = { ok: true, text: `✨ สำเร็จ! ${it.name} เป็น +${it.plus}` };
    if (it.plus > (S.track.forgeBest || 0)) S.track.forgeBest = it.plus;
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
    id: ++battleSeq, events: [],
    zi, isBoss, e, log: [`${e.i} ${e.n} ปรากฏตัว!`],
    eTurns: 0, charging: false, defending: false, enraged: false,
    atkUp: 0, berserk: 0, focus: 0, ironwall: 0, manaShield: 0, evade: false,
    stun: 0, slow: 0, poison: 0, poisonDmg: 0,
    sub: null, result: null,
  };
  view = 'battle';
  render();
}

function calcDmg(atk, def, mult, opt = {}) {
  const base = atk * mult * rand(0.9, 1.1);
  let d = opt.ignoreDef ? base : base - def * 0.5 * (1 - (opt.pierce || 0));
  d = Math.max(d, base * 0.15);
  const crit = Math.random() * 100 < (opt.crit || 0);
  if (crit) d *= 1.6;
  if (opt.post) d *= opt.post;
  return { dmg: Math.max(1, Math.round(d)), crit };
}

function log(msg) { B.log.unshift(msg); if (B.log.length > 30) B.log.pop(); }

function hitEnemy(mult, opt = {}) {
  const st = stats();
  const atk = (opt.atk != null ? opt.atk : st.atk) * (B.atkUp > 0 ? 1.5 : 1) * (B.berserk > 0 ? 2 : 1) * (B.focus > 0 ? 1.3 : 1);
  const crit = Math.min(95, st.crit + (opt.bonusCrit || 0) + (B.focus > 0 ? 40 : 0));
  const r = calcDmg(atk, B.e.def, mult * (B.skillMul || 1), { crit, ignoreDef: opt.ignoreDef, pierce: opt.pierce, post: opt.post });
  B.e.hp = Math.max(0, B.e.hp - r.dmg);
  if (r.crit) track('crits');
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
    if (offWeapon() && e.hp > 0) {
      const r2 = hitEnemy(1, { atk: offhandAtk(st), post: OFFHAND_HIT_RATE });
      log(`คุณโจมตี 2 ครั้ง! ${fmt(r.dmg)}${r.crit ? '💥' : ''} + ${fmt(r2.dmg)}${r2.crit ? '💥' : ''} = ${fmt(r.dmg + r2.dmg)} ดาเมจ`);
      ev({ a: 'melee', hits: [r, r2], twin: true });
    } else {
      log(`คุณโจมตี ${e.n} ${r.crit ? '💥คริติคอล! ' : ''}${fmt(r.dmg)} ดาเมจ`);
      ev({ a: 'melee', hits: [r], dual: dualWield() });
    }
  } else if (act === 'skill') {
    const sk = SKILLS[arg];
    if (!sk || sk.cls !== S.cls || S.mp < skillCost(arg) || S.lv < sk.lv || !S.loadout.includes(arg)) return;
    S.mp -= skillCost(arg);
    B.skillMul = skillPow(arg); B.curSkill = arg;
    useSkill(arg, sk, st, e);
    B.skillMul = 1; B.curSkill = null;
    track('skills');
    if (skillGainXp(arg)) {
      log(`⬆️ สกิล ${sk.icon} ${sk.name} เลเวลอัพ! Lv.${skillLv(arg)} (แรงขึ้น · ใช้ MP น้อยลง)`);
      ev({ a: 'num', t: 'hero', text: `${sk.icon} สกิล Lv.${skillLv(arg)}!`, cls: 'buff' });
      toast(`⬆️ ${sk.icon} ${sk.name} เลเวลอัพเป็น Lv.${skillLv(arg)}!`);
    }
  } else if (act === 'defend') {
    B.defending = true;
    const gain = Math.round(st.mp * 0.08);
    S.mp = Math.min(st.mp, S.mp + gain);
    log(`🛡️ คุณตั้งท่าป้องกัน (ฟื้น MP ${gain})`);
    ev({ a: 'aura', kind: 'shield', text: 'ป้องกัน' });
  } else if (act === 'item') {
    const p = POTIONS[arg];
    if (!p || !S.pots[arg]) return;
    usePotion(arg, true);
  } else if (act === 'flee') {
    if (B.isBoss) return;
    if (Math.random() < 0.65) {
      log('🏃 หนีสำเร็จ!');
      ev({ a: 'flee' });
      B.result = 'fled';
      save(); render();
      return;
    }
    log('🏃 หนีไม่พ้น!');
    ev({ a: 'num', t: 'hero', text: 'หนีไม่พ้น!', cls: 'warn' });
  }

  if (e.hp > 0) petAct(st);
  for (const k of ['atkUp', 'berserk', 'focus', 'ironwall', 'manaShield']) if (B[k] > 0) B[k]--;
  if (e.hp <= 0) return victory();
  busy = true;
  render();
  const sp = gameSpeed();
  setTimeout(enemyTurn, typeof stageQueueEnd === 'number' ? Math.max(650 / sp, stageQueueEnd - Date.now() + 120 / sp) : 650);
}

/* ผลของสกิลแต่ละแบบ (ค่า 4 เทิร์น = ลดลงทันทีตอนจบเทิร์นนี้ เหลือ 3) */
function multiHit(n, mult, opt) {
  const hits = [];
  for (let k = 0; k < n && B.e.hp > 0; k++) hits.push(hitEnemy(mult, opt));
  return hits;
}
function hitLog(sk, hits, extra = '') {
  const total = hits.reduce((a, h) => a + h.dmg, 0), crits = hits.filter((h) => h.crit).length;
  log(`${sk.icon} ${sk.name}! ${hits.length > 1 ? 'รวม ' : ''}${fmt(total)} ดาเมจ${crits ? (hits.length > 1 ? ` (คริ ${crits})` : ' คริติคอล!') : ''}${extra}`);
}
function tryStun(word) {
  if (B.isBoss && Math.random() < (B.curSkill ? stunResist(B.curSkill) : 0.5)) { log(`${B.e.n} ต้านทานได้!`); ev({ a: 'num', t: 'foe', text: 'ต้านทาน!', cls: 'warn' }); return; }
  B.stun = 1;
  const wasCharging = B.charging; B.charging = false;
  log(`💫 ${B.e.n} ${word}!${wasCharging ? ' การชาร์จถูกยกเลิก' : ''}`);
  ev({ a: 'stun', text: word });
}
function useSkill(id, sk, st, e) {
  const pw = skillPow(id), dur = skillDur(id);
  const heal = (amt) => { amt = Math.min(Math.round(amt * pw), st.hp - S.hp); S.hp += amt; return amt; };
  switch (id) {
    case 'slash': { const h = [hitEnemy(2)]; hitLog(sk, h); ev({ a: 'melee', big: true, hits: h, dual: dualWield() }); break; }
    case 'warcry': B.atkUp = dur; log(`${sk.icon} ${sk.name}! พลังโจมตี +50%`); ev({ a: 'aura', kind: 'buff', text: 'ATK↑' }); break;
    case 'bash': { const h = [hitEnemy(1.3)]; hitLog(sk, h); ev({ a: 'melee', big: true, hits: h }); if (e.hp > 0) tryStun('มึน'); break; }
    case 'ironwall': B.ironwall = dur; log(`${sk.icon} ${sk.name}! ป้องกัน +60%`); ev({ a: 'aura', kind: 'shield', text: 'DEF↑' }); break;
    case 'whirl': { const h = multiHit(3, 0.9); hitLog(sk, h); ev({ a: 'melee', hits: h, spin: true }); break; }
    case 'bloodlust': {
      const h = [hitEnemy(1.7)]; const amt = heal(h[0].dmg * 0.5);
      hitLog(sk, h, ` · ฟื้น HP ${fmt(amt)}`); ev({ a: 'melee', big: true, hits: h }); ev({ a: 'aura', kind: 'heal', text: `+${fmt(amt)}` }); break;
    }
    case 'earthsplit': { const h = [hitEnemy(3.5, { pierce: 0.5 })]; hitLog(sk, h); ev({ a: 'melee', big: true, quake: true, hits: h }); break; }
    case 'berserk': B.berserk = dur; log(`${sk.icon} ${sk.name}! พลังโจมตี ×2 แต่ป้องกันลดลง`); ev({ a: 'aura', kind: 'buff', text: 'ATK×2' }); break;
    case 'fireball': { const h = [hitEnemy(2.3, { ignoreDef: true })]; hitLog(sk, h); ev({ a: 'proj', kind: 'fire', hits: h }); break; }
    case 'icebolt': {
      const h = [hitEnemy(1.7, { ignoreDef: true })]; B.slow = 2;
      hitLog(sk, h, ' · ศัตรูหนาวสั่น'); ev({ a: 'proj', kind: 'ice', hits: h }); break;
    }
    case 'heal': { const amt = heal(st.hp * 0.4); ev({ a: 'aura', kind: 'heal', text: `+${fmt(amt)}` }); log(`${sk.icon} ${sk.name}! ฟื้น HP ${fmt(amt)}`); break; }
    case 'manashield': B.manaShield = dur; log(`${sk.icon} ${sk.name}! รับดาเมจลดลง 50%`); ev({ a: 'aura', kind: 'shield', text: 'บาเรีย' }); break;
    case 'lightning': { const h = [hitEnemy(3, { ignoreDef: true })]; hitLog(sk, h); ev({ a: 'bolt', hits: h }); break; }
    case 'drain': {
      const h = [hitEnemy(1.2, { ignoreDef: true })]; const g = Math.min(Math.round(st.mp * 0.2 * pw), st.mp - S.mp); S.mp += g;
      hitLog(sk, h, ` · ฟื้น MP ${fmt(g)}`); ev({ a: 'proj', kind: 'dark', hits: h }); ev({ a: 'aura', kind: 'mana', text: `+${fmt(g)} MP` }); break;
    }
    case 'meteor': { const h = multiHit(3, 1.4, { ignoreDef: true }); hitLog(sk, h); ev({ a: 'meteor', hits: h }); break; }
    case 'timestop': { const amt = heal(st.hp * 0.15); log(`${sk.icon} ${sk.name}! ฟื้น HP ${fmt(amt)}`); ev({ a: 'aura', kind: 'heal', text: `+${fmt(amt)}` }); tryStun('หยุดนิ่ง'); break; }
    case 'volley': { const h = multiHit(3, 0.8, { bonusCrit: 10 }); hitLog(sk, h); ev({ a: 'proj', kind: 'arrow', hits: h }); break; }
    case 'aimshot': { const h = [hitEnemy(1.8, { bonusCrit: 40 })]; hitLog(sk, h); ev({ a: 'proj', kind: 'arrow', hits: h }); break; }
    case 'poison': {
      const h = [hitEnemy(1)]; B.poison = 3; B.poisonDmg = Math.round((st.atk * 0.6 + e.maxHp * 0.03) * pw);
      hitLog(sk, h, ' และติดพิษ'); ev({ a: 'proj', kind: 'poison', hits: h }); break;
    }
    case 'evade': B.evade = true; log(`${sk.icon} ${sk.name}! พร้อมหลบการโจมตีครั้งถัดไป`); ev({ a: 'aura', kind: 'wind', text: 'หลบ' }); break;
    case 'trap': { const h = [hitEnemy(1)]; hitLog(sk, h); ev({ a: 'proj', kind: 'arrow', hits: h }); if (e.hp > 0) tryStun('ติดกับดัก'); break; }
    case 'snipe': { const h = [hitEnemy(2.6, { ignoreDef: true })]; hitLog(sk, h); ev({ a: 'proj', kind: 'arrow', big: true, hits: h }); break; }
    case 'arrowstorm': { const h = multiHit(5, 0.75, { bonusCrit: 15 }); hitLog(sk, h); ev({ a: 'proj', kind: 'arrow', hits: h }); break; }
    case 'focus': B.focus = dur; log(`${sk.icon} ${sk.name}! พลังโจมตี +30% คริ +40%`); ev({ a: 'aura', kind: 'buff', text: 'สมาธิ' }); break;
  }
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
    ev({ a: 'num', t: 'foe', text: `-${fmt(B.poisonDmg)}`, cls: 'poison' });
    if (e.hp <= 0) return victory();
  }

  if (B.isBoss && d.enrage && !B.enraged && e.hp <= e.maxHp * d.enrage) {
    B.enraged = true;
    e.atk = Math.round(e.atk * 1.3);
    log(`😡 ${e.n} คลั่ง! พลังโจมตีเพิ่มขึ้น`);
    ev({ a: 'enrage' });
  }

  if (B.stun > 0) {
    B.stun--;
    log(`💫 ${e.n} ขยับไม่ได้!`);
    ev({ a: 'num', t: 'foe', text: 'ขยับไม่ได้', cls: 'warn' });
    save(); render(); return;
  }

  B.eTurns++;
  let mult = 1, text;
  if (B.charging) {
    mult = 2.6; B.charging = false; text = `💢 ${e.n} ปล่อยท่าไม้ตาย!`;
  } else if (B.isBoss && B.eTurns % 3 === 0) {
    B.charging = true;
    log(`⚠️ ${e.n} กำลังรวบรวมพลัง! เทิร์นหน้ากด "ป้องกัน" ดีที่สุด`);
    ev({ a: 'charge' });
    render();
    return;
  } else if (Math.random() < 0.15) {
    mult = 1.4; text = `${e.n} โจมตีอย่างดุเดือด!`;
  } else {
    text = `${e.n} โจมตี`;
  }
  const myDef = st.def * (B.ironwall > 0 ? 1.6 : 1) * (B.berserk > 0 ? 0.7 : 1);
  const eAtk = e.atk * (B.slow > 0 ? 0.7 : 1);
  if (B.slow > 0) B.slow--;
  const petDodged = !B.evade && Math.random() < petDodge();
  if (B.evade || petDodged) {
    B.evade = false; B.defending = false;
    log(`${text} แต่คุณหลบได้! 💨${petDodged ? ' (ผีน้อยช่วย)' : ''}`);
    ev({ a: 'foeAtk', dmg: 0, miss: true, charged: mult > 2 });
    save(); render(); return;
  }
  let { dmg, crit } = calcDmg(eAtk, myDef, mult, { crit: d.eCrit });
  if (B.defending) dmg = Math.max(1, Math.round(dmg * 0.35));
  if (B.manaShield > 0) dmg = Math.max(1, Math.round(dmg * 0.5));
  if (petGuard()) dmg = Math.max(1, Math.round(dmg * (1 - petGuard())));
  S.hp = Math.max(0, S.hp - dmg);
  ev({ a: 'foeAtk', dmg, crit, big: mult > 1.3 && mult < 2, charged: mult > 2, defended: B.defending || B.manaShield > 0 });
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
  const oldLv = S.lv;
  rewards.levels = gainExp(e.exp);
  rewards.newSkills = unlockSkills(oldLv);
  rewards.dualUnlock = oldLv < DUAL_LV && S.lv >= DUAL_LV;
  onVictoryExtras(rewards);

  log(`🏆 ชนะ ${e.n}!`);
  ev({ a: 'foeDie' });
  B.result = 'win';
  B.rewards = rewards;
  save();
  render();
}

/* สกิลที่ปลดล็อกใหม่ — ใส่ลงช่องว่างให้อัตโนมัติ */
function unlockSkills(oldLv) {
  const fresh = skillsOf(S.cls).filter((sk) => sk.lv > oldLv && sk.lv <= S.lv);
  for (const sk of fresh) {
    const i = S.loadout.indexOf(null);
    if (i >= 0 && !S.loadout.includes(sk.id)) S.loadout[i] = sk.id;
  }
  return fresh;
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
  ev({ a: 'heroDie' });
  save();
  render();
}

function usePotion(k, inBattle) {
  const p = POTIONS[k];
  const st = stats();
  if (!S.pots[k]) return;
  S.pots[k]--;
  track('pots');
  let msg;
  if (p.full) { S.hp = st.hp; S.mp = st.mp; msg = 'ฟื้นฟูเต็ม!'; }
  else if (p.hp) { const a = Math.min(Math.max(p.hp, Math.round(st.hp * p.hpPct)), st.hp - S.hp); S.hp += a; msg = `ฟื้น HP ${fmt(a)}`; }
  else if (p.mp) { const a = Math.min(Math.max(p.mp, Math.round(st.mp * p.mpPct)), st.mp - S.mp); S.mp += a; msg = `ฟื้น MP ${fmt(a)}`; }
  if (inBattle) { log(`${p.i} ใช้${p.n} ${msg}`); ev({ a: 'aura', kind: p.mp && !p.hp ? 'mana' : 'heal', text: msg.replace(/^ฟื้น (HP|MP) /, '+') }); }
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
  const sub = { shop: 'town', forge: 'town', diff: 'town', skills: 'town', pets: 'town', quests: 'town', save: 'town' };
  return `<nav class="nav"><div class="in">${items.map(([v, i, n]) =>
    `<button data-a="go" data-v="${v}" class="${view === v || sub[view] === v ? 'on' : ''}"><span class="ico">${i}</span>${n}</button>`).join('')}</div></nav>`;
}

function render() {
  if (view === 'battle' && B) { renderBattleView(); return; }
  app.dataset.bid = '';
  let html = '';
  clearTimeout(autoTimer);
  if (view === 'title') html = renderTitle();
  else if (view === 'create') html = renderCreate();
  else if (view === 'save' && !S) html = renderSave();
  else {
    html = hud();
    if (view === 'town') html += renderTown();
    else if (view === 'shop') html += renderShop();
    else if (view === 'forge') html += renderForge();
    else if (view === 'diff') html += renderDiff();
    else if (view === 'skills') html += renderSkills();
    else if (view === 'pets') html += renderPets();
    else if (view === 'quests') html += renderQuests();
    else if (view === 'save') html += renderSave();
    else if (view === 'map') html += renderMap();
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
      <button class="ghost" data-a="go" data-v="save">📥 นำเข้าเซฟจากเครื่องอื่น</button>
      ${installButton()}
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
          <span class="subtle">สกิล ${skillsOf(k).length} แบบ: ${skillsOf(k).slice(0, 4).map((s) => `${s.icon}${s.name}`).join(' · ')} …</span></span>
        </button>`).join('')}
    </div>
    <button class="primary" style="width:100%" data-a="create">เริ่มผจญภัย!</button>
    <button class="ghost" style="width:100%" data-a="go" data-v="title">ย้อนกลับ</button>
  </div>`;
}

function renderTown() {
  ensureQuests();
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
    <button data-a="go" data-v="skills"><span class="ico">📜</span>สกิล<span class="subtle">${S.loadout.filter(Boolean).length}/${SKILL_SLOTS} ช่อง · ปลดล็อก ${skillsOf(S.cls).filter((k) => k.lv <= S.lv).length}/${skillsOf(S.cls).length}</span></button>
    <button data-a="go" data-v="pets"><span class="ico">🐾</span>สัตว์เลี้ยง<span class="subtle">${curPet() ? `${petDef(S.pet).n} Lv.${curPet().lv}` : `${S.pets.length}/${PETS.length} ตัว`}</span></button>
    <button data-a="go" data-v="quests" class="${claimable() ? 'glow-btn' : ''}"><span class="ico">📋</span>ภารกิจ${claimable() ? ` <span class="badge">${claimable()}</span>` : ''}<span class="subtle">ประจำวัน & ความสำเร็จ</span></button>
    <button data-a="go" data-v="diff" class="${anyCleared() ? 'glow-btn' : ''}"><span class="ico">${anyCleared() ? '🎚️' : '🔒'}</span>ระดับความยาก<span class="subtle">${anyCleared() ? `ตอนนี้: ${d.name}` : 'ปลดล็อกเมื่อจบเกม'}</span></button>
  </div>
  <div class="card" style="margin-top:12px">
    <h3 style="margin-top:0">สถานะ</h3>
    <div class="row" style="align-items:flex-start">
    <div class="hero-stage small" data-a="go" data-v="bag">${heroSVG(S.cls, S.equip, 110)}</div>
    <div class="grid1 muted" style="flex:1">
      <div>⚔️ โจมตี: <b>${fmt(st.atk)}</b>${offWeapon() ? ` <span style="font-size:12px">+ ${fmt(offhandAtk(st) * OFFHAND_HIT_RATE)}</span>` : ''}</div><div>🛡️ ป้องกัน: <b>${fmt(st.def)}</b></div>
      <div>❤️ HP สูงสุด: <b>${fmt(st.hp)}</b></div><div>🎯 คริติคอล: <b>${st.crit}%</b></div>
      <div>🏆 ชนะทั้งหมด: <b>${fmt(S.wins)}</b></div><div>👑 บอสที่ล้ม: <b>${bossesBeaten()}/${ZONES.length}</b></div>
    </div></div>
  </div>
  <div class="row" style="margin-top:6px"><button class="small" style="flex:1" data-a="go" data-v="save">💾 เซฟ & ตั้งค่า</button>
    <button class="ghost small" style="flex:1" data-a="reset">🗑️ ลบเซฟ เริ่มใหม่</button></div>
  ${installButton()}`;
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
          <div class="muted" style="font-size:13px">${CAT_NAME[sel.slot]} · ${rarityName(sel.rarity)}${equipped ? ' · <span class="up">สวมอยู่</span>' : ''}</div>
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

/* ฉากต่อสู้: สร้างโครงครั้งเดียวต่อการต่อสู้ แล้วอัปเดตเฉพาะส่วนที่เปลี่ยน (แอนิเมชันจะได้ไม่สะดุด) */
function renderBattleView() {
  if (app.dataset.bid !== String(B.id)) {
    app.innerHTML = `<div id="hudbox"></div>
      ${stageHTML(ZONES[B.zi], B.e, B.isBoss, heroSVG(S.cls, S.equip, 104))}
      <div class="log" id="blog"></div><div id="bact"></div>`;
    app.dataset.bid = String(B.id);
    stageQueueEnd = 0;
  }
  document.getElementById('hudbox').innerHTML = hud();
  stageUpdate(B);
  document.getElementById('blog').innerHTML = B.log.slice(0, 12).map((l) => `<div>${l}</div>`).join('');
  document.getElementById('bact').innerHTML = battleToolbar() + (B.result ? battleResult() : battleActions());
  stagePet(curPet());
  const evs = B.events; B.events = [];
  stagePlay(evs);
  scheduleAuto();
}

function battleActions() {
  const st = stats();
  if (B.sub === 'item') {
    return `<div class="actions">${Object.entries(POTIONS).map(([k, p]) =>
      `<button data-a="useitem" data-v="${k}" ${!S.pots[k] || busy ? 'disabled' : ''}>${p.i} ${p.n} ×${S.pots[k]}<span class="subtle">${p.desc}</span></button>`
    ).join('')}<button class="full ghost" data-a="sub" data-v="">← ย้อนกลับ</button></div>`;
  }
  const d = busy ? 'disabled' : '';
  const skillBtn = (id, i) => {
    if (!id) return `<button class="skill-btn empty" disabled><span class="sk-ico">➕</span><span class="sk-nm">ช่อง ${i + 1} ว่าง</span><span class="sk-mp">จัดที่หมู่บ้าน</span></button>`;
    const sk = SKILLS[id];
    const no = S.mp < skillCost(id);
    const lv = skillLv(id);
    return `<button class="skill-btn ${no ? 'nomp' : ''}" data-a="skill" data-v="${id}" ${no || busy ? 'disabled' : ''} title="${sk.desc}">
      ${lv > 1 ? `<span class="sk-lv ${lv >= SKILL_MAX_LV ? 'max' : ''}">Lv.${lv}</span>` : ''}
      <span class="sk-ico">${sk.icon}</span><span class="sk-nm">${sk.name}</span><span class="sk-mp">${skillCost(id)} MP</span></button>`;
  };
  return `<div class="actions">
    <button class="primary" data-a="attack" ${d}>⚔️ โจมตี</button>
    <button data-a="defend" ${d}>🛡️ ป้องกัน<span class="subtle">ลดดาเมจ 65% · ฟื้น MP</span></button>
  </div>
  <div class="skill-bar">${S.loadout.map(skillBtn).join('')}</div>
  <div class="actions">
    <button data-a="sub" data-v="item" ${d}>🧪 ไอเทม</button>
    ${B.isBoss ? `<button disabled class="ghost">MP ${fmt(S.mp)}/${fmt(st.mp)}</button>` : `<button class="ghost" data-a="flee" ${d}>🏃 หนี (65%)</button>`}
  </div>`;
}

let skillSlotSel = null;
function skillLvLine(id) {
  const lv = skillLv(id), r = (S.skillLv || {})[id] || { xp: 0 };
  const bonus = `แรง +${Math.round((skillPow(id) - 1) * 100)}% · MP -${Math.round(3 * (lv - 1))}%${skillDur(id) > 4 && BUFF_SKILLS.has(id) ? ` · บัฟ +${skillDur(id) - 4} เทิร์น` : ''}${['bash', 'trap', 'timestop'].includes(id) ? ` · บอสต้านทาน ${Math.round(stunResist(id) * 100)}%` : ''}`;
  return `<div class="sklv"><b class="${lv >= SKILL_MAX_LV ? 'gold' : ''}">สกิล Lv.${lv}${lv >= SKILL_MAX_LV ? ' (สูงสุด)' : ''}</b>
    ${lv < SKILL_MAX_LV ? bar('mp', r.xp, skillUseNeed(lv), `ใช้ ${r.xp}/${skillUseNeed(lv)}`) : ''}
    ${lv > 1 ? `<div class="st up">${bonus}</div>` : ''}</div>`;
}
function renderSkills() {
  const all = skillsOf(S.cls);
  let html = `<div class="row between"><h2>📜 สกิล${CLASSES[S.cls].name}</h2><button class="small" data-a="go" data-v="town">← กลับ</button></div>
  <div class="muted" style="font-size:14px;margin-bottom:8px">เลือกได้ ${SKILL_SLOTS} ช่องสำหรับใช้ในการต่อสู้ · แตะช่องเพื่อเลือก แล้วกด "ใส่" ที่สกิลด้านล่าง<br>
    ⬆️ ใช้สกิลบ่อยแล้วสกิลจะเลเวลอัพ (สูงสุด Lv.${SKILL_MAX_LV}): แรงขึ้น 8% · ใช้ MP น้อยลง 3% ต่อเลเวล · Lv.5/10 บัฟนานขึ้น</div>
  <div class="skill-slots">${S.loadout.map((id, i) => {
    const sk = id && SKILLS[id];
    return `<button class="sslot ${skillSlotSel === i ? 'on' : ''} ${sk ? 'has' : ''}" data-a="skillslot" data-v="${i}">
      <span class="sn">${i + 1}</span>${sk && skillLv(id) > 1 ? `<span class="sk-lv">Lv.${skillLv(id)}</span>` : ''}<span class="si">${sk ? sk.icon : '➕'}</span><span class="sl">${sk ? sk.name : 'ว่าง'}</span></button>`;
  }).join('')}</div>`;
  html += all.map((sk) => {
    const locked = S.lv < sk.lv;
    const at = S.loadout.indexOf(sk.id);
    return `<div class="item skill-card ${locked ? 'locked' : ''} ${at >= 0 ? 'equipped' : ''}">
      <span class="ico">${locked ? '🔒' : sk.icon}</span>
      <div class="info"><div class="nm">${sk.name} <span class="muted" style="font-size:13px">· ${skillCost(sk.id)} MP${locked ? ` · ปลดล็อก Lv.${sk.lv}` : ''}</span></div>
        <div class="st">${sk.desc}</div>
        ${locked ? '' : skillLvLine(sk.id)}</div>
      ${locked ? '' : at >= 0
        ? `<div class="btncol"><span class="tag">ช่อง ${at + 1}</span><button class="small" data-a="skillrm" data-v="${sk.id}">ถอด</button></div>`
        : `<button class="small primary" data-a="skillset" data-v="${sk.id}">ใส่${skillSlotSel != null ? ` ช่อง ${skillSlotSel + 1}` : ''}</button>`}
    </div>`;
  }).join('');
  return html;
}

function setSkill(id) {
  const sk = SKILLS[id];
  if (!sk || sk.cls !== S.cls || S.lv < sk.lv) return;
  let slot = skillSlotSel;
  if (slot == null) slot = S.loadout.indexOf(null);
  if (slot < 0) { toast('ช่องเต็มแล้ว — แตะช่องที่ต้องการเปลี่ยนก่อน'); return; }
  const cur = S.loadout.indexOf(id);
  if (cur >= 0) S.loadout[cur] = S.loadout[slot];
  S.loadout[slot] = id;
  skillSlotSel = null;
  save();
  toast(`${sk.icon} ${sk.name} → ช่อง ${slot + 1}`);
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
    ${extrasResultHTML(r)}
    ${r.dualUnlock ? `<div class="new-skill">⚔️⚔️ Lv.${DUAL_LV}! ปลดล็อกใส่อาวุธสองมือได้ทั้ง 2 มือ <button class="small" data-a="go" data-v="bag">ไปจัดอุปกรณ์</button></div>` : ''}
    ${r.newSkills && r.newSkills.length ? `<div class="new-skill">📜 ปลดล็อกสกิลใหม่: ${r.newSkills.map((sk) => `<b>${sk.icon} ${sk.name}</b>`).join(', ')}
      <button class="small" data-a="go" data-v="skills">จัดสกิล</button></div>` : ''}
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

let slotSel = null;

function slotCell(slot) {
  const it = S.equip[slot];
  const blocked = false;
  return `<button class="slot ${it ? `b-${it.rarity} has` : ''} ${slotSel === slot ? 'on' : ''}" data-a="slotsel" data-v="${slot}">
    <span class="si">${it ? it.icon : blocked ? '✋' : `<span class="ghost-ico">${SLOT_ICON[slot]}</span>`}</span>
    ${it && it.plus ? `<b class="splus">+${it.plus}</b>` : ''}
    <span class="sl">${blocked ? 'ใช้สองมือ' : SLOT_NAME[slot]}</span></button>`;
}

function renderEquipBoard() {
  // ซ้าย: หมวก / มือซ้าย / เกราะ / แหวนซ้าย · ขวา: สร้อย / มือขวา / รองเท้า / แหวนขวา · กลาง: ตัวละคร + ผ้าคลุม + ตีบวก
  const left = ['helmet', 'offhand', 'armor', 'ring2'];
  const right = ['necklace', 'weapon', 'boots', 'ring1'];
  let html = `<div class="card equip-board">
    <div class="eb-col">${left.map(slotCell).join('')}</div>
    <div class="eb-mid">
      <div class="eb-hero">${heroSVG(S.cls, S.equip, 116)}</div>
      <div class="eb-bottom">${slotCell('cape')}<button class="slot forge-slot" data-a="go" data-v="forge"><span class="si">⚒️</span><span class="sl">ตีบวก</span></button></div>
    </div>
    <div class="eb-col">${right.map(slotCell).join('')}</div>
  </div>
  <div class="dual-note ${freeDual() ? 'on' : ''}">${freeDual()
    ? '⚔️⚔️ ปลดล็อกแล้ว: ถืออาวุธอะไรก็ได้ทั้ง 2 มือ รวมอาวุธสองมือ'
    : `🔒 Lv.${DUAL_LV} ขึ้นไป: ถืออาวุธสองมือคู่กับอาวุธอีกเล่มได้ (ตอนนี้ Lv.${S.lv}) · โล่ ลูกแก้ว มีดสั้น ใส่คู่กับอาวุธอะไรก็ได้`}
    <br>ถืออาวุธ 2 มือ = กดโจมตีแล้วตี 2 ครั้ง: มือขวาเต็มแรง + มือซ้ายแรง 50%${offWeapon() ? ` · ตอนนี้ <b>${fmt(stats().atk)} + ${fmt(offhandAtk() * OFFHAND_HIT_RATE)}</b>` : ''}</div>`;
  if (slotSel) {
    const it = S.equip[slotSel];
    html += it ? `<div class="item b-${it.rarity} slot-detail"><span class="ico">${it.icon}</span>
        <div class="info"><div class="nm r-${it.rarity}">${itemName(it)}</div>
          <div class="st">${SLOT_NAME[slotSel]} · ${rarityName(it.rarity)}${isTwoHand(it) ? ' · อาวุธสองมือ' : ''}</div>
          <div class="st">${statText(effStats(it, slotSel))}${slotSel === 'offhand' && it.slot === 'weapon' ? ' (ตีครั้งที่ 2 แรง 50%)' : ''}</div></div>
        <button class="small" data-a="unequip" data-v="${slotSel}">ถอด</button></div>`
      : `<div class="item slot-detail"><span class="ico" style="opacity:.4">${SLOT_ICON[slotSel]}</span><div class="info"><div class="nm muted">${SLOT_NAME[slotSel]}: ว่าง</div>
          <div class="st">${slotSel === 'offhand' ? (freeDual() ? 'ใส่อาวุธอะไรก็ได้ (ตีครั้งที่ 2 แรง 50%) หรือโล่ ลูกแก้ว มีดสั้น' : isTwoHand(S.equip.weapon) ? `ใส่โล่ ลูกแก้ว มีดสั้นได้ (ถืออาวุธสองมืออยู่ — อาวุธอีกเล่มต้อง Lv.${DUAL_LV})` : 'ใส่โล่ ลูกแก้ว มีดสั้น หรืออาวุธมือเดียว (ตีครั้งที่ 2 แรง 50%)') : 'เลือกไอเทมจากกระเป๋าด้านล่าง'}</div></div></div>`;
  }
  return html;
}

function renderBag() {
  const tab = (id, n) => `<button class="${bagTab === id ? 'on' : ''}" data-a="bagtab" data-v="${id}">${n}</button>`;
  let html = `<h2>🎒 อุปกรณ์ & กระเป๋า</h2>${renderEquipBoard()}
  <div class="tabs">${tab('gear', 'อุปกรณ์')}${tab('pots', 'ยา')}</div>`;
  if (bagTab === 'pots') {
    html += Object.entries(POTIONS).map(([k, p]) => `<div class="item"><span class="ico">${p.i}</span>
      <div class="info"><div class="nm">${p.n} ×${S.pots[k]}</div><div class="st">${p.desc}</div></div>
      <button class="small" data-a="drink" data-v="${k}" ${S.pots[k] ? '' : 'disabled'}>ใช้</button></div>`).join('');
    html += `<div class="item"><span class="ico">🧿</span><div class="info"><div class="nm">ยันต์คุ้มครอง ×${S.charms}</div><div class="st">ใช้ที่ช่างตีเหล็ก</div></div></div>`;
    return html;
  }
  if (!S.bag.length) return html + `<div class="card muted" style="text-align:center">ยังไม่มีอุปกรณ์ — ไปล่ามอนสเตอร์หรือซื้อหีบสมบัติดูสิ!</div>`;
  const cats = ['all', ...Object.keys(GEAR)];
  html += `<div class="chips">${cats.map((c) => `<button class="chip ${bagFilter === c ? 'on' : ''}" data-a="bagfilter" data-v="${c}">${c === 'all' ? 'ทั้งหมด' : CAT_NAME[c]}</button>`).join('')}</div>`;
  const list = S.bag.filter((x) => bagFilter === 'all' || x.slot === bagFilter)
    .sort((a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity] || b.value - a.value);
  html += `<div class="row between" style="margin-bottom:8px"><span class="muted">${list.length}/${S.bag.length} ชิ้น</span>
    <button class="small" data-a="sellcommon">ขายของธรรมดา/หายากทั้งหมด</button></div>`;
  html += list.map((it) => {
    const tg = equipTargets(it);
    const btns = tg.length > 1
      ? tg.map((t) => `<button class="small primary" data-a="equip" data-v="${it.uid}" data-t="${t}">${SHORT_SLOT[t]}</button>`).join('')
      : `<button class="small primary" data-a="equip" data-v="${it.uid}" data-t="${tg[0]}">ใส่</button>`;
    return `<div class="item b-${it.rarity}"><span class="ico">${it.icon}</span>
      <div class="info"><div class="nm r-${it.rarity}">${itemName(it)}</div>
        <div class="st">${CAT_NAME[it.slot]}${isTwoHand(it) ? ' (สองมือ)' : ''} · ${rarityName(it.rarity)} · ${statText(it.stats)}</div>
        <div class="st">เทียบ: ${tg.map((t) => (tg.length > 1 ? `<span class="muted">${SHORT_SLOT[t]}:</span> ` : '') + compareText(it, t)).join(' &nbsp;')}</div></div>
      <div class="btncol">${btns}<button class="small" data-a="sell" data-v="${it.uid}">ขาย ${fmt(it.value)}</button></div></div>`;
  }).join('');
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
      ? `<div class="cell">${monsterSVG(m.n, 44, m.i)}<small>${m.n}<br>×${fmt(S.bestiary[m.n])}</small></div>`
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
    case 'go': view = v; B = null; busy = false; forgeFx = null; skillSlotSel = null; break;
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
      const it = S.bag.find((x) => x.uid === +v); if (!it) return;
      equipItem(it, el.dataset.t); break;
    }
    case 'unequip': {
      const it = S.equip[v]; if (!it) return;
      S.bag.push(it); S.equip[v] = null;
      const st = stats(); S.hp = Math.min(S.hp, st.hp); S.mp = Math.min(S.mp, st.mp);
      save(); break;
    }
    case 'slotsel': slotSel = slotSel === v ? null : v; if (S.equip[v]) forgeSel = S.equip[v].uid; break;
    case 'bagfilter': bagFilter = v; break;
    case 'skillslot': skillSlotSel = skillSlotSel === +v ? null : +v; break;
    case 'skillset': setSkill(v); break;
    case 'skillrm': { const i = S.loadout.indexOf(v); if (i >= 0) { S.loadout[i] = null; save(); } break; }
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
    default: if (!featureClick(a, v, el)) return;
  }
  render();
  if (['go', 'continue', 'leave', 'create', 'setdiff'].includes(a)) window.scrollTo(0, 0);
});

render();
