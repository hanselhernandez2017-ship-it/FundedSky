// Writes the design-canvas files (Certificate.dc.html and the Certificates.dc.html gallery) from the live certificate module,
// web/runtime/cert.js. The canvas never has its own copy of the art, the colours or the CSS: change cert.js, then run
//   node scripts/gen-cert-dc.js <canvas project folder>      (writes both files)
//   node scripts/gen-cert-dc.js --check <canvas project folder>   (exit 1 if the canvas files are out of date)
// The canvas template language cannot call JS, so the words (headline, sentence, figure) are written again in the component's
// logic below. Every run compares those words with what cert.js draws for all 11 looks and stops if they differ.
const C = require('../web/runtime/cert.js'); const fs = require('fs'); const path = require('path');
const CHECK = process.argv[2] === '--check'; const OUT = process.argv[CHECK ? 3 : 2];
if (!OUT) { console.error('usage: node scripts/gen-cert-dc.js [--check] <folder>'); process.exit(2); }
const KINDS = ['check', 'wing', 'coin', 'star', 'cup']; const TONES = Object.keys(C.TONE);
// shared gradient definitions, one set per tone
let defs = '';
for (const t of TONES) { const [a1, a2] = C.TONE[t];
  defs += C.art('check', { a1, a2 }, 'fsc' + t).match(/<defs>(.*?)<\/defs>/s)[1];
  defs += `<linearGradient id="fscs${t}a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a1}"/><stop offset="1" stop-color="${a2}"/></linearGradient><radialGradient id="fscs${t}b" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".45" stop-color="${a1}"/><stop offset="1" stop-color="${a2}"/></radialGradient>`; }
defs += '<path id="fscsp" d="M0 56a56 56 0 1 1 .01 0z"/>';
const arts = {}; const seals = {}; C.TONE['zz'] = ['§A1', '§A2', '', ''];
for (const k of KINDS) {
  arts[k] = C.art(k, { a1: '§A1', a2: '§A2', rank: '§RANK' }, '§').replace(/<defs>.*?<\/defs>/s, '').replace(/url\(#§g\)/g, '{{ p.G }}').replace(/url\(#§w\)/g, '{{ p.W }}').replace(/url\(#§d\)/g, '{{ p.D }}').replace(/§RANK/g, '{{ rank }}');
  let sl = C.seal(k, 'zz', 'X').replace(/<defs>.*?<\/defs>/s, '').replace(/url\(#fscXa\)/g, '{{ p.SA }}').replace(/url\(#fscXb\)/g, '{{ p.SB }}').replace(/#fscXp/g, '#fscsp').replace(/§A1/g, '{{ p.a1 }}');
  seals[k] = sl; if (/§/.test(arts[k] + sl)) throw new Error('marker left in ' + k); }
const ifs = (o) => KINDS.map((k) => `<sc-if value="{{ k.${k} }}" hint-placeholder-val="{{ ${k === 'check'} }}">\n${o[k]}\n</sc-if>`).join('\n');
// The markup is the live certificate's own frame (cert.js frame()), filled with the canvas placeholders
const tpl = C.frame({ style: '--a1: {{ p.a1 }}; --a2: {{ p.a2 }}; --g: {{ p.g }}; --foil: {{ p.foil }}; --ns: {{ ns }};', label: '{{ label }}', a1: '{{ p.a1 }}',
  pre: `\n<svg width="0" height="0" style="position: absolute;" aria-hidden="true"><defs>${defs}</defs></svg>\n`, holo: `\n<sc-if value="{{ p.isHolo }}" hint-placeholder-val="{{ false }}">${C.HOLO_EL}</sc-if>\n`,
  over: '{{ over }}', name: '{{ name }}', title: '{{ title }}', line: '{{ line }}', date: '{{ date }}', id: '{{ id }}', verify: '{{ verify }}', art: `\n${ifs(arts)}\n`, seal: `\n${ifs(seals)}\n`, big: '{{ big }}', bigSub: '{{ bigSub }}' });
const tones = JSON.stringify(Object.fromEntries(TONES.map((t) => [t, C.TONE[t]])));
const logic = `class Component extends DCLogic {
  renderVals() {
    const P = this.props; const kind = P.kind ?? 'passed'; const name = P.name ?? 'Alex Rivera'; const first = String(name).split(' ')[0];
    const what = P.what ?? '$50K Prime Evaluation'; const amount = P.amount ?? '$2,450'; const size = P.size ?? '$50K'; const place = P.place ?? '1st'; const rank = P.rank ?? '1'; const of = P.of ?? '2,140';
    // accent light, accent deep, glow, foil gradient
    const TONE = ${tones};
    // one template, five kinds: what the headline, sentence, emblem and figure say
    const KIND = {
      passed: { tone: 'sky', icon: 'check', over: 'Certificate of Achievement', title: 'Evaluation Passed', line: \`\${first} passed the \${what} by reaching the profit target inside every trading rule.\`, big: size, bigSub: 'Evaluation' },
      funded: { tone: 'green', icon: 'wing', over: 'Certificate of Funding', title: 'Funded Trader', line: \`\${first} earned a \${what} and now earns performance rewards from a simulated funded account.\`, big: size, bigSub: 'Funded' },
      payout: { tone: 'gold', icon: 'coin', over: 'Payout Certificate', title: 'Paid Out', line: \`\${first} was paid \${amount} from a \${what}.\`, big: amount, bigSub: 'Paid' },
      lifetime: { tone: 'gold', icon: 'star', over: 'Lifetime Payouts', title: \`\${amount} Club\`, line: \`\${first} has been paid more than \${amount} in total across funded accounts.\`, big: amount, bigSub: 'Lifetime' },
      comp: { tone: 'gold', icon: 'cup', over: 'Competition Result', title: \`\${place} Place\`, line: \`\${first} finished \${String(place).toLowerCase()} of \${of} \${String(of) === '1' ? 'trader' : 'traders'} in \${what}.\`, big: '#' + rank, bigSub: 'of ' + of }
    };
    const K = KIND[kind] || KIND.passed; const tone = TONE[P.tone] ? P.tone : K.tone; const [a1, a2, g, foil] = TONE[tone]; const id = P.id ?? 'CF-P50K2105';
    const n = String(name).length;
    return {
      label: \`Funded Sky certificate: \${K.title}, awarded to \${name}\`, name, over: K.over, title: K.title, line: K.line, big: K.big, bigSub: K.bigSub, rank: String(rank),
      date: P.date ?? 'November 26, 2026', id, verify: (P.host ?? 'fundedsky.com') + '/cert/' + id, ns: (n > 30 ? 4.2 : n > 22 ? 5.2 : n > 16 ? 6.2 : 7.4) + 'cqw',
      k: { check: K.icon === 'check', wing: K.icon === 'wing', coin: K.icon === 'coin', star: K.icon === 'star', cup: K.icon === 'cup' },
      p: { a1, a2, g, foil, isHolo: tone === 'plat' || tone === 'silver', G: \`url(#fsc\${tone}g)\`, W: \`url(#fsc\${tone}w)\`, D: \`url(#fsc\${tone}d)\`, SA: \`url(#fscs\${tone}a)\`, SB: \`url(#fscs\${tone}b)\` }
    };
  }
}`;
const props = { kind: { editor: 'enum', options: ['passed', 'funded', 'payout', 'lifetime', 'comp'], default: 'passed' }, tone: { editor: 'enum', options: [''].concat(TONES.filter((t) => t !== 'zz')), default: '' }, name: { editor: 'text', default: 'Alex Rivera' }, what: { editor: 'text', default: '$50K Prime Evaluation' }, amount: { editor: 'text', default: '$2,450' }, size: { editor: 'text', default: '$50K' }, place: { editor: 'text', default: '1st' }, rank: { editor: 'text', default: '1' }, of: { editor: 'text', default: '2,140' }, date: { editor: 'text', default: 'November 26, 2026' }, id: { editor: 'text', default: 'CF-P50K2105' }, $preview: { width: 1000, height: 707 } };
const page = (title, css, body, propsJson, logicSrc) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Mona+Sans:wdth,wght@100..125,400..800&amp;family=Instrument+Serif:ital@1&amp;family=Geist+Mono:wght@400;500&amp;display=swap">
<style>
${css}
</style>
</helmet>
${body}
</x-dc>
<script type="text/x-dc" data-dc-script data-props='${propsJson}'>
${logicSrc}
</script>
</body>
</html>
`;
const files = {}; files['Certificate.dc.html'] = page('Certificate', 'body{margin:0}\n' + C.CSS, tpl, JSON.stringify(props), logic);
const L = [['Evaluation Passed', 'Issued when a trader passes an evaluation.', { kind: 'passed', what: '$50K Prime Evaluation', size: '$50K', date: 'November 26, 2026', id: 'CF-P50K2105' }],
  ['Funded Trader', 'Issued when a funded account opens.', { kind: 'funded', what: '$50K Funded Account', size: '$50K', date: 'November 28, 2026', id: 'CF-F50K2105' }],
  ['Payout', 'Issued each time a payout is paid.', { kind: 'payout', what: '$50K Funded Account', amount: '$2,450', date: 'December 12, 2026', id: 'CF-O3544' }],
  ['Lifetime Payouts · $10,000', 'Bronze. Total payouts pass $10,000.', { kind: 'lifetime', tone: 'bronze', amount: '$10,000', date: 'February 3, 2027', id: 'CF-L10K0142' }],
  ['Lifetime Payouts · $25,000', 'Silver, with a foil sheen.', { kind: 'lifetime', tone: 'silver', amount: '$25,000', date: 'April 19, 2027', id: 'CF-L25K0142' }],
  ['Lifetime Payouts · $50,000', 'Gold. Shown with a long name.', { kind: 'lifetime', tone: 'gold', name: 'Maria-Fernanda Oliveira', amount: '$50,000', date: 'July 8, 2027', id: 'CF-L50K0142' }],
  ['Lifetime Payouts · $100,000', 'Platinum, with a foil sheen.', { kind: 'lifetime', tone: 'plat', amount: '$100,000', date: 'November 2, 2027', id: 'CF-L100K0142' }],
  ['Competition · 1st Place', 'Gold.', { kind: 'comp', tone: 'gold', place: '1st', rank: '1', of: '2,140', what: 'the Black Friday Sprint', date: 'November 30, 2026', id: 'CF-C15P1' }],
  ['Competition · 2nd Place', 'Silver.', { kind: 'comp', tone: 'silver', place: '2nd', rank: '2', of: '2,140', what: 'the Black Friday Sprint', date: 'November 30, 2026', id: 'CF-C15P2' }],
  ['Competition · 3rd Place', 'Bronze.', { kind: 'comp', tone: 'bronze', place: '3rd', rank: '3', of: '2,140', what: 'the Black Friday Sprint', date: 'November 30, 2026', id: 'CF-C15P3' }],
  ['Competition · Other Prize Places', 'Violet, for 4th place and below.', { kind: 'comp', tone: 'violet', place: '5th', rank: '5', of: '2,140', what: 'the Black Friday Sprint', date: 'November 30, 2026', id: 'CF-C15P5' }]];
const D = { tone: '', name: 'Alex Rivera', what: '', amount: '', size: '', place: '', rank: '', of: '' };
const gl = `<div style="background: #08080A; color: #F4F2F1; font-family: 'Mona Sans', system-ui, sans-serif; padding: 56px 64px 72px; min-height: 100vh; box-sizing: border-box;">
<p style="margin: 0 0 8px; font-size: 13px; color: #7CC4FF; font-weight: 500;">Certificates</p>
<h1 style="margin: 0 0 12px; font-size: 44px; line-height: 1.04; font-weight: 600; letter-spacing: -0.035em;">One Certificate, Five Kinds.</h1>
<p style="margin: 0 0 44px; color: #D4CFCD; font-size: 16px; max-width: 760px; line-height: 1.5;">The name, the sentence, the figure, the date, the ID and the verify link are filled in for each trader. The colour and emblem follow the kind: evaluation passed, funded, payout, lifetime payouts at four levels, and competition places.</p>
<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 44px 40px;">
<sc-for list="{{ certs }}" as="c" hint-placeholder-count="11">
<div style="display: flex; flex-direction: column; gap: 14px;">
<dc-import name="Certificate" kind="{{ c.kind }}" tone="{{ c.tone }}" name="{{ c.name }}" what="{{ c.what }}" amount="{{ c.amount }}" size="{{ c.size }}" place="{{ c.place }}" rank="{{ c.rank }}" of="{{ c.of }}" date="{{ c.date }}" id="{{ c.id }}" hint-size="100%,520px"></dc-import>
<div><b style="font-weight: 600; font-size: 17px;">{{ c.t }}</b><div style="color: #9C9693; font-size: 13px;">{{ c.s }}</div></div>
</div>
</sc-for>
</div>
</div>`;
const glLogic = `class Component extends DCLogic {
  renderVals() {
    return { certs: ${JSON.stringify(L.map(([t, s, d]) => Object.assign({ t, s }, D, d)), null, 0)} };
  }
}`;
files['Certificates.dc.html'] = page('Certificates', 'body{margin:0;background:#08080A}', gl, JSON.stringify({ $preview: { width: 1600, height: 3900 } }), glLogic);
// Parity: the canvas component's words must be the words cert.js draws, for every look in the gallery
{ const Comp = new Function('DCLogic', logic + '\nreturn Component;')(class {}); delete C.TONE.zz;
  for (const [t, , d0] of L) { const d = Object.assign({}, D, d0); const v = Object.assign(new Comp(), { props: d }).renderVals(); const html = C.render(d);
    const want = [`<span class="fsc-ov">${C.esc(v.over)}</span>`, `<div class="fsc-nm">${C.esc(v.name)}</div>`, `<div class="fsc-tt">${C.esc(v.title)}</div>`, `<div class="fsc-ln">${C.esc(v.line)}</div>`, `<div class="fsc-big">${C.esc(v.big)}<span class="fsc-sub">${C.esc(v.bigSub)}</span></div>`, `<span class="fsc-v fsc-m">${C.esc(v.verify)}</span>`, `aria-label="${C.esc(v.label)}"`, `--a1:${v.p.a1};--a2:${v.p.a2};--g:${v.p.g};--foil:${v.p.foil};--ns:${v.ns}`, v.p.isHolo ? C.HOLO_EL : '<span class="fsc-grain"></span><span class="fsc-shade">'];
    for (const w of want) if (!html.includes(w)) { console.error(`Canvas component and cert.js differ for "${t}":\n  ${w}`); process.exit(1); } } }
let stale = 0;
for (const [f, s] of Object.entries(files)) { const p = path.join(OUT, f);
  if (CHECK) { const same = fs.existsSync(p) && fs.readFileSync(p, 'utf8') === s; console.log(same ? 'up to date' : 'OUT OF DATE', p); if (!same) stale++; } else { fs.writeFileSync(p, s); console.log('wrote', p); } }
process.exit(stale ? 1 : 0);
