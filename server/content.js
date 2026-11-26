// Editable site content (courses, help articles, news calendar, rewards, competitions) stored in kv.
const db = require('./db');
const { bad } = require('./util');
// Website Pages and Release Notes start empty: they are written in the Content board
const seed = Object.assign({ pages: {}, notes: [] }, require('./content-seed.json'));
const SHAPE = { pages: (v) => v && typeof v === 'object' && !Array.isArray(v), notes: Array.isArray };
let cache = null, at = 0;
async function all() {
  if (cache && Date.now() - at < 20000) return cache;
  const rows = await db.all("SELECT k, v FROM kv WHERE k LIKE 'content.%'");
  const o = { ...seed }; rows.forEach((r) => { o[r.k.slice(8)] = r.v; });
  cache = o; at = Date.now(); return o;
}
async function set(key, value) {
  if (!(key in seed)) bad('Unknown content', 400);
  if ((SHAPE[key] || ((v) => Array.isArray(seed[key]) ? Array.isArray(v) : v != null))(value) !== true) bad('This content is not in the right shape', 400);
  await db.q('INSERT INTO kv(k,v,updated_at) VALUES($1,$2,now()) ON CONFLICT (k) DO UPDATE SET v=$2, updated_at=now()', ['content.' + key, JSON.stringify(value)]);
  cache = null;
}
module.exports = { all, set, keys: Object.keys(seed) };
