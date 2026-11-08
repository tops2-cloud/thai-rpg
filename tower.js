'use strict';
/* ============================================================
   🗺️ แผนที่โลก · 🗼 หอคอย 100 ชั้น · 🌟 อุปกรณ์เลเจนดารี · 🔄 สลับอาชีพ
   (ไฟล์นี้โหลดก่อน game.js — ใช้ฟังก์ชันของ game.js ตอนเล่นเท่านั้น)
   ============================================================ */

/* ---------------- โลก (ทวีป) ---------------- */
// เพิ่มทวีปใหม่: ใส่ใน WORLDS แล้วเพิ่มด่านใน ZONES (game.js) โดยใส่ world: '<id>' และ pos: [ซ้าย%, บน%] บนภาพแผนที่
const WORLDS = [
  { id: 'w1', n: 'ทวีปแรก', icon: '🌍', map: 'bg/worldmap.webp', tower: [50, 44], wb: [50, 63] },
  { id: 'w2', n: 'ทวีปที่ 2: ดินแดนใหม่', icon: '🌌', map: 'bg/worldmap2.webp', need: 'w1', tower: [44, 36], wb: [50, 60], rush: [57, 31] },
];
// ตำแหน่งหมุดของทวีปแรก (เปอร์เซ็นต์ ซ้าย, บน)
const MAP_POS = {
  forest: [25, 26], cave: [16, 52], desert: [23, 78], volcano: [41, 82], swamp: [84, 80],
  ice: [88, 56], sea: [86, 21], sky: [67, 19], spirit: [70, 46], castle: [63, 78],
};
/* บอสโลก (กลางทวีปที่ 2) */
// บอสโลกของแต่ละทวีป — frag = เศษเลเจนดารีขั้นต่ำต่อการชนะ (+1 ต่อระดับความยาก), legend = โอกาสได้อุปกรณ์เลเจนดารี (ครั้งแรกได้แน่นอน)
const WORLD_BOSSES = {
  w1: { n: 'ราชันย์โครงกระดูกมรณะ', i: '💀', img: 'mon/worldboss1.webp', bg: 'bg/wb1.webp', lv: 32, gate: 'castle', icon: '💀', frag: 2, legend: 0.05, hp: 16 },
  w2: { n: 'เทพแห่งความว่างเปล่า', i: '👁️', img: 'mon/worldboss.webp', bg: 'bg/wb2.webp', lv: 62, gate: 'w2castle', icon: '👁️', frag: 3, legend: 0.1, hp: 20 },
};
const WORLD_BOSS = WORLD_BOSSES.w2; // เผื่อโค้ดเก่า
const isWorldBoss = (name) => Object.values(WORLD_BOSSES).some((x) => x.n === name) || name === RUSH_FINAL.n;

/* ---------------- 🏛️ หอคอยรวมบอส (แมพ 2) ----------------
   ไต่ล้มบอสทุกตัวของทั้ง 2 แมพ + บอสโลก แล้วจบด้วย Final Boss · HP ไม่ฟื้นระหว่างชั้น */
const RUSH_FINAL = { n: 'ราชันย์แห่งจุดจบ', i: '🌑', img: 'mon/final_boss.webp', lv: 72, hp: 30, atk: 2.1 };
function rushList() {
  const out = [];
  for (const wid of ['w1', 'w2']) {
    worldZoneIdx(wid).forEach((zi) => { const z = ZONES[zi]; out.push({ n: z.boss[0], i: z.boss[1], zi, lv: z.lv + 3, hp: 7, atk: 1.6 }); });
    const W = WORLD_BOSSES[wid]; out.push({ n: W.n, i: W.i, zi: ZONES.findIndex((z) => z.id === W.gate), lv: W.lv, hp: Math.round(W.hp * 0.7), atk: 1.8, wb: true });
  }
  out.push({ ...RUSH_FINAL, zi: ZONES.findIndex((z) => z.id === 'w2castle'), final: true });
  return out;
}
const rushOpen = () => worldUnlocked('w2');
const rushBest = () => (S.rush || {})[S.diff] || 0;
let rushPick = null;
function startRush(floor) {
  const L = rushList();
  floor = clamp(floor, 1, Math.min(L.length, rushBest() + 1));
  const R = L[floor - 1], d = D(), Z = R.lv + d.off, mb = monsterBase(Z);
  const e = { n: R.n, i: R.i, maxHp: mb.hp * R.hp * d.mul.hp, atk: mb.atk * R.atk * d.mul.atk, def: mb.def * 1.35 * d.mul.def, exp: mb.exp * 9 * d.reward, gold: mb.gold * 12 * d.reward };
  for (const k of ['maxHp', 'atk', 'def', 'exp', 'gold']) e[k] = Math.round(e[k]);
  e.hp = e.maxHp; e.lv = Z;
  startBattle(R.zi, true, { e, rush: { floor, total: L.length } });
}
function rushWin(rewards) {
  const d = D(), r = B.rush, L = rushList();
  S.rush = S.rush || {};
  rewards.rush = r;
  if (r.floor > rushBest()) { S.rush[S.diff] = r.floor; rewards.rushNew = true; }
  rewards.items.push(makeGear(maxTier(), d.bossMinR, d.maxR));
  fragDrop(rewards, L[r.floor - 1].wb ? 3 : 1);
  if (L[r.floor - 1].final) {
    fragDrop(rewards, 5);
    if (rewards.rushNew) rewards.items.push(makeLegend(pick(LEGENDS)), makeLegend(pick(LEGENDS)));
  }
}
function rushPanel() {
  const L = rushList(), best = rushBest(), maxPick = Math.min(L.length, best + 1);
  if (rushPick === null || rushPick > maxPick) rushPick = maxPick;
  const R = L[rushPick - 1], d = D();
  if (!rushOpen()) return `<div class="card tower-card"><h3 style="margin-top:0">🏛️ หอคอยรวมบอส</h3><div class="muted">🔒 เปิดเมื่อเข้าแมพ 2 ได้</div></div>`;
  return `<div class="card tower-card">
    <h3 style="margin-top:0">🏛️ หอคอยรวมบอส <span class="muted" style="font-size:13px">โหมด${d.name}</span></h3>
    <div class="muted" style="font-size:12px">ล้มบอสทุกตัวของทั้ง 2 แมพ + บอสโลก ต่อเนื่อง ${L.length} ชั้น · ชั้นสุดท้ายคือ Final Boss · HP ไม่ฟื้นระหว่างชั้น</div>
    <div class="rush-track">${L.map((x, k) => `<span class="${k < best ? 'done' : ''} ${k === rushPick - 1 ? 'on' : ''} ${x.final ? 'fin' : x.wb ? 'wbx' : ''}" title="${x.n}">${k < best ? '✓' : x.final ? '👑' : x.wb ? '★' : k + 1}</span>`).join('')}</div>
    <div class="tower-floor">
      <button class="small" data-a="rpick" data-v="-1">◀</button>
      <div><div class="tf-n">ชั้น ${rushPick}/${L.length}</div><div class="muted" style="font-size:12px">Lv.${R.lv + d.off}${R.final ? ' · FINAL BOSS' : R.wb ? ' · บอสโลก' : ''}</div></div>
      <button class="small" data-a="rpick" data-v="1">▶</button>
    </div>
    <div class="tf-foe">${monsterSVG(R.n, 64, R.i)}<div><b class="warn">${R.final ? '👑 ' : ''}${R.n}</b><div class="muted" style="font-size:12px">รางวัล: อุปกรณ์บอส · 💠 ${R.final ? 6 : R.wb ? 3 : 1}${R.final ? ' · ผ่านครั้งแรกได้เลเจนดารี 2 ชิ้น!' : ''}</div></div></div>
    <button class="primary" style="width:100%;margin-top:8px" data-a="rush" data-v="${rushPick}">${rushPick > best ? '⬆️ ท้าชั้นใหม่' : '🔁 สู้ซ้ำ'} ชั้น ${rushPick}</button>
    <div class="muted" style="font-size:12px;margin-top:8px">ผ่านแล้วสูงสุด: ${best}/${L.length} (แยกตามความยาก)</div>
  </div>`;
}
const wbKey = (wid) => (wid === 'w2' ? S.diff : `${wid}:${S.diff}`); // ทวีป 2 ใช้คีย์เดิม (เซฟเก่าไม่หาย)
const wbOpen = (wid = S.world) => !!WORLD_BOSSES[wid] && !!P().bossWins[WORLD_BOSSES[wid].gate];
function startWB(wid = S.world) {
  const W = WORLD_BOSSES[wid];
  if (!W || !wbOpen(wid)) return;
  const d = D(), Z = W.lv + d.off, mb = monsterBase(Z);
  const e = { n: W.n, i: W.i, maxHp: mb.hp * W.hp * d.mul.hp, atk: mb.atk * 1.8 * d.mul.atk, def: mb.def * 1.4 * d.mul.def, exp: mb.exp * 25 * d.reward, gold: mb.gold * 30 * d.reward };
  for (const k of ['maxHp', 'atk', 'def', 'exp', 'gold']) e[k] = Math.round(e[k]);
  e.hp = e.maxHp; e.lv = Z;
  startBattle(ZONES.findIndex((z) => z.id === W.gate), true, { e, wb: wid });
}
function wbWin(rewards) {
  const d = D(), wid = B.wb, W = WORLD_BOSSES[wid];
  S.wbKills = S.wbKills || {};
  const k = wbKey(wid), first = !S.wbKills[k];
  S.wbKills[k] = (S.wbKills[k] || 0) + 1;
  rewards.wb = true;
  rewards.items.push(makeGear(maxTier(), d.bossMinR, d.maxR));
  fragDrop(rewards, W.frag + DIFF_ORDER.indexOf(S.diff));
  if (first || Math.random() < W.legend) rewards.items.push(makeLegend(pick(LEGENDS)));
  S.charms += 2; rewards.charm = 2;
}
function wbPanel(wid = S.world) {
  const W = WORLD_BOSSES[wid], d = D(), open = wbOpen(wid), kills = (S.wbKills || {})[wbKey(wid)] || 0;
  return `<div class="card wb-card">
    <div class="wb-art">${monsterSVG(W.n, 150, W.i)}</div>
    <h3 style="margin:4px 0">${W.icon} บอสโลก: ${W.n}</h3>
    <div class="muted" style="font-size:13px">Lv.${W.lv + d.off} · HP มหาศาล · ล้มแล้วกี่ครั้ง (โหมด${d.name}): ${kills}</div>
    <div style="font-size:13px;margin:6px 0">รางวัล: 💠 เศษเลเจนดารี ${W.frag + DIFF_ORDER.indexOf(S.diff)} ชิ้น · อุปกรณ์บอส · 🧿×2 · โอกาส ${Math.round(W.legend * 100)}% ได้อุปกรณ์เลเจนดารี (ครั้งแรกได้แน่นอน)</div>
    ${open ? '<button class="primary" style="width:100%" data-a="wbfight">⚔️ ท้าบอสโลก</button>' : `<div class="muted">🔒 ต้องล้ม ${ZONES.find((z) => z.id === W.gate).boss[0]} (บอสด่าน 10) ในโหมดนี้ก่อน</div>`}
  </div>`;
}
const hasNextZone = (zi) => { const l = worldZoneIdx(zoneWorld(ZONES[zi])); return l.indexOf(zi) < l.length - 1; };
const worldDef = (id) => WORLDS.find((w) => w.id === id) || WORLDS[0];
const zoneWorld = (z) => z.world || 'w1';
const worldZoneIdx = (wid) => ZONES.map((z, i) => (zoneWorld(z) === wid ? i : -1)).filter((i) => i >= 0);
const zonePos = (z) => z.pos || MAP_POS[z.id] || [50, 50];
/* ทวีปเปิดเมื่อ: มีด่านแล้ว + ล้มบอสสุดท้ายของทวีปก่อนหน้า (ในความยากที่เล่นอยู่) */
/* จบทวีปในความยากนั้นแล้วหรือยัง (ล้มบอสด่านสุดท้ายของทวีป) */
function worldCleared(wid, diff) {
  if (wid === 'w1' && S.clearedDiffs && S.clearedDiffs[diff]) return true;
  const l = worldZoneIdx(wid), p = S.prog && S.prog[diff];
  return !!(l.length && p && p.bossWins && p.bossWins[ZONES[l[l.length - 1]].id]);
}
/* ทวีปเปิดเมื่อจบทวีปก่อนหน้าในโหมดปกติ */
function worldUnlocked(wid) {
  const w = worldDef(wid);
  if (!w.need) return true;
  if (!worldZoneIdx(wid).length) return false;
  return worldCleared(w.need, 'normal');
}
/* แต่ละทวีปจำความยากของตัวเอง */
function setWorld(wid) {
  if (!S.diffBy) S.diffBy = {};
  S.diffBy[S.world] = S.diff;
  S.world = wid;
  S.diff = S.diffBy[wid] || 'normal';
  if (diffLocked(S.diff)) S.diff = 'normal';
  P();
}
const worldReady = (wid) => worldZoneIdx(wid).length > 0 && !!worldDef(wid).map;

let mapSel = null;

function topZone(wid = S.world) { const list = worldZoneIdx(wid); let t = list[0]; list.forEach((i) => { if (zoneUnlocked(i)) t = i; }); return t; }

function renderWorldMap() {
  if (diffLocked(S.diff)) { S.diff = 'normal'; S.diffBy[S.world] = 'normal'; }
  const d = D();
  const w = worldDef(S.world);
  const tabs = WORLDS.length > 1 ? `<div class="world-tabs">${WORLDS.map((x) => {
    const ok = worldReady(x.id) && worldUnlocked(x.id);
    return `<button class="${x.id === w.id ? 'on' : ''}" data-a="world" data-v="${x.id}" ${ok ? '' : 'disabled'}>${ok ? x.icon : '🔒'} ${x.n}${worldReady(x.id) ? '' : ' <small>(เร็วๆ นี้)</small>'}</button>`;
  }).join('')}</div>` : '';
  const menu = diffMenu ? `<div class="diff-menu">${DIFF_ORDER.map((k) => {
    const x = DIFFS[k], lock = diffLocked(k);
    return `<button class="d-${k} ${S.diff === k ? 'on' : ''}" data-a="setdiff" data-v="${k}" ${lock ? 'disabled' : ''}>
      <b>${lock ? '🔒' : x.icon} ${x.name}${worldCleared(S.world, k) ? ' 🏆' : ''}</b><span class="subtle">${lock ? diffLockText(k) : `มอนสเตอร์ Lv.${ZONES[worldZoneIdx(S.world)[0]].lv + x.off}+ · รางวัล ×${x.reward}`}</span></button>`;
  }).join('')}</div>` : '';
  if (!worldReady(w.id)) return `<h2>🗺️ แผนที่โลก</h2>${tabs}<div class="card muted">🚧 ${w.n} กำลังสร้าง เร็วๆ นี้!</div>`;
  const list = worldZoneIdx(w.id);
  const top = topZone(w.id);
  if (mapSel === null || (mapSel === 'tower' && !w.tower) || (mapSel === 'wb' && !w.wb) || (mapSel === 'rush' && !w.rush) || (!['tower', 'wb', 'rush'].includes(mapSel) && !list.includes(mapSel))) mapSel = top;
  const pins = list.map((i) => {
    const z = ZONES[i];
    const [x, y] = zonePos(z);
    const open = zoneUnlocked(i), beaten = P().bossWins[z.id];
    return `<button class="map-pin ${open ? '' : 'locked'} ${mapSel === i ? 'on' : ''} ${i === top && !beaten ? 'cur' : ''}" style="left:${x}%;top:${y}%" data-a="mapsel" data-v="${i}">
      <span class="pi">${open ? z.icon : '🔒'}</span>${beaten ? '<i class="pk">✓</i>' : ''}<b>${z.name}</b></button>`;
  }).join('');
  const wpin = w.wb ? `<button class="map-pin tower wb ${mapSel === 'wb' ? 'on' : ''} ${wbOpen() ? '' : 'locked'}" style="left:${w.wb[0]}%;top:${w.wb[1]}%" data-a="mapsel" data-v="wb"><span class="pi">${wbOpen() ? WORLD_BOSSES[w.id].icon : '🔒'}</span><b>บอสโลก</b></button>` : '';
  const rpin = w.rush ? `<button class="map-pin tower rushp ${mapSel === 'rush' ? 'on' : ''} ${rushOpen() ? '' : 'locked'}" style="left:${w.rush[0]}%;top:${w.rush[1]}%" data-a="mapsel" data-v="rush"><span class="pi">🏛️</span><b>หอคอยรวมบอส</b></button>` : '';
  const tpin = w.tower ? `<button class="map-pin tower ${mapSel === 'tower' ? 'on' : ''}" style="left:${w.tower[0]}%;top:${w.tower[1]}%" data-a="mapsel" data-v="tower"><span class="pi">🗼</span><b>หอคอย 100 ชั้น</b></button>` : '';
  return `<h2>🗺️ แผนที่โลก</h2>${tabs}
    <div class="map-wrap"><div class="worldmap"><img src="${w.map}" alt="แผนที่${w.n}">${pins}${tpin}${wpin}${rpin}</div>
      <button class="map-diff d-${S.diff}" data-a="diffmenu">${d.icon} ${d.name} ▾</button>${menu}</div>
    <div class="muted" style="font-size:12px;margin:6px 2px 10px">แตะที่แผนที่เพื่อเลือกด่าน${w.tower ? ' · 🗼 ตรงกลางคือหอคอย' : ''}${w.wb ? ` · ${WORLD_BOSSES[w.id].icon} บอสโลก` : ''}</div>
    ${mapSel === 'tower' ? renderTowerPanel() : mapSel === 'wb' ? wbPanel() : mapSel === 'rush' ? rushPanel() : zoneCard(mapSel)}`;
}

/* ---------------- เมือง ---------------- */
// pot = ตัวคูณราคายา, charm = ตัวคูณราคายันต์, inn = ตัวคูณค่าที่พัก, chest = ระดับความหายากขั้นต่ำของหีบ +เท่านี้
const TOWNS = [
  { id: 'start', n: 'หมู่บ้านเริ่มต้น', icon: '🏘️', world: 'w1', bg: 'bg/forest.webp', unlock: null,
    desc: 'หมู่บ้านเล็กๆ ชายป่า จุดเริ่มต้นของผู้กล้า', pot: 1, charm: 1, inn: 1, chest: 0 },
  { id: 'oasis', n: 'เมืองโอเอซิส', icon: '🏜️', world: 'w1', bg: 'bg/desert.webp', unlock: 'desert',
    desc: 'ตลาดพ่อค้ากลางทะเลทราย · ยาทุกชนิดลด 25%', pot: 0.75, charm: 1, inn: 1, chest: 0 },
  { id: 'frost', n: 'ป้อมปราการน้ำแข็ง', icon: '🏰', world: 'w1', bg: 'bg/ice.webp', unlock: 'ice',
    desc: 'ป้อมของเหล่าช่างตีเหล็ก · ยันต์ลด 30% · ที่พักครึ่งราคา', pot: 1, charm: 0.7, inn: 0.5, chest: 0 },
  { id: 'sky', n: 'นครลอยฟ้า', icon: '☁️', world: 'w1', bg: 'bg/sky.webp', unlock: 'sky',
    desc: 'เมืองบนเกาะลอยฟ้า · หีบสมบัติดีขึ้น 1 ระดับ', pot: 1, charm: 1, inn: 1, chest: 1 },
  { id: 'w2town', n: 'นครประตูมิติ', icon: '🌌', world: 'w2', bg: 'bg/spirit.webp', unlock: 'world:w2',
    desc: 'เมืองหน้าด่านของดินแดนใหม่ · ยาและยันต์ลด 20% · หีบดีขึ้น 1 ระดับ', pot: 0.8, charm: 0.8, inn: 1, chest: 1 },
];
const townDef = (id) => TOWNS.find((t) => t.id === id) || TOWNS[0];
const curTown = () => townDef(S && S.town);
function townUnlocked(t) {
  if (!t.unlock) return true;
  if (t.unlock.startsWith('world:')) { const w = t.unlock.slice(6); return worldReady(w) && worldUnlocked(w); }
  return Object.values(S.prog || {}).some((p) => p.bossWins && p.bossWins[t.unlock]); // ล้มบอสด่านนั้นในโหมดใดก็ได้
}
const townLockText = (t) => (t.unlock.startsWith('world:') ? `${worldDef(t.unlock.slice(6)).n} (เร็วๆ นี้)` : `ล้มบอส ${ZONES.find((z) => z.id === t.unlock).boss[0]}`);
let townMenu = false;
function townMenuHTML() {
  if (!townMenu) return '';
  return `<div class="town-menu-pop">${TOWNS.map((t) => {
    const ok = townUnlocked(t);
    return `<button class="${S.town === t.id ? 'on' : ''}" data-a="town" data-v="${t.id}" ${ok ? '' : 'disabled'}>
      <b>${ok ? t.icon : '🔒'} ${t.n}</b><span class="subtle">${ok ? t.desc : townLockText(t)}</span></button>`;
  }).join('')}</div>`;
}

function zoneCard(i) {
  const z = ZONES[i];
  const open = zoneUnlocked(i);
  const kills = P().zoneKills[z.id] || 0;
  const bossOpen = kills >= BOSS_UNLOCK_KILLS;
  const beaten = P().bossWins[z.id];
  const bs = bossOf(z);
  return `<div class="card zone-card ${open ? '' : 'locked'}">
    <div class="zc-bg" style="background-image:url(bg/${z.scene || z.id}.webp)"></div>
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
/* หอคอยแยกตามแมพ: w1 = S.tower, w2 = S.tower2 (มอนสเตอร์แมพ 2 · เลเวล +30) */
const curTW = () => (S && S.world === 'w2' ? 'w2' : 'w1');
const tp = (w) => (w === 'w2' ? (S.tower2 || (S.tower2 = { normal: 0, hard: 0, hell: 0 })) : S.tower);
const towerLv = (k, f, w = curTW()) => Math.round(TOWER_DIFFS[k].base + TOWER_DIFFS[k].per * f + (w === 'w2' ? 30 : 0));
const towerTier = (k, f, w = curTW()) => clamp(Math.round(towerLv(k, f, w) / 2.8), 1, 40);
const towerZone = (f, w = curTW()) => worldZoneIdx(w)[Math.floor((f - 1) / 10) % 10];
const towerOpen = (k, w = curTW()) => { const n = TOWER_DIFFS[k].need; return !n || (tp(w)[n[0]] || 0) >= n[1]; };
let towerPick = null;

function towerEnemy(k, floor, w) {
  const td = TOWER_DIFFS[k], dd = DIFFS[td.world];
  const z = ZONES[towerZone(floor, w)];
  const Z = towerLv(k, floor, w);
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
  return { e, boss, zi: towerZone(floor, w) };
}

function startTower(k, floor, w = curTW()) {
  if (!towerOpen(k, w)) return;
  floor = clamp(floor, 1, Math.min(TOWER_FLOORS, (tp(w)[k] || 0) + 1));
  const t = towerEnemy(k, floor, w);
  startBattle(t.zi, t.boss, { tower: { d: k, floor, w }, e: t.e });
}

/* รางวัลเมื่อชนะในหอคอย (เรียกจาก victory) */
function towerWin(rewards) {
  const t = B.tower, td = TOWER_DIFFS[t.d], dd = DIFFS[td.world];
  const w = t.w || 'w1', P2 = tp(w);
  const tier = towerTier(t.d, t.floor, w);
  rewards.tower = t;
  if (t.floor > (P2[t.d] || 0)) { P2[t.d] = t.floor; rewards.towerNew = true; }
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
  const w = curTW();
  const k = S.towerD;
  const best = tp(w)[k] || 0;
  const maxPick = Math.min(TOWER_FLOORS, best + 1);
  if (towerPick === null || towerPick > maxPick) towerPick = maxPick;
  const f = towerPick, boss = f % 10 === 0, z = ZONES[towerZone(f, w)];
  const td = TOWER_DIFFS[k];
  const tabs = Object.entries(TOWER_DIFFS).map(([id, x]) => {
    const open = towerOpen(id, w);
    return `<button class="${k === id ? 'on' : ''}" data-a="towerd" data-v="${id}" ${open ? '' : 'disabled'}>${open ? x.icon : '🔒'} ${x.name}<span class="subtle">${tp(w)[id] || 0}/${TOWER_FLOORS}</span></button>`;
  }).join('');
  const bs = boss ? (f === TOWER_FLOORS && z.bossFinal ? z.bossFinal : z.boss) : null;
  return `<div class="card tower-card">
    <h3 style="margin-top:0">🗼 หอคอย 100 ชั้น${w === 'w2' ? ' · แมพ 2' : ''}</h3>
    <div class="tower-tabs">${tabs}</div>
    ${Object.entries(TOWER_DIFFS).filter(([id]) => !towerOpen(id, w)).map(([id, x]) => `<div class="muted" style="font-size:12px">🔒 ${x.name}: ผ่านชั้น ${x.need[1]} ของโหมด${TOWER_DIFFS[x.need[0]].name}</div>`).join('')}
    <div class="tower-bar"><i style="height:${best}%"></i></div>
    <div class="tower-floor">
      <button class="small" data-a="tpick" data-v="-10">⏪</button><button class="small" data-a="tpick" data-v="-1">◀</button>
      <div><div class="tf-n">ชั้น ${f}</div><div class="muted" style="font-size:12px">Lv.${towerLv(k, f, w)} · ${z.icon} ${z.name}</div></div>
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
  return { lv: S.lv, exp: S.exp, adv: !!S.adv, adv3: !!S.adv3, loadout: S.loadout.slice(), skin: S.cos ? S.cos.skin : 'default' };
}
function switchClass(to) {
  if (!CLASSES[to] || to === S.cls) return;
  S.classes[S.cls] = classSnapshot();
  const c = S.classes[to] || { lv: 1, exp: 0, adv: false, loadout: defaultLoadout(to, 1), skin: 'default' };
  S.cls = to; S.lv = c.lv; S.exp = c.exp; S.adv = c.adv; S.adv3 = !!c.adv3; S.loadout = c.loadout.slice();
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
    const nm = s && s.adv3 ? `${ADV3_CLASSES[id].icon} ${ADV3_CLASSES[id].name}` : s && s.adv ? `${ADV_CLASSES[id].icon} ${ADV_CLASSES[id].name}` : `${c.icon} ${c.name}`;
    return `<div class="card class-card ${on ? 'on' : ''}">
      <div class="cc-art">${heroArt(id, {}, 84, s ? s.adv : false, { skin: SKINS[0], aura: null, tier3: s ? !!s.adv3 : false })}</div>
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
  if (!s.town || !TOWNS.some((x) => x.id === s.town)) s.town = 'start';
  if (!s.mine) s.mine = { pick: 1, energy: 20, t: Date.now(), total: 0, gold: 0 };
  if (!s.buffs) s.buffs = {};
  for (const k of Object.keys(POTIONS)) if (s.pots[k] == null) s.pots[k] = 0;
  if (!s.world || !WORLDS.some((x) => x.id === s.world)) s.world = 'w1';
  if (!s.diffBy) s.diffBy = { [s.world]: s.diff };
  if (!s.classes[s.cls]) s.classes[s.cls] = { lv: s.lv, exp: s.exp, adv: !!s.adv, loadout: (s.loadout || []).slice(), skin: s.cos ? s.cos.skin : 'default' };
  return s;
}

function towerClick(a, v, el) {
  if (mineClick(a, v)) return true;
  switch (a) {
    case 'diffmenu': diffMenu = !diffMenu; return true;
    case 'world': if (worldReady(v) && worldUnlocked(v)) { setWorld(v); mapSel = null; diffMenu = false; save(); } return true;
    case 'townmenu': townMenu = !townMenu; return true;
    case 'town': { const tw = townDef(v); if (townUnlocked(tw)) { S.town = tw.id; setWorld(tw.world); mapSel = null; townMenu = false; save(); toast(`${tw.icon} มาถึง${tw.n}`); } return true; }
    case 'mapsel': diffMenu = false; mapSel = ['tower', 'wb', 'rush'].includes(v) ? v : +v; return true;
    case 'rpick': { const max = Math.min(rushList().length, rushBest() + 1); rushPick = clamp((rushPick || max) + +v, 1, max); return true; }
    case 'rush': startRush(+v); return 'battle';
    case 'rnext': startRush(B.rush.floor + 1); return 'battle';
    case 'wbfight': startWB(B && B.wb ? B.wb : S.world); return 'battle';
    case 'towerd': if (towerOpen(v)) { S.towerD = v; towerPick = null; save(); } return true;
    case 'tpick': { const max = Math.min(TOWER_FLOORS, (tp(curTW())[S.towerD] || 0) + 1); towerPick = clamp((towerPick || max) + +v, 1, max); return true; }
    case 'tower': startTower(S.towerD, +v); return 'battle';
    case 'tnext': startTower(B.tower.d, B.tower.floor + 1, B.tower.w); return 'battle';
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

/* ---------------- ⛏️ เหมืองทอง ----------------
   แตะขุดใช้พลัง 1 · พลังฟื้น 1 ทุก 2 นาที (แม้ปิดเกม) · อัปเกรดพลั่วเพิ่มรายได้/ของหายาก */
const MINE_REGEN_MS = 120000;
const PICK_MAX = 10;
const ORES = [
  { id: 'stone', n: 'หินแร่', i: '🪨', w: 44, m: 0.5 },
  { id: 'copper', n: 'ทองแดง', i: '🟤', w: 25, m: 1 },
  { id: 'silver', n: 'แร่เงิน', i: '⚪', w: 15, m: 2 },
  { id: 'gold', n: 'ก้อนทองคำ', i: '🟡', w: 9, m: 5 },
  { id: 'gem', n: 'อัญมณี', i: '💎', w: 4, m: 15 },
  { id: 'frag', n: 'เศษเลเจนดารี', i: '💠', w: 1.6, m: 0 },
  { id: 'charm', n: 'ยันต์คุ้มครอง', i: '🧿', w: 1, m: 0 },
  { id: 'chest', n: 'หีบโบราณ', i: '🎁', w: 0.6, m: 0 },
];
const mineMax = () => 20 + ((S.mine && S.mine.pick) || 1) * 2;
const pickCost = (lv) => Math.round(3000 * lv * lv);
function mineSync() {
  const m = S.mine, now = Date.now();
  if (m.energy >= mineMax()) { m.t = now; return; }
  const gain = Math.floor((now - m.t) / MINE_REGEN_MS);
  if (gain > 0) { m.energy = Math.min(mineMax(), m.energy + gain); m.t += gain * MINE_REGEN_MS; if (m.energy >= mineMax()) m.t = now; }
}
const mineEnergy = () => { if (!S || !S.mine) return 0; mineSync(); return S.mine.energy; };
let mineLast = null;
function mineDig(times = 1) {
  mineSync();
  const m = S.mine, got = { gold: 0, finds: [] };
  for (let k = 0; k < times && m.energy > 0; k++) {
    m.energy--;
    if (m.energy < mineMax() && m.t > Date.now()) m.t = Date.now();
    const rareBoost = 1 + (m.pick - 1) * 0.15;
    const pool = ORES.map((o) => ({ ...o, w: o.m >= 5 || !o.m ? o.w * rareBoost : o.w }));
    let x = Math.random() * pool.reduce((s, o) => s + o.w, 0), ore = pool[0];
    for (const o of pool) { x -= o.w; if (x <= 0) { ore = o; break; } }
    const base = (25 + S.lv * 9) * (1 + (m.pick - 1) * 0.3);
    if (ore.m) { const g = Math.round(base * ore.m * rand(0.85, 1.15)); got.gold += g; }
    if (ore.id === 'frag') { const r = { frags: [] }; fragDrop(r, 1); }
    if (ore.id === 'charm') S.charms++;
    if (ore.id === 'chest') { const d = D(); const it = makeGear(maxTier(), Math.min(d.maxR, d.minR + 1), d.maxR); addItem(it); got.item = it; }
    got.finds.push(ore);
    m.total = (m.total || 0) + 1;
  }
  S.gold += got.gold; m.gold = (m.gold || 0) + got.gold;
  mineLast = { ...got, k: (mineLast ? mineLast.k : 0) + 1 };
  save();
}
function renderMine() {
  mineSync();
  const m = S.mine, max = mineMax();
  const next = m.energy >= max ? 0 : Math.ceil((MINE_REGEN_MS - (Date.now() - m.t)) / 1000);
  const last = mineLast;
  const counts = {}; if (last) last.finds.forEach((o) => { counts[o.id] = (counts[o.id] || 0) + 1; });
  return `<div class="row between"><h2>⛏️ เหมืองทอง</h2><button class="small" data-a="go" data-v="town">← กลับ</button></div>
  <div class="card mine-card">
    <div class="row between"><b>⚡ พลังขุด ${m.energy}/${max}</b><span class="muted" style="font-size:12px">${next ? `+1 ใน ${Math.floor(next / 60)}:${String(next % 60).padStart(2, '0')}` : 'เต็มแล้ว'}</span></div>
    <div class="bar exp" style="margin:6px 0 10px"><i style="width:${(m.energy / max) * 100}%"></i></div>
    <button class="mine-rock ${last ? 'hit' : ''}" data-a="dig" data-v="1" ${m.energy ? '' : 'disabled'} data-k="${last ? last.k : 0}">
      <span class="mr-ore">⛰️</span><span class="mr-pick">⛏️</span>
      ${last ? `<span class="mr-pop" key="${last.k}">${last.gold ? `+${fmt(last.gold)} 💰` : ''} ${Object.entries(counts).filter(([id]) => ['frag', 'charm', 'chest', 'gem', 'gold'].includes(id)).map(([id, c]) => `${ORES.find((o) => o.id === id).i}${c > 1 ? '×' + c : ''}`).join(' ')}</span>` : ''}
    </button>
    <div class="muted" style="text-align:center;font-size:12px;margin:6px 0">แตะก้อนหินเพื่อขุด</div>
    <div class="actions"><button data-a="dig" data-v="10" ${m.energy ? '' : 'disabled'}>⛏️ ขุด ×10</button><button data-a="dig" data-v="999" ${m.energy ? '' : 'disabled'}>⛏️ ขุดทั้งหมด (${m.energy})</button></div>
    ${last && last.item ? `<div class="new-skill">🎁 เจอหีบโบราณ! ได้ <b class="r-${last.item.rarity}">${esc(last.item.name)}</b></div>` : ''}
    ${S.pots.lunch ? `<button class="small" style="margin-top:8px;width:100%" data-a="drink" data-v="lunch">🍱 กินข้าวกล่อง (+10 พลัง) · มี ${S.pots.lunch}</button>` : ''}
  </div>
  <div class="card">
    <div class="row between"><b>⛏️ พลั่ว Lv.${m.pick}${m.pick >= PICK_MAX ? ' (สูงสุด)' : ''}</b>
      ${m.pick < PICK_MAX ? `<button class="small primary" data-a="pickup" ${S.gold >= pickCost(m.pick) ? '' : 'disabled'}>อัปเกรด ${fmt(pickCost(m.pick))} 💰</button>` : ''}</div>
    <div class="muted" style="font-size:13px;margin-top:4px">รายได้ +${(m.pick - 1) * 30}% · ของหายาก +${(m.pick - 1) * 15}% · พลังสูงสุด ${max}${m.pick < PICK_MAX ? ` → อัปเกรดแล้ว: รายได้ +${m.pick * 30}% พลังสูงสุด ${max + 2}` : ''}</div>
  </div>
  <div class="card"><b>สิ่งที่ขุดเจอได้</b>
    <div class="ore-list">${ORES.map((o) => `<span>${o.i} ${o.n}</span>`).join('')}</div>
    <div class="muted" style="font-size:12px;margin-top:6px">ขุดมาแล้ว ${fmt(m.total || 0)} ครั้ง · ได้ทองรวม ${fmt(m.gold || 0)} 💰 · ทองที่ได้เพิ่มตามเลเวล</div></div>`;
}
function mineClick(a, v) {
  if (a === 'dig') { if (!mineEnergy()) { toast('พลังขุดหมดแล้ว รอสักครู่หรือกินข้าวกล่อง'); return true; } mineDig(+v); return true; }
  if (a === 'pickup') { const c = pickCost(S.mine.pick); if (S.mine.pick >= PICK_MAX || S.gold < c) return true; S.gold -= c; S.mine.pick++; save(); toast(`⛏️ พลั่วเป็น Lv.${S.mine.pick}!`); return true; }
  return false;
}
