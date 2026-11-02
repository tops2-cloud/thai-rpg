'use strict';
/* ============================================================
   Paper-doll: วาดตัวละครเต็มตัวเป็น SVG แบบซ้อนชั้น
   ตัว → ชุดเกราะ → เครื่องประดับ → อาวุธ
   ภาพเปลี่ยนตามอุปกรณ์ที่สวม + สีขอบตามความหายาก
   ============================================================ */

const RARITY_COLOR = { common: '#c9c3dc', rare: '#4ba3ff', epic: '#c06bff', legend: '#ffad33', unique: '#ff5b8a' };

const HERO_LOOK = {
  warrior: { skin: '#f2c7a0', shirt: '#b5432f', pants: '#4a3b2c', boots: '#3a2a1c', hair: '#6b3f1f' },
  mage: { skin: '#f4d1b0', shirt: '#5b3fa8', pants: '#3a2c5e', boots: '#2a2040', hair: '#e8e4ff' },
  archer: { skin: '#eec39b', shirt: '#3f7d3a', pants: '#5a4630', boots: '#3b2d1e', hair: '#e8c66a' },
};

// ดึงชนิดของอุปกรณ์จาก key เช่น "sword:rare" → "sword", "u:castle" → "u:castle"
const gearKind = (it) => (!it ? null : it.key.startsWith('u:') ? it.key : it.key.split(':')[0]);
const glow = (it) => {
  if (!it) return '';
  const c = RARITY_COLOR[it.rarity];
  const r = { common: 0, rare: 1.5, epic: 2.5, legend: 3.5, unique: 3.5 }[it.rarity];
  return r ? `style="filter:drop-shadow(0 0 ${r}px ${c})"` : '';
};

/* ---------- ส่วนหัว/ผม ตามอาชีพ ---------- */
function heroHead(cls, L) {
  const face = `
    <rect x="55" y="62" width="10" height="9" fill="${L.skin}"/>
    <circle cx="60" cy="50" r="17" fill="${L.skin}"/>
    <ellipse cx="53.5" cy="52" rx="2.2" ry="3" fill="#2a1d18"/>
    <ellipse cx="66.5" cy="52" rx="2.2" ry="3" fill="#2a1d18"/>
    <circle cx="54.3" cy="51" r=".8" fill="#fff"/><circle cx="67.3" cy="51" r=".8" fill="#fff"/>
    <ellipse cx="50" cy="58" rx="3" ry="1.6" fill="#ff8a8a" opacity=".45"/>
    <ellipse cx="70" cy="58" rx="3" ry="1.6" fill="#ff8a8a" opacity=".45"/>
    <path d="M56.5 59 Q60 62 63.5 59" stroke="#7a3b2e" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
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
  return '';
}

/* ---------- เครื่องประดับ ---------- */
function heroAccessory(it) {
  const k = gearKind(it);
  if (!k) return '';
  const t = RARITY_COLOR[it.rarity];
  if (k === 'amulet') return `<g ${glow(it)}>
    <path d="M51 70 Q60 82 69 70" stroke="#ffcc4d" stroke-width="1.5" fill="none"/>
    <path d="M60 78 l4 5 -4 5 -4 -5z" fill="${t}" stroke="#fff" stroke-width=".8"/></g>`;
  if (k === 'ring') return `<g ${glow(it)}><circle cx="34" cy="108" r="3" fill="none" stroke="#ffcc4d" stroke-width="2"/>
    <circle cx="34" cy="105" r="1.8" fill="${t}"/></g>`;
  if (k === 'u:volcano') return `<g ${glow(it)}>
    <path d="M51 70 Q60 80 69 70" stroke="#ffcc4d" stroke-width="1.5" fill="none"/>
    <path d="M60 92 C50 84 52 76 57 77 C59 77 60 79 60 80 C60 79 61 77 63 77 C68 76 70 84 60 92 Z" fill="#ff3b3b" stroke="#ffd36b" stroke-width="1"/>
    <path d="M60 77 Q57 71 60 67 Q61 72 64 71 Q63 75 60 77 Z" fill="#ffad33"/></g>`;
  return '';
}

/* ---------- อาวุธ (ถือที่มือขวาของภาพ, จุดจับ 86,106) ---------- */
function heroWeapon(it) {
  const k = gearKind(it);
  if (!k) return '';
  const t = RARITY_COLOR[it.rarity];
  const wrap = (inner, rot = 22) => `<g transform="translate(86 106) rotate(${rot})" ${glow(it)}>${inner}</g>`;
  if (k === 'sword') return wrap(`
    <path d="M-3 -10 L-3 -58 L0 -64 L3 -58 L3 -10 Z" fill="url(#blade)" stroke="#6f7a92" stroke-width=".8"/>
    <rect x="-10" y="-11" width="20" height="4" rx="2" fill="${t}"/>
    <rect x="-2" y="-7" width="4" height="12" fill="#6b4226"/><circle cy="7" r="3" fill="${t}"/>`);
  if (k === 'axe') return wrap(`
    <rect x="-2" y="-58" width="4" height="66" rx="2" fill="#7a4b2a"/>
    <path d="M2 -56 Q22 -60 20 -38 Q12 -44 2 -40 Z" fill="url(#blade)" stroke="${t}" stroke-width="1.4"/>
    <path d="M-2 -56 Q-12 -52 -10 -44 Q-6 -46 -2 -44 Z" fill="url(#blade)" stroke="${t}" stroke-width="1"/>`);
  if (k === 'staff') return wrap(`
    <rect x="-2" y="-70" width="4" height="82" rx="2" fill="#6b4226"/>
    <path d="M-7 -66 Q0 -82 7 -66" stroke="#6b4226" stroke-width="3" fill="none"/>
    <circle cy="-74" r="7" fill="${t}" opacity=".9"/><circle cx="-2" cy="-76" r="2.4" fill="#fff" opacity=".8"/>`, 10);
  if (k === 'bow') return wrap(`
    <path d="M0 -42 Q22 -10 0 22" stroke="#8a5a34" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M0 -42 L0 22" stroke="#eee" stroke-width=".9"/>
    <circle cx="3" cy="-42" r="2.4" fill="${t}"/><circle cx="3" cy="22" r="2.4" fill="${t}"/>`, 4);
  if (k === 'u:forest') return wrap(` <!-- กระบองราชาก็อบลิน -->
    <rect x="-2.5" y="-30" width="5" height="40" rx="2" fill="#6b4226"/>
    <path d="M-9 -30 Q-11 -60 0 -62 Q11 -60 9 -30 Z" fill="#8b5a2b" stroke="${t}" stroke-width="1.6"/>
    <path d="M-10 -40 l-5 -2 5 -2 M10 -46 l5 -2 -5 -2 M-9 -52 l-5 -2 5 -2 M9 -36 l5 -2 -5 -2 M0 -62 l0 -6" stroke="#ddd" stroke-width="2.2" stroke-linecap="round"/>`);
  if (k === 'u:castle') return wrap(` <!-- ดาบสังหารมาร -->
    <path d="M-5 -12 L-5 -74 L0 -84 L5 -74 L5 -12 Z" fill="#2a1020" stroke="#ff3b5c" stroke-width="1.4"/>
    <path d="M0 -78 L0 -16" stroke="#ff5b8a" stroke-width="1.5"/>
    <path d="M-14 -14 Q-8 -8 0 -12 Q8 -8 14 -14 L12 -8 Q0 -4 -12 -8 Z" fill="#ffcc4d"/>
    <rect x="-2.5" y="-8" width="5" height="13" fill="#3a1a2a"/><circle cy="8" r="3.5" fill="#ff3b5c"/>`);
  return '';
}

/* ---------- ประกอบร่าง ---------- */
function heroSVG(cls, equip = {}, size = 140) {
  const L = HERO_LOOK[cls];
  const robe = gearKind(equip.armor) === 'robe';
  return `<svg class="hero-svg" viewBox="0 0 120 170" width="${size}" height="${Math.round(size * 170 / 120)}" xmlns="http://www.w3.org/2000/svg" aria-label="ตัวละคร">
    <defs>
      <linearGradient id="steel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eef2fa"/><stop offset=".55" stop-color="#aab3c7"/><stop offset="1" stop-color="#717b93"/></linearGradient>
      <linearGradient id="blade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#9aa5bd"/></linearGradient>
    </defs>
    <ellipse cx="60" cy="160" rx="30" ry="5" fill="#000" opacity=".35"/>
    <!-- ขา -->
    ${robe ? '' : `<rect x="48" y="108" width="10" height="42" rx="4" fill="${L.pants}"/>
    <rect x="62" y="108" width="10" height="42" rx="4" fill="${L.pants}"/>`}
    <rect x="45" y="146" width="14" height="10" rx="4" fill="${L.boots}"/>
    <rect x="61" y="146" width="14" height="10" rx="4" fill="${L.boots}"/>
    <!-- แขน -->
    <path d="M45 76 L35 106" stroke="${L.shirt}" stroke-width="9" stroke-linecap="round"/>
    <path d="M75 76 L85 104" stroke="${L.shirt}" stroke-width="9" stroke-linecap="round"/>
    <!-- ลำตัว -->
    <rect x="43" y="68" width="34" height="44" rx="10" fill="${L.shirt}"/>
    <rect x="43" y="104" width="34" height="5" fill="#3a2a1c"/><rect x="57" y="103.5" width="6" height="6" rx="1" fill="#d8b06a"/>
    ${heroArmor(equip.armor, L)}
    ${gearKind(equip.accessory) === 'ring' ? '' : heroAccessory(equip.accessory)}
    ${heroHead(cls, L)}
    ${heroWeapon(equip.weapon)}
    <!-- มือ (วาดทับด้ามอาวุธ) -->
    <circle cx="35" cy="108" r="5" fill="${L.skin}"/>
    <circle cx="86" cy="106" r="5" fill="${L.skin}"/>
    ${gearKind(equip.accessory) === 'ring' ? heroAccessory(equip.accessory) : ''}
  </svg>`;
}
