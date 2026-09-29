import { assigned, visitsFor, visitMetrics } from '@/field-management/fieldManagementUtils';

describe('field management contract isolation and metrics', () => {
  const contracts = [
    {
      __typename: 'Record',
      id: 'a',
      consultingGoal: '목표',
      executionConsultantId: 'execution',
      leadConsultantId: 'lead',
    },
    { __typename: 'Record', id: 'b', consultingGoal: ' ' },
  ];
  const visits = [
    {
      __typename: 'Record',
      id: 'v1',
      contractId: 'a',
      visitDate: '2026-09-01',
      recordStatus: 'SUBMITTED',
    },
    {
      __typename: 'Record',
      id: 'v2',
      contractId: 'a',
      visitDate: '2026-09-28',
      recordStatus: 'DRAFT',
    },
    {
      __typename: 'Record',
      id: 'v3',
      contractId: 'outside',
      visitDate: '2026-09-10',
      recordStatus: 'SUBMITTED',
    },
    {
      __typename: 'Record',
      id: 'v4',
      contractId: 'a',
      visitDate: '2026-10-01',
      recordStatus: 'SUBMITTED',
    },
  ];
  it('matches execution and joint consultants without implicitly including lead', () => {
    expect(assigned(contracts[0], 'execution', [])).toBe(true);
    expect(assigned(contracts[0], 'lead', [])).toBe(false);
    expect(assigned(contracts[0], 'lead', [], true)).toBe(true);
    expect(
      assigned(contracts[0], 'joint', [
        {
          __typename: 'Record',
          id: 'link',
          gyeyagId: 'a',
          guseongweonId: 'joint',
        },
      ]),
    ).toBe(true);
    expect(assigned(contracts[0], '', [])).toBe(false);
    expect(
      assigned(contracts[1], 'joint', [
        {
          __typename: 'Record',
          id: 'link',
          gyeyagId: 'a',
          guseongweonId: 'joint',
        },
      ]),
    ).toBe(false);
  });
  it('keeps records of simultaneous contracts separate, sorts by actual visit date', () => {
    expect(visitsFor(visits, 'a').map((v) => v.id)).toEqual(['v4', 'v2', 'v1']);
    expect(visitsFor(visits, 'b')).toEqual([]);
  });
  it('counts submitted visits within inclusive date boundaries and only visible contracts', () => {
    expect(visitMetrics(contracts, visits, '2026-09-01', '2026-09-30')).toEqual(
      { goals: 1, withoutRecord: 1, submitted: 1 },
    );
  });
  it('does not label an old submitted visit as no record because period changes', () => {
    expect(visitMetrics(contracts, visits, '2026-11-01', '2026-11-30')).toEqual(
      { goals: 1, withoutRecord: 1, submitted: 0 },
    );
  });
  it('counts all records beyond the first page', () => {
    expect(
      visitMetrics(
        contracts,
        Array.from({ length: 401 }, (_, i) => ({
          ...visits[0],
          id: String(i),
        })),
      ).submitted,
    ).toBe(401);
  });
});
