import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { StatusBoardCountKpi } from '@/status-board/components/StatusBoardCountKpi';
import { type StatusBoardTone } from '@/status-board/components/statusBoardStyled';
import { buildStatusBoardRecordGqlFields } from '@/status-board/utils/buildStatusBoardRecordGqlFields';
import { type StatusBoardSheetState } from '@/status-board/components/StatusBoardSheet';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { indexViewIdFromObjectMetadataItemFamilySelector } from '@/views/states/selectors/indexViewIdFromObjectMetadataItemFamilySelector';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';

export const StatusBoardLinkedCountKpi = ({
  objectMetadataItem,
  filter,
  label,
  tone,
  withSum,
  onOpenSheet,
}: {
  objectMetadataItem: EnrichedObjectMetadataItem;
  filter?: RecordGqlOperationFilter;
  label: string;
  tone?: StatusBoardTone;
  withSum?: boolean;
  onOpenSheet: (sheet: StatusBoardSheetState) => void;
}) => {
  const viewId = useAtomFamilySelectorValue(
    indexViewIdFromObjectMetadataItemFamilySelector,
    { objectMetadataItemId: objectMetadataItem.id },
  );
  return (
    <StatusBoardCountKpi
      filter={filter}
      label={label}
      tone={tone}
      withSum={withSum}
      objectNameSingular={objectMetadataItem.nameSingular}
      onClick={() =>
        onOpenSheet({
          title: label,
          objectNameSingular: objectMetadataItem.nameSingular,
          filter,
          recordGqlFields: buildStatusBoardRecordGqlFields({
            objectMetadataItem,
            fieldNames: ['name', 'company'],
          }),
          listTarget: { objectMetadataItem, viewId },
        })
      }
    />
  );
};
