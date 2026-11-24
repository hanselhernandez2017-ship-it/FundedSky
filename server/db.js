const { Pool, types } = require('pg');
types.setTypeParser(1700, (v) => (v === null ? null : parseFloat(v))); // NUMERIC -> number
types.setTypeParser(20, (v) => (v === null ? null : parseInt(v, 10)));  // BIGINT -> number
types.setTypeParser(1082, (v) => v);                                    // DATE stays 'YYYY-MM-DD'
const url = process.env.DATABASE_URL || 'postgres://fs:fs@localhost/fundedsky';
const pool = new Pool({ connectionString: url, ssl: /localhost|127\.0\.0\.1|railway\.internal/.test(url) ? false : { rejectUnauthorized: false }, max: 10 });
const q = (text, params) => pool.query(text, params);
const one = async (text, params) => (await pool.query(text, params)).rows[0] || null;
const all = async (text, params) => (await pool.query(text, params)).rows;
async function tx(fn) {
  const c = await pool.connect();
  try { await c.query('BEGIN'); const r = await fn({ q: (t, p) => c.query(t, p), one: async (t, p) => (await c.query(t, p)).rows[0] || null, all: async (t, p) => (await c.query(t, p)).rows }); await c.query('COMMIT'); return r; }
  catch (e) { await c.query('ROLLBACK'); throw e; } finally { c.release(); }
}
module.exports = { pool, q, one, all, tx };
