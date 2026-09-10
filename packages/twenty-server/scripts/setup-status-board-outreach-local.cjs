// Run from the repository root. Additive local-only schema setup, matching gainge-crm outreach.
const connect = require('./local-status-board-client.cjs');
const fields = require('./status-board-outreach-schema.json');
const { randomUUID } = require('crypto');
(async () => {
  const { c, gql, workspaceId } = await connect();
  try {
    const objects = Object.fromEntries(
      (
        await c.query(
          'select id,"nameSingular" from core."objectMetadata" where "workspaceId"=$1 and "isActive"=true',
          [workspaceId],
        )
      ).rows.map((r) => [r.nameSingular, r.id]),
    );
    if (!objects.outreach) {
      const result = await gql(
        'mutation($input:CreateOneObjectInput!){createOneObject(input:$input){id}}',
        {
          input: {
            object: {
              nameSingular: 'outreach',
              namePlural: 'outreaches',
              labelSingular: '심방 기록',
              labelPlural: '심방 기록',
              icon: 'IconSend',
            },
          },
        },
      );
      objects.outreach = result.createOneObject.id;
      console.log('Created outreach');
    }
    for (const source of fields) {
      const existing = (
        await c.query(
          'select id from core."fieldMetadata" where "objectMetadataId"=$1 and name=$2 and "isActive"=true',
          [objects.outreach, source.name],
        )
      ).rows[0];
      if (existing) continue;
      const { target, ...field } = source;
      if (target && !objects[target])
        throw Error('Missing local relation target: ' + target);
      if (field.options)
        field.options = field.options.map((option) => ({
          ...option,
          id: randomUUID(),
        }));
      const relation = target
        ? {
            relationCreationPayload: {
              type: 'MANY_TO_ONE',
              targetObjectMetadataId: objects[target],
              targetFieldLabel: '심방 기록',
              targetFieldIcon: 'IconSend',
            },
          }
        : {};
      await gql(
        'mutation($input:CreateOneFieldMetadataInput!){createOneField(input:$input){id}}',
        {
          input: {
            field: {
              objectMetadataId: objects.outreach,
              isNullable: true,
              ...field,
              ...relation,
            },
          },
        },
      );
      console.log('Added outreach.' + field.name);
    }
    const nameField = (
      await c.query(
        'select id,label from core."fieldMetadata" where "objectMetadataId"=$1 and name=$2',
        [objects.outreach, 'name'],
      )
    ).rows[0];
    if (nameField.label !== '제목')
      await gql(
        'mutation($input:UpdateOneFieldMetadataInput!){updateOneField(input:$input){id}}',
        {
          input: {
            id: nameField.id,
            update: { label: '제목', icon: 'IconSend' },
          },
        },
      );
    console.log('Outreach schema ready');
  } finally {
    await c.end();
  }
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
