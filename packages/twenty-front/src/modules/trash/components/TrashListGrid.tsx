import { TRASH_TABLE_GRID_TEMPLATE } from '@/trash/constants/TrashTableGridTemplate';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

export const StyledTrashListGrid = styled.div`
  align-items: center;
  box-sizing: border-box;
  column-gap: ${themeCssVariables.spacing[3]};
  display: grid;
  grid-template-columns: ${TRASH_TABLE_GRID_TEMPLATE};
  padding: ${themeCssVariables.spacing[2]}
    ${themeCssVariables.table.horizontalCellPadding};
  width: 100%;
`;
