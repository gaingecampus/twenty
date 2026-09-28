import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import {
  buildAutomationSql,
  buildAutomationLeaseSql,
  buildEnrichmentBudgetSql,
  buildEnrichmentResumeSql,
} from '../../src/modules/gainge-automation/automation-schema.ts';

test('latest registered companies first; retries and leases respected; concurrent daily budget stops at 150', async () => {
  const url = new URL(process.env.PG_DATABASE_URL);
  assert.ok(['localhost', '127.0.0.1'].includes(url.hostname));
  const pool = new pg.Pool({ connectionString: url.href, max: 4 });
  const schema = `enrichment_priority_${Date.now()}`;
  const ns = `"${schema}"`;
  try {
    await pool.query(`CREATE SCHEMA ${ns}`);
    await pool.query(
      `CREATE TABLE ${ns}.company(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text, "createdAt" timestamptz, "updatedAt" timestamptz, "deletedAt" timestamptz, "aiEnrichmentStatus" text, "aiCompanyProfile" text, "domainNamePrimaryLinkUrl" text, "aiEnrichmentCheckedAt" timestamptz)`,
    );
    await pool.query(buildAutomationSql(schema, []));
    // Newer companies were updated earlier: update/event time must not win.
    await pool.query(
      `INSERT INTO ${ns}.company(name,"createdAt","updatedAt","aiEnrichmentCheckedAt","aiEnrichmentStatus","domainNamePrimaryLinkUrl") SELECT n::text, now()-n*interval '1 day', now()+n*interval '1 minute', now()-interval '1 hour','NEEDS_WEBSITE','https://example.com' FROM generate_series(1,6) n`,
    );
    await pool.query(buildEnrichmentResumeSql(schema));
    assert.deepEqual(
      (
        await pool.query(
          `SELECT payload->>'name' AS name FROM ${ns}."_gaingeAutomationEvent" ORDER BY name`,
        )
      ).rows.map((r) => r.name),
      ['1', '2', '3', '4', '5'],
    );
    await pool.query(buildEnrichmentResumeSql(schema));
    await pool.query(
      `UPDATE ${ns}."_gaingeAutomationEvent" SET "createdAt"=now()-(payload->>'name')::int*interval '1 hour'`,
    );
    const lease = async () =>
      (
        await pool.query(buildAutomationLeaseSql(schema), [
          '11111111-1111-4111-8111-111111111111',
        ])
      ).rows[0];
    assert.equal((await lease()).payload.name, '1');
    assert.equal((await lease()).payload.name, '2');
    await pool.query(
      `UPDATE ${ns}."_gaingeAutomationEvent" SET "nextAttemptAt"=now()+interval '1 hour' WHERE payload->>'name'='3'`,
    );
    assert.equal((await lease()).payload.name, '4');
    const reservations = await Promise.all(
      Array.from({ length: 160 }, () =>
        pool.query(buildEnrichmentBudgetSql(schema)),
      ),
    );
    assert.equal(reservations.filter((r) => r.rows.length).length, 150);
    assert.equal(
      (
        await pool.query(
          `SELECT calls FROM ${ns}."_gaingeAutomationBudget" WHERE day=(now() AT TIME ZONE 'Asia/Seoul')::date`,
        )
      ).rows[0].calls,
      150,
    );
  } finally {
    await pool.query(`DROP SCHEMA IF EXISTS ${ns} CASCADE`);
    await pool.end();
  }
});
