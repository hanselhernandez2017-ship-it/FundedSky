    const money = (v) => '$' + Math.round(v).toLocaleString();
    const signed = (v) => (v > 0 ? '+' : v < 0 ? '−' : '') + '$' + Math.abs(Math.round(v)).toLocaleString();
    const kLabel = { evaluation: 'Evaluation', funded: 'Funded', breached: 'Breached' };
    const accounts = [
      { key: 'a1', kind: 'evaluation', short: '100K', plan: '[Plan B Name]', id: 'FS-100K-4821', bal: 102140, start: 100000, target: 106000, floor: 97000, today: 640, lo: 101320, hi: 102480, seed: 11, drift: 0.22,
        readTag: 'On Track', readC: '#5FD39B', readSub: 'Evaluation, day 4 of 5 minimum',
        readH: 'Four Green Days. One Day From the Minimum.', readP: 'You have traded four of the five required days and stayed well inside your limits. Keep size the same and the target is in reach this week.',
        needL: 'Left to the profit target', needV: '$3,860', stats: [['Win Rate', '62%'], ['Best Day', '+$1,240'], ['Days', '4 of 5']],
        rules: [['Profit target', 0], ['Minimum days', 0], ['Daily loss limit', 1], ['Max drawdown', 1], ['Consistency', 1], ['News rule', 1]] },
      { key: 'a2', kind: 'evaluation', short: '50K', plan: '[Plan A Name]', id: 'FS-50K-3307', bal: 49380, start: 50000, target: 53000, floor: 48000, today: -220, lo: 49210, hi: 49710, seed: 23, drift: -0.12,
        readTag: 'Careful', readC: '#F2C46D', readSub: 'Evaluation, day 2 of 5 minimum',
        readH: 'Below Start. Room Is Getting Tighter.', readP: 'Two red days have used about half of your drawdown room. Smaller size until you are back above the starting balance keeps this account alive.',
        needL: 'Left to the profit target', needV: '$3,620', stats: [['Win Rate', '41%'], ['Worst Day', '−$480'], ['Days', '2 of 5']],
        rules: [['Profit target', 0], ['Minimum days', 0], ['Daily loss limit', 1], ['Max drawdown', 1], ['Consistency', 1], ['News rule', 1]] },
      { key: 'a3', kind: 'funded', short: '150K', plan: '[Plan B Name]', id: 'FS-150K-1902', bal: 154920, start: 150000, target: 153920, floor: 145500, today: 1180, lo: 153610, hi: 155040, seed: 37, drift: 0.28, action: 'Request Payout',
        readTag: 'Payout Ready', readC: '#5FD39B', readSub: 'Funded, cycle 3',
        readH: 'Every Payout Rule Is Met. $3,920 Is Yours.', readP: 'You cleared the payout threshold with eight trading days and a passing consistency score. Request now and it is reviewed within one business day.',
        needL: 'Available to withdraw', needV: '$3,920', stats: [['Your Split', '90%'], ['Paid So Far', '$8,450'], ['Days', '8 of 8']],
        rules: [['Payout threshold', 1], ['Trading days', 1], ['Daily loss limit', 1], ['Max drawdown', 1], ['Consistency', 1], ['News rule', 1]] },
      { key: 'a4', kind: 'funded', short: '25K', plan: '[Plan C Name]', id: 'FS-25K-0558', bal: 25610, start: 25000, target: 26000, floor: 24000, today: 0, lo: 25480, hi: 25700, seed: 41, drift: 0.1,
        readTag: 'Building', readC: '#7CC4FF', readSub: 'Funded, cycle 1',
        readH: 'Three Days Until Your First Payout.', readP: 'You are $610 up with five of eight trading days done. Three more days that respect the rules make this account payout eligible.',
        needL: 'Left to the payout threshold', needV: '$390', stats: [['Win Rate', '57%'], ['Best Day', '+$310'], ['Days', '5 of 8']],
        rules: [['Payout threshold', 0], ['Trading days', 0], ['Daily loss limit', 1], ['Max drawdown', 1], ['Consistency', 1], ['News rule', 1]] },
      { key: 'a5', kind: 'breached', short: '50K', plan: '[Plan A Name]', id: 'FS-50K-2914', bal: 48960, start: 50000, target: 53000, floor: 48000, today: 0, lo: 48960, hi: 48960, seed: 53, drift: -0.3, action: 'Reset Account', actionHref: mobile ? 'Mobile.dc.html' : 'Main.dc.html',
        readTag: 'Breached', readC: '#F2777F', readSub: 'Closed Nov 12',
        readH: 'The Daily Loss Limit Closed This Account.', readP: 'A $1,140 loss on Nov 12 went past the $1,100 daily limit. A reset gives you a fresh start at the full balance, with no history carried over.',
        needL: 'Reset price', needV: '$99', stats: [['Days Traded', '6'], ['Worst Day', '−$1,140'], ['Peak', '$51,210']],
        rules: [['Profit target', 0], ['Minimum days', 1], ['Daily loss limit', 0], ['Max drawdown', 1], ['Consistency', 1], ['News rule', 1]] }
    ];
    const active = accounts.filter((a) => a.kind !== 'breached');
    const todaySum = active.reduce((n, a) => n + a.today, 0);
    const todayTotal = signed(todaySum);
    const combined = money(active.reduce((n, a) => n + a.bal, 0));
    const todayLabel = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'long', month: 'short', day: 'numeric' }).format(new Date(st.now));
    const maxAbs = Math.max(...active.map((a) => Math.abs(a.today))) || 1;
    const eqToday = active.map((a) => { const w = Math.abs(a.today) / maxAbs * 50; return { k: a.short, v: signed(a.today), l: a.today < 0 ? (50 - w) + '%' : '50%', w: Math.max(w, a.today ? 0 : 0.6) + '%', c: a.today < 0 ? '#F2777F' : a.today > 0 ? '#5FD39B' : '#6E6A67', c2: a.today < 0 ? '#F2777F' : a.today > 0 ? '#5FD39B' : '#9C9693' }; });
    const area = (seed, n, drift, w, h) => { const sp = this.series(seed, n, 100, 5, drift); const lo = Math.min(...sp), hi = Math.max(...sp); const ln = sp.map((v, i) => (i ? 'L' : 'M') + (i / (n - 1) * w).toFixed(1) + ' ' + (4 + (1 - (v - lo) / (hi - lo || 1)) * (h - 8)).toFixed(1)).join(' '); return [ln, ln + ' L' + w + ' ' + h + ' L0 ' + h + ' Z']; };
    const [balLine, balArea] = area(5, 40, 0.22, 300, 70);
    const [payLine, payArea] = area(9, 40, 0.3, 300, 70);
    const gAng = Math.PI * (1 - 0.54); const gx = (100 + 66 * Math.cos(gAng)).toFixed(1), gy = (100 - 66 * Math.sin(gAng)).toFixed(1);
    const sparkOf = (a) => { const sp = this.series(a.seed, 16, 100, 5, a.drift); const lo = Math.min(...sp), hi = Math.max(...sp); return sp.map((v, i) => (i / 15 * 60).toFixed(1) + ',' + (2 + (1 - (v - lo) / (hi - lo || 1)) * 20).toFixed(1)).join(' '); };
    const listRows = accounts.map((a) => ({
      on: st.sel === a.key ? 'on' : '', pick: () => this.setState({ sel: a.key }), size: a.short, title: '$' + a.short + ' ' + kLabel[a.kind], kindLabel: a.id,
      spark: sparkOf(a), sparkC: a.kind === 'breached' || a.bal < a.start ? '#F2777F' : '#5FD39B', balance: money(a.bal),
      todayShort: a.kind === 'breached' ? 'Closed' : (a.today ? signed(a.today) : '$0') + ' (' + (a.today / a.bal * 100).toFixed(2) + '%)', todayColor: a.today > 0 ? '#5FD39B' : a.today < 0 ? '#F2777F' : '#9C9693',
      opacity: a.kind === 'breached' ? '0.6' : '1'
    }));
    const a = accounts.find((x) => x.key === st.sel) || accounts[0];
    const isEval = a.kind !== 'funded';
    const pct = (v, lo, hi) => Math.max(0, Math.min(100, (v - lo) / (hi - lo) * 100));
    const bars = [
      { t: 'Today', s: 'low to high', l: '0%', w: '0%', c: '#7CC4FF', m: (a.hi === a.lo ? 50 : pct(a.bal, a.lo, a.hi)) + '%', a: 'Low ' + money(a.lo), b: 'High ' + money(a.hi) },
      { t: isEval ? 'Profit Target' : 'Payout Threshold', s: Math.round(pct(a.bal, a.start, a.target)) + '% of the way', l: '0%', w: pct(a.bal, a.start, a.target) + '%', c: isEval ? '#7CC4FF' : '#5FD39B', m: pct(a.bal, a.start, a.target) + '%', a: 'Start ' + money(a.start), b: 'Goal ' + money(a.target) },
      { t: 'Drawdown Room', s: money(Math.max(0, a.bal - a.floor)) + ' left', l: '0%', w: pct(a.bal, a.floor, a.start + (a.start - a.floor)) + '%', c: '#6E6A67', m: pct(a.bal, a.floor, a.start + (a.start - a.floor)) + '%', a: 'Floor ' + money(a.floor), b: 'Safe' }
    ];
    const layerDefs = [['target', isEval ? 'Profit Target' : 'Payout Threshold'], ['floor', 'Drawdown Floor']];
    const layers = layerDefs.map(([k, label]) => { const on = !st.hide[k]; return { label, on, cls: on ? 'on' : '', pick: () => this.setState({ hide: Object.assign({}, st.hide, { [k]: on }) }) }; });
    const rangeDefs = { '1W': 20, '1M': 30, '3M': 45, 'All': 60 };
    const ranges = Object.keys(rangeDefs).map((r) => ({ label: r, on: st.range === r, cls: st.range === r ? 'on' : '', pick: () => this.setState({ range: r }) }));
    const n = rangeDefs[st.range] || 30;
    const vol = Math.abs(a.bal - a.start) / n * 2.2 + a.start * 0.002;
    let data = this.series(a.seed + n, n, a.bal, vol, 0);
    const startV = data[0]; data = data.map((v, i) => v + (a.start - startV) * (1 - i / (n - 1)));
    const showTarget = !st.hide.target, showFloor = !st.hide.floor;
    const all = data.concat([a.start, showTarget ? a.target : a.start, showFloor ? a.floor : a.start]);
    let lo = Math.min(...all), hi = Math.max(...all); const padV = (hi - lo) * 0.1; lo -= padV; hi += padV;
    const Y = (v) => 10 + (1 - (v - lo) / (hi - lo)) * 280;
    const line = data.map((v, i) => (i ? 'L' : 'M') + (i / (n - 1) * 800).toFixed(1) + ' ' + Y(v).toFixed(1)).join(' ');
    const step = (hi - lo) / 4; const grid = [0, 1, 2, 3, 4].map((k) => ({ y: Y(lo + step * k).toFixed(1) }));
    const yLabels = [0, 1, 2, 3, 4].map((k) => { const v = lo + step * k; return { top: (Y(v) / 300 * 100).toFixed(2) + '%', v: '$' + (v / 1000).toFixed(1) + 'K' }; });
    const top = (v) => (Y(v) / 300 * 100).toFixed(2) + '%';
    const rulesOk = a.rules.filter((r) => r[1]).length;
    const d = {
      size: a.short, title: '$' + a.short + ' ' + kLabel[a.kind], kindLabel: kLabel[a.kind], id: a.id, plan: a.plan,
      balance: money(a.bal), todayLong: a.kind === 'breached' ? 'Closed' : (a.today ? signed(a.today) : '$0') + ' (' + (a.today >= 0 ? '+' : '−') + Math.abs(a.today / a.bal * 100).toFixed(2) + '%) today',
      todayColor: a.today > 0 ? '#5FD39B' : a.today < 0 ? '#F2777F' : '#9C9693', sinceStart: signed(a.bal - a.start),
      bars, hasAction: !!a.action, action: a.action || '', actionHref: a.actionHref || '#',
      targetName: isEval ? 'Target' : 'Payout', targetV: money(a.target), floorV: money(a.floor),
      readTag: a.readTag, readC: a.readC, readSub: a.readSub, readH: a.readH, readP: a.readP, needL: a.needL, needV: a.needV,
      stats: a.stats.map(([l, v]) => ({ l, v })), rules: a.rules.map(([nme, ok]) => ({ n: nme, c: ok ? '#5FD39B' : '#3A3A40' })), rulesMet: rulesOk + ' of ' + a.rules.length + ' rules met'
    };
    const dFlat = {}; Object.keys(d).forEach((k) => { dFlat['d' + k[0].toUpperCase() + k.slice(1)] = d[k]; });
    const spPos = (50 + Math.max(-1, Math.min(1, todaySum / 4000)) * 50).toFixed(1) + '%';
    return Object.assign({
      clock, segs, hourRows, holidays, etTime, ckNext, ckLeft, tick: (sinceOpen / D * 100).toFixed(3) + '%',
      mkLabel: mk[0], mkColor: mk[1], mkRing: mk[2], mkPulse: mk[3], hoursOpen: st.hoursOpen,
      toggleHours: () => this.setState({ hoursOpen: !st.hoursOpen }), stop: (ev) => ev.stopPropagation(),
      todayLabel, todayTotal, combined, spPos, eqToday, balLine, balArea, payLine, payArea, gx, gy, listRows, layers, ranges,
      showTarget, showFloor, grid, yLabels, line, area: line + ' L800 300 L0 300 Z', yStart: Y(a.start).toFixed(1), yTarget: Y(a.target).toFixed(1), yFloor: Y(a.floor).toFixed(1),
      tTop: top(a.target), fTop: top(a.floor), nTop: top(a.bal), chartLabel: d.title + ' balance over ' + st.range,
      addHref: mobile ? 'Mobile.dc.html' : 'Main.dc.html'
    }, dFlat);
  }
}
