import { formatStatusBoardCount } from '@/status-board/utils/formatStatusBoardCount';

describe('formatStatusBoardCount', () => {
  it.each([
    [0, '0건'],
    [9999, '9,999건'],
    [10000, '1만 건'],
    [123456, '12.3만 건'],
    [999999, '99.9만 건'],
    [100000000, '1억 건'],
  ])('formats %i without rounding into the next unit', (count, expected) => {
    expect(formatStatusBoardCount(count)).toBe(expected);
  });
});
