// Local CRM only. Raw financial workbooks and payloads must stay outside Git.
const fs = require('node:fs');
const { createHash } = require('node:crypto');
const connect = require('./local-status-board-client.cjs');
const fields = [
  ['month', '귀속 월', 'TEXT'],
  ['capturedAt', '백업 기준 시각', 'DATE_TIME'],
  ['sourceHash', '원본 파일 SHA256', 'TEXT'],
  ['sourceUrl', '원본 시트', 'LINKS'],
  ['expectedIncoming', '입금예정액(완료·중복 제외)', 'CURRENCY'],
  ['plannedExpense', '지출예정액(H열)', 'CURRENCY'],
  ...[
    ['shinhan', '신한'],
    ['kb', '국민'],
    ['nh', '농협'],
  ].flatMap(([key, label]) => [
    [`${key}Balance`, `${label} 잔액`, 'CURRENCY'],
    [`${key}MeasuredAt`, `${label} 최종 거래 시각`, 'DATE_TIME'],
  ]),
];
async function main() {
  const payload = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const record = payload.record;
  if (
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(record.month) ||
    !/^[a-f0-9]{64}$/.test(record.sourceHash)
  )
    throw Error('Invalid source');
  for (const [name, , type] of fields) {
    const value = record[name];
    if (
      type === 'CURRENCY' &&
      (!/^-?\d+$/.test(value?.amountMicros) || value.currencyCode !== 'KRW')
    )
      throw Error(`Invalid amount: ${name}`);
    if (type === 'DATE_TIME' && !Number.isFinite(Date.parse(value)))
      throw Error(`Invalid date: ${name}`);
  }
  const hash = createHash('sha256')
    .update(`cash-flow:${record.sourceHash}:${record.month}`)
    .digest('hex');
  const id = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
  if (!process.argv.includes('--apply')) {
    console.log(
      JSON.stringify({
        mode: 'dry-run',
        month: record.month,
        fields: fields.length,
        id,
      }),
    );
    return;
  }
  const { c, gql, workspaceId, schema } = await connect();
  try {
    let object = (
      await c.query(
        'select id from core."objectMetadata" where "workspaceId"=$1 and "nameSingular"=$2',
        [workspaceId, 'cashFlowSnapshot'],
      )
    ).rows[0];
    if (!object)
      object = (
        await gql(
          'mutation($input:CreateOneObjectInput!){createOneObject(input:$input){id}}',
          {
            input: {
              object: {
                nameSingular: 'cashFlowSnapshot',
                namePlural: 'cashFlowSnapshots',
                labelSingular: '자금 흐름 백업',
                labelPlural: '자금 흐름 백업',
                icon: 'IconWallet',
                description:
                  '시트 백업 기준 은행별 최종 잔액 및 월별 현금 지출 계획. 실시간 은행 잔액이 아닙니다.',
              },
            },
          },
        )
      ).createOneObject;
    for (const [name, label, type] of fields) {
      const existing = (
        await c.query(
          'select id,type,settings from core."fieldMetadata" where "objectMetadataId"=$1 and name=$2',
          [object.id, name],
        )
      ).rows[0];
      if (existing) {
        if (existing.type !== type) throw Error(`Field type mismatch: ${name}`);
        if (
          type === 'CURRENCY' &&
          (existing.settings?.format !== 'full' ||
            existing.settings?.decimals !== 0)
        )
          await gql(
            'mutation($input:UpdateOneFieldMetadataInput!){updateOneField(input:$input){id}}',
            {
              input: {
                id: existing.id,
                update: {
                  settings: {
                    ...existing.settings,
                    format: 'full',
                    decimals: 0,
                  },
                },
              },
            },
          );
        continue;
      }
      await gql(
        'mutation($input:CreateOneFieldMetadataInput!){createOneField(input:$input){id}}',
        {
          input: {
            field: {
              objectMetadataId: object.id,
              name,
              label,
              type,
              icon: type === 'CURRENCY' ? 'IconCurrencyWon' : 'IconDatabase',
              isNullable: true,
              ...(type === 'CURRENCY'
                ? { settings: { format: 'full', decimals: 0 } }
                : {}),
            },
          },
        },
      );
    }
    const existing = (
      await c.query(
        `select id from "${schema}"."_cashFlowSnapshot" where id=$1`,
        [id],
      )
    ).rows[0];
    if (existing)
      await gql(
        'mutation($id:UUID!,$data:CashFlowSnapshotUpdateInput!){updateCashFlowSnapshot(id:$id,data:$data){id}}',
        { id, data: record },
        'graphql',
      );
    else
      await gql(
        'mutation($data:CashFlowSnapshotCreateInput!){createCashFlowSnapshot(data:$data){id}}',
        { data: { ...record, id } },
        'graphql',
      );
    console.log(
      JSON.stringify({
        mode: existing ? 'updated' : 'imported',
        month: record.month,
        id,
      }),
    );
  } finally {
    await c.end();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
