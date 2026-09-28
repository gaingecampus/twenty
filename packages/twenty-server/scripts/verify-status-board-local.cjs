const assert = require('node:assert/strict');
const fs = require('node:fs');
const connect = require('./local-status-board-client.cjs');
const production = require('./status-board-production-schema.json');
(async () => {
  const { c, schema, workspaceId, gql } = await connect();
  try {
    const metadata = (
      await c.query(
        'select o."nameSingular" obj,f.*,t."nameSingular" target from core."fieldMetadata" f join core."objectMetadata" o on o.id=f."objectMetadataId" left join core."objectMetadata" t on t.id=f."relationTargetObjectMetadataId" where o."workspaceId"=$1',
        [workspaceId],
      )
    ).rows;
    let checked = 0;
    for (const f of metadata) {
      const p = production[f.obj]?.find((p) => p.name === f.name);
      if (!p) continue;
      assert.equal(f.type, p.type, f.obj + '.' + f.name);
      if (p.type === 'RELATION')
        assert.equal(f.target, p.target, f.obj + '.' + f.name);
      if (p.options)
        assert.deepEqual(
          f.options.map(({ value, label, color, position }) => ({
            value,
            label,
            color,
            position,
          })),
          p.options.map(({ value, label, color, position }) => ({
            value, label, color, position,
          })),
          f.obj + '.' + f.name,
        );
      checked++;
    }
    const records = await gql(
      '{onboardings(first:100){edges{node{id visitDays leadConsultant{id} executionConsultant{id}}}} groups(first:100){edges{node{id sosogGuseongweon{edges{node{id}}}}}}}',
      {},
      'graphql',
    );
    const backupArg = process.argv.find((a) => a.startsWith('--backup='));
    if (backupArg) {
      const original = JSON.parse(fs.readFileSync(backupArg.slice(9), 'utf8'));
      assert.equal(original.workspaceId, workspaceId);
      const contracts = records.onboardings.edges.map((e) => e.node);
      assert.equal(
        contracts.length,
        original.data.onboarding.filter((r) => !r.deletedAt).length,
      );
      for (const r of contracts) {
        const old = original.data.onboarding.find((o) => o.id === r.id);
        assert.equal(r.leadConsultant?.id ?? null, old.leadConsultantId);
        assert.equal(
          r.executionConsultant?.id ?? null,
          old.executionConsultantId,
        );
        assert.deepEqual(
          r.visitDays,
          old.visitDays == null ? null : [old.visitDays],
        );
      }
      for (const group of records.groups.edges.map((e) => e.node)) {
        assert.deepEqual(
          group.sosogGuseongweon.edges.map((e) => e.node.id).sort(),
          original.data.teamMember
            .filter((m) => !m.deletedAt && m.currentGroupId === group.id)
            .map((m) => m.id)
            .sort(),
        );
      }
      for (const [obj, before] of Object.entries(original.data)) {
        const table = [
          'company',
          'person',
          'opportunity',
          'workspaceMember',
        ].includes(obj)
          ? obj
          : '_' + obj;
        const current = (await c.query(`select id from "${schema}"."${table}"`))
          .rows;
        assert.deepEqual(
          current.map((r) => r.id).sort(),
          before.map((r) => r.id).sort(),
          obj + ' record IDs',
        );
      }
    }
    console.log(
      JSON.stringify({
        checkedFields: checked,
        contractAndGroupGraphql: 'passed',
        backupDataPreservation: backupArg ? 'passed' : 'not requested',
      }),
    );
  } finally {
    await c.end();
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
