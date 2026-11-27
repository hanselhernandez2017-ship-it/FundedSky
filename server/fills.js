// Live values filled into emails and notifications, so copy follows the settings instead of hard-coded numbers:
// whether a platform connection is live, the news window, the inactivity limit and the running sale.
const db = require('./db');
const kv = async (k) => ((await db.one('SELECT v FROM kv WHERE k=$1', [k]).catch(() => null)) || {}).v;
// Trading Platforms > Settings: one "Connection Is Live" switch per platform (store.platforms.settings, key live<Platform>)
async function platLive(platform) { const s = (await kv('store.platforms.settings')) || {}; return !!s['live' + String(platform || '').replace(/\W/g, '')]; }
// The login sentence in the "ready" and "funded" emails and notifications
async function loginVars(platform) {
  const live = await platLive(platform);
  return live ? { login_how: `Log in to ${platform} with the details below.`, login_pre: `Your ${platform} login is inside.`, pw: 'Set on first login', login_note: `Log in to ${platform} and place your first trade.`, platform_live: true }
    : { login_how: 'Your platform login arrives by email when the connection goes live.', login_pre: 'Your platform login arrives by email when the connection goes live.', login: '', pw: '', server: '', login_note: 'Your platform login arrives by email when the connection goes live.', platform_live: false };
}
const dayWord = (n) => `${n} day${n === 1 ? '' : 's'}`;
const fmtDay = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });
// News window on the funded account for this plan and size (the rule only applies once funded)
function newsVars(cat, plan, size, rs) {
  const R = require('./rules'); const r = R.rulesFor(cat, { plan, size, kind: 'funded', payout_count: 0, rs: rs || null }); const w = r.news && r.news.win;
  return w ? { news_t: 'News is restricted once you are funded', news_d: `No new orders ${w} minute${w === 1 ? '' : 's'} before or after high-impact releases.` }
    : { news_t: 'News trading is allowed', news_d: 'Your plan has no news restriction on the funded account.' };
}
// Inactivity emails: the limit from the account's rules, days without a trade so far, days left and the closing date
function idleVars(limit, idle, now = new Date()) {
  const left = Math.max(1, Math.ceil(limit - idle)); const at = new Date(now.getTime() + left * 864e5);
  return { idle_limit: dayWord(limit), idle_for: dayWord(Math.floor(idle)), idle_in: dayWord(left), close_date: fmtDay(at) };
}
// The sale running now (or the next one), for the sale email: name, percent, code, end date and which plans
function salePromo(cat, now = new Date()) {
  const day = now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  const L = (cat.promos || []).filter((p) => p && p.code && p.active !== false && Number(p.pct) > 0 && !(Number(p.total) === 1) && (!p.ends || p.ends >= day));
  return L.find((p) => !p.starts || p.starts <= day) || L.sort((a, b) => String(a.starts).localeCompare(String(b.starts)))[0] || null;
}
function saleVars(cat, p) {
  if (!p) return null;
  const ev = (cat.plans || []).filter((x) => x.active !== false && x.id !== 'instant' && x.kind !== 'funded'); const on = Array.isArray(p.plans) && p.plans.length ? (cat.plans || []).filter((x) => p.plans.includes(x.id) && x.active !== false) : ev;
  const all = ev.every((x) => on.includes(x)) && on.every((x) => ev.includes(x));
  const names = on.map((x) => x.short || String(x.name || x.id).replace(/ Plan$/, '')); const list = names.length > 1 ? names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1] : names[0] || 'every';
  const ends = p.ends ? fmtDay(new Date(p.ends + 'T17:00:00Z')) : '';
  return { sale_name: p.name || p.code, pct: Number(p.pct) + '%', code: String(p.code).toUpperCase(), sale_what: all ? 'every evaluation' : `${list} evaluations`, sale_on: all ? 'every evaluation, every size' : `${list} evaluations, every size`, sale_until: ends ? `, through ${ends}` : '' };
}
// The optional activation-fee step in the "You Passed" email (left out when the plan has no fee)
const passVars = (fee) => ({ fee_step: fee ? 'Pay the activation fee' : '', fee_line: fee ? `A one-time fee of $${Number(fee).toLocaleString('en-US')} on your plan.` : '' });
// Sample values for previews and test sends on the Emails board, from the live settings
async function samples() {
  const core = require('./core'); const R = require('./rules'); const cat = await core.catalog();
  const p0 = (cat.plans || []).find((p) => p.active !== false && p.kind === 'evaluation' && p.id !== 'instant'); if (!p0) return {};
  const z = ((p0.sizes || []).find((x) => x.size === 50000 && x.active !== false) || (p0.sizes || [])[0] || {}).size || 50000;
  const lim = R.rulesFor(cat, { plan: p0.id, size: z, kind: 'evaluation' }).inactivity || 30; const lv = await loginVars('Tradovate');
  return { ready: lv, funded: lv, passed: passVars(core.feesOf(cat, { plan: p0.id, size: z }).activation), firstday: newsVars(cat, p0.id, z), inactive1: idleVars(lim, lim - 7), inactive2: Object.assign({ account: 'FS-50K-10432' }, idleVars(lim, lim - 3)), sale: saleVars(cat, salePromo(cat)) || {} };
}
module.exports = { passVars, samples, platLive, loginVars, newsVars, idleVars, salePromo, saleVars, dayWord };
