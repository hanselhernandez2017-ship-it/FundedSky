// Editable site content (courses, help articles, news calendar, rewards, competitions) stored in kv.
const db = require('./db');
const { bad, clean } = require('./util');
// Website Pages and Release Notes start empty: they are written in the Content board
const seed = Object.assign({ pages: {}, notes: [] }, require('./content-seed.json'));
const SHAPE = { pages: (v) => v && typeof v === 'object' && !Array.isArray(v), notes: Array.isArray, lessons: (v) => !!v && typeof v === 'object' && !Array.isArray(v),
  // competitions are checked in full by comps.save; the prize table is rows of [place, prize]
  competitions: (v) => Array.isArray(v) && v.every((c) => c && typeof c === 'object' && !Array.isArray(c) && c.id && c.n),
  cprizes: (v) => Array.isArray(v) && v.length <= 50 && v.every((r) => Array.isArray(r) && r.length === 2 && r.every((x) => typeof x === 'string' && x.trim())) };
// A lesson is { t: title, x: text }. Older saves hold only the title as a string.
const lessonOf = (v, i) => { const o = v && typeof v === 'object' ? v : { t: v }; return { t: clean(o.t, 120) || 'Lesson ' + (i + 1), x: clean(o.x, 6000) }; };
// What traders can open: published courses with at least one lesson. Each comes with exactly c.l lessons.
const liveCourses = (C) => (C.courses || []).filter((c) => c && c.status !== 'Draft' && c.l > 0).map((c) => ({ ...c, lessons: Array.from({ length: c.l }, (_, i) => lessonOf((((C.lessons || {})[c.id]) || [])[i], i)) }));
// Tidy what the Content board saves. A course cannot be published without lessons.
const NORM = {
  courses: (v, prev) => { const ids = new Set(); return v.map((c) => {
    if (!c || typeof c !== 'object') bad('This content is not in the right shape', 400);
    const id = clean(c.id, 40); if (!/^[A-Za-z0-9_-]+$/.test(id) || ids.has(id)) bad('Every course needs its own ID'); ids.add(id);
    const n = clean(c.n, 80); if (!n) bad('Every course needs a name');
    const l = Math.max(0, Math.min(60, parseInt(c.l, 10) || 0)); let status = c.status === 'Draft' ? 'Draft' : 'Published';
    // A course that was already live with no lessons (an old save) is taken down instead of blocking every other change
    if (status === 'Published' && !l) { const p = (prev || []).find((x) => x && x.id === id); if (p && p.status !== 'Draft' && !(p.l > 0)) status = 'Draft'; else bad(`Add at least one lesson before you publish ${n}`); }
    return { ...c, id, n, d: clean(c.d, 200), tag: clean(c.tag, 30) || 'Skills', l, min: Math.max(1, Math.min(600, parseInt(c.min, 10) || 10)), hue: Math.abs(parseInt(c.hue, 10) || 0) % 6, status };
  }); },
  lessons: (v) => Object.fromEntries(Object.entries(v).filter(([k, a]) => Array.isArray(a) && /^[A-Za-z0-9_-]{1,40}$/.test(k)).map(([k, a]) => [k, a.slice(0, 60).map(lessonOf)]))
};
// Rewards: what a reward does is stored on the reward itself (type and value), so the catalog can be edited without code changes.
const RW_TYPES = { discount: 'Discount on an Evaluation', free_reset: 'Free Reset', free_eval: 'Free Evaluation Account', split: 'Payout Split Boost', merch: 'Merchandise' };
const RW_LEGACY = { r1: ['discount', 10], r2: ['free_reset', 0], r3: ['discount', 25], r4: ['free_eval', 25000], r5: ['split', 95], r6: ['merch', 0] };
// One reward in its full shape, or null when it has no usable effect (unknown type, bad cost or value)
function rewardDef(r) {
  if (!r || typeof r !== 'object') return null; const lg = RW_LEGACY[r.id];
  const type = r.type || (lg && lg[0]); if (!RW_TYPES[type]) return null;
  const value = r.type ? Number(r.value) || 0 : lg[1]; const pts = Number(r.pts);
  if (!Number.isInteger(pts) || pts <= 0 || pts > 10000000) return null;
  if (type === 'discount' && !(Number.isInteger(value) && value >= 1 && value <= 100)) return null;
  if (type === 'free_eval' && !(Number.isInteger(value) && value >= 1000)) return null;
  if (type === 'split' && !(Number.isInteger(value) && value >= 50 && value <= 100)) return null;
  const o = { id: String(r.id), n: String(r.n || '').trim(), d: String(r.d || '').trim(), pts, type, value: ['discount', 'free_eval', 'split'].includes(type) ? value : 0 };
  if (type === 'discount' && r.resets) o.resets = true; if (r.tag) o.tag = String(r.tag).slice(0, 20);
  return o;
}
async function checkRewards(list) {
  if (!Array.isArray(list)) bad('This content is not in the right shape', 400); if (list.length > 40) bad('A catalog can hold up to 40 rewards');
  const cat = await require('./core').catalog(); const sizes = [...new Set([].concat(...cat.plans.filter((p) => p.active).map((p) => p.sizes.map((s) => Number(s.size)))))]; const seen = new Set();
  return list.map((r, i) => {
    const nm = String((r && r.n) || '').trim(); const at = nm ? `"${nm}"` : 'Reward ' + (i + 1);
    if (!r || typeof r !== 'object' || !/^[a-z0-9_-]{1,24}$/i.test(String(r.id || ''))) bad(`${at}: the reward ID is missing or not valid`); if (seen.has(String(r.id))) bad(`${at}: two rewards share the same ID`); seen.add(String(r.id));
    if (!nm || nm.length > 60) bad(`${at}: add a name of up to 60 characters`); if (String(r.d || '').length > 160) bad(`${at}: keep the description under 160 characters`);
    if (!Number.isInteger(r.pts) || r.pts <= 0 || r.pts > 10000000) bad(`${at}: the cost must be a whole number of credits above zero`);
    const type = r.type || (RW_LEGACY[r.id] || [])[0]; if (!RW_TYPES[type]) bad(`${at}: pick what the reward gives (discount, free reset, free account, split boost or merchandise)`);
    const v = r.type ? r.value : RW_LEGACY[r.id][1];
    if (type === 'discount' && !(Number.isInteger(v) && v >= 1 && v <= 100)) bad(`${at}: the discount must be a whole number from 1 to 100 percent`);
    if (type === 'free_eval' && !sizes.includes(v)) bad(`${at}: pick an account size that is on sale (${sizes.sort((a, b) => a - b).map((z) => '$' + z / 1000 + 'K').join(', ')})`);
    if (type === 'split' && !(Number.isInteger(v) && v >= 50 && v <= 100)) bad(`${at}: the payout split must be a whole number from 50 to 100 percent`);
    return rewardDef(Object.assign({}, r, { type, value: v }));
  });
}
const checkEarn = (list) => { if (!Array.isArray(list) || list.length > 20 || !list.every((e) => Array.isArray(e) && e.length === 2 && e.every((x) => typeof x === 'string' && x.trim() && x.length <= 80))) bad('Ways to earn must be a list of an action and what it earns', 400); return list; };
let cache = null, at = 0;
async function all() {
  if (cache && Date.now() - at < 20000) return cache;
  const rows = await db.all("SELECT k, v FROM kv WHERE k LIKE 'content.%'");
  const o = { ...seed }; rows.forEach((r) => { o[r.k.slice(8)] = r.v; });
  cache = o; at = Date.now(); return o;
}
async function set(key, value) {
  if (!(key in seed)) bad('Unknown content', 400);
  if (key === 'rewards') value = await checkRewards(value); if (key === 'earn') value = checkEarn(value);
  if (key === 'rewards') value = await checkRewards(value); if (key === 'earn') value = checkEarn(value);
  if ((SHAPE[key] || ((v) => Array.isArray(seed[key]) ? Array.isArray(v) : v != null))(value) !== true) bad('This content is not in the right shape', 400);
  if (NORM[key]) { cache = null; value = NORM[key](value, (await all())[key]); }
  await db.q('INSERT INTO kv(k,v,updated_at) VALUES($1,$2,now()) ON CONFLICT (k) DO UPDATE SET v=$2, updated_at=now()', ['content.' + key, JSON.stringify(value)]);
  cache = null;
}
// One-time tidy on start: lesson text for the built-in courses was added later. A stored copy of the lessons (saved from the
// Content board before that) gets the new text only where staff left the built-in version alone: a course that still has its
// built-in name and no lesson list, or a lesson whose title is still the built-in title. Anything staff wrote stays as it is.
async function migrateLessons() {
  const row = await db.one("SELECT v FROM kv WHERE k='content.lessons'"); if (!row || !row.v || typeof row.v !== 'object') return;
  const cr = await db.one("SELECT v FROM kv WHERE k='content.courses'"); const courses = cr && Array.isArray(cr.v) ? cr.v : seed.courses;
  const L = { ...row.v }; let changed = false;
  for (const [id, sl] of Object.entries(seed.lessons)) {
    const c = courses.find((x) => x && x.id === id); const sc = seed.courses.find((x) => x.id === id); if (!c || !sc) continue;
    const cur = L[id];
    if (cur == null) { if (c.n === sc.n && Number(c.l) === sl.length) { L[id] = sl; changed = true; } continue; }
    if (!Array.isArray(cur)) continue;
    const next = cur.map((v, i) => (typeof v === 'string' && sl[i] && v.trim().toLowerCase() === sl[i].t.toLowerCase() ? sl[i] : v));
    if (next.some((v, i) => v !== cur[i])) { L[id] = next; changed = true; }
  }
  if (changed) { await db.q("UPDATE kv SET v=$1, updated_at=now() WHERE k='content.lessons'", [JSON.stringify(L)]); cache = null; }
}
const reset = () => { cache = null; };
// The news calendar is one hand-written week (rows are [day "Tue Nov 24", time, event, impact]). Which week it covers, and whether that
// week is over, so traders are never shown last week's events as this week's and staff are prompted to publish the next one.
function newsWeek(list, now = new Date()) {
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' })); const y = et.getFullYear();
  const ds = (list || []).map((n) => { const m = /([A-Za-z]{3,})\s+(\d{1,2})\s*$/.exec(String((n && n[0]) || '')); if (!m) return null; const c = [y - 1, y, y + 1].map((yr) => new Date(`${m[1]} ${m[2]}, ${yr} 12:00:00`)).filter((d) => !isNaN(d)); return c.sort((a, b) => Math.abs(a - et) - Math.abs(b - et))[0] || null; }).filter(Boolean).sort((a, b) => a - b);
  if (!ds.length) return { week: '', from: '', to: '', stale: true, empty: true };
  const mon = new Date(et.getFullYear(), et.getMonth(), et.getDate() - ((et.getDay() + 6) % 7)); const f = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const m0 = new Date(ds[0].getFullYear(), ds[0].getMonth(), ds[0].getDate() - ((ds[0].getDay() + 6) % 7));
  return { week: f(m0), from: f(ds[0]), to: f(ds[ds.length - 1]), stale: ds[ds.length - 1] < mon, empty: false };
}
// The rewards traders can redeem: only ones with a known type, a cost above zero and a sane value
const rewards = async () => ((await all()).rewards || []).map(rewardDef).filter(Boolean);
module.exports = { all, set, newsWeek, reset, keys: Object.keys(seed), liveCourses, lessonOf, migrateLessons, seed, rewards, rewardDef, RW_TYPES };
