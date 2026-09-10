import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

export const getStatusBoardRelationId = (
  value: unknown,
): string | undefined => {
  if (typeof value === 'string' && value.length > 0) return value;
  if (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string'
  )
    return value.id;
  return undefined;
};

export const getStatusBoardOnboardingMetrics = ({
  records,
  assignments,
  memberIds,
  executionIdField = 'executionConsultantId',
}: {
  records: ObjectRecord[];
  assignments: { onboardingId: string; memberId: string }[];
  memberIds?: string[];
  executionIdField?: string;
}) => {
  const membersByContract = new Map<string, Set<string>>();
  for (const assignment of assignments) {
    const members =
      membersByContract.get(assignment.onboardingId) ?? new Set<string>();
    members.add(assignment.memberId);
    membersByContract.set(assignment.onboardingId, members);
  }
  const onboardingIds: string[] = [];
  const companyIds = new Set<string>();
  let consultantCount = 0;
  for (const record of records) {
    const members = new Set(membersByContract.get(record.id));
    const executionId =
      getStatusBoardRelationId(record[executionIdField]) ??
      getStatusBoardRelationId(record.executionConsultant);
    if (executionId) members.add(executionId);
    const selectedMembers = [...members].filter(
      (id) => memberIds === undefined || memberIds.includes(id),
    );
    if (memberIds !== undefined && selectedMembers.length === 0) continue;
    consultantCount += selectedMembers.length;
    onboardingIds.push(record.id);
    const companyId =
      getStatusBoardRelationId(record.company) ??
      getStatusBoardRelationId(record.companyId);
    if (companyId) companyIds.add(companyId);
  }
  return { consultantCount, onboardingIds, companyIds: [...companyIds] };
};
