// One-off: pull static content lists out of the prototype data file into server/content-seed.json
const fs = require('fs'); const vm = require('vm');
const src = fs.readFileSync(__dirname + '/../web/src/tr_data.js', 'utf8');
const names = ['COURSES', 'LESSONS', 'REWARDS', 'EARN', 'ARTICLES', 'TOPICS', 'NEWS', 'COMPS', 'CPRIZES'];
const code = src + '\n;__out = {' + names.map((n) => n + ':' + n).join(',') + '};';
const ctx = { __out: null, Math, Date, Object, String, Number, Array, JSON }; vm.createContext(ctx); vm.runInContext(code, ctx);
const o = JSON.parse(JSON.stringify(ctx.__out));
o.COURSES = o.COURSES.map((c) => { const { done, ...r } = c; return r; });
const fix = (s) => typeof s === 'string' ? s.replace(/\[Plan A Name\]/g, 'Essential').replace(/\[Plan B Name\]/g, 'Prime').replace(/\[Plan C Name\]/g, 'Instant').replace(/\[X\]/g, '5') : s;
const deep = (v) => Array.isArray(v) ? v.map(deep) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deep(x)])) : fix(v);
const out = deep(o);
// competitions: no live competition engine yet, so only upcoming events with no fabricated entrants or winners
out.COMPS = out.COMPS.filter((c) => c.st === 'upcoming').map((c) => ({ ...c, players: 0, entry: 'Free' }));
fs.writeFileSync(__dirname + '/../server/content-seed.json', JSON.stringify({ courses: out.COURSES, lessons: out.LESSONS, rewards: out.REWARDS, earn: out.EARN, articles: out.ARTICLES, topics: out.TOPICS, news: out.NEWS, competitions: out.COMPS, cprizes: out.CPRIZES, leaderboard: [] }, null, 1));
console.log(Object.keys(out).map((k) => k + ':' + (out[k].length ?? Object.keys(out[k]).length)).join(' '));
