// Local-only import of normalized sheet rows. Financial source files stay outside Git.
// Usage: node packages/twenty-server/scripts/import-pending-expenses-local.cjs /path/to/rows.json --apply
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

const options = (items) =>
  items.map(([value, label, color], position) => ({
    id: randomUUID(),
    value,
    label,
    color,
    position,
  }));
const fields = [
  ...identityFields,
  ['sourceRecordType', '원본 보존 행 유형', 'TEXT', 'IconList'],
  ['expenseMonth', '귀속 월', 'TEXT', 'IconCalendar'],
  [
    'frequency',
    '구분',
    'SELECT',
    'IconRepeat',
    {
      options: options([
        ['MONTHLY', '정기(월1회)', 'blue'],
        ['IRREGULAR', '비정기', 'orange'],
      ]),
    },
  ],
  ['projectCategory', '사랑/PJ', 'TEXT', 'IconTag'],
  ['accountCategory', '계정', 'TEXT', 'IconCategory'],
  ['vendorName', '매입처', 'TEXT', 'IconBuildingStore'],
  ['supplyAmount', '공급가/손익적용 금액', 'CURRENCY', 'IconCurrencyWon'],
  [
    'plannedCashAmount',
    '현금 지출금액(계획)',
    'CURRENCY',
    'IconCurrencyWon',
    {
      description: '원본 H열: 1~7월 지출금액(계획), 8~10월 실제 현금 지출금액',
    },
  ],
  ['scheduledDate', '지출예정일', 'DATE', 'IconCalendar'],
  [
    'paidAmount',
    '지출금액(결과)',
    'CURRENCY',
    'IconCurrencyWon',
    {
      description:
        '원본 J열 값을 보존. 지급 완료 여부를 자동으로 판단하지 않습니다.',
    },
  ],
  ['notes', '비고', 'TEXT', 'IconNotes'],
  [
    'sourceSectionStatus',
    '원본 월 상태',
    'SELECT',
    'IconList',
    {
      options: options([
        ['PLANNED', '예정', 'blue'],
        ['CONFIRMED', '확정', 'green'],
      ]),
    },
  ],
  ['scheduledDateSource', '예정일 원문', 'TEXT', 'IconCalendar'],
  ['importReview', '확인 사항', 'TEXT', 'IconAlertCircle'],
  ['sourceExtraNotes', '원본 추가 메모', 'TEXT', 'IconNotes'],
  ['sourceUrl', '원본 시트', 'LINKS', 'IconLink'],
  ['sourceKey', '원본 식별자', 'TEXT', 'IconKey', { isUnique: true }],
];

async function main() {
  const payload = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const records = payload.records;
  const fromMonth = getFromMonth();
  const apply = process.argv.includes('--apply');
  if (
    !records.length ||
    new Set(records.map((record) => record.sourceKey)).size !== records.length
  )
    throw Error('Empty source or duplicate source keys');
  for (const record of records) {
    if (!record.name || !/^\d{4}-\d{2}$/.test(record.expenseMonth))
      throw Error('Invalid source row');
    for (const field of ['supplyAmount', 'plannedCashAmount', 'paidAmount']) {
      if (
        record[field] !== null &&
        (!/^-?\d+$/.test(record[field].amountMicros) ||
          record[field].currencyCode !== 'KRW')
      )
        throw Error('Invalid amount');
    }
  }
  console.log(
    JSON.stringify({
      rows: records.length,
      apply: process.argv.includes('--apply'),
    }),
  );

  const { c, gql, workspaceId, schema } = await connect();
  try {
    if (!apply) {
      const plans = await syncTables(
        c,
        schema,
        [{ kind: 'pendingExpense', fields, incoming: records, fromMonth }],
        false,
      );
      console.log(JSON.stringify(summarize(plans)));
      return;
    }
    let object = (
      await c.query(
        'select id from core."objectMetadata" where "workspaceId"=$1 and "nameSingular"=$2',
        [workspaceId, 'pendingExpense'],
      )
    ).rows[0];
    if (!object) {
      object = (
        await gql(
          'mutation($input:CreateOneObjectInput!){createOneObject(input:$input){id}}',
          {
            input: {
              object: {
                nameSingular: 'pendingExpense',
                namePlural: 'pendingExpenses',
                labelSingular: '지출대기액',
                labelPlural: '지출대기액',
                icon: 'IconWallet',
                description: '가인지 지출대기액[2026] 시트의 월별 지출 내역',
              },
            },
          },
        )
      ).createOneObject;
    }
    for (const [name, label, type, icon, extra = {}] of fields) {
      const existing = (
        await c.query(
          'select id,type from core."fieldMetadata" where "objectMetadataId"=$1 and name=$2',
          [object.id, name],
        )
      ).rows[0];
      if (existing) {
        if (existing.type !== type) throw Error(`Field type mismatch: ${name}`);
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
              icon: icon || 'IconDatabase',
              isNullable: true,
              ...extra,
            },
          },
        },
      );
      console.log(`Created field ${name}`);
    }
    const metadata = (
      await c.query(
        'select id,name,label from core."fieldMetadata" where "objectMetadataId"=$1 and "isActive"=true',
        [object.id],
      )
    ).rows;
    const fieldIds = Object.fromEntries(
      metadata.map((field) => [field.name, field.id]),
    );
    for (const name of ['supplyAmount', 'plannedCashAmount', 'paidAmount']) {
      await gql(
        'mutation($input:UpdateOneFieldMetadataInput!){updateOneField(input:$input){id}}',
        {
          input: {
            id: fieldIds[name],
            update: { settings: { format: 'full', decimals: 0 } },
          },
        },
      );
    }
    if (metadata.find((field) => field.name === 'name').label !== '품목') {
      await gql(
        'mutation($input:UpdateOneFieldMetadataInput!){updateOneField(input:$input){id}}',
        {
          input: {
            id: fieldIds.name,
            update: { label: '품목', icon: 'IconWallet' },
          },
        },
      );
    }
    await c.query('BEGIN');
    let results;
    try {
      results = await syncTables(
        c,
        schema,
        [{ kind: 'pendingExpense', fields, incoming: records, fromMonth }],
        true,
      );
      await c.query('COMMIT');
    } catch (error) {
      await c.query('ROLLBACK');
      throw error;
    }
    writeIdentityMap(process.argv[2], results);
    let view = (
      await c.query(
        'select id from core.view where "objectMetadataId"=$1 and name=$2 and "deletedAt" IS NULL',
        [object.id, '전체 지출 내역'],
      )
    ).rows[0];
    if (!view) {
      view = (
        await gql(
          'mutation($input:CreateViewInput!){createView(input:$input){id}}',
          {
            input: {
              name: '전체 지출 내역',
              objectMetadataId: object.id,
              icon: 'IconWallet',
              type: 'TABLE',
              position: 0,
            },
          },
        )
      ).createView;
      const visibleFields = [
        'name',
        'expenseMonth',
        'frequency',
        'accountCategory',
        'vendorName',
        'plannedCashAmount',
        'paidAmount',
        'scheduledDate',
        'notes',
        'supplyAmount',
        'projectCategory',
        'sourceSectionStatus',
        'importReview',
        'scheduledDateSource',
        'sourceUrl',
        'sourceExtraNotes',
      ];
      await gql(
        'mutation($inputs:[CreateViewFieldInput!]!){createManyViewFields(inputs:$inputs){id}}',
        {
          inputs: visibleFields.map((name, position) => ({
            viewId: view.id,
            fieldMetadataId: fieldIds[name],
            position,
            size: name === 'name' || name === 'notes' ? 260 : 160,
            isVisible: true,
          })),
        },
      );
      await gql(
        'mutation($input:CreateViewSortInput!){createViewSort(input:$input){id}}',
        {
          input: {
            viewId: view.id,
            fieldMetadataId: fieldIds.scheduledDate,
            direction: 'ASC',
          },
        },
      );
    }
    for (const config of [
      {
        name: '원본 보충 행',
        field: 'sourceRecordType',
        operand: 'IS_NOT_EMPTY',
        value: '',
      },
      {
        name: '2026년 10월',
        field: 'expenseMonth',
        operand: 'CONTAINS',
        value: '2026-10',
      },
      {
        name: '날짜 확인 필요',
        field: 'importReview',
        operand: 'IS_NOT_EMPTY',
        value: '',
      },
    ]) {
      const existingView = (
        await c.query(
          'select id from core.view where "objectMetadataId"=$1 and name=$2 and "deletedAt" IS NULL',
          [object.id, config.name],
        )
      ).rows[0];
      const newView =
        existingView ??
        (
          await gql(
            'mutation($input:CreateViewInput!){createView(input:$input){id}}',
            {
              input: {
                name: config.name,
                objectMetadataId: object.id,
                icon: 'IconWallet',
                type: 'TABLE',
                position: config.field === 'expenseMonth' ? 1 : 2,
              },
            },
          )
        ).createView;
      const columns = [
        'name',
        'expenseMonth',
        'vendorName',
        'plannedCashAmount',
        'paidAmount',
        'scheduledDate',
        'importReview',
        'scheduledDateSource',
        'frequency',
        'accountCategory',
        'notes',
        'sourceUrl',
        'sourceRecordType',
        'sourceExtraNotes',
      ];
      if (!existingView)
        await gql(
          'mutation($inputs:[CreateViewFieldInput!]!){createManyViewFields(inputs:$inputs){id}}',
          {
            inputs: columns.map((name, position) => ({
              viewId: newView.id,
              fieldMetadataId: fieldIds[name],
              position,
              size: name === 'name' || name === 'importReview' ? 260 : 170,
              isVisible: true,
            })),
          },
        );
      const existingFilter = (
        await c.query(
          'select id from core."viewFilter" where "viewId"=$1 and "deletedAt" IS NULL',
          [newView.id],
        )
      ).rows[0];
      if (!existingFilter)
        await gql(
          'mutation($input:CreateViewFilterInput!){createViewFilter(input:$input){id}}',
          {
            input: {
              viewId: newView.id,
              fieldMetadataId: fieldIds[config.field],
              operand: config.operand,
              value: config.value,
            },
          },
        );
      const existingSort = (
        await c.query(
          'select id from core."viewSort" where "viewId"=$1 and "deletedAt" IS NULL',
          [newView.id],
        )
      ).rows[0];
      if (!existingSort)
        await gql(
          'mutation($input:CreateViewSortInput!){createViewSort(input:$input){id}}',
          {
            input: {
              viewId: newView.id,
              fieldMetadataId: fieldIds.scheduledDate,
              direction: 'ASC',
            },
          },
        );
      console.log(JSON.stringify({ view: config.name, id: newView.id }));
    }
    await hideProvenance(c, gql, object.id);
    console.log(JSON.stringify(summarize(results)));
  } finally {
    await c.end();
  }
}
if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });

module.exports = { fields };
