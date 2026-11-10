'use strict';
/* ============================================================
   โหมดกิลด์นักล่า (เซฟแยกจากโหมดเนื้อเรื่อง: thai-rpg-hunter-v1)
   - แรงค์กิลด์ F → S: สะสมแต้มจากการล่าและภารกิจกิลด์ แรงค์สูงขึ้นเปิดด่านใหม่
   - ปราบมอนแล้วมีโอกาสที่ "วิญญาณอสูร" หลุดออกมา (บอส = แน่นอน)
     เลือกได้ 1 อย่าง: ดูดสกิลของมัน หรือ รับมันเป็นพวก (ได้ซ้ำ = เลเวลอัพ)
   - อาชีพลับ: ปลดล็อกจากเงื่อนไขที่ไม่บอกตรงๆ ใส่ได้ทีละ 1 อาชีพ
   ใช้ระบบต่อสู้/ด่าน/มอนสเตอร์เดิมทั้งหมด · ฟังก์ชันในไฟล์นี้ถูกเรียกจาก game.js
   (ห้ามใช้ค่าคงที่ของ game.js ตอนโหลดไฟล์ เพราะ game.js โหลดทีหลัง)
   ============================================================ */

const hm = () => !!S && S.mode === 'hunter';

/* ---------------- แรงค์กิลด์ ---------------- */
const HM_RANKS = [
  { r: 'F', n: 'มือใหม่', pts: 0, slots: 2, color: '#a79fc4' },
  { r: 'E', n: 'ฝึกหัด', pts: 25, slots: 2, color: '#8be04b' },
  { r: 'D', n: 'นักล่า', pts: 70, slots: 3, color: '#4ba3ff' },
  { r: 'C', n: 'นักล่าชำนาญ', pts: 150, slots: 3, color: '#2ee6c8' },
  { r: 'B', n: 'นักล่าระดับสูง', pts: 280, slots: 4, color: '#c06bff' },
  { r: 'A', n: 'ยอดนักล่า', pts: 460, slots: 4, color: '#ffad33' },
  { r: 'S', n: 'ตำนานนักล่า', pts: 750, slots: 5, color: '#ff5b8a' },
];
const HM_OFFER_CHANCE = 0.3; // มอนธรรมดา: โอกาสวิญญาณหลุด (บอส 100%)
const HM_SKILL_MAX = 10;

/* แรงค์ที่ต้องมีเพื่อเข้าด่าน: ทวีปแรก 2 ด่านต่อแรงค์ (F..B) · ทวีป 2 ครึ่งแรก A ครึ่งหลัง S */
function hmZoneRank(i) {
  const w = zoneWorld(ZONES[i]), k = worldZoneIdx(w).indexOf(i);
  return w === 'w1' ? Math.min(4, Math.floor(k / 2)) : k < 5 ? 5 : 6;
}
const hmZoneRankOk = (i) => hmZoneRank(i) <= S.hunter.rank;
const hmLockText = (i) => `🏛️ ต้องเป็นนักล่าแรงค์ ${HM_RANKS[hmZoneRank(i)].r} ก่อน (เลื่อนแรงค์ที่กิลด์)`;
const hmNext = () => HM_RANKS[S.hunter.rank + 1] || null;
const hmCanPromote = () => !!hmNext() && S.hunter.pts >= hmNext().pts;

/* ---------------- ธาตุของมอนสเตอร์ (ตามด่าน) ---------------- */
const HM_ELEM = {
  forest: { n: 'พฤกษา', i: '🌿', atk: 'หนามพฤกษา', pet: 'heal' },
  cave: { n: 'ปฐพี', i: '🪨', atk: 'ปฐพีแตก', pet: 'drain' },
  desert: { n: 'ผืนทราย', i: '🏜️', atk: 'กรงเล็บทราย', pet: 'crit' },
  volcano: { n: 'เพลิง', i: '🔥', atk: 'เปลวเพลิง', pet: 'fire' },
  swamp: { n: 'พิษ', i: '☠️', atk: 'พิษร้าย', pet: 'poison' },
  ice: { n: 'น้ำแข็ง', i: '❄️', atk: 'หอกเหมันต์', pet: 'guard' },
  sea: { n: 'สมุทร', i: '🌊', atk: 'คลื่นดูดกลืน', pet: 'attack' },
  sky: { n: 'อสนี', i: '⚡', atk: 'อสนีบาต', pet: 'thunder' },
  spirit: { n: 'วิญญาณ', i: '👻', atk: 'เงามรณะ', pet: 'dodge' },
  castle: { n: 'อสูร', i: '😈', atk: 'โทสะอสูร', pet: 'crit' },
};

/* ตารางมอนสเตอร์: ชื่อ → ด่าน ธาตุ ค่าพลัง (สร้างตอนใช้ครั้งแรก) */
let HM_MON = null;
function hmMon(name) {
  if (!HM_MON) {
    HM_MON = {};
    ZONES.forEach((z, zi) => {
      const el = z.scene || z.id;
      z.mobs.forEach((m) => { HM_MON[m[0]] = { n: m[0], i: m[1], zi, el, t: [m[2], m[3], m[4]], boss: false }; });
      for (const b of [z.boss, z.bossFinal]) if (b) HM_MON[b[0]] = { n: b[0], i: b[1], zi, el, t: [1.3, 1.3, 1.1], boss: true };
    });
  }
  return HM_MON[name] || null;
}

/* ---------------- อาชีพลับ ---------------- */
const hmSkillEls = () => Object.keys(S.hunter.skills).map((n) => (hmMon(n) || {}).el).filter(Boolean);
const hmAllies = () => S.pets.filter((p) => p.id.startsWith('m:')).map((p) => hmMon(p.id.slice(2))).filter(Boolean);
const HM_JOBS = [
  { id: 'flame', n: 'จอมเวทเพลิงอสูร', i: '🔥', bonus: 'สกิลอสูรธาตุเพลิงแรง ×1.6 · พลังโจมตี +10%',
    hint: 'ว่ากันว่าผู้ที่กลืนกินเปลวเพลิงของอสูรได้มากพอ จะได้ยินเสียงเรียกจากปล่องภูเขาไฟ...',
    ok: () => hmSkillEls().filter((e) => e === 'volcano').length >= 5 },
  { id: 'soul', n: 'ผู้คุมวิญญาณ', i: '👻', bonus: 'พวกอสูรแรงขึ้น ×1.6 · HP +10%',
    hint: 'ดวงวิญญาณจะยอมรับเฉพาะผู้ที่มีพวกพ้องจากดินแดนแห่งความตาย...',
    ok: () => hmAllies().filter((m) => m.el === 'spirit').length >= 3 },
  { id: 'devour', n: 'ผู้กลืนกินพลัง', i: '🌀', bonus: 'สกิลอสูรทุกแบบแรง ×1.25 · ใช้ MP น้อยลง 25% · ช่องสกิลอสูร +1',
    hint: 'ยิ่งกลืนกินพลังหลากหลายเท่าไร ร่างกายยิ่งเปลี่ยนไป...',
    ok: () => S.hunter.absorbed >= 25 && new Set(hmSkillEls()).size >= 5 },
  { id: 'beast', n: 'ราชันอสูร', i: '👑', bonus: 'ค่าพลังทั้งหมด +12% · พวกอสูรแรงขึ้น ×1.3',
    hint: 'มีเพียงนักล่าแรงค์สูงที่นำฝูงอสูรขนาดใหญ่ เท่านั้นที่อสูรจะยอมเรียกว่า "ราชา"...',
    ok: () => hmAllies().length >= 12 && S.hunter.rank >= 4 },
  { id: 'storm', n: 'ผู้ควบคุมอสนี', i: '⚡', bonus: 'สกิลอสูรโอกาสทำให้มึน +20% · คริ +10%',
    hint: 'เมื่อพลังแห่งฟากฟ้าและห้วงสมุทรมาบรรจบในร่างเดียว พายุจะเชื่อฟัง...',
    ok: () => hmSkillEls().filter((e) => e === 'sky').length >= 3 && hmSkillEls().filter((e) => e === 'sea').length >= 2 },
  { id: 'plague', n: 'หมอผีโรคระบาด', i: '🦠', bonus: 'พิษจากสกิลอสูรแรง ×2 และนานขึ้น 2 เทิร์น · DEF +10%',
    hint: 'ผู้ที่ทั้งกลืนกินพิษและเลี้ยงดูสัตว์แห่งหนองบึง จะไม่หวั่นต่อโรคใดๆ...',
    ok: () => hmSkillEls().filter((e) => e === 'swamp').length >= 4 && hmAllies().filter((m) => m.el === 'swamp').length >= 2 },
  { id: 'bounty', n: 'นักล่าค่าหัว', i: '💰', bonus: 'ทองจากการต่อสู้ +50% · แต้มกิลด์ +50%',
    hint: 'กิลด์จะมอบตราพิเศษให้แก่ผู้ที่ทำภารกิจจากบอร์ดสำเร็จนับไม่ถ้วน...',
    ok: () => (S.hunter.qdone || 0) >= 20 && S.hunter.rank >= 2 },
];
const hmJob = () => (S && S.hunter && S.hunter.job) || null;
function hmCheckJobs() {
  const fresh = HM_JOBS.filter((j) => !S.hunter.jobs[j.id] && j.ok());
  for (const j of fresh) {
    S.hunter.jobs[j.id] = true;
    if (!S.hunter.job) S.hunter.job = j.id;
    toast(`🔓 ปลดล็อกอาชีพลับ: ${j.i} ${j.n}!`);
  }
  return fresh;
}
function hmStatMods(s) {
  const j = hmJob();
  if (j === 'beast') for (const k of ['hp', 'mp', 'atk', 'def']) s[k] *= 1.12;
  if (j === 'flame') s.atk *= 1.1;
  if (j === 'soul') s.hp *= 1.1;
  if (j === 'storm') s.crit += 10;
  if (j === 'plague') s.def *= 1.1;
}
const hmSlots = () => HM_RANKS[S.hunter.rank].slots + (hmJob() === 'devour' ? 1 : 0);
const hmAllyMul = () => (hmJob() === 'soul' ? 1.6 : hmJob() === 'beast' ? 1.3 : 1);

/* ---------------- เซฟ ---------------- */
function hmMigrate(s) {
  s.hunter = { rank: 0, pts: 0, skills: {}, load: [], quests: [], jobs: {}, job: null, absorbed: 0, tamed: 0, qdone: 0, tab: 'rank', selSk: null, selAl: null, ...(s.hunter || {}) };
  return s;
}

/* ---------------- สกิลอสูร ----------------
   มอนสเตอร์ทุกตัวมีสกิลเฉพาะของตัวเอง เขียนเป็นรหัสสั้นๆ คั่นด้วยเว้นวรรค
   ดาเมจ:  h1.4 = โจมตี 140% · x3 = 3 ครั้ง · td ไม่สนเกราะ · pi60 เจาะเกราะ 60% · cr20 คริ +20%
           df แรงตามพลังป้องกัน · mp แรงตาม MP · rg ยิ่ง HP น้อยยิ่งแรง · ex ศัตรู HP ต่ำ = ×2 · rn ดาเมจสุ่ม
   ผล:     ps3 พิษ 3 เทิร์น · pb ระเบิดพิษที่ค้าง · sl ศัตรูช้าลง · st30 มึน 30% · dr40 ดูดเลือด 40%
           mg15 ฟื้น MP 15% · hc8 เสีย HP 8% · he20 ฟื้น HP 20% · re ฟื้นฟูต่อเนื่อง · gd ขโมยทอง · pt พวกอสูรโจมตีเพิ่ม
   บัฟ:    iw ป้องกัน+60% · ms รับดาเมจ-50% · dv รับดาเมจ-70% · ev หลบครั้งถัดไป · au ATK+50% · fo สมาธิ · bs คลั่ง */
const HM_SKILLS = {
  // ป่าเขียวขจี
  'ภูตพฤกษา': ['รากพันธนาการ', 'h1.3 sl he6'],
  'ภูตจิ๋ว': ['ฝุ่นนางฟ้า', 'ev he12'],
  'แมวมอส': ['ข่วนสามเล็บ', 'h0.6 x3 cr20'],
  'ด้วงมอส': ['กระดองมอส', 'iw re'],
  'แมลงยักษ์': ['เหล็กในดูดเลือด', 'h1.2 dr50'],
  'หุ่นไม้': ['ทุบไม้ซุง', 'h1.5 df'],
  'ราชาพฤกษา': ['พงไพรคืนชีพ', 'he35 re iw'],
  // ถ้ำมืดมิด
  'แมงมุมคริสตัล': ['ใยผลึก', 'h1.1 sl ps3'],
  'มนุษย์ถ้ำ': ['กระบองขโมยของ', 'h1.5 gd'],
  'ผลึกมีชีวิต': ['ผลึกสะท้อน', 'h0.8 ms'],
  'ทากผลึก': ['เมือกแข็ง', 'iw he10'],
  'เห็ดเรืองแสง': ['สปอร์หลับใหล', 'h0.7 st50'],
  'หินจำแลง': ['หินถล่ม', 'h1.8 df st20'],
  'เนตรผลึก': ['จ้องสะกด', 'h2 td st60'],
  // ทะเลทราย
  'ด้วงสการับ': ['เกราะสการับ', 'ms au'],
  'มังกรทราย': ['พ่นทรายบังตา', 'h1.5 ev'],
  'พายุทราย': ['พายุหมุน', 'h0.45 x5'],
  'แมงป่องยักษ์': ['หางพิษทะลวง', 'h1.3 pi60 ps3'],
  'มัมมี่': ['คำสาปฟาโรห์', 'h1.2 td mg15'],
  'กระบองเพชรคลั่ง': ['หนามสวนกลับ', 'h1 iw'],
  'สฟิงซ์ทองคำ': ['ปริศนาสฟิงซ์', 'h1.6 rn cr30'],
  // ภูเขาไฟ
  'ภูตไฟ': ['ลูกไฟระเบิด', 'h2.2 td hc6'],
  'ซาลาแมนเดอร์': ['เผาไหม้ต่อเนื่อง', 'h1.2 ps4'],
  'โทรลลาวา': ['คลั่งลาวา', 'bs he10'],
  'ยักษ์ลาวา': ['ผิวหินหลอมเหลว', 'h1 df iw'],
  'ทากแมกมา': ['ลาวาไหลหลาก', 'h0.8 x2 sl'],
  'ลูกนกฟีนิกซ์': ['ขนนกคืนชีพ', 'he30 re'],
  'มังกรเพลิง': ['เพลิงมังกรผลาญ', 'h2.8 td ps3'],
  // หนองน้ำพิษ
  'มนุษย์คางคก': ['ลิ้นตวัด', 'h1.2 mg12 st20'],
  'โกเลมหนองน้ำ': ['โคลนดูด', 'h1.4 df sl'],
  'สไลม์พิษ': ['พิษกัดกร่อน', 'h0.8 pi40 ps5'],
  'สไลม์เหลว': ['ร่างเหลว', 'ev he15'],
  'หนูกาฬโรค': ['ฟันแทะโรคร้าย', 'h0.5 x4 ps2'],
  'งูพิษ': ['ระเบิดพิษ', 'h1.2 pb'],
  'ไฮดราพิษ': ['เก้าเศียรกัด', 'h0.5 x6 ps3'],
  // ธารน้ำแข็ง
  'เยติ': ['ทุบหิมะถล่ม', 'h2 st25'],
  'ยักษ์น้ำแข็ง': ['กำแพงน้ำแข็ง', 'iw ms'],
  'ปีศาจหิมะ': ['กรงเล็บเยือกแข็ง', 'h0.7 x3 sl'],
  'หมีฮูกน้ำแข็ง': ['กอดรัดหมี', 'h1.6 dr25'],
  'นกฮูกหิมะ': ['ตาเหยี่ยวราตรี', 'fo ev'],
  'โกเลมคริสตัล': ['ผลึกสะท้อนแสง', 'h1 df ms'],
  'ราชาน้ำแข็ง': ['ยุคน้ำแข็ง', 'h1 x3 td sl st30'],
  // วิหารใต้สมุทร
  'เงือก': ['บทเพลงไซเรน', 'st50 mg15'],
  'มังกรทะเล': ['ลำน้ำแรงดันสูง', 'h2 pi70'],
  'ทหารสมุทร': ['หอกตรีศูล', 'h0.8 x3 pi30'],
  'หุ่นทองเหลือง': ['โหมดป้อมปราการ', 'iw au'],
  'ภูตปะการัง': ['ปะการังเยียวยา', 'he25 ms'],
  'หมึกยักษ์': ['หนวดหกแขน', 'h0.38 x6'],
  'เทพสมุทร': ['สึนามิ', 'h1.2 x3 dr30'],
  // เกาะลอยฟ้า
  'วาฬฟ้า': ['บทเพลงวาฬ', 'he20 re ms'],
  'ฮาร์ปี้': ['โฉบเฉี่ยว', 'h1.3 ev'],
  'ภูตลม': ['ลมเร่งรีบ', 'h0.8 x2 fo'],
  'เมฆสายฟ้า': ['ฟ้าผ่ากลางพายุ', 'h1.6 st35'],
  'ภูตอสนี': ['ประจุพลัง', 'au mg25'],
  'ฉลามเวหา': ['ฉลามคลั่งเลือด', 'h1.4 ex dr20'],
  'พญาครุฑ': ['ปีกครุฑสะท้านฟ้า', 'h0.9 x4 cr30 st25'],
  // ดินแดนวิญญาณ
  'วิญญาณร้าย': ['กรีดร้องหลอน', 'h1.2 td st30'],
  'ภูตนำทาง': ['แสงนำทาง', 'he20 fo'],
  'หุ่นรูน': ['อักขระคุ้มกัน', 'dv'],
  'วิญญาณโบราณ': ['ดูดวิญญาณ', 'h1.4 mp mg20'],
  'มังกรวิญญาณ': ['เพลิงวิญญาณ', 'h1.8 td he10'],
  'ผู้เดินแห่งความว่าง': ['ความว่างเปล่า', 'h1.3 rn td'],
  'เจ้าแห่งยมโลก': ['พิพากษายมโลก', 'h2.2 ex dr40'],
  // ปราสาทจอมมาร
  'ปีศาจ': ['สัญญาปีศาจ', 'hc15 au fo'],
  'อินเฟอร์นัล': ['อุกกาบาตนรก', 'h2.4 td hc8'],
  'ปีศาจขวานคู่': ['ขวานคู่คลั่ง', 'h0.8 x4 cr15'],
  'ปีศาจตรวน': ['โซ่ตรวนพันธนาการ', 'h1.2 st60'],
  'ปีศาจเขาโค้ง': ['พุ่งชนเขาโค้ง', 'h1.4 rg'],
  'อัศวินดำ': ['ป้องกันดำทมิฬ', 'h1.2 df iw'],
  'จอมมาร': ['อาณาจักรมืด', 'h2.5 td dr30 mg20'],
  'จอมมารร่างแท้': ['วันสิ้นโลก', 'h1 x5 td'],
  // ป่าภูตพฤกษา
  'ภูตใบไม้': ['พายุใบไม้', 'h0.4 x5 cr10'],
  'ต้นเห็ดมีชีวิต': ['สปอร์เยียวยา', 're he15'],
  'ยักษ์มอส': ['ฝ่ามือขุนเขา', 'h2 df st20'],
  'จิ้งจอกมอส': ['เล่ห์จิ้งจอก', 'h1 ev gd'],
  'แมลงปอเรืองแสง': ['ปีกแสงพราว', 'h0.6 x3 st20'],
  'หมึกพฤกษา': ['หมึกเถาวัลย์', 'h0.6 x2 sl ps3'],
  'ราชาเอนท์': ['พิโรธป่าใหญ่', 'h2.4 df iw re'],
  // ถ้ำอาเทเรียน
  'แมงมุมอเมทิสต์': ['เขี้ยวอเมทิสต์', 'h1.2 cr20 ps4'],
  'โกเลมไพลิน': ['ไพลินคุ้มภัย', 'ms iw'],
  'ทากอัญมณี': ['เมือกเพชร', 'gd he10'],
  'ผลึกออโรรา': ['ลำแสงออโรรา', 'h1.8 mp td'],
  'ลูกแก้วมืด': ['ดวงตาแห่งเงา', 'fo mg30'],
  'งูผลึก': ['รัดผลึก', 'h1 sl pb'],
  'เนตรผลึกมรณะ': ['ลำแสงมรณะ', 'h3 td ex'],
  // ทะเลทรายวังวน
  'ปูทรายยักษ์': ['ก้ามปูหนีบ', 'h1.5 df pi50'],
  'กระบองเพชรยักษ์': ['ฝนหนาม', 'h0.35 x6'],
  'ด้วงอัญมณี': ['ปีกแข็งอัญมณี', 'iw gd'],
  'สิงโตทราย': ['คำรามราชสีห์', 'h1 au st30'],
  'มัมมี่โบราณ': ['คำสาปพันปี', 'h1 td ps5'],
  'ไฮยีนาทะเลทราย': ['ล่าเป็นฝูง', 'h1 pt'],
  'สฟิงซ์จอมทัพ': ['คำบัญชาจอมทัพ', 'h1.5 au fo he20'],
  // ยอดปล่องภูเขาไฟ
  'ซาลาแมนเดอร์ลาวา': ['หางลาวาฟาด', 'h1.3 x2 ps2'],
  'ภูตลาวาเดือด': ['ปะทุเดือด', 'h2 rg hc5'],
  'ภูตเปลวเพลิง': ['เปลวไฟเต้นระบำ', 'h0.6 x4 td'],
  'โกเลมแมกมา': ['แกนแมกมา', 'h1.2 df au'],
  'ฟีนิกซ์เพลิง': ['เกิดใหม่จากเถ้า', 'he45'],
  'มังกรลาวาน้อย': ['ลมหายใจลาวา', 'h1.6 td ps3'],
  'มังกรปล่องภูเขาไฟ': ['ภูเขาไฟระเบิด', 'h0.8 x5 td ps3'],
  // บึงโรคระบาด
  'ยักษ์หนองบึง': ['ฝ่ามือโคลน', 'h1.6 sl st20'],
  'สไลม์ตาเดียว': ['ตาเดียวจับจ้อง', 'h1 cr40 fo'],
  'หนูหนองน้ำ': ['ขโมยแล้วหนี', 'h0.8 gd ev'],
  'งูหนองน้ำ': ['เขี้ยวพิษคู่', 'h0.9 x2 ps4'],
  'โกเลมตะไคร่': ['ตะไคร่ห่อหุ้ม', 'ms re he10'],
  'บัวกินคน': ['กลืนกิน', 'h1.5 dr60'],
  'ไฮดราราชาโรคระบาด': ['โรคระบาดมรณะ', 'h1.5 td pb ps5'],
  // ทุนดราน้ำแข็ง
  'เยติน้อย': ['ก้อนหิมะยักษ์', 'h1.4 st30'],
  'นกฮูกน้ำแข็ง': ['ขนนกน้ำแข็ง', 'h0.5 x4 sl'],
  'ยักษ์ธารน้ำแข็ง': ['ธารน้ำแข็งถล่ม', 'h2.2 df'],
  'ภูตหิมะ': ['ลมหนาวสะกดวิญญาณ', 'h1.1 td sl ev'],
  'หมีขาวยักษ์': ['ตะปบหมีคลั่ง', 'h1.2 bs'],
  'แมมมอธ': ['แมมมอธเหยียบ', 'h1.8 st35'],
  'ราชายักษ์น้ำแข็ง': ['บัลลังก์เหมันต์', 'h2 sl iw ms'],
  // วิหารจมสมุทร
  'เงือกสาว': ['น้ำตาเงือก', 'he30 mg20'],
  'มังกรทะเลน้อย': ['วังน้ำวน', 'h0.6 x3 dr25 sl'],
  'ทหารปลาหมอทะเล': ['โล่ปะการัง', 'h1.2 iw'],
  'กระเบนราหู': ['ช็อตไฟฟ้า', 'h1.3 st40'],
  'ปลาหมึกฟ้า': ['หมึกพรางตัว', 'ev fo'],
  'หมึกกล้วยยักษ์': ['รัดกลืน', 'h1.4 sl dr40'],
  'โพไซดอน': ['ตรีศูลเทพสมุทร', 'h2.6 pi80 st30'],
  // หมู่เกาะสวรรค์
  'นกน้ำแข็งฟ้า': ['ขนนกเยือกแข็ง', 'h1.2 sl ev'],
  'อินทรีพายุ': ['จิกพายุ', 'h0.8 x3 cr25'],
  'นกสายฟ้า': ['สายฟ้าแลบ', 'h1.9 cr10 st25'],
  'ภูตเมฆ': ['ม่านเมฆ', 'ev ms he10'],
  'อินทรีทองคำ': ['กรงเล็บทองคำ', 'h1.5 ex gd'],
  'การ์กอยล์ฟ้า': ['แปลงร่างหิน', 'dv re'],
  'เอเธอร์ร็อค': ['ปีกอีเธอร์', 'h1 x4 mg20 he20'],
  // ยอดผาคริสตัลออโรรา
  'ผีน้ำแข็ง': ['สัมผัสเยือกเย็น', 'h1.3 td sl'],
  'โล่รูนมีชีวิต': ['โล่รูนสะท้อน', 'dv iw'],
  'วิญญาณม่วง': ['ค้างคาวดูดวิญญาณ', 'h0.6 x3 dr50'],
  'หลุมดำจิ๋ว': ['หลุมดำกลืนกิน', 'h1.5 ex td'],
  'ผู้พิทักษ์วิญญาณ': ['พรผู้พิทักษ์', 'he25 dv'],
  'วังวนมิติ': ['บิดเบือนมิติ', 'h0.9 x2 rn'],
  'วิญญาณพลังบริสุทธิ์': ['พลังบริสุทธิ์', 'he40 au fo ms'],
  // ป้อมนรกออบซิเดียน
  'ปีศาจแดง': ['หมัดนรก', 'h1.5 rg'],
  'ปีศาจเพลิง': ['วงแหวนเพลิงนรก', 'h0.7 x3 td ps2'],
  'อัศวินนรก': ['ป้อมปราการนรก', 'h1.3 df iw'],
  'จอมเวทนรก': ['บอลเพลิงมหันต์', 'h2.5 mp hc6'],
  'จอมเวทมืด': ['สาปมืด', 'h1.2 td sl mg15'],
  'หมานรก': ['หมาล่าเนื้อ', 'h1.2 dr20 pt'],
  'อาร์คดีมอน': ['สัญญาอาร์คดีมอน', 'h1.5 td bs fo hc20'],
};

/* แปลงรหัสสกิลเป็นออบเจ็กต์ เช่น 'h0.6 x3 cr20' → { h: 0.6, x: 3, cr: 20 } */
function hmParse(code) {
  const o = {};
  for (const t of code.split(/\s+/)) { const m = t.match(/^([a-z]{1,2})([\d.]*)$/); if (m) o[m[1]] = m[2] === '' ? true : +m[2]; }
  return o;
}
const HM_BOSS_MUL = 1.3; // สกิลราชัน (จากบอส) ดาเมจแรงขึ้น

/* ข้อความอธิบายผลสกิล — P(x) แปลงตัวคูณเป็น % ที่แสดง */
function hmDesc(o, P, hp = 1) {
  const d = [];
  if (o.h) {
    let s = o.x ? `โจมตี ${o.x} ครั้ง ครั้งละ ${P(o.h)}%` : `โจมตี ${P(o.h)}%`;
    const mods = [];
    if (o.td) mods.push('ไม่สนเกราะ');
    if (o.pi) mods.push(`เจาะเกราะ ${o.pi}%`);
    if (o.cr) mods.push(`คริ +${o.cr}%`);
    if (o.df) mods.push('แรงตามพลังป้องกัน');
    if (o.mp) mods.push('แรงตาม MP สูงสุด');
    if (o.rg) mods.push('ยิ่ง HP น้อยยิ่งแรง');
    if (o.ex) mods.push('ศัตรู HP ต่ำกว่า 35% แรง ×2');
    if (o.rn) mods.push('ดาเมจสุ่ม ×0.5–3.5');
    d.push(mods.length ? `${s} (${mods.join(', ')})` : s);
  }
  if (o.pb) d.push('ระเบิดพิษที่ค้างอยู่ทันที ×1.5');
  if (o.ps) d.push(`พิษ ${o.ps} เทิร์น`);
  if (o.sl) d.push('ศัตรูโจมตีเบาลง 30%');
  if (o.st) d.push(`โอกาส ${o.st}% ทำให้มึน`);
  if (o.dr) d.push(`ดูดเลือด ${o.dr}%`);
  if (o.gd) d.push('ขโมยทอง');
  if (o.pt) d.push('สั่งพวกอสูรโจมตีเพิ่ม 2 ครั้ง');
  if (o.he) d.push(`ฟื้น HP ${Math.round(o.he * hp)}%`);
  if (o.re) d.push('ฟื้นฟู HP ทุกเทิร์น');
  if (o.mg) d.push(`ฟื้น MP ${o.mg}%`);
  if (o.iw) d.push('ป้องกัน +60%');
  if (o.ms) d.push('รับดาเมจ -50%');
  if (o.dv) d.push('รับดาเมจ -70%');
  if (o.ev) d.push('หลบการโจมตีครั้งถัดไป');
  if (o.au) d.push('ATK +50%');
  if (o.fo) d.push('สมาธิ (ATK +30%, คริ +40%)');
  if (o.bs) d.push('คลั่ง (ATK ×2 แต่ป้องกันลด)');
  if (o.hc) d.push(`แลกด้วย HP ${o.hc}%`);
  return d;
}

function hmSkillDef(name) {
  const m = hmMon(name); if (!m) return null;
  const E = HM_ELEM[m.el];
  const [word, code] = HM_SKILLS[name] || [E.atk, m.boss ? 'h2 td' : 'h1.5'];
  const o = hmParse(code);
  const lv = (S.hunter.skills[name] || {}).lv || 1;
  const pow = (1 + 0.1 * (lv - 1)) * (hmJob() === 'flame' && m.el === 'volcano' ? 1.6 : 1) * (hmJob() === 'devour' ? 1.25 : 1);
  const mul = m.boss ? HM_BOSS_MUL : 1;
  const d = hmDesc(o, (x) => Math.round(x * pow * mul * 100), pow);
  const type = m.boss ? 'boss' : o.h ? 'atk' : o.he || o.re ? 'heal' : o.iw || o.ms || o.dv || o.ev ? 'guard' : 'buff';
  return { id: name, mon: name, icon: m.i, el: m.el, elIcon: E.i, type, lv, pow, mul, o, word, name: `${word} (${name})`, desc: d.join(' · ') };
}
/* MP ตามความแรงของสกิล (% ของ MP สูงสุด) */
function hmCost(sk, st) {
  const o = sk.o, hitVal = (o.h || 0) * (o.x || 1);
  const extras = ['td', 'pi', 'cr', 'df', 'mp', 'rg', 'ex', 'rn', 'pb', 'ps', 'sl', 'st', 'dr', 'gd', 'pt', 'he', 're', 'mg', 'iw', 'ms', 'dv', 'ev', 'au', 'fo', 'bs'].filter((k) => o[k]).length;
  const pct = Math.min(0.3, Math.max(0.08, 0.05 + 0.04 * hitVal + 0.025 * extras)) * (sk.type === 'boss' ? 1.2 : 1) * (o.mg ? 0.8 : 1);
  return Math.max(5, Math.round((st || stats()).mp * pct * (hmJob() === 'devour' ? 0.75 : 1)));
}

/* ใช้สกิลอสูรในการต่อสู้ — คืน false ถ้าใช้ไม่ได้ (ไม่เสียเทิร์น) */
function hmUseSkill(id, st, e) {
  const H = S.hunter;
  if (!H.load.includes(id) || !H.skills[id]) return false;
  const sk = hmSkillDef(id); if (!sk) return false;
  const cost = hmCost(sk, st);
  if (S.mp < cost) return false;
  S.mp -= cost;
  hmCast(sk, st, e, null);
  track('skills');
  return true;
}

/* ทำผลของสกิล — ally = { n, atk, hp } เมื่อพวกอสูรเป็นคนใช้ (ใช้พลังโจมตีของพวก ไม่เสียอะไร) */
function hmCast(sk, st, e, ally) {
  const o = sk.o, extra = [], DUR = 4;
  const heal = (amt) => { amt = Math.max(0, Math.min(Math.round(amt), st.hp - S.hp)); S.hp += amt; return amt; };
  let hits = [];
  if (o.hc && !ally) { const c = Math.max(0, Math.min(Math.round(st.hp * o.hc / 100), S.hp - 1)); S.hp -= c; if (c) extra.push(`เสีย HP ${fmt(c)}`); }
  if (o.h) {
    let mult = o.h * sk.mul;
    if (o.rg) mult *= 1 + 1.5 * (1 - S.hp / st.hp);
    if (o.ex && e.hp < e.maxHp * 0.35) { mult *= 2; extra.push('ปลิดชีพ ×2'); }
    if (o.rn) { const r = 0.5 + Math.random() * 3; mult *= r; extra.push(`สุ่มได้ ×${r.toFixed(1)}`); }
    const opt = { ignoreDef: !!o.td, pierce: o.pi ? o.pi / 100 : undefined, bonusCrit: o.cr || 0 };
    if (o.df) opt.atk = st.atk * 0.4 + st.def * 1.6;
    if (o.mp) opt.atk = st.atk * 0.5 + st.mp * 0.35;
    if (ally) opt.atk = ally.atk; else B.skillMul = sk.pow;
    B.curSkill = null;
    hits = multiHit(o.x || 1, mult, opt);
    B.skillMul = 1;
  }
  const dmg = hits.reduce((a, h) => a + h.dmg, 0);
  if (o.pb && B.poison > 0 && e.hp > 0) {
    const pd = Math.round(B.poisonDmg * B.poison * 1.5); e.hp = Math.max(0, e.hp - pd); B.poison = 0;
    extra.push(`ระเบิดพิษ ${fmt(pd)}`); ev({ a: 'num', t: 'foe', text: `-${fmt(pd)}`, cls: 'poison' });
  }
  if (o.ps && e.hp > 0) {
    const pl = hmJob() === 'plague';
    B.poison = o.ps + (pl ? 2 : 0); B.poisonDmg = Math.round(((ally ? ally.atk : st.atk) * 0.6 + e.maxHp * 0.03) * (ally ? 1 : sk.pow) * (pl ? 2 : 1)); extra.push('ศัตรูติดพิษ');
  }
  if (o.sl && e.hp > 0) { B.slow = 2; extra.push('ศัตรูช้าลง'); }
  if (o.dr && dmg) { const a = heal(dmg * o.dr / 100); if (a) extra.push(`ดูดเลือด ${fmt(a)}`); }
  if (o.gd) { const g = Math.max(1, Math.round((e.gold || 10) * 0.5 * (ally ? 0.6 : sk.pow))); S.gold += g; extra.push(`ขโมยทอง 💰${fmt(g)}`); }
  if (o.he) { const a = heal(st.hp * o.he / 100 * (ally ? ally.hp : sk.pow)); if (a) extra.push(`ฟื้น HP ${fmt(a)}`); }
  if (o.mg) { const g = Math.min(Math.round(st.mp * o.mg / 100), st.mp - S.mp); if (g > 0) { S.mp += g; extra.push(`ฟื้น MP ${fmt(g)}`); } }
  if (o.re) B.regen = DUR;
  if (o.iw) B.ironwall = DUR;
  if (o.ms) B.manaShield = DUR;
  if (o.dv) B.divine = 3;
  if (o.ev) B.evade = true;
  if (o.au) B.atkUp = DUR;
  if (o.fo) B.focus = DUR;
  if (o.bs) B.berserk = DUR;
  const buffs = [o.re && 'ฟื้นฟู', o.iw && 'DEF↑', o.ms && 'บาเรีย', o.dv && 'โล่เทพ', o.ev && 'หลบ', o.au && 'ATK↑', o.fo && 'สมาธิ', o.bs && 'คลั่ง'].filter(Boolean);
  if (buffs.length) extra.push(buffs.join(' '));
  const who = ally ? { icon: '🐾', name: `${ally.n} ใช้ ${sk.word}` } : sk;
  if (hits.length) hitLog(who, hits, extra.length ? ` · ${extra.join(' · ')}` : '');
  else log(`${who.icon} ${who.name}! ${extra.join(' · ')}`);
  // แอนิเมชัน: เลือกตามธาตุ/ผลของสกิล
  if (ally) ev(hits.length ? { a: 'pet', kind: sk.el === 'volcano' ? 'fire' : o.ps || o.pb ? 'poison' : o.st ? 'thunder' : 'hit', hits } : { a: 'pet', kind: o.mg && !o.he ? 'mana' : 'heal', text: buffs[0] || 'HP↑' });
  else if (hits.length) {
    const kind = o.st && (sk.el === 'sky' || sk.el === 'sea') ? 'bolt' : sk.el === 'volcano' ? 'fire' : o.ps || o.pb ? 'poison' : o.sl ? 'ice' : o.td || o.mp ? 'dark' : null;
    if (kind === 'bolt') ev({ a: 'bolt', hits });
    else if (kind) ev({ a: 'proj', kind, big: o.h * (o.x || 1) >= 1.8, hits });
    else ev({ a: 'melee', hits, big: o.h >= 1.6, spin: (o.x || 1) >= 3, quake: !!o.df });
  } else {
    ev({ a: 'aura', kind: o.he || o.re ? 'heal' : o.iw || o.ms || o.dv ? 'shield' : o.ev ? 'wind' : 'buff', text: buffs[0] || 'HP↑' });
  }
  if (o.st && e.hp > 0 && Math.random() < (o.st + (hmJob() === 'storm' ? 20 : 0)) / 100) tryStun('มึนงง');
  if (o.pt && e.hp > 0) { if (ally) { const r = hitEnemy(1, { atk: ally.atk }); ev({ a: 'pet', kind: 'hit', hits: [r] }); } else if (curPet()) { petAct(st); if (e.hp > 0) petAct(st); } }
}

function hmBattleButtons() {
  const H = S.hunter;
  const list = H.load.filter((id) => H.skills[id]);
  if (!list.length) return Object.keys(H.skills).length ? '' : '<div class="hm-hint">👹 ยังไม่มีสกิลอสูร — ปราบมอนแล้วรอวิญญาณหลุดออกมา</div>';
  const st = stats();
  return `<div class="skill-bar hm-bar" style="grid-template-columns:repeat(${Math.max(list.length, hmSlots())},1fr)">${list.map((id) => {
    const sk = hmSkillDef(id), c = hmCost(sk, st), no = S.mp < c;
    return `<button class="skill-btn hm-sk ${no ? 'nomp' : ''}" data-a="mskill" data-v="${esc(id)}" ${no || busy ? 'disabled' : ''} title="${esc(sk.name)}: ${sk.desc}">
      ${sk.lv > 1 ? `<span class="sk-lv ${sk.lv >= HM_SKILL_MAX ? 'max' : ''}">Lv.${sk.lv}</span>` : ''}
      <span class="sk-ico">${sk.icon}</span><span class="sk-nm">${sk.word}</span><span class="sk-mp">${c} MP</span></button>`;
  }).join('')}</div>`;
}

/* ---------------- พวกอสูร (ใช้ระบบสัตว์เลี้ยงเดิม: id = 'm:<ชื่อมอน>') ----------------
   ทุกเทิร์นโจมตีด้วยพลังของพวก และทุก 3 เทิร์นใช้สกิลประจำตัวของมอนตัวนั้น (ไม่ซ้ำกันทุกตัว) */
const HM_ALLY_EVERY = 3;
const hmAllyFactor = (name, lv) => (0.4 + 0.04 * lv) * ((hmMon(name) || {}).boss ? 1.4 : 1) * hmAllyMul();
function hmAllyDef(name) {
  const m = hmMon(name); if (!m) return null;
  const sig = HM_SKILLS[name] || [HM_ELEM[m.el].atk, 'h1.5'];
  return { id: `m:${name}`, ally: true, n: `${m.boss ? '👑' : ''}${name}`, art: name, kind: 'ally', el: m.el, sig: sig[0],
    pow: (lv) => Math.round(hmAllyFactor(name, lv) * 100),
    desc: (p) => `โจมตี ${Math.round(p)}% ทุกเทิร์น · ทุก ${HM_ALLY_EVERY} เทิร์นใช้ "${sig[0]}": ${hmDesc(hmParse(sig[1]), (x) => Math.round(x * (m.boss ? HM_BOSS_MUL : 1) * p), p / 100).join(' · ')}` };
}
/* เรียกจาก petAct เมื่อพวกที่พาไปเป็นอสูร */
function hmAllyAct(st, pet) {
  const name = pet.id.slice(2), d = petDef(pet.id), e = B.e;
  const f = hmAllyFactor(name, pet.lv);
  B.hmAt = (B.hmAt || 0) + 1;
  if (B.hmAt % HM_ALLY_EVERY === 2) {
    const sk = hmSkillDef(name);
    hmCast(sk, st, e, { n: d.n, atk: st.atk * f, hp: f });
    return;
  }
  const r = hitEnemy(1, { atk: st.atk * f });
  log(`🐾 ${d.n} โจมตี ${fmt(r.dmg)} ดาเมจ${r.crit ? ' คริ!' : ''}`);
  ev({ a: 'pet', kind: 'hit', hits: [r] });
}
/* ลงทะเบียนพวกอสูรของเซฟนี้เข้า PETS (เรียกทุกครั้งก่อน render) */
let hmSig = null;
function hmSync() {
  const ids = hm() ? S.pets.filter((p) => p.id.startsWith('m:')).map((p) => p.id) : [];
  const sig = ids.join('|');
  if (sig === hmSig) return;
  hmSig = sig;
  for (let i = PETS.length - 1; i >= 0; i--) if (PETS[i].ally) PETS.splice(i, 1);
  for (const id of ids) { const d = hmAllyDef(id.slice(2)); if (d) PETS.push(d); }
}

/* ---------------- หลังชนะ ---------------- */
const hmPending = () => !!(S && S.mode === 'hunter' && B && B.rewards && B.rewards.hunt && !B.rewards.hunt.done);
function hmOnVictory(r) {
  if (!hm() || B.tower || B.wb || B.rush) return;
  const H = S.hunter, z = ZONES[B.zi], zr = hmZoneRank(B.zi);
  const ready = hmCanPromote();
  const first = B.isBoss && P().bossWins[z.id] === 1;
  const pts = B.isBoss ? (first ? 10 + 5 * zr : 3 + zr) : 1 + zr;
  const bounty = hmJob() === 'bounty';
  if (bounty) { const g = Math.round(r.gold * 0.5); S.gold += g; r.gold += g; }
  const gain = Math.round(pts * (bounty ? 1.5 : 1));
  H.pts += gain; r.hmPts = gain;
  for (const q of H.quests) {
    if (q.have >= q.need) continue;
    if ((q.t === 'hunt' && !B.isBoss && q.zi === B.zi) || (q.t === 'boss' && B.isBoss && q.zi === B.zi)) q.have++;
  }
  r.hmReady = !ready && hmCanPromote();
  if (hmMon(B.e.n) && (B.isBoss || Math.random() < HM_OFFER_CHANCE)) r.hunt = { n: B.e.n, done: false };
}

function hmResultHTML(r) {
  let h = '';
  if (r.hmPts) h += `<div class="hm-pts">🏛️ แต้มกิลด์ +${r.hmPts}${r.hmReady ? ' <b class="up">· พร้อมเลื่อนแรงค์แล้ว!</b>' : ''}</div>`;
  const o = r.hunt;
  if (!o) return h;
  if (o.done) return `${h}<div class="hm-offer done">${o.msg}</div>`;
  const sk = hmSkillDef(o.n), have = S.hunter.skills[o.n], pet = S.pets.find((p) => p.id === `m:${o.n}`), ad = hmAllyDef(o.n);
  return `${h}<div class="hm-offer">
    <div class="hm-offer-top"><span class="hm-offer-art">${monsterSVG(o.n, 60)}</span>
      <div><b>วิญญาณของ${esc(o.n)}หลุดออกมา!</b><div class="muted">เลือกได้ 1 อย่าง</div></div></div>
    <div class="hm-offer-btns">
      <button class="primary" data-a="hmabsorb">🌀 ดูดสกิล<span class="subtle">${sk.icon} ${sk.word}${have ? ` Lv.${have.lv}→${Math.min(HM_SKILL_MAX, have.lv + 1)}` : ' (ใหม่)'}<br>${sk.desc}</span></button>
      <button data-a="hmtame">🐾 รับเป็นพวก<span class="subtle">${pet ? `มีแล้ว Lv.${pet.lv} → ได้ EXP` : '(ใหม่)'}<br>${ad.desc(Math.round(ad.pow((pet || { lv: 1 }).lv) * 10) / 10)}</span></button>
    </div>
    <button class="ghost small hm-release" data-a="hmrelease">ปล่อยไป</button>
  </div>`;
}

function hmAbsorb(n) {
  const H = S.hunter, cur = H.skills[n];
  H.absorbed++;
  hmQuestTick('absorb');
  if (cur) {
    if (cur.lv >= HM_SKILL_MAX) { S.gold += 200 + S.lv * 20; return `🌀 สกิลนี้เลเวลสูงสุดแล้ว แปลงเป็นทอง 💰 ${fmt(200 + S.lv * 20)}`; }
    cur.lv++;
    return `🌀 ${hmSkillDef(n).icon} ${hmSkillDef(n).word} เลเวลอัพเป็น Lv.${cur.lv}!`;
  }
  H.skills[n] = { lv: 1 };
  const sk = hmSkillDef(n);
  if (H.load.length < hmSlots()) { H.load.push(n); return `🌀 ได้สกิลอสูร ${sk.icon} ${sk.word} ใส่ช่องให้แล้ว`; }
  return `🌀 ได้สกิลอสูร ${sk.icon} ${sk.word} (ช่องเต็ม ไปจัดที่กิลด์)`;
}
function hmTame(n) {
  const id = `m:${n}`, H = S.hunter;
  H.tamed++;
  hmQuestTick('tame');
  const have = S.pets.find((p) => p.id === id);
  if (have) {
    if (have.lv >= PET_MAX_LV) { S.gold += 200 + S.lv * 20; return `🐾 ${n} เลเวลสูงสุดแล้ว แปลงเป็นทอง 💰 ${fmt(200 + S.lv * 20)}`; }
    have.exp += 15; const old = have.lv;
    while (have.lv < PET_MAX_LV && have.exp >= petExpNeed(have.lv)) { have.exp -= petExpNeed(have.lv); have.lv++; }
    return have.lv > old ? `🐾 ${n} แข็งแกร่งขึ้น! Lv.${have.lv}` : `🐾 ${n} ได้ EXP +15`;
  }
  S.pets.push({ id, lv: 1, exp: 0 });
  hmSync();
  if (!curPet()) { S.pet = id; return `🐾 ${n} กลายเป็นพวกของคุณ และติดตามไปต่อสู้แล้ว!`; }
  return `🐾 ${n} กลายเป็นพวกของคุณ! (เปลี่ยนตัวที่พาไปได้ที่กิลด์)`;
}

/* ---------------- ภารกิจกิลด์ (บอร์ด 3 ใบ) ---------------- */
function hmNewQuest() {
  const open = ZONES.map((z, i) => i).filter((i) => zoneUnlocked(i));
  const zi = pick(open.length ? open.slice(-3) : [0]);
  const zr = hmZoneRank(zi), R = S.hunter.rank;
  const g = monsterBase(zoneLevel(zi)).gold;
  const t = pick(['hunt', 'hunt', 'hunt', 'boss', 'absorb', 'tame']);
  if (t === 'hunt') { const need = pick([5, 8, 10]); return { t, zi, need, have: 0, pts: 4 + need + 3 * zr, gold: Math.round(g * need * 2) }; }
  if (t === 'boss') return { t, zi, need: 1, have: 0, pts: 12 + 4 * zr, gold: Math.round(g * 15) };
  return { t, need: 1, have: 0, pts: 8 + 3 * R, gold: Math.round(g * 8) };
}
function hmQuestName(q) {
  const z = q.zi != null ? ZONES[q.zi] : null;
  return { hunt: `ล่ามอนสเตอร์ใน${z && z.name} ${q.need} ตัว`, boss: `ปราบบอส ${z && bossOf(z)[0]}`, absorb: 'ดูดสกิลจากวิญญาณอสูร 1 ครั้ง', tame: 'รับอสูรเป็นพวก 1 ครั้ง' }[q.t];
}
function hmQuestTick(t) { for (const q of S.hunter.quests) if (q.t === t && q.have < q.need) q.have++; }
function hmEnsureQuests() { while (S.hunter.quests.length < 3) S.hunter.quests.push(hmNewQuest()); }
const hmQuestsDone = () => S.hunter.quests.filter((q) => q.have >= q.need).length;

/* ---------------- หน้ากิลด์ ---------------- */
function hmTownButton() {
  const R = HM_RANKS[S.hunter.rank], n = hmNext();
  hmEnsureQuests();
  const alert = hmCanPromote() || hmQuestsDone();
  return `<button class="wide hm-guild-btn ${alert ? 'glow-btn' : ''}" data-a="go" data-v="guild">
    <span class="hm-rank sm" style="--rk:${R.color}">${R.r}</span>
    <span><b>กิลด์นักล่า</b>${hmQuestsDone() ? ` <span class="badge">${hmQuestsDone()}</span>` : ''}
    <span class="subtle">${hmCanPromote() ? '⬆️ พร้อมเลื่อนแรงค์!' : n ? `แต้ม ${fmt(S.hunter.pts)}/${fmt(n.pts)} สู่แรงค์ ${n.r}` : 'แรงค์สูงสุดแล้ว'}</span></span></button>`;
}

function hmRenderGuild() {
  hmEnsureQuests();
  const H = S.hunter;
  const tabs = [['rank', '🏛️ แรงค์'], ['skills', '🌀 สกิลอสูร'], ['allies', '🐾 พวกอสูร'], ['jobs', '🔮 อาชีพลับ']];
  let html = `<div class="row between"><h2>🏛️ กิลด์นักล่า</h2><button class="small" data-a="go" data-v="town">← กลับ</button></div>
    <div class="tabs hm-tabs">${tabs.map(([k, n]) => `<button class="${H.tab === k ? 'on' : ''}" data-a="hmtab" data-v="${k}">${n}</button>`).join('')}</div>`;
  if (H.tab === 'skills') html += hmSkillsTab();
  else if (H.tab === 'allies') html += hmAlliesTab();
  else if (H.tab === 'jobs') html += hmJobsTab();
  else html += hmRankTab();
  return html;
}

function hmRankTab() {
  const H = S.hunter, R = HM_RANKS[H.rank], n = hmNext();
  const opens = n ? ZONES.map((z, i) => i).filter((i) => hmZoneRank(i) === H.rank + 1).map((i) => `${ZONES[i].icon} ${ZONES[i].name}`) : [];
  return `<div class="card hm-rank-card">
    <div class="hm-rank" style="--rk:${R.color}">${R.r}</div>
    <div style="flex:1;min-width:0">
      <b style="font-family:Kanit;font-size:18px">แรงค์ ${R.r} · ${R.n}</b>
      <div class="muted">แต้มกิลด์ ${fmt(H.pts)}${n ? ` / ${fmt(n.pts)}` : ''} · ช่องสกิลอสูร ${hmSlots()} ช่อง</div>
      ${n ? `<div style="margin:6px 0">${bar('exp', H.pts, n.pts, '')}</div>
        <div class="muted" style="font-size:13px">แรงค์ ${n.r} เปิด: ${opens.join(', ') || '-'}${n.slots > R.slots ? ` · ช่องสกิล +${n.slots - R.slots}` : ''}</div>
        <button class="${hmCanPromote() ? 'primary glow-btn' : ''}" style="width:100%;margin-top:8px" data-a="hmpromote" ${hmCanPromote() ? '' : 'disabled'}>⬆️ สอบเลื่อนเป็นแรงค์ ${n.r}</button>`
        : '<div class="up" style="margin-top:6px">👑 คุณคือตำนานของกิลด์!</div>'}
    </div></div>
  <h3>📋 บอร์ดภารกิจ</h3>
  ${H.quests.map((q, i) => {
    const done = q.have >= q.need;
    return `<div class="card hm-quest ${done ? 'done' : ''}">
      <div style="flex:1;min-width:0"><b>${hmQuestName(q)}</b>
        <div class="muted" style="font-size:13px">รางวัล 🏛️ ${q.pts} แต้ม · 💰 ${fmt(q.gold)}</div>
        ${bar('exp', q.have, q.need, `${q.have}/${q.need}`)}</div>
      <div class="row" style="flex-direction:column;gap:6px">
        <button class="small ${done ? 'primary' : ''}" data-a="hmclaim" data-v="${i}" ${done ? '' : 'disabled'}>รับรางวัล</button>
        ${done ? '' : `<button class="small ghost" data-a="hmdrop" data-v="${i}">เปลี่ยน</button>`}
      </div></div>`;
  }).join('')}
  <div class="muted" style="font-size:13px">💡 ล่ามอนได้แต้มตามแรงค์ของด่าน · บอสครั้งแรกได้แต้มเยอะ · มอนธรรมดามีโอกาส ${Math.round(HM_OFFER_CHANCE * 100)}% ที่วิญญาณจะหลุดออกมา บอสหลุดทุกครั้ง</div>`;
}

const HM_TYPE = { atk: ['โจมตี', 't-atk'], boss: ['ราชัน', 't-boss'], guard: ['ป้องกัน', 't-guard'], heal: ['ฟื้นฟู', 't-heal'], buff: ['เสริมพลัง', 't-buff'] };

function hmSkillsTab() {
  const H = S.hunter, st = stats(), slots = hmSlots();
  while (H.load.length > slots) H.load.pop();
  const owned = Object.keys(H.skills).map(hmSkillDef).filter(Boolean)
    .sort((a, b) => (H.load.includes(b.id) ? 1 : 0) - (H.load.includes(a.id) ? 1 : 0) || b.lv - a.lv || hmMon(a.id).zi - hmMon(b.id).zi);
  if (!owned.some((x) => x.id === H.selSk)) H.selSk = owned.length ? owned[0].id : null;
  const sel = owned.find((x) => x.id === H.selSk);
  let html = `<div class="skill-bar" style="grid-template-columns:repeat(${slots},1fr)">${Array.from({ length: slots }, (_, i) => {
    const id = H.load[i];
    if (!id) return `<button class="skill-btn empty" disabled><span class="sk-ico">➕</span><span class="sk-nm">ว่าง</span></button>`;
    const sk = hmSkillDef(id);
    return `<button class="skill-btn hm-sk ${H.selSk === id ? 'on' : ''}" data-a="hmselsk" data-v="${esc(id)}"><span class="sk-ico">${sk.icon}</span><span class="sk-nm">${sk.word}</span><span class="sk-mp">Lv.${sk.lv}</span></button>`;
  }).join('')}</div>`;
  if (!owned.length) return html + '<div class="card muted">ยังไม่มีสกิลอสูร ไปล่ามอนแล้วเลือก "ดูดสกิล" เมื่อวิญญาณหลุดออกมา</div>';
  if (sel) {
    const on = H.load.includes(sel.id), [tn, tc] = HM_TYPE[sel.type];
    html += `<div class="card hm-detail ${tc}">
      <span class="hm-sk-art">${monsterSVG(sel.mon, 52, sel.icon)}</span>
      <div style="flex:1;min-width:0"><b>${sel.word}</b> <span class="muted">Lv.${sel.lv}/${HM_SKILL_MAX}</span>
        <div class="muted" style="font-size:12px"><span class="hm-type ${tc}">${tn}</span> ${sel.elIcon} จาก${esc(sel.mon)} · ${hmCost(sel, st)} MP</div>
        <div style="font-size:13px;margin-top:2px">${sel.desc}</div></div>
      <button class="small ${on ? '' : 'primary'}" data-a="${on ? 'hmunload' : 'hmload'}" data-v="${esc(sel.id)}" ${!on && H.load.length >= slots ? 'disabled' : ''}>${on ? 'ถอด' : 'ใส่'}</button>
    </div>`;
  }
  html += `<div class="row between" style="margin:2px 0 6px"><span class="muted" style="font-size:12px">มี ${owned.length} สกิล · แตะช่องเพื่อดู · ✓ = ใส่อยู่</span>
    <span class="muted" style="font-size:12px">ดูดซ้ำ = เลเวลอัพ</span></div>
  <div class="bag-grid hm-grid">${owned.map((sk) => `<button class="bag-cell hm-cell ${HM_TYPE[sk.type][1]} ${sk.id === H.selSk ? 'on' : ''}" data-a="hmselsk" data-v="${esc(sk.id)}">
      <span class="hm-cell-art">${monsterSVG(sk.mon, 38, sk.icon)}</span><span class="bp">Lv.${sk.lv}</span>${H.load.includes(sk.id) ? '<span class="bu">✓</span>' : ''}</button>`).join('')}</div>
  <div class="hm-legend">${Object.values(HM_TYPE).map(([n, c]) => `<span class="hm-type ${c}">${n}</span>`).join('')}</div>`;
  return html;
}

function hmAlliesTab() {
  const H = S.hunter;
  const list = S.pets.filter((p) => p.id.startsWith('m:') && petDef(p.id)).sort((a, b) => (b.id === S.pet) - (a.id === S.pet) || b.lv - a.lv);
  if (!list.length) return '<div class="card muted">ยังไม่มีพวกอสูร ไปล่ามอนแล้วเลือก "รับเป็นพวก" เมื่อวิญญาณหลุดออกมา</div>';
  if (!list.some((p) => p.id === H.selAl)) H.selAl = (curPet() && S.pet.startsWith('m:') ? S.pet : list[0].id);
  const p = list.find((x) => x.id === H.selAl), d = petDef(p.id), on = S.pet === p.id, m = hmMon(p.id.slice(2));
  return `<div class="card hm-detail ${on ? 'on' : ''}">
      <span class="hm-sk-art">${monsterSVG(d.art, 56)}</span>
      <div style="flex:1;min-width:0"><b>${esc(d.n)}</b> <span class="muted">Lv.${p.lv}${p.lv < PET_MAX_LV ? ` · EXP ${p.exp}/${petExpNeed(p.lv)}` : ' (สูงสุด)'}</span>
        <div class="muted" style="font-size:12px">${HM_ELEM[m.el].i} ธาตุ${HM_ELEM[m.el].n}${on ? ' · <span class="up">กำลังติดตาม</span>' : ''}</div>
        <div style="font-size:13px;margin-top:2px">${d.desc(petPow(p))}</div></div>
      <button class="small ${on ? '' : 'primary'}" data-a="pet" data-v="${on ? '' : esc(p.id)}">${on ? 'พักผ่อน' : 'พาไปด้วย'}</button>
    </div>
    <div class="muted" style="font-size:12px;margin:2px 0 6px">มี ${list.length} ตัว · พาไปได้ 1 ตัว · 🐾 = ตัวที่พาไป · ได้ EXP ทุกครั้งที่ชนะ</div>
    <div class="bag-grid hm-grid">${list.map((x) => `<button class="bag-cell hm-cell ${hmMon(x.id.slice(2)).boss ? 't-boss' : ''} ${x.id === H.selAl ? 'on' : ''}" data-a="hmselal" data-v="${esc(x.id)}">
      <span class="hm-cell-art">${monsterSVG(petDef(x.id).art, 38)}</span><span class="bp">Lv.${x.lv}</span>${x.id === S.pet ? '<span class="bu">🐾</span>' : ''}</button>`).join('')}</div>`;
}

function hmJobsTab() {
  const H = S.hunter;
  return `<div class="muted" style="font-size:14px;margin-bottom:8px">อาชีพลับปลดล็อกจากเงื่อนไขลึกลับ ใส่ได้ทีละ 1 อาชีพ (เสริมจากอาชีพหลัก ${className()})</div>
  ${HM_JOBS.map((j) => {
    const got = H.jobs[j.id], on = H.job === j.id;
    if (!got) return `<div class="card hm-job locked"><span class="hm-job-ico">❔</span><div><b>???</b><div class="muted" style="font-size:13px;font-style:italic">"${j.hint}"</div></div></div>`;
    return `<div class="card hm-job ${on ? 'on' : ''}"><span class="hm-job-ico">${j.i}</span>
      <div style="flex:1"><b>${j.n}</b><div style="font-size:13px">${j.bonus}</div></div>
      <button class="small ${on ? '' : 'primary'}" data-a="hmjob" data-v="${on ? '' : j.id}">${on ? 'ถอด' : 'ใช้อาชีพนี้'}</button></div>`;
  }).join('')}`;
}

/* ---------------- กดปุ่ม — คืน true ถ้าต้อง render ---------------- */
function hmClick(a, v) {
  if (!hm()) return false;
  const H = S.hunter;
  switch (a) {
    case 'mskill': playerAct('mskill', v); return false; // playerAct render เองแล้ว
    case 'hmtab': H.tab = v; return true;
    case 'hmselsk': H.selSk = v; return true;
    case 'hmselal': H.selAl = v; return true;
    case 'hmabsorb': case 'hmtame': case 'hmrelease': {
      const o = B && B.rewards && B.rewards.hunt; if (!o || o.done) return true;
      o.done = true;
      o.msg = a === 'hmabsorb' ? hmAbsorb(o.n) : a === 'hmtame' ? hmTame(o.n) : `🕊️ ปล่อยวิญญาณของ${o.n}ไปแล้ว`;
      hmCheckJobs();
      B.hmk = (B.hmk || 0) + 1;
      save(); return true;
    }
    case 'hmpromote': {
      if (!hmCanPromote()) return true;
      H.rank++;
      const R = HM_RANKS[H.rank];
      toast(`🎉 เลื่อนเป็นนักล่าแรงค์ ${R.r} · ${R.n}!`);
      hmCheckJobs(); save(); return true;
    }
    case 'hmclaim': {
      const q = H.quests[+v]; if (!q || q.have < q.need) return true;
      const qp = Math.round(q.pts * (hmJob() === 'bounty' ? 1.5 : 1)); H.pts += qp; H.qdone = (H.qdone || 0) + 1; S.gold += q.gold; H.quests.splice(+v, 1); hmEnsureQuests(); save();
      hmCheckJobs(); toast(`📋 ภารกิจสำเร็จ! 🏛️ +${qp} แต้ม · 💰 +${fmt(q.gold)}`); return true;
    }
    case 'hmdrop': H.quests.splice(+v, 1); hmEnsureQuests(); save(); return true;
    case 'hmload': if (H.skills[v] && !H.load.includes(v) && H.load.length < hmSlots()) { H.load.push(v); save(); } return true;
    case 'hmunload': H.load = H.load.filter((x) => x !== v); save(); return true;
    case 'hmjob': H.job = v && H.jobs[v] ? v : null; { const st = stats(); S.hp = Math.min(S.hp, st.hp); S.mp = Math.min(S.mp, st.mp); } save();
      toast(v ? `🔮 ใช้อาชีพลับ ${HM_JOBS.find((j) => j.id === v).n}` : 'ถอดอาชีพลับแล้ว'); return true;
  }
  return false;
}
