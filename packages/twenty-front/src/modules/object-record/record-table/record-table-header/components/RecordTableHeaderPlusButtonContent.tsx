import { useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useChangeRecordFieldVisibility } from '@/object-record/record-field/hooks/useChangeRecordFieldVisibility';
import { useRecordTableContextOrThrow } from '@/object-record/record-table/contexts/RecordTableContext';
import { useTableColumnPickerItems } from '@/object-record/record-table/hooks/useTableColumnPickerItems';
import { RelationRollupColumnPickerContent } from '@/object-record/relation-rollup/components/RelationRollupColumnPickerContent';
import { DropdownContent } from '@/ui/layout/dropdown/components/DropdownContent';
import { DropdownMenuHeader } from '@/ui/layout/dropdown/components/DropdownMenuHeader/DropdownMenuHeader';
import { DropdownMenuHeaderLeftComponent } from '@/ui/layout/dropdown/components/DropdownMenuHeader/internal/DropdownMenuHeaderLeftComponent';
import { DropdownMenuItemsContainer } from '@/ui/layout/dropdown/components/DropdownMenuItemsContainer';
import { DropdownMenuSearchInput } from '@/ui/layout/dropdown/components/DropdownMenuSearchInput';
import { DropdownMenuSeparator } from '@/ui/layout/dropdown/components/DropdownMenuSeparator';
import { useCloseDropdown } from '@/ui/layout/dropdown/hooks/useCloseDropdown';
import { navigationMemorizedUrlState } from '@/ui/navigation/states/navigationMemorizedUrlState';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { useLingui } from '@lingui/react/macro';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import { IconChevronLeft, IconSettings, IconSum, useIcons } from 'twenty-ui/icon';
import { MenuItem, MenuItemNavigate, UndecoratedLink } from 'twenty-ui/navigation';

type PlusButtonView = 'main' | 'addAggregateColumn';

export const RecordTableHeaderPlusButtonContent = () => {
  const { t } = useLingui();
  const [searchInput, setSearchInput] = useState('');
  const [currentView, setCurrentView] = useState<PlusButtonView>('main');

  const { objectMetadataItem, recordTableId } = useRecordTableContextOrThrow();

  const { closeDropdown } = useCloseDropdown();

  const { getIcon } = useIcons();

  const { changeRecordFieldVisibility } =
    useChangeRecordFieldVisibility(recordTableId);

  const {
    addableRegularFields,
    hiddenRollupViewFields,
    hiddenViewFields,
  } = useTableColumnPickerItems({
    objectMetadataItem,
    recordIndexId: recordTableId,
  });

  const handleAddRegularColumn = useCallback(
    async (fieldMetadataId: string) => {
      closeDropdown();
      await changeRecordFieldVisibility({ fieldMetadataId, isVisible: true });
    },
    [changeRecordFieldVisibility, closeDropdown],
  );

  const handleShowHiddenViewField = useCallback(
    async (fieldMetadataId: string, viewFieldId: string) => {
      closeDropdown();
      await changeRecordFieldVisibility({
        fieldMetadataId,
        viewFieldId,
        isVisible: true,
      });
    },
    [changeRecordFieldVisibility, closeDropdown],
  );

  const location = useLocation();
  const setNavigationMemorizedUrl = useSetAtomState(
    navigationMemorizedUrlState,
  );

  const normalizedSearch = searchInput.toLowerCase();

  const filteredHiddenRollupViewFields = hiddenRollupViewFields.filter(
    (item) => item.label.toLowerCase().includes(normalizedSearch),
  );

  const filteredHiddenRegularViewFields = hiddenViewFields
    .filter((item) => !item.isRollup)
    .filter((item) => item.label.toLowerCase().includes(normalizedSearch));

  const filteredAddableRegularFields = addableRegularFields.filter(
    (fieldMetadataItem) =>
      fieldMetadataItem.label.toLowerCase().includes(normalizedSearch),
  );

  const hasSearchResults =
    filteredHiddenRollupViewFields.length > 0 ||
    filteredHiddenRegularViewFields.length > 0 ||
    filteredAddableRegularFields.length > 0;

  const hasAvailableItems =
    hiddenRollupViewFields.length > 0 ||
    hiddenViewFields.some((item) => !item.isRollup) ||
    addableRegularFields.length > 0;

  const handleAggregateColumnSuccess = useCallback(() => {
    closeDropdown();
    setCurrentView('main');
  }, [closeDropdown]);

  if (currentView === 'addAggregateColumn') {
    return (
      <DropdownContent>
        <DropdownMenuHeader
          StartComponent={
            <DropdownMenuHeaderLeftComponent
              onClick={() => setCurrentView('main')}
              Icon={IconChevronLeft}
            />
          }
        >
          {t`Add aggregate column`}
        </DropdownMenuHeader>
        <RelationRollupColumnPickerContent
          onSuccess={handleAggregateColumnSuccess}
        />
      </DropdownContent>
    );
  }

  return (
    <DropdownContent>
      {hasAvailableItems && (
        <>
          <DropdownMenuSearchInput
            autoFocus
            value={searchInput}
            placeholder={t`Search fields`}
            onChange={(event) => setSearchInput(event.target.value)}
          />
          <DropdownMenuSeparator />
        </>
      )}
      <DropdownMenuItemsContainer>
        {hasSearchResults ? (
          <>
            {filteredHiddenRollupViewFields.map((item) => (
              <MenuItem
                key={item.recordField.id}
                onClick={() =>
                  handleShowHiddenViewField(
                    item.fieldMetadataItem.id,
                    item.recordField.id,
                  )
                }
                LeftIcon={IconSum}
                text={item.label}
              />
            ))}
            {filteredHiddenRegularViewFields.map((item) => (
              <MenuItem
                key={item.recordField.id}
                onClick={() =>
                  handleShowHiddenViewField(
                    item.fieldMetadataItem.id,
                    item.recordField.id,
                  )
                }
                LeftIcon={getIcon(item.fieldMetadataItem.icon)}
                text={item.label}
              />
            ))}
            {filteredAddableRegularFields.map((fieldMetadataItem) => (
              <MenuItem
                key={fieldMetadataItem.id}
                onClick={() => handleAddRegularColumn(fieldMetadataItem.id)}
                LeftIcon={getIcon(fieldMetadataItem.icon)}
                text={fieldMetadataItem.label}
              />
            ))}
          </>
        ) : (
          <MenuItem
            disabled
            accent="placeholder"
            text={
              hasAvailableItems
                ? t`No results`
                : t`All fields are already visible`
            }
          />
        )}
      </DropdownMenuItemsContainer>
      <DropdownMenuSeparator />
      <DropdownMenuItemsContainer scrollable={false}>
        <MenuItemNavigate
          onClick={() => setCurrentView('addAggregateColumn')}
          LeftIcon={IconSum}
          text={t`Add aggregate column`}
        />
      </DropdownMenuItemsContainer>
      <DropdownMenuSeparator />
      <DropdownMenuItemsContainer scrollable={false}>
        <UndecoratedLink
          fullWidth
          to={getSettingsPath(SettingsPath.ObjectDetail, {
            objectNamePlural: objectMetadataItem.namePlural,
          })}
          onClick={() => {
            setNavigationMemorizedUrl(location.pathname + location.search);
          }}
        >
          <MenuItem LeftIcon={IconSettings} text={t`Customize fields`} />
        </UndecoratedLink>
      </DropdownMenuItemsContainer>
    </DropdownContent>
  );
};
