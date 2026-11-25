// Support desk rules. The Support board saves its settings in kv 'store.support.settings';
// this module is where the server acts on them: who gets a ticket, urgent keywords,
// out-of-hours replies, ratings, auto-close and the hours shown to traders.
const db = require('./db');

const DEF = {
  email: true, chatDash: true, chatCheckout: true, discord: true, h247: false, wk: ['08:00', '22:00'], we: ['10:00', '18:00'],
  sla: { urgent: [15, 240], high: [60, 480], normal: [240, 1440], low: [480, 2880] }, assign: 'round', maxOpen: '25', autoClose: '3', csat: true,
  afterHours: true, ahText: "Thanks for reaching out. We're offline right now and reply first thing at 8:00 AM ET. Risk alerts and payouts keep running.",
  linkReview: true, escalate: 'chargeback, lawyer, fraud, scam',
  route: { breach: 'Risk', risk: 'Risk', billing: 'Agents', payouts: 'Leads', kyc: 'Agents', platform: 'Agents', rules: 'Agents', account: 'Agents', affiliates: 'Leads' }
};
const kv = async (k) => { const r = await db.one('SELECT v FROM kv WHERE k=$1', [k]); return r ? r.v : null; };
const setKv = (k, v) => db.q('INSERT INTO kv(k,v) VALUES($1,$2) ON CONFLICT (k) DO UPDATE SET v=$2, updated_at=now()', [k, JSON.stringify(v)]);
async function settings() { const s = (await kv('store.support.settings')) || {}; return Object.assign({}, DEF, s, { sla: Object.assign({}, DEF.sla, s.sla || {}), route: Object.assign({}, DEF.route, s.route || {}) }); }

// Same topic keys the board uses
function catKey(c) { c = String(c || '').toLowerCase();
  return /breach/.test(c) ? 'breach' : /payout/.test(c) ? 'payouts' : /bill|refund/.test(c) ? 'billing' : /ident|kyc/.test(c) ? 'kyc' : /platform|login/.test(c) ? 'platform' : /rule/.test(c) ? 'rules' : /affil/.test(c) ? 'affiliates' : /risk/.test(c) ? 'risk' : /account/.test(c) ? 'account' : 'general'; }

// Eastern Time clock
function etNow(d = new Date()) { const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d).map((x) => [x.type, x.value])); return { wd: p.weekday, min: (+p.hour) * 60 + (+p.minute) }; }
const toMin = (s) => { const [h, m] = String(s || '0:0').split(':').map(Number); return (h || 0) * 60 + (m || 0); };
function isOpenNow(s, d) { if (s.h247) return true; const { wd, min } = etNow(d); const w = ['Sat', 'Sun'].includes(wd) ? s.we : s.wk; if (!w || !w[0] || !w[1]) return false; return min >= toMin(w[0]) && min < toMin(w[1]); }
const t12 = (s) => { const m = toMin(s); const h = Math.floor(m / 60), mm = m % 60; return `${h % 12 || 12}${mm ? ':' + String(mm).padStart(2, '0') : ''} ${h < 12 ? 'AM' : 'PM'}`; };
function hoursText(s) { if (s.h247) return 'Open 24/7'; const wk = s.wk && s.wk[0] && s.wk[1] ? `Monday to Friday, ${t12(s.wk[0])} to ${t12(s.wk[1])} ET` : 'Weekdays closed';
  const we = s.we && s.we[0] && s.we[1] && toMin(s.we[1]) > toMin(s.we[0]) ? `Weekends, ${t12(s.we[0])} to ${t12(s.we[1])} ET` : 'Closed on weekends'; return `${wk} · ${we}`; }
const dur = (m) => (m >= 1440 ? `${Math.round(m / 1440)} day${Math.round(m / 1440) === 1 ? '' : 's'}` : m >= 60 ? `${Math.round(m / 60)} hour${Math.round(m / 60) === 1 ? '' : 's'}` : `${m} minutes`);
function replyText(s) { return `We usually reply within ${dur(s.sla.normal[0])}${s.h247 ? ', every day' : ' during support hours'}.`; }

// What traders see on the Support page
async function publicInfo() { const s = await settings(); return { hours: hoursText(s), open: isOpenNow(s), reply: replyText(s), email: s.email !== false, chatDash: s.chatDash !== false, chatCheckout: s.chatCheckout !== false }; }

// Who gets a new ticket
async function pickAssignee(c, s, cat) {
  if (s.assign === 'manual') return null;
  const group = s.route[catKey(cat)] || 'Agents'; const roles = group === 'Leads' ? ['admin'] : group === 'Risk' ? ['risk'] : ['support'];
  let staff = await c.all("SELECT u.id, (SELECT count(*)::int FROM tickets t WHERE t.assignee=u.id AND t.status<>'solved') AS open FROM users u WHERE u.role = ANY($1) AND u.status='active' ORDER BY u.id", [roles]);
  if (!staff.length) staff = await c.all("SELECT u.id, (SELECT count(*)::int FROM tickets t WHERE t.assignee=u.id AND t.status<>'solved') AS open FROM users u WHERE u.role='admin' AND u.status='active' ORDER BY u.id");
  const cap = Number.isFinite(parseInt(s.maxOpen, 10)) ? parseInt(s.maxOpen, 10) : 25; const free = staff.filter((x) => x.open < cap); if (!free.length) return null;
  if (s.assign === 'least') return free.slice().sort((a, b) => a.open - b.open || a.id - b.id)[0].id;
  const rr = (await c.one("SELECT v FROM kv WHERE k='support.rr' FOR UPDATE")) || { v: {} }; const last = (rr.v || {})[group] || 0;
  const next = free.find((x) => x.id > last) || free[0];
  await c.q("INSERT INTO kv(k,v) VALUES('support.rr',$1) ON CONFLICT (k) DO UPDATE SET v=$1, updated_at=now()", [JSON.stringify(Object.assign({}, rr.v || {}, { [group]: next.id }))]);
  return next.id;
}
const words = (s) => String(s.escalate || '').split(',').map((w) => w.trim().toLowerCase()).filter(Boolean);
const mentions = (s, text) => words(s).filter((w) => new RegExp('\\b' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i').test(text));

// Run after a trader opens a ticket or writes on one
async function onTraderMessage(ticketId, text, { isNew } = {}) {
  const s = await settings(); const out = { urgent: false, assignee: null, afterHours: false };
  await db.tx(async (c) => {
    const t = await c.one('SELECT * FROM tickets WHERE id=$1 FOR UPDATE', [ticketId]); if (!t) return;
    const hit = mentions(s, text + ' ' + (isNew ? t.subject : ''));
    if (hit.length && t.priority !== 'urgent') { await c.q("UPDATE tickets SET priority='urgent' WHERE id=$1", [t.id]); out.urgent = true;
      await c.q('INSERT INTO ticket_msgs(ticket_id,author_id,staff,internal,body) VALUES($1,NULL,true,true,$2)', [t.id, `Marked urgent: the trader mentioned ${hit.join(', ')}.${hit.includes('chargeback') ? ' Billing has been told.' : ''}`]); }
    if (hit.includes('chargeback')) require('./integrations').alert('billing', `:warning: Ticket #${t.id} mentions a chargeback: ${t.subject}`);
    if (!t.assignee) { const a = await pickAssignee(c, s, t.category); if (a) { await c.q('UPDATE tickets SET assignee=$2 WHERE id=$1', [t.id, a]); out.assignee = a; } }
    if (isNew && s.linkReview !== false && catKey(t.category) === 'breach') { const br = await c.one("SELECT id FROM accounts WHERE user_id=$1 AND phase='breached' LIMIT 1", [t.user_id]); if (br) await c.q('UPDATE tickets SET review=true WHERE id=$1', [t.id]); }
    if (isNew && s.afterHours !== false && !isOpenNow(s)) { await c.q('INSERT INTO ticket_msgs(ticket_id,author_id,staff,body) VALUES($1,NULL,true,$2)', [t.id, s.ahText || DEF.ahText]); out.afterHours = true; }
  });
  return out;
}

// Ask for a rating when a ticket is solved
async function onSolved(t) { const s = await settings(); if (s.csat === false) return false;
  require('./mail').t('closed', t.user_id, { ticket: t.id, subject: t.subject, url: `${require('./auth').BASE()}/app#support?tkt=${t.id}&rate=1` }); return true; }

// Close tickets waiting on the trader past the setting
async function autoClose() { const s = await settings(); const days = parseInt(s.autoClose, 10) || 3;
  const rows = await db.all(`UPDATE tickets SET status='solved', updated_at=now() WHERE status='pending' AND updated_at < now() - ($1 || ' days')::interval RETURNING *`, [String(days)]);
  for (const t of rows) { await db.q('INSERT INTO ticket_msgs(ticket_id,author_id,staff,internal,body) VALUES($1,NULL,true,true,$2)', [t.id, `Closed automatically after ${days} days without a reply from the trader.`]); await onSolved(t); }
  return rows.length; }

// Help Center reading stats
async function articleStat(title, kind) { if (!['view', 'yes', 'no'].includes(kind)) return; title = String(title || '').slice(0, 200); if (!title) return;
  await db.tx(async (c) => { const r = (await c.one("SELECT v FROM kv WHERE k='store.support.articlestats' FOR UPDATE")) || { v: {} }; const v = r.v || {}; const a = Object.assign({ views: 0, yes: 0, no: 0 }, v[title] || {});
    if (kind === 'view') a.views++; else a[kind]++; a.help = a.yes + a.no ? Math.round(a.yes / (a.yes + a.no) * 100) : null; v[title] = a;
    await c.q("INSERT INTO kv(k,v) VALUES('store.support.articlestats',$1) ON CONFLICT (k) DO UPDATE SET v=$1, updated_at=now()", [JSON.stringify(v)]); }); }

// Refund limit for a staff member from the Team tab
async function refundLimit(user) { const a = (await kv('store.support.agents')) || {}; const x = a[user.id]; if (x && x.limit != null) return +x.limit; return user.role === 'admin' ? 500 : user.role === 'risk' ? 0 : 150; }

module.exports = { settings, publicInfo, onTraderMessage, onSolved, autoClose, articleStat, refundLimit, isOpenNow, hoursText, replyText, catKey, setKv };
