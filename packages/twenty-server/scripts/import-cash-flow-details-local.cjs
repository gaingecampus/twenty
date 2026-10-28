// Local-only, resumable import. Private payloads must never be committed.
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const connect = require('./local-status-board-client.cjs');

const commonFields = [
  ['sourceHash', '원본 파일 SHA256', 'TEXT'],
  ['sourceSheet', '원본 탭', 'TEXT'],
  ['sourceRow', '원본 행', 'NUMBER'],
  ['capturedAt', '백업 기준 시각', 'DATE_TIME'],
  ['sourceUrl', '원본 시트', 'LINKS'],
  ['description', '내용', 'TEXT'],
  ['sourceDetails', '원본 상세(식별번호 마스킹)', 'TEXT'],
];
const configs = [
  {
    singular: 'bankTransaction',
    plural: 'bankTransactions',
    label: '입출금 내역',
    fields: [
      ['bankKey', '은행 코드', 'TEXT'],
      ['bankName', '은행', 'TEXT'],
      ['transactionAt', '거래 일시', 'DATE_TIME'],
      ['incomingAmount', '입금액', 'CURRENCY'],
      ['outgoingAmount', '출금액', 'CURRENCY'],
      ['balance', '거래 후 잔액', 'CURRENCY'],
      ...commonFields,
    ],
    columns: [
      'name',
      'bankName',
      'transactionAt',
      'incomingAmount',
      'outgoingAmount',
      'balance',
      'description',
      'sourceSheet',
      'sourceRow',
      'capturedAt',
      'sourceUrl',
      'sourceDetails',
    ],
  },
  {
    singular: 'expectedReceipt',
    plural: 'expectedReceipts',
    label: '입금예정액',
    fields: [
      ['companyName', '기업명', 'TEXT'],
      ['expectedDate', '입금 예정일', 'DATE'],
      ['invoiceAmount', '발행 금액', 'CURRENCY'],
      ['paidAmount', '분할 입금액', 'CURRENCY'],
      ['closingBalance', '분할 누적 잔금', 'CURRENCY'],
      ['outstandingAmount', '합산 대상 미입금액', 'CURRENCY'],
      ['inclusionStatus', '합산 구분', 'TEXT'],
      ...commonFields,
    ],
    columns: [
      'name',
      'companyName',
      'expectedDate',
      'outstandingAmount',
      'inclusionStatus',
      'invoiceAmount',
      'paidAmount',
      'closingBalance',
      'description',
      'sourceSheet',
      'sourceRow',
      'capturedAt',
      'sourceUrl',
      'sourceDetails',
    ],
  },
];

function wonMicros(amount) {
  if (!/^-?\d+(?:\.0+)?$/.test(String(amount)))
    throw Error('Invalid whole KRW balance');
  return String(BigInt(String(amount).replace(/\.0+$/, '')) * 1000000n);
}

function validate(payload) {
  if (
    !/^[a-f0-9]{64}$/.test(payload.sourceHash) ||
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(payload.month)
  )
    throw Error('Invalid backup identity');
  for (const config of configs) {
    const records = payload[config.plural];
    if (!Array.isArray(records) || records.length === 0)
      throw Error('Missing details');
    const ids = new Set();
    for (const record of records) {
      if (
        ids.has(record.id) ||
        !/^[0-9a-f-]{36}$/.test(record.id) ||
        record.sourceHash !== payload.sourceHash
      )
        throw Error('Invalid record identity');
      ids.add(record.id);
      for (const [name, , type] of config.fields) {
        const value = record[name];
        if (
          type === 'CURRENCY' &&
          value !== null &&
          (!/^-?\d+$/.test(value?.amountMicros) || value.currencyCode !== 'KRW')
        )
          throw Error(`Invalid amount: ${name}`);
        if (
          ['DATE', 'DATE_TIME'].includes(type) &&
          !Number.isFinite(Date.parse(value))
        )
          throw Error(`Invalid date: ${name}`);
      }
    }
  }
  const incoming = payload.expectedReceipts.reduce(
    (total, record) => total + BigInt(record.outstandingAmount.amountMicros),
    0n,
  );
  if (String(incoming) !== payload.expectedIncoming.amountMicros)
    throw Error('Incoming total mismatch');
  for (const bankKey of ['shinhan', 'kb', 'nh']) {
    const records = payload.bankTransactions.filter(
      (record) => record.bankKey === bankKey,
    );
    const latestTime = Math.max(
      ...records.map((record) => Date.parse(record.transactionAt)),
    );
    const latest = records.filter(
      (record) => Date.parse(record.transactionAt) === latestTime,
    );
    const bank = payload.banks?.[bankKey];
    if (
      !bank ||
      !latest.length ||
      latestTime !== Date.parse(bank.at) ||
      latest.some(
        (record) => record.balance?.amountMicros !== wonMicros(bank.amount),
      )
    )
      throw Error('Bank details do not reconcile');
  }
  if (
    payload.expectedReceipts.some(
      (record) =>
        record.inclusionStatus !== '포함' &&
        BigInt(record.outstandingAmount.amountMicros) !== 0n,
    )
  )
    throw Error('Excluded receipt contributes to total');
}

async function main() {
  const payload = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  validate(payload);
  console.log(
    JSON.stringify({
      mode: process.argv.includes('--apply') ? 'apply' : 'dry-run',
      bankTransactions: payload.bankTransactions.length,
      expectedReceipts: payload.expectedReceipts.length,
    }),
  );
  if (!process.argv.includes('--apply')) return;
  const { c, gql, schema, workspaceId } = await connect();
  try {
    const snapshot = (
      await c.query(
        `select * from "${schema}"."_cashFlowSnapshot" where "sourceHash"=$1 and month=$2 and "deletedAt" is null`,
        [payload.sourceHash, payload.month],
      )
    ).rows;
    if (snapshot.length !== 1)
      throw Error('Import the matching cash-flow snapshot first');
    if (
      String(snapshot[0].expectedIncomingAmountMicros) !==
      payload.expectedIncoming.amountMicros
    )
      throw Error('Snapshot incoming differs from details');
    for (const key of ['shinhan', 'kb', 'nh']) {
      if (
        String(snapshot[0][`${key}BalanceAmountMicros`]) !==
        wonMicros(payload.banks[key].amount)
      )
        throw Error('Snapshot bank balance differs from details');
    }
    const snapshotObject = (
      await c.query(
        'select id from core."objectMetadata" where "workspaceId"=$1 and "nameSingular"=$2',
        [workspaceId, 'cashFlowSnapshot'],
      )
    ).rows[0];
    await ensureFields(c, gql, snapshotObject.id, [
      ['detailsReady', '상세 백업 확인', 'BOOLEAN'],
    ]);
    // An incomplete import must not be presented as a complete set of financial records.
    await gql(
      'mutation($id:UUID!,$data:CashFlowSnapshotUpdateInput!){updateCashFlowSnapshot(id:$id,data:$data){id}}',
      { id: snapshot[0].id, data: { detailsReady: false } },
      'graphql',
    );
    for (const config of configs) {
      let object = (
        await c.query(
          'select id from core."objectMetadata" where "workspaceId"=$1 and "nameSingular"=$2',
          [workspaceId, config.singular],
        )
      ).rows[0];
      if (!object)
        object = (
          await gql(
            'mutation($input:CreateOneObjectInput!){createOneObject(input:$input){id}}',
            {
              input: {
                object: {
                  nameSingular: config.singular,
                  namePlural: config.plural,
                  labelSingular: config.label,
                  labelPlural: config.label,
                  icon: 'IconWallet',
                  description:
                    '원본 시트의 상세 백업. 식별번호는 마스킹하며 백업별로 보존합니다.',
                },
              },
            },
          )
        ).createOneObject;
      await ensureFields(c, gql, object.id, config.fields);
      const records = payload[config.plural];
      const existing = (
        await c.query(
          `select id,"deletedAt" from "${schema}"."_${config.singular}" where "sourceHash"=$1`,
          [payload.sourceHash],
        )
      ).rows;
      if (existing.some((record) => record.deletedAt))
        throw Error('Previously deleted backup rows require review');
      const existingIds = new Set(existing.map((record) => record.id));
      const missing = records.filter((record) => !existingIds.has(record.id));
      const typeName =
        config.singular[0].toUpperCase() + config.singular.slice(1);
      const mutationName =
        'create' + config.plural[0].toUpperCase() + config.plural.slice(1);
      for (let offset = 0; offset < missing.length; offset += 100) {
        await gql(
          `mutation($data:[${typeName}CreateInput!]!){${mutationName}(data:$data){id}}`,
          { data: missing.slice(offset, offset + 100) },
          'graphql',
        );
        if (offset % 1000 === 0)
          console.log(
            JSON.stringify({
              object: config.singular,
              imported: Math.min(offset + 100, missing.length),
              total: missing.length,
            }),
          );
      }
      const saved = (
        await c.query(
          `select * from "${schema}"."_${config.singular}" where "sourceHash"=$1 and "deletedAt" is null`,
          [payload.sourceHash],
        )
      ).rows;
      if (saved.length !== records.length)
        throw Error('Backup row count mismatch');
      const savedById = new Map(saved.map((record) => [record.id, record]));
      for (const record of records) {
        const stored = savedById.get(record.id);
        if (!stored) throw Error('Missing backup row');
        if (stored.name !== record.name) throw Error('Stored name differs');
        for (const [name, , type] of config.fields) {
          if (type === 'CURRENCY') {
            if (
              String(stored[`${name}AmountMicros`] ?? '') !==
                String(record[name]?.amountMicros ?? '') ||
              (record[name] && stored[`${name}CurrencyCode`] !== 'KRW')
            )
              throw Error(`Stored amount differs: ${name}`);
          } else if (type === 'TEXT' || type === 'NUMBER') {
            if ((stored[name] ?? '') !== record[name])
              throw Error(`Stored field differs: ${name}`);
          } else if (
            type === 'DATE_TIME' &&
            new Date(stored[name]).getTime() !==
              new Date(record[name]).getTime()
          )
            throw Error(`Stored time differs: ${name}`);
          else if (type === 'DATE') {
            const date =
              stored[name] instanceof Date
                ? [
                    stored[name].getFullYear(),
                    String(stored[name].getMonth() + 1).padStart(2, '0'),
                    String(stored[name].getDate()).padStart(2, '0'),
                  ].join('-')
                : stored[name];
            if (date !== record[name])
              throw Error(`Stored date differs: ${name}`);
          } else if (
            type === 'LINKS' &&
            stored[`${name}PrimaryLinkUrl`] !== record[name].primaryLinkUrl
          )
            throw Error('Stored source link differs');
        }
      }
      await ensureView(c, gql, object.id, config);
      console.log(
        JSON.stringify({
          object: config.singular,
          verified: saved.length,
          inserted: missing.length,
        }),
      );
    }
    await gql(
      'mutation($id:UUID!,$data:CashFlowSnapshotUpdateInput!){updateCashFlowSnapshot(id:$id,data:$data){id}}',
      { id: snapshot[0].id, data: { detailsReady: true } },
      'graphql',
    );
    console.log(JSON.stringify({ verified: true, month: payload.month }));
  } finally {
    await c.end();
  }
}

async function ensureFields(c, gql, objectId, fields) {
  for (const [name, label, type] of fields) {
    const existing = (
      await c.query(
        'select id,type from core."fieldMetadata" where "objectMetadataId"=$1 and name=$2',
        [objectId, name],
      )
    ).rows[0];
    if (existing) {
      if (existing.type !== type) throw Error(`Field type differs: ${name}`);
      continue;
    }
    await gql(
      'mutation($input:CreateOneFieldMetadataInput!){createOneField(input:$input){id}}',
      {
        input: {
          field: {
            objectMetadataId: objectId,
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
}

async function ensureView(c, gql, objectId, config) {
  let view = (
    await c.query(
      'select id from core.view where "objectMetadataId"=$1 and "deletedAt" is null order by "isCustom" asc, position asc, "createdAt" asc limit 1',
      [objectId],
    )
  ).rows[0];
  if (!view)
    view = (
      await gql(
        'mutation($input:CreateViewInput!){createView(input:$input){id}}',
        {
          input: {
            name: config.label,
            objectMetadataId: objectId,
            icon: 'IconWallet',
            type: 'TABLE',
            position: 0,
          },
        },
      )
    ).createView;
  const fieldIds = Object.fromEntries(
    (
      await c.query(
        'select id,name from core."fieldMetadata" where "objectMetadataId"=$1',
        [objectId],
      )
    ).rows.map((field) => [field.name, field.id]),
  );
  const viewFields = new Map(
    (
      await c.query(
        'select id,"fieldMetadataId","isVisible",position,size from core."viewField" where "viewId"=$1 and "deletedAt" is null',
        [view.id],
      )
    ).rows.map((field) => [field.fieldMetadataId, field]),
  );
  const desiredFields = config.columns.map((name, position) => ({
    viewId: view.id,
    fieldMetadataId: fieldIds[name],
    position,
    size: name === 'name' ? 260 : 170,
    isVisible: true,
  }));
  const inputs = desiredFields.filter(
    (field) => !viewFields.has(field.fieldMetadataId),
  );
  if (inputs.length)
    await gql(
      'mutation($inputs:[CreateViewFieldInput!]!){createManyViewFields(inputs:$inputs){id}}',
      { inputs },
    );
  // Object creation pre-populates custom fields as hidden; make the finance
  // columns usable even when those view-field records already exist.
  for (const desired of desiredFields) {
    const current = viewFields.get(desired.fieldMetadataId);
    if (
      current &&
      (!current.isVisible || current.position !== desired.position)
    )
      await gql(
        'mutation($input:UpdateViewFieldInput!){updateViewField(input:$input){id}}',
        {
          input: {
            id: current.id,
            update: { isVisible: true, position: desired.position },
          },
        },
      );
  }
  for (const [fieldId, current] of viewFields) {
    if (desiredFields.some((field) => field.fieldMetadataId === fieldId))
      continue;
    if (current.position >= desiredFields.length) continue;
    await gql(
      'mutation($input:UpdateViewFieldInput!){updateViewField(input:$input){id}}',
      {
        input: {
          id: current.id,
          update: { position: desiredFields.length + current.position },
        },
      },
    );
  }
  const navigation = (
    await c.query(
      'select id from core."navigationMenuItem" where "targetObjectMetadataId"=$1',
      [objectId],
    )
  ).rows;
  if (!navigation.length) {
    const last = (
      await c.query(
        'select max(position) as position from core."navigationMenuItem"',
      )
    ).rows[0];
    await gql(
      'mutation($inputs:[CreateNavigationMenuItemInput!]!){createManyNavigationMenuItems(inputs:$inputs){id}}',
      {
        inputs: [
          {
            id: randomUUID(),
            type: 'OBJECT',
            targetObjectMetadataId: objectId,
            position: Number(last.position ?? 0) + 1,
          },
        ],
      },
    );
  }
  console.log(
    JSON.stringify({
      object: config.singular,
      url: `http://localhost:3001/objects/${config.plural}?viewId=${view.id}`,
    }),
  );
}

if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
module.exports = { validate };
