import { getStatusBoardMemberGroupId } from '@/status-board/utils/getStatusBoardMemberGroupId';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useMemo } from 'react';

export const useStatusBoardMemberIds = ({
  members,
  selectedGroupIds,
  selectedMemberIds,
}: {
  members: ObjectRecord[];
  selectedGroupIds: string[];
  selectedMemberIds: string[];
}): {
  visibleMembers: ObjectRecord[];
  memberIds: string[] | undefined;
} => {
  return useMemo(() => {
    const visibleMembers =
      selectedGroupIds.length === 0
        ? members
        : members.filter((member) => {
            const groupId = getStatusBoardMemberGroupId(member);

            return groupId !== undefined && selectedGroupIds.includes(groupId);
          });

    if (selectedMemberIds.length > 0) {
      return {
        visibleMembers,
        memberIds: visibleMembers
          .filter((member) => selectedMemberIds.includes(member.id))
          .map((member) => member.id),
      };
    }

    if (selectedGroupIds.length > 0) {
      return {
        visibleMembers,
        memberIds: visibleMembers.map((member) => member.id),
      };
    }

    return {
      visibleMembers,
      memberIds: undefined,
    };
  }, [members, selectedGroupIds, selectedMemberIds]);
};
