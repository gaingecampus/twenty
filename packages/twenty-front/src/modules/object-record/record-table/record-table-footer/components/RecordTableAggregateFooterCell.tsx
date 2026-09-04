import { styled } from '@linaria/react';
import { useContext } from 'react';
import { MOBILE_VIEWPORT, themeCssVariables } from 'twenty-ui/theme-constants';

import {
  RECORD_TABLE_CHECKBOX_WIDTH_CSS_VAR,
  RECORD_TABLE_DRAG_DROP_WIDTH_CSS_VAR,
} from '@/object-record/record-table/components/RecordTableStyleWrapper';
import { RECORD_TABLE_FOOTER_HEIGHT } from '@/object-record/record-table/constants/RecordTableFooterHeight';
import { RECORD_TABLE_HORIZONTAL_SCROLLBAR_HEIGHT } from '@/object-record/record-table/constants/RecordTableHorizontalScrollbarHeight';
import { RECORD_TABLE_LABEL_IDENTIFIER_COLUMN_WIDTH_ON_MOBILE } from '@/object-record/record-table/constants/RecordTableLabelIdentifierColumnWidthOnMobile';
import { TABLE_Z_INDEX } from '@/object-record/record-table/constants/TableZIndex';
import { useRecordTableContextOrThrow } from '@/object-record/record-table/contexts/RecordTableContext';
import { RecordTableColumnAggregateFooterCellContext } from '@/object-record/record-table/record-table-footer/components/RecordTableColumnAggregateFooterCellContext';
import { RecordTableColumnAggregateFooterValue } from '@/object-record/record-table/record-table-footer/components/RecordTableColumnAggregateFooterValue';
import { RecordTableColumnFooterWithDropdown } from '@/object-record/record-table/record-table-footer/components/RecordTableColumnAggregateFooterWithDropdown';
import { hasAggregateOperationForViewFieldFamilySelector } from '@/object-record/record-table/record-table-footer/states/hasAggregateOperationForViewFieldFamilySelector';
import { isRecordTableColumnResizableComponentState } from '@/object-record/record-table/states/isRecordTableColumnResizableComponentState';
import { getRecordTableColumnFieldWidthClassName } from '@/object-record/record-table/utils/getRecordTableColumnFieldWidthClassName';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { cx } from '@linaria/core';
import { findByProperty, isDefined } from 'twenty-shared/utils';

const StyledColumnFooterCell = styled.div<{
  columnWidth: number;
  isFirstCell: boolean;
  isReadOnly: boolean;
}>`
  background-color: ${themeCssVariables.background.primary};
  border-right: solid 1px ${themeCssVariables.background.primary};

  bottom: 0;

  box-sizing: border-box;
  color: ${themeCssVariables.font.color.tertiary};

  cursor: ${({ isReadOnly }) => (isReadOnly ? 'default' : 'pointer')};
  display: flex;
  height: ${RECORD_TABLE_FOOTER_HEIGHT}px;

  left: ${({ isFirstCell }) =>
    isFirstCell
      ? `calc(var(${RECORD_TABLE_DRAG_DROP_WIDTH_CSS_VAR}) + var(${RECORD_TABLE_CHECKBOX_WIDTH_CSS_VAR}))`
      : 'auto'};

  &:hover {
    background: ${({ isReadOnly }) =>
      isReadOnly
        ? themeCssVariables.background.primary
        : themeCssVariables.background.secondary};
  }

  min-width: ${({ columnWidth }) => columnWidth}px;

  overflow: hidden;

  padding: 0;

  position: sticky;
  text-align: left;

  width: ${({ columnWidth }) => columnWidth}px;

  z-index: ${({ isFirstCell }) =>
    isFirstCell
      ? TABLE_Z_INDEX.footer.stickyColumn
      : TABLE_Z_INDEX.footer.default};

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    max-width: ${({ isFirstCell }) =>
      isFirstCell
        ? `${RECORD_TABLE_LABEL_IDENTIFIER_COLUMN_WIDTH_ON_MOBILE}px`
        : 'none'};
    min-width: ${({ isFirstCell }) =>
      isFirstCell
        ? `${RECORD_TABLE_LABEL_IDENTIFIER_COLUMN_WIDTH_ON_MOBILE}px`
        : '0'};
    width: ${({ isFirstCell }) =>
      isFirstCell
        ? `${RECORD_TABLE_LABEL_IDENTIFIER_COLUMN_WIDTH_ON_MOBILE}px`
        : 'auto'};
  }
`;

const StyledColumnFootContainer = styled.div`
  box-sizing: border-box;
  height: 100%;
  padding-bottom: ${RECORD_TABLE_HORIZONTAL_SCROLLBAR_HEIGHT}px;
  padding-left: ${themeCssVariables.table.horizontalCellPadding};
  padding-right: ${themeCssVariables.table.horizontalCellPadding};
  position: relative;
  width: 100%;
  z-index: 1;
`;

export const RecordTableAggregateFooterCell = ({
  columnIndex,
  currentRecordGroupId,
}: {
  columnIndex: number;
  currentRecordGroupId?: string;
}) => {
  const { visibleRecordFields } = useRecordTableContextOrThrow();

  const { fieldMetadataId, viewFieldId } = useContext(
    RecordTableColumnAggregateFooterCellContext,
  );

  const hasAggregateOperationForViewField = useAtomFamilySelectorValue(
    hasAggregateOperationForViewFieldFamilySelector,
    { viewFieldId },
  );

  const isRecordTableColumnResizable = useAtomComponentStateValue(
    isRecordTableColumnResizableComponentState,
  );

  const isFooterReadOnly = !isRecordTableColumnResizable;

  const recordField = visibleRecordFields.find(
    findByProperty('fieldMetadataItemId', fieldMetadataId),
  );

  const isFirstCell = columnIndex === 0;

  if (!isDefined(recordField)) {
    return null;
  }

  return (
    <StyledColumnFooterCell
      columnWidth={recordField.size + 1}
      isFirstCell={isFirstCell}
      isReadOnly={isFooterReadOnly}
      className={cx(
        'footer-cell',
        getRecordTableColumnFieldWidthClassName(columnIndex),
      )}
    >
      <StyledColumnFootContainer>
        {isFooterReadOnly ? (
          hasAggregateOperationForViewField ? (
            <RecordTableColumnAggregateFooterValue
              fieldMetadataId={fieldMetadataId}
              dropdownId={`${fieldMetadataId}-footer-readonly`}
            />
          ) : null
        ) : (
          <RecordTableColumnFooterWithDropdown
            currentRecordGroupId={currentRecordGroupId}
            isFirstCell={isFirstCell}
          />
        )}
      </StyledColumnFootContainer>
    </StyledColumnFooterCell>
  );
};
