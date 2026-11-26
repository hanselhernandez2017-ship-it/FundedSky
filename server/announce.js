// Announcements from Content: who sees them, when they are live (end dates are whole days in Eastern Time), and Message delivery to the dashboard inbox.
const db = require('./db');
const { clean, bad } = require('./util');
const WHO = ['Everyone', 'Traders With an Account', 'Funded Traders', 'Never Bought'];
const KINDS = ['Banner', 'Message'];
const WHERE = ['Dashboard', 'Website', 'Dashboard and Website'];
const etDay = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const okDay = (s) => DAY.test(s) && !isNaN(new Date(s + 'T12:00:00Z')) && new Date(s + 'T12:00:00Z').toISOString().slice(0, 10) === s;
// Live now: switched on, started, and not past the end of its last day in ET
const isLive = (a, now = new Date()) => !!a && a.live && (!a.starts || new Date(a.starts) <= now) && (!a.ends || (okDay(a.ends) && a.ends >= etDay(now)));
// What the signed-in user (or a visitor, u = null) counts as
async function facts(u) {
  if (!u) return null;
  return db.one("SELECT EXISTS(SELECT 1 FROM accounts WHERE user_id=$1) acct, EXISTS(SELECT 1 FROM accounts WHERE user_id=$1 AND kind='funded' AND phase NOT IN ('breached','closed')) funded, EXISTS(SELECT 1 FROM orders WHERE user_id=$1 AND status IN ('paid','refunded')) bought", [u.id]);
}
const audienceOk = (a, f) => { const w = a.who || 'Everyone'; if (w === 'Everyone') return true; if (w === 'Never Bought') return !f || !f.bought; if (!f) return false; if (w === 'Funded Traders') return f.funded; if (w === 'Traders With an Account') return f.acct; return false; };
const list = async () => ((await db.one("SELECT v FROM kv WHERE k='list.announcements'")) || {}).v || [];
// Banners for public-config, already filtered for this person
async function banners(u) { const f = await facts(u); return (await list()).filter((a) => (a.kind || 'Banner') === 'Banner' && isLive(a) && audienceOk(a, f)).map(({ id, title, body, where, tone, link }) => ({ id, title, body, where, tone, link })); }
// Message announcements go to the dashboard inbox once per trader (on their next dashboard load)
async function deliver(u) {
  const msgs = (await list()).filter((a) => a.kind === 'Message' && a.id && isLive(a) && /dashboard/i.test(a.where || 'Dashboard and Website')); if (!msgs.length) return;
  const got = ((u.settings || {}).annGot) || []; const todo = msgs.filter((a) => !got.includes(a.id)); if (!todo.length) return;
  const f = await facts(u); const send = todo.filter((a) => audienceOk(a, f));
  // Claim each one on the user row first, so two dashboard loads at once cannot deliver it twice. Only what is sent is remembered,
  // so a trader who becomes eligible later still gets it.
  for (const a of send) {
    const won = await db.one("UPDATE users SET settings = jsonb_set(COALESCE(settings,'{}'::jsonb), '{annGot}', COALESCE(settings->'annGot','[]'::jsonb) || to_jsonb($2::text)) WHERE id=$1 AND NOT (COALESCE(settings->'annGot','[]'::jsonb) ? $2) RETURNING id", [u.id, a.id]);
    if (won) await db.q('INSERT INTO notifications(user_id,title,body,go) VALUES($1,$2,$3,$4)', [u.id, clean(a.title, 160), clean(a.body, 600) || clean(a.title, 160), a.link && /^\/app(#|$)/.test(a.link) ? a.link.replace(/^\/app#?/, '') || 'accounts' : 'accounts']);
  }
}
// Check and tidy a list saved from the Content board
// Entries saved unchanged from before (prev) are tidied instead of refused: a bad end date takes them down, a bad link is dropped
function validate(arr, prev = []) {
  if (!Array.isArray(arr)) bad('This list is not in the right shape');
  const old = new Set((prev || []).map((x) => JSON.stringify(x)));
  return arr.map((a, i) => {
    if (!a || typeof a !== 'object') bad('This list is not in the right shape');
    if (old.has(JSON.stringify(a))) { a = Object.assign({}, a); if (a.ends && !okDay(String(a.ends).slice(0, 10))) Object.assign(a, { live: false, ends: null }); if (a.starts && isNaN(new Date(a.starts))) Object.assign(a, { live: false, starts: null }); if (a.link && !/^(https:\/\/[^\s"<>]+|\/(?!\/)[^\s"<>]*)$/.test(a.link)) delete a.link; }
    const t = clean(a.title, 160); if (!t) bad('Every announcement needs a title');
    const o = Object.assign({}, a, { id: clean(a.id, 30) || 'AN-' + (arr.length - i), title: t, body: clean(a.body, 600), who: WHO.includes(a.who) ? a.who : 'Everyone', kind: KINDS.includes(a.kind) ? a.kind : 'Banner', live: !!a.live });
    o.where = WHERE.includes(a.where) ? a.where : a.where === 'dashboard' ? 'Dashboard' : a.where === 'site' ? 'Website' : 'Dashboard and Website';
    if (a.starts != null && a.starts !== '') { if (isNaN(new Date(a.starts))) bad(`"${t}": the start is not a valid date`); o.starts = new Date(a.starts).toISOString(); } else o.starts = null;
    if (a.ends != null && a.ends !== '') { const e = String(a.ends).slice(0, 10); if (!okDay(e)) bad(`"${t}": the end date is not a valid date`); o.ends = e; if (o.starts && o.live && e < etDay(new Date(o.starts))) bad(`"${t}": the end date is before the start`); } else o.ends = null;
    if (a.link != null && a.link !== '') { const l = clean(a.link, 300); if (!/^(https:\/\/[^\s"<>]+|\/[^\s"<>]*)$/.test(l) || /^\/\//.test(l)) bad(`"${t}": the link must start with https:// or /`); o.link = l; } else delete o.link;
    return o;
  });
}
module.exports = { etDay, isLive, banners, deliver, validate, audienceOk };
