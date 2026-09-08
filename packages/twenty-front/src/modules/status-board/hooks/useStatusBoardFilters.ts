import { type StatusBoardPeriodType } from '@/status-board/utils/getStatusBoardPeriodRange';
import { useCallback, useState } from 'react';

export const useStatusBoardFilters = () => {
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>(
    undefined,
  );
  const [periodType, setPeriodType] = useState<StatusBoardPeriodType>('month');
  const [periodOffset, setPeriodOffset] = useState(0);

  const toggleGroupId = useCallback((groupId: string) => {
    setSelectedMemberId(undefined);
    setSelectedGroupIds((currentGroupIds) => {
      if (currentGroupIds.includes(groupId)) {
        return currentGroupIds.filter((id) => id !== groupId);
      }

      return [...currentGroupIds, groupId];
    });
  }, []);

  const selectMemberId = useCallback((memberId: string | undefined) => {
    setSelectedMemberId((currentMemberId) =>
      currentMemberId === memberId ? undefined : memberId,
    );
  }, []);

  const clearSelectedGroupIds = useCallback(() => {
    setSelectedMemberId(undefined);
    setSelectedGroupIds([]);
  }, []);

  const clearSelectedMemberId = useCallback(() => {
    setSelectedMemberId(undefined);
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
    selectedMemberId,
    periodType,
    periodOffset,
    toggleGroupId,
    selectMemberId,
    clearSelectedGroupIds,
    clearSelectedMemberId,
    selectPeriodType,
    setPeriodOffset,
  };
};
