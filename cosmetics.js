'use strict';
/* ============================================================
   👘 สกิน & ออร่า (ความสวยงามล้วน ไม่มีผลต่อค่าพลัง)
   - สกิน: ภาพตัวละครที่สวมทับ
       kind 'palette' = เปลี่ยนสีชุดของตัวละครเดิม (ยังเห็นหมวก/อาวุธ)
       kind 'image'   = ภาพทั้งตัว (เช่นภาพที่สร้างจาก AI) แทนตัวละครเลย
   - ออร่า: เอฟเฟกต์อยู่ "ด้านหลัง" ตัวละครเสมอ
   ============================================================ */

/* ---------- สกิน ---------- */
const SKINS = [
  { id: 'default', n: 'ชุดปกติ', icon: '🙂', kind: 'palette', look: null, unlock: { free: true }, desc: 'ชุดประจำคลาส' },
  { id: 'gold', n: 'ทองคำราชันย์', icon: '👑', kind: 'palette', unlock: { gold: 50000 }, desc: 'ชุดทองอร่ามทั้งตัว',
    look: { body: '#f2c64a', bodyD: '#c8962a', trim: '#fff2b0', belt: '#8a5a14', boot: '#a8741c', helm: '#f2c64a', helmD: '#c8962a', crest: '#fff2b0', hat: '#f2c64a', hatD: '#c8962a', brim: '#a8741c', star: '#ffffff', hood: '#f2c64a', hoodD: '#c8962a' } },
  { id: 'shadow', n: 'เงาราตรี', icon: '🌑', kind: 'palette', unlock: { hard: true }, desc: 'ชุดดำทมิฬ ได้เมื่อจบโหมดยาก',
    look: { body: '#3a3448', bodyD: '#24202e', trim: '#b884ff', belt: '#18151f', boot: '#24202e', helm: '#3a3448', helmD: '#24202e', crest: '#b884ff', hat: '#2a2438', hatD: '#1a1624', brim: '#14111c', star: '#b884ff', hood: '#2a2438', hoodD: '#1a1624', hair: '#c8c6e0' } },
  { id: 'sakura', n: 'ซากุระ', icon: '🌸', kind: 'palette', unlock: { gold: 20000 }, desc: 'ชุดชมพูขาวหวานๆ',
    look: { body: '#ffb8d0', bodyD: '#e88aac', trim: '#ffffff', belt: '#c85a84', boot: '#e88aac', helm: '#fff0f6', helmD: '#f2c4d6', crest: '#ff7aa8', hat: '#ffb8d0', hatD: '#e88aac', brim: '#d86a94', star: '#ffffff', hood: '#ffb8d0', hoodD: '#e88aac' } },
  { id: 'frost', n: 'น้ำแข็งนิรันดร์', icon: '❄️', kind: 'palette', unlock: { boss: 'ice' }, desc: 'ได้เมื่อล้มแมมมอธน้ำแข็ง',
    look: { body: '#bfe9ff', bodyD: '#86c6e8', trim: '#ffffff', belt: '#4a8ab0', boot: '#86c6e8', helm: '#e6f7ff', helmD: '#a8d8f0', crest: '#5ac8ff', hat: '#86c6e8', hatD: '#5a9ec8', brim: '#3a7aa8', star: '#ffffff', hood: '#bfe9ff', hoodD: '#86c6e8', hair: '#ffffff' } },
  // ภาพจาก AI ใส่เพิ่มได้แบบนี้ (วางไฟล์ไว้ในโฟลเดอร์ skins/):
  // { id: 'mecha', n: 'เกราะจักรกล', icon: '🤖', kind: 'image', cls: 'warrior', img: 'skins/mecha.webp', unlock: { gold: 80000 }, desc: '...' },
];

/* ---------- ออร่า (วาดใน viewBox 0 0 200 200 จุดกลางตัวละคร ~ (100,110)) ---------- */
const AURAS = [
  { id: 'flame', n: 'ไฟนรก', icon: '🔥', unlock: { gold: 15000 }, desc: 'เปลวไฟลุกโชนรอบตัว', svg: () => `
    <defs><radialGradient id="au-fl" cx=".5" cy=".8" r=".7"><stop offset="0" stop-color="#fff6a8"/><stop offset=".4" stop-color="#ffb02a"/><stop offset="1" stop-color="#ff2a10" stop-opacity="0"/></radialGradient></defs>
    <ellipse cx="100" cy="120" rx="70" ry="86" fill="url(#au-fl)" opacity=".55" class="au-pulse"/>
    ${[[52, 0], [74, .3], [100, .1], [126, .45], [148, .2], [64, .6], [136, .7]].map(([x, d]) => `<path class="au-flame" style="animation-delay:${d}s;transform-origin:${x}px 190px" d="M${x} 190 Q${x - 22} 140 ${x - 4} 96 Q${x} 120 ${x + 8} 110 Q${x + 4} 80 ${x + 14} 56 Q${x + 26} 110 ${x + 18} 140 Q${x + 26} 170 ${x} 190Z" fill="#ff6a1a" opacity=".85"/>`).join('')}
    ${Array.from({ length: 8 }, (_, i) => `<circle class="au-rise" style="animation-delay:${i * .35}s" cx="${40 + i * 17}" cy="186" r="${2 + (i % 3)}" fill="#ffd27a"/>`).join('')}` },
  { id: 'thunder', n: 'สายฟ้าคลั่ง', icon: '⚡', unlock: { gold: 30000 }, desc: 'สายฟ้าแลบรอบตัว', svg: () => `
    <circle cx="100" cy="110" r="78" fill="#6a8aff" opacity=".2" class="au-pulse"/><circle cx="100" cy="110" r="60" fill="#c8d8ff" opacity=".12"/>
    <circle cx="100" cy="110" r="78" fill="none" stroke="#a8c0ff" stroke-width="2" stroke-dasharray="6 10" class="au-spin"/>
    ${[[30, 40, 0], [160, 30, .25], [20, 140, .5], [172, 150, .75], [100, 20, 1]].map(([x, y, d]) => `<path class="au-zap" style="animation-delay:${d}s" d="M${x} ${y} l14 22 l-10 4 l18 26 l-26 -20 l10 -4 Z" fill="#fff6a8" stroke="#7fb0ff" stroke-width="2"/>`).join('')}` },
  { id: 'rune', n: 'วงเวทมนตร์', icon: '🔯', unlock: { level: 30 }, desc: 'วงเวทหมุนใต้เท้า (ถึง Lv.30)', svg: () => `
    <path d="M70 196 L80 20 L120 20 L130 196Z" fill="#7fe9ff" opacity=".12" class="au-pulse"/>
    <g class="au-flat"><g class="au-spin" style="transform-origin:100px 190px">
      <circle cx="100" cy="190" r="74" fill="none" stroke="#7fe9ff" stroke-width="3"/><circle cx="100" cy="190" r="58" fill="none" stroke="#7fe9ff" stroke-width="1.6"/>
      <path d="M100 116 L164 227 L36 227Z M100 264 L36 153 L164 153Z" fill="none" stroke="#b884ff" stroke-width="2.2"/>
      ${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return `<text x="${100 + Math.cos(a) * 66}" y="${193 + Math.sin(a) * 66}" fill="#bff6ff" font-size="9" text-anchor="middle">${'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃ'[i]}</text>`; }).join('')}
    </g></g>` },
  { id: 'wings', n: 'ปีกแห่งแสง', icon: '🪽', unlock: { normal: true }, desc: 'ปีกเทพสยาย (จบโหมดปกติ)', svg: () => {
    const wing = `<path d="M100 96 Q60 40 6 30 Q24 46 18 56 Q40 56 32 70 Q52 70 44 84 Q64 84 58 98 Q76 96 100 112Z" fill="#fffbe8" stroke="#ffd84a" stroke-width="2.4"/>
      <path d="M100 100 Q70 60 30 48 M100 104 Q76 76 44 72 M100 108 Q82 92 58 92" stroke="#f0c048" stroke-width="1.6" fill="none"/>`;
    return `<ellipse cx="100" cy="100" rx="90" ry="70" fill="#fff6c8" opacity=".2" class="au-pulse"/>
      <g class="au-flap" style="transform-origin:100px 100px">${wing}</g><g class="au-flap" style="transform-origin:100px 100px"><g transform="translate(200 0) scale(-1 1)">${wing}</g></g>`; } },
  { id: 'mist', n: 'หมอกเงา', icon: '👁️', unlock: { adv: true }, desc: 'หมอกดำ มีตาเขียวโผล่ (เลื่อนขั้นอาชีพ)', svg: () => `
    ${[[50, 150, 40, 0], [150, 140, 44, .8], [100, 70, 50, 1.6], [40, 80, 34, 2.2], [160, 70, 36, .4], [100, 180, 56, 1.2]].map(([x, y, r, d]) => `<circle class="au-drift" style="animation-delay:${d}s" cx="${x}" cy="${y}" r="${r}" fill="#1a1420" opacity=".55"/>`).join('')}
    ${[[40, 70, 0], [168, 92, 1], [150, 168, 2], [30, 160, 1.5]].map(([x, y, d]) => `<g class="au-blink" style="animation-delay:${d}s"><ellipse cx="${x}" cy="${y}" rx="6" ry="3" fill="#7dff6b"/><ellipse cx="${x + 14}" cy="${y}" rx="6" ry="3" fill="#7dff6b"/></g>`).join('')}` },
  { id: 'sakura', n: 'พายุซากุระ', icon: '🌸', unlock: { gold: 10000 }, desc: 'กลีบดอกไม้หมุนรอบตัว', svg: () => `
    <circle cx="100" cy="110" r="76" fill="#ffb8d0" opacity=".15"/>
    <g class="au-spin" style="transform-origin:100px 110px">${Array.from({ length: 14 }, (_, i) => { const a = i * Math.PI * 2 / 14, r = 60 + (i % 3) * 12;
      return `<path transform="translate(${100 + Math.cos(a) * r} ${110 + Math.sin(a) * r * 0.9}) rotate(${i * 40})" d="M0 -7 Q6 -3 0 7 Q-6 -3 0 -7Z" fill="${i % 2 ? '#ffd6e6' : '#ff8ab4'}"/>`; }).join('')}</g>` },
  { id: 'crystal', n: 'คริสตัลน้ำแข็ง', icon: '💎', unlock: { boss: 'ice' }, desc: 'คริสตัลหมุนรอบตัว (ล้มแมมมอธน้ำแข็ง)', svg: () => `
    <circle cx="100" cy="110" r="74" fill="#8fd0ff" opacity=".16" class="au-pulse"/>
    <g class="au-spin-slow" style="transform-origin:100px 110px">${Array.from({ length: 6 }, (_, i) => { const a = i * Math.PI / 3;
      return `<path transform="translate(${100 + Math.cos(a) * 80} ${110 + Math.sin(a) * 70})" d="M0 -16 L8 0 L0 16 L-8 0Z" fill="#e6f7ff" stroke="#5ac8ff" stroke-width="2"/>`; }).join('')}</g>` },
  { id: 'galaxy', n: 'จักรวาล', icon: '🌌', unlock: { advanced: true }, desc: 'กาแล็กซีหมุนด้านหลัง (จบโหมดขั้นสูง)', svg: () => `
    <defs><radialGradient id="au-gx" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff"/><stop offset=".15" stop-color="#d0a8ff"/><stop offset=".55" stop-color="#4a2a9a" stop-opacity=".7"/><stop offset="1" stop-color="#0a0820" stop-opacity="0"/></radialGradient></defs>
    <g class="au-spin-slow" style="transform-origin:100px 110px">
      <ellipse cx="100" cy="110" rx="92" ry="92" fill="url(#au-gx)" opacity=".85"/>
      <path d="M100 110 Q140 70 180 100 M100 110 Q60 150 20 120 M100 110 Q70 60 100 24 M100 110 Q130 160 100 196" stroke="#e8d0ff" stroke-width="5" fill="none" opacity=".45" stroke-linecap="round"/>
    </g>
    ${Array.from({ length: 16 }, (_, i) => `<circle class="au-twinkle" style="animation-delay:${(i * .23) % 2}s" cx="${12 + (i * 47) % 176}" cy="${16 + (i * 71) % 180}" r="${1 + (i % 3) * .6}" fill="#fff"/>`).join('')}` },
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
  return `<svg class="aura-layer" viewBox="0 0 200 200" aria-hidden="true">${aura.svg()}</svg>`;
}
function heroArt(cls, equip, size, adv, opt = {}) {
  const skin = opt.skin !== undefined ? opt.skin : (S && S.cls === cls ? curSkin() : SKINS[0]);
  const aura = opt.aura !== undefined ? opt.aura : (S && S.cls === cls ? curAura() : null);
  const h = Math.round(size * 250 / 235);
  let body;
  if (skin && skin.kind === 'image' && skinFits(skin, cls)) body = `<img class="skin-img" src="${skin.img}" alt="${skin.n}" width="${size}" height="${h}">`;
  else body = heroSVG(cls, equip, size, adv, skin && skin.look);
  return `<div class="hero-art" style="width:${size}px;height:${h}px">${auraHTML(aura)}${body}</div>`;
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
