// Matches --t-spacing-8 so stored view-field sizes render with more room.
export const RECORD_TABLE_COLUMN_WIDTH_EXTRA = 32;

export const getRecordTableColumnDisplayWidth = (size: number) => {
  return size + RECORD_TABLE_COLUMN_WIDTH_EXTRA;
};

// Matches --t-table-horizontal-cell-padding in the enterprise theme.
export const RECORD_TABLE_CELL_HORIZONTAL_PADDING = 12;

export const getRecordTableChipMaxWidth = (size: number) => {
  return (
    getRecordTableColumnDisplayWidth(size) -
    RECORD_TABLE_CELL_HORIZONTAL_PADDING
  );
};
