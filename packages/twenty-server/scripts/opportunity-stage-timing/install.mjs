// Explicit operator installation: metadata via CRM API, trigger via the matching database.
// No credentials are stored or printed. Default is a read-only plan; pass --apply to install.
import pg from 'pg';
import {
  fields as timingFields,
  communicationCompletionField,
  buildStageTimingSql,
} from './schema.mjs';
const fields = [...timingFields, communicationCompletionField];

const workspaceId = process.argv
  .find((arg) => arg.startsWith('--workspace-id='))
  ?.split('=')[1];
const apply = process.argv.includes('--apply');
if (!/^[0-9a-f-]{36}$/i.test(workspaceId ?? ''))
  throw new Error('--workspace-id is required');
const api = new URL(process.env.CRM_API_URL);
if (
  api.protocol !== 'https:' &&
  !['localhost', '127.0.0.1'].includes(api.hostname)
) {
  throw new Error('Remote CRM requires HTTPS');
}
const client = new pg.Client({ connectionString: process.env.PG_DATABASE_URL });
await client.connect();
try {
  const workspace = (
    await client.query(
      'SELECT "databaseSchema" FROM core.workspace WHERE id=$1',
      [workspaceId],
    )
  ).rows[0];
  if (!workspace) throw new Error('Workspace not found');
  const sql = buildStageTimingSql(workspace.databaseSchema);
  const object = (
    await client.query(
      'SELECT id FROM core."objectMetadata" WHERE "workspaceId"=$1 AND "nameSingular"=$2 AND "isActive"=true',
      [workspaceId, 'opportunity'],
    )
  ).rows[0];
  if (!object) throw new Error('Opportunity metadata missing');
  const existing = (
    await client.query(
      'SELECT name,type FROM core."fieldMetadata" WHERE "objectMetadataId"=$1 AND "isActive"=true',
      [object.id],
    )
  ).rows;
  if (
    !existing.some(
      (field) => field.name === 'customStage' && field.type === 'SELECT',
    )
  )
    throw new Error('customStage SELECT missing');
  for (const field of fields) {
    const match = existing.find((item) => item.name === field.name);
    if (match && match.type !== field.type)
      throw new Error(`Field type mismatch: ${field.name}`);
  }
  const missing = fields.filter(
    (field) => !existing.some((item) => item.name === field.name),
  );
  console.log(
    JSON.stringify({
      workspaceId,
      schema: workspace.databaseSchema,
      missingFields: missing.map((field) => field.name),
      apply,
    }),
  );
  if (apply) {
    if (!process.env.CRM_ACCESS_TOKEN)
      throw new Error('CRM_ACCESS_TOKEN is required');
    // Check API token belongs to the same workspace by reading its object metadata first.
    const gql = async (query, variables) => {
      const response = await fetch(new URL('/metadata', api), {
        method: 'POST',
        redirect: 'error',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.CRM_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ query, variables }),
        signal: AbortSignal.timeout(30000),
      });
      const result = await response.json();
      if (!response.ok || result.errors)
        throw new Error(
          `CRM metadata request failed (${response.status}); check server logs`,
        );
      return result.data;
    };
    const remote = await gql(
      'query($id:UUID!){object(id:$id){id nameSingular}}',
      { id: object.id },
    );
    if (
      remote.object?.id !== object.id ||
      remote.object.nameSingular !== 'opportunity'
    ) {
      throw new Error('API and database workspace do not match');
    }
    for (const field of missing) {
      await gql(
        'mutation($input:CreateOneFieldMetadataInput!){createOneField(input:$input){id}}',
        {
          input: { field: { ...field, objectMetadataId: object.id } },
        },
      );
    }
    await client.query('BEGIN');
    try {
      await client.query("SET LOCAL lock_timeout = '5s'");
      await client.query("SET LOCAL statement_timeout = '30s'");
      const columns = (
        await client.query(
          'SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2',
          [workspace.databaseSchema, 'opportunity'],
        )
      ).rows;
      if (
        fields.some(
          (field) =>
            !columns.some((column) => column.column_name === field.name),
        )
      ) {
        throw new Error(
          'Physical columns missing; retry after metadata migrations finish',
        );
      }
      await client.query(sql);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
    console.log(
      'Stage timing installed. Existing records were not backfilled.',
    );
  } else {
    console.log(sql);
  }
} finally {
  await client.end();
}
