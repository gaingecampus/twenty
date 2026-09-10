// Run through the existing authenticated production deployment role or the local helper.
// Never prints record content. Plan is read-only; apply is transactional and idempotent.
const assert = require('node:assert/strict');
const { Client } = require('pg');
const stageKeys = [
  'Inquiry',
  'Communicating',
  'TechnicalConsult',
  'Proposal',
  'FollowUp',
  'OnHold',
  'Closed',
  'MatchingSuccess',
];
const retiredWorkflowIds = [
  '0175106c-bda8-495c-97f5-84a17f83f71b',
  'ab910978-c8dd-46a3-8b39-9aa05ea69e26',
];

async function migrate(db, workspaceId, mode, triggerSql) {
  assert.ok(['plan', 'apply', 'verify'].includes(mode));
  const workspace = (
    await db.query('SELECT "databaseSchema" FROM core.workspace WHERE id=$1', [
      workspaceId,
    ])
  ).rows[0];
  assert.ok(workspace, 'Workspace missing');
  const schema = workspace.databaseSchema;
  assert.match(schema, /^[a-zA-Z_][a-zA-Z0-9_]*$/);
  const ns = `"${schema}"`,
    table = `${ns}."opportunity"`,
    backup = `${ns}."_gaingeInquiryTimingBackup20260910"`;
  const legacy = ['matchingSuccessAt', 'soyoSiganIl'];
  const selected = [
    'id',
    'customStage',
    'firstInquiryDate',
    'createdAt',
    'deletedAt',
    'updatedAt',
    'updatedBySource',
    'updatedByName',
    'updatedByWorkspaceMemberId',
    'updatedByContext',
    'sotongWanryoIlja',
    ...legacy,
    'stageTimingStartedAt',
    'stageTimingOriginAt',
    ...stageKeys.flatMap((k) => [`stage${k}ReachedAt`, `stage${k}Days`]),
  ];
  const snapshot = `jsonb_build_object(${selected.map((k) => `'${k}',to_jsonb(o)->'${k}'`).join(',')})`;
  const columns = (
    await db.query(
      'SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2',
      [schema, 'opportunity'],
    )
  ).rows.map((x) => x.column_name);
  for (const key of [
    'sotongWanryoIlja',
    'firstInquiryDate',
    ...stageKeys.flatMap((k) => [`stage${k}ReachedAt`, `stage${k}Days`]),
  ])
    assert.ok(columns.includes(key), `Missing field: ${key}`);
  const active = (
    await db.query(
      `SELECT id FROM ${ns}."workflowVersion" WHERE status='ACTIVE' AND "deletedAt" IS NULL AND "workflowId"=ANY($1::uuid[])`,
      [retiredWorkflowIds],
    )
  ).rows;
  const pending = (
    await db.query(
      `SELECT status,count(*)::int AS count FROM ${ns}."workflowRun" WHERE "workflowId"=ANY($1::uuid[]) AND "deletedAt" IS NULL AND status IN ('NOT_STARTED','ENQUEUED','RUNNING','STOPPING') GROUP BY status`,
      [retiredWorkflowIds],
    )
  ).rows;
  const stats = (
    await db.query(`SELECT count(*)::int AS total,
    count(*) FILTER(WHERE to_jsonb(o)->>'matchingSuccessAt' IS NOT NULL)::int AS legacyDates,
    count(*) FILTER(WHERE to_jsonb(o)->>'soyoSiganIl' IS NOT NULL)::int AS legacyDays,
    count(*) FILTER(WHERE to_jsonb(o)->>'soyoSiganIl' IS NOT NULL AND "customStage"::text NOT IN ('ON_HOLD','MATCHING_HOLD_COMPLETED','MATCHING_SUCCESS'))::int AS ambiguousDays
    FROM ${table} o`)
  ).rows[0];
  if (mode === 'plan')
    return {
      mode,
      workspaceId,
      ...stats,
      activeWorkflowVersions: active,
      pendingRuns: pending,
    };
  if (mode === 'verify') {
    const stored = (
      await db.query(`SELECT count(*)::int AS count FROM ${backup}`)
    ).rows[0].count;
    const errors = (
      await db.query(`SELECT count(*)::int AS count FROM ${backup} b JOIN ${table} o ON o.id=b.id WHERE
      (b.data->>'matchingSuccessAt' IS NOT NULL AND (o."stageMatchingSuccessReachedAt" IS NULL OR o."stageMatchingSuccessReachedAt">(b.data->>'matchingSuccessAt')::timestamptz))`)
    ).rows[0].count;
    assert.equal(errors, 0, 'Legacy success dates were not preserved');
    const trigger = (
      await db.query(
        'SELECT pg_get_functiondef($1::regprocedure) AS definition',
        [`${ns}.gainge_measure_opportunity_stage()`],
      )
    ).rows[0].definition;
    assert.ok(
      trigger.includes('inquiry_date') && trigger.includes('sotongWanryoIlja'),
      'Expected trigger is not installed',
    );
    return {
      mode,
      workspaceId,
      backupRecords: stored,
      legacyDateErrors: errors,
      activeWorkflowVersions: active,
      pendingRuns: pending,
      legacyFieldsPresent: legacy.filter((x) => columns.includes(x)),
    };
  }
  assert.equal(
    active.length,
    0,
    'Deactivate the two retired workflows before applying',
  );
  assert.equal(
    pending.length,
    0,
    'Stop or drain outstanding retired workflow runs before applying',
  );
  assert.ok(
    triggerSql?.includes('gainge_measure_opportunity_stage'),
    'Trigger SQL missing',
  );
  await db.query('BEGIN');
  try {
    await db.query("SET LOCAL lock_timeout='5s'");
    await db.query("SET LOCAL statement_timeout='90s'");
    await db.query(`LOCK TABLE ${table} IN SHARE ROW EXCLUSIVE MODE`);
    await db.query(
      `CREATE TABLE IF NOT EXISTS ${backup}(id uuid PRIMARY KEY,data jsonb NOT NULL,"backedUpAt" timestamptz NOT NULL DEFAULT now())`,
    );
    const already = (await db.query(`SELECT count(*)::int AS n FROM ${backup}`))
      .rows[0].n;
    if (already) {
      // A committed migration is never replayed against newer edits.
      await db.query(triggerSql.replaceAll('"gainge_workspace"', ns));
      await db.query('COMMIT');
      return {
        mode,
        workspaceId,
        alreadyApplied: true,
        backupRecords: already,
      };
    }
    await db.query(
      `INSERT INTO ${backup}(id,data) SELECT o.id,${snapshot} FROM ${table} o`,
    );
    const backed = (await db.query(`SELECT count(*)::int AS n FROM ${backup}`))
      .rows[0].n;
    assert.equal(
      backed,
      (await db.query(`SELECT count(*)::int AS n FROM ${table}`)).rows[0].n,
      'Backup count mismatch',
    );
    // Only the measurement trigger is paused inside this locked transaction.
    await db.query(
      `ALTER TABLE ${table} DISABLE TRIGGER gainge_opportunity_stage_timing`,
    );
    await db.query(`UPDATE ${table} o SET "updatedBySource"='SYSTEM',"updatedByName"='문의 측정 데이터 이전',"stageMatchingSuccessReachedAt"=LEAST(o."stageMatchingSuccessReachedAt",(b.data->>'matchingSuccessAt')::timestamptz)
      FROM ${backup} b WHERE o.id=b.id AND b.data->>'matchingSuccessAt' IS NOT NULL`);
    // Known terminal observations can backfill completion; never invent today's date for legacy records.
    await db.query(
      `UPDATE ${table} SET "updatedBySource"='SYSTEM',"updatedByName"='문의 측정 데이터 이전',"sotongWanryoIlja"=COALESCE("sotongWanryoIlja",(LEAST("stageOnHoldReachedAt","stageClosedReachedAt","stageMatchingSuccessReachedAt") AT TIME ZONE 'Asia/Seoul')::date)`,
    );
    // Preserve historical numeric values in the relevant empty stage field as requested.
    // If a dated observation exists, the new inquiry-date calculation below is authoritative.
    for (const [stage, key] of [
      ['ON_HOLD', 'OnHold'],
      ['MATCHING_HOLD_COMPLETED', 'Closed'],
      ['MATCHING_SUCCESS', 'MatchingSuccess'],
    ]) {
      await db.query(
        `UPDATE ${table} o SET "updatedBySource"='SYSTEM',"updatedByName"='문의 측정 데이터 이전',"stage${key}Days"=COALESCE(o."stage${key}Days",(b.data->>'soyoSiganIl')::numeric)
        FROM ${backup} b WHERE o.id=b.id AND o."customStage"::text=$1 AND b.data->>'soyoSiganIl' IS NOT NULL`,
        [stage],
      );
    }
    await db.query(`UPDATE ${table} SET "updatedBySource"='SYSTEM',"updatedByName"='문의 측정 데이터 이전',"stageTimingOriginAt"="firstInquiryDate"::timestamp AT TIME ZONE 'Asia/Seoul',
      ${stageKeys.map((k) => `"stage${k}Days"=CASE WHEN "stage${k}ReachedAt" IS NULL THEN "stage${k}Days" WHEN "firstInquiryDate" IS NOT NULL AND ("stage${k}ReachedAt" AT TIME ZONE 'Asia/Seoul')::date>="firstInquiryDate" THEN ("stage${k}ReachedAt" AT TIME ZONE 'Asia/Seoul')::date-"firstInquiryDate" ELSE NULL END`).join(',')}`);
    await db.query(triggerSql.replaceAll('"gainge_workspace"', ns));
    await db.query(
      `ALTER TABLE ${table} ENABLE TRIGGER gainge_opportunity_stage_timing`,
    );
    const missing = (
      await db.query(
        `SELECT count(*)::int AS n FROM ${backup} b JOIN ${table} o ON o.id=b.id WHERE b.data->>'matchingSuccessAt' IS NOT NULL AND (o."stageMatchingSuccessReachedAt" IS NULL OR o."stageMatchingSuccessReachedAt">(b.data->>'matchingSuccessAt')::timestamptz)`,
      )
    ).rows[0].n;
    assert.equal(missing, 0, 'Success date preservation failed');
    await db.query('COMMIT');
    return { mode, workspaceId, backupRecords: backed, ...stats };
  } catch (e) {
    await db.query('ROLLBACK');
    throw e;
  }
}
module.exports = { migrate };
if (require.main === module || (process.argv.length === 1 && process.env.GAINGE_TIMING_MODE)) {
  (async () => {
    const workspaceId = process.env.GAINGE_TIMING_WORKSPACE_ID;
    assert.equal(
      workspaceId,
      '5cd16cee-0d32-4404-93b9-e707e01ada9d',
      'Production workspace must be explicit',
    );
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
      console.log(
        JSON.stringify(
          await migrate(
            db,
            workspaceId,
            process.env.GAINGE_TIMING_MODE || 'plan',
            Buffer.from(
              process.env.GAINGE_TIMING_SQL_B64 || '',
              'base64',
            ).toString(),
          ),
        ),
      );
    } finally {
      await db.end();
    }
  })().catch((e) => {
    console.error('Inquiry migration failed:', e.message);
    process.exitCode = 1;
  });
}
