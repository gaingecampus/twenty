import { queryStatusBoardDummyRecords } from '@/status-board/utils/queryStatusBoardDummyDataset';
import { type StatusBoardDummyDataset } from '@/status-board/utils/buildStatusBoardDummyDataset';

const dataset = {
  deposit: [
    { __typename: 'Deposit', id: 'c', createdAt: null },
    { __typename: 'Deposit', id: 'b', createdAt: '2026-09-08' },
    { __typename: 'Deposit', id: 'a', createdAt: '2026-09-08' },
    { __typename: 'Deposit', id: 'd', createdAt: '2026-09-01' },
  ],
} as StatusBoardDummyDataset;

describe('queryStatusBoardDummyRecords sorting', () => {
  it('sorts the whole result before limiting and uses id to break ties', () => {
    const records = queryStatusBoardDummyRecords({
      dataset,
      objectNameSingular: 'deposit',
      limit: 2,
      orderBy: [
        { createdAt: 'DescNullsLast' },
        { __typename: 'Deposit', id: 'AscNullsLast' },
      ],
    });
    expect(records.map(({ id }) => id)).toEqual(['a', 'b']);
    expect(dataset.deposit[0].id).toBe('c');
  });

  it('keeps missing dates last when sorting oldest first', () => {
    const records = queryStatusBoardDummyRecords({
      dataset,
      objectNameSingular: 'deposit',
      limit: 10,
      orderBy: [
        { createdAt: 'AscNullsLast' },
        { __typename: 'Deposit', id: 'AscNullsLast' },
      ],
    });
    expect(records.map(({ id }) => id)).toEqual(['d', 'a', 'b', 'c']);
  });
});
