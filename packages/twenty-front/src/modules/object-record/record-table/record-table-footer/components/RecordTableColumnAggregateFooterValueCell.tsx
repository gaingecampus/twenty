import { hasRecordGroupsComponentSelector } from '@/object-record/record-group/states/selectors/hasRecordGroupsComponentSelector';
import { RECORD_TABLE_ROW_HEIGHT } from '@/object-record/record-table/constants/RecordTableRowHeight';

import { RecordTableColumnAggregateFooterCellContext } from '@/object-record/record-table/record-table-footer/components/RecordTableColumnAggregateFooterCellContext';
import { RecordTableColumnAggregateFooterValue } from '@/object-record/record-table/record-table-footer/components/RecordTableColumnAggregateFooterValue';
import { hasAggregateOperationForViewFieldFamilySelector } from '@/object-record/record-table/record-table-footer/states/hasAggregateOperationForViewFieldFamilySelector';
import { isDropdownOpenComponentState } from '@/ui/layout/dropdown/states/isDropdownOpenComponentState';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { useAtomComponentSelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentSelectorValue';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { styled } from '@linaria/react';
import { useContext, useState } from 'react';
import { IconChevronDown } from 'twenty-ui/icon';
import { ThemeContext, themeCssVariables } from 'twenty-ui/theme-constants';

const StyledHoverWrapper = styled.div`
  height: 100%;
  width: 100%;
`;

const StyledCell = styled.div<{ isUnfolded: boolean }>`
  align-items: center;
  background: ${({ isUnfolded }) =>
    isUnfolded ? themeCssVariables.background.tertiary : 'none'};
  box-sizing: border-box;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  flex-grow: 1;
  flex-shrink: 0;
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: ${themeCssVariables.spacing[1]};
  height: ${RECORD_TABLE_ROW_HEIGHT}px;
  justify-content: space-between;
  max-width: 100%;
  min-width: 0;
  width: 100%;
`;

const StyledIconContainer = styled.div`
  align-items: center;
  display: flex;
  flex-grow: 0;
  flex-shrink: 0;
  height: 100%;
  justify-content: center;
`;

export const RecordTableColumnAggregateFooterValueCell = ({
  dropdownId,
  isFirstCell,
}: {
  dropdownId: string;
  isFirstCell: boolean;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const isDropdownOpen = useAtomComponentStateValue(
    isDropdownOpenComponentState,
    dropdownId,
  );

  const { theme } = useContext(ThemeContext);
  const { viewFieldId, fieldMetadataId } = useContext(
    RecordTableColumnAggregateFooterCellContext,
  );

  const hasAggregateOperationForViewField = useAtomFamilySelectorValue(
    hasAggregateOperationForViewFieldFamilySelector,
    { viewFieldId },
  );

  const hasRecordGroups = useAtomComponentSelectorValue(
    hasRecordGroupsComponentSelector,
  );

  return (
    <StyledHoverWrapper
      onMouseEnter={() => {
        setIsHovered(true);
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <StyledCell isUnfolded={isDropdownOpen}>
        {isHovered ||
        isDropdownOpen ||
        hasAggregateOperationForViewField ||
        (isFirstCell && !hasRecordGroups) ? (
          <>
            <RecordTableColumnAggregateFooterValue
              fieldMetadataId={fieldMetadataId}
              dropdownId={dropdownId}
            />
            {!hasAggregateOperationForViewField && (
              <StyledIconContainer>
                <IconChevronDown fontWeight="light" size={theme.icon.size.sm} />
              </StyledIconContainer>
            )}
          </>
        ) : (
          <></>
        )}
      </StyledCell>
    </StyledHoverWrapper>
  );
};
