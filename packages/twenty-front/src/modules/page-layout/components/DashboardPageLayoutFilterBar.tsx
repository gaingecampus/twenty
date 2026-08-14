import { useFieldMetadataItemById } from '@/object-metadata/hooks/useFieldMetadataItemById';
import { type RecordFilter } from '@/object-record/record-filter/types/RecordFilter';
import { DashboardPageLayoutFilterChip } from '@/page-layout/components/DashboardPageLayoutFilterChip';
import { DashboardPageLayoutFilterEditor } from '@/page-layout/components/DashboardPageLayoutFilterEditor';
import { useCurrentPageLayoutOrThrow } from '@/page-layout/hooks/useCurrentPageLayoutOrThrow';
import { useDashboardPageLayoutFilters } from '@/page-layout/hooks/useDashboardPageLayoutFilters';
import { useDashboardPageLayoutSourceObjectMetadataItems } from '@/page-layout/hooks/useDashboardPageLayoutSourceObjectMetadataItems';
import { getDashboardPageLayoutFiltersInstanceId } from '@/page-layout/utils/getDashboardPageLayoutFiltersInstanceId';
import { dropChartRecordFiltersWithDeletedFields } from '@/side-panel/pages/page-layout/utils/dropChartRecordFiltersWithDeletedFields';
import { StyledHeaderDropdownButton } from '@/ui/layout/dropdown/components/StyledHeaderDropdownButton';
import { styled } from '@linaria/react';
import { Trans } from '@lingui/react/macro';
import { useMemo, useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledFilterBar = styled.div`
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
`;

const StyledChipRow = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[1]};
  min-height: 32px;
`;

const DashboardPageLayoutFilterChipWithObject = ({
  recordFilter,
  shouldShowObjectLabel,
  onRemove,
  onClick,
}: {
  recordFilter: RecordFilter;
  shouldShowObjectLabel: boolean;
  onRemove: () => void;
  onClick: (objectMetadataItemId: string) => void;
}) => {
  const { objectMetadataItem } = useFieldMetadataItemById(
    recordFilter.fieldMetadataId,
  );

  return (
    <DashboardPageLayoutFilterChip
      recordFilter={recordFilter}
      objectLabelSingular={objectMetadataItem?.labelSingular}
      shouldShowObjectLabel={shouldShowObjectLabel}
      onRemove={onRemove}
      onClick={() => {
        if (isDefined(objectMetadataItem)) {
          onClick(objectMetadataItem.id);
        }
      }}
    />
  );
};

export const DashboardPageLayoutFilterBar = () => {
  const { currentPageLayout } = useCurrentPageLayoutOrThrow();
  const sourceObjectMetadataItems =
    useDashboardPageLayoutSourceObjectMetadataItems();
  const { dashboardPageLayoutFilters, setDashboardPageLayoutFilters } =
    useDashboardPageLayoutFilters();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedObjectMetadataItemId, setSelectedObjectMetadataItemId] =
    useState<string | undefined>(sourceObjectMetadataItems[0]?.id);
  const [editorResetCount, setEditorResetCount] = useState(0);

  const recordFilters = dashboardPageLayoutFilters.recordFilters ?? [];

  const selectedObjectMetadataItem =
    sourceObjectMetadataItems.find(
      (objectMetadataItem) =>
        objectMetadataItem.id === selectedObjectMetadataItemId,
    ) ?? sourceObjectMetadataItems[0];

  const shouldShowFilterBar =
    sourceObjectMetadataItems.length > 0 || recordFilters.length > 0;

  const allActiveFieldMetadataIds = useMemo(
    () =>
      new Set(
        sourceObjectMetadataItems.flatMap((objectMetadataItem) =>
          objectMetadataItem.fields
            .filter((fieldMetadataItem) => fieldMetadataItem.isActive)
            .map((fieldMetadataItem) => fieldMetadataItem.id),
        ),
      ),
    [sourceObjectMetadataItems],
  );

  if (!shouldShowFilterBar) {
    return null;
  }

  const handleRemoveRecordFilter = (recordFilterToRemove: RecordFilter) => {
    const remainingRecordFilters = recordFilters.filter((recordFilter) => {
      if (isDefined(recordFilterToRemove.id) && isDefined(recordFilter.id)) {
        return recordFilter.id !== recordFilterToRemove.id;
      }

      return (
        recordFilter.fieldMetadataId !== recordFilterToRemove.fieldMetadataId
      );
    });

    setDashboardPageLayoutFilters(
      dropChartRecordFiltersWithDeletedFields({
        chartFilters: {
          recordFilters: remainingRecordFilters,
          recordFilterGroups:
            dashboardPageLayoutFilters.recordFilterGroups ?? [],
        },
        validFieldMetadataIds:
          remainingRecordFilters.length > 0
            ? new Set(
                remainingRecordFilters.map(
                  (recordFilter) => recordFilter.fieldMetadataId,
                ),
              )
            : allActiveFieldMetadataIds,
      }),
    );

    setEditorResetCount((currentCount) => currentCount + 1);
  };

  const handleOpenEditorForObject = (objectMetadataItemId: string) => {
    setSelectedObjectMetadataItemId(objectMetadataItemId);
    setIsEditorOpen(true);
  };

  const instanceId = isDefined(selectedObjectMetadataItem)
    ? getDashboardPageLayoutFiltersInstanceId({
        pageLayoutId: currentPageLayout.id,
        objectMetadataItemId: selectedObjectMetadataItem.id,
      })
    : undefined;

  return (
    <StyledFilterBar>
      <StyledChipRow>
        {recordFilters.map((recordFilter, recordFilterIndex) => (
          <DashboardPageLayoutFilterChipWithObject
            key={
              recordFilter.id ??
              `${recordFilter.fieldMetadataId}-${recordFilterIndex}`
            }
            recordFilter={recordFilter}
            shouldShowObjectLabel={sourceObjectMetadataItems.length > 1}
            onRemove={() => handleRemoveRecordFilter(recordFilter)}
            onClick={handleOpenEditorForObject}
          />
        ))}
        {sourceObjectMetadataItems.length > 0 && (
          <StyledHeaderDropdownButton
            isUnfolded={isEditorOpen}
            isActive={recordFilters.length > 0}
            onClick={() => setIsEditorOpen((isOpen) => !isOpen)}
          >
            <Trans>Filter</Trans>
          </StyledHeaderDropdownButton>
        )}
      </StyledChipRow>
      {isEditorOpen &&
        isDefined(selectedObjectMetadataItem) &&
        isDefined(instanceId) && (
          <DashboardPageLayoutFilterEditor
            key={`${instanceId}-${editorResetCount}`}
            instanceId={instanceId}
            sourceObjectMetadataItems={sourceObjectMetadataItems}
            selectedObjectMetadataItem={selectedObjectMetadataItem}
            onSelectObjectMetadataItemId={setSelectedObjectMetadataItemId}
          />
        )}
    </StyledFilterBar>
  );
};
