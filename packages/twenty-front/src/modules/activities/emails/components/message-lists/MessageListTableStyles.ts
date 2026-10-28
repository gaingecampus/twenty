import { Table } from '@/ui/layout/table/components/Table';
import { TableHeader } from '@/ui/layout/table/components/TableHeader';
import { TableCell } from '@/ui/layout/table/components/TableCell';
import { RECORD_TABLE_ROW_HEIGHT } from '@/object-record/record-table/constants/RecordTableRowHeight';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

export const StyledMessageListTable = styled(Table)`
  background: ${themeCssVariables.background.primary};
  box-sizing: border-box;
  min-width: 700px;
  overflow: hidden;

  > [data-table-row] {
    border-radius: 0;
  }

  > [data-table-row]:not(:last-child) {
    border-bottom: 1px solid ${themeCssVariables.border.color.light};
  }

  > [data-table-row]:has([data-table-header])
    + [data-table-row]:not(:has([data-table-header])),
  > [data-table-row]:last-child:not(:has([data-table-header])) {
    margin: 0;
  }
`;

export const StyledMessageListHeader = styled(TableHeader)`
  background: ${themeCssVariables.background.tertiary};
  border-bottom: none;
  box-sizing: border-box;
  height: ${RECORD_TABLE_ROW_HEIGHT}px;
  padding: 0 ${themeCssVariables.spacing[3]};
`;

export const StyledMessageListCell = styled(TableCell)`
  box-sizing: border-box;
  height: ${RECORD_TABLE_ROW_HEIGHT}px;
  min-width: 0;
  overflow: hidden;
  padding: 0 ${themeCssVariables.spacing[3]};
  white-space: nowrap;
`;
