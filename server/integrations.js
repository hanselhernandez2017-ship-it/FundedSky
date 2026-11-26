// Third-party integrations. Keys are entered in the back office (Settings > Integrations),
// stored encrypted (AES-256-GCM, key from SECRETS_KEY) and read here at call time.
const crypto = require('crypto');
const db = require('./db');

const KEY = crypto.createHash('sha256').update(process.env.SECRETS_KEY || process.env.DATABASE_URL || 'fundedsky-dev').digest();
const enc = (s) => { const iv = crypto.randomBytes(12); const c = crypto.createCipheriv('aes-256-gcm', KEY, iv); const e = Buffer.concat([c.update(String(s), 'utf8'), c.final()]); return 'enc:' + Buffer.concat([iv, c.getAuthTag(), e]).toString('base64'); };
const mac = (s) => crypto.createHmac('sha256', KEY).update(String(s)).digest('hex');
const dec = (s) => { if (!s || !String(s).startsWith('enc:')) return s; try { const b = Buffer.from(s.slice(4), 'base64'); const d = crypto.createDecipheriv('aes-256-gcm', KEY, b.subarray(0, 12)); d.setAuthTag(b.subarray(12, 28)); return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8'); } catch (e) { return ''; } };

// Field types: text (shown), secret (write-only, masked), select
const PROVIDERS = {
  tailoredpay: { name: 'TailoredPay', cat: 'Payments', role: 'Backup card processor', desc: 'Optional. Offered to the buyer when Stripe declines a card. Becomes the main processor only if Stripe is not connected.', docs: 'https://www.tailoredpay.com',
    fields: [['gatewayUrl', 'Gateway URL', 'text', 'https://secure.nmi.com'], ['securityKey', 'Private Security Key', 'secret'], ['tokenizationKey', 'Public Tokenization Key (Collect.js)', 'text'], ['descriptor', 'Statement Descriptor', 'text', 'FUNDEDSKY']] },
  stripe: { name: 'Stripe', cat: 'Payments', role: 'Main card processor', desc: 'Cards on your own checkout page with Stripe\'s secure card fields, plus Apple Pay and Google Pay. Refunds and disputes sync back.', docs: 'https://dashboard.stripe.com/apikeys',
    fields: [['publishableKey', 'Publishable Key (pk_live_ or pk_test_)', 'text'], ['secretKey', 'Secret Key (sk_live_ or sk_test_)', 'secret'], ['webhookSecret', 'Webhook Signing Secret (whsec_)', 'secret'], ['descriptor', 'Statement Descriptor Suffix (optional)', 'text', '']] },
  confirmo: { name: 'Confirmo', cat: 'Payments', role: 'Crypto payments', desc: 'USDC, USDT and other coins at checkout. Settles to your Confirmo balance.', docs: 'https://docs.confirmo.net',
    fields: [['apiKey', 'API Key', 'secret'], ['callbackPassword', 'Callback Password', 'secret'], ['settlement', 'Settlement Currency', 'text', 'USDC']] },
  rise: { name: 'Rise', cat: 'Payouts', role: 'Trader payouts', desc: 'Invites traders to Rise and sends approved payouts from your Rise team.', docs: 'https://docs.riseworks.io',
    fields: [['environment', 'Environment', 'select', 'prod', ['prod', 'stg']], ['riseId', 'Your Rise ID', 'text'], ['privateKey', 'Wallet Private Key (signs payouts)', 'secret'], ['teamNanoid', 'Team ID (te_…)', 'text'], ['webhookSecret', 'Webhook Secret', 'secret']] },
  sumsub: { name: 'Sumsub', cat: 'Identity', role: 'Identity checks', desc: 'ID, selfie and address checks before a trader\'s first payout.', docs: 'https://docs.sumsub.com',
    fields: [['appToken', 'App Token', 'secret'], ['secretKey', 'Secret Key', 'secret'], ['webhookSecret', 'Webhook Secret Key', 'secret'], ['levelName', 'Verification Level', 'text', 'basic-kyc-level']] },
  track1099: { name: 'Track1099', cat: 'Tax', role: 'W-9 and W-8BEN forms', desc: 'Collects tax forms before payouts and files 1099-NEC for US traders.', docs: 'https://www.track1099.com/api_info/readme',
    fields: [['apiToken', 'API Token', 'secret'], ['companyId', 'Company ID', 'text'], ['baseUrl', 'API Base URL', 'text', 'https://www.track1099.com']] },
  resend: { name: 'Resend', cat: 'Email', role: 'Every email the system sends', desc: 'Verification codes, receipts, payout updates and support replies.', docs: 'https://resend.com/api-keys',
    fields: [['apiKey', 'API Key (re_…)', 'secret'], ['from', 'From Address', 'text', 'Funded Sky <no-reply@fundedsky.com>'], ['replyTo', 'Reply-To', 'text', 'support@fundedsky.com'], ['webhookSecret', 'Webhook Signing Secret (whsec_…)', 'secret']] },
  crisp: { name: 'Crisp', cat: 'Support', role: 'Live chat', desc: 'Chat on the website, checkout and trader dashboard.', docs: 'https://app.crisp.chat',
    fields: [['websiteId', 'Website ID', 'text']] },
  posthog: { name: 'PostHog', cat: 'Analytics', role: 'Website tracking', desc: 'Visits, sources and checkout funnel.', docs: 'https://posthog.com',
    fields: [['projectKey', 'Project API Key (phc_…)', 'text'], ['host', 'Host', 'text', 'https://us.i.posthog.com']] },
  slack: { name: 'Slack', cat: 'Alerts', role: 'Team alerts', desc: 'New orders, payout requests, breaches and tickets posted to a channel.', docs: 'https://api.slack.com/messaging/webhooks',
    fields: [['webhookUrl', 'Incoming Webhook URL', 'secret']] },
  discord: { name: 'Discord', cat: 'Alerts', role: 'Community announcements', desc: 'Payout announcements to your community channel.', docs: 'https://support.discord.com/hc/en-us/articles/228383668',
    fields: [['webhookUrl', 'Channel Webhook URL', 'secret']] }
};

let cache = null, at = 0;
async function load() {
  if (cache && Date.now() - at < 10000) return cache;
  const rows = await db.all('SELECT * FROM integrations');
  const o = {}; rows.forEach((r) => { o[r.id] = r; }); cache = o; at = Date.now(); return o;
}
const bust = () => { cache = null; };
// Decrypted config for server use; null when the integration is off or incomplete
async function cfg(id) {
  const r = (await load())[id]; if (!r || !r.enabled) return null;
  const out = {}; for (const [k, , type, def] of PROVIDERS[id].fields) { const v = r.config[k]; out[k] = type === 'secret' ? dec(v) : (v == null || v === '' ? def || '' : v); }
  return out;
}
async function on(id) { return !!(await cfg(id)); }
// Safe view for the back office: secrets masked
async function list() {
  const rows = await load();
  return Object.entries(PROVIDERS).map(([id, p]) => {
    const r = rows[id] || { config: {}, enabled: false };
    return { id, name: p.name, cat: p.cat, role: p.role, desc: p.desc, docs: p.docs, enabled: r.enabled, status: r.status || 'off', lastCheck: r.last_check, lastError: r.last_error || '', webhook: WEBHOOKS[id] || '',
      fields: p.fields.map(([k, label, type, def, opts]) => ({ k, label, type, opts: opts || null, value: type === 'secret' ? '' : (r.config[k] ?? def ?? ''), set: type === 'secret' ? !!r.config[k] : undefined, hint: type === 'secret' && r.config[k] ? '••••' + (dec(r.config[k]) || '').slice(-4) : '' })) };
  });
}
async function save(id, body, actor) {
  const p = PROVIDERS[id]; if (!p) throw new Error('Unknown integration');
  const r = (await load())[id] || { config: {} }; const conf = { ...r.config };
  for (const [k, , type] of p.fields) {
    if (!(k in (body.config || {}))) continue; const v = String(body.config[k] ?? '').trim();
    if (type === 'secret') { if (v) conf[k] = enc(v); else if (body.clear && body.clear.includes(k)) delete conf[k]; } else conf[k] = v;
  }
  const enabled = body.enabled === undefined ? !!r.enabled : !!body.enabled;
  await db.q(`INSERT INTO integrations(id,config,enabled,updated_by,updated_at) VALUES($1,$2,$3,$4,now()) ON CONFLICT (id) DO UPDATE SET config=$2, enabled=$3, updated_by=$4, updated_at=now()`, [id, conf, enabled, actor || null]);
  bust();
}
async function mark(id, ok, err) { await db.q("UPDATE integrations SET status=$2, last_check=now(), last_error=$3 WHERE id=$1", [id, ok ? 'live' : 'error', err || '']); bust(); }

const WEBHOOKS = { stripe: '/api/hooks/stripe', confirmo: '/api/hooks/confirmo', sumsub: '/api/hooks/sumsub', rise: '/api/hooks/rise', resend: '/api/hooks/resend' };

// ---------- provider calls ----------
const T = (ms) => AbortSignal.timeout(ms || 15000);
async function nmi(c, params, path = '/api/transact.php') {
  const body = new URLSearchParams({ security_key: c.securityKey, ...params });
  const r = await fetch(c.gatewayUrl.replace(/\/$/, '') + path, { method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, signal: T(30000) });
  const t = await r.text(); return path.includes('query') ? t : Object.fromEntries(new URLSearchParams(t));
}
function sumsubSign(c, method, path, body) {
  const ts = Math.floor(Date.now() / 1000).toString();
  const sig = crypto.createHmac('sha256', c.secretKey).update(ts + method.toUpperCase() + path + (body || '')).digest('hex');
  return { 'X-App-Token': c.appToken, 'X-App-Access-Ts': ts, 'X-App-Access-Sig': sig, 'Content-Type': 'application/json', Accept: 'application/json' };
}
async function sumsub(c, method, path, obj) {
  const body = obj ? JSON.stringify(obj) : '';
  const r = await fetch('https://api.sumsub.com' + path, { method, headers: sumsubSign(c, method, path, body), body: body || undefined, signal: T() });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.description || j.message || 'Sumsub error ' + r.status); return j;
}
let riseClient = null, riseFor = '';
async function rise(c) {
  const sig = c.riseId + c.environment + (c.privateKey || '').slice(-6);
  if (riseClient && riseFor === sig) return riseClient;
  const { RiseApiClient } = await import('@riseworks/sdk');
  riseClient = new RiseApiClient({ environment: c.environment || 'prod', riseIdAuth: { riseId: c.riseId, privateKey: c.privateKey } }); riseFor = sig; return riseClient;
}
async function t1099(c, method, path, obj) {
  const r = await fetch(c.baseUrl.replace(/\/$/, '') + path, { method, headers: { Authorization: 'Bearer ' + c.apiToken, 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' }, body: obj ? JSON.stringify(obj) : undefined, signal: T() });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error((j.errors && j.errors[0] && (j.errors[0].detail || j.errors[0].title)) || 'Track1099 error ' + r.status); return j;
}

// Connection tests: return a short success message or throw
const TESTS = {
  async tailoredpay(c) { const t = await nmi(c, { report_type: 'profile' }, '/api/query.php'); if (/Authentication Failed|Invalid Security Key/i.test(t)) throw new Error('The gateway rejected the security key'); if (!c.tokenizationKey) throw new Error('Add the public tokenization key so checkout can collect cards'); return 'Gateway accepted the security key'; },
  async stripe(c) { const s = require('stripe')(c.secretKey); const b = await s.balance.retrieve(); return `Connected (${c.secretKey.startsWith('sk_live') ? 'live' : 'test'} mode, ${b.available.length} balance currencies)`; },
  async confirmo(c) { const r = await fetch('https://confirmo.net/api/v3/invoices?limit=1', { headers: { Authorization: 'Bearer ' + c.apiKey }, signal: T() }); if (r.status === 401 || r.status === 403) throw new Error('Confirmo rejected the API key'); if (!c.callbackPassword) throw new Error('Add the callback password so payment webhooks can be verified'); return 'Confirmo accepted the API key'; },
  async rise(c) { const cl = await rise(c); const me = await cl.me.get(); const teams = await cl.user.getTeams(); const ok = (teams.data.teams || []).some((t) => t.nanoid === c.teamNanoid); if (!ok) throw new Error('Signed in, but the team ID was not found. Teams: ' + (teams.data.teams || []).map((t) => `${t.name} (${t.nanoid})`).join(', ')); return 'Signed in to Rise as ' + ((me.data && (me.data.email || me.data.name)) || 'your account'); },
  async sumsub(c) { await sumsub(c, 'POST', '/resources/accessTokens/sdk', { userId: 'fs-connection-test', levelName: c.levelName, ttlInSecs: 60 }); return 'Sumsub issued a test token for level ' + c.levelName; },
  async track1099(c) { await t1099(c, 'GET', '/api/v1/companies'); if (!c.companyId) throw new Error('Connected. Add your Company ID to send forms.'); return 'Track1099 accepted the token'; },
  async resend(c) { const r = await fetch('https://api.resend.com/domains', { headers: { Authorization: 'Bearer ' + c.apiKey }, signal: T() }); const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.message || 'Resend rejected the key'); const d = (j.data || []).map((x) => `${x.name} (${x.status})`).join(', '); return d ? 'Domains: ' + d : 'Connected. Add and verify your sending domain in Resend.'; },
  async crisp(c) { if (!/^[0-9a-f-]{36}$/i.test(c.websiteId)) throw new Error('The website ID looks wrong. Copy it from Crisp > Settings > Website Settings > Setup.'); return 'Chat is on for the website, checkout and dashboard'; },
  async posthog(c) { if (!/^phc_/.test(c.projectKey)) throw new Error('Project keys start with phc_'); return 'Tracking is on'; },
  async slack(c) { const r = await fetch(c.webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: ':white_check_mark: Funded Sky is connected to this channel.' }), signal: T() }); if (!r.ok) throw new Error('Slack returned ' + r.status); return 'Test message posted'; },
  async discord(c) { const r = await fetch(c.webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: 'Funded Sky is connected to this channel.' }), signal: T() }); if (!r.ok) throw new Error('Discord returned ' + r.status); return 'Test message posted'; }
};
async function test(id) {
  const r = (await load())[id]; if (!r) throw new Error('Save the settings first');
  const c = {}; for (const [k, , type, def] of PROVIDERS[id].fields) { const v = r.config[k]; c[k] = type === 'secret' ? dec(v) : (v == null || v === '' ? def || '' : v); }
  const missing = PROVIDERS[id].fields.filter(([k, , type]) => type === 'secret' && !c[k] && !['webhookSecret', 'callbackPassword'].includes(k)).map((f) => f[1]);
  if (missing.length) { await mark(id, false, 'Missing: ' + missing.join(', ')); throw new Error('Missing: ' + missing.join(', ')); }
  try { const msg = await TESTS[id](c); await mark(id, true, ''); return msg; } catch (e) { await mark(id, false, e.message); throw e; }
}

// ---------- alerts ----------
// Outgoing webhooks set up in Settings: every alert kind is also an event (order.paid, payout.requested ...)
const EVN = { order: 'order.paid', payout: 'payout.updated', pass: 'account.passed', breach: 'account.breached', dispute: 'dispute.opened', kyc: 'kyc.updated', decline: 'payment.declined', user: 'user.created' };
// Outgoing webhooks (Settings > Webhooks). Each endpoint has its own signing secret, kept apart from the endpoint list:
// X-FundedSky-Signature: t=<unix seconds>,v1=<hex HMAC-SHA256 of "<t>.<raw body>" with the endpoint secret>
const hookId = (h) => h.id || 'wh_' + crypto.createHash('sha256').update(String(h.url) + '|' + String(h.at || '')).digest('hex').slice(0, 12);
const hookSecrets = async () => ((await db.one("SELECT v FROM kv WHERE k='secret.webhooks'")) || {}).v || {};
const hookHost = (u) => String(u).replace(/^https?:\/\//, '').split('/')[0];
async function sendHook(h, ev, payload, secrets) {
  const id = hookId(h); const body = JSON.stringify(payload); const t = Math.floor(Date.now() / 1000); const sec = dec((secrets || {})[id] || '');
  const headers = { 'Content-Type': 'application/json', 'User-Agent': 'FundedSky-Webhooks/1', 'X-FundedSky-Event': ev, 'X-FundedSky-Delivery': payload.id };
  if (sec) headers['X-FundedSky-Signature'] = `t=${t},v1=${crypto.createHmac('sha256', sec).update(t + '.' + body).digest('hex')}`;
  const t0 = Date.now(); let code = 0, err = '';
  try { const r = await fetch(h.url, { method: 'POST', headers, body, redirect: 'manual', signal: T(10000) }); code = r.status; } catch (e) { err = e.name === 'TimeoutError' ? 'Timed out after 10 s' : 'Could not connect'; }
  const ok = code >= 200 && code < 300;
  await db.q('INSERT INTO webhook_log(provider,event,ok,detail) VALUES($1,$2,$3,$4)', ['out:' + hookHost(h.url), ev, ok, JSON.stringify({ code, ms: Date.now() - t0, url: h.url, hook: id, delivery: payload.id, err: err || undefined, signed: !!sec })]).catch(() => {});
  return { ok, code, ms: Date.now() - t0, err };
}
// data: the event's fields (order code, amounts, user and so on). Events without data are not sent.
async function outHooks(kind, text, data, only) {
  try { if (!data) return []; const hs = ((await db.one("SELECT v FROM kv WHERE k='store.webhooks.out'")) || {}).v || []; const ev = EVN[kind] || kind; const secrets = await hookSecrets(); const out = [];
    for (const h of hs.filter((x) => (only ? hookId(x) === only : x.on !== false) && (x.events || []).includes(ev))) {
      out.push(await sendHook(h, ev, { id: 'evt_' + crypto.randomBytes(9).toString('hex'), event: ev, at: new Date().toISOString(), data, text: String(text || '').replace(/:[a-z_]+:\s*/g, '') }, secrets));
    }
    return out; } catch (e) { return []; /* never break the caller */ }
}
async function alert(kind, text, data) {
  // Webhook endpoints have their own event choice, so they do not follow the alert switches
  if (data) outHooks(kind, text, data);
  try {
    const set = (await db.one("SELECT v FROM kv WHERE k='settings.alerts'")) || { v: {} };
    if (set.v[kind] === false) return;
    const s = await cfg('slack'); if (s && s.webhookUrl && set.v['slack_' + kind] !== false) fetch(s.webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }), signal: T(8000) }).catch(() => {});
  } catch (e) { /* alerts never break the caller */ }
}
async function announce(text) { try { const d = await cfg('discord'); if (d && d.webhookUrl) fetch(d.webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: text }), signal: T(8000) }).catch(() => {}); } catch (e) { /* ignore */ } }

module.exports = { outHooks, hookId, hookSecrets, EVN, PROVIDERS, cfg, on, list, save, test, alert, announce, nmi, sumsub, sumsubSign, rise, t1099, enc, dec, mac, WEBHOOKS, bust };
