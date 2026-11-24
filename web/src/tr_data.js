  // ===== trader data: loaded from the API (window.__FS), same shapes the pages were designed around =====
  const FS = window.__FS;
  const ME = FS.ME;
  const PLANS = FS.PLANS;
  const RULESET = FS.RULESET;
  const RULE_ALL = FS.RULE_ALL;
  const ADDONS = FS.ADDONS;
  const planOf = (id) => PLANS.find((p) => p.id === id) || { id, n: id, sizes: [], plats: [], addons: [], act: {} };
  const priceOf = (pid, size) => (planOf(pid).sizes.find((z) => z[0] === size) || [])[1] || 0;
  const resetFee = (pid, size) => Math.round(priceOf(pid, size) * (RULE_ALL.resetPct || 55) / 100);
  const actFee = (pid, size) => (planOf(pid).act || {})[size] || 0;
  const PROMOS = FS.PROMOS;
  const PROMO = PROMOS.find((p) => p.live) || null;
  const BUNDLES = FS.BUNDLES;
  const ACC = FS.ACC;
  const HIST = FS.HIST;
  const INSTR = ['NQ', 'ES', 'MNQ', 'MES', 'CL', 'GC'];
  const RNG = (seed) => { let x = Math.sin(seed * 999) * 10000; return () => { x = Math.sin(x) * 10000; return x - Math.floor(x); }; };
  const DAYS = FS.DAYS.map((d) => ({ d: new Date(d.iso + 'T12:00:00'), iso: d.iso, pnl: d.pnl, n: d.n }));
  const TRADES = FS.TRADES;
  const isoOf = (dt) => (dt instanceof Date ? dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0') : String(dt).slice(0, 10));
  // trades for a day (journal) or the latest for an account
  const tradesOn = (day, acct) => TRADES.filter((t) => t.day === isoOf(day) && (!acct || acct === 'all' || t.acct === acct));
  const recentTrades = (acct, n) => TRADES.filter((t) => t.acct === acct).slice(-n).reverse();
  const PAYOUTS = FS.PAYOUTS;
  const ORDERS = FS.ORDERS;
  const NOTES = FS.NOTES;
  const COURSES = FS.COURSES;
  const LESSONS = FS.LESSONS;
  const REWARDS = FS.REWARDS;
  const EARN = FS.EARN;
  const PTS_LOG = FS.PTS_LOG;
  const CERTS = FS.CERTS;
  const LB = FS.LB;
  const COMPS = FS.COMPS;
  const CPRIZES = FS.CPRIZES;
  const ARTICLES = FS.ARTICLES;
  const TOPICS = FS.TOPICS;
  const TICKETS = FS.TICKETS;
  const SESS = FS.SESS;
  const AGREE = FS.AGREE;
  const NEWS = FS.NEWS;
  const PLANRULES = FS.PLANRULES;
  const METHODS = FS.METHODS;
  const COUPONS = FS.COUPONS;
  const CAPS = FS.caps;
  const PLAN_SHORT = (pid) => (planOf(pid).short || planOf(pid).n);
  // API helper: every mutation goes to the server, then the page reloads its data
  async function API(path, body, method) {
    const r = await fetch(path, { method: method || (body ? 'POST' : 'GET'), headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined, credentials: 'same-origin' });
    let j = {}; try { j = await r.json(); } catch (e) { /* no body */ }
    if (r.status === 401) { location.href = '/login?next=' + encodeURIComponent(location.pathname + location.search); throw new Error('Please log in'); }
    if (!r.ok) throw new Error(j.error || 'Something went wrong. Try again.');
    return j;
  }
