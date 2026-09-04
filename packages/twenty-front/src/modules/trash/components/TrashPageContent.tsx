import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { RECORD_TABLE_ROW_HEIGHT } from '@/object-record/record-table/constants/RecordTableRowHeight';
import { StyledTrashListGrid } from '@/trash/components/TrashListGrid';
import { TrashEmptyState } from '@/trash/components/TrashEmptyState';
import { TrashObjectDeletedRecords } from '@/trash/components/TrashObjectDeletedRecords';
import { TrashPageHeader } from '@/trash/components/TrashPageHeader';
import { TrashViewBar } from '@/trash/components/TrashViewBar';
import { useTrashAccessibleObjectMetadataItems } from '@/trash/hooks/useTrashAccessibleObjectMetadataItems';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageTitle } from '@/ui/utilities/page-title/components/PageTitle';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';
import { themeCssVariables } from 'twenty-ui/theme-constants';

// oxlint-disable-next-line twenty/no-hardcoded-colors
const StyledTableInset = styled.div`
  background: #f8f8fb;
  box-sizing: border-box;
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding-bottom: ${themeCssVariables.spacing[6]};
  padding-left: ${themeCssVariables.spacing[6]};
  padding-right: ${themeCssVariables.spacing[6]};
  padding-top: 0;
  width: 100%;
`;

const StyledTableCard = styled.div`
  background: ${themeCssVariables.background.primary};
  border-radius: var(--t-table-radius, 0);
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: auto;
`;

const StyledListHeader = styled(StyledTrashListGrid)`
  background-color: ${themeCssVariables.background.primary};
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  box-sizing: border-box;
  height: ${RECORD_TABLE_ROW_HEIGHT}px;
  min-height: ${RECORD_TABLE_ROW_HEIGHT}px;
  padding: 0 ${themeCssVariables.table.horizontalCellPadding};
  position: sticky;
  top: 0;
  z-index: 1;
`;

const StyledHeaderCell = styled.span`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
  height: 100%;
  min-width: 0;
`;

export const TrashPageContent = () => {
  const {
    trashAccessibleObjectMetadataItems,
    hasTrashAccess,
    areObjectMetadataItemsLoaded,
  } = useTrashAccessibleObjectMetadataItems();
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);
  const [loadedRecordCountByObjectId, setLoadedRecordCountByObjectId] =
    useState<Record<string, number>>({});

  const handleObjectRecordsLoaded = (
    objectMetadataItemId: string,
    recordCount: number,
  ) => {
    setLoadedRecordCountByObjectId((currentLoadedRecordCountByObjectId) => {
      if (
        currentLoadedRecordCountByObjectId[objectMetadataItemId] === recordCount
      ) {
        return currentLoadedRecordCountByObjectId;
      }

      return {
        ...currentLoadedRecordCountByObjectId,
        [objectMetadataItemId]: recordCount,
      };
    });
  };

  if (!areObjectMetadataItemsLoaded) {
    return null;
  }

  if (!hasTrashAccess) {
    return <Navigate to={AppPath.Index} replace />;
  }

  const haveAllObjectsLoaded = trashAccessibleObjectMetadataItems.every(
    (objectMetadataItem) =>
      objectMetadataItem.id in loadedRecordCountByObjectId,
  );
  const deletedRecordCount = Object.values(loadedRecordCountByObjectId).reduce(
    (totalCount, recordCount) => totalCount + recordCount,
    0,
  );
  const trashRetentionDays = currentWorkspace?.trashRetentionDays ?? 14;
  const shouldShowEmptyState = haveAllObjectsLoaded && deletedRecordCount === 0;

  return (
    <>
      <PageTitle title={t`Trash`} />
      <PageCardLayout
        header={<TrashPageHeader />}
        secondaryBar={
          <TrashViewBar
            recordCount={deletedRecordCount}
            trashRetentionDays={trashRetentionDays}
          />
        }
      >
        <StyledTableInset>
          <StyledTableCard>
            {shouldShowEmptyState ? (
              <TrashEmptyState />
            ) : (
              <>
                <StyledListHeader>
                  <StyledHeaderCell>{t`Name`}</StyledHeaderCell>
                  <StyledHeaderCell>{t`Object`}</StyledHeaderCell>
                  <StyledHeaderCell>{t`Deleted`}</StyledHeaderCell>
                  <StyledHeaderCell>{t`Deleted by`}</StyledHeaderCell>
                  <StyledHeaderCell />
                </StyledListHeader>
                {trashAccessibleObjectMetadataItems.map(
                  (objectMetadataItem) => (
                    <TrashObjectDeletedRecords
                      key={objectMetadataItem.id}
                      objectMetadataItem={objectMetadataItem}
                      onLoaded={handleObjectRecordsLoaded}
                    />
                  ),
                )}
              </>
            )}
          </StyledTableCard>
        </StyledTableInset>
      </PageCardLayout>
    </>
  );
};
