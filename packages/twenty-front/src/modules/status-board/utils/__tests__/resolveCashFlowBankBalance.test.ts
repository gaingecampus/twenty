import { resolveCashFlowBankBalance } from '@/status-board/utils/resolveCashFlowBankBalance';

const currency = (amount: number) => ({
  amountMicros: String(amount * 1_000_000),
  currencyCode: 'KRW',
});

const transaction = (before: number, after: number) => ({
  transactionAt: '2026-11-01T22:40:45Z',
  balance: currency(after),
  incomingAmount: currency(Math.max(after - before, 0)),
  outgoingAmount: currency(Math.max(before - after, 0)),
});

describe('resolveCashFlowBankBalance', () => {
  it('resolves the two simultaneous withdrawals regardless of row order', () => {
    const transactions = [
      transaction(24_233_603, 24_203_603),
      transaction(24_203_603, 22_003_603),
    ];

    expect(resolveCashFlowBankBalance(transactions)).toBe(22_003_603);
    expect(resolveCashFlowBankBalance([...transactions].reverse())).toBe(
      22_003_603,
    );
  });

  it('follows all movements rather than choosing the smallest or largest balance', () => {
    expect(
      resolveCashFlowBankBalance([
        transaction(120, 80),
        transaction(100, 120),
        transaction(80, 110),
      ]),
    ).toBe(110);
  });

  it('allows a branch when only one complete order uses every transaction', () => {
    expect(
      resolveCashFlowBankBalance([
        transaction(100, 50),
        transaction(100, 200),
        transaction(200, 100),
      ]),
    ).toBe(50);
  });

  it('rejects multiple complete orders even when they end at the same balance', () => {
    expect(
      resolveCashFlowBankBalance([
        transaction(100, 200),
        transaction(200, 100),
        transaction(100, 300),
        transaction(300, 100),
        transaction(100, 50),
      ]),
    ).toBeNull();
  });

  it.each([
    [transaction(100, 200), transaction(300, 400)],
    [transaction(100, 200), transaction(200, 100)],
  ])('rejects disconnected or cyclic orders', (...rows) => {
    expect(resolveCashFlowBankBalance(rows)).toBeNull();
  });

  it('preserves equal valid balances when ordering cannot affect the result', () => {
    expect(
      resolveCashFlowBankBalance([
        transaction(100, 100),
        transaction(100, 100),
      ]),
    ).toBe(100);
  });

  it('rejects invalid movement currencies and missing movement amounts', () => {
    const first = transaction(100, 200);
    const last = transaction(200, 300);

    expect(
      resolveCashFlowBankBalance([
        first,
        { ...last, incomingAmount: undefined },
      ]),
    ).toBeNull();
    expect(
      resolveCashFlowBankBalance([
        first,
        { ...last, outgoingAmount: { ...currency(0), currencyCode: 'USD' } },
      ]),
    ).toBeNull();
  });

  it('rejects a timestamp group truncated at the page boundary', () => {
    const rows = [transaction(100, 200), transaction(200, 300)];

    expect(resolveCashFlowBankBalance(rows, true)).toBeNull();
    expect(
      resolveCashFlowBankBalance(
        [
          ...rows,
          { ...transaction(50, 100), transactionAt: '2026-10-31T00:00:00Z' },
        ],
        true,
      ),
    ).toBe(300);
  });

  it('keeps a single latest balance without requiring historical movement amounts', () => {
    expect(
      resolveCashFlowBankBalance([
        { transactionAt: '2026-09-30T00:00:00Z', balance: currency(100) },
      ]),
    ).toBe(100);
    expect(resolveCashFlowBankBalance([])).toBeNull();
  });

  it('stops an inconclusive search without reporting a partial chain balance', () => {
    expect(
      resolveCashFlowBankBalance([
        ...Array.from({ length: 10 }, () => transaction(100, 100)),
        transaction(200, 300),
      ]),
    ).toBeNull();
  });
});
