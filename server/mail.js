// Outgoing email. Every message is stored in the outbox (back office Emails board).
// Sent through Resend when it is connected in Settings > Integrations (or RESEND_API_KEY).
// Templated emails (t / send with a template key) use the designs from the Emails board, with any edits saved there.
const db = require('./db');
const I = require('./integrations');
const DEFS = require('./emaildefs.json');
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const kv = async (k) => ((await db.one('SELECT v FROM kv WHERE k=$1', [k]).catch(() => null)) || {}).v;
const BRAND0 = { address: '', support: 'support@fundedsky.com', legal: 'All Funded Sky accounts trade in a simulated environment. Nothing in this email is investment advice.' };
const RULES0 = { quiet: true, qFrom: '21:00', qTo: '08:00', capDay: '1', capWeek: '3', pauseMk: false, noMkAfterBreach: true, test: false, testTo: '', failover: true };

async function cfg() {
  const [tpl, state, rules, brand, supp] = await Promise.all(['tpl', 'state', 'rules', 'brand', 'supp'].map((k) => kv('store.emails.' + k)));
  const co = await company();
  // Company Details fill the footer; a value typed in the Emails board's Brand and Footer wins when it differs from the default
  const b1 = Object.assign({}, brand || {}); ['address', 'support', 'legal'].forEach((k) => { if (!b1[k] || !String(b1[k]).trim() || b1[k] === BRAND0[k]) delete b1[k]; });
  return { tpl: tpl || {}, state: state || {}, rules: Object.assign({}, RULES0, rules || {}), brand: Object.assign({}, BRAND0, { name: co.legal || co.brand, address: co.address, support: co.support }, b1), supp: supp || [] };
}
// Settings > Company Details (older saves used supportEmail / legalName)
async function company() {
  const co = (await kv('settings.company')) || {}; const t = (x) => String(x || '').trim();
  return { legal: t(co.legal || co.legalName), brand: t(co.brand) || 'Funded Sky', address: t(co.address), taxId: t(co.taxId), support: t(co.support || co.supportEmail) || BRAND0.support };
}
function tplOf(C, key) {
  const st = C.state || {}; const base = DEFS.E[key] || (st.custom || {})[key]; if (!base) return null;
  const e = Object.assign({ id: key }, base, C.tpl[key] || {});
  const flow = DEFS.FLOWS.find((f) => f.lanes.some((l) => l.includes('E:' + key))) || (st.customFlow || {})[key] && { id: st.customFlow[key] } || {};
  e.flow = flow.id; e.on = e.req || ((st.on || {})[key] !== false && !(st.paused || {})[flow.id]);
  return e;
}
// Email-safe version of the design's .em layout (dark).
function render(e, vars, brand) {
  const f = (t) => String(t == null ? '' : t).replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : ''));
  const fe = (t) => esc(f(t));
  const C = { bg: '#08080A', card: '#0B0B0D', ln: '#26262A', ln2: '#1C1C20', p2: '#111113', tx: '#F4F2F1', t2: '#D4CFCD', mu: '#9C9693', fa: '#6E6A67', sky: '#7CC4FF' };
  const font = "font-family:'Mona Sans',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";
  const rows = (e.r || []).map(([k, v]) => [f(k), f(v)]).filter(([, v]) => v.trim());
  const paras = [].concat(e.b || []).filter(Boolean);
  const pg = e.pg ? (() => { const [l, v, m, cap] = e.pg; const pct = Math.min(100, (+f(v) || 0) / (+f(m) || 1) * 100); return `<div style="border:1px solid ${C.ln};border-radius:10px;background:${C.p2};padding:14px;margin:4px 0 18px"><table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;margin-bottom:10px"><tr><td style="color:${C.mu}">${fe(l)}</td><td align="right" style="font-weight:600;color:${C.tx}">${fe(vars.progress || '')}</td></tr></table><div style="height:8px;border-radius:4px;background:${C.ln};overflow:hidden"><div style="height:8px;width:${pct.toFixed(0)}%;background:${C.sky};border-radius:4px"></div></div><div style="font-size:12px;color:${C.fa};margin-top:8px">${fe(cap)}</div></div>`; })() : '';
  const al = e.al ? `<div style="border:1px solid ${e.al[0] === 'bad' ? 'rgba(242,119,127,.42)' : 'rgba(242,196,109,.4)'};background:${e.al[0] === 'bad' ? 'rgba(242,119,127,.08)' : 'rgba(242,196,109,.08)'};border-radius:10px;padding:12px 14px;font-size:13.5px;line-height:1.55;color:${C.tx};margin:0 0 16px">${fe(e.al[1])}</div>` : '';
  const url = vars.url || '';
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="color-scheme" content="dark"><title>${fe(e.s)}</title></head><body style="margin:0;background:${C.bg};${font}">
<div style="display:none;max-height:0;overflow:hidden">${fe(e.p)}</div>
<div style="background:${C.bg};padding:32px 12px"><div style="max-width:600px;margin:0 auto;background:${C.card};border:1px solid ${C.ln};border-radius:12px;color:${C.tx};overflow:hidden">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:22px 26px 10px"><span style="font-weight:700;font-size:19px;letter-spacing:-.045em;color:${C.tx}">fundedsky</span> <span style="background:${C.sky};color:#08080A;font-weight:600;font-size:13px;padding:2px 6px 3px;border-radius:4px">futures</span></td><td align="right" style="padding:22px 26px 10px;font-size:12.5px;color:${C.mu}">${esc(DEFS.GROUP_LABEL[e.flow] || 'Funded Sky')}</td></tr></table>
<div style="padding:16px 26px 28px">
${e.e ? `<div style="font-size:13px;color:${C.mu};margin-bottom:8px">${fe(e.e)}</div>` : ''}
<h1 style="margin:0 0 16px;font-size:26px;line-height:1.18;letter-spacing:-.025em;font-weight:600;color:${C.tx}">${fe(e.h)}${e.a ? ` <span style="color:${C.sky}">${fe(e.a)}</span>` : ''}</h1>
${al}${paras.map((p) => `<p style="margin:0 0 14px;font-size:14.5px;line-height:1.6;color:${C.t2}">${fe(p).replace(/\n/g, '<br>')}</p>`).join('')}
${e.c ? `<div style="font-family:ui-monospace,Menlo,monospace;font-size:30px;font-weight:600;letter-spacing:.2em;text-align:center;padding:18px 0;border:1px solid ${C.ln};border-radius:10px;background:${C.p2};margin:4px 0 16px;color:${C.tx}">${fe(e.c)}</div>` : ''}
${pg}
${rows.length ? `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.ln};border-radius:10px;margin:4px 0 18px;background:${C.p2};border-collapse:separate">${rows.map(([k, v], i) => `<tr><td style="padding:10px 14px;font-size:13.5px;color:${C.mu};${i < rows.length - 1 ? `border-bottom:1px solid ${C.ln2}` : ''}">${esc(k)}</td><td align="right" style="padding:10px 14px;font-size:13.5px;font-weight:600;color:${C.tx};${i < rows.length - 1 ? `border-bottom:1px solid ${C.ln2}` : ''}">${esc(v)}</td></tr>`).join('')}</table>` : ''}
${e.st ? `<div style="margin:4px 0 18px">${e.st.map(([t, d], i) => `<table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${C.ln2};${i === e.st.length - 1 ? `border-bottom:1px solid ${C.ln2};` : ''}"><tr><td width="38" valign="top" style="padding:14px 0"><div style="width:24px;height:24px;line-height:24px;border-radius:12px;border:1px solid #3A3A40;text-align:center;font-size:12px;font-weight:600;color:${C.tx}">${i + 1}</div></td><td style="padding:14px 0"><div style="font-size:14.5px;font-weight:600;line-height:24px;color:${C.tx}">${fe(t)}</div><div style="margin-top:2px;font-size:13.5px;color:${C.mu};line-height:1.5">${fe(d)}</div></td></tr></table>`).join('')}</div>` : ''}
${e.cta ? `<div style="margin:8px 0 4px"><a href="${esc(url)}" style="display:inline-block;line-height:44px;padding:0 22px;border-radius:999px;background:#fff;color:#111113;font-weight:600;font-size:14.5px;text-decoration:none">${fe(e.cta)}</a></div>` : ''}
${e.n2 ? `<div style="font-size:12.5px;color:${C.fa};line-height:1.5;margin-top:16px">${fe(e.n2)}</div>` : ''}
</div>
<div style="border-top:1px solid ${C.ln2};padding:18px 26px 22px;font-size:11.5px;color:${C.fa};line-height:1.6">
<div style="margin-bottom:6px">${e.mk ? `<a href="${esc(vars.unsub || '')}" style="color:${C.fa}">Unsubscribe</a> · <a href="${esc(vars.prefs || '')}" style="color:${C.fa}">Email Preferences</a>` : "You're getting this because you have a Funded Sky account. It's about your account, so it can't be turned off."}</div>
<div style="margin-bottom:6px">${[brand.name || 'Funded Sky', brand.address, brand.support].filter((x) => x && !/^\[/.test(x)).map(esc).join(' · ')}</div><div>${esc(brand.legal)}</div></div>
</div></div></body></html>`;
}
function text(e, vars) {
  const f = (t) => String(t == null ? '' : t).replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : ''));
  const rows = (e.r || []).map(([k, v]) => [f(k), f(v)]).filter(([, v]) => v.trim());
  return [f(e.h) + (e.a ? ' ' + f(e.a) : ''), e.p ? f(e.p) : '', e.pg ? `${f(e.pg[0])}: ${f(e.pg[3])}` : '', e.al ? f(e.al[1]) : '', ...[].concat(e.b || []).map(f), e.c ? f(e.c) : '', rows.map(([k, v]) => `${k}: ${v}`).join('\n'), (e.st || []).map(([t, d], i) => `${i + 1}. ${f(t)}: ${f(d)}`).join('\n'), e.cta && vars.url ? `${f(e.cta)}: ${vars.url}` : '', e.n2 ? f(e.n2) : ''].filter(Boolean).join('\n\n');
}
// Realistic sample values for previews and test sends: the shared sample, the template's own overrides, and live plan rules where a template lists them
async function sample(key, user) {
  const v = Object.assign({}, DEFS.SAMPLE, (DEFS.SAMPLE_FOR || {})[key] || {});
  if (user && user.first) { v.first_name = user.first; v.snippet = String(v.snippet).replace(/^Hi \w+/, 'Hi ' + user.first); v.message = String(v.message).replace(/Hi \w+/, 'Hi ' + user.first); }
  try { const core = require('./core'); const R = require('./rules'); const cat = await core.catalog(); const p0 = (cat.plans || []).find((p) => p.active !== false && p.kind === 'evaluation');
    if (p0) { v.plan = p0.name || v.plan; (p0.sizes || []).filter((z) => z.active !== false).slice(0, 3).forEach((z, i) => { const r = R.rulesFor(cat, { plan: p0.id, size: z.size, kind: 'evaluation', addons: [] }); v['s' + (i + 1)] = '$' + z.size / 1000 + 'K'; v['r' + (i + 1)] = `Target $${Math.round(r.target).toLocaleString('en-US')} · Max loss $${Math.round(r.maxLoss).toLocaleString('en-US')}`; }); } } catch (e) { /* keep the static sample */ }
  return v;
}
async function deliver({ to, subject, body, html, template, from, status, uid, unsub }) {
  const c = await I.cfg('resend').catch(() => null);
  const key = (c && c.apiKey) || process.env.RESEND_API_KEY;
  const row = await db.one('INSERT INTO outbox(to_email,subject,body,template,status,user_id) VALUES($1,$2,$3,$4,$5,$6) RETURNING id', [to, subject, body, template || '', status || (key ? 'queued' : 'logged'), uid || null]);
  if (status || !key) { if (!key) console.log(`[mail] ${to} · ${subject}`); return row.id; }
  const base = (c && c.from) || process.env.MAIL_FROM || 'Funded Sky <hello@fundedsky.com>';
  let fromH = base; if (from) { const dom = (base.match(/@([^>\s]+)/) || [])[1]; if (dom) fromH = `${from[0]} <${from[1].split('@')[0]}@${dom}>`; }
  try {
    const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: fromH, to: [to], subject, text: body, html: html || plainHtml(subject, body), tags: template ? [{ name: 'template', value: template }] : undefined, headers: unsub ? { 'List-Unsubscribe': `<${unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } : undefined }) });
    const j = await r.json().catch(() => ({}));
    await db.q('UPDATE outbox SET status=$2, ext_id=$3 WHERE id=$1', [row.id, r.ok ? 'sent' : 'failed', j.id || null]);
    if (!r.ok) console.error('resend', j.message || r.status);
  } catch (e) { await db.q("UPDATE outbox SET status='failed' WHERE id=$1", [row.id]); }
  return row.id;
}
function plainHtml(subject, body) {
  const linked = esc(body).replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" style="color:#7CC4FF">$1</a>').replace(/\n/g, '<br>');
  return render({ s: subject, h: subject, b: [], flow: '' }, {}, BRAND0).replace('<div style="padding:16px 26px 28px">', `<div style="padding:16px 26px 28px"><div style="font-size:14.5px;line-height:1.6;color:#D4CFCD">${linked}</div>`);
}
// One-click unsubscribe links are signed so nobody can unsubscribe someone else
const crypto = require('crypto');
async function unsubSecret() { let r = await kv('secret.unsub'); if (!r) { r = crypto.randomBytes(24).toString('hex'); await db.q("INSERT INTO kv(k,v) VALUES('secret.unsub',$1) ON CONFLICT (k) DO NOTHING", [JSON.stringify(r)]); r = await kv('secret.unsub'); } return r; }
async function unsubLink(uid) { const sig = crypto.createHmac('sha256', await unsubSecret()).update(String(uid)).digest('hex').slice(0, 32); return `${require('./auth').BASE()}/unsubscribe?u=${uid}&t=${sig}`; }
async function unsubCheck(uid, t) { const sig = crypto.createHmac('sha256', await unsubSecret()).update(String(uid)).digest('hex').slice(0, 32); return typeof t === 'string' && t.length === 32 && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(t)); }
// Rough time zone from country, for quiet hours
const TZ = { 'United States': 'America/New_York', Canada: 'America/Toronto', Mexico: 'America/Mexico_City', Brazil: 'America/Sao_Paulo', Argentina: 'America/Argentina/Buenos_Aires', Colombia: 'America/Bogota', Chile: 'America/Santiago', Peru: 'America/Lima', 'United Kingdom': 'Europe/London', Ireland: 'Europe/Dublin', Portugal: 'Europe/Lisbon', Germany: 'Europe/Berlin', France: 'Europe/Paris', Spain: 'Europe/Madrid', Italy: 'Europe/Rome', Netherlands: 'Europe/Amsterdam', Poland: 'Europe/Warsaw', Sweden: 'Europe/Stockholm', Norway: 'Europe/Oslo', Switzerland: 'Europe/Zurich', Czechia: 'Europe/Prague', Romania: 'Europe/Bucharest', Ukraine: 'Europe/Kyiv', Turkey: 'Europe/Istanbul', Cyprus: 'Asia/Nicosia', Israel: 'Asia/Jerusalem', UAE: 'Asia/Dubai', 'Saudi Arabia': 'Asia/Riyadh', Egypt: 'Africa/Cairo', Nigeria: 'Africa/Lagos', Ghana: 'Africa/Accra', Kenya: 'Africa/Nairobi', 'South Africa': 'Africa/Johannesburg', Morocco: 'Africa/Casablanca', India: 'Asia/Kolkata', Pakistan: 'Asia/Karachi', Thailand: 'Asia/Bangkok', Vietnam: 'Asia/Ho_Chi_Minh', Malaysia: 'Asia/Kuala_Lumpur', Singapore: 'Asia/Singapore', Indonesia: 'Asia/Jakarta', Philippines: 'Asia/Manila', 'Hong Kong': 'Asia/Hong_Kong', China: 'Asia/Shanghai', 'South Korea': 'Asia/Seoul', Japan: 'Asia/Tokyo', Australia: 'Australia/Sydney', 'New Zealand': 'Pacific/Auckland' };
const mins = (s) => { const [h, m] = String(s || '0:0').split(':').map(Number); return (h || 0) * 60 + (m || 0); };
function quietNow(rules, country, d = new Date()) { if (!rules.quiet) return false; const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: TZ[country] || 'America/New_York', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d).map((x) => [x.type, x.value]));
  const n = (+p.hour) * 60 + (+p.minute), a = mins(rules.qFrom), b = mins(rules.qTo); return a > b ? n >= a || n < b : n >= a && n < b; }
const MK = Object.keys(DEFS.E).filter((k) => DEFS.E[k].mk);
// Whether a trader's own switches, the caps and quiet hours let this email go now: 'send', 'skip' or 'hold'
async function gate(e, key, u, C) {
  if (e.req || !u) return 'send';
  const st = u.settings || {};
  if (e.mk) {
    if (st.nMkt !== true) return 'skip';
    if (C.rules.noMkAfterBreach && (await db.one("SELECT 1 FROM accounts WHERE user_id=$1 AND breached_at > now() - interval '24 hours' LIMIT 1", [u.id]))) return 'skip';
    const n = await db.one("SELECT count(*) FILTER (WHERE created_at > now() - interval '1 day')::int d, count(*)::int w FROM outbox WHERE user_id=$1 AND template = ANY($2) AND created_at > now() - interval '7 days' AND status NOT IN ('suppressed','test')", [u.id, MK]);
    if (n.d >= (parseInt(C.rules.capDay, 10) || 1) || n.w >= (parseInt(C.rules.capWeek, 10) || 3)) return 'skip';
    if (quietNow(C.rules, u.country)) return 'hold';
    return 'send';
  }
  if (key === 'news') return st.nNews === false ? 'skip' : 'send';
  return st.nEmail === false ? 'skip' : 'send';
}
// Marketing held for quiet hours goes out when automations run after quiet hours end
async function releaseHeld() { const list = (await kv('mail.held')) || []; if (!list.length) return 0; const C = await cfg(); const keep = []; let n = 0;
  for (const h of list) { const u = await db.one('SELECT id, country FROM users WHERE id=$1', [h.uid]); if (u && quietNow(C.rules, u.country) && new Date(h.at) > new Date(Date.now() - 864e5)) { keep.push(h); continue; } if (u) { await sendT(h.key, h.to, h.vars, Object.assign({}, h.opt, { released: true })); n++; } }
  await db.q("INSERT INTO kv(k,v) VALUES('mail.held',$1) ON CONFLICT (k) DO UPDATE SET v=$1, updated_at=now()", [JSON.stringify(keep)]); return n; }
// Templated send. vars: merge fields ({first_name}, {account}, ...) and url for the button.
async function sendT(key, to, vars = {}, opt = {}) {
  const C = await cfg(); const e = tplOf(C, key);
  if (!e) return;
  if (!e.on && !opt.force) return;
  const u = opt.uid ? await db.one('SELECT id, country, settings FROM users WHERE id=$1', [opt.uid]) : await db.one('SELECT id, country, settings FROM users WHERE lower(email)=lower($1)', [String(to)]);
  if (!opt.force) { const g = await gate(e, key, u, C); if (g === 'skip') return; if (g === 'hold' && !opt.released) { const list = (await kv('mail.held')) || []; list.push({ key, to, vars, opt: { uid: u.id }, uid: u.id, at: new Date().toISOString() }); await db.q("INSERT INTO kv(k,v) VALUES('mail.held',$1) ON CONFLICT (k) DO UPDATE SET v=$1, updated_at=now()", [JSON.stringify(list)]); return; } }
  if (e.mk && u) { vars = Object.assign({ unsub: await unsubLink(u.id), prefs: require('./auth').BASE() + '/app#settings?tab=notif' }, vars); }
  const addr = String(to).toLowerCase(); const sup = C.supp.find((x) => String(x.a).toLowerCase() === addr);
  let status = null;
  if (sup && (sup.k === 'Bounced' || e.mk)) status = 'suppressed';
  if (e.mk && C.rules.pauseMk && !opt.force) return;
  let dest = to; if (C.rules.test && !opt.force) { if (C.rules.testTo && /@/.test(C.rules.testTo) && !/\[/.test(C.rules.testTo)) dest = C.rules.testTo; else status = status || 'test'; }
  const base = require('./auth').BASE(); const V = Object.assign({ url: base + '/dashboard' }, vars);
  const f = (t) => String(t == null ? '' : t).replace(/\{(\w+)\}/g, (m, k) => (V[k] != null ? V[k] : ''));
  return deliver({ to: dest, subject: f(e.s), body: text(e, V), html: render(e, V, C.brand), template: key, from: DEFS.SENDERS[e.fr] || DEFS.SENDERS.hello, status, uid: opt.uid || (u && u.id), unsub: e.mk ? V.unsub : undefined });
}
// Fire-and-forget templated email to a user by id.
function t(key, userId, vars = {}, opt) {
  setImmediate(async () => {
    try { const u = await db.one('SELECT email, first FROM users WHERE id=$1', [userId]); if (!u || /@demo\.fundedsky\.test$/.test(u.email)) return; await sendT(key, u.email, Object.assign({ first_name: u.first }, vars), Object.assign({ uid: userId }, opt || {})); } catch (e) { console.error('mail.t', key, e.message); }
  });
}
// Plain send (kept for staff-written messages). Pass a template key to use a design instead.
async function send(to, subject, body, template = '') { return deliver({ to, subject, body, template }); }
// Resend webhook (Svix-signed): delivered, opened, clicked, bounced, complained. Bounces and spam reports go on the suppression list.
async function hook(req, res) {
  const c = await I.cfg('resend').catch(() => null); const secret = c && c.webhookSecret; const body = req.body.toString('utf8');
  const id = req.get('svix-id'), ts = req.get('svix-timestamp'), sig = req.get('svix-signature') || '';
  if (!secret) { res.status(400).json({ error: 'Add the webhook signing secret in Settings > Integrations > Resend' }); return; }
  const want = require('crypto').createHmac('sha256', Buffer.from(String(secret).replace(/^whsec_/, ''), 'base64')).update(`${id}.${ts}.${body}`).digest('base64');
  if (!sig.split(' ').some((x) => x.split(',')[1] === want) || Math.abs(Date.now() / 1000 - +ts) > 600) { res.status(401).end(); return; }
  const ev = JSON.parse(body); const kind = String(ev.type || '').replace('email.', ''); const d = ev.data || {};
  await db.q('INSERT INTO webhook_log(provider,event,ok,detail) VALUES($1,$2,$3,$4)', ['resend', ev.type, true, JSON.stringify({ email_id: d.email_id })]).catch(() => {});
  const map = { delivered: 'delivered', opened: 'opened', clicked: 'clicked', bounced: 'bounced', complained: 'complaint', delivery_delayed: null, sent: null };
  const st = map[kind];
  if (d.email_id) {
    const row = await db.one('SELECT id, status, to_email FROM outbox WHERE ext_id=$1', [d.email_id]);
    if (row) {
      const rank = { queued: 0, logged: 0, sent: 1, delivered: 2, opened: 3, clicked: 4, bounced: 5, complaint: 5, failed: 5 };
      const next = st && (rank[st] || 0) >= (rank[row.status] || 0) ? st : row.status;
      await db.q("UPDATE outbox SET status=$2, events = events || $3::jsonb WHERE id=$1", [row.id, next, JSON.stringify([{ k: kind, at: ev.created_at || new Date().toISOString(), link: d.click && d.click.link, why: d.bounce && d.bounce.message }])]);
      if (kind === 'bounced' || kind === 'complained') {
        const cur = (await kv('store.emails.supp')) || [];
        if (!cur.some((x) => String(x.a).toLowerCase() === row.to_email.toLowerCase())) { cur.unshift({ a: row.to_email, k: kind === 'bounced' ? 'Bounced' : 'Complained', why: kind === 'bounced' ? ((d.bounce && d.bounce.message) || 'Bounced') : 'Marked as spam', at: new Date().toISOString() }); await db.q('INSERT INTO kv(k,v) VALUES($1,$2) ON CONFLICT (k) DO UPDATE SET v=$2', ['store.emails.supp', JSON.stringify(cur.slice(0, 5000))]); }
      }
    }
  }
  res.json({ ok: true });
}
module.exports = { deliverRaw: deliver, hook,  send, sendT, t, render, cfg, company, text, sample, tplOf, DEFS, unsubLink, unsubCheck, releaseHeld, quietNow };
