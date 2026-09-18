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
      memberIdsByOnboardingId: { full: ['co'] },
    });
  });
});
