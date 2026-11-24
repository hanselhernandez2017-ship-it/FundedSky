const bcrypt = require('bcryptjs');
const db = require('./db');
const mail = require('./mail');
const { rid, bad, clean, emailOk } = require('./util');
const COOKIE = 'fs_sess';
const BASE = () => process.env.PUBLIC_URL || 'http://localhost:' + (process.env.PORT || 3000);

function parseCookies(h) { const o = {}; (h || '').split(';').forEach((p) => { const i = p.indexOf('='); if (i > 0) o[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); }); return o; }
function setCookie(res, token, days = 30) {
  const secure = BASE().startsWith('https') ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${days * 86400}${secure}`);
}
async function startSession(req, res, user) {
  const token = rid(32);
  await db.q("INSERT INTO sessions(token,user_id,ua,ip,expires_at) VALUES($1,$2,$3,$4, now() + interval '30 days')", [token, user.id, clean(req.headers['user-agent'], 300), clean(req.ip, 80)]);
  await db.q('UPDATE users SET last_login=now() WHERE id=$1', [user.id]);
  setCookie(res, token);
}
async function loadUser(req, res, next) {
  const t = parseCookies(req.headers.cookie)[COOKIE];
  req.user = null; req.sess = null;
  if (t) {
    const r = await db.one('SELECT s.token, u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=$1 AND s.expires_at > now()', [t]);
    if (r && r.status !== 'banned') { req.user = r; req.sess = t; db.q('UPDATE sessions SET seen_at=now() WHERE token=$1', [t]).catch(() => {}); }
  }
  next();
}
const STAFF = ['admin', 'support', 'risk', 'finance'];
const needUser = (req, res, next) => (req.user ? next() : res.status(401).json({ error: 'Please log in' }));
const needStaff = (req, res, next) => (req.user && STAFF.includes(req.user.role) ? next() : res.status(403).json({ error: 'Staff only' }));
const needAdmin = (req, res, next) => (req.user && req.user.role === 'admin' ? next() : res.status(403).json({ error: 'Admins only' }));

async function makeToken(userId, kind, hours) {
  const t = rid(24);
  await db.q(`INSERT INTO tokens(token,user_id,kind,expires_at) VALUES($1,$2,$3, now() + ($4 || ' hours')::interval)`, [t, userId, kind, String(hours)]);
  return t;
}
async function signup(req, res) {
  const email = clean(req.body.email, 200).toLowerCase(); const pass = String(req.body.password || '');
  const first = clean(req.body.first, 60), last = clean(req.body.last, 60), country = clean(req.body.country, 60);
  if (!emailOk(email)) bad('Enter a valid email address');
  if (pass.length < 8) bad('Use at least 8 characters for your password');
  if (!first || !last) bad('Enter your first and last name');
  const rc = await db.one("SELECT v FROM kv WHERE k='list.countries'"); if (rc && (rc.v || []).some((c) => c.blocked && c.name === country)) bad('Funded Sky is not available in ' + country + ' yet.');
  if (await db.one('SELECT 1 FROM users WHERE email=$1', [email])) bad('An account with this email already exists. Log in instead.');
  const n = (await db.one("SELECT nextval('seq_tid') n")).n;
  let ref = null; const refCode = req.body.ref || parseCookies(req.headers.cookie).fs_ref; if (refCode) { const r = await db.one('SELECT id FROM users WHERE ref_code=$1', [clean(refCode, 40)]); ref = r ? r.id : null; }
  const adminEmails = (process.env.ADMIN_EMAILS || '').toLowerCase().split(',').map((x) => x.trim()).filter(Boolean);
  const role = adminEmails.includes(email) ? 'admin' : 'trader';
  const u = await db.one(`INSERT INTO users(tid,email,pass_hash,first,last,country,role,ref_code,referred_by,settings,agreements) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    ['T-' + n, email, await bcrypt.hash(pass, 10), first, last, country, role, 't' + n, ref,
      { nEmail: true, nSms: false, nPush: true, nNews: true, nMkt: false, nComp: true, mfaPay: true },
      { terms: new Date().toISOString(), privacy: new Date().toISOString(), risk: new Date().toISOString(), refund: new Date().toISOString() }]);
  await sendVerify(u);
  await startSession(req, res, u);
  return { ok: true, user: { email, first, role } };
}
async function login(req, res) {
  const email = clean(req.body.email, 200).toLowerCase();
  const u = await db.one('SELECT * FROM users WHERE email=$1', [email]);
  if (!u || !(await bcrypt.compare(String(req.body.password || ''), u.pass_hash))) bad('That email and password do not match', 401);
  if (u.status === 'banned') bad('This account is closed. Contact support.', 403);
  await startSession(req, res, u);
  return { ok: true, role: u.role };
}
async function logout(req, res) { if (req.sess) await db.q('DELETE FROM sessions WHERE token=$1', [req.sess]); res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; Max-Age=0`); return { ok: true }; }
async function forgot(req) {
  const email = clean(req.body.email, 200).toLowerCase();
  const u = await db.one('SELECT * FROM users WHERE email=$1', [email]);
  if (u) { const t = await makeToken(u.id, 'reset', 2); await mail.send(email, 'Reset your Funded Sky password', `Hi ${u.first},\n\nReset your password here:\n${BASE()}/reset-password?token=${t}\n\nThis link works for 2 hours. If you did not ask for this, ignore this email.`, 'reset'); }
  return { ok: true };
}
async function resetPassword(req, res) {
  const t = await db.one("SELECT * FROM tokens WHERE token=$1 AND kind='reset' AND used=false AND expires_at > now()", [clean(req.body.token, 100)]);
  if (!t) bad('This reset link has expired. Ask for a new one.');
  const pass = String(req.body.password || ''); if (pass.length < 8) bad('Use at least 8 characters for your password');
  await db.q('UPDATE users SET pass_hash=$2 WHERE id=$1', [t.user_id, await bcrypt.hash(pass, 10)]);
  await db.q('UPDATE tokens SET used=true WHERE token=$1', [t.token]);
  await db.q('DELETE FROM sessions WHERE user_id=$1', [t.user_id]);
  const u = await db.one('SELECT * FROM users WHERE id=$1', [t.user_id]);
  await startSession(req, res, u);
  return { ok: true };
}
async function sendVerify(u) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  await db.q("UPDATE tokens SET used=true WHERE user_id=$1 AND kind='verify' AND used=false", [u.id]);
  await db.q(`INSERT INTO tokens(token,user_id,kind,expires_at) VALUES($1,$2,'verify', now() + interval '30 minutes')`, ['V' + u.id + ':' + code, u.id]);
  await mail.send(u.email, `${code} is your Funded Sky code`, `Hi ${u.first},\n\nYour verification code is ${code}. It expires in 30 minutes.\n\nOr open this link while logged in:\n${BASE()}/verify-email?code=${code}`, 'verify');
}
async function verifyEmail(req) {
  if (!req.user) bad('Log in first, then enter your code', 401);
  const code = clean(req.body.code, 10).replace(/\D/g, '');
  const t = await db.one("SELECT * FROM tokens WHERE token=$1 AND kind='verify' AND used=false AND expires_at > now()", ['V' + req.user.id + ':' + code]);
  if (!t) bad('That code is wrong or has expired. Send a new one.');
  await db.q('UPDATE users SET verified=true WHERE id=$1', [t.user_id]);
  await db.q('UPDATE tokens SET used=true WHERE token=$1', [t.token]);
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
  const pass = String(req.body.password || ''); if (pass.length < 8) bad('Use at least 8 characters');
  await db.q('UPDATE users SET pass_hash=$2 WHERE id=$1', [u.id, await bcrypt.hash(pass, 10)]);
  await db.q('DELETE FROM sessions WHERE user_id=$1 AND token<>$2', [u.id, req.sess]);
  return { ok: true };
}
module.exports = { loadUser, needUser, needStaff, needAdmin, signup, login, logout, forgot, resetPassword, verifyEmail, resendVerify, changePassword, STAFF, BASE };
