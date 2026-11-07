'use strict';
/* ============================================================
   ตัวละครแนว "อัศวินชิบิ": เส้นขอบเทาเข้มหนา · สีแบน 2 โทน · หัวกลมโต
   วาดหันซ้ายในพิกัด 223×230 แล้วพลิกให้หันขวา (หาศัตรู)
   ส่วนที่เปลี่ยนตามอุปกรณ์: หัว (หมวก) + อาวุธมือขวา + ของมือซ้าย
   ============================================================ */

const RARITY_COLOR = { legendary: '#ff5e2e', common: '#c9c3dc', rare: '#4ba3ff', epic: '#c06bff', legend: '#ffad33', mythic: '#2ee6c8', divine: '#fff27a', unique: '#ff5b8a' };
const OL = '#3d3d42';
const L = `stroke="${OL}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"`;
const L3 = `stroke="${OL}" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"`;

// ดึงชนิดของอุปกรณ์จาก key เช่น "sword:rare" → "sword", "u:castle" → "u:castle"
const gearKind = (it) => (!it ? null : it.key.startsWith('u:') ? it.key : it.key.split(':')[0]);

// แสงเรืองตามความหายาก + ระดับตีบวก (+7 ขึ้นไปเต้นเป็นจังหวะ)
const glow = (it) => {
  if (!it) return '';
  const c = RARITY_COLOR[it.rarity];
  const r = (({ common: 0, rare: 2, epic: 3.5, legend: 5, mythic: 5.5, divine: 6.5, unique: 5 }[it.rarity] || 0) + (it.plus || 0) * 0.4);
  const cls = (it.plus || 0) >= 7 ? `class="enh${it.plus >= 12 ? ' enh2' : ''}"` : '';
  return r ? `${cls} style="--gc:${c};--gr:${r}px;filter:drop-shadow(0 0 ${r}px ${c})"` : '';
};
const sparkles = (it, pts) => ((it && it.plus >= 10) ? pts.map(([x, y], i) =>
  `<path class="spark" style="animation-delay:${i * 0.4}s" d="M${x} ${y - 6} L${x + 1.6} ${y - 1.6} L${x + 6} ${y} L${x + 1.6} ${y + 1.6} L${x} ${y + 6} L${x - 1.6} ${y + 1.6} L${x - 6} ${y} L${x - 1.6} ${y - 1.6}Z" fill="#fff"/>`).join('') : '');

/* ---------- สีของแต่ละคลาส (ปกติ / ขั้นสูง) ---------- */
const HERO_LOOK = {
  warrior: { skin: '#f6c9a6', body: '#d8d8de', bodyD: '#adadb7', trim: '#8a8a96', belt: '#4a3a32', boot: '#6e6e78', hair: '#7a4a2a', hairD: '#5a341c', helm: '#d8d8de', helmD: '#adadb7', crest: '#adadb7' },
  mage: { skin: '#f6c9a6', body: '#8a62d8', bodyD: '#6a46b8', trim: '#f0c048', belt: '#f0c048', boot: '#4a3a2a', hair: '#f2f0ff', hairD: '#c8c6e0', hat: '#8a62d8', hatD: '#6a46b8', brim: '#5e3ca8', star: '#f0c048' },
  archer: { skin: '#f6c9a6', body: '#5aae66', bodyD: '#43914f', trim: '#8a5530', belt: '#7a4a26', boot: '#6b4426', hair: '#e8a548', hairD: '#c8862e', hood: '#5aae66', hoodD: '#43914f' },
};
const HERO_LOOK_ADV = {
  warrior: { ...HERO_LOOK.warrior, body: '#f4f4fa', bodyD: '#cfd0de', trim: '#e9b949', belt: '#e9b949', boot: '#d0d0dc', helm: '#f4f4fa', helmD: '#cfd0de', crest: '#e9b949', aura: '#ffd84a', adv: true },
  mage: { ...HERO_LOOK.mage, body: '#2a3a9a', bodyD: '#1c2878', trim: '#7fe9ff', hat: '#2a3a9a', hatD: '#1c2878', brim: '#151f60', star: '#7fe9ff', aura: '#5ac8ff', adv: true },
  archer: { ...HERO_LOOK.archer, body: '#1f8a84', bodyD: '#17706c', hood: '#1f8a84', hoodD: '#17706c', hair: '#f4f0d8', hairD: '#d8d2b0', aura: '#5affd6', adv: true },
};

/* ---------- ใบหน้า (หันซ้าย) ---------- */
function heroFace(C, cx = 96, cy = 106) {
  return `
  <ellipse cx="${cx}" cy="${cy}" rx="42" ry="35" fill="${C.skin}" ${L}/>
  <path d="M${cx + 16} ${cy - 31} Q${cx + 44} ${cy - 10} ${cx + 32} ${cy + 26} Q${cx + 42} ${cy} ${cx + 28} ${cy - 25}Z" fill="#e2a984"/>
  <ellipse cx="${cx - 19}" cy="${cy + 2}" rx="4.6" ry="7.2" fill="${OL}"/><ellipse cx="${cx + 2}" cy="${cy + 2}" rx="4.6" ry="7.2" fill="${OL}"/>
  <circle cx="${cx - 20.5}" cy="${cy - 1.5}" r="1.6" fill="#fff"/><circle cx="${cx + 0.5}" cy="${cy - 1.5}" r="1.6" fill="#fff"/>
  <path d="M${cx - 28} ${cy - 11} L${cx - 11} ${cy - 7} M${cx - 5} ${cy - 7} L${cx + 11} ${cy - 11}" stroke="${OL}" stroke-width="4.2" stroke-linecap="round"/>
  <ellipse cx="${cx - 28}" cy="${cy + 15}" rx="7" ry="4" fill="#f29a8a" opacity=".55"/>
  <path d="M${cx - 15} ${cy + 19} Q${cx - 9} ${cy + 22} ${cx - 3} ${cy + 19}" stroke="${OL}" stroke-width="3" fill="none" stroke-linecap="round"/>
  <ellipse cx="${cx + 38}" cy="${cy}" rx="8" ry="10" fill="${C.skin}" ${L3}/>`;
}

/* ผมเปลือย (ใช้ตอนสวมรัดเกล้า/ชฎา) */
function heroHair(cls, C) {
  if (cls === 'mage') return `<path d="M54 116 Q46 70 72 50 Q112 30 150 54 Q170 76 160 120 Q166 92 146 76 Q114 64 86 70 Q66 80 64 120Z" fill="${C.hair}" ${L}/>
    <path d="M60 110 Q52 140 70 150 L72 112Z M154 100 Q166 130 150 146 L144 106Z" fill="${C.hair}" ${L}/>`;
  if (cls === 'archer') return `<path d="M52 112 Q44 64 80 46 Q120 30 154 56 Q172 80 160 118 Q164 90 146 76 Q130 66 116 74 Q100 64 84 72 Q64 82 62 114Z" fill="${C.hair}" ${L}/>
    <path d="M150 90 Q174 104 170 140 Q160 120 148 112Z" fill="${C.hair}" ${L}/>`;
  return `<path d="M52 110 Q44 60 84 44 L82 30 L100 40 L110 24 L122 40 L140 32 L138 48 Q170 70 160 116 Q160 88 140 76 Q124 70 112 78 Q96 68 82 76 Q64 84 62 112Z" fill="${C.hair}" ${L}/>
    <path d="M100 40 L106 56 M122 40 L120 56" stroke="${C.hairD}" stroke-width="4" stroke-linecap="round"/>`;
}

/* หมวกเหล็กแบบอัศวิน (หัวเริ่มต้นของนักรบ และหมวกเหล็กที่สวม) */
function knightHelm(base, shade, crest, trim, wings, plume) {
  return `
  ${plume ? `<path d="M118 34 Q140 -6 182 4 Q160 10 158 30 Q150 24 138 40Z" fill="${plume}" ${L}/>` : ''}
  <path d="M116 30 Q132 -4 160 2 Q148 14 150 40Z" fill="${crest}" ${L}/>
  <circle cx="112" cy="94" r="64" fill="${base}" ${L}/>
  <path d="M138 36 Q186 64 170 128 Q160 150 134 158 Q166 120 138 36Z" fill="${shade}"/>
  <path d="M50 98 Q50 80 70 80 L124 82 Q132 84 132 96 L130 136 Q110 150 70 146 Q52 140 50 120Z" fill="#f6c9a6" ${L}/>
  <ellipse cx="74" cy="118" rx="4.4" ry="6.6" fill="${OL}"/><ellipse cx="96" cy="118" rx="4.4" ry="6.6" fill="${OL}"/>
  <path d="M66 108 L82 111 M88 111 L104 108" stroke="${OL}" stroke-width="4" stroke-linecap="round"/>
  <path d="M74 134 Q82 137 90 133" stroke="${OL}" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M44 74 Q44 64 58 64 L132 64 Q144 66 144 80 L142 100 Q100 92 46 98Z" fill="${base}" ${L}/>
  ${[62, 74, 86, 98, 110, 122].map((x) => `<path d="M${x} 72 L${x} 90" stroke="${OL}" stroke-width="4" stroke-linecap="round"/>`).join('')}
  <path d="M46 96 Q100 88 142 98" stroke="${trim}" stroke-width="4" fill="none"/>
  <circle cx="160" cy="92" r="10" fill="${base}" ${L3}/><path d="M155 87 L165 97 M165 87 L155 97" stroke="${OL}" stroke-width="2.8"/>
  ${wings ? `<path d="M150 70 Q186 44 206 46 Q190 58 196 62 Q180 64 186 70 Q170 72 160 84Z" fill="#fff" ${L3}/><path d="M74 56 Q70 30 52 22 Q60 42 50 44 Q64 52 60 62Z" fill="#fff" ${L3}/>` : ''}`;
}

/* ---------- หัวเริ่มต้นของแต่ละคลาส (ไม่ได้สวมหมวก) ---------- */
function headDefault(cls, C) {
  if (cls === 'warrior') return knightHelm(C.helm, C.helmD, C.crest, C.adv ? '#e9b949' : C.trim, C.adv);
  if (cls === 'mage') return `${heroHair('mage', C)}${heroFace(C, 98, 112)}
    <path d="M14 86 Q110 56 202 82 Q192 102 110 98 Q30 104 14 86Z" fill="${C.brim}" ${L}/>
    <path d="M56 84 Q68 36 102 14 Q126 -2 152 8 Q172 16 186 2 Q192 28 168 36 Q166 60 170 84Z" fill="${C.hat}" ${L}/>
    <path d="M138 12 Q160 24 168 36 Q166 60 170 84 L146 84Z" fill="${C.hatD}"/>
    <path d="M54 80 Q112 64 172 80 L172 94 Q112 78 54 94Z" fill="${C.adv ? 'url(#heroGold)' : C.star}" ${L}/>
    <path d="M112 34 l4.4 9.4 10.4 1.2 -7.8 7 2.2 10.2 -9.2 -5.2 -9.2 5.2 2.2 -10.2 -7.8 -7 10.4 -1.2z" fill="${C.star}" ${L3}/>
    ${C.adv ? '<circle cx="80" cy="56" r="3" fill="#fff"/><circle cx="150" cy="30" r="2.6" fill="#fff"/><circle cx="134" cy="58" r="2" fill="#7fe9ff"/>' : ''}`;
  // archer: ฮู้ด
  return `<path d="M36 116 Q24 36 108 30 Q190 34 182 116 Q178 152 138 158 L80 158 Q42 152 36 116Z" fill="${C.hood}" ${L}/>
    <path d="M132 34 Q190 44 182 116 Q178 152 138 158 L136 124 Q152 80 132 34Z" fill="${C.hoodD}"/>
    <path d="M150 140 Q178 150 186 178 Q168 168 144 160Z" fill="${C.hood}" ${L}/>
    ${heroFace(C, 98, 112)}
    <path d="M60 86 Q100 66 144 84 L144 100 Q100 86 60 102Z" fill="${C.hair}" ${L3}/>
    <path d="M44 100 Q60 64 108 58 Q150 58 168 92 Q150 72 108 72 Q66 74 52 110Z" fill="${C.hood}" ${L}/>
    ${C.adv ? `<path d="M156 52 Q186 26 204 10 Q196 46 170 66Z" fill="#5affd6" ${L3}/><path d="M164 58 Q182 38 198 18" stroke="#fff" stroke-width="2" fill="none"/>` : ''}`;
}

/* ---------- หมวกที่สวม ---------- */
function headGear(it, cls, C) {
  const k = gearKind(it), t = RARITY_COLOR[it.rarity];
  if (k === 'helm') return `<g ${glow(it)}>${knightHelm('#c8ccd6', '#9ea4b2', t, t, false, t)}</g>`;
  if (k === 'circlet') return `${heroHair(cls, C)}${heroFace(C, 98, 112)}<g ${glow(it)}>
    <path d="M58 82 Q110 60 166 80" stroke="${OL}" stroke-width="12" fill="none" stroke-linecap="round"/>
    <path d="M58 82 Q110 60 166 80" stroke="url(#heroGold)" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M100 62 l9 12 -9 12 -9 -12z" fill="${t}" ${L3}/></g>`;
  if (k === 'chada') return `${heroHair(cls, C)}${heroFace(C, 98, 112)}<g ${glow(it)}>
    <path d="M56 86 Q110 56 168 84 L164 64 Q110 40 60 66Z" fill="url(#heroGold)" ${L}/>
    <path d="M70 62 Q110 42 154 60 L146 36 Q110 22 78 38Z" fill="url(#heroGold)" ${L}/>
    <path d="M80 38 Q110 24 144 36 L134 14 Q110 6 88 16Z" fill="url(#heroGold)" ${L}/>
    <path d="M90 16 Q110 8 132 14 L112 -30Z" fill="url(#heroGold)" ${L}/>
    <circle cx="110" cy="56" r="6" fill="${t}" ${L3}/><circle cx="84" cy="70" r="4" fill="${t}"/><circle cx="140" cy="68" r="4" fill="${t}"/>
    <path d="M58 86 Q46 96 50 112 M166 84 Q178 96 172 112" stroke="url(#heroGold)" stroke-width="6" fill="none"/></g>`;
  return headDefault(cls, C);
}

/* ---------- อาวุธ (พิกัดท้องถิ่น: ด้ามที่ 0,0 ใบชี้ขึ้น -y) ---------- */
function weaponArt(it) {
  const k = gearKind(it), t = RARITY_COLOR[it.rarity];
  const blade = 'url(#heroBlade)';
  const W = {
    sword: { rot: -38, svg: `<path d="M-7 -10 L-7 -92 L0 -106 L7 -92 L7 -10Z" fill="${blade}" ${L}/><path d="M1 -100 L1 -14 L7 -14 L7 -92Z" fill="#b8bfcc"/>
      <rect x="-20" y="-14" width="40" height="10" rx="4" fill="${t}" ${L}/><rect x="-5" y="-4" width="10" height="22" rx="3" fill="#5a3418" ${L}/><circle cx="0" cy="22" r="6" fill="${t}" ${L3}/>` },
    axe: { rot: -34, svg: `<rect x="-5" y="-96" width="10" height="120" rx="4" fill="#9a6232" ${L}/>
      <path d="M-4 -94 Q-50 -100 -46 -54 Q-30 -64 -4 -60Z" fill="${blade}" ${L}/><path d="M-4 -92 Q-22 -96 -30 -80 Q-14 -72 -4 -74Z" fill="#fff" opacity=".5"/>
      <path d="M4 -90 Q22 -86 20 -70 Q12 -72 4 -70Z" fill="${blade}" ${L3}/><circle cx="0" cy="-60" r="5" fill="${t}"/>` },
    staff: { rot: -8, svg: `<rect x="-5" y="-120" width="10" height="160" rx="5" fill="#a86a3a" ${L}/>
      <path d="M-16 -118 Q0 -146 16 -118" stroke="${OL}" stroke-width="10" fill="none"/><path d="M-16 -118 Q0 -146 16 -118" stroke="#c8902a" stroke-width="5" fill="none"/>
      <circle cx="0" cy="-130" r="15" fill="${it.rarity === 'common' ? '#5ae0ff' : t}" ${L}/><circle cx="-5" cy="-135" r="5" fill="#fff"/>` },
    bow: { rot: 0, svg: `<g transform="translate(-10 -26)"><path d="M8 -76 Q-44 0 8 62" stroke="${OL}" stroke-width="14" fill="none" stroke-linecap="round"/>
      <path d="M8 -76 Q-44 0 8 62" stroke="#b07a40" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="M8 -76 L8 62" stroke="#f2ead8" stroke-width="2.6"/><rect x="-24" y="14" width="12" height="24" rx="3" fill="#e8d8b0" ${L3}/>
      <circle cx="8" cy="-76" r="5" fill="${t}" ${L3}/><circle cx="8" cy="62" r="5" fill="${t}" ${L3}/></g>` },
    greatsword: { rot: -32, svg: `<path d="M-11 -12 L-11 -126 L0 -144 L11 -126 L11 -12Z" fill="${blade}" ${L}/><path d="M1 -136 L1 -16 L11 -16 L11 -126Z" fill="#b8bfcc"/>
      <path d="M0 -130 L0 -20" stroke="#8f99ab" stroke-width="2.4"/>
      <path d="M-30 -20 L30 -20 L24 -8 L-24 -8Z" fill="${t}" ${L}/><rect x="-5" y="-8" width="10" height="28" rx="3" fill="#4a2c18" ${L}/><circle cx="0" cy="24" r="7" fill="${t}" ${L3}/>` },
    ngao: { rot: -22, svg: `<rect x="-4.5" y="-110" width="9" height="150" rx="4" fill="#8a3a22" ${L}/>
      <rect x="-8" y="-108" width="16" height="10" rx="3" fill="#f0c048" ${L3}/>
      <path d="M2 -106 Q36 -124 20 -166 Q10 -138 -6 -132Z" fill="${blade}" ${L}/><path d="M-4 -108 Q-20 -114 -18 -128" stroke="#c0303a" stroke-width="6" fill="none" stroke-linecap="round"/>
      <circle cx="0" cy="-102" r="4" fill="${t}"/>` },
    scythe: { rot: -18, svg: `<rect x="-4.5" y="-116" width="9" height="156" rx="4" fill="#3a2a44" ${L}/>
      <path d="M0 -112 Q64 -132 82 -88 Q58 -112 2 -96Z" fill="${blade}" ${L}/><circle cx="0" cy="-116" r="7" fill="${t}" ${L3}/>` },
    crystal: { rot: -8, svg: `<rect x="-5" y="-104" width="10" height="144" rx="5" fill="#5a3a8a" ${L}/>
      <path d="M-14 -104 L0 -96 L14 -104 L10 -112 L-10 -112Z" fill="#f0c048" ${L3}/>
      <path d="M0 -160 L18 -134 L0 -112 L-18 -134Z" fill="${it.rarity === 'common' ? '#b884ff' : t}" ${L}/><path d="M0 -160 L0 -112 M-18 -134 L18 -134" stroke="#fff" stroke-width="2" opacity=".7"/>` },
    crossbow: { rot: 0, svg: `<rect x="-60" y="-7" width="76" height="14" rx="5" fill="#8a5530" ${L}/>
      <path d="M-52 -46 Q-66 0 -52 46" stroke="${OL}" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M-52 -46 Q-66 0 -52 46" stroke="#6e7488" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M-52 -46 L-30 0 L-52 46" stroke="#f2ead8" stroke-width="2.4" fill="none"/>
      <path d="M-30 0 L-80 0" stroke="#d0d4dc" stroke-width="4"/><path d="M-88 0 l10 -6 0 12z" fill="${t}" ${L3}/>` },
    'u:forest': { rot: -30, svg: `<rect x="-5" y="-52" width="10" height="72" rx="4" fill="#8a5530" ${L}/>
      <path d="M-18 -50 Q-22 -110 0 -114 Q22 -110 18 -50Z" fill="#9c6a3a" ${L}/><path d="M6 -110 Q20 -100 18 -50 L6 -50Z" fill="#7d5229"/>
      <path d="M-20 -70 l-12 -3 12 -5 M18 -86 l12 -3 -12 -5 M-18 -96 l-12 -3 12 -5 M0 -114 l0 -12" stroke="#e8e8ec" stroke-width="5" stroke-linecap="round"/>` },
    'u:swamp': { rot: -10, svg: `<path d="M0 40 Q-10 -10 6 -60 Q14 -90 -2 -116" stroke="${OL}" stroke-width="14" fill="none" stroke-linecap="round"/>
      <path d="M0 40 Q-10 -10 6 -60 Q14 -90 -2 -116" stroke="#4a5a22" stroke-width="8" fill="none" stroke-linecap="round"/>
      <circle cx="-2" cy="-132" r="16" fill="#7dff6b" ${L}/><circle cx="-7" cy="-137" r="5" fill="#fff"/>
      <path d="M-18 -114 Q-2 -102 14 -114 L10 -102 Q-2 -96 -14 -102Z" fill="#ece6d4" ${L3}/>` },
    'u:sea': { rot: -18, svg: `<rect x="-4.5" y="-110" width="9" height="150" rx="4" fill="url(#heroGold)" ${L}/>
      <path d="M-24 -148 L-24 -114 Q0 -102 24 -114 L24 -148 L16 -128 Q0 -120 -16 -128Z" fill="url(#heroGold)" ${L}/>
      <path d="M0 -166 L7 -146 L4 -112 L-4 -112 L-7 -146Z" fill="url(#heroGold)" ${L}/><circle cx="0" cy="-106" r="6" fill="#38c6ff" ${L3}/>` },
    'u:castle': { rot: -34, svg: `<path d="M-9 -12 L-9 -124 L0 -142 L9 -124 L9 -12Z" fill="#2a1020" ${L}/><path d="M0 -132 L0 -18" stroke="#ff5b8a" stroke-width="3"/>
      <path d="M-28 -16 Q-14 -6 0 -14 Q14 -6 28 -16 L24 -4 Q0 4 -24 -4Z" fill="url(#heroGold)" ${L}/>
      <rect x="-5" y="-4" width="10" height="26" rx="3" fill="#3a1a2a" ${L}/><circle cx="0" cy="26" r="7" fill="#ff3b5c" ${L3}/>` },
  };
  return W[k] || W.sword;
}
const SPARK_PTS = [[-14, -70], [12, -44], [-8, -24]];

/* อาวุธมือขวา (มือหน้า) — ห่อด้วยกลุ่ม .wpn-main สำหรับท่าเหวี่ยง */
function heroMainHand(it, C, glove) {
  const hand = `<circle cx="60" cy="184" r="12" fill="${glove}" ${L}/>`;
  const arm = `<path d="M98 164 Q74 168 64 182" stroke="${OL}" stroke-width="22" fill="none" stroke-linecap="round"/><path d="M98 164 Q74 168 64 182" stroke="${C.body}" stroke-width="13" fill="none" stroke-linecap="round"/>`;
  // จุดหมุนท่าเหวี่ยงอยู่ที่หัวไหล่ (98,164)
  const wrap = (inner) => `<g transform="translate(98 164)"><g class="wpn-main"><g transform="translate(-98 -164)">${inner}</g></g></g>`;
  if (!it) return wrap(`${arm}${hand}`);
  const w = weaponArt(it);
  return wrap(`${arm}<g transform="translate(60 184) rotate(${w.rot})" ${glow(it)}>${w.svg}${sparkles(it, SPARK_PTS)}</g>${hand}`);
}

/* ของมือซ้าย (มือหลัง) */
function heroOffHand(it, C, glove) {
  const hand = `<circle cx="164" cy="180" r="11" fill="${glove}" ${L}/>`;
  const arm = `<path d="M140 160 Q158 166 162 176" stroke="${OL}" stroke-width="20" fill="none" stroke-linecap="round"/><path d="M140 160 Q158 166 162 176" stroke="${C.bodyD}" stroke-width="11" fill="none" stroke-linecap="round"/>`;
  const k = gearKind(it);
  if (!k) return `${arm}${hand}`;
  const t = RARITY_COLOR[it.rarity];
  if (k === 'shield') return `${arm}${hand}<g ${glow(it)}>
    <g transform="translate(8 6)"><path d="M132 136 Q162 124 190 136 L188 172 Q182 198 161 210 Q140 198 134 172Z" fill="#d0d4dc" ${L}/>
    <path d="M161 126 Q176 128 190 136 L188 172 Q182 198 161 210Z" fill="#a8aebb"/>
    <path d="M142 144 Q162 136 180 144 L179 170 Q175 188 161 196 Q147 188 143 170Z" fill="${it.rarity === 'common' ? '#8a8a96' : t}" ${L3}/>
    <path d="M161 148 L161 186 M148 164 L174 164" stroke="url(#heroGold)" stroke-width="6" stroke-linecap="round"/></g>
    ${sparkles(it, [[138, 140], [186, 186]])}</g>`;
  if (k === 'orb') return `${arm}${hand}<g ${glow(it)} class="orb-float"><circle cx="178" cy="150" r="14" fill="${it.rarity === 'common' ? '#7fe9ff' : t}" ${L}/><circle cx="173" cy="145" r="4.5" fill="#fff"/></g>`;
  if (k === 'dagger') return `${arm}<g transform="translate(164 180) rotate(28)" ${glow(it)}>
    <path d="M-5 -8 L-5 -54 L0 -64 L5 -54 L5 -8Z" fill="url(#heroBlade)" ${L3}/><rect x="-13" y="-10" width="26" height="7" rx="3" fill="${t}" ${L3}/><rect x="-3.5" y="-3" width="7" height="14" rx="2" fill="#5a3418" ${L3}/>
    ${sparkles(it, [[-10, -40], [8, -24]])}</g>${hand}`;
  // อาวุธมือซ้าย (ถือ 2 มือ)
  const w = weaponArt(it);
  return `${arm}<g transform="translate(164 180) rotate(${Math.abs(w.rot) + 6}) scale(.9)" ${glow(it)}>${w.svg}${sparkles(it, SPARK_PTS)}</g>${hand}`;
}

/* ---------- ลำตัวของแต่ละคลาส ---------- */
function heroBody(cls, C) {
  const feet = `<path d="M84 194 Q80 214 98 216 L118 216 L118 194Z" fill="${C.boot}" ${L}/>
    <path d="M124 194 L124 216 L146 216 Q156 212 152 194Z" fill="${C.boot}" ${L}/>`;
  if (cls === 'mage') return `${feet}
    <path d="M82 140 Q84 126 112 124 Q142 126 148 140 L156 200 Q116 210 76 200Z" fill="${C.body}" ${L}/>
    <path d="M128 126 Q144 130 148 140 L156 200 Q142 204 130 205Z" fill="${C.bodyD}"/>
    <path d="M112 132 L112 202" stroke="${C.trim}" stroke-width="5"/>
    <path d="M80 168 Q116 176 152 168 L152 178 Q116 186 80 178Z" fill="${C.belt}" ${L}/>
    <path d="M96 130 Q112 144 130 130 L126 148 Q112 156 100 148Z" fill="#f2f0ff" ${L}/>`;
  if (cls === 'archer') return `${feet}
    <g transform="rotate(20 152 120)"><rect x="140" y="90" width="24" height="60" rx="8" fill="#a86a3a" ${L}/>
      <path d="M146 90 L146 72 M156 90 L156 68" stroke="${OL}" stroke-width="4"/><path d="M140 74 l6 -14 6 14z M150 70 l6 -14 6 14z" fill="#e05a4a" ${L3}/></g>
    <path d="M84 140 Q86 126 112 124 Q140 126 146 140 L148 192 Q116 198 82 192Z" fill="${C.body}" ${L}/>
    <path d="M126 126 Q142 130 146 140 L148 192 Q138 194 128 195Z" fill="${C.bodyD}"/>
    <path d="M96 128 L136 188" stroke="${OL}" stroke-width="12" stroke-linecap="round"/><path d="M96 128 L136 188" stroke="${C.trim}" stroke-width="6" stroke-linecap="round"/>
    <path d="M82 172 Q116 180 148 172 L148 182 Q116 190 82 182Z" fill="${C.belt}" ${L}/>
    <rect x="104" y="170" width="18" height="15" rx="3" fill="#f0c048" ${L3}/>`;
  // warrior: เกราะเหล็ก
  return `${feet}
    <path d="M84 140 Q86 124 114 122 Q142 124 148 140 L150 194 Q116 202 80 194Z" fill="${C.body}" ${L}/>
    <path d="M128 124 Q144 128 148 140 L150 194 Q140 197 130 198Z" fill="${C.bodyD}"/>
    <path d="M94 150 Q114 160 140 150 M94 166 Q114 176 140 166" stroke="${C.trim}" stroke-width="4" fill="none"/>
    <path d="M80 178 Q116 186 150 178 L150 188 Q116 196 80 188Z" fill="${C.belt}" ${L}/>
    <rect x="104" y="176" width="18" height="15" rx="3" fill="${C.adv ? '#e9b949' : '#c8902a'}" ${L3}/>
    <ellipse cx="90" cy="136" rx="16" ry="13" fill="${C.body}" ${L}/><ellipse cx="146" cy="136" rx="15" ry="12" fill="${C.bodyD}" ${L}/>`;
}

/* ---------- ประกอบร่าง ---------- */
function heroSVG(cls, equip = {}, size = 140, adv, look) {
  if (adv === undefined) adv = typeof S !== 'undefined' && !!S && S.cls === cls && !!S.adv;
  const C = { ...(adv ? HERO_LOOK_ADV[cls] : HERO_LOOK[cls]), ...(look || {}) };
  const glove = cls === 'warrior' ? C.bodyD : C.skin;
  const head = equip.helmet ? headGear(equip.helmet, cls, C) : headDefault(cls, C);
  const h = Math.round(size * 250 / 235);
  return `<svg class="hero-svg" viewBox="-6 -30 235 250" width="${size}" height="${h}" xmlns="http://www.w3.org/2000/svg" aria-label="ตัวละคร">
    <defs>
      <linearGradient id="heroBlade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d4dae4"/></linearGradient>
      <linearGradient id="heroGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0a0"/><stop offset=".5" stop-color="#f0c048"/><stop offset="1" stop-color="#c8901a"/></linearGradient>
    </defs>
    <g transform="translate(223 0) scale(-1 1)">
      <ellipse cx="116" cy="214" rx="58" ry="9" fill="#000" opacity=".16"/>
      ${C.adv ? `<g class="adv-aura"><ellipse cx="114" cy="122" rx="92" ry="104" fill="${C.aura}" opacity=".16"/><ellipse cx="116" cy="212" rx="70" ry="11" fill="none" stroke="${C.aura}" stroke-width="3" opacity=".7"/></g>` : ''}
      ${heroOffHand(equip.offhand, C, glove)}
      ${heroBody(cls, C)}
      ${head}
      ${heroMainHand(equip.weapon, C, glove)}
    </g>
  </svg>`;
}
