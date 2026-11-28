const bcrypt = require('bcryptjs');
const db = require('./db');
const mail = require('./mail');
const { rid, bad, clean, emailOk } = require('./util');
const COOKIE = 'fs_sess';
const BASE = () => process.env.PUBLIC_URL || 'http://localhost:' + (process.env.PORT || 3000);

// The trader behind a referral link code (a trader's own code, or an active affiliate's code); null when unknown
async function refOf(refCode) { if (!refCode) return null; const r = await db.one('SELECT id FROM users WHERE ref_code=$1', [clean(refCode, 40)]); if (r) return r.id; const al = ((await db.one("SELECT v FROM kv WHERE k='list.affiliates'")) || {}).v || []; const m = al.find((x) => x.code && String(x.code).toUpperCase() === String(refCode).toUpperCase() && x.status === 'active'); return m ? m.user : null; }
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
    // Suspended staff lose their back-office sessions (traders who are suspended can still sign in to a limited dashboard)
    if (r && STAFF.includes(r.role) && r.status === 'suspended') { await db.q('DELETE FROM sessions WHERE user_id=$1', [r.id]); return next(); }
    if (r && r.status !== 'banned') {
      if (STAFF.includes(r.role)) { const { sec, nets } = await staffPolicy(req); const mins = parseInt(sec.timeout, 10);
        if (mins > 0 && r.seen_at_s && Date.now() - new Date(r.seen_at_s) > mins * 60000) { await db.q('DELETE FROM sessions WHERE token=$1', [t]); return next(); }
        if (sec.ipOnly && nets.length && !nets.some((x) => ipIn(req.ip, x))) r.netBlocked = true; }
      req.user = r; req.sess = t; db.q('UPDATE sessions SET seen_at=now() WHERE token=$1', [t]).catch(() => {}); }
  }
  next();
}
const STAFF = ['admin', 'support', 'risk', 'finance'];
const needUser = (req, res, next) => (req.user ? next() : res.status(401).json({ error: 'Please log in.' }));
const staffOk = (u) => !!(u && STAFF.includes(u.role) && u.status !== 'suspended' && u.status !== 'banned' && u.mfa_on && u.sess_mfa && !u.netBlocked);
// Team > Security: allowed networks and the inactivity timeout for staff. Entries are one IPv4 or IPv6 address, or a range like 10.0.0.0/24 or 2001:db8::/48.
const net = require('net');
const normIp = (ip) => String(ip || '').trim().replace(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i, '$1');
const netRule = (rule) => { const m = /^([^/\s]+)(?:\/(\d{1,3}))?$/.exec(String(rule || '').trim()); if (!m) return null; const base = normIp(m[1]); const v = net.isIP(base); if (!v) return null; const bits = m[2] === undefined ? null : +m[2]; if (bits !== null && bits > (v === 4 ? 32 : 128)) return null; return { base, bits, fam: v === 4 ? 'ipv4' : 'ipv6' }; };
const ipIn = (ip, rule) => { ip = normIp(ip); const v = net.isIP(ip); const r = netRule(rule); if (!v || !r) return false; const bl = new net.BlockList(); if (r.bits === null) bl.addAddress(r.base, r.fam); else bl.addSubnet(r.base, r.bits, r.fam); return bl.check(ip, v === 4 ? 'ipv4' : 'ipv6'); };
async function staffPolicy(req) { const sec = ((await db.one("SELECT v FROM kv WHERE k='store.team.security'")) || {}).v || {}; const nets = ((await db.one("SELECT v FROM kv WHERE k='store.team.networks'")) || {}).v || []; return { sec, nets }; }
const needStaff = (req, res, next) => (staffOk(req.user) ? next() : !req.user ? res.status(401).json({ error: 'Please log in.' }) : req.user && req.user.netBlocked ? res.status(403).json({ error: 'The back office only opens from your company network. Ask an admin to add this network in Team.' }) : req.user && STAFF.includes(req.user.role) ? res.status(403).json({ error: 'Set up two-step login first.', mfa: 'setup' }) : res.status(403).json({ error: 'Staff only' }));
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
const pwRule = (p) => { if (p.replace(/\s/g, '').length < 8 || !/\d/.test(p) || !/[A-Z]/.test(p)) bad('Use at least 8 characters, with a number and an uppercase letter.'); };
async function signup(req, res) {
  const b = req.body || {}; if (['email', 'password', 'first', 'last', 'country', 'ref', 'phone', 'phoneIso'].some((k) => b[k] != null && typeof b[k] !== 'string')) bad('Check your details and try again.');
  const email = clean(b.email, 200).toLowerCase(); const pass = String(b.password || '');
  const first = clean(b.first, 60), last = clean(b.last, 60);
  // Country must be one from the sign-up list (the same list as the phone codes), stored with its usual spelling
  const cRow = require('./phone').DIAL.find((r) => r[0].toLowerCase() === clean(b.country, 60).toLowerCase()); const country = cRow ? cRow[0] : '';
  if (!emailOk(email)) bad('Enter a valid email address.');
  pwRule(pass);
  if (!first || !last) bad('Enter your first and last name.');
  if (!country) bad('Choose your country of residence from the list.');
  const ph = require('./phone').parse(req.body.phoneIso, req.body.phone); if (ph.err) bad(ph.err);
  const rc = await db.one("SELECT v FROM kv WHERE k='list.countries'"); if (rc && (rc.v || []).some((c) => c.blocked && String(c.name || '').trim().toLowerCase() === country.toLowerCase())) bad('Funded Sky is not available in ' + country + ' yet.');
  if (await blockedReq(req, email)) bad('We could not create an account. Contact support if you think this is a mistake.');
  if (await db.one('SELECT 1 FROM users WHERE email=$1', [email])) bad('An account with this email already exists. Log in instead.');
  const n = (await db.one("SELECT nextval('seq_tid') n")).n;
  let ref = null; const refCode = req.body.ref || parseCookies(req.headers.cookie).fs_ref; if (refCode) { const r = await db.one('SELECT id FROM users WHERE upper(ref_code)=upper($1)', [clean(refCode, 40)]); ref = r ? r.id : null; if (!ref) { const m = await require('./affiliates').byCode(refCode); if (m) ref = m.user; } }
  // Staff roles (ADMIN_EMAILS or a Team invite) are only given once the email is confirmed, in verifyEmail
  const role = 'trader';
  const u = await db.one(`INSERT INTO users(tid,email,pass_hash,first,last,country,role,ref_code,referred_by,settings,agreements,phone) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    ['T-' + n, email, await bcrypt.hash(pass, 10), first, last, country, role, 't' + n, ref,
      Object.assign({ nEmail: true, nSms: false, nPush: true, nNews: true, nMkt: req.body.offers === true, nComp: true, mfaPay: true, phoneIso: ph.iso }, (() => { try { const c = parseCookies(req.headers.cookie); const f = c.fs_src ? JSON.parse(c.fs_src) : null; const l = c.fs_lsrc ? JSON.parse(c.fs_lsrc) : null; return f || l ? { src: f || l, lsrc: l || f } : {}; } catch (e) { return {}; } })()),
      { terms: new Date().toISOString(), privacy: new Date().toISOString(), risk: new Date().toISOString(), refund: new Date().toISOString() }, ph.phone]);
  require('./integrations').alert('user', `New sign-up: ${first} ${last} from ${country || 'unknown country'}`, { user: { id: u.tid, email: u.email, first: u.first, last: u.last, country: u.country || null }, referredBy: ref ? true : false, createdAt: u.created_at });
  await sendVerify(u);
  await startSession(req, res, u);
  return { ok: true, user: { email, first, role } };
}
async function login(req, res) {
  const email = clean(req.body.email, 200).toLowerCase();
  const u = await db.one('SELECT * FROM users WHERE email=$1', [email]);
  const M = require('./mfa'); const fails = loginFails.get(email) || 0;
  if (fails >= 10) bad('Too many wrong tries. Wait 15 minutes or reset your password.', 429);
  const okPw = await bcrypt.compare(String(req.body.password || ''), u ? u.pass_hash : DUMMY_HASH);
  if (!u || !okPw) { loginFails.set(email, fails + 1); setTimeout(() => { const v = loginFails.get(email); if (v) loginFails.set(email, v - 1); }, 15 * 60000).unref(); bad('That email and password do not match.', 401); }
  loginFails.delete(email);
  if (u.status === 'banned') bad('This account is closed. Contact support.', 403);
  if (STAFF.includes(u.role) && u.status === 'suspended') bad('Your back office access is suspended. Ask an admin to turn it back on.', 403);
  if (u.status === 'suspended') bad(`This account is locked while our team reviews it. Reply to the email we sent you, or write to ${(await mail.cfg()).brand.support}.`, 403);
  // Staff always, traders when they turned on Two-Step Login in Settings > Security: the code step comes next
  if (u.mfa_on) { const ticket = await makeToken(u.id, 'mfa', 0.1); return { ok: true, mfa: true, ticket, role: u.role }; }
  await startSession(req, res, u, { login: true });
  return { ok: true, role: u.role, mfaSetup: STAFF.includes(u.role) };
}
const loginFails = new Map();
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password-' + Date.now(), 10);
async function mfaLogin(req, res) { const r = await require('./mfa').challenge(req.body.ticket, req.body.code); if (r.user.status === 'banned') bad('This account is closed. Contact support.', 403); if (STAFF.includes(r.user.role) && r.user.status === 'suspended') bad('Your back office access is suspended. Ask an admin to turn it back on.', 403); await startSession(req, res, r.user, { mfa: true, login: true }); return { ok: true, role: r.user.role, backupLeft: r.backup ? r.left : undefined }; }
async function logout(req, res) { if (req.sess) await db.q('DELETE FROM sessions WHERE token=$1', [req.sess]); res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; Max-Age=0`); return { ok: true }; }
async function forgot(req) {
  const email = clean(req.body.email, 200).toLowerCase();
  const u = await db.one('SELECT * FROM users WHERE email=$1', [email]);
  if (u && u.status !== 'banned') { const t = await makeToken(u.id, 'reset', 0.5); await mail.sendT('pwreset', email, { first_name: u.first, url: `${BASE()}/reset-password?token=${t}` }, { uid: u.id }); }
  return { ok: true };
}
// Lets the reset page say at once when a link is bad, used or expired (before the person types a new password)
async function resetCheck(req) { const t = await db.one("SELECT 1 FROM tokens t JOIN users u ON u.id=t.user_id WHERE t.token=$1 AND t.kind='reset' AND t.used=false AND t.expires_at > now() AND u.status<>'banned'", [clean(req.body.token, 100)]); return { ok: !!t }; }
async function resetPassword(req, res) {
  const t = await db.one("SELECT * FROM tokens WHERE token=$1 AND kind='reset' AND used=false AND expires_at > now()", [clean(req.body.token, 100)]);
  if (!t) bad('This reset link has expired. Ask for a new one.');
  const pass = String(req.body.password || ''); pwRule(pass);
  await db.q('UPDATE users SET pass_hash=$2 WHERE id=$1', [t.user_id, await bcrypt.hash(pass, 10)]);
  await db.q("UPDATE tokens SET used=true WHERE user_id=$1 AND kind='reset'", [t.user_id]);
  await db.q('DELETE FROM sessions WHERE user_id=$1', [t.user_id]);
  const u = await db.one('SELECT * FROM users WHERE id=$1', [t.user_id]); loginFails.delete(String(u.email).toLowerCase());
  mail.t('pwchanged', u.id, { time: new Date().toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' ET', device: require('./util').uaLabel(req.get('user-agent')), location: req.get('cf-ipcountry') || req.get('x-vercel-ip-country') || 'Unknown', url: BASE() + '/forgot-password' });
  if (u.status === 'banned' || u.status === 'suspended') return { ok: true, relogin: true };
  // Anyone with two-step login (staff, and traders who turned it on) logs in again with their code: a reset link alone never skips the code
  if (u.mfa_on) return { ok: true, relogin: true };
  await startSession(req, res, u);
  return { ok: true };
}
async function sendVerify(u) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  await db.q("UPDATE tokens SET used=true WHERE user_id=$1 AND kind='verify' AND used=false", [u.id]);
  await db.q(`INSERT INTO tokens(token,user_id,kind,expires_at) VALUES($1,$2,'verify', now() + interval '30 minutes')`, ['V' + u.id + ':' + code, u.id]);
  await mail.sendT('confirm', u.email, { first_name: u.first, code, url: `${BASE()}/verify-email?code=${code}` }, { uid: u.id });
}
// The staff role an email is entitled to (ADMIN_EMAILS or an unexpired Team invite). Used up when given.
async function staffRoleFor(email) {
  email = String(email || '').toLowerCase();
  const adminEmails = (process.env.ADMIN_EMAILS || '').toLowerCase().split(',').map((x) => x.trim()).filter(Boolean);
  if (adminEmails.includes(email)) return 'admin';
  const invs = ((await db.one("SELECT v FROM kv WHERE k='store.team.invites'")) || {}).v || []; const inv = invs.find((x) => String(x.email).toLowerCase() === email && new Date(x.at) > new Date(Date.now() - 7 * 864e5));
  if (!inv || !['admin', 'support', 'risk', 'finance'].includes(inv.role)) return null;
  await db.q("UPDATE kv SET v=$1 WHERE k='store.team.invites'", [JSON.stringify(invs.filter((x) => x !== inv))]);
  return inv.role;
}
async function verifyEmail(req) {
  if (!req.user) bad('Log in first, then enter your code.', 401);
  const code = clean(req.body.code, 10).replace(/\D/g, '');
  const t = await db.one("SELECT * FROM tokens WHERE token=$1 AND kind='verify' AND used=false AND expires_at > now()", ['V' + req.user.id + ':' + code]);
  if (!t) { if (require('./mfa').bump('v' + req.user.id) >= 6) await db.q("UPDATE tokens SET used=true WHERE user_id=$1 AND kind='verify'", [req.user.id]); bad('That code is wrong or has expired. Send a new one.'); }
  const was = await db.one('SELECT verified FROM users WHERE id=$1', [t.user_id]);
  await db.q('UPDATE users SET verified=true WHERE id=$1', [t.user_id]);
  await db.q('UPDATE tokens SET used=true WHERE token=$1', [t.token]);
  if (was && !was.verified && req.user.role === 'trader') { const sr = await staffRoleFor(req.user.email); if (sr) await db.q('UPDATE users SET role=$2 WHERE id=$1', [t.user_id, sr]); }
  if (was && !was.verified) mail.t('welcome', t.user_id, { url: BASE() + '/checkout' });
  return { ok: true };
}
async function resendVerify(req) {
  const u = req.user; if (u.verified) return { ok: true, verified: true };
  await sendVerify(u);
  return { ok: true };
}
// Fixes a typo in the sign-up email before it is confirmed (keeps the same account instead of making a second one)
async function changeEmail(req) {
  const u = await db.one('SELECT * FROM users WHERE id=$1', [req.user.id]); if (u.verified) bad('Your email is already confirmed. Contact support to change it.');
  if (req.body.email != null && typeof req.body.email !== 'string') bad('Enter a valid email address.');
  const email = clean(req.body.email, 200).toLowerCase(); if (!emailOk(email)) bad('Enter a valid email address.');
  if (email === u.email) return resendVerify(req);
  if (await blockedReq(req, email)) bad('We could not use that email. Contact support if you think this is a mistake.');
  if (await db.one('SELECT 1 FROM users WHERE email=$1', [email])) bad('An account with this email already exists. Log in instead.');
  const nu = await db.one('UPDATE users SET email=$2 WHERE id=$1 AND verified=false RETURNING *', [u.id, email]); if (!nu) bad('Your email is already confirmed.');
  await sendVerify(nu); return { ok: true, email };
}
async function changePassword(req) {
  const u = await db.one('SELECT * FROM users WHERE id=$1', [req.user.id]);
  if (!(await bcrypt.compare(String(req.body.current || ''), u.pass_hash))) bad('Your current password is not right.');
  const pass = String(req.body.password || ''); pwRule(pass);
  if (await bcrypt.compare(pass, u.pass_hash)) bad('Your new password must be different from your current one.');
  await db.q('UPDATE users SET pass_hash=$2 WHERE id=$1', [u.id, await bcrypt.hash(pass, 10)]);
  await db.q('DELETE FROM sessions WHERE user_id=$1 AND token<>$2', [u.id, req.sess]);
  await db.q("UPDATE tokens SET used=true WHERE user_id=$1 AND kind='reset'", [u.id]);
  mail.t('pwchanged', u.id, { time: new Date().toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' ET', device: require('./util').uaLabel(req.get('user-agent')), location: req.get('cf-ipcountry') || req.get('x-vercel-ip-country') || 'Unknown', url: BASE() + '/forgot-password' });
  return { ok: true };
}
module.exports = { ipIn, netRule, normIp, parseCookies, refOf, blockedReq, loadUser, needUser, needStaff, staffOk, mfaLogin, startSession, needAdmin, signup, login, logout, forgot, resetPassword, resetCheck, verifyEmail, resendVerify, changeEmail, changePassword, STAFF, BASE };
