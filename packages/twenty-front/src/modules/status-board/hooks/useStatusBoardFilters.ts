import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { getStatusBoardMemberGroupId } from '@/status-board/utils/getStatusBoardMemberGroupId';
import { type StatusBoardPeriodType } from '@/status-board/utils/getStatusBoardPeriodRange';
import { useCallback, useState } from 'react';

export const useStatusBoardFilters = (members: ObjectRecord[]) => {
  const [{ selectedGroupIds, selectedMemberIds }, setSelection] = useState<{
    selectedGroupIds: string[];
    selectedMemberIds: string[];
  }>({ selectedGroupIds: [], selectedMemberIds: [] });
  const [periodType, setPeriodType] = useState<StatusBoardPeriodType>('month');
  const [periodOffset, setPeriodOffset] = useState(0);

  const toggleGroupId = useCallback(
    (groupId: string) => {
      setSelection((current) => {
        const nextGroupIds = current.selectedGroupIds.includes(groupId)
          ? current.selectedGroupIds.filter((id) => id !== groupId)
          : [...current.selectedGroupIds, groupId];
        const availableIds = new Set(
          members
            .filter(
              (member) =>
                nextGroupIds.length === 0 ||
                nextGroupIds.includes(
                  getStatusBoardMemberGroupId(member) ?? '',
                ),
            )
            .map((member) => member.id),
        );
        return {
          selectedGroupIds: nextGroupIds,
          selectedMemberIds: current.selectedMemberIds.filter((id) =>
            availableIds.has(id),
          ),
        };
      });
    },
    [members],
  );

  const toggleMemberId = useCallback((memberId: string) => {
    setSelection((current) => ({
      ...current,
      selectedMemberIds: current.selectedMemberIds.includes(memberId)
        ? current.selectedMemberIds.filter((id) => id !== memberId)
        : [...current.selectedMemberIds, memberId],
    }));
  }, []);

  const clearSelectedGroupIds = useCallback(() => {
    setSelection({ selectedGroupIds: [], selectedMemberIds: [] });
  }, []);

  const clearSelectedMemberIds = useCallback(() => {
    setSelection((current) => ({ ...current, selectedMemberIds: [] }));
  }, []);

  const selectPeriodType = useCallback(
    (nextPeriodType: StatusBoardPeriodType) => {
      setPeriodType(nextPeriodType);
      setPeriodOffset(0);
    },
    [],
  );

  return {
    selectedGroupIds,
    selectedMemberIds,
    periodType,
    periodOffset,
    toggleGroupId,
    toggleMemberId,
    clearSelectedGroupIds,
    clearSelectedMemberIds,
    selectPeriodType,
    setPeriodOffset,
  };
};
