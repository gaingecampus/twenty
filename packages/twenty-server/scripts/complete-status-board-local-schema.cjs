// Add production business fields and automation relations without copying records.
const crypto = require('node:crypto');
const connect = require('./local-status-board-client.cjs');
const production = require('./status-board-production-schema.json');
async function complete() {
  const { c, gql, workspaceId } = await connect();
  try {
    const objects = Object.fromEntries(
      (
        await c.query(
          'select id,"nameSingular" from core."objectMetadata" where "workspaceId"=$1',
          [workspaceId],
        )
      ).rows.map((o) => [o.nameSingular, o.id]),
    );
    for (const name of [
      'companyGuseongweonLink',
      'personGuseongweonLink',
      'opportunityGuseongweonLink',
    ]) {
      if (objects[name]) continue;
      const result = await gql(
        'mutation($input:CreateOneObjectInput!){createOneObject(input:$input){id}}',
        {
          input: {
            object: {
              nameSingular: name,
              namePlural: name + 's',
              labelSingular: name,
              labelPlural: name + 's',
              icon: 'IconLink',
            },
          },
        },
      );
      objects[name] = result.createOneObject.id;
      console.log('Created ' + name);
    }
    const read = async () =>
      (
        await c.query(
          'select * from core."fieldMetadata" where "workspaceId"=$1',
          [workspaceId],
        )
      ).rows;
    const update = (id, update) =>
      gql(
        'mutation($input:UpdateOneFieldMetadataInput!){updateOneField(input:$input){id}}',
        { input: { id, update } },
      );
    const add = async (obj, p) => {
      const existing = (await read()).find(
        (f) => f.objectMetadataId === objects[obj] && f.name === p.name,
      );
      if (existing) return existing;
      if (p.type === 'RELATION' && p.inverseName) {
        const metadata = await read();
        const inverse = metadata.find(
          (f) =>
            f.objectMetadataId === objects[p.target] &&
            f.name === p.inverseName,
        );
        const owning = metadata.find(
          (f) =>
            f.id === inverse?.relationTargetFieldMetadataId &&
            f.objectMetadataId === objects[obj],
        );
        if (owning) {
          await update(owning.id, { name: p.name, label: p.label });
          return (await read()).find((f) => f.id === owning.id);
        }
      }
      const field = {
        objectMetadataId: objects[obj],
        name: p.name,
        label: p.label,
        type: p.type,
        isNullable: true,
        icon: 'IconList',
      };
      if (p.type === 'FILES') field.settings = p.settings;
      if (p.options)
        field.options = p.options.map((o) => ({
          ...o,
          id: crypto.randomUUID(),
        }));
      if (p.type === 'RELATION')
        field.relationCreationPayload = {
          type: 'MANY_TO_ONE',
          targetObjectMetadataId: objects[p.target],
          targetFieldLabel: p.inverseLabel ?? obj + ' ' + p.name,
          targetFieldIcon: 'IconLink',
        };
      await gql(
        'mutation($input:CreateOneFieldMetadataInput!){createOneField(input:$input){id}}',
        { input: { field } },
      );
      console.log('Added ' + obj + '.' + p.name);
      return (await read()).find(
        (f) => f.objectMetadataId === objects[obj] && f.name === p.name,
      );
    };
    // Standard system fields are supplied by Twenty when an object is created.
    for (const [obj, fields] of Object.entries(production))
      for (const p of fields) {
        if (
          !objects[obj] ||
          !p.label ||
          p.type === 'RELATION' ||
          ['TS_VECTOR', 'MORPH_RELATION'].includes(p.type)
        )
          continue;
        await add(obj, p);
      }
    // Create owning relations; Twenty creates the inverse field in the same mutation.
    for (const [obj, fields] of Object.entries(production))
      for (const p of fields) {
        if (
          !objects[obj] ||
          p.type !== 'RELATION' ||
          p.settings?.relationType !== 'MANY_TO_ONE' ||
          !objects[p.target]
        )
          continue;
        const f = await add(obj, p);
        if (p.inverseName) {
          const inverse = (await read()).find(
            (x) => x.id === f.relationTargetFieldMetadataId,
          );
          const collision = (await read()).find(
            (x) =>
              x.objectMetadataId === objects[p.target] &&
              x.name === p.inverseName,
          );
          if (inverse && inverse.name !== p.inverseName && !collision)
            await update(inverse.id, {
              name: p.inverseName,
              label: p.inverseLabel,
            });
        }
      }
    for (const [obj, fields] of Object.entries(production))
      for (const p of fields.filter((p) => p.junctionTargetFieldName)) {
        const metadata = await read();
        const f = metadata.find(
          (f) => f.objectMetadataId === objects[obj] && f.name === p.name,
        );
        const target = metadata.find(
          (f) =>
            f.objectMetadataId === objects[p.target] &&
            f.name === p.junctionTargetFieldName,
        );
        if (!f || !target)
          throw Error('Missing junction ' + obj + '.' + p.name);
        await update(f.id, {
          settings: {
            relationType: 'ONE_TO_MANY',
            junctionTargetFieldId: target.id,
          },
        });
      }
    console.log('Production business fields and automation relations ready');
  } finally {
    await c.end();
  }
}
module.exports = complete;
if (require.main === module)
  complete().catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
