import connect from '../local-status-board-client.cjs';
import {
  fields as timingFields,
  communicationCompletionField,
  buildStageTimingSql,
} from './schema.mjs';
const fields = [...timingFields, communicationCompletionField];

const { c, gql, workspaceId, schema } = await connect();
try {
  const object = (
    await c.query(
      'SELECT id FROM core."objectMetadata" WHERE "workspaceId"=$1 AND "nameSingular"=$2 AND "isActive"=true',
      [workspaceId, 'opportunity'],
    )
  ).rows[0];
  if (!object) throw new Error('Local opportunity missing');
  const remote = await gql(
    'query($id:UUID!){object(id:$id){id nameSingular}}',
    { id: object.id },
  );
  if (remote.object?.id !== object.id)
    throw new Error('API and database mismatch');
  const existing = (
    await c.query(
      'SELECT id,name,type,description FROM core."fieldMetadata" WHERE "objectMetadataId"=$1 AND "isActive"=true',
      [object.id],
    )
  ).rows;
  if (!existing.some((field) => field.name === 'customStage'))
    throw new Error('Local customStage missing');
  for (const field of fields) {
    const match = existing.find((item) => item.name === field.name);
    if (match && match.type !== field.type)
      throw new Error(`Type mismatch: ${field.name}`);
    if (!match)
      await gql(
        'mutation($input:CreateOneFieldMetadataInput!){createOneField(input:$input){id}}',
        {
          input: { field: { ...field, objectMetadataId: object.id } },
        },
      );
    if (match && match.description !== field.description)
      await gql(
        'mutation($input:UpdateOneFieldMetadataInput!){updateOneField(input:$input){id}}',
        { input: { id: match.id, update: { description: field.description } } },
      );
  }
  await c.query('BEGIN');
  try {
    await c.query("SET LOCAL lock_timeout = '5s'");
    await c.query(buildStageTimingSql(schema));
    await c.query('COMMIT');
  } catch (error) {
    await c.query('ROLLBACK');
    throw error;
  }
  console.log(
    JSON.stringify({
      installed: true,
      workspaceId,
      schema,
      fieldCount: fields.length,
    }),
  );
} finally {
  await c.end();
}
