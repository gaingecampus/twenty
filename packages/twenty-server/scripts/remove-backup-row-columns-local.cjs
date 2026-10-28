// Remove obsolete coordinates through the metadata API, preserving business data.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const connect = require('./local-status-board-client.cjs');
const { quote } = require('./backup-record-sync.cjs');

async function main() {
  const apply = process.argv.includes('--apply');
  const { c, gql, schema, workspaceId } = await connect();
  try {
    const targets = (
      await c.query(
        `select f.*, o."nameSingular" as kind from core."fieldMetadata" f join core."objectMetadata" o on o.id=f."objectMetadataId" where o."workspaceId"=$1 and o."nameSingular"=ANY($2) and f.name='sourceRow'`,
        [workspaceId, ['bankTransaction', 'expectedReceipt', 'pendingExpense']],
      )
    ).rows;
    const backups = [];
    const audit = async (kind) => {
      const { rows } = await c.query(
        `select to_jsonb(t)-'sourceRow' as value from ${quote(schema)}.${quote(`_${kind}`)} t order by id`,
      );
      return {
        count: rows.length,
        hash: createHash('sha256').update(JSON.stringify(rows)).digest('hex'),
      };
    };
    for (const field of targets) {
      const sorts = (
        await c.query(
          `select * from core."viewSort" where "fieldMetadataId"=$1 and "deletedAt" is null`,
          [field.id],
        )
      ).rows;
      const filters = (
        await c.query(
          `select id from core."viewFilter" where "fieldMetadataId"=$1 and "deletedAt" is null`,
          [field.id],
        )
      ).rows;
      if (filters.length)
        throw Error(`Review row filters on ${field.kind} before removal`);
      const dateField =
        field.kind === 'bankTransaction'
          ? 'transactionAt'
          : field.kind === 'expectedReceipt'
            ? 'expectedDate'
            : 'scheduledDate';
      const replacement = (
        await c.query(
          `select id from core."fieldMetadata" where "objectMetadataId"=$1 and name=$2`,
          [field.objectMetadataId, dateField],
        )
      ).rows[0];
      if (!replacement) throw Error(`Missing date field on ${field.kind}`);
      const coordinates = (
        await c.query(
          `select id,"sourceRow" from ${quote(schema)}.${quote(`_${field.kind}`)} order by id`,
        )
      ).rows;
      backups.push({
        field,
        sorts,
        replacement,
        coordinates,
        before: await audit(field.kind),
      });
    }
    console.log(
      JSON.stringify(
        backups.map(({ field, sorts, before }) => ({
          object: field.kind,
          remove: field.name,
          dateSorts: sorts.length,
          records: before.count,
        })),
      ),
    );
    if (!apply || !backups.length) return;
    const directory = 'data/backups/schema-cleanup';
    fs.mkdirSync(directory, { recursive: true });
    const backupPath = path.join(directory, `row-columns-${Date.now()}.json`);
    fs.writeFileSync(
      backupPath,
      JSON.stringify({ workspaceId, schema, backups }, null, 2),
      { mode: 0o600, flag: 'wx' },
    );
    console.log(JSON.stringify({ recoveryFile: backupPath }));
    for (const { field, sorts, replacement, before } of backups) {
      for (const sort of sorts) {
        await gql(
          'mutation($input:DeleteViewSortInput!){deleteViewSort(input:$input)}',
          { input: { id: sort.id } },
        );
        const existing = (
          await c.query(
            `select id from core."viewSort" where "viewId"=$1 and "fieldMetadataId"=$2 and "deletedAt" is null`,
            [sort.viewId, replacement.id],
          )
        ).rows;
        if (!existing.length)
          await gql(
            'mutation($input:CreateViewSortInput!){createViewSort(input:$input){id}}',
            {
              input: {
                viewId: sort.viewId,
                fieldMetadataId: replacement.id,
                direction: sort.direction,
              },
            },
          );
      }
      await gql(
        'mutation($input:DeleteOneFieldInput!){deleteOneField(input:$input){id}}',
        { input: { id: field.id } },
      );
      const after = await audit(field.kind);
      if (after.count !== before.count || after.hash !== before.hash)
        throw Error(
          `Business data changed unexpectedly: ${field.kind}; inspect recovery file`,
        );
      const remaining = (
        await c.query(
          `select column_name from information_schema.columns where table_schema=$1 and table_name=$2 and column_name='sourceRow'`,
          [schema, `_${field.kind}`],
        )
      ).rows;
      if (remaining.length) throw Error(`Column still present: ${field.kind}`);
      console.log(
        JSON.stringify({
          object: field.kind,
          removed: 'sourceRow',
          businessDataUnchanged: true,
          records: after.count,
        }),
      );
    }
  } finally {
    await c.end();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
