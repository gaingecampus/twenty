import { type RecordField } from '@/object-record/record-field/types/RecordField';
import { isFieldRelationRollup } from '@/object-record/record-field/ui/types/guards/isFieldRelationRollup';
import { getFieldDefinitionForRecordField } from '@/object-record/record-field/utils/getFieldDefinitionForRecordField';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { RelationRollupColumnPickerContent } from '@/object-record/relation-rollup/components/RelationRollupColumnPickerContent';
import { Dropdown } from '@/ui/layout/dropdown/components/Dropdown';
import { DropdownContent } from '@/ui/layout/dropdown/components/DropdownContent';
import { DropdownMenuHeader } from '@/ui/layout/dropdown/components/DropdownMenuHeader/DropdownMenuHeader';
import { DropdownMenuHeaderLeftComponent } from '@/ui/layout/dropdown/components/DropdownMenuHeader/internal/DropdownMenuHeaderLeftComponent';
import { useToggleScrollWrapper } from '@/ui/utilities/scroll/hooks/useToggleScrollWrapper';
import { useLingui } from '@lingui/react/macro';
import { useCallback, useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { IconChevronLeft } from 'twenty-ui/icon';
import { RecordTableColumnHead } from './RecordTableColumnHead';
import { RecordTableColumnHeadDropdownMenu } from './RecordTableColumnHeadDropdownMenu';

type ColumnHeadDropdownView = 'main' | 'editAggregateColumn';

type RecordTableColumnHeadWithDropdownProps = {
  recordField: RecordField;
  objectMetadataId: string;
};

export const RecordTableColumnHeadWithDropdown = ({
  objectMetadataId,
  recordField,
}: RecordTableColumnHeadWithDropdownProps) => {
  const { t } = useLingui();
  const [currentView, setCurrentView] =
    useState<ColumnHeadDropdownView>('main');

  const {
    fieldDefinitionByFieldMetadataItemId,
    fieldDefinitionByViewFieldId,
  } = useRecordIndexContextOrThrow();

  const fieldDefinition = getFieldDefinitionForRecordField({
    recordField,
    fieldDefinitionByViewFieldId,
    fieldDefinitionByFieldMetadataItemId,
  });

  const isRelationRollupColumn =
    isDefined(fieldDefinition) && isFieldRelationRollup(fieldDefinition);

  const { toggleScrollXWrapper, toggleScrollYWrapper } =
    useToggleScrollWrapper();

  const handleDropdownOpen = useCallback(() => {
    toggleScrollXWrapper(false);
    toggleScrollYWrapper(false);
  }, [toggleScrollXWrapper, toggleScrollYWrapper]);

  const handleDropdownClose = useCallback(() => {
    setCurrentView('main');
    toggleScrollXWrapper(true);
    toggleScrollYWrapper(true);
  }, [toggleScrollXWrapper, toggleScrollYWrapper]);

  const handleEditAggregateColumnSuccess = useCallback(() => {
    setCurrentView('main');
  }, []);

  const dropdownId = recordField.id + '-header';

  return (
    <Dropdown
      onOpen={handleDropdownOpen}
      onClose={handleDropdownClose}
      dropdownId={dropdownId}
      clickableComponent={<RecordTableColumnHead recordField={recordField} />}
      dropdownComponents={
        currentView === 'editAggregateColumn' ? (
          <DropdownContent>
            <DropdownMenuHeader
              StartComponent={
                <DropdownMenuHeaderLeftComponent
                  onClick={() => setCurrentView('main')}
                  Icon={IconChevronLeft}
                />
              }
            >
              {t`Edit aggregate column`}
            </DropdownMenuHeader>
            <RelationRollupColumnPickerContent
              existingViewFieldId={recordField.id}
              onSuccess={handleEditAggregateColumnSuccess}
            />
          </DropdownContent>
        ) : (
          <RecordTableColumnHeadDropdownMenu
            recordField={recordField}
            objectMetadataId={objectMetadataId}
            isRelationRollupColumn={isRelationRollupColumn}
            onEditAggregateColumn={() => setCurrentView('editAggregateColumn')}
          />
        )
      }
      dropdownOffset={{ x: -1 }}
      dropdownPlacement="bottom-start"
    />
  );
};
