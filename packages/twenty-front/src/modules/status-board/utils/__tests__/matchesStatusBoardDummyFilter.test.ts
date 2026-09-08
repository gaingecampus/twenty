import { matchesStatusBoardDummyFilter } from '@/status-board/utils/matchesStatusBoardDummyFilter';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

describe('matchesStatusBoardDummyFilter', () => {
  const record = {
    id: 'status-board-dummy-deposit-1',
    __typename: 'deposit',
    depositStatus: 'PENDING',
    expectedPaymentDate: '2026-09-01',
    creatorId: 'member-1',
    creator: { id: 'member-1' },
  } as ObjectRecord;

  it('should keep records that match nested and filters', () => {
    expect(
      matchesStatusBoardDummyFilter({
        record,
        filter: {
          and: [
            { depositStatus: { neq: 'PAID' } },
            { expectedPaymentDate: { lt: '2026-09-08' } },
            { creatorId: { in: ['member-1', 'member-2'] } },
          ],
        },
      }),
    ).toBe(true);
  });

  it('should exclude closed opportunity stages with not-in', () => {
    const opportunity = {
      id: 'status-board-dummy-opportunity-1',
      __typename: 'opportunity',
      customStage: 'IN_PROGRESS',
    } as ObjectRecord;

    expect(
      matchesStatusBoardDummyFilter({
        record: opportunity,
        filter: {
          not: {
            customStage: {
              in: ['ON_HOLD', 'MATCHING_SUCCESS'],
            },
          },
        },
      }),
    ).toBe(true);
  });
});
