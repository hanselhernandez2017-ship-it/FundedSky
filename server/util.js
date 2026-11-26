const crypto = require('crypto');
const rid = (n = 24) => crypto.randomBytes(n).toString('base64url');
const money = (v) => '$' + Math.round(Number(v) || 0).toLocaleString('en-US');
const money2 = (v) => '$' + (Number(v) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const round2 = (v) => Math.round((Number(v) || 0) * 100) / 100;
const ET = 'America/New_York';
// trading date in ET: session opens 6 PM ET, so after 6 PM counts as next day
function tradeDate(d = new Date()) {
  const p = {}; new Intl.DateTimeFormat('en-US', { timeZone: ET, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit' }).formatToParts(d).forEach((x) => { p[x.type] = x.value; });
  let dt = new Date(Date.UTC(+p.year, +p.month - 1, +p.day));
  if (+p.hour % 24 >= 18) dt = new Date(dt.getTime() + 86400000);
  while ([0, 6].includes(dt.getUTCDay())) dt = new Date(dt.getTime() + 86400000);
  return dt.toISOString().slice(0, 10);
}
function etParts(d = new Date()) {
  const p = {}; new Intl.DateTimeFormat('en-US', { timeZone: ET, hour12: false, weekday: 'short', hour: '2-digit', minute: '2-digit' }).formatToParts(d).forEach((x) => { p[x.type] = x.value; });
  return { wd: p.weekday, h: +p.hour % 24, m: +p.minute };
}
const shortDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: ET }) : '');
const longDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: ET }) : '');
const dayLabel = (iso) => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
function ago(d) {
  if (!d) return ''; const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return 'Just now'; if (s < 3600) return Math.floor(s / 60) + ' min ago'; if (s < 86400) return Math.floor(s / 3600) + (s < 7200 ? ' hour ago' : ' hours ago');
  if (s < 172800) return 'Yesterday'; return shortDate(d);
}
const clean = (s, n = 500) => String(s == null ? '' : s).trim().slice(0, n);
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
const bad = (msg, status = 400) => { throw new HttpError(status, msg); };
// Short device name from a user agent, e.g. "Edge on Windows"; tools and scripts that are not browsers show as "Unknown Device"
const uaLabel = (ua) => { ua = String(ua || '');
  const b = /Edg(e|A|iOS)?\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\/|FxiOS/.test(ua) ? 'Firefox' : /Chrome\/|CriOS/.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : '';
  const o = /iPhone|iPad/.test(ua) ? 'iPhone' : /Android/.test(ua) ? 'Android' : /Mac OS/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : /CrOS/.test(ua) ? 'Chromebook' : /Linux/.test(ua) ? 'Linux' : '';
  return b && o ? `${b} on ${o}` : b || (o ? `Browser on ${o}` : 'Unknown Device'); };
module.exports = { uaLabel, rid, money, money2, round2, tradeDate, etParts, shortDate, longDate, dayLabel, ago, clean, emailOk, HttpError, bad, ET };
