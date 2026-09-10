// Add the production co-execution relation to the local development schema.
const connect = require('./local-status-board-client.cjs');
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
    if (!objects.onboarding || !objects.teamMember)
      throw Error('Local onboarding and teamMember objects are required');
    if (!objects.gyeyagGuseongweonLink) {
      const result = await gql(
        'mutation($input:CreateOneObjectInput!){createOneObject(input:$input){id}}',
        {
          input: {
            object: {
              nameSingular: 'gyeyagGuseongweonLink',
              namePlural: 'gyeyagGuseongweonLinks',
              labelSingular: '계약 구성원 Link',
              labelPlural: '계약 구성원 Links',
              icon: 'IconLink',
            },
          },
        },
      );
      objects.gyeyagGuseongweonLink = result.createOneObject.id;
    }
    const ensureRelation = async (
      object,
      name,
      label,
      type,
      target,
      targetLabel,
      settings = {},
    ) => {
      const existing = (
        await c.query(
          'select id from core."fieldMetadata" where "objectMetadataId"=$1 and name=$2',
          [objects[object], name],
        )
      ).rows[0];
      if (existing) return existing.id;
      const result = await gql(
        'mutation($input:CreateOneFieldMetadataInput!){createOneField(input:$input){id}}',
        {
          input: {
            field: {
              objectMetadataId: objects[object],
              name,
              label,
              type: 'RELATION',
              isNullable: true,
              icon: 'IconUsers',
              settings,
              relationCreationPayload: {
                type,
                targetObjectMetadataId: objects[target],
                targetFieldLabel: targetLabel,
                targetFieldIcon: 'IconLink',
              },
            },
          },
        },
      );
      return result.createOneField.id;
    };
    const targetId = await ensureRelation(
      'gyeyagGuseongweonLink',
      'guseongweon',
      '구성원',
      'MANY_TO_ONE',
      'teamMember',
      '공동 실행 계약 연결',
    );
    const fieldId = await ensureRelation(
      'onboarding',
      'gongdongSilhaengKeonseolteonteu',
      '공동 실행 컨설턴트',
      'ONE_TO_MANY',
      'gyeyagGuseongweonLink',
      '계약',
    );
    await gql(
      'mutation($input:UpdateOneFieldMetadataInput!){updateOneField(input:$input){id}}',
      {
        input: {
          id: fieldId,
          update: {
            settings: {
              relationType: 'ONE_TO_MANY',
              junctionTargetFieldId: targetId,
            },
          },
        },
      },
    );
    console.log('Local co-execution relation ready');
  } finally {
    await c.end();
  }
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
