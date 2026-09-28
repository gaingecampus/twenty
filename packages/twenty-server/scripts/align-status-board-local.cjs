// Align existing local business fields with the reviewed production snapshot.
// Metadata changes use the local API; data is backed up before any changes.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const path = require('node:path');
const connect = require('./local-status-board-client.cjs');
const production = require('./status-board-production-schema.json');
const qi = (s) => '"' + s.replaceAll('"', '""') + '"';
const normalizedOptions = (options) =>
  (options ?? []).map(({ value, label, color, position }) => ({
    value,
    label,
    color,
    position,
  }));

async function align({ apply = false, followUpStage, resume } = {}) {
  if (
    followUpStage &&
    !production.opportunity
      .find((f) => f.name === 'customStage')
      .options.some((o) => o.value === followUpStage)
  ) {
    throw Error('follow-up-stage must be a current production inquiry stage');
  }
  const { c, gql, workspaceId, schema } = await connect();
  try {
    const objects = (
      await c.query(
        'select * from core."objectMetadata" where "workspaceId"=$1 and "isActive"=true',
        [workspaceId],
      )
    ).rows;
    const fields = async () =>
      (
        await c.query(
          'select f.*,o."nameSingular" obj,t."nameSingular" target from core."fieldMetadata" f join core."objectMetadata" o on o.id=f."objectMetadataId" left join core."objectMetadata" t on t.id=f."relationTargetObjectMetadataId" where o."workspaceId"=$1',
          [workspaceId],
        )
      ).rows;
    const table = async (name) => {
      for (const candidate of [name, '_' + name]) {
        if (
          (
            await c.query('select to_regclass($1) present', [
              qi(schema) + '.' + qi(candidate),
            ])
          ).rows[0].present
        )
          return qi(schema) + '.' + qi(candidate);
      }
      throw Error('Missing local table: ' + name);
    };
    const saved = resume ? JSON.parse(fs.readFileSync(resume, 'utf8')) : null;
    if (saved && (saved.workspaceId !== workspaceId || saved.schema !== schema))
      throw Error('Backup workspace mismatch');
    const initial = saved?.fields ?? (await fields());
    const data = {};
    for (const name of [...Object.keys(production), 'workspaceMember']) {
      if (objects.some((o) => o.nameSingular === name))
        data[name] = (
          await c.query('select * from ' + (await table(name)))
        ).rows;
    }
    if (saved) Object.assign(data, saved.data);
    const mismatch = initial
      .filter((f) => f.isActive)
      .flatMap((f) => {
        const p = production[f.obj]?.find((p) => p.name === f.name);
        if (!p) return [];
        const structural =
          p.type !== f.type || (p.type === 'RELATION' && p.target !== f.target);
        const options =
          p.options &&
          JSON.stringify(normalizedOptions(f.options)) !==
            JSON.stringify(p.options);
        return structural || options
          ? [
              {
                object: f.obj,
                name: f.name,
                structural: !!structural,
                options: !!options,
              },
            ]
          : [];
      });
    console.log(JSON.stringify({ mismatches: mismatch }));
    if (!apply) return mismatch;
    const backupDir = path.resolve('data/local-schema-alignment');
    fs.mkdirSync(backupDir, { recursive: true });
    const backupPath = path.join(
      backupDir,
      'before-' + new Date().toISOString().replaceAll(':', '-') + '.json',
    );
    fs.writeFileSync(
      backupPath,
      JSON.stringify({ workspaceId, schema, fields: initial, data }, null, 2),
      { mode: 0o600, flag: 'wx' },
    );
    console.log('Backup: ' + backupPath);
    const update = (id, update) =>
      gql(
        'mutation($input:UpdateOneFieldMetadataInput!){updateOneField(input:$input){id}}',
        { input: { id, update } },
      );
    const remove = (id) =>
      gql(
        'mutation($input:DeleteOneFieldInput!){deleteOneField(input:$input){id}}',
        { input: { id } },
      );
    const create = async (obj, p, inverseLabel) => {
      const field = {
        objectMetadataId: objects.find((o) => o.nameSingular === obj).id,
        name: p.name,
        label: p.label,
        type: p.type,
        isNullable: true,
        icon: 'IconList',
      };
      if (p.options)
        field.options = p.options.map((o) => ({
          ...o,
          id: crypto.randomUUID(),
        }));
      if (p.type === 'RELATION')
        field.relationCreationPayload = {
          type: p.settings.relationType,
          targetObjectMetadataId: objects.find(
            (o) => o.nameSingular === p.target,
          ).id,
          targetFieldLabel: inverseLabel,
          targetFieldIcon: 'IconLink',
        };
      return (
        await gql(
          'mutation($input:CreateOneFieldMetadataInput!){createOneField(input:$input){id}}',
          { input: { field } },
        )
      ).createOneField.id;
    };
    const legacy = (await fields())
      .filter((f) => f.name.startsWith('legacyAlignment'))
      .map((f) => f.id);
    const renameLegacy = async (f) => {
      const name = 'legacyAlignment' + f.id.replaceAll('-', '');
      const current = (await fields()).find((x) => x.id === f.id);
      if (!current) return;
      if (current.name !== name)
        await update(f.id, { name, label: '이전 로컬 ' + f.label });
      if (!legacy.includes(f.id)) legacy.push(f.id);
      // PostgreSQL preserves the old FK constraint name when a column is renamed.
      // Free that name so the replacement relation can create its own constraint.
      if (f.type === 'RELATION' && f.settings?.relationType === 'MANY_TO_ONE') {
        const constraints = (
          await c.query(
            `select con.conname from pg_constraint con join pg_attribute a on a.attrelid=con.conrelid and a.attnum=ANY(con.conkey) where con.conrelid=$1::regclass and con.contype='f' and a.attname=$2`,
            [await table(f.obj), name + 'Id'],
          )
        ).rows;
        for (const row of constraints)
          if (row.conname !== 'legacy_' + f.id)
            await c.query(
              `alter table ${await table(f.obj)} rename constraint ${qi(row.conname)} to ${qi('legacy_' + f.id)}`,
            );
      }
    };
    const restore = async (obj, column, rows) => {
      await c.query('BEGIN');
      try {
        for (const { id, value } of rows)
          await c.query(
            `update ${await table(obj)} set ${qi(column)}=$2,"updatedBySource"='SYSTEM',"updatedByName"='로컬 운영 구조 정리' where id=$1`,
            [id, value],
          );
        const stored = (
          await c.query(
            `select id,to_jsonb(t)->$1 value from ${await table(obj)} t`,
            [column],
          )
        ).rows;
        for (const row of rows)
          assert.deepEqual(
            stored.find((r) => r.id === row.id)?.value,
            row.value,
            `${obj}.${column}:${row.id}`,
          );
        await c.query('COMMIT');
      } catch (e) {
        await c.query('ROLLBACK');
        throw e;
      }
    };
    // Only unambiguous conversions are automatic. Historical values remain in backup.
    for (const item of mismatch.filter(
      (m) => m.structural && m.name !== 'sosogGuseongweon',
    )) {
      const f = initial.find(
        (f) => f.obj === item.object && f.name === item.name,
      );
      const p = production[f.obj].find((p) => p.name === f.name);
      const column = p.type === 'RELATION' ? p.settings.joinColumnName : p.name;
      const rows = data[f.obj].map((r) => {
        let value = r[f.name];
        if (p.type === 'RELATION') {
          value = r[column] ?? null;
          if (value && !data.teamMember.some((m) => m.id === value))
            throw Error(
              'Cannot map member: ' + f.obj + '.' + f.name + ' record ' + r.id,
            );
        } else if (p.type === 'MULTI_SELECT') {
          value = value == null ? null : Array.isArray(value) ? value : [value];
          if (value?.some((v) => !p.options.some((o) => o.value === v)))
            throw Error('Unknown multi-select value: ' + f.obj + '.' + f.name);
        } else if (p.type === 'TEXT')
          value = value == null ? null : String(value);
        return { id: r.id, value };
      });
      const current = (await fields()).find(
        (x) => x.obj === f.obj && x.name === f.name,
      );
      if (
        current?.type === p.type &&
        (p.type !== 'RELATION' || current.target === p.target)
      ) {
        await restore(f.obj, column, rows);
        continue;
      }
      // Standalone UUID fields conflict with the new relation's generated join column.
      if (p.type === 'RELATION') {
        const standalone = initial.find(
          (x) => x.obj === f.obj && x.name === column && x.type === 'UUID',
        );
        if (standalone) await renameLegacy(standalone);
      }
      await renameLegacy(f);
      await create(f.obj, p, '정리 ' + f.obj + ' ' + f.name);
      await restore(f.obj, column, rows);
      console.log('Aligned ' + f.obj + '.' + f.name);
    }
    // Reuse the existing member -> group relation, preserving all membership IDs.
    const oldGroup = initial.find(
      (f) =>
        f.obj === 'group' &&
        f.name === 'sosogGuseongweon' &&
        f.target !== 'teamMember',
    );
    if (oldGroup) {
      const currentGroup = initial.find(
        (f) => f.obj === 'teamMember' && f.name === 'currentGroup',
      );
      const inverse = initial.find(
        (f) => f.id === currentGroup.relationTargetFieldMetadataId,
      );
      const counterpart = initial.find(
        (f) => f.id === oldGroup.relationTargetFieldMetadataId,
      );
      const key = counterpart?.settings?.joinColumnName;
      if (key && data.workspaceMember.some((r) => r[key]))
        throw Error(
          'Existing login-account group assignments require an explicit member mapping',
        );
      await renameLegacy(oldGroup);
      await update(inverse.id, {
        name: 'sosogGuseongweon',
        label: '소속 구성원',
      });
    }
    for (const item of mismatch.filter((m) => m.options && !m.structural)) {
      const f = (await fields()).find(
        (f) => f.obj === item.object && f.name === item.name,
      );
      const p = production[f.obj].find((p) => p.name === f.name);
      if (
        f.obj === 'opportunity' &&
        f.name === 'customStage' &&
        data.opportunity.some((r) => r.customStage === 'FOLLOW_UP') &&
        !followUpStage
      ) {
        console.log('Pending explicit FOLLOW_UP mapping');
        continue;
      }
      const conversions = {
        'teamMember.employmentStatus': { INACTIVE: 'LEFT' },
        'opportunity.customStage': { FOLLOW_UP: followUpStage },
      };
      const rows = data[f.obj].map((r) => {
        const old = r[f.name];
        let value = old;
        if (old != null && !p.options.some((o) => o.value === old)) {
          value = conversions[f.obj + '.' + f.name]?.[old];
          // CEO does not distinguish founder/successor/professional executive.
          if (
            f.obj === 'company' &&
            f.name === 'executiveType' &&
            old === 'CEO'
          )
            value = null;
          if (value === undefined)
            throw Error('Unmapped option ' + f.obj + '.' + f.name + ': ' + old);
        }
        return { id: r.id, value };
      });
      const options = p.options.map((o) => ({
        ...o,
        id:
          f.options?.find((old) => old.value === o.value)?.id ??
          crypto.randomUUID(),
      }));
      const obsolete = (f.options ?? []).filter(
        (o) => !options.some((n) => n.value === o.value),
      );
      // Add valid options before moving records; remove retired options only afterward.
      await update(f.id, {
        options: [
          ...options,
          ...obsolete.map((o, i) => ({ ...o, position: options.length + i })),
        ],
        defaultValue: null,
      });
      await restore(f.obj, f.name, rows);
      await update(f.id, { label: p.label, options });
      console.log('Aligned options ' + f.obj + '.' + f.name);
    }
    // Validate copied data before deleting the replaced local definitions.
    for (const item of mismatch.filter(
      (m) => m.structural && m.name !== 'sosogGuseongweon',
    )) {
      const p = production[item.object].find((p) => p.name === item.name);
      const f = (await fields()).find(
        (f) => f.obj === item.object && f.name === item.name,
      );
      if (
        f?.type !== p.type ||
        (p.type === 'RELATION' && f.target !== p.target)
      )
        throw Error('Field verification failed: ' + item.name);
      if (
        (await c.query('select count(*) n from ' + (await table(item.object))))
          .rows[0].n !== String(data[item.object].length)
      )
        throw Error('Record count changed');
    }
    for (const id of legacy)
      if ((await fields()).some((f) => f.id === id)) await remove(id);
    console.log('Local alignment complete');
  } finally {
    await c.end();
  }
}
module.exports = { align, normalizedOptions };
if (require.main === module)
  align({
    apply: process.argv.includes('--apply'),
    resume: process.argv.find((a) => a.startsWith('--resume='))?.slice(9),
    followUpStage: process.argv
      .find((a) => a.startsWith('--follow-up-stage='))
      ?.split('=')[1],
  }).catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
