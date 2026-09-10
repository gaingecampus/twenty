import assert from 'node:assert/strict';
import { test } from 'node:test';
import pg from 'pg';
import { buildStageTimingSql, fields } from './schema.mjs';

test('rejects SQL identifiers outside the allowed schema grammar', () => {
  assert.throws(() => buildStageTimingSql('public";DROP TABLE x;--'));
});

test('transactional stage timing across creation, edits, reentry, imports and deletion', async () => {
  const url = new URL(process.env.PG_DATABASE_URL);
  assert.ok(
    ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname),
    'Local test database only',
  );
  const client = new pg.Client({ connectionString: url.toString() });
  await client.connect();
  const schema = `stage_timing_test_${process.pid}`;
  const table = `"${schema}"."opportunity"`;
  try {
    await client.query('BEGIN');
    await client.query(`CREATE SCHEMA "${schema}"`);
    await client.query(`CREATE TABLE ${table} (
      id integer PRIMARY KEY, name text, "customStage" text,
      "createdAt" timestamptz NOT NULL DEFAULT now(), "deletedAt" timestamptz,
      "firstInquiryDate" date DEFAULT (now() AT TIME ZONE 'Asia/Seoul')::date,
      "sotongWanryoIlja" date,
      ${fields.map((f) => `"${f.name}" ${f.type === 'NUMBER' ? 'integer' : 'timestamptz'}`).join(',')}
    )`);
    await client.query(buildStageTimingSql(schema));
    // Installation is repeatable and does not reset measurements.
    await client.query(buildStageTimingSql(schema));
    const run = async (sql) => (await client.query(sql)).rows[0];
    let record = await run(
      `INSERT INTO ${table}(id,"customStage") VALUES(1,'INQUIRY') RETURNING *`,
    );
    assert.equal(record.stageInquiryDays, 0);
    assert.ok(record.stageInquiryReachedAt);
    assert.equal(record.stageProposalDays, null);
    record = await run(
      `UPDATE ${table} SET "customStage"='PROPOSAL' WHERE id=1 RETURNING *`,
    );
    const firstProposal = record.stageProposalReachedAt.getTime();
    assert.equal(record.stageProposalDays, 0);
    assert.equal(record.stageCommunicatingDays, null); // skipped stage is not invented
    record = await run(
      `UPDATE ${table} SET name='edited', "stageProposalDays"=999 WHERE id=1 RETURNING *`,
    );
    assert.equal(record.stageProposalDays, 0); // managed values cannot be manually corrupted
    await run(
      `UPDATE ${table} SET "customStage"='INQUIRY' WHERE id=1 RETURNING *`,
    );
    record = await run(
      `UPDATE ${table} SET "customStage"='PROPOSAL' WHERE id=1 RETURNING *`,
    );
    assert.equal(record.stageProposalReachedAt.getTime(), firstProposal);
    // The KST midnight boundary, not rounded 24-hour intervals, defines a day.
    record =
      await run(`INSERT INTO ${table}(id,"customStage","firstInquiryDate")
      VALUES(2,'MATCHING_SUCCESS', (now() AT TIME ZONE 'Asia/Seoul')::date - 3) RETURNING *`);
    assert.equal(record.stageMatchingSuccessDays, 3);
    assert.equal(record.stageInquiryDays, null);
    record = await run(
      `UPDATE ${table} SET "deletedAt"=now(),"customStage"='ON_HOLD' WHERE id=2 RETURNING *`,
    );
    assert.equal(record.stageOnHoldDays, null);
    record = await run(
      `UPDATE ${table} SET "deletedAt"=NULL WHERE id=2 RETURNING *`,
    );
    assert.equal(record.stageOnHoldDays, null); // restoration is not an observed transition
    record = await run(
      `INSERT INTO ${table}(id,"customStage","firstInquiryDate") VALUES(3,'INQUIRY',now()+interval '2 days') RETURNING *`,
    );
    assert.equal(record.stageInquiryDays, null); // no negative duration
    await client.query(
      `ALTER TABLE ${table} DISABLE TRIGGER gainge_opportunity_stage_timing`,
    );
    await client.query(
      `INSERT INTO ${table}(id,"customStage","firstInquiryDate") VALUES(4,'COMMUNICATING',now()-interval '10 days')`,
    );
    await client.query(
      `ALTER TABLE ${table} ENABLE TRIGGER gainge_opportunity_stage_timing`,
    );
    record = await run(
      `UPDATE ${table} SET name='legacy edit' WHERE id=4 RETURNING *`,
    );
    assert.equal(record.stageCommunicatingReachedAt, null);
    assert.equal(record.stageTimingStartedAt, null);
    record = await run(
      `UPDATE ${table} SET "customStage"='TECHNICAL_CONSULT' WHERE id=4 RETURNING *`,
    );
    assert.equal(record.stageCommunicatingDays, null);
    assert.equal(record.stageTechnicalConsultDays, 10);
    // Multi-record updates run the same row-level computation for each record.
    await client.query(
      `UPDATE ${table} SET "customStage"='FOLLOW_UP' WHERE id IN (1,4)`,
    );
    const results = (
      await client.query(
        `SELECT "stageFollowUpDays" FROM ${table} WHERE id IN (1,4) ORDER BY id`,
      )
    ).rows;
    assert.deepEqual(
      results.map((r) => r.stageFollowUpDays),
      [0, 10],
    );
    // Completion is the first terminal transition, not every edit or reentry.
    record = await run(
      `UPDATE ${table} SET "customStage"='ON_HOLD' WHERE id=1 RETURNING *`,
    );
    const completion = record.sotongWanryoIlja;
    assert.ok(completion);
    await run(
      `UPDATE ${table} SET "customStage"='COMMUNICATING' WHERE id=1 RETURNING *`,
    );
    record = await run(
      `UPDATE ${table} SET "customStage"='MATCHING_SUCCESS', "sotongWanryoIlja"='2000-01-01' WHERE id=1 RETURNING *`,
    );
    assert.deepEqual(record.sotongWanryoIlja, completion);
    // Missing inquiry dates still record completion, but never invent a duration.
    record = await run(
      `INSERT INTO ${table}(id,"customStage","firstInquiryDate") VALUES(5,'MATCHING_HOLD_COMPLETED',NULL) RETURNING *`,
    );
    assert.ok(record.sotongWanryoIlja);
    assert.ok(record.stageClosedReachedAt);
    assert.equal(record.stageClosedDays, null);
    const reached = record.stageClosedReachedAt.getTime();
    record = await run(
      `UPDATE ${table} SET "firstInquiryDate"=(now() AT TIME ZONE 'Asia/Seoul')::date - 20 WHERE id=5 RETURNING *`,
    );
    assert.equal(record.stageClosedDays, 20);
    assert.equal(record.stageClosedReachedAt.getTime(), reached);
    // Correcting the date rebases all measured durations without moving history.
    record = await run(
      `UPDATE ${table} SET "firstInquiryDate"=(now() AT TIME ZONE 'Asia/Seoul')::date - 30 WHERE id=1 RETURNING *`,
    );
    assert.equal(record.stageInquiryDays, 30);
    assert.equal(record.stageMatchingSuccessDays, 30);
    assert.deepEqual(record.sotongWanryoIlja, completion);
  } finally {
    await client.query('ROLLBACK');
    await client.end();
  }
});
