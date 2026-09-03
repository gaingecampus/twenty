import { styled } from '@linaria/react';

import { RECORD_TABLE_COLUMN_CHECKBOX_WIDTH_CLASS_NAME } from '@/object-record/record-table/constants/RecordTableColumnCheckboxWidthClassName';
import { useRecordTableBodyContextOrThrow } from '@/object-record/record-table/contexts/RecordTableBodyContext';
import { RecordTableCellStyleWrapper } from '@/object-record/record-table/record-table-cell/components/RecordTableCellStyleWrapper';
import { Checkbox } from 'twenty-ui/input';

const StyledContainer = styled.div`
  align-items: center;
  box-sizing: border-box;
  cursor: pointer;
  display: flex;
  height: 100%;
  justify-content: center;
  width: 100%;
`;

export const RecordTableCellCheckboxPlaceholder = () => {
  const { hasUserSelectedAllRows } = useRecordTableBodyContextOrThrow();

  return (
    <RecordTableCellStyleWrapper
      isSelected={hasUserSelectedAllRows}
      hasRightBorder={false}
      widthClassName={RECORD_TABLE_COLUMN_CHECKBOX_WIDTH_CLASS_NAME}
    >
      <StyledContainer data-select-disable>
        <Checkbox hoverable checked={hasUserSelectedAllRows === true} />
      </StyledContainer>
    </RecordTableCellStyleWrapper>
  );
};
