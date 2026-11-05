'use strict';
/* ============================================================
   ฉากต่อสู้ 2D — ฉากหลังแต่ละด่าน + แอนิเมชันการโจมตี
   ตัวเกมส่ง "เหตุการณ์" (events) มา แล้วไฟล์นี้เล่นภาพตามลำดับ
   ============================================================ */

/* ---------- ฉากหลัง (SVG 400×240) ---------- */
const SCENE = {
  forest: () => `
    <defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7ec8e3"/><stop offset="1" stop-color="#d7f0d0"/></linearGradient></defs>
    <rect width="400" height="240" fill="url(#sk)"/>
    <circle cx="330" cy="50" r="22" fill="#fff6c4"/>
    <g class="amb-drift" fill="#fff" opacity=".85"><ellipse cx="80" cy="45" rx="30" ry="10"/><ellipse cx="100" cy="38" rx="20" ry="10"/><ellipse cx="250" cy="70" rx="26" ry="8"/></g>
    <path d="M0 150 Q60 110 130 140 Q200 100 270 135 Q340 105 400 130 L400 240 L0 240 Z" fill="#7fb87a"/>
    ${[10, 55, 100, 300, 345, 385].map((x, i) => `<g class="amb-sway" style="animation-delay:${i * .3}s;transform-origin:${x}px 190px"><path d="M${x} ${118 + (i % 2) * 10} L${x - 18} 175 L${x + 18} 175 Z" fill="#2f6b3a"/><path d="M${x} ${140 + (i % 2) * 10} L${x - 22} 192 L${x + 22} 192 Z" fill="#285e32"/><rect x="${x - 3}" y="190" width="6" height="10" fill="#5a3b22"/></g>`).join('')}
    <rect y="196" width="400" height="44" fill="#4f8a3c"/>
    <path d="M0 196 Q100 190 200 197 Q300 203 400 195 L400 202 L0 202 Z" fill="#62a24a"/>
    ${[30, 140, 220, 330].map((x) => `<path d="M${x} 210 l3 -8 l3 8 l3 -6 l2 6" stroke="#79c25a" stroke-width="2" fill="none"/>`).join('')}`,
  cave: () => `
    <defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f0c1c"/><stop offset="1" stop-color="#2a2342"/></linearGradient></defs>
    <rect width="400" height="240" fill="url(#sk)"/>
    <path d="M0 0 L400 0 L400 30 L380 70 L362 28 L330 55 L300 22 L270 80 L240 25 L200 50 L170 20 L140 66 L110 24 L80 52 L50 18 L20 60 L0 30 Z" fill="#1a1528"/>
    <path d="M0 120 Q50 90 90 130 L90 200 L0 200 Z M310 130 Q360 85 400 110 L400 200 L310 200 Z" fill="#221c33"/>
    ${[[40, 170, '#b884ff'], [70, 182, '#38e0d0'], [330, 172, '#38e0d0'], [365, 180, '#b884ff']].map(([x, y, c], i) => `<g class="amb-twinkle" style="animation-delay:${i * .5}s"><path d="M${x} ${y} l6 -18 l6 18 z" fill="${c}" opacity=".85"/><path d="M${x + 8} ${y} l4 -11 l4 11 z" fill="${c}" opacity=".6"/></g>`).join('')}
    <rect y="196" width="400" height="44" fill="#2d2638"/>
    <path d="M0 196 L400 196 L400 200 L0 200 Z" fill="#3a3150"/>`,
  desert: () => `
    <defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9f4a"/><stop offset="1" stop-color="#ffe3a3"/></linearGradient></defs>
    <rect width="400" height="240" fill="url(#sk)"/>
    <circle cx="300" cy="70" r="34" fill="#fff1b8" opacity=".9"/>
    <path d="M200 160 L250 90 L300 160 Z" fill="#d9a45a"/><path d="M250 90 L300 160 L268 160 Z" fill="#b8843f"/>
    <path d="M290 160 L320 120 L350 160 Z" fill="#cf9a52"/>
    <path d="M0 165 Q80 135 170 165 Q260 140 400 162 L400 240 L0 240 Z" fill="#e8b867"/>
    ${[[60, 150], [370, 152]].map(([x, y]) => `<g fill="#4f8a3c"><rect x="${x}" y="${y - 30}" width="8" height="34" rx="4"/><path d="M${x} ${y - 14} q-10 0 -10 -12" stroke="#4f8a3c" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M${x + 8} ${y - 20} q10 0 10 -10" stroke="#4f8a3c" stroke-width="6" fill="none" stroke-linecap="round"/></g>`).join('')}
    <rect y="196" width="400" height="44" fill="#d29a4a"/>
    <path d="M0 196 Q100 190 200 196 Q300 202 400 194 L400 200 L0 200 Z" fill="#e3ad5c"/>
    <g class="amb-drift" opacity=".35" fill="#fff"><ellipse cx="120" cy="210" rx="40" ry="2"/><ellipse cx="280" cy="222" rx="50" ry="2"/></g>`,
  volcano: () => `
    <defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a0a08"/><stop offset="1" stop-color="#a8321c"/></linearGradient></defs>
    <rect width="400" height="240" fill="url(#sk)"/>
    <path d="M120 180 L190 60 L220 60 L300 180 Z" fill="#2a1410"/>
    <path d="M190 60 Q205 50 220 60 L212 80 Q205 70 198 80 Z" fill="#ff6a00"/>
    <path d="M205 66 Q200 100 214 130 Q206 160 218 180" stroke="#ff7a1a" stroke-width="5" fill="none" opacity=".9"/>
    <g class="amb-smoke" fill="#5a3a35" opacity=".6"><circle cx="200" cy="40" r="14"/><circle cx="215" cy="28" r="12"/><circle cx="196" cy="18" r="10"/></g>
    ${Array.from({ length: 10 }, (_, i) => `<circle class="amb-rise" style="animation-delay:${i * .45}s;animation-duration:${3 + (i % 3)}s" cx="${20 + i * 38}" cy="230" r="${1.5 + (i % 3)}" fill="#ffb347"/>`).join('')}
    <rect y="196" width="400" height="44" fill="#2a1410"/>
    <path d="M30 210 L80 214 L120 208 M220 220 L280 216 L330 224" stroke="#ff5a1a" stroke-width="2.5" fill="none" class="amb-twinkle"/>`,
  swamp: () => `
    <defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e3322"/><stop offset="1" stop-color="#6f8f5a"/></linearGradient></defs>
    <rect width="400" height="240" fill="url(#sk)"/>
    ${[[40, 1], [350, -1], [290, 1]].map(([x, d]) => `<path d="M${x} 196 L${x + 4} 110 Q${x + 4 + 20 * d} 90 ${x + 30 * d} 84 M${x + 3} 140 Q${x - 18 * d} 120 ${x - 24 * d} 118 M${x + 4} 120 Q${x + 26 * d} 118 ${x + 34 * d} 104" stroke="#1a2414" stroke-width="7" fill="none" stroke-linecap="round"/>`).join('')}
    <g class="amb-drift" fill="#cfe3c0" opacity=".25"><ellipse cx="100" cy="170" rx="90" ry="10"/><ellipse cx="300" cy="182" rx="110" ry="9"/></g>
    ${Array.from({ length: 7 }, (_, i) => `<circle class="amb-twinkle" style="animation-delay:${i * .6}s" cx="${40 + i * 52}" cy="${120 + (i % 3) * 20}" r="2" fill="#d9ff7a"/>`).join('')}
    <rect y="196" width="400" height="44" fill="#2f4a3a"/>
    ${[[70, 214], [240, 222], [330, 208]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="12" ry="4" fill="#4f8a3c"/>`).join('')}`,
  ice: () => `
    <defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd0ff"/><stop offset="1" stop-color="#eaf8ff"/></linearGradient></defs>
    <rect width="400" height="240" fill="url(#sk)"/>
    <path d="M0 170 L70 80 L130 160 L200 60 L280 160 L340 95 L400 150 L400 240 L0 240 Z" fill="#b9d9ee"/>
    <path d="M70 80 L58 96 L72 92 L84 100 Z M200 60 L184 82 L200 76 L216 84 Z M340 95 L330 108 L342 104 L352 110 Z" fill="#fff"/>
    ${[[30, 196], [80, 196], [320, 196], [372, 196]].map(([x, y], i) => `<path d="M${x} ${y} l7 ${-26 - (i % 2) * 12} l7 ${26 + (i % 2) * 12} z" fill="#bdf0ff" stroke="#7cc7e8"/>`).join('')}
    <rect y="196" width="400" height="44" fill="#e8f4ff"/>
    <path d="M0 196 L400 196 L400 201 L0 201 Z" fill="#cde7f7"/>
    ${Array.from({ length: 16 }, (_, i) => `<circle class="amb-fall" style="animation-delay:${(i * .37) % 4}s;animation-duration:${4 + (i % 4)}s" cx="${12 + i * 25}" cy="-6" r="${1.4 + (i % 3) * .6}" fill="#fff"/>`).join('')}`,
  sea: () => `
    <defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d4d75"/><stop offset="1" stop-color="#062033"/></linearGradient></defs>
    <rect width="400" height="240" fill="url(#sk)"/>
    <g fill="#fff" opacity=".07"><path d="M80 0 L120 0 L60 200 L20 200 Z"/><path d="M220 0 L250 0 L210 200 L170 200 Z"/><path d="M330 0 L350 0 L330 200 L300 200 Z"/></g>
    ${[60, 120, 290, 350].map((x, i) => `<g opacity=".55"><rect x="${x}" y="${90 + (i % 2) * 25}" width="16" height="${110 - (i % 2) * 25}" fill="#2f6f8a"/><rect x="${x - 4}" y="${86 + (i % 2) * 25}" width="24" height="6" fill="#3f86a3"/></g>`).join('')}
    ${[[30, 1], [190, -1], [380, 1]].map(([x, d], i) => `<path class="amb-sway" style="transform-origin:${x}px 200px;animation-delay:${i * .5}s" d="M${x} 200 Q${x + 10 * d} 175 ${x} 155 Q${x - 10 * d} 135 ${x + 4} 120" stroke="#2f9a5a" stroke-width="5" fill="none"/>`).join('')}
    <path d="M250 196 q6 -20 12 0 q4 -14 10 0 q6 -24 12 0z" fill="#ff7aa8"/>
    ${Array.from({ length: 9 }, (_, i) => `<circle class="amb-rise" style="animation-delay:${i * .5}s;animation-duration:${4 + (i % 3)}s" cx="${25 + i * 44}" cy="230" r="${2 + (i % 3)}" fill="none" stroke="#bfefff" stroke-width="1"/>`).join('')}
    <rect y="196" width="400" height="44" fill="#c9b27a"/>
    <path d="M0 196 Q100 192 200 197 Q300 202 400 195 L400 200 L0 200 Z" fill="#dcc690"/>`,
  sky: () => `
    <defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5aa8ff"/><stop offset="1" stop-color="#ffe7c2"/></linearGradient></defs>
    <rect width="400" height="240" fill="url(#sk)"/>
    <g class="amb-bob"><path d="M250 120 Q290 110 330 120 L310 150 L270 150 Z" fill="#7a6a5a"/><ellipse cx="290" cy="120" rx="42" ry="8" fill="#5aa84a"/>
      <path d="M282 112 L298 112 L296 84 L290 60 L284 84 Z" fill="#ffcc4d" stroke="#b8860b"/><path d="M276 112 L304 112 L300 100 L280 100 Z" fill="#fff" stroke="#b8860b"/></g>
    <g class="amb-bob" style="animation-delay:1s"><path d="M40 90 Q65 84 90 90 L78 110 L52 110 Z" fill="#7a6a5a"/><ellipse cx="65" cy="90" rx="26" ry="5" fill="#5aa84a"/></g>
    <g class="amb-drift" fill="#fff"><ellipse cx="140" cy="60" rx="40" ry="12"/><ellipse cx="165" cy="52" rx="24" ry="12"/><ellipse cx="360" cy="40" rx="30" ry="9"/></g>
    <g fill="#fff"><ellipse cx="40" cy="200" rx="80" ry="22"/><ellipse cx="170" cy="204" rx="90" ry="20"/><ellipse cx="300" cy="200" rx="90" ry="24"/><ellipse cx="400" cy="205" rx="60" ry="20"/></g>
    <rect y="206" width="400" height="34" fill="#fff"/><rect y="206" width="400" height="34" fill="#e9f2ff" opacity=".6"/>`,
  spirit: () => `
    <defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0e0818"/><stop offset="1" stop-color="#3a2457"/></linearGradient></defs>
    <rect width="400" height="240" fill="url(#sk)"/>
    <circle cx="80" cy="60" r="28" fill="#e8e0ff" opacity=".9"/><circle cx="92" cy="54" r="24" fill="#0e0818" opacity=".25"/>
    ${Array.from({ length: 12 }, (_, i) => `<circle class="amb-twinkle" style="animation-delay:${i * .3}s" cx="${20 + i * 33}" cy="${12 + (i * 37) % 70}" r="1" fill="#fff"/>`).join('')}
    ${[[40, 176], [110, 182], [300, 178], [360, 184]].map(([x, y]) => `<path d="M${x} 198 L${x} ${y} Q${x + 10} ${y - 14} ${x + 20} ${y} L${x + 20} 198 Z" fill="#3a3150" stroke="#55497a"/>`).join('')}
    <path d="M200 198 L204 120 Q220 100 236 96 M203 150 Q186 132 178 130" stroke="#1a1024" stroke-width="6" fill="none" stroke-linecap="round"/>
    ${Array.from({ length: 5 }, (_, i) => `<circle class="amb-float" style="animation-delay:${i * .8}s" cx="${60 + i * 70}" cy="${140 - (i % 2) * 30}" r="5" fill="#b884ff" opacity=".7"/>`).join('')}
    <rect y="196" width="400" height="44" fill="#1d1430"/>
    <g class="amb-drift" fill="#b8a8e0" opacity=".12"><ellipse cx="120" cy="200" rx="120" ry="8"/><ellipse cx="320" cy="206" rx="110" ry="7"/></g>`,
  castle: () => `
    <defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14040c"/><stop offset="1" stop-color="#4a0f24"/></linearGradient></defs>
    <rect width="400" height="240" fill="url(#sk)"/>
    <circle cx="320" cy="56" r="26" fill="#ff5b6a" opacity=".85"/>
    <path d="M110 196 L110 100 L122 100 L122 88 L130 88 L130 100 L150 100 L150 70 L160 50 L170 70 L170 100 L200 100 L200 60 L212 34 L224 60 L224 100 L250 100 L250 80 L260 64 L270 80 L270 100 L290 100 L290 196 Z" fill="#12060c"/>
    ${[[160, 110], [212, 80], [260, 116]].map(([x, y]) => `<rect class="amb-twinkle" x="${x - 3}" y="${y}" width="6" height="9" fill="#ffb347"/>`).join('')}
    ${[[40, 60], [70, 40], [360, 100]].map(([x, y], i) => `<path class="amb-bob" style="animation-delay:${i * .4}s" d="M${x} ${y} q5 -6 10 0 q5 -6 10 0 q-10 4 -20 0z" fill="#000"/>`).join('')}
    <rect y="196" width="400" height="44" fill="#2a1a22"/>
    ${Array.from({ length: 8 }, (_, i) => `<rect x="${i * 50}" y="196" width="49" height="20" fill="#33212b"/>`).join('')}
    ${[30, 370].map((x) => `<rect x="${x - 2}" y="150" width="4" height="46" fill="#4a2a1a"/><path class="amb-flicker" style="transform-origin:${x}px 150px" d="M${x} 136 q8 8 0 16 q-8 -8 0 -16z" fill="#ff9a3d"/>`).join('')}`,
};

/* ---------- สร้างฉาก ---------- */
function stageHTML(zone, foe, isBoss, heroSvg) {
  return `<div class="stage" id="stage">
    <svg class="stage-bg" viewBox="0 0 400 240" preserveAspectRatio="xMidYMax slice">${(SCENE[zone.id] || SCENE.forest)()}</svg>
    <div class="foe-panel">
      <div class="row between"><b class="fname">${foe.i} ${foe.n}</b><span class="ftags" id="ftags"></span></div>
      <div class="bar hp"><i id="fhp"></i></div>
      <div class="fhptext" id="fhptext"></div>
    </div>
    <div class="unit hero-u" id="u-hero"><div class="ushadow"></div><div class="ubody" id="hero-body">${heroSvg}</div><div class="utags" id="htags"></div></div>
    <div class="unit foe-u ${isBoss ? 'boss' : ''}" id="u-foe"><div class="ushadow"></div><div class="ubody foe-sprite" id="foe-body">${typeof monsterSVG === 'function' ? monsterSVG(foe.n, isBoss ? 150 : 112, foe.i) : foe.i}</div></div>
    <div class="unit pet-u" id="u-pet"></div>
    <div class="fx" id="fx"></div>
  </div>`;
}

/* อัปเดตหลอดเลือด/สถานะ (ไม่สร้างฉากใหม่ เพื่อไม่ให้แอนิเมชันกระตุก) */
function stageUpdate(B) {
  const $ = (id) => document.getElementById(id);
  if (!$('stage')) return;
  const e = B.e;
  $('fhp').style.width = `${Math.max(0, (e.hp / e.maxHp) * 100)}%`;
  $('fhptext').textContent = `${Math.max(0, e.hp).toLocaleString('th-TH')}/${e.maxHp.toLocaleString('th-TH')}`;
  const ft = [`<span class="tag">Lv.${e.lv}</span>`];
  if (B.isBoss) ft.push('<span class="tag warn">👑</span>');
  if (B.enraged) ft.push('<span class="tag warn">😡 คลั่ง</span>');
  if (B.charging) ft.push('<span class="tag warn">⚠️ ชาร์จ</span>');
  if (B.poison) ft.push(`<span class="tag">☠️${B.poison}</span>`);
  $('ftags').innerHTML = ft.join('');
  if (B.slow) ft.push(`<span class="tag">🧊${B.slow}</span>`);
  if (B.stun) ft.push('<span class="tag warn">💫</span>');
  const ht = [];
  if (B.atkUp) ht.push(`<span class="tag">📣${B.atkUp}</span>`);
  if (B.berserk) ht.push(`<span class="tag">😤${B.berserk}</span>`);
  if (B.focus) ht.push(`<span class="tag">🧘${B.focus}</span>`);
  if (B.ironwall) ht.push(`<span class="tag">🧱${B.ironwall}</span>`);
  if (B.manaShield) ht.push(`<span class="tag">🔵${B.manaShield}</span>`);
  if (B.divine) ht.push(`<span class="tag">🛡️${B.divine}</span>`);
  if (B.avatar) ht.push(`<span class="tag">👼${B.avatar}</span>`);
  if (B.regen) ht.push(`<span class="tag">🌿${B.regen}</span>`);
  if (B.evade) ht.push('<span class="tag">💨</span>');
  if (B.defending) ht.push('<span class="tag">🛡️</span>');
  $('htags').innerHTML = ht.join('');
  const foe = $('u-foe');
  foe.classList.toggle('charging', !!B.charging);
  foe.classList.toggle('enraged', !!B.enraged);
  foe.classList.toggle('stunned', B.stun > 0);
  foe.classList.toggle('frozen', B.slow > 0);
  document.getElementById('u-hero').classList.toggle('berserk', B.berserk > 0);
}

/* สัตว์เลี้ยงในฉาก */
function stagePet(pet) {
  const u = document.getElementById('u-pet'); if (!u) return;
  const id = pet ? pet.id : '';
  if (u.dataset.id === id) return;
  u.dataset.id = id;
  u.innerHTML = pet ? `<div class="ushadow"></div><div class="ubody pet-body" id="pet-body">${petSVG(pet.id, 52)}</div><div class="pet-lv">Lv.${pet.lv}</div>` : '';
}

/* ---------- ตัวช่วยแอนิเมชัน (ปรับตามความเร็วเกม x1/x2/x3) ---------- */
const SPD = () => (typeof gameSpeed === 'function' ? gameSpeed() : 1);
const canAnim = () => typeof Element !== 'undefined' && !!Element.prototype.animate;
function anim(el, frames, opts) {
  if (!el || !canAnim()) return null;
  const sp = SPD();
  const o = typeof opts === 'number' ? { duration: opts } : { ...opts };
  if (o.duration) o.duration /= sp;
  if (o.delay) o.delay /= sp;
  return el.animate(frames, o);
}
function later(ms, fn) { if (!canAnim()) { fn(); return; } setTimeout(fn, ms / SPD()); }

function unitPos(id) {
  const st = document.getElementById('stage'), u = document.getElementById(id);
  if (!st || !u) return { x: 0, y: 0 };
  const a = st.getBoundingClientRect(), b = u.getBoundingClientRect();
  return { x: b.left - a.left + b.width / 2, y: b.top - a.top + b.height * 0.45, w: b.width, h: b.height };
}

function spawn(cls, html, x, y) {
  const fx = document.getElementById('fx');
  if (!fx) return null;
  const d = document.createElement('div');
  d.className = cls;
  d.innerHTML = html || '';
  d.style.left = `${x}px`; d.style.top = `${y}px`;
  fx.appendChild(d);
  return d;
}
function kill(el, ms) { if (el) setTimeout(() => el.remove(), ms / SPD()); }

function popNum(target, text, cls) {
  const p = unitPos(target === 'hero' ? 'u-hero' : 'u-foe');
  const d = spawn(`dnum ${cls || ''}`, text, p.x + (Math.random() * 30 - 15), p.y - p.h * 0.35);
  if (!d) return;
  anim(d, [{ transform: 'translate(-50%,0) scale(.6)', opacity: 0 }, { transform: 'translate(-50%,-14px) scale(1.15)', opacity: 1, offset: .2 },
    { transform: 'translate(-50%,-46px) scale(1)', opacity: 0 }], { duration: 1000, easing: 'ease-out' });
  kill(d, 1000);
}

function flinch(id, big) {
  const b = document.getElementById(id === 'u-hero' ? 'hero-body' : 'foe-body');
  anim(b, [{ transform: 'translateX(0)', filter: 'brightness(1)' }, { transform: `translateX(${id === 'u-hero' ? -10 : 10}px)`, filter: 'brightness(2.2)' },
    { transform: `translateX(${id === 'u-hero' ? 6 : -6}px)` }, { transform: 'translateX(0)', filter: 'brightness(1)' }], { duration: big ? 380 : 280 });
}
function shake(power) {
  anim(document.getElementById('stage'), [{ transform: 'translate(0,0)' }, { transform: `translate(${-power}px,${power / 2}px)` }, { transform: `translate(${power}px,${-power / 2}px)` },
    { transform: `translate(${-power / 2}px,0)` }, { transform: 'translate(0,0)' }], { duration: 300 });
}
function flash(color) {
  const st = document.getElementById('stage'); if (!st) return;
  const d = spawn('flash', '', 0, 0); if (!d) return;
  d.style.background = color;
  anim(d, [{ opacity: .55 }, { opacity: 0 }], { duration: 350 }); kill(d, 360);
}

function slashFx(big, crit, delay = 0) {
  const p = unitPos('u-foe');
  later(delay, () => {
    const d = spawn(`slash ${big ? 'big' : ''} ${crit ? 'crit' : ''}`, `<svg viewBox="0 0 100 100"><path d="M10 80 Q50 50 90 15" stroke="currentColor" stroke-width="${big ? 10 : 7}" fill="none" stroke-linecap="round"/>${big ? '<path d="M15 20 Q50 50 85 85" stroke="currentColor" stroke-width="8" fill="none" stroke-linecap="round"/>' : ''}</svg>`, p.x, p.y);
    anim(d, [{ transform: 'translate(-50%,-50%) scale(.4) rotate(-20deg)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(1.1) rotate(0)', opacity: 1, offset: .3 },
      { transform: 'translate(-50%,-50%) scale(1.25)', opacity: 0 }], { duration: 380, easing: 'ease-out' });
    kill(d, 400);
  });
}

function boom(color, at) {
  const p = unitPos(at || 'u-foe');
  const d = spawn('boom', '', p.x, p.y);
  if (!d) return;
  d.style.setProperty('--c', color);
  anim(d, [{ transform: 'translate(-50%,-50%) scale(.2)', opacity: 1 }, { transform: 'translate(-50%,-50%) scale(1.4)', opacity: 0 }], { duration: 450, easing: 'ease-out' });
  kill(d, 460);
}

const PROJ = {
  ice: '<svg viewBox="0 0 60 16" width="54"><path d="M0 8 L14 2 L60 8 L14 14 Z" fill="#bdf0ff" stroke="#5ac8ff" stroke-width="1.2"/><path d="M14 2 L22 8 L14 14" stroke="#fff" fill="none"/></svg>',
  dark: '<div class="darkorb"></div>',
  fire: '<div class="fireball"></div>',
  arrow: '<svg viewBox="0 0 60 12" width="46"><path d="M0 6 L48 6" stroke="#8a5a34" stroke-width="2.5"/><path d="M60 6 L46 0 L48 6 L46 12 Z" fill="#dfe6f2"/><path d="M0 6 L8 0 M0 6 L8 12 M5 6 L12 0 M5 6 L12 12" stroke="#ff5b6a" stroke-width="1.6"/></svg>',
  poison: '<svg viewBox="0 0 60 12" width="46"><path d="M0 6 L48 6" stroke="#3b4a1c" stroke-width="2.5"/><path d="M60 6 L46 0 L48 6 L46 12 Z" fill="#7dff6b"/><path d="M0 6 L8 0 M0 6 L8 12" stroke="#7dff6b" stroke-width="1.6"/></svg>',
};
function projectile(kind, delay, onHit, big) {
  later(delay, () => {
    const a = unitPos('u-hero'), b = unitPos('u-foe');
    const d = spawn(`proj ${kind} ${big ? 'bigp' : ''}`, PROJ[kind], a.x + a.w * 0.3, a.y);
    if (!d || !canAnim()) { if (d) d.remove(); onHit(); return; }
    const dx = b.x - (a.x + a.w * 0.3);
    const dy = (b.y - a.y) + (Math.random() * 10 - 5);
    anim(d, [{ transform: 'translate(-50%,-50%) translate(0,0)' }, { transform: `translate(-50%,-50%) translate(${dx * 0.5}px,${dy * 0.5 - (kind === 'fire' ? 0 : 16)}px)` },
      { transform: `translate(-50%,-50%) translate(${dx}px,${dy}px)` }], { duration: 340, easing: 'linear' });
    setTimeout(() => { d.remove(); onHit(); }, 330 / SPD());
  });
}

function aura(kind) {
  const p = unitPos('u-hero');
  if (kind === 'shield') {
    const d = spawn('bubble', '', p.x, p.y + p.h * 0.05);
    anim(d, [{ transform: 'translate(-50%,-50%) scale(.6)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: .3 }, { opacity: 1, offset: .75 }, { opacity: 0 }], { duration: 900 });
    kill(d, 900); return;
  }
  if (kind === 'buff') {
    const d = spawn('ring-fx', '', p.x, p.y + p.h * 0.4);
    anim(d, [{ transform: 'translate(-50%,-50%) scale(.3)', opacity: 1 }, { transform: 'translate(-50%,-50%) scale(1.6)', opacity: 0 }], { duration: 700 });
    kill(d, 700);
    anim(document.getElementById('hero-body'), [{ filter: 'drop-shadow(0 0 0 #ff3b3b)' }, { filter: 'drop-shadow(0 0 14px #ff3b3b) brightness(1.3)' }, { filter: 'drop-shadow(0 0 0 #ff3b3b)' }], { duration: 700 });
    return;
  }
  const color = kind === 'mana' ? '#6bb6ff' : kind === 'wind' ? '#e6f7ff' : '#7dff6b';
  for (let i = 0; i < 9; i++) {
    const d = spawn('spk', '✦', p.x + (Math.random() * 60 - 30), p.y + p.h * 0.3 - Math.random() * 20);
    if (!d) return;
    d.style.color = color;
    anim(d, [{ transform: 'translate(-50%,0) scale(.5)', opacity: 0 }, { opacity: 1, offset: .2 }, { transform: `translate(-50%,-${50 + Math.random() * 30}px) scale(1)`, opacity: 0 }],
      { duration: 800 + Math.random() * 300, delay: i * 50, easing: 'ease-out' });
    kill(d, 1200);
  }
}

function coins() {
  const p = unitPos('u-foe');
  for (let i = 0; i < 8; i++) {
    const d = spawn('coin', '🪙', p.x, p.y);
    if (!d) return;
    const dx = Math.random() * 120 - 60;
    anim(d, [{ transform: 'translate(-50%,-50%) translate(0,0)', opacity: 1 }, { transform: `translate(-50%,-50%) translate(${dx * 0.6}px,-60px)`, opacity: 1, offset: .4 },
      { transform: `translate(-50%,-50%) translate(${dx}px,30px)`, opacity: 0 }], { duration: 900, delay: i * 40, easing: 'ease-out' });
    kill(d, 1300);
  }
}

/* ---------- เล่นเหตุการณ์ ---------- */
function hitNums(hits, gap) {
  hits.forEach((h, i) => later(i * gap, () => {
    popNum('foe', `-${h.dmg.toLocaleString('th-TH')}`, h.crit ? 'crit' : '');
    flinch('u-foe', h.crit);
    if (h.crit) shake(6);
  }));
}

function playOne(ev) {
  const hero = document.getElementById('u-hero'), foe = document.getElementById('u-foe');
  switch (ev.a) {
    case 'melee': {
      const a = unitPos('u-hero'), b = unitPos('u-foe');
      const dist = Math.max(0, b.x - a.x - (a.w + b.w) * 0.35);
      anim(hero, [{ transform: 'translateX(0)' }, { transform: `translateX(${dist}px)`, offset: .45 }, { transform: `translateX(${dist}px)`, offset: .6 }, { transform: 'translateX(0)' }],
        { duration: 560, easing: 'ease-in-out' });
      later(240, () => {
        ev.hits.forEach((h, i) => slashFx(ev.big, h.crit, i * 110));
        if (ev.dual) slashFx(false, false, 110);
        hitNums(ev.hits, 110);
        if (ev.twin) anim(document.getElementById('hero-body'), [{ transform: 'rotate(0)' }, { transform: 'rotate(-8deg)', offset: .3 }, { transform: 'rotate(10deg)', offset: .7 }, { transform: 'rotate(0)' }], { duration: 260, delay: 60 });
        if (ev.spin) anim(document.getElementById('hero-body'), [{ transform: 'scaleX(1)' }, { transform: 'scaleX(-1)' }, { transform: 'scaleX(1)' }, { transform: 'scaleX(-1)' }, { transform: 'scaleX(1)' }], { duration: 360 });
        if (ev.quake) { boom('#c8a06a'); shake(12); flash('#ffcc4d'); }
        else if (ev.big) shake(5);
      });
      return 600;
    }
    case 'proj': {
      anim(hero, [{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(0)' }], { duration: 220 });
      const n = ev.hits.length;
      ev.hits.forEach((h, i) => projectile(ev.kind, i * 120, () => {
        popNum('foe', `-${h.dmg.toLocaleString('th-TH')}`, h.crit ? 'crit' : ev.kind === 'poison' ? 'poison' : '');
        flinch('u-foe', h.crit);
        if (ev.kind === 'fire') { boom('#ff8a2a'); shake(5); }
        if (ev.kind === 'poison') boom('#7dff6b');
        if (ev.kind === 'ice') boom('#8fd0ff');
        if (ev.kind === 'dark') boom('#b884ff');
        if (ev.big) { boom('#ffffff'); shake(6); }
      }, ev.big));
      return 380 + (n - 1) * 120 + 120;
    }
    case 'bolt': {
      const p = unitPos('u-foe');
      flash('#e8f4ff');
      const d = spawn('bolt', '<svg viewBox="0 0 40 200" preserveAspectRatio="none"><path d="M24 0 L8 80 L22 84 L6 200 L34 70 L20 66 L32 0 Z" fill="#fff6a8" stroke="#ffe23a" stroke-width="2"/></svg>', p.x, 0);
      anim(d, [{ opacity: 0 }, { opacity: 1, offset: .15 }, { opacity: .6, offset: .4 }, { opacity: 1, offset: .55 }, { opacity: 0 }], { duration: 450 });
      kill(d, 460);
      later(80, () => { boom('#fff6a8'); shake(9); hitNums(ev.hits, 0); });
      return 520;
    }
    case 'meteor': {
      const p = unitPos('u-foe');
      ev.hits.forEach((h, i) => later(i * 200, () => {
        const sx = p.x + 60 + Math.random() * 40;
        const d = spawn('proj', '<div class="fireball meteor"></div>', sx, -20);
        anim(d, [{ transform: 'translate(-50%,-50%) translate(0,0)' }, { transform: `translate(-50%,-50%) translate(${p.x - sx + (i - 1) * 16}px,${p.y + 20}px)` }], { duration: 300, easing: 'ease-in' });
        kill(d, 300);
        later(300, () => { boom('#ff5a1a'); shake(8); popNum('foe', `-${h.dmg.toLocaleString('th-TH')}`, h.crit ? 'crit' : ''); flinch('u-foe', true); });
      }));
      return 300 + ev.hits.length * 200 + 100;
    }
    case 'stun': {
      const p = unitPos('u-foe');
      const d = spawn('stars', '⭐ 💫 ⭐', p.x, p.y - p.h * 0.45);
      anim(d, [{ transform: 'translate(-50%,0) rotate(0)', opacity: 0 }, { opacity: 1, offset: .2 }, { transform: 'translate(-50%,0) rotate(360deg)', opacity: 1, offset: .8 }, { opacity: 0 }], { duration: 900 });
      kill(d, 900);
      popNum('foe', `${ev.text}!`, 'warn');
      return 450;
    }
    case 'pet': {
      const pb = document.getElementById('u-pet');
      if (ev.hits) {
        anim(pb, [{ transform: 'translate(0,0)' }, { transform: 'translate(46px,-22px)', offset: .4 }, { transform: 'translate(0,0)' }], { duration: 480, easing: 'ease-out' });
        later(200, () => {
          const col = { fire: '#ff8a2a', poison: '#7dff6b', thunder: '#fff27a' }[ev.kind] || '#ffffff';
          boom(col);
          if (ev.kind === 'thunder') flash('#fff6a8');
          ev.hits.forEach((h) => { popNum('foe', `-${h.dmg.toLocaleString('th-TH')}`, h.crit ? 'crit' : 'pet'); flinch('u-foe', h.crit); });
        });
        return 480;
      }
      anim(pb, [{ transform: 'translateY(0)' }, { transform: 'translateY(-14px)' }, { transform: 'translateY(0)' }], { duration: 360 });
      aura(ev.kind === 'mana' ? 'mana' : 'heal');
      later(120, () => popNum('hero', ev.text, ev.kind === 'mana' ? 'mana' : 'heal'));
      return 420;
    }
    case 'aura':
      aura(ev.kind);
      if (ev.text) later(150, () => popNum('hero', ev.text, ev.kind === 'buff' ? 'buff' : ev.kind === 'shield' || ev.kind === 'wind' ? 'shield' : ev.kind === 'mana' ? 'mana' : 'heal'));
      return 500;
    case 'num':
      popNum(ev.t, ev.text, ev.cls);
      if (ev.t === 'foe') flinch('u-foe');
      return 350;
    case 'charge':
      flash('#ff3b3b');
      popNum('foe', 'กำลังชาร์จ!', 'warn');
      return 400;
    case 'enrage':
      flash('#ff3b3b'); shake(8);
      popNum('foe', 'คลั่ง!', 'warn');
      return 500;
    case 'foeAtk': {
      const a = unitPos('u-hero'), b = unitPos('u-foe');
      const dist = Math.max(0, b.x - a.x - (a.w + b.w) * 0.35);
      if (ev.charged) anim(document.getElementById('foe-body'), [{ filter: 'brightness(1)' }, { filter: 'brightness(2) drop-shadow(0 0 20px #ff3b3b)' }], { duration: 250, fill: 'forwards' });
      anim(foe, [{ transform: 'translateX(0)' }, { transform: `translateX(${-dist}px)`, offset: .45 }, { transform: `translateX(${-dist}px)`, offset: .6 }, { transform: 'translateX(0)' }],
        { duration: 540, easing: 'ease-in-out' });
      later(240, () => {
        if (ev.miss) {
          anim(document.getElementById('hero-body'), [{ transform: 'translateX(0)', opacity: 1 }, { transform: 'translateX(-40px)', opacity: .4 }, { transform: 'translateX(0)', opacity: 1 }], { duration: 400 });
          popNum('hero', 'หลบ!', 'shield');
          return;
        }
        if (ev.defended) aura('shield');
        boom(ev.charged ? '#ff3b3b' : '#ffffff', 'u-hero');
        popNum('hero', `-${ev.dmg.toLocaleString('th-TH')}`, ev.crit || ev.charged ? 'crit' : 'hurt');
        flinch('u-hero', ev.big);
        if (ev.big || ev.charged) shake(ev.charged ? 10 : 6);
        if (ev.charged) flash('#ff3b3b');
      });
      later(560, () => anim(document.getElementById('foe-body'), [{ filter: 'none' }], { duration: 1, fill: 'forwards' }));
      return 600;
    }
    case 'foeDie':
      anim(document.getElementById('foe-body'), [{ transform: 'translateY(0) rotate(0)', opacity: 1, filter: 'brightness(1)' },
        { transform: 'translateY(-10px) rotate(-8deg)', opacity: 1, filter: 'brightness(3)', offset: .25 },
        { transform: 'translateY(30px) rotate(25deg)', opacity: 0, filter: 'brightness(1)' }], { duration: 800, easing: 'ease-in', fill: 'forwards' });
      later(250, coins);
      return 800;
    case 'heroDie':
      anim(document.getElementById('hero-body'), [{ transform: 'rotate(0)', opacity: 1 }, { transform: 'rotate(-80deg) translateX(-20px)', opacity: .5 }],
        { duration: 700, easing: 'ease-in', fill: 'forwards' });
      return 700;
    case 'flee':
      anim(hero, [{ transform: 'translateX(0)' }, { transform: 'translateX(-260px)' }], { duration: 600, easing: 'ease-in', fill: 'forwards' });
      return 600;
    default: return 0;
  }
}

/* เล่นเหตุการณ์ทีละอัน ต่อคิวกัน */
let stageQueueEnd = 0;
function stagePlay(events) {
  if (!events || !events.length) return;
  const now = Date.now();
  let t = Math.max(0, stageQueueEnd - now);
  const sp = SPD();
  for (const ev of events) {
    const at = t;
    if (!canAnim()) { playOne(ev); continue; }
    setTimeout(() => playOne(ev), at);
    t += estimate(ev) / sp;
  }
  stageQueueEnd = now + t;
}
function estimate(ev) {
  return { pet: ev.hits ? 480 : 420, bolt: 520, meteor: 300 + ((ev.hits || []).length) * 200 + 100, stun: 450, melee: 600, proj: 380 + ((ev.hits || []).length - 1) * 120 + 120, aura: 450, num: 300, charge: 400, enrage: 500, foeAtk: 600, foeDie: 800, heroDie: 700, flee: 600 }[ev.a] || 0;
}
