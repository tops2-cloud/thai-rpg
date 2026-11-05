'use strict';
/* ============================================================
   Paper-doll: วาดตัวละครเต็มตัวเป็น SVG แบบซ้อนชั้น
   ตัว → ชุดเกราะ → เครื่องประดับ → อาวุธ
   ภาพเปลี่ยนตามอุปกรณ์ที่สวม + สีขอบตามความหายาก
   ============================================================ */

const RARITY_COLOR = { common: '#c9c3dc', rare: '#4ba3ff', epic: '#c06bff', legend: '#ffad33', mythic: '#2ee6c8', divine: '#fff27a', unique: '#ff5b8a' };

const HERO_LOOK = {
  warrior: { skin: '#f2c7a0', shirt: '#b5432f', pants: '#4a3b2c', boots: '#3a2a1c', hair: '#6b3f1f' },
  mage: { skin: '#f4d1b0', shirt: '#5b3fa8', pants: '#3a2c5e', boots: '#2a2040', hair: '#e8e4ff' },
  archer: { skin: '#eec39b', shirt: '#3f7d3a', pants: '#5a4630', boots: '#3b2d1e', hair: '#e8c66a' },
};

// ดึงชนิดของอุปกรณ์จาก key เช่น "sword:rare" → "sword", "u:castle" → "u:castle"
const gearKind = (it) => (!it ? null : it.key.startsWith('u:') ? it.key : it.key.split(':')[0]);
// แสงเรืองตามความหายาก + ระดับตีบวก (+7 ขึ้นไปจะเต้นเป็นจังหวะ)
const glow = (it) => {
  if (!it) return '';
  const c = RARITY_COLOR[it.rarity];
  const r = ({ common: 0, rare: 1.5, epic: 2.5, legend: 3.5, mythic: 4, divine: 4.5, unique: 3.5 }[it.rarity] || 0) + (it.plus || 0) * 0.25;
  const cls = (it.plus || 0) >= 7 ? `class="enh${it.plus >= 12 ? ' enh2' : ''}"` : '';
  return r ? `${cls} style="--gc:${c};--gr:${r}px;filter:drop-shadow(0 0 ${r}px ${c})"` : '';
};
const sparkles = (it, pts) => ((it && it.plus >= 10) ? pts.map(([x, y], i) =>
  `<path class="spark" style="animation-delay:${i * 0.4}s" d="M${x} ${y - 3} L${x + 0.8} ${y - 0.8} L${x + 3} ${y} L${x + 0.8} ${y + 0.8} L${x} ${y + 3} L${x - 0.8} ${y + 0.8} L${x - 3} ${y} L${x - 0.8} ${y - 0.8}Z" fill="#fff"/>`).join('') : '');

/* ---------- ส่วนหัว/ผม ตามอาชีพ ---------- */
function heroHead(cls, L, helmet) {
  const face = `
    <rect x="55" y="62" width="10" height="9" fill="${L.skin}"/>
    <circle cx="60" cy="50" r="17" fill="${L.skin}"/>
    <ellipse cx="53.5" cy="52" rx="2.2" ry="3" fill="#2a1d18"/>
    <ellipse cx="66.5" cy="52" rx="2.2" ry="3" fill="#2a1d18"/>
    <circle cx="54.3" cy="51" r=".8" fill="#fff"/><circle cx="67.3" cy="51" r=".8" fill="#fff"/>
    <ellipse cx="50" cy="58" rx="3" ry="1.6" fill="#ff8a8a" opacity=".45"/>
    <ellipse cx="70" cy="58" rx="3" ry="1.6" fill="#ff8a8a" opacity=".45"/>
    <path d="M56.5 59 Q60 62 63.5 59" stroke="#7a3b2e" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
  if (helmet) return face + heroHair(cls, L) + heroHelmet(helmet);
  if (cls === 'warrior') return face + `
    <path d="M42 50 Q41 30 60 30 Q79 30 78 50 L74 44 L70 47 L66 41 L60 45 L54 41 L50 47 L46 44 Z" fill="${L.hair}"/>
    <rect x="43" y="41" width="34" height="5" rx="2" fill="#c9302c"/>
    <path d="M77 43 L86 39 L84 47 Z" fill="#c9302c"/>`;
  if (cls === 'mage') return face + `
    <path d="M43 52 Q42 62 46 66 L48 50 Z M77 52 Q78 62 74 66 L72 50 Z" fill="${L.hair}"/>
    <ellipse cx="60" cy="40" rx="27" ry="6" fill="#3b2577"/>
    <path d="M40 40 Q52 34 58 8 Q62 2 70 6 Q64 10 66 18 Q72 30 80 40 Z" fill="#4a2f8f"/>
    <path d="M43 39 Q60 33 77 39" stroke="#ffcc4d" stroke-width="2.5" fill="none"/>
    <path d="M61 22 l1.6 3.4 3.7.4 -2.8 2.5 .8 3.6 -3.3-1.9 -3.3 1.9 .8-3.6 -2.8-2.5 3.7-.4z" fill="#ffcc4d"/>`;
  // archer — ฮู้ด + หูแหลม
  return face + `
    <path d="M43 51 L35 44 L44 56 Z M77 51 L85 44 L76 56 Z" fill="${L.skin}"/>
    <path d="M44 46 Q46 34 60 34 Q74 34 76 46 Q70 40 60 41 Q50 40 44 46 Z" fill="${L.hair}"/>
    <path d="M40 52 Q38 26 60 26 Q82 26 80 52 Q78 40 60 38 Q42 40 40 52 Z" fill="#2f5e2c"/>
    <path d="M60 26 Q70 20 76 24 Q70 26 68 30 Z" fill="#2f5e2c"/>`;
}

/* ผมอย่างเดียว (ใช้ตอนสวมหมวก) */
function heroHair(cls, L) {
  if (cls === 'warrior') return `<path d="M43 52 Q42 40 48 36 L46 46 Z M77 52 Q78 40 72 36 L74 46 Z" fill="${L.hair}"/>`;
  if (cls === 'mage') return `<path d="M43 52 Q42 64 46 68 L48 48 Z M77 52 Q78 64 74 68 L72 48 Z" fill="${L.hair}"/>`;
  return `<path d="M43 51 L35 44 L44 56 Z M77 51 L85 44 L76 56 Z" fill="${L.skin}"/>
    <path d="M43 52 Q42 62 46 66 L47 46 Z M77 52 Q78 62 74 66 L73 46 Z" fill="${L.hair}"/>`;
}

/* ---------- หมวก ---------- */
function heroHelmet(it) {
  const k = gearKind(it);
  const t = RARITY_COLOR[it.rarity];
  if (k === 'helm') return `<g ${glow(it)}>
    <path d="M40 52 Q38 24 60 24 Q82 24 80 52 L75 52 Q74 38 60 38 Q46 38 45 52 Z" fill="url(#steel)" stroke="${t}" stroke-width="1.4"/>
    <path d="M42 44 Q60 36 78 44" stroke="#8d97ad" stroke-width="2" fill="none"/>
    <rect x="58" y="38" width="4" height="16" rx="1.5" fill="url(#steel)" stroke="#8d97ad" stroke-width=".6"/>
    <path d="M60 24 Q56 12 64 6 Q62 16 68 20 Q64 22 60 24 Z" fill="${t}"/></g>`;
  if (k === 'circlet') return `<g ${glow(it)}>
    <path d="M41 46 Q42 32 60 31 Q78 32 79 46 Q70 38 60 38 Q50 38 41 46 Z" fill="#4a3220" opacity=".55"/>
    <path d="M42 43 Q60 35 78 43" stroke="url(#gold)" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <path d="M60 33 l4 5 -4 5 -4 -5z" fill="${t}" stroke="#fff" stroke-width=".8"/></g>`;
  if (k === 'chada') return `<g ${glow(it)}> <!-- ชฎา -->
    <path d="M41 46 Q42 34 60 33 Q78 34 79 46 Q70 39 60 39 Q50 39 41 46 Z" fill="url(#gold)" stroke="#a87a10" stroke-width=".8"/>
    <path d="M45 36 L75 36 L70 28 L50 28 Z" fill="url(#gold)" stroke="#a87a10" stroke-width=".8"/>
    <path d="M50 28 L70 28 L66 20 L54 20 Z" fill="url(#gold)" stroke="#a87a10" stroke-width=".8"/>
    <path d="M54 20 L66 20 L63 12 L57 12 Z" fill="url(#gold)" stroke="#a87a10" stroke-width=".8"/>
    <path d="M57 12 L63 12 L60 -2 Z" fill="url(#gold)" stroke="#a87a10" stroke-width=".8"/>
    <circle cx="60" cy="31" r="2.2" fill="${t}"/><circle cx="52" cy="40" r="1.6" fill="${t}"/><circle cx="68" cy="40" r="1.6" fill="${t}"/>
    <path d="M41 46 Q36 50 38 56 M79 46 Q84 50 82 56" stroke="url(#gold)" stroke-width="2.5" fill="none"/></g>`;
  return '';
}

/* ---------- รองเท้า ---------- */
function heroBoots(it, L) {
  const k = gearKind(it);
  if (!k) return `<rect x="45" y="146" width="14" height="10" rx="4" fill="${L.boots}"/>
    <rect x="61" y="146" width="14" height="10" rx="4" fill="${L.boots}"/>`;
  const t = RARITY_COLOR[it.rarity];
  if (k === 'greaves') return `<g ${glow(it)}>
    ${[46, 62].map((x) => `<path d="M${x} 128 L${x + 12} 128 L${x + 12} 148 L${x + 14} 150 L${x + 14} 157 L${x - 2} 157 L${x - 2} 150 L${x} 148 Z" fill="url(#steel)" stroke="${t}" stroke-width="1.2"/>
    <ellipse cx="${x + 6}" cy="130" rx="7.5" ry="4" fill="url(#steel)" stroke="${t}" stroke-width="1"/>`).join('')}</g>`;
  return `<g ${glow(it)}>
    ${[46, 62].map((x) => `<path d="M${x} 132 L${x + 12} 132 L${x + 12} 149 L${x + 15} 151 L${x + 15} 157 L${x - 2} 157 L${x - 2} 150 L${x} 149 Z" fill="#7a4d2b" stroke="${t}" stroke-width="1.2"/>
    <rect x="${x - 1}" y="130" width="14" height="5" rx="2" fill="#a8743f" stroke="${t}" stroke-width=".8"/>`).join('')}</g>`;
}

/* ---------- ผ้าคลุม (ด้านหลัง) ---------- */
const CAPE_COLOR = { common: '#7a3030', rare: '#2b4a8a', epic: '#5a2b8a', legend: '#a8641a', mythic: '#147a6c', divine: '#e8d27a', unique: '#8a1a3a' };
function heroCape(it) {
  const k = gearKind(it);
  if (!k) return '';
  if (k === 'u:sky') return heroBack(it);
  const t = RARITY_COLOR[it.rarity];
  return `<g ${glow(it)}>
    <path d="M44 70 Q60 64 76 70 L90 146 Q82 152 74 146 Q67 152 60 146 Q53 152 46 146 Q38 152 30 146 Z" fill="${CAPE_COLOR[it.rarity]}" stroke="${t}" stroke-width="1.4"/>
    <path d="M44 70 L40 146 M76 70 L80 146" stroke="#000" stroke-opacity=".18" stroke-width="3"/></g>`;
}
function heroCapeCollar(it) {
  const k = gearKind(it);
  if (!k || k === 'u:sky') return '';
  return `<path d="M44 70 Q60 78 76 70 L74 66 Q60 72 46 66 Z" fill="${CAPE_COLOR[it.rarity]}" stroke="${RARITY_COLOR[it.rarity]}" stroke-width="1"/>
    <circle cx="60" cy="73" r="2.6" fill="url(#gold)"/>`;
}

/* ---------- มือรอง: โล่ / ลูกแก้ว / มีดสั้น / อาวุธมือเดียว ---------- */
function heroOffhandBack(it) { // วาดก่อนมือ
  const k = gearKind(it);
  if (!k || k === 'shield' || k === 'orb') return '';
  if (k === 'dagger') {
    const t = RARITY_COLOR[it.rarity];
    return `<g transform="translate(35 108) rotate(-30)" ${glow(it)}>
      <path d="M-2.5 -8 L-2.5 -32 L0 -38 L2.5 -32 L2.5 -8 Z" fill="url(#blade)" stroke="#6f7a92" stroke-width=".7"/>
      <rect x="-7" y="-9" width="14" height="3" rx="1.5" fill="${t}"/><rect x="-1.8" y="-6" width="3.6" height="9" fill="#5a3520"/>
      ${sparkles(it, [[-6, -30], [5, -18]])}</g>`;
  }
  return heroWeapon(it, true);
}
function heroOffhandFront(it) { // วาดหลังมือ
  const k = gearKind(it);
  if (!k) return '';
  const t = RARITY_COLOR[it.rarity];
  if (k === 'shield') return `<g ${glow(it)}>
    <path d="M18 88 Q31 82 44 88 L43 104 Q40 118 31 124 Q22 118 19 104 Z" fill="url(#steel)" stroke="${t}" stroke-width="2"/>
    <path d="M23 92 Q31 88 39 92 L38 104 Q36 113 31 117 Q26 113 24 104 Z" fill="${CAPE_COLOR[it.rarity] || '#7a3030'}"/>
    <path d="M31 95 L31 112 M25 102 L37 102" stroke="url(#gold)" stroke-width="2.4"/>
    ${sparkles(it, [[20, 90], [42, 110]])}</g>`;
  if (k === 'orb') return `<g ${glow(it)}>
    <circle class="orb-float" cx="30" cy="92" r="7" fill="${t}" opacity=".9"/>
    <circle cx="28" cy="90" r="2.4" fill="#fff" opacity=".85"/>
    <ellipse cx="30" cy="103" rx="5" ry="1.4" fill="${t}" opacity=".35"/></g>`;
  return '';
}

/* ---------- ชุดเกราะ ---------- */
function heroArmor(it, L) {
  const k = gearKind(it);
  const t = it ? RARITY_COLOR[it.rarity] : null;
  if (!k) return '';
  if (k === 'leather') return `<g ${glow(it)}>
    <path d="M43 76 Q43 70 50 70 L70 70 Q77 70 77 76 L76 110 L44 110 Z" fill="#8a5a34" stroke="${t}" stroke-width="1.6"/>
    <path d="M47 72 L73 104 M73 72 L47 104" stroke="#5e3b20" stroke-width="3"/>
    <circle cx="60" cy="88" r="3.5" fill="#d8b06a" stroke="#5e3b20"/>
    <circle cx="44" cy="75" r="6" fill="#7a4d2b" stroke="${t}" stroke-width="1.2"/>
    <circle cx="76" cy="75" r="6" fill="#7a4d2b" stroke="${t}" stroke-width="1.2"/></g>`;
  if (k === 'plate') return `<g ${glow(it)}>
    <path d="M42 76 Q42 69 50 69 L70 69 Q78 69 78 76 L76 106 Q60 114 44 106 Z" fill="url(#steel)" stroke="${t}" stroke-width="1.8"/>
    <path d="M60 71 L60 108" stroke="#8d97ad" stroke-width="1.5"/>
    <path d="M47 88 Q60 93 73 88" stroke="#8d97ad" stroke-width="1.5" fill="none"/>
    <ellipse cx="43" cy="74" rx="9" ry="7" fill="url(#steel)" stroke="${t}" stroke-width="1.6"/>
    <ellipse cx="77" cy="74" rx="9" ry="7" fill="url(#steel)" stroke="${t}" stroke-width="1.6"/></g>`;
  if (k === 'robe') return `<g ${glow(it)}>
    <path d="M44 72 Q60 66 76 72 L86 152 Q60 158 34 152 Z" fill="#2c3f7a" stroke="${t}" stroke-width="1.6"/>
    <path d="M60 70 L60 155" stroke="${t}" stroke-width="4"/>
    <path d="M36 146 Q60 152 84 146" stroke="${t}" stroke-width="2.5" fill="none"/>
    <path d="M50 70 L60 84 L70 70" fill="#1e2c58" stroke="${t}" stroke-width="1.4"/></g>`;
  if (k === 'u:cave') { // เกล็ดนาคา
    let scales = '';
    for (let y = 76; y < 108; y += 6) for (let x = 46 + ((y / 6) % 2) * 3; x < 75; x += 6)
      scales += `<path d="M${x} ${y} q3 5 6 0" stroke="#0d5a4a" stroke-width="1.2" fill="none"/>`;
    return `<g ${glow(it)}>
      <path d="M42 76 Q42 69 50 69 L70 69 Q78 69 78 76 L76 108 Q60 115 44 108 Z" fill="#1fa088" stroke="${t}" stroke-width="1.8"/>
      ${scales}
      <path d="M34 78 Q38 64 50 70 Q42 74 42 82 Z M86 78 Q82 64 70 70 Q78 74 78 82 Z" fill="#17806c" stroke="${t}" stroke-width="1.4"/>
      <circle cx="60" cy="86" r="4" fill="#ffe66d"/><ellipse cx="60" cy="86" rx="1.2" ry="3.4" fill="#1b1b1b"/></g>`;
  }
  if (k === 'u:ice') return `<g ${glow(it)}>
    <path d="M42 76 Q42 69 50 69 L70 69 Q78 69 78 76 L76 106 Q60 114 44 106 Z" fill="url(#ice)" stroke="${t}" stroke-width="1.8"/>
    <path d="M60 72 L52 88 L60 104 L68 88 Z" fill="#e8fbff" opacity=".7"/>
    <path d="M34 76 L38 60 L44 70 L48 58 L50 72 Z M86 76 L82 60 L76 70 L72 58 L70 72 Z" fill="#bdf0ff" stroke="${t}" stroke-width="1.2"/></g>`;
  if (k === 'u:spirit') return `<g ${glow(it)}>
    <path d="M44 72 Q60 66 76 72 L88 150 Q80 156 74 150 Q67 158 60 151 Q53 158 46 150 Q40 156 32 150 Z" fill="#241a36" stroke="${t}" stroke-width="1.6"/>
    <path d="M40 66 Q60 58 80 66 L78 76 Q60 70 42 76 Z" fill="#3a2a55" stroke="${t}" stroke-width="1.2"/>
    <path d="M50 120 Q47 110 52 104 Q52 112 56 112 Q55 118 50 120 Z M70 132 Q67 122 72 116 Q72 124 76 124 Q75 130 70 132 Z" fill="#b884ff" opacity=".85"/>
    <circle cx="60" cy="86" r="4" fill="#b884ff"/><circle cx="60" cy="86" r="1.6" fill="#fff"/></g>`;
  return '';
}

/* ---------- ด้านหลัง (ปีก) ---------- */
function heroBack(it) {
  if (gearKind(it) !== 'u:sky') return '';
  const wing = (dir) => `<path transform="translate(60 0) scale(${dir} 1)" d="M6 80 Q30 46 56 40 Q52 52 44 58 Q54 58 58 62 Q48 68 40 70 Q48 74 50 78 Q38 82 28 82 Q20 88 6 92 Z" fill="url(#gold)" stroke="#b8860b" stroke-width="1"/>`;
  return `<g ${glow(it)}>${wing(1)}${wing(-1)}</g>`;
}

/* ---------- เครื่องประดับ ---------- */
function heroAccessory(it) {
  const k = gearKind(it);
  if (!k) return '';
  const t = RARITY_COLOR[it.rarity];
  if (k === 'amulet') return `<g ${glow(it)}>
    <path d="M51 70 Q60 82 69 70" stroke="#ffcc4d" stroke-width="1.5" fill="none"/>
    <path d="M60 78 l4 5 -4 5 -4 -5z" fill="${t}" stroke="#fff" stroke-width=".8"/></g>`;
  if (k === 'u:desert') return `<g ${glow(it)}>
    <path d="M51 70 Q60 80 69 70" stroke="#ffcc4d" stroke-width="1.5" fill="none"/>
    <path d="M60 77 L68 91 L52 91 Z" fill="#ffcc4d" stroke="#8a5a14" stroke-width="1"/>
    <path d="M55 86 Q60 82 65 86 Q60 90 55 86 Z" fill="#fff"/><circle cx="60" cy="86" r="1.6" fill="#1f6fd0"/></g>`;
  if (k === 'u:volcano') return `<g ${glow(it)}>
    <path d="M51 70 Q60 80 69 70" stroke="#ffcc4d" stroke-width="1.5" fill="none"/>
    <path d="M60 92 C50 84 52 76 57 77 C59 77 60 79 60 80 C60 79 61 77 63 77 C68 76 70 84 60 92 Z" fill="#ff3b3b" stroke="#ffd36b" stroke-width="1"/>
    <path d="M60 77 Q57 71 60 67 Q61 72 64 71 Q63 75 60 77 Z" fill="#ffad33"/></g>`;
  return '';
}

function heroRing(it, x, y) {
  if (!it) return '';
  const t = RARITY_COLOR[it.rarity];
  return `<g ${glow(it)}><circle cx="${x - 1}" cy="${y + 1}" r="2.8" fill="none" stroke="#ffcc4d" stroke-width="1.8"/>
    <circle cx="${x - 1}" cy="${y - 2}" r="1.7" fill="${t}"/></g>`;
}

/* ---------- อาวุธ (ถือที่มือขวาของภาพ, จุดจับ 86,106) ---------- */
function heroWeapon(it, off) {
  const k = gearKind(it);
  if (!k) return '';
  const t = RARITY_COLOR[it.rarity];
  const wrap = (inner, rot = 22) => off
    ? `<g transform="translate(35 108) scale(-1 1) rotate(${rot})" ${glow(it)}>${inner}</g>`
    : `<g transform="translate(86 106) rotate(${rot})" ${glow(it)}>${inner}</g>`;
  if (k === 'sword') return wrap(`
    <path d="M-3 -10 L-3 -58 L0 -64 L3 -58 L3 -10 Z" fill="url(#blade)" stroke="#6f7a92" stroke-width=".8"/>
    <rect x="-10" y="-11" width="20" height="4" rx="2" fill="${t}"/>
    <rect x="-2" y="-7" width="4" height="12" fill="#6b4226"/><circle cy="7" r="3" fill="${t}"/>
    ${sparkles(it, [[-8, -50], [8, -34], [-6, -20]])}`);
  if (k === 'axe') return wrap(`
    <rect x="-2" y="-58" width="4" height="66" rx="2" fill="#7a4b2a"/>
    <path d="M2 -56 Q22 -60 20 -38 Q12 -44 2 -40 Z" fill="url(#blade)" stroke="${t}" stroke-width="1.4"/>
    <path d="M-2 -56 Q-12 -52 -10 -44 Q-6 -46 -2 -44 Z" fill="url(#blade)" stroke="${t}" stroke-width="1"/>
    ${sparkles(it, [[24, -50], [-12, -36], [8, -20]])}`);
  if (k === 'staff') return wrap(`
    <rect x="-2" y="-70" width="4" height="82" rx="2" fill="#6b4226"/>
    <path d="M-7 -66 Q0 -82 7 -66" stroke="#6b4226" stroke-width="3" fill="none"/>
    <circle cy="-74" r="7" fill="${t}" opacity=".9"/><circle cx="-2" cy="-76" r="2.4" fill="#fff" opacity=".8"/>
    ${sparkles(it, [[-11, -84], [10, -66], [-6, -46]])}`, 10);
  if (k === 'bow') return wrap(`
    <path d="M0 -42 Q22 -10 0 22" stroke="#8a5a34" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M0 -42 L0 22" stroke="#eee" stroke-width=".9"/>
    <circle cx="3" cy="-42" r="2.4" fill="${t}"/><circle cx="3" cy="22" r="2.4" fill="${t}"/>
    ${sparkles(it, [[18, -20], [-6, -30], [16, 10]])}`, 4);
  if (k === 'greatsword') return wrap(`
    <path d="M-6 -12 L-6 -78 L0 -88 L6 -78 L6 -12 Z" fill="url(#blade)" stroke="${t}" stroke-width="1.2"/>
    <path d="M0 -82 L0 -16" stroke="#8f9ab3" stroke-width="1.4"/>
    <path d="M-16 -15 L16 -15 L13 -9 L-13 -9 Z" fill="${t}"/>
    <rect x="-2.5" y="-9" width="5" height="16" fill="#4a2c18"/><circle cy="9" r="3.5" fill="${t}"/>
    ${sparkles(it, [[-9, -60], [9, -40], [-7, -28]])}`, 26);
  if (k === 'ngao') return wrap(` <!-- ง้าว -->
    <rect x="-1.8" y="-70" width="3.6" height="92" rx="1.8" fill="#7a3b1f"/>
    <rect x="-3" y="-66" width="6" height="5" fill="#ffcc4d"/>
    <path d="M1 -66 Q18 -78 10 -100 Q6 -86 -2 -84 Z" fill="url(#blade)" stroke="${t}" stroke-width="1.4"/>
    <path d="M-2 -66 Q-10 -70 -9 -78" stroke="#c9302c" stroke-width="3" fill="none" stroke-linecap="round"/>
    ${sparkles(it, [[14, -88], [-8, -60], [6, -40]])}`, 14);
  if (k === 'scythe') return wrap(`
    <rect x="-1.8" y="-72" width="3.6" height="92" rx="1.8" fill="#2a2030"/>
    <path d="M0 -70 Q-30 -80 -40 -56 Q-26 -70 -2 -62 Z" fill="url(#blade)" stroke="${t}" stroke-width="1.4"/>
    <circle cy="-72" r="3" fill="${t}"/>
    ${sparkles(it, [[-30, -70], [6, -50], [-6, -20]])}`, 18);
  if (k === 'crystal') return wrap(`
    <rect x="-2" y="-62" width="4" height="74" rx="2" fill="#4b2a7a"/>
    <path d="M-6 -62 L0 -58 L6 -62 L4 -66 L-4 -66 Z" fill="#ffcc4d"/>
    <path d="M0 -92 L8 -76 L0 -64 L-8 -76 Z" fill="${t}" opacity=".9" stroke="#fff" stroke-width=".8"/>
    <path d="M0 -92 L0 -64 M-8 -76 L8 -76" stroke="#fff" stroke-width=".6" opacity=".7"/>
    ${sparkles(it, [[-11, -86], [11, -70], [-6, -50]])}`, 10);
  if (k === 'crossbow') return wrap(` <!-- หน้าไม้ -->
    <rect x="-2.5" y="-34" width="5" height="44" rx="2" fill="#6b4226"/>
    <path d="M-22 -26 Q0 -40 22 -26" stroke="#444c5e" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <path d="M-22 -26 L0 -18 L22 -26" stroke="#eee" stroke-width=".9" fill="none"/>
    <path d="M0 -18 L0 -46" stroke="#ccc" stroke-width="1.6"/><path d="M0 -50 l-3 5 6 0z" fill="${t}"/>
    <circle cx="-22" cy="-26" r="2.4" fill="${t}"/><circle cx="22" cy="-26" r="2.4" fill="${t}"/>
    ${sparkles(it, [[-18, -36], [18, -16], [6, -54]])}`, 8);
  if (k === 'u:swamp') return wrap(` <!-- คทาแม่มดหนองน้ำ -->
    <path d="M0 12 Q-4 -10 2 -30 Q6 -46 -2 -64" stroke="#3b4a1c" stroke-width="4.5" fill="none" stroke-linecap="round"/>
    <circle cx="-2" cy="-72" r="8" fill="#7dff6b" opacity=".85"/><circle cx="-4" cy="-74" r="2.5" fill="#fff" opacity=".8"/>
    <path d="M-10 -64 Q-2 -58 6 -64 L4 -58 Q-2 -54 -8 -58 Z" fill="#e8e4d8"/>
    <circle cx="-5" cy="-60" r="1.3" fill="#222"/><circle cx="2" cy="-60" r="1.3" fill="#222"/>
    ${sparkles(it, [[-12, -82], [8, -70], [-6, -40]])}`, 10);
  if (k === 'u:sea') return wrap(` <!-- ตรีศูลสมุทร -->
    <rect x="-1.8" y="-64" width="3.6" height="86" rx="1.8" fill="url(#gold)"/>
    <path d="M-12 -84 L-12 -66 Q0 -60 12 -66 L12 -84 L9 -74 Q0 -70 -9 -74 Z" fill="url(#gold)" stroke="#8a6a10" stroke-width=".8"/>
    <path d="M-12 -84 l-2 6 4 0z M12 -84 l-2 6 4 0z" fill="url(#gold)"/>
    <path d="M0 -94 L3 -84 L1.8 -66 L-1.8 -66 L-3 -84 Z" fill="url(#gold)" stroke="#8a6a10" stroke-width=".8"/>
    <circle cy="-62" r="3" fill="#38c6ff"/>
    ${sparkles(it, [[-16, -90], [16, -76], [-6, -50]])}`, 12);
  if (k === 'u:forest') return wrap(` <!-- กระบองราชาก็อบลิน -->
    <rect x="-2.5" y="-30" width="5" height="40" rx="2" fill="#6b4226"/>
    <path d="M-9 -30 Q-11 -60 0 -62 Q11 -60 9 -30 Z" fill="#8b5a2b" stroke="${t}" stroke-width="1.6"/>
    <path d="M-10 -40 l-5 -2 5 -2 M10 -46 l5 -2 -5 -2 M-9 -52 l-5 -2 5 -2 M9 -36 l5 -2 -5 -2 M0 -62 l0 -6" stroke="#ddd" stroke-width="2.2" stroke-linecap="round"/>`);
  if (k === 'u:castle') return wrap(` <!-- ดาบสังหารมาร -->
    <path d="M-5 -12 L-5 -74 L0 -84 L5 -74 L5 -12 Z" fill="#2a1020" stroke="#ff3b5c" stroke-width="1.4"/>
    <path d="M0 -78 L0 -16" stroke="#ff5b8a" stroke-width="1.5"/>
    <path d="M-14 -14 Q-8 -8 0 -12 Q8 -8 14 -14 L12 -8 Q0 -4 -12 -8 Z" fill="#ffcc4d"/>
    <rect x="-2.5" y="-8" width="5" height="13" fill="#3a1a2a"/><circle cy="8" r="3.5" fill="#ff3b5c"/>
    ${sparkles(it, [[-10, -66], [10, -44], [-8, -26]])}`);
  return '';
}

/* ---------- ประกอบร่าง ---------- */
function heroSVG(cls, equip = {}, size = 140) {
  const L = HERO_LOOK[cls];
  const robe = ['robe', 'u:spirit'].includes(gearKind(equip.armor));
  return `<svg class="hero-svg" viewBox="0 0 120 170" width="${size}" height="${Math.round(size * 170 / 120)}" xmlns="http://www.w3.org/2000/svg" aria-label="ตัวละคร">
    <defs>
      <linearGradient id="steel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eef2fa"/><stop offset=".55" stop-color="#aab3c7"/><stop offset="1" stop-color="#717b93"/></linearGradient>
      <linearGradient id="blade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#9aa5bd"/></linearGradient>
      <linearGradient id="ice" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e6fbff"/><stop offset=".5" stop-color="#8fdcf5"/><stop offset="1" stop-color="#3f9ec7"/></linearGradient>
      <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3b0"/><stop offset=".5" stop-color="#ffcc4d"/><stop offset="1" stop-color="#c8901a"/></linearGradient>
    </defs>
    <ellipse cx="60" cy="160" rx="30" ry="5" fill="#000" opacity=".35"/>
    ${heroCape(equip.cape)}
    <!-- ขา -->
    ${robe ? '' : `<rect x="48" y="108" width="10" height="42" rx="4" fill="${L.pants}"/>
    <rect x="62" y="108" width="10" height="42" rx="4" fill="${L.pants}"/>`}
    ${heroBoots(equip.boots, L)}
    <!-- แขน -->
    <path d="M45 76 L35 106" stroke="${L.shirt}" stroke-width="9" stroke-linecap="round"/>
    <path d="M75 76 L85 104" stroke="${L.shirt}" stroke-width="9" stroke-linecap="round"/>
    <!-- ลำตัว -->
    <rect x="43" y="68" width="34" height="44" rx="10" fill="${L.shirt}"/>
    <rect x="43" y="104" width="34" height="5" fill="#3a2a1c"/><rect x="57" y="103.5" width="6" height="6" rx="1" fill="#d8b06a"/>
    ${heroArmor(equip.armor, L)}
    ${heroCapeCollar(equip.cape)}
    ${heroAccessory(equip.necklace)}
    ${heroHead(cls, L, equip.helmet)}
    ${heroWeapon(equip.weapon)}
    ${heroOffhandBack(equip.offhand)}
    <!-- มือ (วาดทับด้ามอาวุธ) -->
    <circle cx="35" cy="108" r="5" fill="${L.skin}"/>
    <circle cx="86" cy="106" r="5" fill="${L.skin}"/>
    ${heroOffhandFront(equip.offhand)}
    ${heroRing(equip.ring1, 86, 106)}
    ${heroRing(equip.ring2, 35, 108)}
  </svg>`;
}
