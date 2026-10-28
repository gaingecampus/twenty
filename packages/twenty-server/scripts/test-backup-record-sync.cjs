const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  identityFields,
  planSync,
  syncTables,
} = require('./backup-record-sync.cjs');

const fields = [
  ['expenseMonth', '', 'TEXT'],
  ['sourceRow', '', 'NUMBER'],
  ['sourceKey', '', 'TEXT'],
  ['plannedCashAmount', '', 'CURRENCY'],
  ['notes', '', 'TEXT'],
  ...identityFields,
];
const currency = (value) => ({
  amountMicros: String(value),
  currencyCode: 'KRW',
});
const id = (number) =>
  `00000000-0000-4000-8000-${String(number).padStart(12, '0')}`;
const source = (row, name = '정기 비용', amount = 100) => ({
  name,
  expenseMonth: '2026-10',
  sourceRow: row,
  sourceKey: `sheet:tab:${row}`,
  plannedCashAmount: currency(amount),
  notes: null,
});
const stored = (record) => {
  const { plannedCashAmount, ...rest } = record;
  return {
    ...rest,
    plannedCashAmountAmountMicros: plannedCashAmount?.amountMicros ?? null,
    plannedCashAmountCurrencyCode: plannedCashAmount?.currencyCode ?? null,
  };
};
const plan = (incoming, existing = []) =>
  planSync({ kind: 'pendingExpense', fields, incoming, existing });
const save = (plans) => plans.map(({ row }) => stored(row));

void test('legacy migration retains CRM IDs after inserting/reordering source rows', () => {
  const existing = [
    stored({ ...source(8), id: id(1) }),
    stored({ ...source(9, '다른 비용'), id: id(2) }),
  ];
  const next = plan(
    [source(2, '다른 비용'), source(20), source(6, '신규')],
    existing,
  );
  assert.equal(next[0].row.id, id(2));
  assert.equal(next[1].row.id, id(1));
  assert.equal(next.filter(({ action }) => action === 'insert').length, 1);
  assert.equal(next[0].row.sourceKey, `backup:${id(2)}`);
});

void test('reimport is a no-op; provenance moves without adding a record', () => {
  const first = plan([source(8)]);
  const second = plan([source(8)], save(first));
  assert.equal(second[0].action, 'unchanged');
  const moved = plan([source(18)], save(first));
  assert.equal(moved[0].row.id, first[0].row.id);
  assert.equal(moved[0].action, 'update');
});

void test('a retained ID updates changed amounts, dates and labels', () => {
  const first = plan([source(8)]);
  const next = plan(
    [{ ...source(30, '수정된 비용', 220), backupId: first[0].row.backupId }],
    save(first),
  );
  assert.equal(next[0].row.id, first[0].row.id);
  assert.equal(next[0].row.plannedCashAmount.amountMicros, '220');
});

void test('missing IDs cannot silently turn edits/deletions into new records', () => {
  const first = plan([source(8), source(9, '두번째')]);
  assert.throws(
    () => plan([source(8, '수정'), source(9, '두번째')], save(first)),
    /Unmatched/,
  );
  assert.throws(() => plan([source(9, '두번째')], save(first)), /Unmatched/);
});

void test('indistinguishable transactions retain multiplicity; added duplicate requires IDs', () => {
  const first = plan([source(8), source(9)]);
  const moved = plan([source(30), source(20)], save(first));
  assert.deepEqual(
    new Set(moved.map(({ row }) => row.id)),
    new Set(first.map(({ row }) => row.id)),
  );
  assert.throws(
    () => plan([source(8), source(9), source(10)], save(first)),
    /Ambiguous/,
  );
  const identified = plan(
    [
      ...first.map(({ row }, index) => ({
        ...source(index + 20),
        backupId: row.backupId,
      })),
      { ...source(40), backupId: id(55) },
    ],
    save(first),
  );
  assert.equal(
    identified.filter(({ action }) => action === 'insert').length,
    1,
  );
});

void test('CRM edits conflict even when original baseline is null; converged changes are accepted', () => {
  const first = plan([source(8)]);
  const edited = save(first);
  edited[0].notes = 'CRM 편집';
  assert.throws(() => plan([source(8)], edited), /CRM\/source conflict/);
  const converged = plan(
    [{ ...source(8), notes: 'CRM 편집', backupId: first[0].row.backupId }],
    edited,
  );
  assert.equal(converged[0].row.notes, 'CRM 편집');
});

void test('duplicate IDs, foreign source IDs and deleted rows are rejected', () => {
  const first = plan([source(8)]);
  const backupId = first[0].row.backupId;
  assert.throws(
    () =>
      plan(
        [
          { ...source(8), backupId },
          { ...source(9), backupId },
        ],
        save(first),
      ),
    /Duplicate/,
  );
  assert.throws(
    () =>
      plan([{ ...source(8), sourceKey: 'other:tab:8', backupId }], save(first)),
    /another source/,
  );
  assert.throws(
    () => plan([source(8)], [{ ...save(first)[0], deletedAt: new Date() }]),
    /deleted/,
  );
});

void test('bank rows use content across file hashes and redact salary names in all stored text', () => {
  const bankFields = [
    ['bankKey', '', 'TEXT'],
    ['bankName', '', 'TEXT'],
    ['transactionAt', '', 'DATE_TIME'],
    ['sourceSheet', '', 'TEXT'],
    ['sourceHash', '', 'TEXT'],
    ['sourceRow', '', 'NUMBER'],
    ['description', '', 'TEXT'],
    ['sourceDetails', '', 'TEXT'],
    ...identityFields,
  ];
  const row = {
    id: id(1),
    name: '급여 가상직원',
    bankKey: 'kb',
    bankName: '국민',
    transactionAt: '2026-10-01T00:00:00.000Z',
    sourceSheet: '국민 입출금',
    sourceHash: 'old',
    sourceRow: 8,
    description: '급여 가상직원',
    sourceDetails: '수령인 가상직원',
  };
  const next = planSync({
    kind: 'bankTransaction',
    fields: bankFields,
    incoming: [{ ...row, sourceHash: 'new', sourceRow: 80 }],
    existing: [row],
  });
  assert.equal(next[0].row.id, id(1));
  assert.ok(!JSON.stringify(next[0].row).includes('가상직원'));
});

void test('all tables are planned before any mutation; a conflict prevents writes', async () => {
  const queries = [];
  const client = {
    query: async (sql) => {
      queries.push(sql);
      if (sql.startsWith('SELECT to_regclass'))
        return { rows: [{ name: 'exists' }] };
      if (sql.startsWith('SELECT *'))
        return { rows: [stored({ ...source(8), id: id(1) })] };
      return { rows: [] };
    },
  };
  await assert.rejects(
    syncTables(
      client,
      'workspace',
      [{ kind: 'pendingExpense', fields, incoming: [source(8, '수정')] }],
      true,
    ),
    /Unmatched/,
  );
  assert.ok(!queries.some((sql) => /^(UPDATE|INSERT)/.test(sql)));
});

void test('only the cutoff month and future years are updated; historical edits and missing rows are ignored', () => {
  const existing = [
    stored({ ...source(1), expenseMonth: '2026-08', id: id(1) }),
    stored({ ...source(2), expenseMonth: '2026-09', id: id(2) }),
    stored({ ...source(3), expenseMonth: '2026-10', id: id(3) }),
  ];
  const next = planSync({
    kind: 'pendingExpense',
    fields,
    fromMonth: '2026-10',
    existing,
    incoming: [
      { ...source(99, '과거 수정'), expenseMonth: '2026-08' },
      { ...source(10), expenseMonth: '2026-10' },
      { ...source(20), expenseMonth: '2027-01' },
    ],
  });
  assert.equal(next.length, 2);
  assert.equal(next[0].row.id, id(3));
  assert.equal(next[1].action, 'insert');
  assert.ok(!next.some(({ row }) => [id(1), id(2)].includes(row.id)));
});

void test('the monthly window uses KST for bank timestamps and scheduled dates for receipts', () => {
  const { inWindow, getFromMonth } = require('./backup-record-sync.cjs');
  assert.equal(
    inWindow(
      'bankTransaction',
      { transactionAt: '2026-09-30T14:59:59Z' },
      '2026-10',
    ),
    false,
  );
  assert.equal(
    inWindow(
      'bankTransaction',
      { transactionAt: '2026-09-30T15:00:00Z' },
      '2026-10',
    ),
    true,
  );
  assert.equal(
    inWindow('expectedReceipt', { expectedDate: '2026-09-30' }, '2026-10'),
    false,
  );
  assert.equal(
    inWindow('expectedReceipt', { expectedDate: '2027-01-01' }, '2026-10'),
    true,
  );
  assert.equal(getFromMonth(['--from-month', '2026-10']), '2026-10');
  assert.throws(() => getFromMonth(['--from-month', '2026-13']), /Invalid/);
});

void test('import schemas omit row columns; reordered rows stay unchanged with private coordinates', () => {
  const {
    fields: expenseFields,
  } = require('./import-pending-expenses-local.cjs');
  const { configs } = require('./import-cash-flow-details-local.cjs');
  for (const schema of [
    expenseFields,
    ...configs.map((config) => config.fields),
  ]) {
    assert.ok(!schema.some(([name]) => name === 'sourceRow'));
  }
  const withoutRows = fields.filter(([name]) => name !== 'sourceRow');
  const reconcile = (incoming, existing = []) =>
    planSync({
      kind: 'pendingExpense',
      fields: withoutRows,
      incoming,
      existing,
    });
  const first = reconcile([source(8)]);
  const moved = reconcile([source(80)], save(first));
  assert.equal(moved[0].action, 'unchanged');
  assert.equal(moved[0].row.id, first[0].row.id);
  assert.ok(!('sourceRow' in moved[0].row));
  assert.ok(!('sourceRow' in JSON.parse(moved[0].row.backupBaseline)));
  assert.equal(moved[0].sourceLocation.sourceRow, 80);
});
