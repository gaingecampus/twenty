// Bootstrap from current CRM values, never from an older workbook's coordinates.
const connect = require('./local-status-board-client.cjs');
const {
  configs,
  ensureFields,
} = require('./import-cash-flow-details-local.cjs');
const {
  fields: expenseFields,
} = require('./import-pending-expenses-local.cjs');
const {
  getFromMonth,
  identityFields,
  projectRow,
  syncTables,
  hideProvenance,
  summarize,
  writeIdentityMap,
  quote,
} = require('./backup-record-sync.cjs');

async function main() {
  const fromMonth = getFromMonth();
  const apply = process.argv.includes('--apply');
  const outputIndex = process.argv.indexOf('--output');
  const output = outputIndex >= 0 ? process.argv[outputIndex + 1] : null;
  if (apply && !output)
    throw Error('--output is required for the private identity map');
  const { c, gql, schema, workspaceId } = await connect();
  try {
    const objects = [];
    for (const config of [
      ...configs,
      { singular: 'pendingExpense', fields: expenseFields },
    ]) {
      const object = (
        await c.query(
          'select id from core."objectMetadata" where "workspaceId"=$1 and "nameSingular"=$2',
          [workspaceId, config.singular],
        )
      ).rows[0];
      if (!object) continue;
      if (apply) await ensureFields(c, gql, object.id, identityFields);
      objects.push({ ...config, objectId: object.id });
    }
    await c.query('BEGIN');
    let results;
    try {
      if (apply)
        for (const { singular } of [...objects].sort((a, b) =>
          a.singular.localeCompare(b.singular),
        ))
          await c.query(
            `LOCK TABLE ${quote(schema)}.${quote(`_${singular}`)} IN SHARE ROW EXCLUSIVE MODE`,
          );
      const batches = [];
      for (const { singular, fields } of objects) {
        const rows = (
          await c.query(
            `select * from ${quote(schema)}.${quote(`_${singular}`)} where "deletedAt" is null`,
          )
        ).rows;
        const incoming = rows.map((row) => {
          const current = projectRow(row, fields);
          // Existing baselines must never be reset to conceal later CRM edits.
          return {
            ...(current.backupBaseline
              ? JSON.parse(current.backupBaseline)
              : current),
            backupId: current.backupId || current.id,
            backupScope: current.backupScope,
          };
        });
        batches.push({ kind: singular, fields, incoming, fromMonth });
      }
      results = await syncTables(c, schema, batches, apply);
      await c.query(apply ? 'COMMIT' : 'ROLLBACK');
    } catch (error) {
      await c.query('ROLLBACK');
      throw error;
    }
    if (apply) {
      writeIdentityMap(output, results);
      for (const { objectId } of objects)
        await hideProvenance(c, gql, objectId);
    }
    console.log(JSON.stringify(summarize(results)));
  } finally {
    await c.end();
  }
}

if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
