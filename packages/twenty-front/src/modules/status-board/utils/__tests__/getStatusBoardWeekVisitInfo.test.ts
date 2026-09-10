import { getStatusBoardMemberRoleOnOnboarding } from '@/status-board/utils/getStatusBoardWeekVisitInfo';

describe('onboarding calendar consultant roles', () => {
  const onboarding = {
    id: 'contract',
    __typename: 'Onboarding',
    executionConsultantId: 'executor',
    leadConsultant: { id: 'lead' },
  };
  const assignments = [{ onboardingId: 'contract', memberId: 'co' }];
  const role = (memberId: string, showLeadConsultants = false) =>
    getStatusBoardMemberRoleOnOnboarding({
      onboarding,
      assignments,
      memberId,
      showLeadConsultants,
    });

  it('shows execution and co-execution by default, excluding lead and unassigned members', () => {
    expect(role('executor')).toBe('실행');
    expect(role('co')).toBe('공동 실행');
    expect(role('lead')).toBeUndefined();
    expect(role('other')).toBeUndefined();
  });

  it('includes lead only when enabled and removes it when disabled', () => {
    expect(role('lead', true)).toBe('리드');
    expect(role('executor', true)).toBe('실행');
    expect(role('co', true)).toBe('공동 실행');
    expect(role('lead', false)).toBeUndefined();
  });

  it('keeps dual-role execution visible and does not borrow assignments from another contract', () => {
    expect(
      getStatusBoardMemberRoleOnOnboarding({
        onboarding: { ...onboarding, leadConsultantId: 'executor' },
        memberId: 'executor',
      }),
    ).toBe('실행');
    expect(
      getStatusBoardMemberRoleOnOnboarding({
        onboarding,
        memberId: 'co',
        assignments: [{ onboardingId: 'another', memberId: 'co' }],
      }),
    ).toBeUndefined();
  });
});
