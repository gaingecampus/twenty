import { RECORD_TABLE_COLUMN_ADD_COLUMN_BUTTON_WIDTH } from '@/object-record/record-table/constants/RecordTableColumnAddColumnButtonWidth';
import { RECORD_TABLE_ROW_HEIGHT } from '@/object-record/record-table/constants/RecordTableRowHeight';
import { useIsRecordTableAddColumnButtonHidden } from '@/object-record/record-table/hooks/useIsRecordTableAddColumnButtonHidden';
import { styled } from '@linaria/react';
import { cx } from '@linaria/core';

const StyledPlaceholderAddButtonCell = styled.div`
  box-sizing: border-box;
  height: ${RECORD_TABLE_ROW_HEIGHT}px;
  width: ${RECORD_TABLE_COLUMN_ADD_COLUMN_BUTTON_WIDTH}px;
`;

export const RecordTableAddButtonPlaceholderCell = ({
  className,
}: {
  className?: string;
}) => {
  const isRecordTableAddColumnButtonHidden =
    useIsRecordTableAddColumnButtonHidden();

  if (isRecordTableAddColumnButtonHidden) {
    return null;
  }

  return <StyledPlaceholderAddButtonCell className={cx(className)} />;
};
