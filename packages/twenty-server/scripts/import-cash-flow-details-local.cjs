// Local-only, resumable import. Private payloads must never be committed.
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const {
  identityFields,
  getFromMonth,
  syncTables,
  hideProvenance,
  summarize,
  writeIdentityMap,
} = require('./backup-record-sync.cjs');
const connect = require('./local-status-board-client.cjs');

const commonFields = [
  ...identityFields,
  ['sourceHash', '원본 파일 SHA256', 'TEXT'],
  ['sourceSheet', '원본 탭', 'TEXT'],
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
  const fromMonth = getFromMonth(process.argv, payload.month);
  if (fromMonth !== payload.month)
    throw Error('Backup month and --from-month must match');
  console.log(
    JSON.stringify({
      mode: process.argv.includes('--apply') ? 'apply' : 'dry-run',
      bankTransactions: payload.bankTransactions.length,
      expectedReceipts: payload.expectedReceipts.length,
    }),
  );
  const apply = process.argv.includes('--apply');
  const { c, gql, schema, workspaceId } = await connect();
  try {
    if (!apply) {
      const plans = await syncTables(
        c,
        schema,
        configs.map((config) => ({
          kind: config.singular,
          fields: config.fields,
          incoming: payload[config.plural],
          fromMonth,
        })),
        false,
      );
      console.log(JSON.stringify(summarize(plans)));
      return;
    }
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
                    '원본 시트의 상세 내역. 고정 ID로 최신화하며 원본 파일은 별도 보관합니다.',
                },
              },
            },
          )
        ).createOneObject;
      await ensureFields(c, gql, object.id, config.fields);
    }
    await c.query('BEGIN');
    let results;
    try {
      results = await syncTables(
        c,
        schema,
        configs.map((config) => ({
          kind: config.singular,
          fields: config.fields,
          incoming: payload[config.plural],
          fromMonth,
        })),
        true,
      );
      // Historical rows are immutable; they can still supply a bank's opening balance.
      for (const key of ['shinhan', 'kb', 'nh']) {
        const latest = (
          await c.query(
            `SELECT "transactionAt", "balanceAmountMicros" FROM "${schema}"."_bankTransaction" WHERE "bankKey"=$1 AND "deletedAt" IS NULL AND "transactionAt"=(SELECT max("transactionAt") FROM "${schema}"."_bankTransaction" WHERE "bankKey"=$1 AND "deletedAt" IS NULL)`,
            [key],
          )
        ).rows;
        if (
          !latest.length ||
          latest.some(
            (row) =>
              String(row.balanceAmountMicros) !==
                wonMicros(payload.banks[key].amount) ||
              new Date(row.transactionAt).getTime() !==
                Date.parse(payload.banks[key].at),
          )
        )
          throw Error(
            'Retained bank closing balance differs from source; historical rows were not updated',
          );
      }
      // Canonical rows now belong to the latest backup, not immutable snapshots.
      await c.query(
        `UPDATE "${schema}"."_cashFlowSnapshot" SET "detailsReady"=false WHERE "detailsReady"=true`,
      );
      await c.query(
        `UPDATE "${schema}"."_cashFlowSnapshot" SET "detailsReady"=true WHERE id=$1`,
        [snapshot[0].id],
      );
      await c.query('COMMIT');
    } catch (error) {
      await c.query('ROLLBACK');
      throw error;
    }
    writeIdentityMap(process.argv[2], results);
    for (const config of configs) {
      const object = (
        await c.query(
          'select id from core."objectMetadata" where "workspaceId"=$1 and "nameSingular"=$2',
          [workspaceId, config.singular],
        )
      ).rows[0];
      await ensureView(c, gql, object.id, config);
      await hideProvenance(c, gql, object.id);
    }
    console.log(JSON.stringify(summarize(results)));
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
module.exports = { validate, configs, ensureFields };
