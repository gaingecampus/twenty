import {
  calculateCashFlow,
  readCashFlowCurrency,
} from '@/status-board/utils/calculateCashFlow';
describe('monthly cash flow', () => {
  it('adds the three latest bank balances and uses the whole planned expense', () => {
    expect(
      calculateCashFlow({
        banks: [100, 200, 300],
        incoming: 500,
        outgoing: 700,
      }),
    ).toEqual({ balance: 600, incoming: 500, outgoing: 700, available: 400 });
  });
  it('does not replace missing balances or expenses with zero', () => {
    expect(
      calculateCashFlow({ banks: [100, null, 0], incoming: 0, outgoing: 0 })
        .available,
    ).toBeNull();
    expect(
      calculateCashFlow({ banks: [0, 0, 0], incoming: 0, outgoing: null })
        .available,
    ).toBeNull();
  });
  it('preserves zero and negative available cash', () => {
    expect(
      calculateCashFlow({ banks: [0, 0, 0], incoming: 0, outgoing: 5 })
        .available,
    ).toBe(-5);
    expect(
      readCashFlowCurrency({ amountMicros: '0', currencyCode: 'KRW' }),
    ).toBe(0);
  });
  it.each([
    null,
    { amountMicros: null, currencyCode: 'KRW' },
    { amountMicros: 100, currencyCode: 'USD' },
    { amountMicros: 'invalid', currencyCode: 'KRW' },
  ])('rejects missing or invalid currencies', (value) => {
    expect(readCashFlowCurrency(value)).toBeNull();
  });
});
