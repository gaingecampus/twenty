import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { AdvancedFilterSidePanelContainer } from '@/object-record/advanced-filter/side-panel/components/AdvancedFilterSidePanelContainer';
import { RecordFieldsComponentInstanceContext } from '@/object-record/record-field/states/context/RecordFieldsComponentInstanceContext';
import { RecordFilterGroupsComponentInstanceContext } from '@/object-record/record-filter-group/states/context/RecordFilterGroupsComponentInstanceContext';
import { currentRecordFilterGroupsComponentState } from '@/object-record/record-filter-group/states/currentRecordFilterGroupsComponentState';
import { RecordFiltersComponentInstanceContext } from '@/object-record/record-filter/states/context/RecordFiltersComponentInstanceContext';
import { currentRecordFiltersComponentState } from '@/object-record/record-filter/states/currentRecordFiltersComponentState';
import { useDashboardPageLayoutFilters } from '@/page-layout/hooks/useDashboardPageLayoutFilters';
import { pickChartFiltersForObject } from '@/page-layout/utils/pickChartFiltersForObject';
import { replaceChartFiltersForObject } from '@/page-layout/utils/replaceChartFiltersForObject';
import { ChartFiltersDeletedFieldsWarning } from '@/side-panel/pages/page-layout/components/ChartFiltersDeletedFieldsWarning';
import { ChartFiltersSettingsInitializeStateEffect } from '@/side-panel/pages/page-layout/components/ChartFiltersSettingsInitializeStateEffect';
import { dropChartRecordFiltersWithDeletedFields } from '@/side-panel/pages/page-layout/utils/dropChartRecordFiltersWithDeletedFields';
import { InputLabel } from '@/ui/input/components/InputLabel';
import { useAtomComponentStateCallbackState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateCallbackState';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { useStore } from 'jotai';
import { useMemo } from 'react';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledEditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding-top: ${themeCssVariables.spacing[2]};
`;

const StyledObjectPills = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[1]};
`;

type DashboardPageLayoutFilterEditorProps = {
  instanceId: string;
  sourceObjectMetadataItems: EnrichedObjectMetadataItem[];
  selectedObjectMetadataItem: EnrichedObjectMetadataItem;
  onSelectObjectMetadataItemId: (objectMetadataItemId: string) => void;
};

export const DashboardPageLayoutFilterEditor = ({
  instanceId,
  sourceObjectMetadataItems,
  selectedObjectMetadataItem,
  onSelectObjectMetadataItemId,
}: DashboardPageLayoutFilterEditorProps) => {
  const { dashboardPageLayoutFilters, setDashboardPageLayoutFilters } =
    useDashboardPageLayoutFilters();

  const currentRecordFilters = useAtomComponentStateCallbackState(
    currentRecordFiltersComponentState,
    instanceId,
  );

  const currentRecordFilterGroups = useAtomComponentStateCallbackState(
    currentRecordFilterGroupsComponentState,
    instanceId,
  );

  const store = useStore();

  const validFieldMetadataIds = useMemo(
    () =>
      new Set(
        selectedObjectMetadataItem.fields
          .filter((fieldMetadataItem) => fieldMetadataItem.isActive)
          .map((fieldMetadataItem) => fieldMetadataItem.id),
      ),
    [selectedObjectMetadataItem.fields],
  );

  const initialChartFilters = useMemo(
    () =>
      pickChartFiltersForObject({
        chartFilters: dashboardPageLayoutFilters,
        validFieldMetadataIds,
      }),
    [dashboardPageLayoutFilters, validFieldMetadataIds],
  );

  const handleFiltersUpdate = () => {
    const existingRecordFilters = store.get(currentRecordFilters);
    const existingRecordFilterGroups = store.get(currentRecordFilterGroups);

    const sanitizedChartFilters = dropChartRecordFiltersWithDeletedFields({
      chartFilters: {
        recordFilters: existingRecordFilters,
        recordFilterGroups: existingRecordFilterGroups,
      },
      validFieldMetadataIds,
    });

    setDashboardPageLayoutFilters(
      replaceChartFiltersForObject({
        chartFilters: dashboardPageLayoutFilters,
        objectFieldMetadataIds: validFieldMetadataIds,
        nextObjectChartFilters: sanitizedChartFilters,
      }),
    );
  };

  return (
    <StyledEditorContainer>
      {sourceObjectMetadataItems.length > 1 && (
        <StyledObjectPills>
          {sourceObjectMetadataItems.map((objectMetadataItem) => (
            <Button
              key={objectMetadataItem.id}
              title={objectMetadataItem.labelSingular}
              size="small"
              variant={
                objectMetadataItem.id === selectedObjectMetadataItem.id
                  ? 'primary'
                  : 'secondary'
              }
              onClick={() =>
                onSelectObjectMetadataItemId(objectMetadataItem.id)
              }
            />
          ))}
        </StyledObjectPills>
      )}
      <div>
        <InputLabel>{t`Conditions`}</InputLabel>
        <RecordFieldsComponentInstanceContext.Provider value={{ instanceId }}>
          <RecordFilterGroupsComponentInstanceContext.Provider
            value={{ instanceId }}
          >
            <RecordFiltersComponentInstanceContext.Provider
              value={{ instanceId }}
            >
              <ChartFiltersDeletedFieldsWarning
                validFieldMetadataIds={validFieldMetadataIds}
              />
              <AdvancedFilterSidePanelContainer
                onUpdate={handleFiltersUpdate}
                objectMetadataItem={selectedObjectMetadataItem}
                isWorkflowFindRecords={false}
              />
              <ChartFiltersSettingsInitializeStateEffect
                initialChartFilters={initialChartFilters}
              />
            </RecordFiltersComponentInstanceContext.Provider>
          </RecordFilterGroupsComponentInstanceContext.Provider>
        </RecordFieldsComponentInstanceContext.Provider>
      </div>
    </StyledEditorContainer>
  );
};
