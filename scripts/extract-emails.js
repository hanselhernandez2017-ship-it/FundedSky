// Pulls the email definitions (senders, emails, flows) out of the Emails board design into server/emaildefs.json.
const fs = require('fs'); const s = fs.readFileSync(__dirname + '/../web/admin/pages/emails.js', 'utf8');
const grab = (name) => { const i = s.indexOf(`\n  const ${name} = `); let j = s.indexOf("=", i) + 1; let d = 0, k = j; for (; k < s.length; k++) { const c = s[k]; if (c === "'" || c === '"' || c === '`') { const q = c; k++; while (s[k] !== q) { if (s[k] === '\\') k++; k++; } continue; } if ('{['.includes(c)) d++; if ('}]'.includes(c)) { d--; if (!d) break; } } return eval('(' + s.slice(j, k + 1) + ')'); };
const out = { SENDERS: grab('SENDERS'), SAMPLE: grab('SAMPLE'), E: grab('E'), FLOWS: grab('FLOWS'), GROUP_LABEL: grab('GROUP_LABEL') };
fs.writeFileSync(__dirname + '/../server/emaildefs.json', JSON.stringify(out));
console.log(Object.keys(out.E).length, 'emails', out.FLOWS.length, 'flows');
