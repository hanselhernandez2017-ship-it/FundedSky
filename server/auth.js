const bcrypt = require('bcryptjs');
const db = require('./db');
const mail = require('./mail');
const { rid, bad, clean, emailOk } = require('./util');
const COOKIE = 'fs_sess';
const BASE = () => process.env.PUBLIC_URL || 'http://localhost:' + (process.env.PORT || 3000);

function parseCookies(h) { const o = {}; (h || '').split(';').forEach((p) => { const i = p.indexOf('='); if (i > 0) o[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); }); return o; }
function setCookie(res, token, days = 30) {
  const secure = BASE().startsWith('https') ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax${days ? '; Max-Age=' + Math.round(days * 86400) : ''}${secure}`);
}
// Staff sessions last 12 hours; traders 30 days, or until the browser closes without "Keep Me Logged In"
// "New sign-in" email the first time a browser and system we have not seen signs in (not on sign-up)
function deviceOf(ua) { ua = String(ua || ''); const b = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : /python|curl|node/i.test(ua) ? 'an app' : 'a browser';
  const o = /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS X|Macintosh/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : ''; return o ? `${b} on ${o}` : b; }
async function seenDevice(req, user) {
  const dev = deviceOf(req.headers['user-agent']); const k = 'devices.' + user.id; const r = await db.one('SELECT v FROM kv WHERE k=$1', [k]); const list = (r && r.v) || [];
  if (list.includes(dev)) return; list.push(dev); await db.q('INSERT INTO kv(k,v) VALUES($1,$2) ON CONFLICT (k) DO UPDATE SET v=$2, updated_at=now()', [k, JSON.stringify(list.slice(-20))]);
  if (!user.last_login) return;
  if (STAFF.includes(user.role)) { const { sec } = await staffPolicy(req); if (sec.newDevice === false) return; }
  const where = String(req.get('cf-ipcountry') || req.get('x-vercel-ip-country') || '').toUpperCase(); const when = new Date().toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' ET';
  mail.t('newlogin', user.id, { device: dev, location: where && where !== 'XX' ? where : 'Unknown location', when, url: BASE() + '/app#settings?tab=security' });
}
async function startSession(req, res, user, opt = {}) {
  if (opt.login) await seenDevice(req, user).catch(() => {});
  const token = rid(32); const staff = STAFF.includes(user.role); const keep = !(req.body && req.body.remember === false);
  const hours = staff ? 12 : keep ? 720 : 24;
  await db.q("INSERT INTO sessions(token,user_id,ua,ip,expires_at,mfa) VALUES($1,$2,$3,$4, now() + ($5 || ' hours')::interval, $6)", [token, user.id, clean(req.headers['user-agent'], 300), clean(req.ip, 80), String(hours), !!opt.mfa]);
  await db.q('UPDATE users SET last_login=now() WHERE id=$1', [user.id]);
  setCookie(res, token, staff ? 0.5 : keep ? 30 : 0);
}
async function loadUser(req, res, next) {
  const t = parseCookies(req.headers.cookie)[COOKIE];
  req.user = null; req.sess = null;
  if (t) {
    const r = await db.one('SELECT s.token, s.mfa AS sess_mfa, s.seen_at AS seen_at_s, u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=$1 AND s.expires_at > now()', [t]);
    if (r && r.status !== 'banned') {
      if (STAFF.includes(r.role)) { const { sec, nets } = await staffPolicy(req); const mins = parseInt(sec.timeout, 10);
        if (mins > 0 && r.seen_at_s && Date.now() - new Date(r.seen_at_s) > mins * 60000) { await db.q('DELETE FROM sessions WHERE token=$1', [t]); return next(); }
        if (sec.ipOnly && nets.length && !nets.some((x) => ipIn(req.ip, x))) r.netBlocked = true; }
      req.user = r; req.sess = t; db.q('UPDATE sessions SET seen_at=now() WHERE token=$1', [t]).catch(() => {}); }
  }
  next();
}
const STAFF = ['admin', 'support', 'risk', 'finance'];
const needUser = (req, res, next) => (req.user ? next() : res.status(401).json({ error: 'Please log in' }));
const staffOk = (u) => u && STAFF.includes(u.role) && u.mfa_on && u.sess_mfa && !u.netBlocked;
// Team > Security: allowed networks and the inactivity timeout for staff
const ipIn = (ip, rule) => { ip = String(ip || '').replace(/^::ffff:/, ''); rule = String(rule || '').trim(); if (!rule) return false; if (!rule.includes('/')) return ip === rule;
  const [base, bits] = rule.split('/'); const n = (x) => x.split('.').reduce((a, b) => (a << 8) + (+b || 0), 0) >>> 0; const m = +bits === 0 ? 0 : (~0 << (32 - +bits)) >>> 0; return /\d+\.\d+\.\d+\.\d+/.test(ip) && (n(ip) & m) === (n(base) & m); };
async function staffPolicy(req) { const sec = ((await db.one("SELECT v FROM kv WHERE k='store.team.security'")) || {}).v || {}; const nets = ((await db.one("SELECT v FROM kv WHERE k='store.team.networks'")) || {}).v || []; return { sec, nets }; }
const needStaff = (req, res, next) => (staffOk(req.user) ? next() : req.user && req.user.netBlocked ? res.status(403).json({ error: 'The back office only opens from your company network. Ask an admin to add this network in Team.' }) : req.user && STAFF.includes(req.user.role) ? res.status(403).json({ error: 'Set up two-step login first', mfa: 'setup' }) : res.status(403).json({ error: 'Staff only' }));
const needAdmin = (req, res, next) => (req.user && req.user.role === 'admin' ? next() : res.status(403).json({ error: 'Admins only' }));

async function makeToken(userId, kind, hours) {
  const t = rid(24);
  await db.q(`INSERT INTO tokens(token,user_id,kind,expires_at) VALUES($1,$2,$3, now() + ($4 || ' hours')::interval)`, [t, userId, kind, String(hours)]);
  return t;
}
async function blockedReq(req, email) {
  const bl = ((await db.one("SELECT v FROM kv WHERE k='list.blocklist'")) || {}).v || []; const ip = String(req.ip || '').replace(/^::ffff:/, ''); const em = String(email || '').toLowerCase();
  return bl.some((x) => x && x.type !== 'watch' && x.value && ((x.type === 'ip' && String(x.value).replace(/^::ffff:/, '') === ip) || (x.type === 'email' && (em === String(x.value).toLowerCase() || (String(x.value).startsWith('@') && em.endsWith(String(x.value).toLowerCase()))))));
}
// Same rule the sign-up and reset pages show: 8+ characters, a number and an uppercase letter
const pwRule = (p) => { if (p.length < 8 || !/\d/.test(p) || !/[A-Z]/.test(p)) bad('Use at least 8 characters, with a number and an uppercase letter'); };
async function signup(req, res) {
  const email = clean(req.body.email, 200).toLowerCase(); const pass = String(req.body.password || '');
  const first = clean(req.body.first, 60), last = clean(req.body.last, 60), country = clean(req.body.country, 60);
  if (!emailOk(email)) bad('Enter a valid email address');
  pwRule(pass);
  if (!first || !last) bad('Enter your first and last name');
  const rc = await db.one("SELECT v FROM kv WHERE k='list.countries'"); if (rc && (rc.v || []).some((c) => c.blocked && c.name === country)) bad('Funded Sky is not available in ' + country + ' yet.');
  if (await blockedReq(req, email)) bad('We could not create an account. Contact support if you think this is a mistake.');
  if (await db.one('SELECT 1 FROM users WHERE email=$1', [email])) bad('An account with this email already exists. Log in instead.');
  const n = (await db.one("SELECT nextval('seq_tid') n")).n;
  let ref = null; const refCode = req.body.ref || parseCookies(req.headers.cookie).fs_ref; if (refCode) { const r = await db.one('SELECT id FROM users WHERE ref_code=$1', [clean(refCode, 40)]); ref = r ? r.id : null; if (!ref) { const al = ((await db.one("SELECT v FROM kv WHERE k='list.affiliates'")) || {}).v || []; const m = al.find((x) => x.code && String(x.code).toUpperCase() === String(refCode).toUpperCase() && x.status === 'active'); if (m) ref = m.user; } }
  const adminEmails = (process.env.ADMIN_EMAILS || '').toLowerCase().split(',').map((x) => x.trim()).filter(Boolean);
  const invs = ((await db.one("SELECT v FROM kv WHERE k='store.team.invites'")) || {}).v || []; const inv = invs.find((x) => String(x.email).toLowerCase() === email && new Date(x.at) > new Date(Date.now() - 7 * 864e5));
  const role = adminEmails.includes(email) ? 'admin' : inv && ['admin', 'support', 'risk', 'finance'].includes(inv.role) ? inv.role : 'trader';
  require('./integrations').alert('user', `New sign-up: ${first} ${last} from ${country || 'unknown country'}`);
  if (inv) await db.q("UPDATE kv SET v=$1 WHERE k='store.team.invites'", [JSON.stringify(invs.filter((x) => x !== inv))]);
  const u = await db.one(`INSERT INTO users(tid,email,pass_hash,first,last,country,role,ref_code,referred_by,settings,agreements) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    ['T-' + n, email, await bcrypt.hash(pass, 10), first, last, country, role, 't' + n, ref,
      Object.assign({ nEmail: true, nSms: false, nPush: true, nNews: true, nMkt: req.body.offers === true, nComp: true, mfaPay: true }, (() => { try { const c = parseCookies(req.headers.cookie); const f = c.fs_src ? JSON.parse(c.fs_src) : null; const l = c.fs_lsrc ? JSON.parse(c.fs_lsrc) : null; return f || l ? { src: f || l, lsrc: l || f } : {}; } catch (e) { return {}; } })()),
      { terms: new Date().toISOString(), privacy: new Date().toISOString(), risk: new Date().toISOString(), refund: new Date().toISOString() }]);
  await sendVerify(u);
  await startSession(req, res, u);
  return { ok: true, user: { email, first, role } };
}
async function login(req, res) {
  const email = clean(req.body.email, 200).toLowerCase();
  const u = await db.one('SELECT * FROM users WHERE email=$1', [email]);
  const M = require('./mfa'); const fails = loginFails.get(email) || 0;
  if (fails >= 10) bad('Too many wrong tries. Wait 15 minutes or reset your password.', 429);
  if (!u || !(await bcrypt.compare(String(req.body.password || ''), u.pass_hash))) { loginFails.set(email, fails + 1); setTimeout(() => { const v = loginFails.get(email); if (v) loginFails.set(email, v - 1); }, 15 * 60000).unref(); bad('That email and password do not match', 401); }
  loginFails.delete(email);
  if (u.status === 'banned') bad('This account is closed. Contact support.', 403);
  if (STAFF.includes(u.role) && u.mfa_on) { const ticket = await makeToken(u.id, 'mfa', 0.1); return { ok: true, mfa: true, ticket, role: u.role }; }
  await startSession(req, res, u, { login: true });
  return { ok: true, role: u.role, mfaSetup: STAFF.includes(u.role) };
}
const loginFails = new Map();
async function mfaLogin(req, res) { const r = await require('./mfa').challenge(req.body.ticket, req.body.code); await startSession(req, res, r.user, { mfa: true, login: true }); return { ok: true, role: r.user.role, backupLeft: r.backup ? r.left : undefined }; }
async function logout(req, res) { if (req.sess) await db.q('DELETE FROM sessions WHERE token=$1', [req.sess]); res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; Max-Age=0`); return { ok: true }; }
async function forgot(req) {
  const email = clean(req.body.email, 200).toLowerCase();
  const u = await db.one('SELECT * FROM users WHERE email=$1', [email]);
  if (u) { const t = await makeToken(u.id, 'reset', 2); await mail.sendT('pwreset', email, { first_name: u.first, url: `${BASE()}/reset-password?token=${t}` }, { uid: u.id }); }
  return { ok: true };
}
async function resetPassword(req, res) {
  const t = await db.one("SELECT * FROM tokens WHERE token=$1 AND kind='reset' AND used=false AND expires_at > now()", [clean(req.body.token, 100)]);
  if (!t) bad('This reset link has expired. Ask for a new one.');
  const pass = String(req.body.password || ''); pwRule(pass);
  await db.q('UPDATE users SET pass_hash=$2 WHERE id=$1', [t.user_id, await bcrypt.hash(pass, 10)]);
  await db.q('UPDATE tokens SET used=true WHERE token=$1', [t.token]);
  await db.q('DELETE FROM sessions WHERE user_id=$1', [t.user_id]);
  const u = await db.one('SELECT * FROM users WHERE id=$1', [t.user_id]);
  mail.t('pwchanged', u.id, { time: new Date().toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' ET', device: String(req.get('user-agent') || '').replace(/^.*?(Chrome|Firefox|Safari|Edg)[^ ]*.*?$/, '$1').slice(0, 40) || 'Browser', location: req.get('cf-ipcountry') || req.get('x-vercel-ip-country') || 'Unknown', url: BASE() + '/forgot-password' });
  await startSession(req, res, u);
  return { ok: true };
}
async function sendVerify(u) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  await db.q("UPDATE tokens SET used=true WHERE user_id=$1 AND kind='verify' AND used=false", [u.id]);
  await db.q(`INSERT INTO tokens(token,user_id,kind,expires_at) VALUES($1,$2,'verify', now() + interval '30 minutes')`, ['V' + u.id + ':' + code, u.id]);
  await mail.sendT('confirm', u.email, { first_name: u.first, code, url: `${BASE()}/verify-email?code=${code}` }, { uid: u.id });
}
async function verifyEmail(req) {
  if (!req.user) bad('Log in first, then enter your code', 401);
  const code = clean(req.body.code, 10).replace(/\D/g, '');
  const t = await db.one("SELECT * FROM tokens WHERE token=$1 AND kind='verify' AND used=false AND expires_at > now()", ['V' + req.user.id + ':' + code]);
  if (!t) { if (require('./mfa').bump('v' + req.user.id) >= 6) await db.q("UPDATE tokens SET used=true WHERE user_id=$1 AND kind='verify'", [req.user.id]); bad('That code is wrong or has expired. Send a new one.'); }
  const was = await db.one('SELECT verified FROM users WHERE id=$1', [t.user_id]);
  await db.q('UPDATE users SET verified=true WHERE id=$1', [t.user_id]);
  await db.q('UPDATE tokens SET used=true WHERE token=$1', [t.token]);
  if (was && !was.verified) mail.t('welcome', t.user_id, { url: BASE() + '/checkout' });
  return { ok: true };
}
async function resendVerify(req) {
  const u = req.user; if (u.verified) return { ok: true, verified: true };
  await sendVerify(u);
  return { ok: true };
}
async function changePassword(req) {
  const u = await db.one('SELECT * FROM users WHERE id=$1', [req.user.id]);
  if (!(await bcrypt.compare(String(req.body.current || ''), u.pass_hash))) bad('Your current password is not right');
  const pass = String(req.body.password || ''); pwRule(pass);
  await db.q('UPDATE users SET pass_hash=$2 WHERE id=$1', [u.id, await bcrypt.hash(pass, 10)]);
  await db.q('DELETE FROM sessions WHERE user_id=$1 AND token<>$2', [u.id, req.sess]);
  return { ok: true };
}
module.exports = { ipIn, parseCookies, blockedReq, loadUser, needUser, needStaff, staffOk, mfaLogin, startSession, needAdmin, signup, login, logout, forgot, resetPassword, verifyEmail, resendVerify, changePassword, STAFF, BASE };
