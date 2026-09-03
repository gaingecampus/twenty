import { RECORD_INDEX_PAGE_SIZE_DROPDOWN_ID } from '@/object-record/record-index/constants/RecordIndexPageSizeDropdownId';
import { RECORD_INDEX_PAGE_SIZE_OPTIONS } from '@/object-record/record-index/constants/RecordIndexPageSizeOptions';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { useIsRecordIndexPaginationEnabled } from '@/object-record/record-index/hooks/useIsRecordIndexPaginationEnabled';
import { recordIndexCurrentPageComponentState } from '@/object-record/record-index/states/recordIndexCurrentPageComponentState';
import { recordIndexPageSizeState } from '@/object-record/record-index/states/recordIndexPageSizeState';
import { isRecordIndexPageSize } from '@/object-record/record-index/utils/isRecordIndexPageSize';
import { Dropdown } from '@/ui/layout/dropdown/components/Dropdown';
import { DropdownContent } from '@/ui/layout/dropdown/components/DropdownContent';
import { DropdownMenuItemsContainer } from '@/ui/layout/dropdown/components/DropdownMenuItemsContainer';
import { StyledHeaderDropdownButton } from '@/ui/layout/dropdown/components/StyledHeaderDropdownButton';
import { DROPDOWN_OFFSET_Y } from '@/ui/layout/dropdown/constants/DropdownOffsetY';
import { GenericDropdownContentWidth } from '@/ui/layout/dropdown/constants/GenericDropdownContentWidth';
import { useCloseDropdown } from '@/ui/layout/dropdown/hooks/useCloseDropdown';
import { isDropdownOpenComponentState } from '@/ui/layout/dropdown/states/isDropdownOpenComponentState';
import { useAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentState';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { t } from '@lingui/core/macro';
import { MenuItemSelect } from 'twenty-ui/navigation';

export const RecordIndexPageSizeDropdown = () => {
  const isRecordIndexPaginationEnabled = useIsRecordIndexPaginationEnabled();
  const { recordIndexId } = useRecordIndexContextOrThrow();
  const { closeDropdown } = useCloseDropdown();

  const [recordIndexPageSize, setRecordIndexPageSize] = useAtomState(
    recordIndexPageSizeState,
  );

  const [, setRecordIndexCurrentPage] = useAtomComponentState(
    recordIndexCurrentPageComponentState,
    recordIndexId,
  );

  const isDropdownOpen = useAtomComponentStateValue(
    isDropdownOpenComponentState,
    RECORD_INDEX_PAGE_SIZE_DROPDOWN_ID,
  );

  if (!isRecordIndexPaginationEnabled) {
    return null;
  }

  const handlePageSizeChange = (newPageSize: number) => {
    if (!isRecordIndexPageSize(newPageSize)) {
      return;
    }

    setRecordIndexPageSize(newPageSize);
    setRecordIndexCurrentPage(1);
    closeDropdown(RECORD_INDEX_PAGE_SIZE_DROPDOWN_ID);
  };

  const getPageSizeLabel = (pageSize: number) => t`${pageSize} per page`;

  return (
    <Dropdown
      dropdownId={RECORD_INDEX_PAGE_SIZE_DROPDOWN_ID}
      dropdownOffset={{ y: DROPDOWN_OFFSET_Y }}
      clickableComponent={
        <StyledHeaderDropdownButton isUnfolded={isDropdownOpen}>
          {getPageSizeLabel(recordIndexPageSize)}
        </StyledHeaderDropdownButton>
      }
      dropdownComponents={
        <DropdownContent widthInPixels={GenericDropdownContentWidth.Narrow}>
          <DropdownMenuItemsContainer>
            {RECORD_INDEX_PAGE_SIZE_OPTIONS.map((recordIndexPageSizeOption) => (
              <MenuItemSelect
                key={recordIndexPageSizeOption}
                selected={recordIndexPageSizeOption === recordIndexPageSize}
                text={getPageSizeLabel(recordIndexPageSizeOption)}
                onClick={() => handlePageSizeChange(recordIndexPageSizeOption)}
              />
            ))}
          </DropdownMenuItemsContainer>
        </DropdownContent>
      }
    />
  );
};
