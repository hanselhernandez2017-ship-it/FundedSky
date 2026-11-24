// Editable site content (courses, help articles, news calendar, rewards, competitions) stored in kv.
const db = require('./db');
const seed = require('./content-seed.json');
let cache = null, at = 0;
async function all() {
  if (cache && Date.now() - at < 20000) return cache;
  const rows = await db.all("SELECT k, v FROM kv WHERE k LIKE 'content.%'");
  const o = { ...seed }; rows.forEach((r) => { o[r.k.slice(8)] = r.v; });
  cache = o; at = Date.now(); return o;
}
async function set(key, value) {
  if (!(key in seed)) throw new Error('unknown content key');
  await db.q('INSERT INTO kv(k,v,updated_at) VALUES($1,$2,now()) ON CONFLICT (k) DO UPDATE SET v=$2, updated_at=now()', ['content.' + key, JSON.stringify(value)]);
  cache = null;
}
module.exports = { all, set, keys: Object.keys(seed) };
