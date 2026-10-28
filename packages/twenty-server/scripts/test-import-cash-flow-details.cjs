const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validate } = require('./import-cash-flow-details-local.cjs');

const currency = (value) => ({
  amountMicros: String(BigInt(value) * 1000000n),
  currencyCode: 'KRW',
});
const fixture = () => ({
  sourceHash: 'a'.repeat(64),
  month: '2026-10',
  expectedIncoming: currency(200),
  banks: Object.fromEntries(
    ['shinhan', 'kb', 'nh'].map((key) => [
      key,
      { amount: '100.0', at: '2026-10-28T00:00:00Z' },
    ]),
  ),
  bankTransactions: ['shinhan', 'kb', 'nh'].map((key, index) => ({
    id: `00000000-0000-4000-8000-00000000000${index}`,
    sourceHash: 'a'.repeat(64),
    bankKey: key,
    transactionAt: '2026-10-28T00:00:00Z',
    capturedAt: '2026-10-28T00:00:00Z',
    incomingAmount: currency(100),
    outgoingAmount: currency(0),
    balance: currency(100),
  })),
  expectedReceipts: [
    {
      id: '00000000-0000-4000-8000-000000000003',
      sourceHash: 'a'.repeat(64),
      expectedDate: '2026-10-28',
      capturedAt: '2026-10-28T00:00:00Z',
      invoiceAmount: currency(200),
      paidAmount: null,
      closingBalance: null,
      outstandingAmount: currency(200),
      inclusionStatus: '포함',
    },
  ],
});
test('accepts reconciled detailed backup with explicit zeros', () =>
  assert.doesNotThrow(() => validate(fixture())));
test('rejects mismatched incoming total before writing', () => {
  const payload = fixture();
  payload.expectedIncoming = currency(201);
  assert.throws(() => validate(payload), /Incoming total mismatch/);
});
test('rejects missing bank and conflicting closing balance', () => {
  const missing = fixture();
  missing.bankTransactions.pop();
  assert.throws(() => validate(missing), /Bank details/);
  const conflict = fixture();
  conflict.bankTransactions[0].balance = currency(101);
  assert.throws(() => validate(conflict), /Bank details/);
});
test('rejects duplicate identities and mixed backups', () => {
  const duplicate = fixture();
  duplicate.bankTransactions.push(duplicate.bankTransactions[0]);
  assert.throws(() => validate(duplicate), /identity/);
  const mixed = fixture();
  mixed.expectedReceipts[0].sourceHash = 'b'.repeat(64);
  assert.throws(() => validate(mixed), /identity/);
});
test('rejects an excluded receipt with a nonzero contribution', () => {
  const payload = fixture();
  payload.expectedReceipts[0].inclusionStatus = '완료 제외';
  assert.throws(() => validate(payload), /Excluded receipt/);
});
