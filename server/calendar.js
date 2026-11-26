// Market holiday calendar in Eastern Time, CME Globex style for equity index futures: full closes and early closes.
// Built from the holiday rules for any year, so the current and next year are always covered. One list feeds both the
// engine's market-open check (sim.marketOpen) and the trader app's hours popup and market clock.
// closed: no session for that date (shut from 5:00 PM ET the day before until 6:00 PM ET that day).
// early: trading stops at `at` (ET) and the next session opens at 6:00 PM ET, weekends aside.
const iso = (y, m, d) => new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10);
const dow = (y, m, d) => new Date(Date.UTC(y, m, d)).getUTCDay();
const nth = (y, m, wd, n) => { const first = dow(y, m, 1); return 1 + ((wd - first + 7) % 7) + (n - 1) * 7; };
const lastWd = (y, m, wd) => { const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate(); return days - ((dow(y, m, days) - wd + 7) % 7); };
// A fixed-date holiday on a weekend is kept on the nearest weekday (Saturday: the Friday before, Sunday: the Monday after)
const observed = (y, m, d) => { const w = dow(y, m, d); return w === 6 ? d - 1 : w === 0 ? d + 1 : d; };
const obs = (y, m, d, n) => n + (observed(y, m, d) !== d ? ' (Observed)' : '');
function easter(y) { const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451); const mo = Math.floor((h + l - 7 * m + 114) / 31) - 1; return [mo, ((h + l - 7 * m + 114) % 31) + 1]; }
function holidays(y) {
  const out = []; const add = (m, d, n, t, at) => out.push(Object.assign({ d: iso(y, m, d), n, t }, at ? { at } : {}));
  const ny = dow(y, 0, 1); if (ny !== 6) add(0, ny === 0 ? 2 : 1, "New Year's Day" + (ny === 0 ? ' (Observed)' : ''), 'closed'); // on a Saturday the markets keep normal hours
  add(0, nth(y, 0, 1, 3), 'Martin Luther King Jr. Day', 'early', '13:00');
  add(1, nth(y, 1, 1, 3), "Presidents' Day", 'early', '13:00');
  const [em, ed] = easter(y); add(em, ed - 2, 'Good Friday', 'closed');
  add(4, lastWd(y, 4, 1), 'Memorial Day', 'early', '13:00');
  add(5, observed(y, 5, 19), obs(y, 5, 19, 'Juneteenth'), 'early', '13:00');
  const j4 = dow(y, 6, 4); if (j4 >= 2 && j4 <= 5) add(6, 3, 'Day Before Independence Day', 'early', '13:15'); else if (j4 === 6) add(6, 2, 'Day Before Independence Day', 'early', '13:15');
  add(6, observed(y, 6, 4), obs(y, 6, 4, 'Independence Day'), 'early', '13:00');
  add(8, nth(y, 8, 1, 1), 'Labor Day', 'early', '13:00');
  const tg = nth(y, 10, 4, 4); add(10, tg, 'Thanksgiving', 'early', '13:00'); add(10, tg + 1, 'Day After Thanksgiving', 'early', '13:15');
  const xm = dow(y, 11, 25); if (xm >= 2 && xm <= 5) add(11, 24, 'Christmas Eve', 'early', '13:15');
  add(11, observed(y, 11, 25), obs(y, 11, 25, 'Christmas Day'), 'closed');
  return out.sort((a, b) => a.d.localeCompare(b.d));
}
const CACHE = {};
// The current and next year (ET), as [{ d: 'YYYY-MM-DD', n: name, t: 'closed' | 'early', at: 'HH:MM' }]
function calendar(now = new Date()) { const y = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric' }).format(now)); return CACHE[y] || (CACHE[y] = holidays(y).concat(holidays(y + 1))); }
// Is the market shut for a holiday at this ET moment? date: 'YYYY-MM-DD' (ET), h and m: ET clock
function holidayShut(date, h, m, cal) {
  cal = cal || calendar(new Date(date + 'T12:00:00Z'));
  const next = new Date(new Date(date + 'T12:00:00Z').getTime() + 864e5).toISOString().slice(0, 10); const session = h >= 18 ? next : date;
  return cal.some((x) => (x.t === 'closed' ? x.d === session : x.d === date && h < 18 && h * 60 + m >= Number(x.at.slice(0, 2)) * 60 + Number(x.at.slice(3))));
}
module.exports = { holidays, calendar, holidayShut };
