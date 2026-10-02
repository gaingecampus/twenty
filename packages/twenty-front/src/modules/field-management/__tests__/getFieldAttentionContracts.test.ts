import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { getFieldAttentionContracts } from '@/field-management/getFieldAttentionContracts';

const contract = {
  id: 'contract',
  onboardingStatus: 'ACTIVE',
  consultingGoal: '목표',
  successCriteria: '결과',
  contractStartDate: '2026-10-01',
  contractEndDate: '2026-10-10',
  plannedSessionCount: 10,
} as ObjectRecord;

describe('getFieldAttentionContracts', () => {
  it('counts missing O or KR only for active contracts', () => {
    const result = getFieldAttentionContracts(
      [
        { ...contract, consultingGoal: ' ' },
        {
          ...contract,
          id: 'done',
          onboardingStatus: 'DONE',
          successCriteria: '',
        },
      ],
      [],
      '2026-10-06',
    );
    expect(result.missingOkr.map((c) => c.id)).toEqual(['contract']);
  });
  it('compares submitted progress against completed days and ignores drafts', () => {
    const visits = [
      {
        id: 'visit',
        contractId: 'contract',
        sessionNumber: 5,
        recordStatus: 'DRAFT',
      },
    ] as ObjectRecord[];
    expect(
      getFieldAttentionContracts([contract], visits, '2026-10-06').delayed,
    ).toHaveLength(1);
    visits[0].recordStatus = 'SUBMITTED';
    expect(
      getFieldAttentionContracts([contract], visits, '2026-10-06').delayed,
    ).toHaveLength(0);
  });
  it('does not mark future or unplanned contracts delayed', () => {
    expect(
      getFieldAttentionContracts([contract], [], '2026-09-30').delayed,
    ).toHaveLength(0);
    const result = getFieldAttentionContracts(
      [{ ...contract, plannedSessionCount: null }],
      [],
      '2026-10-11',
    );
    expect(result.delayed).toHaveLength(0);
    expect(result.unplanned).toHaveLength(1);
  });
  it('requires all sessions after the end date', () => {
    expect(
      getFieldAttentionContracts([contract], [], '2026-10-11').delayed,
    ).toHaveLength(1);
  });
});
