import { getContractSessionProgress } from '@/field-management/getContractSessionProgress';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

const contract = {
  __typename: 'Record',
  id: 'a',
  plannedSessionCount: 10,
} as ObjectRecord;
const visit = (
  sessionNumber: number,
  recordStatus = 'SUBMITTED',
  contractId = 'a',
) =>
  ({
    __typename: 'Record',
    id: String(sessionNumber),
    sessionNumber,
    recordStatus,
    contractId,
  }) as ObjectRecord;

describe('getContractSessionProgress', () => {
  it('uses the highest submitted session, ignoring duplicates, drafts and other contracts', () => {
    expect(
      getContractSessionProgress(contract, [
        visit(2),
        visit(2),
        visit(1),
        visit(9, 'DRAFT'),
        visit(10, 'SUBMITTED', 'b'),
      ]),
    ).toEqual({ current: 2, total: 10, percent: 20 });
  });
  it('starts at zero and ignores invalid session numbers', () => {
    expect(
      getContractSessionProgress(contract, [visit(-1), visit(1.5)]),
    ).toEqual({ current: 0, total: 10, percent: 0 });
  });
  it('caps the bar while preserving the reached session', () => {
    expect(getContractSessionProgress(contract, [visit(12)])).toEqual({
      current: 12,
      total: 10,
      percent: 100,
    });
  });
  it('does not invent a percentage when the total is undecided', () => {
    expect(
      getContractSessionProgress(
        { __typename: 'Record', id: 'a' } as ObjectRecord,
        [visit(3)],
      ),
    ).toEqual({ current: 3, total: null, percent: null });
  });
});
