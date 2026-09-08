import { DropdownMenuSearchInput } from '@/ui/layout/dropdown/components/DropdownMenuSearchInput';
import React from 'react';

import { objectFilterDropdownSearchInputComponentState } from '@/object-record/object-filter-dropdown/states/objectFilterDropdownSearchInputComponentState';

import { DropdownMenuSeparator } from '@/ui/layout/dropdown/components/DropdownMenuSeparator';
import { SelectableList } from '@/ui/layout/selectable-list/components/SelectableList';

import { FILTER_FIELD_LIST_ID } from '@/object-record/object-filter-dropdown/constants/FilterFieldListId';
import { useFilterDropdownSelectableFieldMetadataItems } from '@/object-record/object-filter-dropdown/hooks/useFilterDropdownSelectableFieldMetadataItems';
import { DropdownContent } from '@/ui/layout/dropdown/components/DropdownContent';
import { DropdownMenuSectionLabel } from '@/ui/layout/dropdown/components/DropdownMenuSectionLabel';
import { useAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentState';
import { ViewBarFilterDropdownBottomMenu } from '@/views/components/ViewBarFilterDropdownBottomMenu';
import { ViewBarFilterDropdownFieldSelectMenuItem } from '@/views/components/ViewBarFilterDropdownFieldSelectMenuItem';

import { DropdownMenuHeader } from '@/ui/layout/dropdown/components/DropdownMenuHeader/DropdownMenuHeader';
import { DropdownMenuHeaderLeftComponent } from '@/ui/layout/dropdown/components/DropdownMenuHeader/internal/DropdownMenuHeaderLeftComponent';
import { DropdownMenuItemsContainer } from '@/ui/layout/dropdown/components/DropdownMenuItemsContainer';
import { GenericDropdownContentWidth } from '@/ui/layout/dropdown/constants/GenericDropdownContentWidth';
import { useCloseDropdown } from '@/ui/layout/dropdown/hooks/useCloseDropdown';
import { ScrollWrapper } from '@/ui/utilities/scroll/components/ScrollWrapper';
import { VIEW_BAR_FILTER_BOTTOM_MENU_ITEM_IDS } from '@/views/constants/ViewBarFilterBottomMenuItemIds';
import { ViewBarFilterDropdownIds } from '@/views/constants/ViewBarFilterDropdownIds';
import { useLingui } from '@lingui/react/macro';
import { IconX } from 'twenty-ui/icon';

export const ViewBarFilterDropdownFieldSelectMenu = () => {
  const [objectFilterDropdownSearchInput, setObjectFilterDropdownSearchInput] =
    useAtomComponentState(objectFilterDropdownSearchInputComponentState);

  const {
    selectableHiddenFieldMetadataItems,
    selectableVisibleFieldMetadataItems,
  } = useFilterDropdownSelectableFieldMetadataItems();

  const { closeDropdown } = useCloseDropdown();

  const selectableFieldMetadataItemIds = [
    ...selectableVisibleFieldMetadataItems.map(
      (fieldMetadataItem) => fieldMetadataItem.id,
    ),
    ...selectableHiddenFieldMetadataItems.map(
      (fieldMetadataItem) => fieldMetadataItem.id,
    ),
    VIEW_BAR_FILTER_BOTTOM_MENU_ITEM_IDS.SEARCH,
    VIEW_BAR_FILTER_BOTTOM_MENU_ITEM_IDS.ADVANCED_FILTER,
  ];

  const shouldShowSeparator =
    selectableVisibleFieldMetadataItems.length > 0 &&
    selectableHiddenFieldMetadataItems.length > 0;

  const hasSelectableItems =
    selectableVisibleFieldMetadataItems.length > 0 ||
    selectableHiddenFieldMetadataItems.length > 0;

  const shouldShowVisibleFields =
    selectableVisibleFieldMetadataItems.length > 0;
  const shouldShowHiddenFields = selectableHiddenFieldMetadataItems.length > 0;

  const { t } = useLingui();

  return (
    <DropdownContent widthInPixels={GenericDropdownContentWidth.ExtraLarge}>
      <DropdownMenuHeader
        StartComponent={
          <DropdownMenuHeaderLeftComponent
            onClick={() => closeDropdown()}
            Icon={IconX}
          />
        }
      >
        {t`Filter`}
      </DropdownMenuHeader>
      <ScrollWrapper componentInstanceId="view-bar-dropdown-filter-field-select-menu">
        <DropdownMenuSearchInput
          value={objectFilterDropdownSearchInput}
          autoFocus
          placeholder={t`Search fields`}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            setObjectFilterDropdownSearchInput(event.target.value)
          }
        />
        <SelectableList
          selectableItemIdArray={selectableFieldMetadataItemIds}
          selectableListInstanceId={FILTER_FIELD_LIST_ID}
          focusId={ViewBarFilterDropdownIds.MAIN}
        >
          {shouldShowVisibleFields && (
            <>
              <DropdownMenuSectionLabel label={t`Visible fields`} />
              <DropdownMenuItemsContainer scrollable={false}>
                {selectableVisibleFieldMetadataItems.map(
                  (visibleFieldMetadataItem) => (
                    <ViewBarFilterDropdownFieldSelectMenuItem
                      key={visibleFieldMetadataItem.id}
                      fieldMetadataItemToSelect={visibleFieldMetadataItem}
                    />
                  ),
                )}
              </DropdownMenuItemsContainer>
            </>
          )}
          {shouldShowSeparator && <DropdownMenuSeparator />}
          {shouldShowHiddenFields && (
            <>
              <DropdownMenuSectionLabel label={t`Hidden fields`} />
              <DropdownMenuItemsContainer scrollable={false}>
                {selectableHiddenFieldMetadataItems.map(
                  (hiddenFieldMetadataItem) => (
                    <ViewBarFilterDropdownFieldSelectMenuItem
                      key={hiddenFieldMetadataItem.id}
                      fieldMetadataItemToSelect={hiddenFieldMetadataItem}
                    />
                  ),
                )}
              </DropdownMenuItemsContainer>
            </>
          )}
          {hasSelectableItems && <DropdownMenuSeparator />}
          <ViewBarFilterDropdownBottomMenu />
        </SelectableList>
      </ScrollWrapper>
    </DropdownContent>
  );
};
