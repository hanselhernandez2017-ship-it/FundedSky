// Support ticket attachments. Kept in Postgres (Railway's disk does not survive a deploy): up to 3 per message, 5 MB each,
// PNG, JPEG, WebP, GIF or PDF only. The type comes from the file's first bytes, never from its name or the browser.
// An upload is held for its owner until it is sent with a message (unsent ones are removed after a day).
// Files are served only to the ticket's trader and to staff, from /api/files/<key>, with a strict CSP.
const crypto = require('crypto');
const db = require('./db');
const { bad } = require('./util');

const MAX = 5 * 1024 * 1024; const PER_MSG = 3;
const TYPES = { png: ['image/png', ['png']], jpeg: ['image/jpeg', ['jpg', 'jpeg']], webp: ['image/webp', ['webp']], gif: ['image/gif', ['gif']], pdf: ['application/pdf', ['pdf']] };
// What the first bytes say the file is (null: not a type we take)
function sniff(b) {
  if (!b || b.length < 12) return null;
  if (b.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg';
  if (b.slice(0, 4).toString('latin1') === 'RIFF' && b.slice(8, 12).toString('latin1') === 'WEBP') return 'webp';
  if (/^GIF8[79]a$/.test(b.slice(0, 6).toString('latin1'))) return 'gif';
  if (b.slice(0, 5).toString('latin1') === '%PDF-') return 'pdf';
  return null;
}
// A safe display name: no folders, no control or quote characters, at most 120 characters, keeping the extension
function safeName(n) {
  let s = String(n || ''); try { s = decodeURIComponent(s); } catch (e) { /* keep as sent */ }
  s = s.split(/[\\/]/).pop().replace(/[\u0000-\u001f\u007f"<>:*?|]/g, '').replace(/^\.+/, '').replace(/\s+/g, ' ').trim();
  if (s.length > 120) { const m = /\.[a-z0-9]{1,5}$/i.exec(s); s = s.slice(0, 120 - (m ? m[0].length : 0)) + (m ? m[0] : ''); }
  return s || 'file';
}
const ALLOWED = 'Attach a PNG, JPG, WebP or GIF image, or a PDF.';
async function upload(user, buf, rawName) {
  if (!Buffer.isBuffer(buf) || !buf.length) bad('That file is empty. ' + ALLOWED);
  if (buf.length > MAX) bad('That file is larger than 5 MB. Make it smaller and try again.', 413);
  const name = safeName(rawName); const ext = (/\.([a-z0-9]+)$/i.exec(name) || [])[1]; const kind = sniff(buf);
  if (!kind || /^(svg|html?|xml|xhtml)$/i.test(ext || '')) bad('We cannot take this type of file. ' + ALLOWED, 415);
  if (!ext || !TYPES[kind][1].includes(ext.toLowerCase())) bad(`This file's name does not match what is inside it. ${ALLOWED}`, 415);
  await db.q("DELETE FROM ticket_files WHERE msg_id IS NULL AND created_at < now() - interval '1 day'");
  const held = (await db.one('SELECT count(*)::int n FROM ticket_files WHERE owner_id=$1 AND msg_id IS NULL', [user.id])).n; if (held >= (user.role === 'trader' ? 12 : 60)) bad('You have too many files waiting to be sent. Send your message or remove some files first.', 429);
  const key = crypto.randomBytes(16).toString('hex'); const sha = crypto.createHash('sha256').update(buf).digest('hex');
  await db.q('INSERT INTO ticket_files(key,owner_id,name,mime,size,sha256,data) VALUES($1,$2,$3,$4,$5,$6,$7)', [key, user.id, name, TYPES[kind][0], buf.length, sha, buf]);
  return { id: key, name, mime: TYPES[kind][0], size: buf.length };
}
async function remove(user, key) { await db.q('DELETE FROM ticket_files WHERE key=$1 AND owner_id=$2 AND msg_id IS NULL', [String(key || ''), user.id]); return { ok: true }; }
// Ties the uploads named in a message to it. Only the sender's own unsent uploads count; anything else is refused.
async function attach(c, user, ticketId, msgId, ids) {
  if (ids == null) return 0; if (!Array.isArray(ids)) bad('Attach your files again.');
  const keys = [...new Set(ids.map(String))].filter((x) => /^[a-f0-9]{32}$/.test(x)); if (keys.length !== ids.length) bad('One of your files is no longer available. Attach it again.');
  if (keys.length > PER_MSG) bad(`Attach up to ${PER_MSG} files to one message.`);
  if (!keys.length) return 0;
  const r = await c.q('UPDATE ticket_files SET ticket_id=$3, msg_id=$4 WHERE key = ANY($1) AND owner_id=$2 AND msg_id IS NULL', [keys, user.id, ticketId, msgId]);
  if (r.rowCount !== keys.length) bad('One of your files is no longer available. Attach it again.');
  return keys.length;
}
const fileIds = (b) => (b && b.files != null ? b.files : null);
// File details (never the bytes) for the messages of some tickets: { msgId: [{ id, name, mime, size }] }; a file removed by the
// 6-month rule is { gone: true }. opt.trader: files on internal notes are left out (the trader never sees those).
async function forTickets(ticketIds, opt = {}) {
  if (!ticketIds.length) return {}; const rows = await db.all(`SELECT f.key, f.msg_id, f.name, f.mime, f.size, f.removed_at FROM ticket_files f JOIN ticket_msgs m ON m.id=f.msg_id WHERE f.ticket_id = ANY($1)${opt.trader ? ' AND m.internal=false' : ''} ORDER BY f.id`, [ticketIds]);
  const out = {}; rows.forEach((f) => { (out[f.msg_id] = out[f.msg_id] || []).push(f.removed_at ? { gone: true } : { id: f.key, name: f.name, mime: f.mime, size: f.size }); }); return out;
}
// Retention (owner decision, Nov 27): files on tickets solved more than 6 months ago are deleted. The messages stay, and each
// file leaves a marker so the thread can say "File removed after 6 months." A ticket reopened before then has no solved_at, so it keeps its files.
const KEEP_MONTHS = 6;
async function prune() {
  const r = await db.q(`UPDATE ticket_files f SET data=''::bytea, name='', size=0, sha256='', removed_at=now() FROM tickets t WHERE t.id=f.ticket_id AND f.msg_id IS NOT NULL AND f.removed_at IS NULL
    AND t.status='solved' AND t.solved_at < now() - ($1 || ' months')::interval`, [String(KEEP_MONTHS)]);
  return r.rowCount;
}
// GET /api/files/:key. Anyone else (another trader, a logged-out visitor, a bad key) gets the same 404.
async function serve(req, res) {
  const nf = () => res.status(404).set('Cache-Control', 'no-store').json({ error: 'File not found' });
  const key = String(req.params.key || ''); if (!req.user || !/^[a-f0-9]{32}$/.test(key)) return nf();
  const f = await db.one('SELECT f.*, t.user_id AS tuser, m.internal FROM ticket_files f LEFT JOIN tickets t ON t.id=f.ticket_id LEFT JOIN ticket_msgs m ON m.id=f.msg_id WHERE f.key=$1', [key]); if (!f || f.removed_at) return nf();
  const staff = require('./auth').staffOk(req.user);
  const ok = f.msg_id ? staff || (f.tuser === req.user.id && !f.internal) : f.owner_id === req.user.id; if (!ok) return nf();
  if (!Object.values(TYPES).some((t) => t[0] === f.mime)) return nf();
  const inline = f.mime !== 'application/pdf' && req.query.dl !== '1';
  res.set({ 'Content-Type': f.mime, 'Content-Length': String(f.data.length), 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox; frame-ancestors 'none'",
    'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${f.name.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(f.name)}`,
    'Cache-Control': 'private, max-age=300', 'Cross-Origin-Resource-Policy': 'same-origin', 'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY', ETag: '"' + f.sha256 + '"' });
  res.end(f.data);
}
module.exports = { MAX, PER_MSG, KEEP_MONTHS, sniff, safeName, upload, remove, attach, fileIds, forTickets, prune, serve };
