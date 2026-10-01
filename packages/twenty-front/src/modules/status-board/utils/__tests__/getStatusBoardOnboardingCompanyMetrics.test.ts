import { getStatusBoardOnboardingCompanyMetrics } from '@/status-board/utils/getStatusBoardOnboardingCompanyMetrics';

describe('getStatusBoardOnboardingCompanyMetrics', () => {
  const records = [
    {
      id: 'full',
      leadConsultantId: 'lead',
      executionConsultantId: 'execution',
      onboardingType: 'CONSULTING',
    },
    {
      id: 'self',
      leadConsultantId: 'execution',
      executionConsultantId: 'execution',
      onboardingType: 'COACHING',
    },
    {
      id: 'headhunting',
      leadConsultantId: 'lead',
      executionConsultantId: 'execution',
      onboardingType: 'HEADHUNTING',
    },
  ].map((record) => ({ ...record, __typename: 'Onboarding' }));
  const assignments = [{ onboardingId: 'full', memberId: 'co' }];
  const onboardingTypes = ['CONSULTING', 'COACHING'];

  it('should sum lead, execution and co-consultants of consulting and coaching contracts', () => {
    expect(
      getStatusBoardOnboardingCompanyMetrics({
        records,
        assignments,
        onboardingTypes,
      }),
    ).toEqual({
      totalCount: 4,
      personCountByOnboardingId: { full: 3, self: 1 },
      memberIdsByOnboardingId: {
        full: ['lead', 'execution', 'co'],
        self: ['execution'],
      },
    });
  });

  it('should count only selected members when filtering by member', () => {
    expect(
      getStatusBoardOnboardingCompanyMetrics({
        records,
        assignments,
        memberIds: ['co'],
        onboardingTypes,
      }),
    ).toEqual({
      totalCount: 1,
      personCountByOnboardingId: { full: 1 },
      memberIdsByOnboardingId: { full: ['lead', 'execution', 'co'] },
    });
  });
});

describe('project onboarding metrics', () => {
  it('counts other contract types, deduplicates roles and applies the member filter', () => {
    const result = getStatusBoardOnboardingCompanyMetrics({
      records: [
        {
          id: 'project',
          __typename: 'Onboarding',
          onboardingType: 'HEADHUNTING',
          leadConsultantId: 'a',
          executionConsultantId: 'a',
        },
        {
          id: 'consulting',
          __typename: 'Onboarding',
          onboardingType: 'CONSULTING',
          leadConsultantId: 'a',
        },
        {
          id: 'coaching',
          __typename: 'Onboarding',
          onboardingType: 'COACHING',
          leadConsultantId: 'a',
        },
        {
          id: 'unknown',
          __typename: 'Onboarding',
          onboardingType: null,
          leadConsultantId: 'a',
        },
      ],
      assignments: [
        { onboardingId: 'project', memberId: 'b' },
        { onboardingId: 'project', memberId: 'c' },
      ],
      memberIds: ['a', 'b'],
      onboardingTypes: ['CONSULTING', 'COACHING'],
      excludeTypes: true,
    });
    expect(result.totalCount).toBe(2);
    expect(result.personCountByOnboardingId).toEqual({ project: 2 });
    expect(result.memberIdsByOnboardingId).toEqual({
      project: ['a', 'b', 'c'],
    });
  });
});
