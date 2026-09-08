import { STATUS_BOARD_EMPLOYMENT_STATUS_ACTIVE } from '@/status-board/constants/StatusBoardEmploymentStatusActive';
import { STATUS_BOARD_FIELD } from '@/status-board/constants/StatusBoardFieldNames';
import { STATUS_BOARD_LIMITS } from '@/status-board/constants/StatusBoardLimits';
import { STATUS_BOARD_OBJECT_NAME_SINGULAR } from '@/status-board/constants/StatusBoardObjectNames';
import { andStatusBoardFilters } from '@/status-board/utils/andStatusBoardFilters';
import { buildStatusBoardRecordGqlFields } from '@/status-board/utils/buildStatusBoardRecordGqlFields';
import { hasStatusBoardField } from '@/status-board/utils/hasStatusBoardField';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

export const useStatusBoardMembers = ({
  memberObjectMetadataItem,
}: {
  memberObjectMetadataItem: EnrichedObjectMetadataItem | undefined;
}) => {
  const employmentStatusFilter = hasStatusBoardField(
    memberObjectMetadataItem,
    STATUS_BOARD_FIELD.employmentStatus,
  )
    ? {
        [STATUS_BOARD_FIELD.employmentStatus]: {
          eq: STATUS_BOARD_EMPLOYMENT_STATUS_ACTIVE,
        },
      }
    : undefined;

  const { records, loading } = useFindManyRecords({
    objectNameSingular: STATUS_BOARD_OBJECT_NAME_SINGULAR.member,
    skip: memberObjectMetadataItem === undefined,
    filter: andStatusBoardFilters([employmentStatusFilter]),
    limit: STATUS_BOARD_LIMITS.picker,
    recordGqlFields: memberObjectMetadataItem
      ? buildStatusBoardRecordGqlFields({
          objectMetadataItem: memberObjectMetadataItem,
          fieldNames: [
            STATUS_BOARD_FIELD.name,
            STATUS_BOARD_FIELD.currentGroup,
            STATUS_BOARD_FIELD.currentGroupId,
            STATUS_BOARD_FIELD.employmentStatus,
          ],
        })
      : { id: true },
  });

  return {
    members: records as ObjectRecord[],
    loading,
  };
};
