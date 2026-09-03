import { RECORD_TABLE_ROW_HEIGHT } from '@/object-record/record-table/constants/RecordTableRowHeight';
import { TABLE_Z_INDEX } from '@/object-record/record-table/constants/TableZIndex';
import { RecordTableHeaderCheckboxColumn } from '@/object-record/record-table/record-table-header/components/RecordTableHeaderCheckboxColumn';
import { RecordTableHeaderDnd } from '@/object-record/record-table/record-table-header/components/RecordTableHeaderDnd';
import { RecordTableHeaderDragDropColumn } from '@/object-record/record-table/record-table-header/components/RecordTableHeaderDragDropColumn';
import { RecordTableHeaderFirstCell } from '@/object-record/record-table/record-table-header/components/RecordTableHeaderFirstCell';
import { useResizeTableHeader } from '@/object-record/record-table/record-table-header/hooks/useResizeTableHeader';
import { useIsRecordTableCheckboxColumnHidden } from '@/object-record/record-table/hooks/useIsRecordTableCheckboxColumnHidden';
import { useIsRecordTableDragColumnHidden } from '@/object-record/record-table/hooks/useIsRecordTableDragColumnHidden';
import { styled } from '@linaria/react';

const StyledHeaderContainer = styled.div`
  align-items: stretch;
  display: flex;
  flex-direction: row;
  min-height: ${RECORD_TABLE_ROW_HEIGHT}px;
  position: sticky;
  top: 0;
  z-index: ${TABLE_Z_INDEX.headerRow};
`;

export const RecordTableHeader = () => {
  const isRecordTableDragColumnHidden = useIsRecordTableDragColumnHidden();

  const isRecordTableCheckboxColumnHidden =
    useIsRecordTableCheckboxColumnHidden();

  useResizeTableHeader();

  return (
    <StyledHeaderContainer>
      {!isRecordTableDragColumnHidden && <RecordTableHeaderDragDropColumn />}
      {!isRecordTableCheckboxColumnHidden && (
        <RecordTableHeaderCheckboxColumn />
      )}
      <RecordTableHeaderFirstCell />
      <RecordTableHeaderDnd />
    </StyledHeaderContainer>
  );
};
