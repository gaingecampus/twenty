import { STATUS_BOARD_LIMITS } from '@/status-board/constants/StatusBoardLimits';
import { STATUS_BOARD_OBJECT_NAME_SINGULAR } from '@/status-board/constants/StatusBoardObjectNames';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

export const useStatusBoardGroups = ({ skip }: { skip: boolean }) => {
  const { records, loading } = useFindManyRecords({
    objectNameSingular: STATUS_BOARD_OBJECT_NAME_SINGULAR.group,
    skip,
    limit: STATUS_BOARD_LIMITS.picker,
    recordGqlFields: { id: true, name: true },
  });

  return {
    groups: records as ObjectRecord[],
    loading,
  };
};
