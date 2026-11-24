const fs = require('fs'); const path = require('path');
const db = require('./db');
const { DEFAULT_CATALOG } = require('./catalog');
async function migrate() {
  await db.q(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
  const c = await db.one('SELECT id FROM catalog WHERE id=1');
  if (!c) await db.q('INSERT INTO catalog(id,data) VALUES(1,$1)', [DEFAULT_CATALOG]);
  const seed = require('./seed');
  await seed.run();
}
module.exports = { migrate };
if (require.main === module) migrate().then(() => { console.log('migrated'); process.exit(0); }).catch((e) => { console.error(e); process.exit(1); });
