import { useObjectOptionsForBoard } from '@/object-record/object-options-dropdown/hooks/useObjectOptionsForBoard';
import { ObjectOptionsDropdownContext } from '@/object-record/object-options-dropdown/states/contexts/ObjectOptionsDropdownContext';
import { useChangeRecordFieldVisibility } from '@/object-record/record-field/hooks/useChangeRecordFieldVisibility';
import { useTableColumnPickerItems } from '@/object-record/record-table/hooks/useTableColumnPickerItems';
import { DropdownMenuItemsContainer } from '@/ui/layout/dropdown/components/DropdownMenuItemsContainer';
import { ViewType } from '@/views/types/ViewType';
import { useContext } from 'react';
import { IconEye, IconSum, useIcons } from 'twenty-ui/icon';
import { MenuItem } from 'twenty-ui/navigation';

export const ViewFieldsHiddenDropdownSection = () => {
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

  const { hiddenViewFields, hiddenRegularFields } = useTableColumnPickerItems({
    objectMetadataItem,
    recordIndexId,
  });

  const { getIcon } = useIcons();

  const hasHiddenItems =
    hiddenViewFields.length > 0 || hiddenRegularFields.length > 0;

  return (
    <>
      <DropdownMenuItemsContainer>
        {hasHiddenItems &&
          hiddenViewFields.map((item) => (
            <MenuItem
              key={item.recordField.id}
              LeftIcon={
                item.isRollup ? IconSum : getIcon(item.fieldMetadataItem.icon)
              }
              onClick={() =>
                handleChangeFieldVisibility({
                  fieldMetadataId: item.fieldMetadataItem.id,
                  viewFieldId: item.recordField.id,
                  isVisible: true,
                })
              }
              iconButtons={[
                {
                  Icon: IconEye,
                  onClick: () =>
                    handleChangeFieldVisibility({
                      fieldMetadataId: item.fieldMetadataItem.id,
                      viewFieldId: item.recordField.id,
                      isVisible: true,
                    }),
                },
              ]}
              text={item.label}
            />
          ))}
        {hasHiddenItems &&
          hiddenRegularFields.map((fieldMetadataItem) => (
            <MenuItem
              key={fieldMetadataItem.id}
              LeftIcon={getIcon(fieldMetadataItem.icon)}
              iconButtons={[
                {
                  Icon: IconEye,
                  onClick: () =>
                    handleChangeFieldVisibility({
                      fieldMetadataId: fieldMetadataItem.id,
                      isVisible: true,
                    }),
                },
              ]}
              text={fieldMetadataItem.label}
            />
          ))}
      </DropdownMenuItemsContainer>
    </>
  );
};
