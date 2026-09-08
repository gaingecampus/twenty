import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

export const getStatusBoardMemberGroupId = (
  member: ObjectRecord,
): string | undefined => {
  if (typeof member.currentGroupId === 'string') {
    return member.currentGroupId;
  }

  if (
    typeof member.currentGroup === 'object' &&
    member.currentGroup !== null &&
    'id' in member.currentGroup &&
    typeof member.currentGroup.id === 'string'
  ) {
    return member.currentGroup.id;
  }

  return undefined;
};
