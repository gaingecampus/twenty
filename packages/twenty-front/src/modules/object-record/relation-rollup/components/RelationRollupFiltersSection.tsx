import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { useCreateEmptyRecordFilterFromFieldMetadataItem } from '@/object-record/record-filter/hooks/useCreateEmptyRecordFilterFromFieldMetadataItem';
import { type RecordFilter } from '@/object-record/record-filter/types/RecordFilter';
import { getRecordFilterOperands } from '@/object-record/record-filter/utils/getRecordFilterOperands';
import { DropdownMenuItemsContainer } from '@/ui/layout/dropdown/components/DropdownMenuItemsContainer';
import { DropdownMenuSeparator } from '@/ui/layout/dropdown/components/DropdownMenuSeparator';
import { DropdownMenuSearchInput } from '@/ui/layout/dropdown/components/DropdownMenuSearchInput';
import { useLingui } from '@lingui/react/macro';
import { useCallback, useMemo, useState } from 'react';
import { IconTrash } from 'twenty-ui/icon';
import { MenuItem, MenuItemSelect } from 'twenty-ui/navigation';

type RelationRollupFiltersSectionProps = {
  filterableTargetFields: FieldMetadataItem[];
  recordFilters: RecordFilter[];
  onRecordFiltersChange: (recordFilters: RecordFilter[]) => void;
};

export const RelationRollupFiltersSection = ({
  filterableTargetFields,
  recordFilters,
  onRecordFiltersChange,
}: RelationRollupFiltersSectionProps) => {
  const { t } = useLingui();
  const [filterSearchInput, setFilterSearchInput] = useState('');
  const { createEmptyRecordFilterFromFieldMetadataItem } =
    useCreateEmptyRecordFilterFromFieldMetadataItem();

  const handleAddFilter = useCallback(
    (fieldMetadataItem: FieldMetadataItem) => {
      const { newRecordFilter } =
        createEmptyRecordFilterFromFieldMetadataItem(fieldMetadataItem);

      onRecordFiltersChange([...recordFilters, newRecordFilter]);
      setFilterSearchInput('');
    },
    [
      createEmptyRecordFilterFromFieldMetadataItem,
      onRecordFiltersChange,
      recordFilters,
    ],
  );

  const handleRemoveFilter = useCallback(
    (recordFilterId: string) => {
      onRecordFiltersChange(
        recordFilters.filter((recordFilter) => recordFilter.id !== recordFilterId),
      );
    },
    [onRecordFiltersChange, recordFilters],
  );

  const handleUpdateFilter = useCallback(
    (
      recordFilterId: string,
      partialRecordFilter: Partial<
        Pick<RecordFilter, 'operand' | 'value' | 'fieldMetadataId'>
      >,
    ) => {
      onRecordFiltersChange(
        recordFilters.map((recordFilter) => {
          if (recordFilter.id !== recordFilterId) {
            return recordFilter;
          }

          const updatedRecordFilter = {
            ...recordFilter,
            ...partialRecordFilter,
          };

          if (
            partialRecordFilter.fieldMetadataId !== undefined &&
            partialRecordFilter.fieldMetadataId !== recordFilter.fieldMetadataId
          ) {
            const fieldMetadataItem = filterableTargetFields.find(
              (field) => field.id === partialRecordFilter.fieldMetadataId,
            );

            if (fieldMetadataItem !== undefined) {
              const { newRecordFilter } =
                createEmptyRecordFilterFromFieldMetadataItem(fieldMetadataItem);

              return {
                ...newRecordFilter,
                id: recordFilter.id,
              };
            }
          }

          return updatedRecordFilter;
        }),
      );
    },
    [
      createEmptyRecordFilterFromFieldMetadataItem,
      filterableTargetFields,
      onRecordFiltersChange,
      recordFilters,
    ],
  );

  const normalizedFilterSearch = filterSearchInput.trim().toLowerCase();

  const filteredFieldsToAdd = useMemo(() => {
    if (normalizedFilterSearch.length === 0) {
      return [];
    }

    return filterableTargetFields.filter((fieldMetadataItem) =>
      fieldMetadataItem.label.toLowerCase().includes(normalizedFilterSearch),
    );
  }, [filterableTargetFields, normalizedFilterSearch]);

  if (filterableTargetFields.length === 0 && recordFilters.length === 0) {
    return null;
  }

  return (
    <>
      {recordFilters.length > 0 && (
        <>
          <DropdownMenuSeparator />
          {recordFilters.map((recordFilter) => {
            const availableOperands = getRecordFilterOperands({
              filterType: recordFilter.type,
            });

            return (
              <DropdownMenuItemsContainer key={recordFilter.id} scrollable={false}>
                <MenuItemSelect
                  selected={false}
                  onClick={() => {}}
                  text={recordFilter.label}
                />
                {availableOperands.map((operand) => (
                  <MenuItemSelect
                    key={operand}
                    selected={recordFilter.operand === operand}
                    onClick={() =>
                      handleUpdateFilter(recordFilter.id, { operand })
                    }
                    text={operand}
                  />
                ))}
                <DropdownMenuSearchInput
                  autoFocus={false}
                  value={recordFilter.value}
                  placeholder={t`Value`}
                  onChange={(event) =>
                    handleUpdateFilter(recordFilter.id, {
                      value: event.target.value,
                    })
                  }
                />
                <MenuItem
                  LeftIcon={IconTrash}
                  onClick={() => handleRemoveFilter(recordFilter.id)}
                  text={t`Remove filter`}
                />
              </DropdownMenuItemsContainer>
            );
          })}
        </>
      )}
      {filterableTargetFields.length > 0 && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItemsContainer scrollable={false}>
            <MenuItem
              disabled
              accent="placeholder"
              text={t`Filters on related records (optional)`}
            />
            <DropdownMenuSearchInput
              autoFocus={false}
              value={filterSearchInput}
              placeholder={t`Search fields to filter`}
              onChange={(event) => setFilterSearchInput(event.target.value)}
            />
            {normalizedFilterSearch.length > 0 &&
              filteredFieldsToAdd.length === 0 && (
                <MenuItem disabled accent="placeholder" text={t`No results`} />
              )}
            {filteredFieldsToAdd.map((fieldMetadataItem) => (
              <MenuItemSelect
                key={fieldMetadataItem.id}
                selected={false}
                onClick={() => handleAddFilter(fieldMetadataItem)}
                text={fieldMetadataItem.label}
              />
            ))}
          </DropdownMenuItemsContainer>
        </>
      )}
    </>
  );
};
