const assert = require('node:assert/strict');
// Run from the repository root. The client rejects non-local databases.
// Every test write is rolled back, including on failure.
(async () => {
  const { c, schema } = await require(
    process.cwd() +
      '/packages/twenty-server/scripts/local-status-board-client.cjs',
  )();
  const ns = '"' + schema + '"';
  let count = 0;
  try {
    await c.query('BEGIN');
    const a = (
      await c.query(
        `INSERT INTO ${ns}."_onboarding" (name,"consultingGoal","successCriteria","createdByName","updatedByName") VALUES ('validation A','goal v1','criteria v1','test','test') RETURNING id`,
      )
    ).rows[0].id;
    const b = (
      await c.query(
        `INSERT INTO ${ns}."_onboarding" (name,"createdByName","updatedByName") VALUES ('validation B','test','test') RETURNING id`,
      )
    ).rows[0].id;
    const reject = async (sql, args) => {
      await c.query('SAVEPOINT invalid');
      let failed = false;
      try {
        await c.query(sql, args);
      } catch {
        failed = true;
      }
      await c.query('ROLLBACK TO SAVEPOINT invalid');
      assert(failed);
      count++;
    };
    const insert = `INSERT INTO ${ns}."_fieldVisit" (name,"contractId","recordStatus","visitDate",activities,"sessionNumber","createdByName","updatedByName") VALUES ($1,$2,$3,$4,$5,$6,'test','test') RETURNING *`;
    await reject(insert, ['bad', null, 'DRAFT', null, null, null]);
    await reject(insert, ['bad', a, 'SUBMITTED', null, 'text', 1]);
    await reject(insert, ['bad', a, 'SUBMITTED', '2026-09-28', ' ', 1]);
    await reject(insert, ['bad', a, 'DRAFT', null, null, 1.5]);
    const draft = (await c.query(insert, ['draft', a, 'DRAFT', null, null, 1]))
      .rows[0];
    assert.equal(draft.goalSnapshot, null);
    count++;
    const submit = (
      await c.query(
        `UPDATE ${ns}."_fieldVisit" SET "recordStatus"='SUBMITTED',"visitDate"='2026-09-28',activities='completed' WHERE id=$1 RETURNING *`,
        [draft.id],
      )
    ).rows[0];
    assert.equal(submit.goalSnapshot, 'goal v1');
    assert.equal(submit.criteriaSnapshot, 'criteria v1');
    count++;
    await c.query(
      `UPDATE ${ns}."_onboarding" SET "consultingGoal"='goal v2' WHERE id=$1`,
      [a],
    );
    const edit = (
      await c.query(
        `UPDATE ${ns}."_fieldVisit" SET "goalSnapshot"='tampered',activities='edited' WHERE id=$1 RETURNING *`,
        [draft.id],
      )
    ).rows[0];
    assert.equal(edit.goalSnapshot, 'goal v1');
    count++;
    await reject(`UPDATE ${ns}."_fieldVisit" SET "contractId"=$1 WHERE id=$2`, [
      b,
      draft.id,
    ]);
    await reject(
      `UPDATE ${ns}."_fieldVisit" SET "recordStatus"='DRAFT' WHERE id=$1`,
      [draft.id],
    );
    await c.query(
      `UPDATE ${ns}."_fieldVisit" SET "deletedAt"=now() WHERE id=$1`,
      [draft.id],
    );
    await c.query(
      `UPDATE ${ns}."_fieldVisit" SET "deletedAt"=null WHERE id=$1`,
      [draft.id],
    );
    count++;
    const second = (
      await c.query(insert, [
        'another',
        a,
        'SUBMITTED',
        '2026-09-28',
        'done',
        1,
      ])
    ).rows[0];
    assert.equal(second.goalSnapshot, 'goal v2');
    count++;
    console.log(
      `${count} database validation assertions passed; transaction rolled back.`,
    );
  } finally {
    await c.query('ROLLBACK');
    await c.end();
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
