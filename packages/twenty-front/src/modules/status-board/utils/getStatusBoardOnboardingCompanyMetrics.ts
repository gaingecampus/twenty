import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { getStatusBoardRelationId } from '@/status-board/utils/getStatusBoardOnboardingMetrics';

// Each distinct lead, execution or co-consultant on a contract counts once,
// so a contract with one of each contributes three.
export const getStatusBoardOnboardingCompanyMetrics = ({
  records,
  assignments,
  memberIds,
  onboardingTypes,
}: {
  records: ObjectRecord[];
  assignments: { onboardingId: string; memberId: string }[];
  memberIds?: string[];
  onboardingTypes: readonly string[];
}) => {
  const coMembersByContract = new Map<string, string[]>();
  for (const assignment of assignments) {
    coMembersByContract.set(assignment.onboardingId, [
      ...(coMembersByContract.get(assignment.onboardingId) ?? []),
      assignment.memberId,
    ]);
  }
  const personCountByOnboardingId: Record<string, number> = {};
  const memberIdsByOnboardingId: Record<string, string[]> = {};
  let totalCount = 0;
  for (const record of records) {
    if (
      typeof record.onboardingType !== 'string' ||
      !onboardingTypes.includes(record.onboardingType)
    )
      continue;
    // Lead first, then execution, then co-consultants, for display order.
    const members = new Set<string>();
    for (const [idField, relationField] of [
      ['leadConsultantId', 'leadConsultant'],
      ['executionConsultantId', 'executionConsultant'],
    ]) {
      const memberId =
        getStatusBoardRelationId(record[idField]) ??
        getStatusBoardRelationId(record[relationField]);
      if (memberId) members.add(memberId);
    }
    for (const memberId of coMembersByContract.get(record.id) ?? [])
      members.add(memberId);
    const countedMemberIds = [...members].filter(
      (id) => memberIds === undefined || memberIds.includes(id),
    );
    const personCount = countedMemberIds.length;
    if (personCount === 0) continue;
    personCountByOnboardingId[record.id] = personCount;
    // Show every consultant on the contract; the member filter only scopes counts.
    memberIdsByOnboardingId[record.id] = [...members];
    totalCount += personCount;
  }
  return { totalCount, personCountByOnboardingId, memberIdsByOnboardingId };
};
