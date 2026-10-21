// AX-1310: one-time cleanup explicitly approved on 2026-10-21.
// Preserve successful step outputs and all business records; never report success.
const assert = require('node:assert/strict');
const workflowId = 'c1f51133-b3b1-4045-b18b-539168be3eb5';
const oldVersionId = '2d5fa222-871d-4edd-914a-842a1ba622d8';
const activeVersionId = 'e39d757b-e2ba-44b9-88f8-9310cd118fa8';
const interruptedV3Id = '0ae59b7b-23ec-497b-9b93-789bf7100061';
const ids = [
  '299fecc1-8e7e-4fa0-b974-848a741b0496',
  'ca9fc088-d719-49f5-8d42-d64afce204cf',
  'bf9b1c0e-1292-4973-ade1-4831278ef7b8',
  'f94fdb07-5ece-4f34-a077-7594374a8c92',
  'e31001fb-f5a8-49a0-bdd8-8fde65a6c64a',
  '1fca101c-ed09-41bd-8ab7-a802300e6662',
  'ab558380-b56e-4fdc-8311-9a89fdd63d22',
  '5188675b-5985-45a8-a52c-77b63d97d32e',
  'f152f045-46d4-48ac-a49c-12e14fff1c8e',
  '135a8d42-8036-4a13-927b-91ac018d1044',
  '0f66c09a-0f98-4ad8-b9d6-0c35c1be2b77',
  '516dfc9a-2c9b-4ad4-8f64-02c0ac74fca1',
  'ef64b07e-4171-4c84-802f-8505e7530189',
  'a92736ea-2ec4-4e5e-99fd-683b7d431b7c',
  interruptedV3Id,
  '9f6e6233-5f75-4d9b-a533-4459176e3c3d',
  'd15c302d-97de-4f73-acd1-a4e18f98b510',
  '371a9a53-7185-49c0-8194-38cd3544683f',
  '0df9e0d3-32e1-4094-9a5e-07ce1adb81ea',
  'ec92533c-64b9-4b72-841d-b2197c2ac93f',
  'f037f618-a102-4d9e-9e17-d70f75c48d2f',
];
const schema = 'workspace_5htl93s0o5y0srdosknh2lg2l';
function stoppedState(run) {
  assert(ids.includes(run.id), 'Unapproved run');
  assert.equal(run.workflowId, workflowId);
  assert.equal(
    run.workflowVersionId,
    run.id === interruptedV3Id ? activeVersionId : oldVersionId,
  );
  assert(
    ['RUNNING', 'STOPPING', 'STOPPED'].includes(run.status),
    'Unexpected status',
  );
  assert(
    new Date(run.startedAt).getTime() < Date.parse('2026-10-21T03:00:00Z'),
    'Not a historical run',
  );
  assert(
    run.state?.flow?.steps && run.state?.stepInfos,
    'Missing execution state',
  );
  const state = structuredClone(run.state);
  for (const [id, info] of Object.entries(state.stepInfos)) {
    if (info.status !== 'RUNNING') continue;
    assert.equal(
      state.flow.steps.find((step) => step.id === id)?.type,
      'ITERATOR',
      'Active non-iterator step',
    );
    info.status = 'STOPPED';
  }
  return state;
}
async function main() {
  const mode = process.env.GAINGE_ONBOARDING_CLEANUP_MODE;
  assert(['plan', 'apply', 'verify'].includes(mode), 'Explicit mode required');
  assert.equal(new Set(ids).size, 21);
  const { Client } = require('pg');
  const url = new URL(process.env.PG_DATABASE_URL);
  url.searchParams.delete('sslmode');
  const db = new Client({
    connectionString: url.toString(),
    ssl:
      process.env.PG_SSL_ALLOW_SELF_SIGNED === 'true'
        ? { rejectUnauthorized: false }
        : undefined,
  });
  await db.connect();
  try {
    await db.query('BEGIN');
    await db.query("SET LOCAL lock_timeout = '5s'");
    await db.query("SET LOCAL statement_timeout = '30s'");
    const version = (
      await db.query(
        `SELECT status FROM ${schema}."workflowVersion" WHERE id = $1 AND "workflowId" = $2 FOR SHARE`,
        [activeVersionId, workflowId],
      )
    ).rows;
    assert.equal(version[0]?.status, 'ACTIVE', 'Keep v3 active');
    const runs = (
      await db.query(
        `SELECT id, status, "workflowId", "workflowVersionId", "startedAt", "endedAt", state FROM ${schema}."workflowRun" WHERE id = ANY($1::uuid[]) AND "deletedAt" IS NULL ORDER BY id FOR UPDATE`,
        [ids],
      )
    ).rows;
    assert.equal(runs.length, 21, 'All approved runs must exist');
    const states = runs.map(stoppedState); // Validate entire batch before writing.
    for (const [index, run] of runs.entries()) {
      if (mode === 'verify') {
        assert.equal(run.status, 'STOPPED');
        assert(run.endedAt, 'Missing end time');
        assert.deepEqual(run.state, states[index], 'Running steps remain');
      }
      if (mode === 'apply' && run.status !== 'STOPPED') {
        const result = await db.query(
          `UPDATE ${schema}."workflowRun" SET status = 'STOPPED', "endedAt" = NOW(), "updatedAt" = NOW(), state = $2::jsonb WHERE id = $1 AND status = $3`,
          [run.id, JSON.stringify(states[index]), run.status],
        );
        assert.equal(result.rowCount, 1);
      }
    }
    await db.query(mode === 'apply' ? 'COMMIT' : 'ROLLBACK');
    console.log(
      JSON.stringify({
        mode,
        count: runs.length,
        before: runs.map(({ id, status }) => ({ id, status })),
        result: mode === 'apply' || mode === 'verify' ? 'STOPPED' : 'validated',
        activeVersion: activeVersionId,
      }),
    );
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  } finally {
    await db.end();
  }
}
module.exports = {
  stoppedState,
  ids,
  workflowId,
  oldVersionId,
  activeVersionId,
  interruptedV3Id,
};
if (require.main === module || process.argv.length === 1)
  main().catch((error) => {
    console.error('Cleanup failed:', error.code ?? error.message);
    process.exitCode = 1;
  });
