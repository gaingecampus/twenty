import { getStatusBoardMemberGroupId } from '@/status-board/utils/getStatusBoardMemberGroupId';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useMemo } from 'react';

export const useStatusBoardMemberIds = ({
  members,
  selectedGroupIds,
  selectedMemberId,
}: {
  members: ObjectRecord[];
  selectedGroupIds: string[];
  selectedMemberId: string | undefined;
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

    if (
      selectedMemberId !== undefined &&
      visibleMembers.some((member) => member.id === selectedMemberId)
    ) {
      return {
        visibleMembers,
        memberIds: [selectedMemberId],
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
  }, [members, selectedGroupIds, selectedMemberId]);
};
