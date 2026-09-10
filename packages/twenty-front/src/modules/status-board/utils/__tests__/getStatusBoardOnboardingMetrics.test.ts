import { getStatusBoardOnboardingMetrics } from '@/status-board/utils/getStatusBoardOnboardingMetrics';

describe('getStatusBoardOnboardingMetrics', () => {
  const records = [
    {
      id: 'verdeco',
      executionConsultantId: 'execution',
      leadConsultantId: 'sales',
      company: { id: 'company' },
    },
    {
      id: 'renewal',
      executionConsultantId: 'execution',
      company: { id: 'company' },
    },
    { id: 'unassigned', executionConsultantId: null, company: null },
  ].map((record) => ({ ...record, __typename: 'Onboarding' }));
  const assignments = [{ onboardingId: 'verdeco', memberId: 'co' }];
  it('counts an execution consultant and a co-consultant as two for the same contract', () => {
    expect(
      getStatusBoardOnboardingMetrics({
        records: records.slice(0, 1),
        assignments,
      }).consultantCount,
    ).toBe(2);
  });
  it('counts the same consultant separately across contracts, without counting the sales lead or unassigned contract', () => {
    expect(
      getStatusBoardOnboardingMetrics({ records, assignments }).consultantCount,
    ).toBe(3);
  });
  it('includes co-consultants when filtering by member', () => {
    expect(
      getStatusBoardOnboardingMetrics({
        records,
        assignments,
        memberIds: ['co'],
      }),
    ).toEqual({
      consultantCount: 1,
      onboardingIds: ['verdeco'],
      companyIds: ['company'],
    });
  });
  it('does not inflate counts for duplicate links or an execution consultant also listed as co-consultant', () => {
    expect(
      getStatusBoardOnboardingMetrics({
        records,
        assignments: [
          ...assignments,
          ...assignments,
          { onboardingId: 'verdeco', memberId: 'execution' },
        ],
      }).consultantCount,
    ).toBe(3);
  });
  it('returns zero for groups without members', () => {
    expect(
      getStatusBoardOnboardingMetrics({ records, assignments, memberIds: [] })
        .consultantCount,
    ).toBe(0);
  });
});
