import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { HeadlessEngineCommandWrapperEffect } from '@/command-menu-item/engine-command/components/HeadlessEngineCommandWrapperEffect';
import { useHeadlessCommandContextApi } from '@/command-menu-item/engine-command/hooks/useHeadlessCommandContextApi';
import { useRemoveNavigationMenuItemByTargetRecordId } from '@/navigation-menu-item/common/hooks/useRemoveNavigationMenuItemByTargetRecordId';
import { useNavigationMenuItemsData } from '@/navigation-menu-item/display/hooks/useNavigationMenuItemsData';
import { DEFAULT_QUERY_PAGE_SIZE } from '@/object-record/constants/DefaultQueryPageSize';
import { useIncrementalDeleteManyRecords } from '@/object-record/hooks/useIncrementalDeleteManyRecords';
import { useRemoveSelectedRecordsFromRecordBoard } from '@/object-record/record-board/hooks/useRemoveSelectedRecordsFromRecordBoard';
import { useResetTableRowSelection } from '@/object-record/record-table/hooks/internal/useResetTableRowSelection';
import { useSidePanelMenu } from '@/side-panel/hooks/useSidePanelMenu';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

export const DeleteRecordsCommand = () => {
  const { recordIndexId, objectMetadataItem, selectedRecords, graphqlFilter } =
    useHeadlessCommandContextApi();

  if (!isDefined(recordIndexId) || !isDefined(objectMetadataItem)) {
    throw new Error(
      'Record index ID and object metadata are required to delete records',
    );
  }

  const recordId = selectedRecords[0]?.id;

  const { resetTableRowSelection } = useResetTableRowSelection(recordIndexId);

  const { removeSelectedRecordsFromRecordBoard } =
    useRemoveSelectedRecordsFromRecordBoard(recordIndexId);

  const noMatchFilter: RecordGqlOperationFilter = { id: { in: [] } };

  const { incrementalDeleteManyRecords } = useIncrementalDeleteManyRecords({
    objectNameSingular: objectMetadataItem.nameSingular,
    filter: graphqlFilter ?? noMatchFilter,
    pageSize: DEFAULT_QUERY_PAGE_SIZE,
    delayInMsBetweenMutations: 50,
  });

  const { navigationMenuItems, workspaceNavigationMenuItems } =
    useNavigationMenuItemsData();

  const { removeNavigationMenuItemsByTargetRecordIds } =
    useRemoveNavigationMenuItemByTargetRecordId();

  const { closeSidePanelMenu } = useSidePanelMenu();

  const { enqueueSuccessSnackBar, enqueueErrorSnackBar } = useSnackBar();

  const handleExecute = async () => {
    if (!isDefined(graphqlFilter)) {
      enqueueErrorSnackBar({ message: '삭제할 항목을 확인할 수 없습니다.' });
      return;
    }

    let deletedCount: number;
    try {
      deletedCount = await incrementalDeleteManyRecords();
    } catch {
      enqueueErrorSnackBar({
        message: '삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.',
        options: { duration: 8000 },
      });
      return;
    }

    removeSelectedRecordsFromRecordBoard();
    resetTableRowSelection();
    closeSidePanelMenu();
    enqueueSuccessSnackBar({
      message: `${objectMetadataItem.labelSingular} ${deletedCount}건을 삭제했습니다. 휴지통에서 복원할 수 있습니다.`,
      options: { duration: 8000 },
    });

    if (isDefined(recordId)) {
      const foundNavigationMenuItem = [
        ...navigationMenuItems,
        ...workspaceNavigationMenuItems,
      ].find((item) => item.targetRecordId === recordId);

      if (isDefined(foundNavigationMenuItem)) {
        removeNavigationMenuItemsByTargetRecordIds([recordId]);
      }
    }
  };

  return <HeadlessEngineCommandWrapperEffect execute={handleExecute} />;
};
