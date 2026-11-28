// Two-step login for staff (required) and traders (optional): authenticator app codes (TOTP, RFC 6238) and one-time backup codes
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('./db');
const { bad, clean } = require('./util');

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const b32enc = (buf) => { let bits = '', out = ''; for (const b of buf) bits += b.toString(2).padStart(8, '0'); for (let i = 0; i + 5 <= bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5), 2)]; return out; };
const b32dec = (s) => { let bits = ''; for (const c of String(s).replace(/=+$/, '').toUpperCase()) { const v = B32.indexOf(c); if (v < 0) continue; bits += v.toString(2).padStart(5, '0'); } const out = []; for (let i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8), 2)); return Buffer.from(out); };
function totp(secret, step) { const c = Buffer.alloc(8); c.writeBigUInt64BE(BigInt(step)); const h = crypto.createHmac('sha1', b32dec(secret)).update(c).digest(); const o = h[h.length - 1] & 15;
  return String(((h.readUInt32BE(o) & 0x7fffffff) % 1e6)).padStart(6, '0'); }
const stepNow = () => Math.floor(Date.now() / 30000);
// Returns the time step the code belongs to (so it can be used only once), or false
function checkCode(secret, code) { code = String(code || '').replace(/\D/g, ''); if (code.length !== 6 || !secret) return false; const n = stepNow(); const hit = [n - 1, n, n + 1].find((s) => crypto.timingSafeEqual(Buffer.from(totp(secret, s)), Buffer.from(code))); return hit === undefined ? false : hit; }
// Marks a code's time step as used; false if this or a later code was already used (stops replays inside the 90-second window)
async function useStep(uid, step) { return !!(await db.one('UPDATE users SET mfa_step=$2 WHERE id=$1 AND COALESCE(mfa_step,0) < $2 RETURNING id', [uid, step])); }

// Wrong guesses per sign-in attempt and per person
const tries = new Map(); const bump = (k) => { const v = (tries.get(k) || 0) + 1; tries.set(k, v); setTimeout(() => tries.delete(k), 15 * 60000).unref(); return v; };

async function verify(user, code) {
  const step = checkCode(user.mfa_secret, code); if (step !== false) return useStep(user.id, step);
  const raw = String(code || '').replace(/[^a-z0-9]/gi, '').toLowerCase(); if (raw.length !== 10) return false;
  const list = user.mfa_backup || [];
  for (let i = 0; i < list.length; i++) if (await bcrypt.compare(raw, list[i])) { list.splice(i, 1); await db.q('UPDATE users SET mfa_backup=$2 WHERE id=$1', [user.id, JSON.stringify(list)]); return 'backup'; }
  return false;
}
// Second step of sign-in
async function challenge(ticket, code) {
  const t = await db.one("SELECT * FROM tokens WHERE token=$1 AND kind='mfa' AND used=false AND expires_at > now()", [clean(ticket, 100)]);
  if (!t) bad('Your login timed out. Enter your password again.', 401);
  const u = await db.one('SELECT * FROM users WHERE id=$1', [t.user_id]);
  const ok = await verify(u, code);
  if (!ok) { if (bump('t' + t.token) >= 5 || bump('u' + u.id) >= 10) await db.q('UPDATE tokens SET used=true WHERE token=$1', [t.token]); bad('That code is not right. Check the time on your phone and try again.', 401); }
  await db.q('UPDATE tokens SET used=true WHERE token=$1', [t.token]);
  return { user: u, backup: ok === 'backup', left: (u.mfa_backup || []).length };
}
async function setup(user) {
  const u = await db.one('SELECT mfa_on, mfa_secret FROM users WHERE id=$1', [user.id]); if (u.mfa_on) bad('Two-step login is already on.');
  // Reopening setup (a reload or a second tab) shows the same key, so a QR code already scanned keeps working
  let secret = u.mfa_secret; if (!secret) { secret = b32enc(crypto.randomBytes(20)); const w = await db.one('UPDATE users SET mfa_secret=$2 WHERE id=$1 AND mfa_secret IS NULL AND mfa_on=false RETURNING mfa_secret', [user.id, secret]); if (!w) secret = (await db.one('SELECT mfa_secret FROM users WHERE id=$1', [user.id])).mfa_secret; }
  const uri = `otpauth://totp/${encodeURIComponent('Funded Sky:' + user.email)}?secret=${secret}&issuer=${encodeURIComponent('Funded Sky')}&digits=6&period=30`;
  const qr = await require('qrcode').toString(uri, { type: 'svg', margin: 1, color: { dark: '#111113', light: '#FFFFFF' } });
  return { secret: secret.replace(/(.{4})/g, '$1 ').trim(), uri, qr };
}
async function enable(user, sess, code) {
  const u = await db.one('SELECT * FROM users WHERE id=$1', [user.id]); if (u.mfa_on) bad('Two-step login is already on.'); if (u.role === 'trader') tooMany(u.id);
  const step = checkCode(u.mfa_secret, code); if (step === false || !(await useStep(u.id, step))) { bump('u' + u.id); bad(step === false ? 'That code is not right. Check the time on your phone and try again.' : 'That code was just used. Wait for the next one.'); }
  const trader = u.role === 'trader'; const codes = await newCodes(u.id, trader ? 10 : 8, true);
  await db.q('UPDATE sessions SET mfa=true WHERE token=$1', [sess]); await db.q('DELETE FROM sessions WHERE user_id=$1 AND token<>$2', [u.id, sess]);
  require('./mail').t('twofa', u.id, { url: require('./auth').BASE() + (trader ? '/app#settings?tab=security' : '/admin') });
  if (trader) await require('./core').audit(u.id, 'user.mfa_on', u.tid, {});
  return { codes };
}
// One-time backup codes (shown once, kept hashed). Traders get 10, staff 8.
async function newCodes(uid, n, on) {
  const AB = 'abcdefghjkmnpqrstuvwxyz23456789'; const codes = Array.from({ length: n }, () => Array.from({ length: 10 }, () => AB[crypto.randomInt(AB.length)]).join('')); // no 0/o, 1/l/i to mix up
  await db.q(`UPDATE users SET ${on ? 'mfa_on=true, ' : ''}mfa_backup=$2 WHERE id=$1`, [uid, JSON.stringify(await Promise.all(codes.map((c) => bcrypt.hash(c, 8))))]);
  return codes.map((c) => c.slice(0, 5) + '-' + c.slice(5));
}
// Trader Settings > Security: a wrong code or password counts toward the same 10-per-15-minutes limit as the code step of logging in
const tooMany = (uid) => { if ((tries.get('u' + uid) || 0) >= 10) bad('Too many wrong tries. Wait 15 minutes and try again.', 429); };
const when = () => new Date().toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' ET';
async function turnOff(user, password, code) {
  const u = await db.one('SELECT * FROM users WHERE id=$1', [user.id]); if (u.role !== 'trader') bad('Staff accounts keep Two-Step Login on. Ask an admin to reset it.', 403); if (!u.mfa_on) bad('Two-Step Login is already off.');
  tooMany(u.id); if (!(await bcrypt.compare(String(password || ''), u.pass_hash))) { bump('u' + u.id); bad('Your password is not right.'); }
  if (!(await verify(u, code))) { bump('u' + u.id); bad('That code is not right. Check the time on your phone and try again.'); }
  await db.q('UPDATE users SET mfa_on=false, mfa_secret=NULL, mfa_backup=NULL WHERE id=$1', [u.id]);
  require('./mail').t('twofaoff', u.id, { time: when(), by: 'You', url: require('./auth').BASE() + '/forgot-password' });
  await require('./core').audit(u.id, 'user.mfa_off', u.tid, {}); return { ok: true };
}
async function regen(user, code) {
  const u = await db.one('SELECT * FROM users WHERE id=$1', [user.id]); if (!u.mfa_on) bad('Turn on Two-Step Login first.'); tooMany(u.id);
  if (!(await verify(u, code))) { bump('u' + u.id); bad('That code is not right. Check the time on your phone and try again.'); }
  await db.q('UPDATE sessions SET bknote=false WHERE user_id=$1', [u.id]); // new codes: the "You used a backup code" notice has done its job
  return { codes: await newCodes(u.id, u.role === 'trader' ? 10 : 8) };
}
// Back office reset for a trader who lost their phone: off, logged out everywhere, told by email
async function resetTrader(uid) { await reset(uid); require('./mail').t('twofaoff', uid, { time: when(), by: 'Funded Sky Support', url: require('./auth').BASE() + '/forgot-password' }); }
async function reset(uid) { await db.q('UPDATE users SET mfa_on=false, mfa_secret=NULL, mfa_backup=NULL, mfa_step=0 WHERE id=$1', [uid]); await db.q('DELETE FROM sessions WHERE user_id=$1', [uid]); }

module.exports = { totp, checkCode, challenge, setup, enable, reset, b32enc, stepNow, bump, turnOff, regen, resetTrader };
