import { useActiveFieldMetadataItems } from '@/object-metadata/hooks/useActiveFieldMetadataItems';
import { getLabelIdentifierFieldMetadataItem } from '@/object-metadata/utils/getLabelIdentifierFieldMetadataItem';
import { useObjectOptionsForBoard } from '@/object-record/object-options-dropdown/hooks/useObjectOptionsForBoard';
import { ObjectOptionsDropdownContext } from '@/object-record/object-options-dropdown/states/contexts/ObjectOptionsDropdownContext';
import { useChangeRecordFieldVisibility } from '@/object-record/record-field/hooks/useChangeRecordFieldVisibility';
import { useTableColumnPickerItems } from '@/object-record/record-table/hooks/useTableColumnPickerItems';
import { DropdownMenuItemsContainer } from '@/ui/layout/dropdown/components/DropdownMenuItemsContainer';
import { ViewType } from '@/views/types/ViewType';
import { useLingui } from '@lingui/react/macro';
import { useContext, useMemo } from 'react';
import { IconEye, IconEyeOff, IconSum, useIcons } from 'twenty-ui/icon';
import { MenuItem } from 'twenty-ui/navigation';

type ViewFieldsSearchDropdownSectionProps = {
  searchInput: string;
};

export const ViewFieldsSearchDropdownSection = ({
  searchInput,
}: ViewFieldsSearchDropdownSectionProps) => {
  const { t } = useLingui();
  const { getIcon } = useIcons();

  const { viewType, objectMetadataItem, recordIndexId } = useContext(
    ObjectOptionsDropdownContext,
  );

  const { changeRecordFieldVisibility } =
    useChangeRecordFieldVisibility(recordIndexId);

  const { handleBoardFieldVisibilityChange } = useObjectOptionsForBoard({
    objectNameSingular: objectMetadataItem.nameSingular,
    recordBoardId: recordIndexId,
    viewBarId: recordIndexId,
  });

  const handleChangeFieldVisibility =
    viewType === ViewType.KANBAN
      ? handleBoardFieldVisibilityChange
      : changeRecordFieldVisibility;

  const {
    allRollupViewFields,
    isRegularColumnVisible,
  } = useTableColumnPickerItems({
    objectMetadataItem,
    recordIndexId,
  });

  const { activeFieldMetadataItems } = useActiveFieldMetadataItems({
    objectMetadataItem,
  });

  const fieldMetadataItemLabelIdentifier =
    getLabelIdentifierFieldMetadataItem(objectMetadataItem);

  const normalizedSearch = searchInput.toLowerCase();

  const filteredRegularFields = activeFieldMetadataItems.filter(
    (fieldMetadataItem) =>
      fieldMetadataItem.label.toLowerCase().includes(normalizedSearch),
  );

  const filteredRollupFields = allRollupViewFields.filter((item) =>
    item.label.toLowerCase().includes(normalizedSearch),
  );

  const searchResultItems = useMemo(() => {
    const regularItems = filteredRegularFields.map((fieldMetadataItem) => ({
      key: `regular-${fieldMetadataItem.id}`,
      label: fieldMetadataItem.label,
      isVisible: isRegularColumnVisible(fieldMetadataItem.id),
      isLabelIdentifier:
        fieldMetadataItem.id === fieldMetadataItemLabelIdentifier?.id,
      LeftIcon: getIcon(fieldMetadataItem.icon),
      onToggle: () =>
        handleChangeFieldVisibility({
          fieldMetadataId: fieldMetadataItem.id,
          isVisible: !isRegularColumnVisible(fieldMetadataItem.id),
        }),
    }));

    const rollupItems = filteredRollupFields.map((item) => ({
      key: `rollup-${item.recordField.id}`,
      label: item.label,
      isVisible: item.recordField.isVisible,
      isLabelIdentifier: false,
      LeftIcon: IconSum,
      onToggle: () =>
        handleChangeFieldVisibility({
          fieldMetadataId: item.fieldMetadataItem.id,
          viewFieldId: item.recordField.id,
          isVisible: !item.recordField.isVisible,
        }),
    }));

    return [...rollupItems, ...regularItems];
  }, [
    fieldMetadataItemLabelIdentifier?.id,
    filteredRegularFields,
    filteredRollupFields,
    getIcon,
    handleChangeFieldVisibility,
    isRegularColumnVisible,
  ]);

  return (
    <DropdownMenuItemsContainer>
      {searchResultItems.length > 0 ? (
        searchResultItems.map((item) => (
          <MenuItem
            key={item.key}
            LeftIcon={item.LeftIcon}
            iconButtons={
              item.isLabelIdentifier
                ? undefined
                : [
                    {
                      Icon: item.isVisible ? IconEyeOff : IconEye,
                      onClick: item.onToggle,
                    },
                  ]
            }
            text={item.label}
          />
        ))
      ) : (
        <MenuItem disabled text={t`No results`} accent="placeholder" />
      )}
    </DropdownMenuItemsContainer>
  );
};
