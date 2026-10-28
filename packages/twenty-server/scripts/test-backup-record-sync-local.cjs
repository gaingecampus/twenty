// Opt-in integration check: uses only session-local temporary tables.
const assert = require('node:assert/strict');
const connect = require('./local-status-board-client.cjs');
const { syncTables, identityFields } = require('./backup-record-sync.cjs');

async function main() {
  const { c } = await connect();
  const fields = [
    ['expenseMonth', '', 'TEXT'],
    ['sourceRow', '', 'NUMBER'],
    ['sourceKey', '', 'TEXT'],
    ['notes', '', 'TEXT'],
    ...identityFields,
  ];
  const source = (row, name, month = '2026-10') => ({
    name,
    expenseMonth: month,
    sourceRow: row,
    sourceKey: `fixture:sheet:${row}`,
    notes: null,
  });
  const id = '00000000-0000-4000-8000-000000000001';
  try {
    await c.query(
      `CREATE TEMP TABLE "_pendingExpense" (id uuid PRIMARY KEY, name text CHECK (name <> 'reject-write'), "expenseMonth" text, "sourceRow" double precision, "sourceKey" text UNIQUE, notes text, "backupId" text, "backupScope" text, "backupBaseline" text, "createdByName" text, "updatedByName" text, "updatedAt" timestamptz DEFAULT now(), "deletedAt" timestamptz)`,
    );
    await c.query(
      `INSERT INTO pg_temp."_pendingExpense" (id,name,"expenseMonth","sourceRow","sourceKey") VALUES ($1,'history','2026-09',1,'fixture:sheet:1')`,
      [id],
    );
    const historical = (
      await c.query(`select * from pg_temp."_pendingExpense" where id=$1`, [id])
    ).rows[0];
    await c.query('BEGIN');
    await syncTables(
      c,
      'pg_temp',
      [
        {
          kind: 'pendingExpense',
          fields,
          fromMonth: '2026-10',
          incoming: [
            source(1, 'modified historical', '2026-09'),
            source(8, 'current'),
            source(9, 'future', '2027-01'),
          ],
        },
      ],
      true,
    );
    await c.query('COMMIT');
    assert.deepEqual(
      (
        await c.query(`select * from pg_temp."_pendingExpense" where id=$1`, [
          id,
        ])
      ).rows[0],
      historical,
    );
    assert.equal(
      (
        await c.query(
          `select count(*)::int as count from pg_temp."_pendingExpense"`,
        )
      ).rows[0].count,
      3,
    );
    await c.query('BEGIN');
    const repeat = await syncTables(
      c,
      'pg_temp',
      [
        {
          kind: 'pendingExpense',
          fields,
          fromMonth: '2026-10',
          incoming: [source(8, 'current'), source(9, 'future', '2027-01')],
        },
      ],
      true,
    );
    await c.query('COMMIT');
    assert.ok(repeat[0].plans.every(({ action }) => action === 'unchanged'));
    await c.query('BEGIN');
    await assert.rejects(
      syncTables(
        c,
        'pg_temp',
        [
          {
            kind: 'pendingExpense',
            fields,
            fromMonth: '2026-10',
            incoming: [
              source(8, 'current'),
              source(9, 'future', '2027-01'),
              source(10, 'insert-before-error'),
              source(11, 'reject-write'),
            ],
          },
        ],
        true,
      ),
      /check constraint/,
    );
    await c.query('ROLLBACK');
    assert.equal(
      (
        await c.query(
          `select count(*)::int as count from pg_temp."_pendingExpense"`,
        )
      ).rows[0].count,
      3,
    );
    console.log(
      'PASS: monthly boundary, history unchanged, idempotency, atomic rollback (temporary tables only)',
    );
  } finally {
    await c.end();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
