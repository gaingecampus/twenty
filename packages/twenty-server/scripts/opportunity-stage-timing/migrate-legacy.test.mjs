import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import pg from 'pg';
import runner from './migrate-legacy.cjs';
import { fields, buildStageTimingSql } from './schema.mjs';

test('deployed SQL matches the source generator', () => {
  assert.equal(
    readFileSync(new URL('./stage-timing-v2.sql', import.meta.url), 'utf8'),
    buildStageTimingSql('gainge_workspace'),
  );
});
test('legacy backup, earliest success date, completion, rebase, idempotency and live-workflow guard', async () => {
  const url = new URL(process.env.PG_DATABASE_URL);
  assert.ok(['localhost', '127.0.0.1'].includes(url.hostname));
  const c = new pg.Client({ connectionString: url.toString() });
  await c.connect();
  const schema = `inquiry_migration_test_${process.pid}`,
    ns = `"${schema}"`;
  const db = {
    query: (sql, args) =>
      sql === 'SELECT "databaseSchema" FROM core.workspace WHERE id=$1'
        ? Promise.resolve({ rows: [{ databaseSchema: schema }] })
        : c.query(sql, args),
  };
  try {
    await c.query(`CREATE SCHEMA ${ns}`);
    await c.query(
      `CREATE TABLE ${ns}."workflowVersion"(id uuid,"workflowId" uuid,status text,"deletedAt" timestamptz); CREATE TABLE ${ns}."workflowRun"(id uuid,"workflowId" uuid,status text,"deletedAt" timestamptz)`,
    );
    await c.query(
      `CREATE TABLE ${ns}.opportunity(id uuid PRIMARY KEY,"customStage" text,"firstInquiryDate" date,"createdAt" timestamptz DEFAULT now(),"deletedAt" timestamptz,"updatedAt" timestamptz DEFAULT now(),"updatedBySource" text,"updatedByName" text,"matchingSuccessAt" timestamptz,"soyoSiganIl" numeric,"sotongWanryoIlja" date,${fields.map((f) => `"${f.name}" ${f.type === 'NUMBER' ? 'numeric' : 'timestamptz'}`).join(',')})`,
    );
    await c.query(
      `INSERT INTO ${ns}.opportunity(id,"customStage","firstInquiryDate","matchingSuccessAt","stageMatchingSuccessReachedAt","soyoSiganIl","updatedBySource") VALUES('00000000-0000-4000-8000-000000000001','MATCHING_SUCCESS','2026-08-01','2026-08-04T15:05:00Z','2026-09-01T00:00:00Z',99,'MANUAL'),('00000000-0000-4000-8000-000000000002','COMMUNICATING','2026-08-01',NULL,NULL,7,'MANUAL')`,
    );
    await c.query(buildStageTimingSql(schema));
    await c.query(
      `INSERT INTO ${ns}."workflowVersion" VALUES('00000000-0000-4000-8000-000000000003','0175106c-bda8-495c-97f5-84a17f83f71b','ACTIVE',NULL)`,
    );
    const sql = buildStageTimingSql('gainge_workspace');
    assert.equal(
      (await runner.migrate(db, 'test', 'plan', sql)).activeWorkflowVersions
        .length,
      1,
    );
    await assert.rejects(
      runner.migrate(db, 'test', 'apply', sql),
      /Deactivate/,
    );
    await c.query(`DELETE FROM ${ns}."workflowVersion"`);
    const result = await runner.migrate(db, 'test', 'apply', sql);
    assert.equal(result.backupRecords, 2);
    const record = (
      await c.query(`SELECT * FROM ${ns}.opportunity ORDER BY id`)
    ).rows[0];
    assert.equal(
      record.stageMatchingSuccessReachedAt.toISOString(),
      '2026-08-04T15:05:00.000Z',
    );
    assert.equal(record.stageMatchingSuccessDays, '4');
    assert.equal(record.updatedBySource, 'SYSTEM');
    const backup = (
      await c.query(
        `SELECT data FROM ${ns}."_gaingeInquiryTimingBackup20260910" ORDER BY id`,
      )
    ).rows;
    assert.equal(backup[0].data.soyoSiganIl, 99);
    assert.equal(backup[1].data.soyoSiganIl, 7);
    assert.equal(
      (await runner.migrate(db, 'test', 'verify', sql)).legacyDateErrors,
      0,
    );
    assert.equal(
      (await runner.migrate(db, 'test', 'apply', sql)).alreadyApplied,
      true,
    );
  } finally {
    await c.query(`DROP SCHEMA ${ns} CASCADE`);
    await c.end();
  }
});
