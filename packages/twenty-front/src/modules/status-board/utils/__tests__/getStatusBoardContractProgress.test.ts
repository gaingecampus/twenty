import { getStatusBoardContractProgress } from '@/status-board/utils/getStatusBoardContractProgress';

describe('getStatusBoardContractProgress', () => {
  const today = new Date(2026, 8, 8, 18);
  it('uses calendar days for the countdown', () => {
    expect(
      getStatusBoardContractProgress('2026-09-01', '2026-09-15', today),
    ).toEqual({ remaining: 7, percent: 50 });
  });
  it('clamps progress before and after the contract', () => {
    expect(
      getStatusBoardContractProgress('2026-09-10', '2026-09-20', today)
        ?.percent,
    ).toBe(0);
    expect(
      getStatusBoardContractProgress('2026-09-01', '2026-09-05', today),
    ).toEqual({ remaining: -3, percent: 100 });
  });
  it('handles a same-day contract without division by zero', () => {
    expect(
      getStatusBoardContractProgress('2026-09-08', '2026-09-08', today),
    ).toEqual({ remaining: 0, percent: 100 });
  });
  it('does not invent progress for missing or invalid dates', () => {
    expect(
      getStatusBoardContractProgress(null, '2026-09-10', today),
    ).toBeUndefined();
    expect(
      getStatusBoardContractProgress('invalid', '2026-09-10', today),
    ).toBeUndefined();
    expect(
      getStatusBoardContractProgress('2026-09-12', '2026-09-10', today),
    ).toBeUndefined();
  });
});
