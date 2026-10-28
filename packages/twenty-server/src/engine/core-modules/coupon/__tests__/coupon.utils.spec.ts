import { buildCouponRecipients } from '../coupon.utils';

describe('coupon recipients', () => {
  it('normalizes, deduplicates and only retains masked numbers', () => {
    const result = buildCouponRecipients(
      [
        { personId: 'a', phone: '010-1234-5678' },
        { personId: 'b', phone: '+821012345678' },
        { personId: 'c', phone: '1098765432', callingCode: '+82' },
        { personId: 'd', phone: '021234567' },
      ],
      5,
    );
    expect(result).toMatchObject({ total: 5, missing: 2, duplicates: 1 });
    expect(result.recipients).toEqual([
      { personId: 'a', phone: '010-****-5678', status: 'PREVIEW' },
      { personId: 'c', phone: '010-****-5432', status: 'PREVIEW' },
    ]);
    expect(JSON.stringify(result)).not.toContain('01012345678');
  });

  it('rejects oversized lists before storing recipients', () => {
    expect(() => buildCouponRecipients([], 1001)).toThrow('1,000');
  });
});
