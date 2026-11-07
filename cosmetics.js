'use strict';
/* ============================================================
   👘 สกิน & ออร่า (ความสวยงามล้วน ไม่มีผลต่อค่าพลัง)
   - ตัวละครหลัก/สกิน: ภาพเต็มตัว (webp พื้นใส) ในโฟลเดอร์ chars/ และ skins/
   - ออร่า: เอฟเฟกต์อยู่ "ด้านหลัง" ตัวละครเสมอ
   ============================================================ */

/* ---------- ภาพตัวละครหลักของแต่ละคลาส [ปกติ, หลังเลื่อนขั้น] ---------- */
const FACE_LEFT = new Set(['chars/archer.webp', 'chars/hunter.webp', 'skins/archer_black.webp', 'skins/assassin.webp', 'skins/aquatic.webp', 'skins/phantom.webp', 'skins/chimera.webp', 'skins/crystal.webp', 'skins/archmage.webp']); // ภาพที่หันซ้าย → กลับด้านในฉากต่อสู้
const HERO_IMG = {
  warrior: ['chars/warrior.webp', 'chars/holy.webp'],
  mage: ['chars/mage.webp', 'chars/sage.webp'],
  archer: ['chars/archer.webp', 'chars/hunter.webp'],
};

/* ---------- สกิน (ภาพเต็มตัว แทนตัวละคร) — cls = ใช้ได้เฉพาะคลาสนั้น ---------- */
const SKINS = [
  { id: 'default', n: 'ชุดประจำคลาส', icon: '🙂', unlock: { free: true }, desc: 'ชุดปกติ (เลื่อนขั้นแล้วเปลี่ยนชุดเอง)' },
  // นักรบ
  { id: 'berserker', cls: 'warrior', n: 'เบอร์เซิร์กเกอร์', icon: '🪓', img: 'skins/berserker.webp', unlock: { gold: 20000 }, desc: 'เกราะแดงเขาปีศาจ' },
  { id: 'tan', cls: 'warrior', n: 'นักรบเผ่าเถื่อน', icon: '💪', img: 'skins/tan.webp', unlock: { gold: 50000 }, desc: 'กล้ามโต ขวานยักษ์' },
  { id: 'olympian', cls: 'warrior', n: 'นักรบโอลิมปัส', icon: '🏛️', img: 'skins/olympian.webp', unlock: { boss: 'volcano' }, desc: 'หมวกขนแดง ตรีศูล โล่ทอง' },
  { id: 'magitech', cls: 'warrior', n: 'นักรบจักรกลเวท', icon: '🤖', img: 'skins/magitech.webp', unlock: { hard: true }, desc: 'เกราะเหล็กเรืองแสงม่วง' },
  // จอมเวท
  { id: 'archmage', cls: 'mage', n: 'จอมเวทอัญชัน', icon: '🟣', img: 'skins/archmage.webp', unlock: { gold: 20000 }, desc: 'ผ้าคลุมม่วงลายดาว' },
  { id: 'crystal', cls: 'mage', n: 'คริสตัลแตกร้าว', icon: '💎', img: 'skins/crystal.webp', unlock: { boss: 'ice' }, desc: 'ร่างกายกลายเป็นคริสตัล' },
  { id: 'wreath', cls: 'mage', n: 'เซียนบรรลุธรรม', icon: '🧘', img: 'skins/wreath.webp', unlock: { hard: true }, desc: 'นั่งสมาธิลอยกลางอากาศ' },
  // นักธนู
  { id: 'archer_black', cls: 'archer', n: 'นักธนูเงา', icon: '🏹', img: 'skins/archer_black.webp', unlock: { gold: 15000 }, desc: 'ชุดพรางดำปิดหน้า' },
  { id: 'assassin', cls: 'archer', n: 'นักฆ่า', icon: '🥷', img: 'skins/assassin.webp', unlock: { gold: 40000 }, desc: 'นินจาชุดดำ' },
  { id: 'aquatic', cls: 'archer', n: 'อสูรใต้สมุทร', icon: '🐟', img: 'skins/aquatic.webp', unlock: { boss: 'sea' }, desc: 'มนุษย์ปลาถือธนูปะการัง' },
  { id: 'phantom', cls: 'archer', n: 'ภูตพรางกาย', icon: '👤', img: 'skins/phantom.webp', unlock: { boss: 'spirit' }, desc: 'นักฆ่าผ้าคลุมเงา มีดเรืองแสง' },
  // ทุกคลาส
  { id: 'chimera', n: 'ไคเมราจักรกล', icon: '🦁', img: 'skins/chimera.webp', unlock: { advanced: true }, desc: 'สิงโตจักรกลมีปีก' },
];

/* ---------- ออร่า (ภาพ อยู่ด้านหลังตัวละครเสมอ) — fx = แบบการเคลื่อนไหว ---------- */
const AURAS = [
  { id: 'sakura', n: 'ออร่าเยียวยา', icon: '🍃', img: 'auras/heal.webp', fx: 'pulse', unlock: { gold: 10000 }, desc: 'แสงเขียวอ่อนโยน' },
  { id: 'flame', n: 'โทสะเพลิง', icon: '🔥', img: 'auras/fire.webp', fx: 'flicker', unlock: { gold: 15000 }, desc: 'เปลวไฟลุกโชน' },
  { id: 'thunder', n: 'พายุฟ้าคำราม', icon: '⚡', img: 'auras/storm.webp', fx: 'spin', unlock: { gold: 30000 }, desc: 'เมฆพายุและสายฟ้า' },
  { id: 'rune', n: 'วงอักษรรูน', icon: '🔯', img: 'auras/ring.webp', fx: 'spin', unlock: { level: 30 }, desc: 'วงอักษรโบราณหมุนรอบตัว' },
  { id: 'poison', n: 'หมอกพิษ', icon: '☠️', img: 'auras/poison.webp', fx: 'pulse', unlock: { boss: 'swamp' }, desc: 'ควันพิษหัวกะโหลก' },
  { id: 'crystal', n: 'ดาวตก', icon: '🌠', img: 'auras/star.webp', fx: 'pulse', unlock: { boss: 'ice' }, desc: 'ดาวน้ำแข็งพุ่งลงมา' },
  { id: 'water', n: 'วงเวทวารี', icon: '💧', img: 'auras/water.webp', fx: 'spin', unlock: { boss: 'sea' }, desc: 'วงเวทแห่งสายน้ำ' },
  { id: 'wings', n: 'แสงศักดิ์สิทธิ์', icon: '✝️', img: 'auras/holy.webp', fx: 'pulse', unlock: { normal: true }, desc: 'แสงไม้กางเขนเจิดจ้า' },
  { id: 'mist', n: 'ฝูงเงา', icon: '👁️', img: 'auras/shadow.webp', fx: 'flicker', unlock: { adv: true }, desc: 'เงาตาเขียวรายล้อม' },
  { id: 'galaxy', n: 'หลุมดำจักรวาล', icon: '🌌', img: 'auras/void.webp', fx: 'spin', unlock: { advanced: true }, desc: 'หลุมดำหมุนวน' },
];

/* ---------- เงื่อนไขปลดล็อก ---------- */
function cosUnlockText(u) {
  if (u.free) return 'ฟรี';
  if (u.gold) return `💰 ${fmt(u.gold)}`;
  if (u.level) return `ถึง Lv.${u.level}`;
  if (u.boss) return `ล้มบอส ${ZONES.find((z) => z.id === u.boss).boss[0]}`;
  if (u.normal) return 'จบโหมดปกติ';
  if (u.hard) return 'จบโหมดยาก';
  if (u.advanced) return 'จบโหมดขั้นสูง';
  if (u.adv) return 'เลื่อนขั้นอาชีพ';
  return '';
}
function cosConditionMet(u) {
  if (u.free) return true;
  if (u.level) return S.lv >= u.level;
  if (u.boss) return Object.values(S.prog || {}).some((p) => p.bossWins && p.bossWins[u.boss]);
  if (u.normal) return !!S.clearedDiffs.normal;
  if (u.hard) return !!S.clearedDiffs.hard;
  if (u.advanced) return !!S.clearedDiffs.advanced;
  if (u.adv) return !!S.adv;
  return false; // ต้องซื้อด้วยทอง
}
const cosOwned = (type, d) => S.cos[type === 'skin' ? 'skins' : 'auras'].includes(d.id) || cosConditionMet(d.unlock);
const skinFits = (d, cls) => !d.cls || d.cls === cls;
const curSkin = () => SKINS.find((x) => x.id === (S && S.cos ? S.cos.skin : 'default')) || SKINS[0];
const curAura = () => (S && S.cos && S.cos.aura ? AURAS.find((x) => x.id === S.cos.aura) : null);

/* ---------- วาดตัวละคร + สกิน + ออร่า (ออร่าอยู่ด้านหลัง) ---------- */
function auraHTML(aura) {
  if (!aura) return '';
  return `<img class="aura-layer au-${aura.fx || 'pulse'}" src="${aura.img}" alt="" aria-hidden="true">`;
}
function heroArt(cls, equip, size, adv, opt = {}) {
  const skin = opt.skin !== undefined ? opt.skin : (S && S.cls === cls ? curSkin() : SKINS[0]);
  const aura = opt.aura !== undefined ? opt.aura : (S && S.cls === cls ? curAura() : null);
  if (adv === undefined) adv = typeof S !== 'undefined' && !!S && S.cls === cls && !!S.adv;
  const h = Math.round(size * 250 / 235);
  const src = skin && skin.img && skinFits(skin, cls) ? skin.img : HERO_IMG[cls][adv ? 1 : 0];
  const tier3 = opt.tier3 !== undefined ? opt.tier3 : (typeof S !== 'undefined' && !!S && S.cls === cls && !!S.adv3);
  return `<div class="hero-art ${tier3 ? 'tier3' : ''}" style="height:${h}px;min-width:${Math.round(h * 0.55)}px">${auraHTML(aura)}<img class="skin-img ${FACE_LEFT.has(src) ? 'face-left' : ''}" src="${src}" alt="" style="height:${h}px"></div>`;
}

/* ---------- หน้าสกิน & ออร่า ---------- */
let cosTab = 'skin';
let cosTry = null; // ลองสวม (พรีวิว) — { type, id }
function renderCosmetics() {
  const tab = (id, n) => `<button class="${cosTab === id ? 'on' : ''}" data-a="costab" data-v="${id}">${n}</button>`;
  let html = `<div class="row between"><h2>👘 สกิน & ออร่า</h2><button class="small" data-a="go" data-v="town">← กลับ</button></div>
    ${cosPreviewCard()}
    <div class="tabs">${tab('skin', `สกิน`)}${tab('aura', `ออร่า`)}</div>`;
  if (cosTab === 'skin') {
    html += `<div class="cos-grid">${SKINS.filter((d) => skinFits(d, S.cls)).map((d) => cosCard('skin', d, heroArt(S.cls, S.equip, 92, undefined, { skin: d, aura: null }))).join('')}</div>`;
  } else {
    html += `<div class="cos-grid">${cosCard('aura', { id: '', n: 'ไม่มีออร่า', icon: '⭕', unlock: { free: true }, desc: '' }, heroArt(S.cls, S.equip, 92, undefined, { aura: null }))}
      ${AURAS.map((d) => cosCard('aura', d, heroArt(S.cls, S.equip, 92, undefined, { aura: d }))).join('')}</div>`;
  }
  return html;
}
function cosPreviewCard() {
  let skin = curSkin(), aura = curAura(), label = '';
  if (cosTry) {
    if (cosTry.type === 'skin') skin = SKINS.find((x) => x.id === cosTry.id) || skin;
    else aura = cosTry.id ? AURAS.find((x) => x.id === cosTry.id) : null;
    const d = cosTry.type === 'skin' ? skin : aura;
    label = `<div class="try-label">👀 กำลังลองสวม: <b>${d ? d.n : 'ไม่มีออร่า'}</b>${d && !cosOwned(cosTry.type, d) ? ` · 🔒 ${cosUnlockText(d.unlock)}` : ''}
      <button class="small ghost" data-a="costry" data-v="">เลิกลอง</button></div>`;
  }
  return `<div class="card cos-preview"><div class="cos-prev-big">${heroArt(S.cls, S.equip, 170, undefined, { skin, aura })}</div>
    ${label || `<div class="muted" style="font-size:13px">สกิน: <b>${curSkin().n}</b> · ออร่า: <b>${curAura() ? curAura().n : 'ไม่มี'}</b><br>👆 แตะการ์ดเพื่อลองสวมก่อน · ความสวยงามล้วน ไม่มีผลต่อค่าพลัง</div>`}</div>`;
}

function cosCard(type, d, preview) {
  const owned = d.id === '' || cosOwned(type, d);
  const on = type === 'skin' ? curSkin().id === d.id : ((S.cos.aura || '') === d.id);
  const canBuy = !owned && d.unlock.gold && S.gold >= d.unlock.gold;
  return `<div class="cos-card ${on ? 'on' : ''} ${owned ? '' : 'locked'}">
    <div class="cos-prev" data-a="costry" data-t="${type}" data-v="${d.id}" title="แตะเพื่อลองสวม">${preview}<span class="try-hint">👀 ลอง</span></div>
    <b>${d.icon} ${d.n}</b>
    ${d.desc ? `<div class="muted" style="font-size:11px">${d.desc}</div>` : ''}
    ${on ? '<span class="tag">ใช้อยู่</span>'
      : owned ? `<button class="small primary" data-a="cosequip" data-t="${type}" data-v="${d.id}">ใช้</button>`
      : d.unlock.gold ? `<button class="small" data-a="cosbuy" data-t="${type}" data-v="${d.id}" ${canBuy ? '' : 'disabled'}>${cosUnlockText(d.unlock)}</button>`
      : `<span class="muted" style="font-size:12px">🔒 ${cosUnlockText(d.unlock)}</span>`}
  </div>`;
}

function migrateCosmetics(s) {
  if (!s.cos) s.cos = { skins: ['default'], auras: [], skin: 'default', aura: null };
  if (!SKINS.some((x) => x.id === s.cos.skin)) s.cos.skin = 'default'; // สกินแบบเปลี่ยนสีเดิมถูกเลิกใช้
  return s;
}

function cosClick(a, v, el) {
  if (a === 'costab') { cosTab = v; cosTry = null; return true; }
  if (a === 'costry') { cosTry = v || el.dataset.t ? { type: el.dataset.t || 'skin', id: v } : null; if (!el.dataset.t) cosTry = null; window.scrollTo(0, 0); return true; }
  if (a === 'cosequip') {
    const type = el.dataset.t;
    cosTry = null;
    if (type === 'skin') { const d = SKINS.find((x) => x.id === v); if (d && cosOwned('skin', d)) S.cos.skin = v; }
    else { if (!v) S.cos.aura = null; else { const d = AURAS.find((x) => x.id === v); if (d && cosOwned('aura', d)) S.cos.aura = v; } }
    save(); return true;
  }
  if (a === 'cosbuy') {
    const type = el.dataset.t, list = type === 'skin' ? SKINS : AURAS, d = list.find((x) => x.id === v);
    if (!d || !d.unlock.gold || S.gold < d.unlock.gold || cosOwned(type, d)) return true;
    if (!confirm(`ซื้อ${type === 'skin' ? 'สกิน' : 'ออร่า'} "${d.n}" ราคา ${fmt(d.unlock.gold)} ทอง?`)) return false;
    S.gold -= d.unlock.gold; cosTry = null;
    S.cos[type === 'skin' ? 'skins' : 'auras'].push(d.id);
    if (type === 'skin') S.cos.skin = d.id; else S.cos.aura = d.id;
    save(); toast(`✨ ได้${type === 'skin' ? 'สกิน' : 'ออร่า'} ${d.icon} ${d.n}!`); return true;
  }
  return false;
}
