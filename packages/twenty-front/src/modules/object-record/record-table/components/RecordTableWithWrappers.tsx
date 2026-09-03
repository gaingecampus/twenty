import { useContext } from 'react';

import { useDeleteOneRecord } from '@/object-record/hooks/useDeleteOneRecord';
import { IsRecordIndexPageContext } from '@/object-record/record-index/components/RecordIndexPageProvider';
import { useOpenRecordFromIndexView } from '@/object-record/record-index/hooks/useOpenRecordFromIndexView';
import { RecordTable } from '@/object-record/record-table/components/RecordTable';
import { RecordTableComponentInstance } from '@/object-record/record-table/components/RecordTableComponentInstance';
import { RecordTableContextProvider } from '@/object-record/record-table/components/RecordTableContextProvider';
import { EntityDeleteContext } from '@/object-record/record-table/contexts/EntityDeleteHookContext';
import { useSelectAllRows } from '@/object-record/record-table/hooks/internal/useSelectAllRows';
import { useActiveRecordTableRow } from '@/object-record/record-table/hooks/useActiveRecordTableRow';
import { useFocusedRecordTableRow } from '@/object-record/record-table/hooks/useFocusedRecordTableRow';
import { RecordTableRecordLimitReloadEffect } from '@/object-record/record-table/virtualization/components/RecordTableRecordLimitReloadEffect';
import { PageFocusId } from '@/types/PageFocusId';
import { useHotkeysOnFocusedElement } from '@/ui/utilities/hotkey/hooks/useHotkeysOnFocusedElement';
import { ScrollWrapper } from '@/ui/utilities/scroll/components/ScrollWrapper';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledRecordTablePrintBoundary = styled.div`
  display: contents;

  @media print {
    display: block;
    max-height: 100vh;
    overflow: hidden;
  }
`;

// oxlint-disable-next-line twenty/no-hardcoded-colors
const StyledRecordIndexTableInset = styled.div`
  background: #f8f8fb;
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  padding: ${themeCssVariables.spacing[6]};
  width: 100%;
`;

type RecordTableWithWrappersProps = {
  objectNameSingular: string;
  recordTableId: string;
  viewBarId: string;
};

export const RecordTableWithWrappers = ({
  objectNameSingular,
  recordTableId,
  viewBarId,
}: RecordTableWithWrappersProps) => {
  const { selectAllRows } = useSelectAllRows(recordTableId);

  const handleSelectAllRows = () => {
    selectAllRows();
  };

  useHotkeysOnFocusedElement({
    keys: ['ctrl+a,meta+a'],
    callback: handleSelectAllRows,
    focusId: PageFocusId.RecordIndex,
    dependencies: [handleSelectAllRows],
    options: {
      enableOnFormTags: false,
    },
  });

  const { activateRecordTableRow } = useActiveRecordTableRow(recordTableId);
  const { unfocusRecordTableRow } = useFocusedRecordTableRow(recordTableId);
  const { openRecordFromIndexView } = useOpenRecordFromIndexView();

  const handleRecordIdentifierClick = (rowIndex: number, recordId: string) => {
    activateRecordTableRow(rowIndex);
    unfocusRecordTableRow();
    openRecordFromIndexView({ recordId });
  };

  const { deleteOneRecord } = useDeleteOneRecord({ objectNameSingular });
  const isRecordIndexPage = useContext(IsRecordIndexPageContext);

  const recordTable = (
    <ScrollWrapper
      componentInstanceId={`record-table-scroll-${recordTableId}`}
    >
      <RecordTableRecordLimitReloadEffect />
      <RecordTable />
    </ScrollWrapper>
  );

  return (
    <RecordTableComponentInstance recordTableId={recordTableId}>
      <RecordTableContextProvider
        recordTableId={recordTableId}
        viewBarId={viewBarId}
        objectNameSingular={objectNameSingular}
        onRecordIdentifierClick={handleRecordIdentifierClick}
      >
        <EntityDeleteContext.Provider value={deleteOneRecord}>
          <StyledRecordTablePrintBoundary>
            {isRecordIndexPage ? (
              <StyledRecordIndexTableInset>
                {recordTable}
              </StyledRecordIndexTableInset>
            ) : (
              recordTable
            )}
          </StyledRecordTablePrintBoundary>
        </EntityDeleteContext.Provider>
      </RecordTableContextProvider>
    </RecordTableComponentInstance>
  );
};
