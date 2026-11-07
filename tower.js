'use strict';
/* ============================================================
   🗺️ แผนที่โลก · 🗼 หอคอย 100 ชั้น · 🌟 อุปกรณ์เลเจนดารี · 🔄 สลับอาชีพ
   (ไฟล์นี้โหลดก่อน game.js — ใช้ฟังก์ชันของ game.js ตอนเล่นเท่านั้น)
   ============================================================ */

/* ---------------- แผนที่โลก ---------------- */
// ตำแหน่งหมุดบนภาพ bg/worldmap.webp (เปอร์เซ็นต์ ซ้าย, บน)
const MAP_POS = {
  forest: [25, 26], cave: [16, 52], desert: [23, 78], volcano: [41, 82], swamp: [84, 80],
  ice: [88, 56], sea: [86, 21], sky: [67, 19], spirit: [70, 46], castle: [63, 78], tower: [50, 46],
};
let mapSel = null;

function topZone() { let t = 0; ZONES.forEach((z, i) => { if (zoneUnlocked(i)) t = i; }); return t; }

function renderWorldMap() {
  const d = D();
  const top = topZone();
  if (mapSel === null || (mapSel !== 'tower' && !ZONES[mapSel])) mapSel = top;
  const pins = ZONES.map((z, i) => {
    const [x, y] = MAP_POS[z.id];
    const open = zoneUnlocked(i), beaten = P().bossWins[z.id];
    return `<button class="map-pin ${open ? '' : 'locked'} ${mapSel === i ? 'on' : ''} ${i === top && !beaten ? 'cur' : ''}" style="left:${x}%;top:${y}%" data-a="mapsel" data-v="${i}">
      <span class="pi">${open ? z.icon : '🔒'}</span>${beaten ? '<i class="pk">✓</i>' : ''}<b>${z.name}</b></button>`;
  }).join('');
  const [tx, ty] = MAP_POS.tower;
  const tpin = `<button class="map-pin tower ${mapSel === 'tower' ? 'on' : ''}" style="left:${tx}%;top:${ty}%" data-a="mapsel" data-v="tower"><span class="pi">🗼</span><b>หอคอย 100 ชั้น</b></button>`;
  return `<div class="row between"><h2>🗺️ แผนที่โลก</h2><span class="diff-badge d-${S.diff}">${d.icon} ${d.name}</span></div>
    <div class="worldmap"><img src="bg/worldmap.webp" alt="แผนที่โลก">${pins}${tpin}</div>
    <div class="muted" style="font-size:12px;margin:6px 2px 10px">แตะที่แผนที่เพื่อเลือกด่าน · 🗼 ตรงกลางคือหอคอย</div>
    ${mapSel === 'tower' ? renderTowerPanel() : zoneCard(mapSel)}`;
}

function zoneCard(i) {
  const z = ZONES[i];
  const open = zoneUnlocked(i);
  const kills = P().zoneKills[z.id] || 0;
  const bossOpen = kills >= BOSS_UNLOCK_KILLS;
  const beaten = P().bossWins[z.id];
  const bs = bossOf(z);
  return `<div class="card zone-card ${open ? '' : 'locked'}">
    <div class="zc-bg" style="background-image:url(bg/${z.id}.webp)"></div>
    <div class="zc-in">
      <h3><span class="muted">${i + 1}.</span> ${z.icon} ${z.name} <span class="muted">Lv.${zoneLevel(i)}+</span></h3>
      ${open ? `<div class="zc-mobs">${z.mobs.map((m) => `<span title="${m[0]}">${monsterSVG(m[0], 34, m[1])}</span>`).join('')}</div>
        <div class="muted">บอส: ${bs[1]} ${bs[0]} ${beaten ? '✅' : ''}</div>
        <div class="row" style="margin-top:8px;flex-wrap:wrap">
          <button class="small primary" data-a="hunt" data-v="${i}">⚔️ ล่ามอนสเตอร์</button>
          <button class="small danger" data-a="boss" data-v="${i}" ${bossOpen ? '' : 'disabled'}>👑 ท้าบอส ${bossOpen ? '' : `(${kills}/${BOSS_UNLOCK_KILLS})`}</button>
        </div>`
      : `<div class="muted">🔒 ต้องโค่นบอส ${ZONES[i - 1].boss[0]} ก่อน</div>`}
    </div></div>`;
}

/* ---------------- หอคอย 100 ชั้น ---------------- */
const TOWER_FLOORS = 100;
// world = ใช้พฤติกรรมศัตรู/ตัวคูณ/ระดับดรอปตามความยากของโลกนั้น
const TOWER_DIFFS = {
  normal: { name: 'ปกติ', icon: '🟢', world: 'normal', base: 2, per: 0.9, frag: 0.05, bossFrag: 1, need: null },
  hard: { name: 'ยาก', icon: '🟠', world: 'hard', base: 32, per: 0.8, frag: 0.08, bossFrag: 2, need: ['normal', 50] },
  hell: { name: 'นรก', icon: '🔴', world: 'advanced', base: 62, per: 0.8, frag: 0.12, bossFrag: 3, need: ['hard', 50] },
};
const towerLv = (k, f) => Math.round(TOWER_DIFFS[k].base + TOWER_DIFFS[k].per * f);
const towerTier = (k, f) => clamp(Math.round(towerLv(k, f) / 2.8), 1, 32);
const towerZone = (f) => Math.floor((f - 1) / 10) % ZONES.length;
const towerOpen = (k) => { const n = TOWER_DIFFS[k].need; return !n || (S.tower[n[0]] || 0) >= n[1]; };
let towerPick = null;

function towerEnemy(k, floor) {
  const td = TOWER_DIFFS[k], dd = DIFFS[td.world];
  const z = ZONES[towerZone(floor)];
  const Z = towerLv(k, floor);
  const mb = monsterBase(Z);
  const boss = floor % 10 === 0;
  let e;
  if (boss) {
    const bs = floor === TOWER_FLOORS && z.bossFinal ? z.bossFinal : z.boss;
    e = { n: bs[0], i: bs[1], maxHp: mb.hp * 6, atk: mb.atk * 1.5, def: mb.def * 1.25, exp: mb.exp * 7, gold: mb.gold * 9 };
  } else {
    const t = pick(z.mobs), v = rand(0.9, 1.1);
    e = { n: t[0], i: t[1], maxHp: mb.hp * t[2] * v, atk: mb.atk * t[3] * v, def: mb.def * t[4], exp: mb.exp * v * (t[2] + t[3]) / 2, gold: mb.gold * v * 1.2 };
  }
  e.maxHp *= dd.mul.hp; e.atk *= dd.mul.atk; e.def *= dd.mul.def;
  e.exp *= dd.reward; e.gold *= dd.reward;
  for (const key of ['maxHp', 'atk', 'def', 'exp', 'gold']) e[key] = Math.round(e[key]);
  e.hp = e.maxHp; e.lv = Z;
  return { e, boss, zi: towerZone(floor) };
}

function startTower(k, floor) {
  if (!towerOpen(k)) return;
  floor = clamp(floor, 1, Math.min(TOWER_FLOORS, (S.tower[k] || 0) + 1));
  const t = towerEnemy(k, floor);
  startBattle(t.zi, t.boss, { tower: { d: k, floor }, e: t.e });
}

/* รางวัลเมื่อชนะในหอคอย (เรียกจาก victory) */
function towerWin(rewards) {
  const t = B.tower, td = TOWER_DIFFS[t.d], dd = DIFFS[td.world];
  const tier = towerTier(t.d, t.floor);
  rewards.tower = t;
  if (t.floor > (S.tower[t.d] || 0)) { S.tower[t.d] = t.floor; rewards.towerNew = true; }
  if (B.isBoss) {
    rewards.items.push(makeGear(tier, dd.bossMinR, dd.maxR));
    fragDrop(rewards, td.bossFrag);
    if (Math.random() < 0.4) { S.charms++; rewards.charm = 1; }
    if (t.floor === TOWER_FLOORS && rewards.towerNew) rewards.items.push(makeLegend(pick(LEGENDS)));
    else if (t.d === 'hell' && Math.random() < 0.03) rewards.items.push(makeLegend(pick(LEGENDS)));
  } else {
    if (Math.random() < 0.25) rewards.items.push(makeGear(tier, dd.minR, dd.maxR));
    if (Math.random() < td.frag) fragDrop(rewards, 1);
    if (Math.random() < 0.25) { const p = Math.random() < 0.6 ? 'hp_s' : 'mp_s'; S.pots[p]++; rewards.pots.push(p); }
  }
}

function renderTowerPanel() {
  const k = S.towerD;
  const best = S.tower[k] || 0;
  const maxPick = Math.min(TOWER_FLOORS, best + 1);
  if (towerPick === null || towerPick > maxPick) towerPick = maxPick;
  const f = towerPick, boss = f % 10 === 0, z = ZONES[towerZone(f)];
  const td = TOWER_DIFFS[k];
  const tabs = Object.entries(TOWER_DIFFS).map(([id, x]) => {
    const open = towerOpen(id);
    return `<button class="${k === id ? 'on' : ''}" data-a="towerd" data-v="${id}" ${open ? '' : 'disabled'}>${open ? x.icon : '🔒'} ${x.name}<span class="subtle">${S.tower[id] || 0}/${TOWER_FLOORS}</span></button>`;
  }).join('');
  const bs = boss ? (f === TOWER_FLOORS && z.bossFinal ? z.bossFinal : z.boss) : null;
  return `<div class="card tower-card">
    <h3 style="margin-top:0">🗼 หอคอย 100 ชั้น</h3>
    <div class="tower-tabs">${tabs}</div>
    ${Object.entries(TOWER_DIFFS).filter(([id]) => !towerOpen(id)).map(([id, x]) => `<div class="muted" style="font-size:12px">🔒 ${x.name}: ผ่านชั้น ${x.need[1]} ของโหมด${TOWER_DIFFS[x.need[0]].name}</div>`).join('')}
    <div class="tower-bar"><i style="height:${best}%"></i></div>
    <div class="tower-floor">
      <button class="small" data-a="tpick" data-v="-10">⏪</button><button class="small" data-a="tpick" data-v="-1">◀</button>
      <div><div class="tf-n">ชั้น ${f}</div><div class="muted" style="font-size:12px">Lv.${towerLv(k, f)} · ${z.icon} ${z.name}</div></div>
      <button class="small" data-a="tpick" data-v="1">▶</button><button class="small" data-a="tpick" data-v="10">⏩</button>
    </div>
    <div class="tf-foe">${boss ? `${monsterSVG(bs[0], 64, bs[1])}<div><b class="warn">👑 ชั้นบอส: ${bs[0]}</b><div class="muted" style="font-size:12px">ได้ 💠 เศษเลเจนดารี ${td.bossFrag} ชิ้นแน่นอน${f === TOWER_FLOORS ? ' · ผ่านครั้งแรกได้อุปกรณ์เลเจนดารีทันที!' : ''}</div></div>`
      : `<div class="zc-mobs">${z.mobs.slice(0, 4).map((m) => monsterSVG(m[0], 34, m[1])).join('')}</div><div class="muted" style="font-size:12px">มอนสเตอร์ปกติ · โอกาสได้ 💠 ${Math.round(td.frag * 100)}%</div>`}</div>
    <button class="primary" style="width:100%;margin-top:8px" data-a="tower" data-v="${f}">${f > best ? '⬆️ ท้าชั้นใหม่' : '🔁 สู้ซ้ำ'} ชั้น ${f}</button>
    <div class="muted" style="font-size:12px;margin-top:8px">ผ่านแล้วสูงสุด: ชั้น ${best} · HP/MP ไม่ฟื้นระหว่างชั้น (ใช้ยาหรือกลับไปพักที่โรงเตี๊ยม)</div>
  </div>`;
}

/* ---------------- อุปกรณ์เลเจนดารี ---------------- */
const LEGENDS = [
  { id: 'sunblade', slot: 'weapon', kind: 'sword', n: 'ดาบสุริยันพิฆาต', i: '🗡️', bonus: { crit: 10 }, cls: 'warrior' },
  { id: 'cosmos', slot: 'weapon', kind: 'staff', n: 'คทาจักรวาล', i: '🪄', bonus: { mp: 1.5 }, cls: 'mage' },
  { id: 'galebow', slot: 'weapon', kind: 'bow', n: 'ธนูวายุเทพ', i: '🏹', bonus: { crit: 12 }, cls: 'archer' },
  { id: 'aegis', slot: 'offhand', kind: 'shield', n: 'โล่อมตะ', i: '🛡️' },
  { id: 'crown', slot: 'helmet', kind: 'chada', n: 'มงกุฎราชันย์', i: '👑' },
  { id: 'dragonmail', slot: 'armor', kind: 'plate', n: 'เกราะมังกรเทพ', i: '🐉' },
  { id: 'thunderstep', slot: 'boots', kind: 'greaves', n: 'รองเท้าสายฟ้า', i: '⚡' },
  { id: 'starcloak', slot: 'cape', kind: 'cape', n: 'ผ้าคลุมดารา', i: '🌌' },
  { id: 'heartcosmos', slot: 'necklace', kind: 'amulet', n: 'สร้อยหัวใจจักรวาล', i: '💖' },
  { id: 'eternal', slot: 'ring', kind: 'ring', n: 'แหวนนิรันดร์', i: '💍' },
];
const LEGEND_NEED = 10;
const LEGEND_GOLD = 20000;
const LEGEND_MUL = 5.2; // เทพเจ้า = 4.4
const legendDef = (id) => LEGENDS.find((l) => l.id === id);
const legendTier = () => clamp(Math.round(S.lv / 2.6) + 2, 3, 34);

function makeLegend(L, tier = legendTier()) {
  const base = (GEAR[L.slot] || []).find((g) => g.k === L.kind) || { k: L.kind };
  const st = slotStats(L.slot, base, tier, () => LEGEND_MUL, LEGEND_MUL, 5);
  const b = L.bonus || {};
  if (b.crit) st.crit = (st.crit || 0) + b.crit;
  if (b.mp && st.mp) st.mp = Math.round(st.mp * b.mp);
  return finalizeItem({ slot: L.slot, key: `${L.kind}:legendary`, name: L.n, icon: L.i, rarity: 'legendary', tier, stats: st, legend: L.id });
}

function fragDrop(rewards, n) {
  rewards.frags = rewards.frags || [];
  for (let i = 0; i < n; i++) {
    const L = pick(LEGENDS);
    S.frags[L.id] = (S.frags[L.id] || 0) + 1;
    rewards.frags.push(L.id);
  }
}

function fragResultHTML(r) {
  let h = '';
  if (r.tower) h += `<div style="margin-top:6px">🗼 ${TOWER_DIFFS[r.tower.d].icon} ผ่านชั้น ${r.tower.floor}${r.towerNew ? ' <b class="up">(สถิติใหม่!)</b>' : ''}</div>`;
  if (r.frags && r.frags.length) {
    const c = {}; r.frags.forEach((id) => { c[id] = (c[id] || 0) + 1; });
    h += `<div class="new-skill frag-new">💠 ได้เศษเลเจนดารี: ${Object.entries(c).map(([id, n]) => `<b>${legendDef(id).i} ${legendDef(id).n} ×${n}</b> (${S.frags[id]}/${LEGEND_NEED})`).join(', ')}
      <button class="small" data-a="go" data-v="legend">ดู</button></div>`;
  }
  return h;
}

function renderLegend() {
  const t = legendTier();
  let html = `<div class="row between"><h2>🌟 อุปกรณ์เลเจนดารี</h2><button class="small" data-a="go" data-v="town">← กลับ</button></div>
    <div class="muted" style="font-size:14px;margin-bottom:10px">แรงกว่าระดับเทพเจ้า · รวบรวม 💠 เศษ ${LEGEND_NEED} ชิ้น + 💰 ${fmt(LEGEND_GOLD)} เพื่อหลอม<br>
    หาเศษได้จาก 🗼 หอคอย (ชั้นบอสได้แน่นอน) และบอสในแผนที่ (โอกาสน้อย) · ค่าพลังขึ้นกับเลเวลตอนหลอม (ตอนนี้ระดับ ${t})</div>
    <div class="legend-grid">`;
  html += LEGENDS.map((L) => {
    const have = S.frags[L.id] || 0;
    const ready = have >= LEGEND_NEED && S.gold >= LEGEND_GOLD;
    const preview = makeLegendPreview(L, t);
    return `<div class="card legend-card ${have >= LEGEND_NEED ? 'ready' : ''}">
      <div class="lg-ico">${L.i}</div>
      <b class="r-legendary">${L.n}</b>
      <div class="muted" style="font-size:11px">${CAT_NAME[L.slot] || SLOT_NAME[L.slot]}${L.cls ? ` · เหมาะกับ${CLASSES[L.cls].name}` : ''}</div>
      <div class="st" style="font-size:11px">${statText(preview)}</div>
      <div class="bar exp" style="margin:4px 0"><i style="width:${Math.min(100, have / LEGEND_NEED * 100)}%"></i></div>
      <div style="font-size:12px">💠 ${have}/${LEGEND_NEED}</div>
      <button class="small ${ready ? 'primary' : ''}" data-a="legcraft" data-v="${L.id}" ${ready ? '' : 'disabled'}>⚒️ หลอม</button>
    </div>`;
  }).join('');
  return html + '</div>';
}
function makeLegendPreview(L, tier) {
  const base = (GEAR[L.slot] || []).find((g) => g.k === L.kind) || { k: L.kind };
  const st = slotStats(L.slot, base, tier, () => LEGEND_MUL, LEGEND_MUL, 5);
  const b = L.bonus || {};
  if (b.crit) st.crit = (st.crit || 0) + b.crit;
  if (b.mp && st.mp) st.mp = Math.round(st.mp * b.mp);
  return st;
}

/* ---------------- สลับอาชีพ (เลเวลแยกของแต่ละอาชีพ) ---------------- */
function classSnapshot() {
  return { lv: S.lv, exp: S.exp, adv: !!S.adv, loadout: S.loadout.slice(), skin: S.cos ? S.cos.skin : 'default' };
}
function switchClass(to) {
  if (!CLASSES[to] || to === S.cls) return;
  S.classes[S.cls] = classSnapshot();
  const c = S.classes[to] || { lv: 1, exp: 0, adv: false, loadout: defaultLoadout(to, 1), skin: 'default' };
  S.cls = to; S.lv = c.lv; S.exp = c.exp; S.adv = c.adv; S.loadout = c.loadout.slice();
  if (S.cos) S.cos.skin = SKINS.some((x) => x.id === c.skin && skinFits(x, to)) ? c.skin : 'default';
  if (S.pet && !petUsable(petDef(S.pet))) { const p = S.pets.find((x) => petUsable(petDef(x.id))); S.pet = p ? p.id : null; }
  S.classes[to] = classSnapshot();
  const st = stats(); S.hp = st.hp; S.mp = st.mp;
  save();
  toast(`🔄 เปลี่ยนเป็น${className()} Lv.${S.lv}`);
}

function renderClasses() {
  S.classes[S.cls] = classSnapshot();
  let html = `<div class="row between"><h2>🔄 สลับอาชีพ</h2><button class="small" data-a="go" data-v="town">← กลับ</button></div>
    <div class="muted" style="font-size:14px;margin-bottom:10px">แต่ละอาชีพมีเลเวลของตัวเอง สลับไปมาได้ตลอด เลเวลที่เก็บไว้ไม่หาย<br>
    อาชีพใหม่เริ่มที่ Lv.1 · ทอง ไอเทม สัตว์เลี้ยง และความคืบหน้าด่านใช้ร่วมกัน</div>`;
  html += Object.entries(CLASSES).map(([id, c]) => {
    const s = S.classes[id];
    const on = id === S.cls;
    const nm = s && s.adv ? `${ADV_CLASSES[id].icon} ${ADV_CLASSES[id].name}` : `${c.icon} ${c.name}`;
    return `<div class="card class-card ${on ? 'on' : ''}">
      <div class="cc-art">${heroArt(id, {}, 84, s ? s.adv : false, { skin: SKINS[0], aura: null })}</div>
      <div style="flex:1"><b>${nm}</b>
        <div class="muted" style="font-size:13px">${s ? `Lv.${s.lv}${s.lv < 200 ? ` · EXP ${fmt(s.exp)}/${fmt(expNeed(s.lv))}` : ''}` : 'ยังไม่เคยเล่น · เริ่ม Lv.1'}</div>
        ${on ? '<span class="tag">กำลังใช้</span>' : `<button class="small primary" style="margin-top:6px" data-a="swcls" data-v="${id}">สลับเป็นอาชีพนี้</button>`}
      </div></div>`;
  }).join('');
  return html;
}

/* ---------------- เซฟ ---------------- */
function migrateTower(s) {
  if (!s.tower) s.tower = { normal: 0, hard: 0, hell: 0 };
  if (!s.towerD) s.towerD = 'normal';
  if (!s.frags) s.frags = {};
  if (!s.classes) s.classes = {};
  if (!s.classes[s.cls]) s.classes[s.cls] = { lv: s.lv, exp: s.exp, adv: !!s.adv, loadout: (s.loadout || []).slice(), skin: s.cos ? s.cos.skin : 'default' };
  return s;
}

function towerClick(a, v, el) {
  switch (a) {
    case 'mapsel': mapSel = v === 'tower' ? 'tower' : +v; return true;
    case 'towerd': if (towerOpen(v)) { S.towerD = v; towerPick = null; save(); } return true;
    case 'tpick': { const max = Math.min(TOWER_FLOORS, (S.tower[S.towerD] || 0) + 1); towerPick = clamp((towerPick || max) + +v, 1, max); return true; }
    case 'tower': startTower(S.towerD, +v); return 'battle';
    case 'tnext': startTower(B.tower.d, B.tower.floor + 1); return 'battle';
    case 'legcraft': {
      const L = legendDef(v); if (!L) return true;
      if ((S.frags[v] || 0) < LEGEND_NEED || S.gold < LEGEND_GOLD) return true;
      S.frags[v] -= LEGEND_NEED; S.gold -= LEGEND_GOLD;
      const it = makeLegend(L); addItem(it); save();
      toast(`🌟 หลอมสำเร็จ! ได้ ${it.name}`);
      return true;
    }
    case 'swcls': switchClass(v); return true;
    default: return false;
  }
}
