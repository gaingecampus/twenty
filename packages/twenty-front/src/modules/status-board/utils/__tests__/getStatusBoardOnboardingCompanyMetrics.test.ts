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
        contractTypeFilter: {
          field: 'onboardingType',
          values: onboardingTypes,
        },
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
        contractTypeFilter: {
          field: 'onboardingType',
          values: onboardingTypes,
        },
      }),
    ).toEqual({
      totalCount: 1,
      personCountByOnboardingId: { full: 1 },
      memberIdsByOnboardingId: { full: ['lead', 'execution', 'co'] },
    });
  });
});

describe('project onboarding metrics', () => {
  const contractTypeFilter = {
    field: 'visitCadence',
    values: ['PROJECT'],
  } as const;

  it('counts only project cadence contracts and preserves distinct consultant counts', () => {
    const result = getStatusBoardOnboardingCompanyMetrics({
      records: [
        {
          id: 'project',
          __typename: 'Onboarding',
          onboardingType: 'HEADHUNTING',
          visitCadence: 'PROJECT',
          leadConsultantId: 'a',
          executionConsultantId: 'a',
        },
        ...[
          'CONSULTING',
          'COACHING',
          'HEADHUNTING',
          'ONE_TIME',
          'SOFTWARE_DEVELOPMENT',
        ].map((onboardingType) => ({
          id: onboardingType,
          __typename: 'Onboarding',
          onboardingType,
          visitCadence: 'LECTURE',
          leadConsultantId: 'a',
        })),
      ],
      assignments: [
        { onboardingId: 'project', memberId: 'b' },
        { onboardingId: 'project', memberId: 'c' },
      ],
      memberIds: ['a', 'b'],
      contractTypeFilter,
    });
    expect(result.totalCount).toBe(2);
    expect(result.personCountByOnboardingId).toEqual({ project: 2 });
    expect(result.memberIdsByOnboardingId).toEqual({
      project: ['a', 'b', 'c'],
    });
  });

  it.each(['CONSULTING', 'COACHING', 'HEADHUNTING', null])(
    'includes project cadence regardless of contract type %s',
    (onboardingType) => {
      const result = getStatusBoardOnboardingCompanyMetrics({
        records: [
          {
            id: 'project',
            __typename: 'Onboarding',
            onboardingType,
            visitCadence: 'PROJECT',
            executionConsultantId: 'member',
          },
        ],
        assignments: [],
        contractTypeFilter,
      });
      expect(result.personCountByOnboardingId).toEqual({ project: 1 });
    },
  );

  it.each([
    'WEEKLY',
    'BIWEEKLY',
    'MONTHLY',
    'LECTURE',
    'ADVISORY',
    '',
    null,
    undefined,
  ])('excludes non-project or missing cadence %s', (visitCadence) => {
    const result = getStatusBoardOnboardingCompanyMetrics({
      records: [
        {
          id: 'other',
          __typename: 'Onboarding',
          onboardingType: 'HEADHUNTING',
          visitCadence,
          executionConsultantId: 'member',
        },
      ],
      assignments: [],
      contractTypeFilter,
    });
    expect(result.totalCount).toBe(0);
    expect(result.personCountByOnboardingId).toEqual({});
  });
});
