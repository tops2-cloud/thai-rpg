'use strict';
/* ============================================================
   ภาพมอนสเตอร์ 40 ตัว (SVG 120×120 หันหน้าไปทางซ้าย = หันหาผู้เล่น)
   เท้าอยู่ที่ y≈114 · ตัวบินลอยสูงกว่า
   ============================================================ */

/* ---------- ตัวช่วย ---------- */
const mEye = (x, y, r = 3.4, col = '#fff', pupil = '#1a1010', angry = true) => `
  <ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.1}" fill="${col}"/>
  <circle cx="${x - r * 0.35}" cy="${y + 0.3}" r="${r * 0.55}" fill="${pupil}"/>
  <circle cx="${x - r * 0.55}" cy="${y - r * 0.3}" r="${r * 0.2}" fill="#fff"/>
  ${angry ? `<path d="M${x - r * 1.3} ${y - r * 1.5} L${x + r * 1.2} ${y - r * 0.8}" stroke="#1a1010" stroke-width="${r * 0.55}" stroke-linecap="round"/>` : ''}`;
const glowEye = (x, y, r, c) => `<circle cx="${x}" cy="${y}" r="${r * 1.8}" fill="${c}" opacity=".35"/><circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/><circle cx="${x}" cy="${y}" r="${r * 0.4}" fill="#fff"/>`;
const fangs = (x, y, n = 2, s = 3) => Array.from({ length: n }, (_, i) => `<path d="M${x + i * s * 1.6} ${y} l${s / 2} ${s * 1.4} l${s / 2} ${-s * 1.4}z" fill="#fff"/>`).join('');
const grad = (id, a, b, vertical = true) => `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
const crownG = (x, y, w, c = '#ffcc4d') => `<path d="M${x} ${y} L${x} ${y - w * 0.5} L${x + w * 0.2} ${y - w * 0.25} L${x + w * 0.5} ${y - w * 0.65} L${x + w * 0.8} ${y - w * 0.25} L${x + w} ${y - w * 0.5} L${x + w} ${y} Z" fill="${c}" stroke="#a87a10" stroke-width="1"/><circle cx="${x + w * 0.5}" cy="${y - w * 0.15}" r="${w * 0.08}" fill="#e83b5a"/>`;

/* ---------- แบบตัวละครพื้นฐาน ---------- */
function goblin(king) {
  const s = king ? 1 : 0.85, oy = king ? 0 : 14;
  return `<g transform="translate(${60 - 60 * s} ${oy}) scale(${s})">
    ${king ? '<path d="M40 50 Q60 44 82 52 L94 112 L28 112 Z" fill="#9a1f2b"/>' : ''}
    <rect x="46" y="88" width="10" height="24" rx="4" fill="#4f7f2a"/><rect x="62" y="88" width="10" height="24" rx="4" fill="#4f7f2a"/>
    <path d="M40 66 Q58 58 78 66 L80 96 L38 96 Z" fill="${king ? '#6b3a1e' : '#8a5a2b'}"/>
    <rect x="38" y="88" width="42" height="5" fill="#3a2414"/>
    <path d="M42 70 L28 84" stroke="#6fb83f" stroke-width="9" stroke-linecap="round"/><path d="M76 70 L86 86" stroke="#6fb83f" stroke-width="9" stroke-linecap="round"/>
    <g transform="translate(26 84) rotate(-35)"><rect x="-3" y="-32" width="6" height="34" rx="3" fill="#7a4b2a"/><ellipse cx="0" cy="-34" rx="9" ry="12" fill="#8b5a2b"/>
      ${king ? '<path d="M-9 -38 l-6 -2 6 -3 M9 -32 l6 -2 -6 -3 M0 -46 l0 -6" stroke="#ddd" stroke-width="2.5"/>' : ''}</g>
    <path d="M38 44 L12 34 L36 54 Z M80 44 L102 30 L82 56 Z" fill="#6fb83f"/>
    <circle cx="58" cy="48" r="22" fill="#7cc947"/>
    <path d="M36 52 Q30 60 38 62" fill="#6fb83f"/>
    ${mEye(49, 46, 4, '#ffe066', '#3a1a00')}${mEye(66, 46, 4, '#ffe066', '#3a1a00')}
    <path d="M42 60 Q56 70 70 60 Q56 64 42 60 Z" fill="#3a1010"/>${fangs(46, 60, 4, 3.5)}
    <path d="M52 52 Q48 58 54 58" stroke="#4f7f2a" stroke-width="2" fill="none"/>
    ${king ? crownG(42, 30, 32) : '<path d="M46 28 Q58 18 72 28" stroke="#3a2a1a" stroke-width="4" fill="none"/>'}
  </g>`;
}

function skeleton(armored) {
  return `${armored ? '<path d="M70 70 L104 66 L102 100 Q86 110 72 100 Z" fill="#5a5f72" stroke="#2a2a3a" stroke-width="2"/><circle cx="87" cy="84" r="5" fill="#b884ff"/>' : ''}
    <path d="M50 92 L46 114 M66 92 L70 114" stroke="#eae6d8" stroke-width="5" stroke-linecap="round"/>
    <path d="M58 60 L58 92" stroke="#eae6d8" stroke-width="4"/>
    ${[66, 72, 78].map((y) => `<path d="M46 ${y} Q58 ${y + 5} 70 ${y}" stroke="#eae6d8" stroke-width="3" fill="none"/>`).join('')}
    <path d="M46 90 Q58 96 70 90" stroke="#eae6d8" stroke-width="4" fill="none"/>
    ${armored ? '<path d="M42 62 Q58 54 74 62 L72 84 L44 84 Z" fill="#4a4f62" stroke="#2a2a3a" stroke-width="1.5"/>' : ''}
    <path d="M46 64 L30 84" stroke="#eae6d8" stroke-width="4" stroke-linecap="round"/><path d="M70 64 L82 80" stroke="#eae6d8" stroke-width="4" stroke-linecap="round"/>
    <g transform="translate(30 84) rotate(-40)"><rect x="-2.5" y="-46" width="5" height="44" fill="${armored ? '#9aa5bd' : '#9a7a55'}"/><rect x="-8" y="-4" width="16" height="4" fill="#5a4a3a"/></g>
    <circle cx="56" cy="40" r="16" fill="#f2eedf"/><rect x="48" y="50" width="16" height="10" rx="3" fill="#f2eedf"/>
    <ellipse cx="49" cy="40" rx="4.5" ry="5" fill="#1a1010"/><ellipse cx="62" cy="40" rx="4.5" ry="5" fill="#1a1010"/>
    ${glowEye(49, 40, 1.8, armored ? '#b884ff' : '#ff4040')}${glowEye(62, 40, 1.8, armored ? '#b884ff' : '#ff4040')}
    <path d="M50 54 L50 59 M54 54 L54 59 M58 54 L58 59 M62 54 L62 59" stroke="#1a1010" stroke-width="1.4"/>
    ${armored ? '<path d="M40 38 Q40 20 56 20 Q72 20 72 38 L68 32 Q56 26 44 32 Z" fill="#4a4f62" stroke="#2a2a3a"/><path d="M56 20 L56 8" stroke="#8a1a3a" stroke-width="5" stroke-linecap="round"/>' : ''}`;
}

/* ---------- มอนสเตอร์แต่ละตัว ---------- */
const MONSTER_ART = {
  'สไลม์': () => `<defs>${grad('mg-sl', '#9ef58a', '#3fae44')}</defs>
    <path d="M18 112 Q12 112 14 98 Q20 54 60 50 Q100 54 106 98 Q108 112 102 112 Z" fill="url(#mg-sl)" stroke="#2f8a35" stroke-width="2"/>
    <ellipse cx="44" cy="68" rx="10" ry="6" fill="#fff" opacity=".45"/>
    ${mEye(46, 84, 5)}${mEye(68, 84, 5)}<path d="M50 98 Q58 104 66 98" stroke="#1a3a1a" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
  'หมาป่า': () => `<defs>${grad('mg-wf', '#a5adbd', '#5f6878')}</defs>
    <path d="M96 70 Q116 54 110 40 Q104 58 90 66 Z" fill="#6f7888"/>
    <rect x="80" y="84" width="8" height="28" rx="3" fill="#5f6878"/><rect x="92" y="82" width="8" height="30" rx="3" fill="#5f6878"/>
    <ellipse cx="74" cy="78" rx="30" ry="17" fill="url(#mg-wf)"/>
    <rect x="50" y="86" width="8" height="26" rx="3" fill="#6f7888"/><rect x="62" y="88" width="8" height="24" rx="3" fill="#6f7888"/>
    <path d="M36 50 L32 30 L46 44 Z M50 46 L52 26 L60 44 Z" fill="#6f7888"/>
    <circle cx="44" cy="58" r="16" fill="#8d96a6"/>
    <path d="M32 60 L8 66 Q8 74 30 74 Z" fill="#8d96a6"/><circle cx="10" cy="67" r="3" fill="#1a1010"/>
    <path d="M12 72 L30 74" stroke="#1a1010" stroke-width="1.6"/>${fangs(16, 72, 3, 3)}
    <path d="M40 66 Q48 74 58 70" fill="#dfe3ea"/>${mEye(38, 54, 3.6, '#ffe066')}`,
  'ก็อบลิน': () => goblin(false),
  'ราชาก็อบลิน': () => goblin(true),

  'ค้างคาวแวมไพร์': () => `<g transform="translate(0 -10)">
    <path d="M58 60 Q36 30 6 40 Q18 48 16 58 Q26 54 32 64 Q40 58 50 70 Z" fill="#3a2a55" stroke="#22183a" stroke-width="1.5"/>
    <path d="M62 60 Q84 30 114 40 Q102 48 104 58 Q94 54 88 64 Q80 58 70 70 Z" fill="#3a2a55" stroke="#22183a" stroke-width="1.5"/>
    <ellipse cx="60" cy="68" rx="15" ry="18" fill="#4a3a6a"/>
    <path d="M48 52 L44 36 L54 48 Z M72 52 L76 36 L66 48 Z" fill="#4a3a6a"/>
    ${glowEye(54, 60, 2.6, '#ff3b3b')}${glowEye(66, 60, 2.6, '#ff3b3b')}${fangs(55, 72, 2, 4)}
    <path d="M54 84 L52 92 M66 84 L68 92" stroke="#22183a" stroke-width="3" stroke-linecap="round"/></g>`,
  'แมงมุมยักษ์': () => `${[0, 1, 2, 3].map((i) => `<path d="M${54 + i * 8} 84 Q${30 + i * 10} ${58 + i * 2} ${16 + i * 16} 112" stroke="#2a1a2a" stroke-width="4.5" fill="none" stroke-linecap="round"/>
      <path d="M${60 + i * 8} 84 Q${80 + i * 8} ${56 + i * 2} ${76 + i * 12} 112" stroke="#2a1a2a" stroke-width="4.5" fill="none" stroke-linecap="round"/>`).join('')}
    <ellipse cx="80" cy="76" rx="26" ry="22" fill="#3a2a3a"/><path d="M70 64 L90 64 L86 72 L80 66 L74 72 Z" fill="#c8302c"/>
    <circle cx="48" cy="86" r="15" fill="#4a344a"/>
    ${[[40, 80], [48, 78], [44, 86], [52, 86]].map(([x, y]) => glowEye(x, y, 2, '#ff3b3b')).join('')}
    <path d="M38 96 L36 104 M46 98 L46 106" stroke="#eee" stroke-width="2.5" stroke-linecap="round"/>`,
  'โครงกระดูก': () => skeleton(false),
  'นาคาพิษ': () => `<defs>${grad('mg-nk', '#3fd6a0', '#137a5c')}</defs>
    <path d="M30 112 Q20 96 40 92 Q70 88 96 98 Q114 106 100 112 Z" fill="url(#mg-nk)" stroke="#0d5a44" stroke-width="2"/>
    <path d="M66 96 Q90 90 98 100 Q80 104 66 100 Z" fill="#a8f0c8"/>
    <path d="M58 94 Q48 70 58 46" stroke="#1fa088" stroke-width="18" fill="none" stroke-linecap="round"/>
    <path d="M58 22 Q22 30 26 60 Q40 74 58 62 Q76 74 90 60 Q94 30 58 22 Z" fill="url(#mg-nk)" stroke="#0d5a44" stroke-width="2"/>
    <path d="M58 30 Q38 36 40 56 Q50 60 58 54 Q66 60 76 56 Q78 36 58 30 Z" fill="#f0e08a" opacity=".85"/>
    ${[36, 44, 52].map((y) => `<path d="M46 ${y} Q58 ${y + 4} 70 ${y}" stroke="#c8a040" stroke-width="1.5" fill="none"/>`).join('')}
    <ellipse cx="54" cy="40" rx="13" ry="11" fill="#2fbf90"/>
    ${glowEye(48, 38, 2.6, '#ffe066')}${glowEye(60, 38, 2.6, '#ffe066')}
    <path d="M44 46 Q52 52 60 46" stroke="#0d3a2a" stroke-width="2" fill="none"/>${fangs(46, 46, 2, 4)}
    <path d="M42 50 L34 56 L38 50 L32 52" stroke="#e83b5a" stroke-width="2" fill="none"/>
    ${crownG(46, 28, 18)}`,

  'แมงป่องยักษ์': () => `<defs>${grad('mg-sc', '#e8944a', '#a8541a')}</defs>
    <path d="M86 84 Q108 76 104 52 Q100 36 84 36" stroke="url(#mg-sc)" stroke-width="10" fill="none" stroke-linecap="round"/>
    <path d="M84 28 L74 36 L86 42 Z" fill="#3a1a0a"/>
    ${[0, 1, 2].map((i) => `<path d="M${60 + i * 10} 92 L${54 + i * 14} 112 M${62 + i * 10} 90 L${74 + i * 12} 110" stroke="#8a4a1a" stroke-width="3.5" stroke-linecap="round"/>`).join('')}
    <ellipse cx="70" cy="86" rx="26" ry="12" fill="url(#mg-sc)"/>
    <path d="M48 82 Q32 74 26 66" stroke="#c8742a" stroke-width="6" stroke-linecap="round" fill="none"/>
    <path d="M26 66 Q8 60 10 72 Q16 66 22 72 Q12 78 26 78 Z" fill="#d8843a" stroke="#8a4a1a" stroke-width="1.5"/>
    <path d="M50 92 Q36 98 30 104" stroke="#c8742a" stroke-width="6" stroke-linecap="round" fill="none"/>
    <path d="M30 104 Q14 104 18 114 Q22 106 28 112 Q22 118 34 114 Z" fill="#d8843a" stroke="#8a4a1a" stroke-width="1.5"/>
    ${glowEye(50, 80, 2, '#1a0a00')}${glowEye(56, 78, 2, '#1a0a00')}`,
  'อูฐคลั่ง': () => `<defs>${grad('mg-cm', '#e0b87a', '#a8803f')}</defs>
    <rect x="76" y="80" width="7" height="32" rx="3" fill="#a8803f"/><rect x="90" y="80" width="7" height="32" rx="3" fill="#a8803f"/>
    <path d="M58 78 Q60 60 74 62 Q80 44 90 58 Q100 58 104 74 Q104 90 82 92 L62 92 Q54 90 58 78 Z" fill="url(#mg-cm)"/>
    <rect x="58" y="84" width="7" height="28" rx="3" fill="#c09460"/><rect x="68" y="86" width="7" height="26" rx="3" fill="#c09460"/>
    <path d="M62 80 Q46 74 42 50" stroke="#d0a86a" stroke-width="11" fill="none" stroke-linecap="round"/>
    <ellipse cx="34" cy="46" rx="14" ry="9" fill="#d0a86a"/><path d="M22 48 Q18 52 24 54" stroke="#6a4a20" stroke-width="2" fill="none"/>
    <path d="M38 38 L40 32 L44 38" fill="#c09460"/>${mEye(34, 43, 2.8)}
    <path d="M60 64 Q70 50 82 60" fill="#c8242a" opacity=".85"/>`,
  'มัมมี่': () => `<rect x="48" y="86" width="10" height="26" rx="4" fill="#d8ccaa"/><rect x="62" y="86" width="10" height="26" rx="4" fill="#d8ccaa"/>
    <rect x="42" y="56" width="36" height="36" rx="10" fill="#e6dcbc"/>
    ${[60, 68, 76, 84].map((y, i) => `<path d="M42 ${y} L78 ${y + (i % 2 ? -4 : 4)}" stroke="#bfb08a" stroke-width="2.5"/>`).join('')}
    <path d="M44 64 L18 70" stroke="#e6dcbc" stroke-width="9" stroke-linecap="round"/><path d="M76 64 L50 74" stroke="#d8ccaa" stroke-width="9" stroke-linecap="round"/>
    <path d="M18 70 L10 66 M18 70 L10 74" stroke="#bfb08a" stroke-width="3" stroke-linecap="round"/>
    <circle cx="60" cy="40" r="17" fill="#e6dcbc"/>
    ${[30, 38, 46].map((y, i) => `<path d="M43 ${y} L77 ${y + (i % 2 ? 4 : -3)}" stroke="#bfb08a" stroke-width="2.5"/>`).join('')}
    <rect x="46" y="36" width="20" height="7" fill="#2a1a10"/>${glowEye(52, 39.5, 2, '#7dff6b')}
    <path d="M70 52 L84 62" stroke="#e6dcbc" stroke-width="3"/>`,
  'สฟิงซ์ทองคำ': () => `<defs>${grad('mg-sp', '#ffe08a', '#c8901a')}${grad('mg-sp2', '#2f5fbf', '#1a3a7a')}</defs>
    <path d="M100 84 Q118 70 112 56" stroke="#c8901a" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M40 112 Q36 82 60 76 L96 76 Q110 80 106 112 Z" fill="url(#mg-sp)" stroke="#a8761a" stroke-width="1.5"/>
    <path d="M30 112 L34 96 L54 96 L50 112 Z M84 112 L86 98 L102 98 L100 112 Z" fill="#e8b84a" stroke="#a8761a"/>
    <path d="M26 28 L66 28 L80 76 L12 76 Z" fill="url(#mg-sp2)"/>
    ${[36, 44, 52, 60, 68].map((y) => `<path d="M${26 - (y - 28) * 0.3} ${y} L${66 + (y - 28) * 0.3} ${y}" stroke="#ffcc4d" stroke-width="3"/>`).join('')}
    <path d="M30 32 Q46 20 62 32 L60 62 Q46 72 32 62 Z" fill="#f2c780"/>
    ${glowEye(38, 44, 2.4, '#38c6ff')}${glowEye(54, 44, 2.4, '#38c6ff')}
    <path d="M38 38 L44 40 M54 40 L60 38" stroke="#2a1a10" stroke-width="2"/>
    <path d="M40 56 L52 56" stroke="#8a4a1a" stroke-width="2"/><rect x="43" y="62" width="6" height="12" fill="#2f5fbf"/>
    <path d="M42 24 Q46 14 50 24" fill="#ffcc4d"/><circle cx="46" cy="22" r="3" fill="#e83b5a"/>`,

  'ภูตไฟ': () => `<defs><radialGradient id="mg-fs" cx=".5" cy=".7" r=".6"><stop offset="0" stop-color="#fff6a8"/><stop offset=".45" stop-color="#ffb02a"/><stop offset="1" stop-color="#ff3a1a"/></radialGradient></defs>
    <g class="mflame"><path d="M60 112 Q22 104 26 72 Q30 50 42 40 Q40 56 50 58 Q46 34 62 14 Q62 36 76 42 Q72 50 80 54 Q86 40 84 30 Q100 54 96 80 Q94 106 60 112 Z" fill="url(#mg-fs)"/></g>
    ${glowEye(50, 78, 3.4, '#3a0a00')}${glowEye(66, 78, 3.4, '#3a0a00')}<path d="M50 92 Q58 100 68 92" stroke="#3a0a00" stroke-width="3" fill="none"/>`,
  'โกเลมหิน': () => `<defs>${grad('mg-gl', '#9a8f84', '#5a5048')}</defs>
    <rect x="40" y="88" width="16" height="24" rx="3" fill="#6a6058"/><rect x="66" y="88" width="16" height="24" rx="3" fill="#6a6058"/>
    <path d="M32 50 L88 46 L96 92 L28 94 Z" fill="url(#mg-gl)" stroke="#3a3430" stroke-width="2"/>
    <path d="M28 56 L12 92 L26 96 L36 64 Z M90 54 L104 90 L90 94 L84 62 Z" fill="#7a7068" stroke="#3a3430" stroke-width="2"/>
    <path d="M44 22 L76 20 L80 48 L40 50 Z" fill="#8a8078" stroke="#3a3430" stroke-width="2"/>
    <path d="M44 60 L56 72 L50 84 M72 58 L66 74 L76 84" stroke="#ff7a1a" stroke-width="2.5" fill="none" class="amb-twinkle"/>
    ${glowEye(52, 34, 3, '#ff8a2a')}${glowEye(68, 34, 3, '#ff8a2a')}<path d="M50 42 L70 42" stroke="#2a2420" stroke-width="3"/>`,
  'ซาลาแมนเดอร์': () => `<defs>${grad('mg-sa', '#ff8a4a', '#c8301a')}</defs>
    <path d="M86 92 Q110 96 112 76 Q114 64 104 66" stroke="url(#mg-sa)" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M30 104 L24 112 M44 106 L40 114 M76 104 L80 114 M90 102 L96 112" stroke="#a8301a" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="60" cy="94" rx="32" ry="12" fill="url(#mg-sa)"/>
    ${[46, 60, 74].map((x) => `<circle cx="${x}" cy="88" r="3" fill="#ffd23a"/>`).join('')}
    <path d="M44 84 Q52 74 64 82 Q74 72 84 84" fill="#ffb02a" opacity=".85"/>
    <ellipse cx="26" cy="88" rx="16" ry="10" fill="#e8582a"/>${mEye(24, 84, 3.2, '#ffe066')}
    <path d="M10 92 L24 94" stroke="#6a1a0a" stroke-width="1.6"/><path d="M8 90 Q2 86 4 80" stroke="#ffb02a" stroke-width="3" fill="none"/>`,
  'มังกรเพลิง': () => `<defs>${grad('mg-dr', '#ff5a3a', '#8a1a12')}${grad('mg-dw', '#c8302a', '#5a0a0a')}</defs>
    <path d="M96 100 Q118 96 114 78 Q112 70 104 72" stroke="#a82a1a" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M70 60 Q84 12 116 16 Q104 26 110 34 Q96 34 100 46 Q88 44 90 58 Z" fill="url(#mg-dw)" stroke="#4a0a0a" stroke-width="1.5"/>
    <rect x="58" y="94" width="11" height="18" rx="4" fill="#8a1a12"/><rect x="82" y="94" width="11" height="18" rx="4" fill="#8a1a12"/>
    <ellipse cx="74" cy="84" rx="28" ry="20" fill="url(#mg-dr)"/>
    <path d="M60 90 Q74 100 90 92 Q76 96 62 86 Z" fill="#ffd27a"/>
    <path d="M58 76 Q44 60 40 44" stroke="#d8402a" stroke-width="14" fill="none" stroke-linecap="round"/>
    <path d="M52 66 Q66 30 88 30 Q76 40 80 48 Q70 48 72 58 Z" fill="url(#mg-dw)" opacity=".9"/>
    <path d="M44 30 L50 16 L52 30 M34 32 L32 18 L40 30" stroke="#ffd27a" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M46 38 Q30 30 14 40 L10 48 Q22 52 30 48 L42 52 Z" fill="#e8402a"/>
    <path d="M14 46 L28 48" stroke="#4a0a0a" stroke-width="1.5"/>${fangs(16, 46, 3, 3)}
    ${glowEye(34, 38, 2.4, '#ffe066')}
    <g class="mbreath"><path d="M10 46 Q0 40 -2 50 Q4 48 2 56 Q8 50 12 50 Z" fill="#ffb02a"/></g>`,

  'กบยักษ์': () => `<defs>${grad('mg-fr', '#8ee05a', '#3f8a2a')}</defs>
    <path d="M24 112 Q14 100 30 96 L40 106 Z M96 112 Q108 100 92 96 L82 106 Z" fill="#4f9a34"/>
    <ellipse cx="60" cy="90" rx="38" ry="22" fill="url(#mg-fr)"/>
    <ellipse cx="56" cy="96" rx="22" ry="12" fill="#e8f0a8"/>
    <circle cx="40" cy="66" r="12" fill="#7cc947"/><circle cx="70" cy="64" r="12" fill="#7cc947"/>
    ${mEye(40, 66, 6.5, '#ffe066')}${mEye(70, 64, 6.5, '#ffe066')}
    <path d="M24 82 Q56 94 90 80" stroke="#1a3a10" stroke-width="3" fill="none"/>
    <path d="M30 84 Q20 90 14 82" stroke="#ff6a8a" stroke-width="5" fill="none" stroke-linecap="round"/>
    ${[[80, 86], [88, 96], [74, 100]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#3f8a2a"/>`).join('')}`,
  'จระเข้': () => `<defs>${grad('mg-cr', '#5a9a4a', '#2a5a2a')}</defs>
    <path d="M100 96 Q118 92 116 104 Q108 100 98 104 Z" fill="#2a5a2a"/>
    <path d="M40 104 L36 114 M56 106 L54 114 M80 106 L82 114 M94 104 L98 114" stroke="#2a5a2a" stroke-width="6" stroke-linecap="round"/>
    <ellipse cx="68" cy="96" rx="34" ry="12" fill="url(#mg-cr)"/>
    ${[50, 60, 70, 80, 90].map((x) => `<path d="M${x} 86 l4 -6 l4 6z" fill="#2a5a2a"/>`).join('')}
    <path d="M40 90 L6 84 Q4 92 14 94 L40 98 Z" fill="#4f8a3a"/><path d="M40 98 L10 100 Q8 106 18 106 L42 104 Z" fill="#4f8a3a"/>
    ${fangs(10, 94, 6, 3)}<path d="M10 101 l2 -4 l2 4 M18 101 l2 -4 l2 4 M26 101 l2 -4 l2 4" fill="#fff" stroke="#fff"/>
    <ellipse cx="36" cy="84" rx="7" ry="5" fill="#4f8a3a"/>${mEye(36, 83, 3, '#ffe066')}`,
  'ยุงพิษ': () => `<g transform="translate(0 -14)">
    <ellipse cx="72" cy="50" rx="24" ry="9" fill="#cfe8ff" opacity=".55" transform="rotate(-25 72 50)"/>
    <ellipse cx="64" cy="48" rx="20" ry="7" fill="#e6f4ff" opacity=".55" transform="rotate(-50 64 48)"/>
    <ellipse cx="80" cy="74" rx="18" ry="8" fill="#5a3a2a" transform="rotate(15 80 74)"/>
    ${[0, 1, 2].map((i) => `<path d="M${76 + i * 6} 78 Q${70 + i * 8} 96 ${60 + i * 14} 108" stroke="#3a2a1a" stroke-width="2" fill="none"/>`).join('')}
    <ellipse cx="60" cy="68" rx="10" ry="8" fill="#6a4a3a"/>
    <circle cx="46" cy="64" r="8" fill="#5a3a2a"/>${glowEye(43, 62, 2.6, '#e83b3b')}
    <path d="M40 68 L14 82" stroke="#3a2a1a" stroke-width="2.4"/><circle cx="14" cy="82" r="2" fill="#7dff6b"/></g>`,
  'แม่มดหนองน้ำ': () => `<defs>${grad('mg-wt', '#6a3a9a', '#2a1a4a')}</defs>
    <path d="M38 56 Q60 50 82 56 L96 112 L24 112 Z" fill="url(#mg-wt)"/>
    <path d="M24 112 L30 104 L36 112 L42 104 L48 112" fill="#2a1a4a"/>
    <g transform="translate(26 76) rotate(-18)"><rect x="-2" y="-52" width="5" height="88" rx="2" fill="#4a3a1a"/>
      <circle cx="0" cy="-58" r="8" fill="#7dff6b" opacity=".85" class="amb-twinkle"/><path d="M-8 -50 Q0 -44 8 -50 L6 -44 Q0 -40 -6 -44 Z" fill="#e8e4d8"/></g>
    <path d="M42 62 L28 76" stroke="url(#mg-wt)" stroke-width="10" stroke-linecap="round"/><circle cx="28" cy="77" r="5" fill="#8acf6a"/>
    <path d="M78 62 L90 84" stroke="url(#mg-wt)" stroke-width="10" stroke-linecap="round"/>
    <path d="M44 46 Q38 70 46 80 M76 46 Q84 70 76 80" stroke="#c8c8c8" stroke-width="6" fill="none"/>
    <circle cx="60" cy="42" r="16" fill="#8acf6a"/>
    <path d="M46 44 L34 50 L46 50 Z" fill="#7aba5a"/><circle cx="40" cy="48" r="1.8" fill="#4a7a3a"/>
    ${glowEye(52, 40, 2.4, '#ffe066')}${glowEye(66, 40, 2.4, '#ffe066')}
    <path d="M52 52 Q60 56 66 52" stroke="#2a3a1a" stroke-width="2" fill="none"/>
    <ellipse cx="60" cy="28" rx="28" ry="6" fill="#2a1a4a"/><path d="M42 28 Q56 20 62 -2 Q66 6 78 4 Q70 12 74 28 Z" fill="#3a2a5a"/>
    <rect x="44" y="24" width="32" height="5" fill="#7dff6b"/>`,

  'หมีขั้วโลก': () => `<defs>${grad('mg-pb', '#ffffff', '#c8dcec')}</defs>
    <rect x="72" y="86" width="14" height="26" rx="6" fill="#d8e8f4"/><rect x="88" y="84" width="14" height="28" rx="6" fill="#d8e8f4"/>
    <ellipse cx="74" cy="80" rx="32" ry="22" fill="url(#mg-pb)"/>
    <rect x="42" y="88" width="14" height="24" rx="6" fill="#e8f2fa"/><rect x="58" y="90" width="14" height="22" rx="6" fill="#e8f2fa"/>
    <circle cx="40" cy="62" r="18" fill="#f4f8fc"/><circle cx="36" cy="46" r="6" fill="#f4f8fc"/><circle cx="52" cy="46" r="6" fill="#f4f8fc"/>
    <circle cx="36" cy="46" r="3" fill="#c8dcec"/><circle cx="52" cy="46" r="3" fill="#c8dcec"/>
    <ellipse cx="26" cy="68" rx="9" ry="7" fill="#e8f0f8"/><circle cx="20" cy="66" r="3.2" fill="#1a1a1a"/>
    ${mEye(36, 58, 2.8)}${mEye(48, 58, 2.8)}<path d="M20 74 Q26 78 32 74" stroke="#1a1a1a" stroke-width="2" fill="none"/>${fangs(22, 74, 2, 3)}`,
  'ตุ๊กตาหิมะคลั่ง': () => `<circle cx="60" cy="92" r="22" fill="#fff" stroke="#c8dcec" stroke-width="2"/>
    <circle cx="60" cy="58" r="17" fill="#fff" stroke="#c8dcec" stroke-width="2"/>
    <path d="M44 56 L22 44 L18 36 M22 44 L14 46 M76 56 L96 44 L100 34" stroke="#6a4a2a" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    ${[52, 60, 68].map((y) => `<circle cx="60" cy="${y + 30}" r="2.4" fill="#2a2a2a"/>`).join('')}
    <circle cx="60" cy="34" r="14" fill="#fff" stroke="#c8dcec" stroke-width="2"/>
    <path d="M42 22 L78 22 L76 20 L72 2 L48 2 L44 20 Z" fill="#2a2a3a"/><rect x="46" y="16" width="28" height="4" fill="#c8302c"/>
    ${glowEye(54, 32, 2.2, '#3a1010')}${glowEye(66, 32, 2.2, '#3a1010')}<path d="M52 27 L57 29 M68 27 L63 29" stroke="#1a1a1a" stroke-width="2"/>
    <path d="M58 37 L40 40 L58 41 Z" fill="#ff8a2a"/><path d="M52 44 Q60 40 68 44" stroke="#1a1a1a" stroke-width="2" fill="none"/>
    <path d="M48 48 Q60 54 72 48 L74 54 L66 52 L70 60 L60 54 Z" fill="#c8302c"/>`,
  'เพนกวินนักรบ': () => `<g transform="translate(24 76) rotate(-10)"><rect x="-2" y="-62" width="4" height="96" fill="#7a5a3a"/><path d="M0 -76 L6 -62 L-6 -62 Z" fill="#c8dcec" stroke="#6a7a8a"/></g>
    <path d="M44 108 L38 114 L54 114 Z M64 108 L62 114 L78 114 Z" fill="#ff9a3a"/>
    <ellipse cx="60" cy="76" rx="26" ry="34" fill="#1f2433"/>
    <ellipse cx="54" cy="82" rx="16" ry="26" fill="#f4f8fc"/>
    <path d="M36 66 Q24 78 26 90" stroke="#1f2433" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M30 50 L16 54 L30 58 Z" fill="#ff9a3a"/>${mEye(44, 50, 3.6)}
    <path d="M34 42 Q50 26 72 34 L80 48 Q60 40 34 46 Z" fill="#8a96a8" stroke="#4a5262" stroke-width="1.5"/><path d="M58 30 L60 18 L64 30" fill="#c8302c"/>`,
  'แมมมอธน้ำแข็ง': () => `<defs>${grad('mg-mm', '#9a6a4a', '#5a3a24')}</defs>
    <rect x="76" y="88" width="16" height="24" rx="6" fill="#5a3a24"/><rect x="94" y="86" width="15" height="26" rx="6" fill="#5a3a24"/>
    <ellipse cx="76" cy="72" rx="38" ry="30" fill="url(#mg-mm)"/>
    ${[56, 70, 84, 96].map((x, i) => `<path d="M${x} ${48 + (i % 2) * 4} q4 8 0 14" stroke="#c8dcec" stroke-width="3" fill="none" opacity=".7"/>`).join('')}
    <rect x="44" y="88" width="16" height="24" rx="6" fill="#6a4a30"/><rect x="62" y="90" width="15" height="22" rx="6" fill="#6a4a30"/>
    <ellipse cx="66" cy="44" rx="14" ry="20" fill="#7a5034"/>
    <circle cx="38" cy="56" r="22" fill="#8a5a3a"/>
    <path d="M26 64 Q14 80 20 100 Q24 108 30 102 Q24 90 32 74" fill="#7a5034"/>
    <path d="M34 72 Q14 82 10 66 Q6 58 14 56 Q12 70 30 64" fill="#fffbe8" stroke="#c8b890" stroke-width="1.5"/>
    <path d="M46 74 Q30 90 22 78" stroke="#fffbe8" stroke-width="5" fill="none" stroke-linecap="round"/>
    ${glowEye(32, 50, 2.6, '#8fd0ff')}<path d="M26 44 L36 46" stroke="#2a1a10" stroke-width="2.5"/>
    <path d="M30 36 L38 26 L44 36 L52 26 L56 38" fill="#bdf0ff" stroke="#7cc7e8"/>`,

  'ฉลามคลั่ง': () => `<defs>${grad('mg-sh', '#7a8fa8', '#3a4a62')}</defs><g transform="translate(0 -8)">
    <path d="M96 70 L118 52 L112 72 L118 92 Z" fill="#4a5a72"/>
    <path d="M60 50 L76 26 L82 52 Z" fill="#4a5a72"/>
    <path d="M10 72 Q30 48 70 52 Q100 56 104 72 Q100 88 70 92 Q30 96 10 72 Z" fill="url(#mg-sh)"/>
    <path d="M14 76 Q40 92 70 88 Q40 96 14 76 Z" fill="#e8eef6"/>
    <path d="M56 86 L48 100 L66 88 Z" fill="#4a5a72"/>
    <path d="M14 76 Q24 70 36 78 Q24 84 14 76 Z" fill="#7a1a2a"/>${fangs(16, 75, 5, 3)}
    ${mEye(30, 66, 3)}${[44, 48, 52].map((x) => `<path d="M${x} 64 q2 6 0 10" stroke="#2a3a52" stroke-width="1.5" fill="none"/>`).join('')}</g>`,
  'ปูเหล็ก': () => `<defs>${grad('mg-cb', '#a8b8c8', '#5a6a7e')}</defs>
    ${[0, 1, 2].map((i) => `<path d="M${50 + i * 8} 96 L${36 + i * 6} 112 M${70 + i * 8} 96 L${84 + i * 8} 112" stroke="#5a6a7e" stroke-width="4" stroke-linecap="round"/>`).join('')}
    <ellipse cx="62" cy="86" rx="32" ry="18" fill="url(#mg-cb)" stroke="#3a4a5e" stroke-width="2"/>
    ${[50, 62, 74].map((x) => `<circle cx="${x}" cy="80" r="2.5" fill="#3a4a5e"/>`).join('')}
    <path d="M36 80 Q24 70 22 58" stroke="#7a8a9e" stroke-width="7" fill="none"/>
    <path d="M22 58 Q4 50 6 34 Q14 40 22 40 Q14 30 22 22 Q34 34 28 54 Z" fill="url(#mg-cb)" stroke="#3a4a5e" stroke-width="2"/>
    <path d="M88 80 Q100 72 104 62" stroke="#7a8a9e" stroke-width="7" fill="none"/>
    <path d="M104 62 Q118 54 116 42 Q110 46 104 46 Q110 38 104 32 Q94 42 98 58 Z" fill="url(#mg-cb)" stroke="#3a4a5e" stroke-width="2"/>
    <path d="M52 70 L50 60 M70 70 L72 60" stroke="#5a6a7e" stroke-width="3"/>${mEye(50, 58, 4)}${mEye(72, 58, 4)}`,
  'แมงกะพรุนไฟฟ้า': () => `<g transform="translate(0 -12)" class="mfloat">
    ${[36, 48, 60, 72, 84].map((x, i) => `<path d="M${x} 66 Q${x - 6} 82 ${x + 2} 96 Q${x + 8} 108 ${x} 118" stroke="#d088ff" stroke-width="3" fill="none" opacity=".75"/>`).join('')}
    <path d="M24 68 Q22 30 60 26 Q98 30 96 68 Q86 74 78 68 Q70 74 60 68 Q50 74 42 68 Q34 74 24 68 Z" fill="#f088c8" opacity=".85" stroke="#c858a8" stroke-width="2"/>
    <ellipse cx="46" cy="40" rx="10" ry="5" fill="#fff" opacity=".5"/>
    ${glowEye(50, 54, 3, '#fffbe8')}${glowEye(70, 54, 3, '#fffbe8')}
    <path d="M30 80 L38 88 L32 92 L42 102" stroke="#fff27a" stroke-width="2.5" fill="none" class="amb-twinkle"/></g>`,
  'คราเคน': () => `<defs>${grad('mg-kr', '#b05ad6', '#4a1a7a')}</defs>
    ${[[20, 1], [40, -1], [62, 1], [84, -1], [104, 1]].map(([x, d], i) => `<path class="amb-sway" style="transform-origin:${x}px 100px;animation-delay:${i * .3}s" d="M${x} 112 Q${x + 14 * d} 96 ${x} 82 Q${x - 12 * d} 70 ${x + 4 * d} 62" stroke="#8a3ab8" stroke-width="10" fill="none" stroke-linecap="round"/>`).join('')}
    <path d="M28 76 Q22 22 64 16 Q106 22 98 76 Q64 90 28 76 Z" fill="url(#mg-kr)" stroke="#3a0a5a" stroke-width="2"/>
    ${[[40, 34], [80, 30], [62, 24]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#d088ff" opacity=".6"/>`).join('')}
    ${glowEye(48, 54, 5, '#ffe066')}${glowEye(74, 54, 5, '#ffe066')}
    <path d="M40 46 L54 50 M84 46 L70 50" stroke="#2a0a3a" stroke-width="3"/>
    <path d="M52 70 Q62 76 72 70" stroke="#2a0a3a" stroke-width="3" fill="none"/>`,

  'ภูตลมพายุ': () => `<g class="mspin-slow"><path d="M60 110 Q20 100 30 70 Q38 50 60 52 Q80 54 78 70 Q76 84 60 82 Q48 80 50 70" stroke="#d8e8f8" stroke-width="9" fill="none" stroke-linecap="round" opacity=".9"/>
    <path d="M60 52 Q30 40 40 18 Q50 6 70 12 Q92 22 88 44" stroke="#b8d0e8" stroke-width="8" fill="none" stroke-linecap="round" opacity=".85"/></g>
    ${glowEye(52, 38, 3, '#38c6ff')}${glowEye(68, 40, 3, '#38c6ff')}<path d="M54 50 Q60 46 68 50" stroke="#38c6ff" stroke-width="2" fill="none"/>`,
  'อีกาสายฟ้า': () => `<g transform="translate(0 -12)">
    <path d="M66 62 Q90 24 118 30 Q106 40 112 48 Q98 48 100 58 Q88 56 82 68 Z" fill="#1a1a24" stroke="#fff27a" stroke-width="1.2"/>
    <path d="M88 76 L112 88 L104 78 L114 74 Z" fill="#1a1a24"/>
    <ellipse cx="64" cy="72" rx="24" ry="16" fill="#2a2a38"/>
    <circle cx="40" cy="58" r="14" fill="#2a2a38"/>
    <path d="M28 56 L8 62 L28 66 Z" fill="#ffcc4d"/>${glowEye(38, 54, 2.6, '#fff27a')}
    <path d="M52 66 Q40 30 14 36 Q26 44 22 52 Q34 50 36 62 Z" fill="#1a1a24" stroke="#fff27a" stroke-width="1.2"/>
    <path d="M58 88 L54 102 M68 88 L70 102" stroke="#ffcc4d" stroke-width="3"/>
    <path d="M78 40 L72 54 L80 54 L74 68" stroke="#fff27a" stroke-width="2.5" fill="none" class="amb-twinkle"/></g>`,
  'ยักษ์เมฆ': () => `<defs>${grad('mg-cg', '#8a96b8', '#3a4262')}</defs>
    <path d="M70 92 L62 106 L70 106 L62 120" stroke="#fff27a" stroke-width="4" fill="none" class="amb-twinkle"/>
    <g fill="url(#mg-cg)"><circle cx="34" cy="70" r="22"/><circle cx="60" cy="54" r="30"/><circle cx="88" cy="68" r="24"/><ellipse cx="62" cy="86" rx="44" ry="16"/></g>
    <path d="M22 66 Q10 76 16 92" stroke="#6a7698" stroke-width="10" fill="none" stroke-linecap="round"/>
    ${glowEye(48, 54, 3.6, '#fff27a')}${glowEye(70, 54, 3.6, '#fff27a')}
    <path d="M40 44 L54 48 M78 44 L64 48" stroke="#1a1a2a" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M48 70 Q60 62 72 70" stroke="#1a1a2a" stroke-width="3" fill="none"/>`,
  'พญาครุฑ': () => `<defs>${grad('mg-gr', '#ffe08a', '#c8901a')}${grad('mg-gr2', '#e83b3b', '#8a1a1a')}</defs>
    <path d="M62 60 Q90 10 120 14 Q110 22 116 28 Q102 28 108 38 Q92 38 96 50 Q84 50 80 66 Z" fill="url(#mg-gr)" stroke="#a87a10" stroke-width="1.2"/>
    <path d="M58 60 Q30 10 0 14 Q10 22 4 28 Q18 28 12 38 Q28 38 24 50 Q36 50 40 66 Z" fill="url(#mg-gr)" stroke="#a87a10" stroke-width="1.2"/>
    <path d="M48 96 L44 112 L38 114 M70 96 L74 112 L80 114" stroke="#ffcc4d" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M42 62 Q60 56 78 62 L76 98 Q60 104 44 98 Z" fill="url(#mg-gr2)" stroke="#5a0a0a" stroke-width="1.5"/>
    <path d="M44 72 L76 72 M46 84 L74 84" stroke="#ffcc4d" stroke-width="3"/>
    <circle cx="58" cy="46" r="15" fill="#c8302c"/>
    <path d="M46 46 L32 52 L46 56 Z" fill="#ffcc4d" stroke="#a87a10"/>${glowEye(52, 42, 2.4, '#fff27a')}
    <path d="M44 36 L74 36 L70 28 L48 28 Z M48 28 L70 28 L66 20 L52 20 Z M52 20 L66 20 L59 4 Z" fill="url(#mg-gr)" stroke="#a87a10" stroke-width=".8"/>`,

  'วิญญาณร้าย': () => `<g class="mfloat"><path d="M30 104 Q24 60 32 42 Q42 20 62 20 Q86 22 90 46 Q96 70 92 104 L84 96 L76 106 L68 96 L60 106 L52 96 L44 106 L38 96 Z" fill="#eef0ff" opacity=".92" stroke="#b8b8e8" stroke-width="2"/>
    <path d="M32 62 Q16 66 12 78 M88 62 Q102 66 104 80" stroke="#eef0ff" stroke-width="8" fill="none" stroke-linecap="round" opacity=".9"/>
    <ellipse cx="48" cy="52" rx="7" ry="9" fill="#2a1a3a"/><ellipse cx="68" cy="52" rx="7" ry="9" fill="#2a1a3a"/>
    ${glowEye(47, 53, 1.8, '#b884ff')}${glowEye(67, 53, 1.8, '#b884ff')}<ellipse cx="58" cy="72" rx="7" ry="9" fill="#2a1a3a"/></g>`,
  'ตุ๊กตาต้องสาป': () => `<path d="M44 76 L36 110 L84 110 L76 76 Z" fill="#8a2a4a"/>
    <path d="M36 110 Q42 104 48 110 Q54 104 60 110 Q66 104 72 110 Q78 104 84 110" stroke="#f2e6d8" stroke-width="3" fill="none"/>
    <path d="M46 78 L32 92 M74 78 L84 94" stroke="#f2e6d8" stroke-width="6" stroke-linecap="round"/>
    <path d="M52 110 L52 114 M68 110 L68 114" stroke="#2a1a1a" stroke-width="5"/>
    <circle cx="60" cy="52" r="22" fill="#f2e6d8"/>
    <path d="M38 52 Q34 24 60 26 Q86 24 82 52 Q80 38 60 36 Q40 38 38 52 Z M38 50 L32 78 M82 50 L88 78" fill="#2a1a1a" stroke="#2a1a1a" stroke-width="5"/>
    <circle cx="50" cy="52" r="5" fill="#2a1a1a"/><path d="M47 49 L53 55 M53 49 L47 55" stroke="#c83030" stroke-width="1.5"/>
    <circle cx="70" cy="52" r="5" fill="#2a1a1a"/>${glowEye(70, 52, 1.5, '#ff3b3b')}
    <path d="M50 64 Q60 70 70 64" stroke="#2a1a1a" stroke-width="2" fill="none"/><path d="M52 64 L52 68 M56 66 L56 70 M60 66 L60 70 M64 66 L64 70 M68 64 L68 68" stroke="#2a1a1a" stroke-width="1"/>
    <path d="M40 60 L48 58 M44 70 L48 64" stroke="#8a2a4a" stroke-width="1.5"/>`,
  'อัศวินกระดูก': () => skeleton(true),
  'เจ้าแห่งยมโลก': () => `<defs>${grad('mg-vp', '#c8202a', '#5a0a10')}</defs>
    <path d="M30 50 Q14 80 14 112 L106 112 Q106 80 90 50 Z" fill="#14101c"/>
    <path d="M36 54 Q26 84 28 110 L92 110 Q94 84 84 54 Z" fill="url(#mg-vp)"/>
    <path d="M44 56 Q60 52 76 56 L76 108 L44 108 Z" fill="#1f1a2a"/><path d="M58 58 L60 86 L62 58 Z" fill="#fff"/>
    <path d="M44 62 L28 80" stroke="#1f1a2a" stroke-width="9" stroke-linecap="round"/><path d="M28 80 L20 76 M28 80 L22 86" stroke="#e8dcd0" stroke-width="2.5"/>
    <path d="M34 50 L26 26 L50 44 Z M86 50 L94 26 L70 44 Z" fill="#14101c" stroke="#8a1a2a" stroke-width="1.5"/>
    <circle cx="60" cy="40" r="15" fill="#e8dcd0"/>
    <path d="M45 38 Q46 22 60 22 Q74 22 75 38 L68 30 L60 36 L52 30 Z" fill="#14101c"/>
    ${glowEye(53, 40, 2.4, '#ff2a3a')}${glowEye(67, 40, 2.4, '#ff2a3a')}
    <path d="M54 48 Q60 51 66 48" stroke="#5a0a10" stroke-width="1.6" fill="none"/>${fangs(55, 48, 2, 3)}
    ${crownG(48, 22, 24, '#b8b8c8')}`,

  'อัศวินดำ': () => `<defs>${grad('mg-dk', '#4a4f62', '#1a1c26')}</defs>
    <rect x="46" y="86" width="12" height="26" rx="3" fill="#2a2c38"/><rect x="62" y="86" width="12" height="26" rx="3" fill="#2a2c38"/>
    <path d="M38 56 Q60 48 82 56 L80 92 L40 92 Z" fill="url(#mg-dk)" stroke="#0a0a10" stroke-width="2"/>
    <path d="M70 62 L102 58 L100 96 Q86 106 72 96 Z" fill="#2a2c38" stroke="#8a1a2a" stroke-width="2"/><path d="M86 66 L86 94 M76 78 L96 78" stroke="#8a1a2a" stroke-width="3"/>
    <path d="M42 62 L28 84" stroke="#3a3c4a" stroke-width="9" stroke-linecap="round"/>
    <g transform="translate(26 86) rotate(-30)"><path d="M-3 -4 L-3 -60 L0 -66 L3 -60 L3 -4 Z" fill="#9aa5bd" stroke="#4a4f62"/><rect x="-10" y="-6" width="20" height="4" fill="#8a1a2a"/><rect x="-2" y="-2" width="4" height="12" fill="#1a1a1a"/></g>
    <path d="M42 46 Q40 20 60 20 Q80 20 78 46 Q60 54 42 46 Z" fill="url(#mg-dk)" stroke="#0a0a10" stroke-width="2"/>
    <rect x="44" y="34" width="32" height="5" fill="#0a0a10"/>${glowEye(52, 36.5, 1.8, '#ff2a3a')}${glowEye(66, 36.5, 1.8, '#ff2a3a')}
    <path d="M60 20 Q70 6 84 10 Q76 14 74 22" fill="#8a1a2a"/>`,
  'ปีศาจ': () => `<defs>${grad('mg-dm', '#ff4a4a', '#9a1a1a')}</defs>
    <path d="M60 64 Q90 30 112 40 Q100 46 104 54 Q92 52 92 62 Q82 60 78 72 Z" fill="#5a0a14"/>
    <path d="M78 94 Q104 100 108 84 L112 78 L104 80" stroke="#c8202a" stroke-width="4" fill="none"/>
    <path d="M48 92 L44 112 M66 92 L70 112" stroke="#9a1a1a" stroke-width="8" stroke-linecap="round"/>
    <ellipse cx="58" cy="78" rx="20" ry="20" fill="url(#mg-dm)"/>
    <g transform="translate(28 84) rotate(-25)"><rect x="-2" y="-54" width="4" height="70" fill="#3a2a2a"/><path d="M-10 -54 L-10 -66 M0 -54 L0 -70 M10 -54 L10 -66 M-10 -54 L10 -54" stroke="#ffcc4d" stroke-width="3" fill="none"/></g>
    <path d="M40 72 L28 84" stroke="#c8303a" stroke-width="8" stroke-linecap="round"/>
    <circle cx="56" cy="46" r="18" fill="#e8403a"/>
    <path d="M42 36 Q32 24 36 12 Q42 26 48 30 Z M70 36 Q80 24 76 12 Q70 26 64 30 Z" fill="#2a1a1a"/>
    ${glowEye(49, 44, 2.6, '#ffe066')}${glowEye(63, 44, 2.6, '#ffe066')}
    <path d="M46 54 Q56 62 66 54" stroke="#3a0a0a" stroke-width="2.5" fill="none"/>${fangs(49, 54, 3, 3)}`,
  'ลิช': () => `<defs>${grad('mg-lc', '#2a3a2a', '#0a140a')}</defs>
    <circle cx="60" cy="70" r="44" fill="#7dff6b" opacity=".08"/>
    <path d="M36 50 Q60 42 84 50 L98 112 L22 112 Z" fill="url(#mg-lc)"/>
    <path d="M22 112 L30 102 L36 112 L44 100 L52 112 L60 102 L68 112 L76 100 L84 112 L90 102 L98 112" fill="#0a140a"/>
    <g transform="translate(24 78) rotate(-14)"><rect x="-2" y="-58" width="4" height="92" fill="#4a3a2a"/><path d="M-8 -60 L0 -76 L8 -60 Z" fill="#c8c8c8"/>
      <circle cx="0" cy="-62" r="6" fill="#7dff6b" class="amb-twinkle"/></g>
    <path d="M40 58 L26 74" stroke="#1a2a1a" stroke-width="9" stroke-linecap="round"/><path d="M26 74 L20 70 M26 74 L22 80" stroke="#e8e4d8" stroke-width="2.5"/>
    <path d="M40 40 Q38 18 60 16 Q82 18 80 40 L84 62 Q60 50 36 62 Z" fill="#1a2a1a"/>
    <circle cx="60" cy="38" r="13" fill="#e8e4d8"/>
    <ellipse cx="54" cy="38" rx="4" ry="4.5" fill="#0a0a0a"/><ellipse cx="66" cy="38" rx="4" ry="4.5" fill="#0a0a0a"/>
    ${glowEye(54, 38, 1.8, '#7dff6b')}${glowEye(66, 38, 1.8, '#7dff6b')}
    <path d="M54 48 L66 48 M57 46 L57 50 M60 46 L60 50 M63 46 L63 50" stroke="#0a0a0a" stroke-width="1.2"/>
    ${crownG(48, 26, 24, '#c8a040')}`,
  'จอมมาร': () => `<defs>${grad('mg-dl', '#6a2a8a', '#1a0a2a')}${grad('mg-dl2', '#9a1a3a', '#3a0a14')}</defs>
    <path d="M58 54 Q100 0 124 10 Q110 20 118 28 Q102 28 108 40 Q92 38 94 52 Q84 52 80 66 Z" fill="#2a0a1a" stroke="#9a1a3a" stroke-width="1.5"/>
    <path d="M62 54 Q20 0 -4 10 Q10 20 2 28 Q18 28 12 40 Q28 38 26 52 Q36 52 40 66 Z" fill="#2a0a1a" stroke="#9a1a3a" stroke-width="1.5"/>
    <path d="M26 66 Q60 54 94 66 L104 114 L16 114 Z" fill="url(#mg-dl2)"/>
    <path d="M40 64 Q60 56 80 64 L80 106 L40 106 Z" fill="url(#mg-dl)" stroke="#0a0a10" stroke-width="2"/>
    <path d="M46 72 L74 72 M48 86 L72 86" stroke="#ffcc4d" stroke-width="2.5"/><circle cx="60" cy="79" r="4" fill="#ff2a5a"/>
    <path d="M40 70 L24 92" stroke="#3a1a4a" stroke-width="11" stroke-linecap="round"/><circle cx="22" cy="94" r="6" fill="#8a6aa8"/>
    <circle cx="22" cy="80" r="9" fill="#b884ff" opacity=".5" class="amb-twinkle"/>
    <circle cx="60" cy="44" r="18" fill="#7a4a9a"/>
    <path d="M44 34 Q24 22 22 2 Q34 18 48 24 Z M76 34 Q96 22 98 2 Q86 18 72 24 Z" fill="#1a0a14" stroke="#9a1a3a" stroke-width="1.2"/>
    ${glowEye(52, 42, 3, '#ff2a5a')}${glowEye(68, 42, 3, '#ff2a5a')}
    <path d="M44 34 L56 38 M76 34 L64 38" stroke="#0a0a10" stroke-width="3"/>
    <path d="M50 54 Q60 60 70 54" stroke="#1a0a14" stroke-width="2.5" fill="none"/>${fangs(52, 54, 3, 3)}
    ${crownG(46, 28, 28)}`,
};

/* ภาพมอนสเตอร์เป็น SVG — ถ้าไม่มีภาพจะใช้อีโมจิ */
/* ภาพมอนสเตอร์ที่หันขวา — กลับด้านในฉากต่อสู้ให้หันหาผู้กล้า (ปกติภาพหันซ้าย/หันหน้าตรง) */
/* บอสตัวใหญ่พิเศษ: แสดงเต็มฉาก ปีก/หางด้านขวาล้นขอบได้ */
const HUGE_MON = new Set(['mon/volcano_boss.webp']);
const MON_FACE_RIGHT = new Set(['forest_4', 'sea_1', 'sky_5', 'spirit_4', 'volcano_4', 'volcano_5', 'w2castle_5', 'w2cave_2', 'w2cave_5', 'w2desert_5', 'w2forest_3', 'w2sea_1', 'w2volcano_4', 'worldboss', 'worldboss1'].map((n) => `mon/${n}.webp`));
function monsterSVG(name, size, fallback) {
  const img = typeof MONSTER_IMG !== 'undefined' && MONSTER_IMG[name];
  if (img) return `<img class="mon-img ${MON_FACE_RIGHT.has(img) ? 'flip' : ''}" src="${img}" alt="${name}" style="height:${size}px">`;
  const f = MONSTER_ART[name];
  if (!f) return `<span style="font-size:${Math.round(size * 0.7)}px">${fallback || '❓'}</span>`;
  return `<svg class="mon-svg" viewBox="0 0 120 120" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" aria-label="${name}" style="overflow:visible">${f()}</svg>`;
}
