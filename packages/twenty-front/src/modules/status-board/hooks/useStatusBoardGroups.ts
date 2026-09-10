import { useStatusBoardMetadata } from '@/status-board/hooks/useStatusBoardMetadata';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { turnSortsIntoOrderBy } from '@/object-record/object-sort-dropdown/utils/turnSortsIntoOrderBy';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { indexViewIdFromObjectMetadataItemFamilySelector } from '@/views/states/selectors/indexViewIdFromObjectMetadataItemFamilySelector';
import { viewFromViewIdFamilySelector } from '@/views/states/selectors/viewFromViewIdFamilySelector';
import { STATUS_BOARD_LIMITS } from '@/status-board/constants/StatusBoardLimits';
import { STATUS_BOARD_OBJECT_NAME_SINGULAR } from '@/status-board/constants/StatusBoardObjectNames';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

export const useStatusBoardGroups = ({ skip }: { skip: boolean }) => {
  const { group } = useStatusBoardMetadata();
  const { objectMetadataItems } = useObjectMetadataItems();
  const viewId = useAtomFamilySelectorValue(
    indexViewIdFromObjectMetadataItemFamilySelector,
    { objectMetadataItemId: group?.id ?? '' },
  );
  const view = useAtomFamilySelectorValue(viewFromViewIdFamilySelector, {
    viewId: viewId ?? '',
  });
  const { records, loading } = useFindManyRecords({
    objectNameSingular: STATUS_BOARD_OBJECT_NAME_SINGULAR.group,
    skip,
    limit: STATUS_BOARD_LIMITS.picker,
    orderBy: group
      ? turnSortsIntoOrderBy(group, view?.viewSorts ?? [], objectMetadataItems)
      : [{ position: 'AscNullsFirst' }],
    recordGqlFields: { id: true, name: true },
  });

  return {
    groups: records as ObjectRecord[],
    loading,
  };
};
