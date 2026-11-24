  const ME = '[Your Name]';
  const rng = (seed) => { let h = 2166136261; for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; }; };
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const N = 730; const NOWH = 18;
  const dateOf = (i) => new Date(2026, 10, 22 - (N - 1 - i));
  const fmtD = (d, y) => `${MON[d.getMonth()]} ${d.getDate()}${y ? ', ' + d.getFullYear() : ''}`;
  const PLAN = { pa: ['[Plan A Name]', 'One-Time'], pb: ['[Plan B Name]', 'One-Time'], pc: ['[Plan C Name]', 'Monthly'] };
  const PRICE = { 25000: 99, 50000: 149, 100000: 249, 150000: 349 };
  const SKUS = [['pa', 25000, 0.14], ['pa', 50000, 0.14], ['pb', 50000, 0.2], ['pb', 100000, 0.2], ['pb', 150000, 0.08], ['pc', 25000, 0.08], ['pc', 50000, 0.1], ['pc', 100000, 0.06]];
  const CH = [['organic', 'Search, Unpaid', 0.26, 1.0], ['paid', 'Search Ads', 0.16, 0.9], ['social', 'Social Media', 0.14, 0.7], ['youtube', 'YouTube', 0.1, 1.0], ['aff', 'Affiliates', 0.14, 1.5], ['email', 'Email', 0.05, 1.8], ['direct', 'Direct', 0.11, 1.3], ['discord', 'Discord Communities', 0.04, 1.2]];
  const LAUNCH_C = N - 1 - 285; // Feb 10 2026
  const PROMOS = [[N - 1 - 359, 4, 'Black Friday Sale', 0.35, 2.6], [N - 1 - 245, 3, 'Spring Sale', 0.25, 1.7], [N - 1 - 140, 4, 'Summer Sale', 0.3, 1.9], [N - 1 - 32, 2, 'Halloween Sale', 0.2, 1.5]];
  const NOTES = [[LAUNCH_C, '[Plan C Name] Launched'], ...PROMOS.map((p) => [p[0], p[2]]), [N - 1 - 75, 'New Checkout Page'], [N - 1 - 12, 'Affiliate Program Update']];
  const promoAt = (i) => PROMOS.find((p) => i >= p[0] && i < p[0] + p[1]);

  const D = (() => { const r = rng('analytics'); const out = [];
    for (let i = 0; i < N; i++) {
      const dt = dateOf(i); const t = i / (N - 1); const dow = [0.72, 1.08, 1.06, 1.04, 1.02, 0.98, 0.7][dt.getDay()];
      const pr = promoAt(i); const lift = pr ? pr[4] : 1; const disc = 0.11 + (pr ? pr[3] : 0) + (r() - 0.5) * 0.02;
      const growth = 0.42 + 0.58 * Math.pow(t, 1.15);
      const vis = Math.round(1180 * growth * dow * (pr ? 1 + (lift - 1) * 0.6 : 1) * (0.9 + r() * 0.2));
      const signups = Math.round(vis * 0.05 * (0.9 + r() * 0.2) * (pr ? 1.15 : 1));
      const ordersT = Math.max(1, Math.round(signups * 0.46 * (pr ? 1.5 : 1) * (0.88 + r() * 0.24) * (i > N - 76 ? 1.06 : 1)));
      const w = SKUS.map(([p, , wt]) => (p === 'pc' && i < LAUNCH_C ? 0 : wt)); const ws = w.reduce((a, b) => a + b, 0);
      const sku = w.map((x) => Math.round(ordersT * x / ws * (0.85 + r() * 0.3)));
      const orders = sku.reduce((a, b) => a + b, 0);
      const gross = sku.reduce((s, c, k) => s + c * PRICE[SKUS[k][1]], 0);
      const chv = CH.map((c) => Math.round(vis * c[2] * (0.85 + r() * 0.3) * (c[0] === 'aff' && pr ? 1.4 : 1)));
      const chw = CH.map((c, k) => chv[k] * c[3]); const chs = chw.reduce((a, b) => a + b, 0);
      const cho = chw.map((x) => Math.round(orders * x / chs));
      out.push({ i, dt, vis, signups, sku, orders, gross, disc, discAmt: Math.round(gross * disc), checkout: Math.round(orders * (1.5 + r() * 0.15)),
        refunds: Math.round(orders * 0.024 * (0.6 + r() * 0.8)), cbs: r() < orders * 0.005 ? 1 : 0, resets: Math.round(orders * 0.14 * (0.7 + r() * 0.6)),
        breaches: Math.round(orders * 0.66 * (0.8 + r() * 0.4)), chv, cho, promo: pr ? pr[2] : '' });
    }
    out.forEach((d, i) => { const back = out.slice(Math.max(0, i - 40), Math.max(1, i - 10)); const avg = back.reduce((s, x) => s + x.orders, 0) / Math.max(1, back.length); const r = rng('p' + i);
      d.passes = Math.round(avg * 0.205 * (0.75 + r() * 0.5)); d.funded = Math.round(d.passes * (0.82 + r() * 0.1));
      const b2 = out.slice(Math.max(0, i - 60), Math.max(1, i - 30)); const avg2 = b2.reduce((s, x) => s + x.orders, 0) / Math.max(1, b2.length);
      d.payN = Math.round(avg2 * 0.072 * (0.6 + r() * 0.8)); d.payAmt = Math.round(d.payN * (950 + r() * 900));
      const pc30 = out.slice(Math.max(0, i - 30), i).reduce((s, x) => s + x.sku[5] * 99 + x.sku[6] * 149 + x.sku[7] * 249, 0);
      d.renew = Math.round(pc30 * 0.5 / 30 * (0.9 + r() * 0.2));
      d.net = d.gross - d.discAmt; d.resetRev = Math.round(d.resets * 79 * (1 - d.disc * 0.5)); d.refundAmt = Math.round(d.refunds * (d.orders ? d.net / d.orders : 150)); d.cbAmt = d.cbs * 249;
      d.spend = Math.round(d.chv[1] * 1.85 + d.chv[2] * 0.35 + (d.dt.getDay() === 1 ? 2400 : 0) + d.chv[7] * 0.4);
    });
    return out; })();

  const COUNTRIES = [['United States', 0.34, 1.0, 168, 0.022], ['United Kingdom', 0.08, 1.05, 172, 0.02], ['India', 0.07, 0.62, 118, 0.031], ['Canada', 0.06, 1.02, 165, 0.019], ['Germany', 0.05, 1.04, 176, 0.017], ['Australia', 0.04, 1.08, 181, 0.021], ['Nigeria', 0.04, 0.55, 112, 0.044], ['Brazil', 0.04, 0.7, 126, 0.035], ['Mexico', 0.03, 0.78, 131, 0.029], ['UAE', 0.03, 1.15, 214, 0.016], ['Philippines', 0.03, 0.66, 109, 0.033], ['Spain', 0.02, 0.92, 158, 0.021], ['Netherlands', 0.02, 1.06, 171, 0.015], ['Poland', 0.02, 0.88, 149, 0.024], ['Everywhere Else', 0.13, 0.8, 141, 0.027]];
  const PLATS = [['Tradovate', 0.38, 0.22], ['NinjaTrader', 0.24, 0.21], ['TradingView', 0.22, 0.19], ['Rithmic', 0.16, 0.24]];
  const BREACH = [['Daily Loss Limit', 0.44, 'Lost more than the daily limit in one session'], ['Max Drawdown', 0.33, 'Balance fell below the trailing floor'], ['Consistency Rule', 0.09, 'One day made too much of the profit'], ['Inactive for 30 Days', 0.06, 'No trades for 30 days'], ['Over the Contract Limit', 0.05, 'Opened more contracts than the size allows'], ['Prohibited Strategy', 0.03, 'Hedging, copy trading or similar']];
  const CODES = [['SKYHIGH', 'Affiliate', 0.2], ['BLACKFRIDAY', 'Sale', 0.35], ['WELCOME10', 'New Customer', 0.1], ['RESET50', 'Reset After Breach', 0.5], ['SUMMER30', 'Sale', 0.3], ['NQKING', 'Affiliate', 0.2], ['COMEBACK25', 'Win-Back Email', 0.25]];
  const AFFS = [['TRADEWITHSAM', '[Affiliate 1]', 'YouTube', 0.28], ['NQKING', '[Affiliate 2]', 'Discord', 0.19], ['FUTURESDAILY', '[Affiliate 3]', 'Newsletter', 0.15], ['SKYHIGH', '[Affiliate 4]', 'X and Instagram', 0.12], ['SCALPERJOE', '[Affiliate 5]', 'Twitch', 0.09], ['CHARTGIRL', '[Affiliate 6]', 'TikTok', 0.07], ['Others', '38 smaller affiliates', 'Mixed', 0.1]];
  const CAMPAIGNS = [['black-friday-2026-teaser', 'Email', 'Black Friday Teaser', 0.06, 2.4], ['brand-search', 'Search Ads', 'Brand Search', 0.18, 1.6], ['prop-firm-keywords', 'Search Ads', 'Prop Firm Keywords', 0.22, 0.8], ['reels-funded-stories', 'Social Media', 'Funded Trader Stories', 0.14, 0.7], ['yt-sponsor-oct', 'YouTube', 'Channel Sponsorships', 0.16, 1.1], ['winback-breached', 'Email', 'Win-Back After Breach', 0.04, 2.9], ['discord-ama', 'Discord Communities', 'Community AMAs', 0.05, 1.3], ['retarget-checkout', 'Social Media', 'Checkout Retargeting', 0.15, 1.9]];
  const REPORTS = [
    { id: 'R1', n: 'Weekly Revenue', m: 'revenue', g: 'week', c: 'bar', range: 90, owner: ME, sched: 'Mondays 8:00 AM to the founders' },
    { id: 'R2', n: 'Monthly Board Report', m: 'net', g: 'month', c: 'bar', range: 365, owner: ME, sched: '1st of the month, PDF' },
    { id: 'R3', n: 'Sales by Plan', m: 'orders', g: 'plan', c: 'bar', range: 30, owner: '[Finance]', sched: '' },
    { id: 'R4', n: 'Affiliate Sales', m: 'revenue', g: 'channel', c: 'table', range: 30, owner: '[Marketing]', sched: 'Fridays 5:00 PM to [Marketing]' },
    { id: 'R5', n: 'Pass Rate by Week', m: 'passrate', g: 'week', c: 'line', range: 90, owner: '[Risk Reviewer]', sched: '' },
    { id: 'R6', n: 'Refunds by Country', m: 'refunds', g: 'country', c: 'table', range: 90, owner: '[Support Lead]', sched: '' }];
  const GOALS = [{ k: 'revenue', n: 'Revenue', t: 165000, f: 'money' }, { k: 'orders', n: 'Evaluations Sold', t: 1000, f: 'num' }, { k: 'conv', n: 'Visitor to Buyer', t: 2.3, f: 'pct' }, { k: 'refundRate', n: 'Refund Rate Below', t: 3, f: 'pct', inv: true }, { k: 'payoutRatio', n: 'Payouts as Share of Revenue Below', t: 55, f: 'pct', inv: true }, { k: 'signups', n: 'New Sign-Ups', t: 1700, f: 'num' }];
