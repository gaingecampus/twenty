import { formatToShortNumber } from '../format/formatToShortNumber';

describe('formatToShortNumber Korean units', () => {
  it.each([
    [0, '0'],
    [500, '500'],
    [123.456, '123.5'],
    [1500, '1,500'],
    [9999, '9,999'],
    [10000, '1만'],
    [789456, '78.9만'],
    [2000000, '200만'],
    [654987654, '6.5억'],
    [1200000000, '12억'],
    [987654321987, '9,876.5억'],
    [1000000000000, '1조'],
    [10000000000000000, '1경'],
  ])('formats %s as %s', (value, expected) => {
    expect(formatToShortNumber(value)).toBe(expected);
    if (value !== 0) expect(formatToShortNumber(-value)).toBe(`-${expected}`);
  });

  it.each([
    [99999999, '1억'],
    [99999500, '1억'],
    [99999499, '9,999.9만'],
    [999999999999, '1조'],
  ])('promotes at the rounded Korean unit boundary: %s', (value, expected) => {
    expect(formatToShortNumber(value)).toBe(expected);
    expect(formatToShortNumber(-value)).toBe(`-${expected}`);
  });

  it('supports caller precision and separators', () => {
    expect(formatToShortNumber(1234567, { decimals: 2 })).toBe('123.46만');
    expect(formatToShortNumber(1234567, { decimals: 2, locale: 'de-DE' })).toBe(
      '123,46만',
    );
    expect(formatToShortNumber(99999999, { decimals: 0 })).toBe('1억');
  });

  it('preserves non-finite values and does not show negative zero', () => {
    expect(formatToShortNumber(NaN)).toBe('NaN');
    expect(formatToShortNumber(Infinity)).toBe('Infinity');
    expect(formatToShortNumber(-Infinity)).toBe('-Infinity');
    expect(formatToShortNumber(-0.001)).toBe('0');
  });
});
