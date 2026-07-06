import { contextStoreCurrentViewIdComponentState } from '@/context-store/states/contextStoreCurrentViewIdComponentState';
import { availableFieldMetadataItemsForFilterFamilySelector } from '@/object-metadata/states/availableFieldMetadataItemsForFilterFamilySelector';
import { useUpdateMetadataStoreDraft } from '@/metadata-store/hooks/useUpdateMetadataStoreDraft';
import { type FlatViewField } from '@/metadata-store/types/FlatViewField';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { type RecordFilter } from '@/object-record/record-filter/types/RecordFilter';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { useLoadRecordIndexStates } from '@/object-record/record-index/hooks/useLoadRecordIndexStates';
import { recordIndexAllRecordIdsComponentSelector } from '@/object-record/record-index/states/selectors/recordIndexAllRecordIdsComponentSelector';
import { RelationRollupFiltersSection } from '@/object-record/relation-rollup/components/RelationRollupFiltersSection';
import { useFetchRelationRollupAggregates } from '@/object-record/relation-rollup/hooks/useFetchRelationRollupAggregates';
import { areRelationRollupSettingsEqual } from '@/object-record/relation-rollup/utils/areRelationRollupSettingsEqual';
import { getRelationRollupDisplayLabel } from '@/object-record/relation-rollup/utils/getRelationRollupDisplayLabel';
import { mapRecordFiltersToRelationRollupFilters } from '@/object-record/relation-rollup/utils/mapRecordFiltersToRelationRollupFilters';
import { mapRelationRollupFiltersToRecordFilters } from '@/object-record/relation-rollup/utils/mapRelationRollupFiltersToRecordFilters';
import { recordStoreFamilyState } from '@/object-record/record-store/states/recordStoreFamilyState';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { usePerformViewFieldAPIPersist } from '@/views/hooks/internal/usePerformViewFieldAPIPersist';
import { useGetViewFromState } from '@/views/hooks/useGetViewFromState';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { useAtomComponentSelectorCallbackState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentSelectorCallbackState';
import { DropdownMenuItemsContainer } from '@/ui/layout/dropdown/components/DropdownMenuItemsContainer';
import { DropdownMenuSeparator } from '@/ui/layout/dropdown/components/DropdownMenuSeparator';
import { useAtomComponentStateCallbackState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateCallbackState';
import { ScrollWrapper } from '@/ui/utilities/scroll/components/ScrollWrapper';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useCallback, useMemo, useState } from 'react';
import { useStore } from 'jotai';
import {
  AggregateOperations,
  type RelationRollupSettings,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { MenuItem, MenuItemSelect } from 'twenty-ui/navigation';
import { v4 } from 'uuid';
import {
  FieldMetadataType,
  RelationType,
  type CreateViewFieldInput,
} from '~/generated-metadata/graphql';

const DEFAULT_VIEW_FIELD_SIZE = 180;

const RELATION_ROLLUP_COLUMN_PICKER_SCROLL_WRAPPER_ID =
  'relation-rollup-column-picker-content';

const StyledRelationRollupColumnPickerScrollContainer = styled.div`
  max-height: 420px;
`;

const AGGREGATE_OPERATION_OPTIONS = [
  AggregateOperations.COUNT,
  AggregateOperations.SUM,
  AggregateOperations.AVG,
  AggregateOperations.MIN,
  AggregateOperations.MAX,
] as const;

type RelationRollupColumnPickerContentProps = {
  onSuccess?: () => void;
  existingViewFieldId?: string;
};

export const RelationRollupColumnPickerContent = ({
  onSuccess,
  existingViewFieldId,
}: RelationRollupColumnPickerContentProps) => {
  const { t } = useLingui();
  const { objectMetadataItem, recordIndexId } = useRecordIndexContextOrThrow();
  const { enqueueErrorSnackBar } = useSnackBar();
  const { performViewFieldAPICreate, performViewFieldAPIUpdate } =
    usePerformViewFieldAPIPersist();
  const { getViewFromState } = useGetViewFromState();
  const { loadRecordIndexStates } = useLoadRecordIndexStates();
  const { addToDraft, applyChanges } = useUpdateMetadataStoreDraft();
  const { fetchRelationRollupAggregates } = useFetchRelationRollupAggregates({
    objectNameSingular: objectMetadataItem.nameSingular,
  });
  const store = useStore();

  const recordIndexAllRecordIdsCallbackState =
    useAtomComponentSelectorCallbackState(
      recordIndexAllRecordIdsComponentSelector,
      recordIndexId,
    );

  const currentViewIdCallbackState = useAtomComponentStateCallbackState(
    contextStoreCurrentViewIdComponentState,
  );

  const currentViewId = store.get(currentViewIdCallbackState);
  const currentView = isDefined(currentViewId)
    ? getViewFromState(currentViewId)
    : undefined;

  const existingViewField = isDefined(existingViewFieldId)
    ? currentView?.viewFields.find(
        (viewField) => viewField.id === existingViewFieldId,
      )
    : undefined;

  const isEditMode = isDefined(existingViewField?.relationRollup);

  const oneToManyRelationFields = objectMetadataItem.fields.filter(
    (field) =>
      field.type === FieldMetadataType.RELATION &&
      field.relation?.type === RelationType.ONE_TO_MANY,
  );

  const [selectedRelationFieldId, setSelectedRelationFieldId] = useState<
    string | null
  >(
    existingViewField?.fieldMetadataId ??
      oneToManyRelationFields.at(0)?.id ??
      null,
  );

  const selectedRelationField = oneToManyRelationFields.find(
    (field) => field.id === selectedRelationFieldId,
  );

  const { objectMetadataItems } = useObjectMetadataItems();

  const targetObjectMetadata = isDefined(
    selectedRelationField?.relation?.targetObjectMetadata.id,
  )
    ? objectMetadataItems.find(
        (objectMetadataItemToFind) =>
          objectMetadataItemToFind.id ===
          selectedRelationField?.relation?.targetObjectMetadata.id,
      )
    : undefined;

  const aggregateableTargetFields =
    targetObjectMetadata?.fields.filter(
      (field) =>
        field.type === FieldMetadataType.NUMBER ||
        field.type === FieldMetadataType.CURRENCY,
    ) ?? [];

  const existingAggregateFieldId = isDefined(
    existingViewField?.relationRollup
      ?.aggregateFieldMetadataUniversalIdentifier,
  )
    ? aggregateableTargetFields.find(
        (field) =>
          field.universalIdentifier ===
          existingViewField?.relationRollup
            ?.aggregateFieldMetadataUniversalIdentifier,
      )?.id
    : undefined;

  const [selectedAggregateOperation, setSelectedAggregateOperation] =
    useState<AggregateOperations>(
      existingViewField?.relationRollup?.aggregateOperation ??
        AggregateOperations.COUNT,
    );

  const [selectedAggregateFieldId, setSelectedAggregateFieldId] = useState<
    string | null
  >(existingAggregateFieldId ?? aggregateableTargetFields.at(0)?.id ?? null);

  const initialRecordFilters = useMemo(() => {
    if (!isDefined(existingViewField?.relationRollup) || !targetObjectMetadata) {
      return [];
    }

    return mapRelationRollupFiltersToRecordFilters({
      relationRollup: existingViewField.relationRollup,
      fieldMetadataItems: targetObjectMetadata.fields,
    }).recordFilters;
  }, [existingViewField?.relationRollup, targetObjectMetadata]);

  const [recordFilters, setRecordFilters] =
    useState<RecordFilter[]>(initialRecordFilters);

  const filterableTargetFields = useMemo(() => {
    if (!isDefined(targetObjectMetadata)) {
      return [];
    }

    return store.get(
      availableFieldMetadataItemsForFilterFamilySelector.selectorFamily({
        objectMetadataItemId: targetObjectMetadata.id,
      }),
    );
  }, [store, targetObjectMetadata]);

  const buildRelationRollupSettings = useCallback((): RelationRollupSettings | null => {
    if (
      !isDefined(selectedRelationField) ||
      !isDefined(selectedRelationField.universalIdentifier) ||
      !isDefined(targetObjectMetadata)
    ) {
      return null;
    }

    const selectedAggregateField = aggregateableTargetFields.find(
      (field) => field.id === selectedAggregateFieldId,
    );

    if (
      selectedAggregateOperation !== AggregateOperations.COUNT &&
      !isDefined(selectedAggregateField?.universalIdentifier)
    ) {
      return null;
    }

    const { recordFilters: rollupRecordFilters, recordFilterGroups } =
      mapRecordFiltersToRelationRollupFilters({
        recordFilters,
        recordFilterGroups: [],
        fieldMetadataItems: targetObjectMetadata.fields,
      });

    return {
      relationFieldMetadataUniversalIdentifier:
        selectedRelationField.universalIdentifier,
      aggregateOperation: selectedAggregateOperation,
      aggregateFieldMetadataUniversalIdentifier:
        selectedAggregateOperation === AggregateOperations.COUNT
          ? undefined
          : selectedAggregateField?.universalIdentifier,
      label: getRelationRollupDisplayLabel({
        relationFieldLabel: selectedRelationField.label,
        aggregateOperation: selectedAggregateOperation,
        aggregateFieldLabel: selectedAggregateField?.label,
      }),
      ...(rollupRecordFilters.length > 0
        ? {
            recordFilters: rollupRecordFilters,
            recordFilterGroups,
          }
        : {}),
    };
  }, [
    aggregateableTargetFields,
    recordFilters,
    selectedAggregateFieldId,
    selectedAggregateOperation,
    selectedRelationField,
    targetObjectMetadata,
  ]);

  const handleSaveRollupColumn = useCallback(async () => {
    const currentViewIdValue = store.get(currentViewIdCallbackState);

    if (!isDefined(currentViewIdValue)) {
      return;
    }

    const view = getViewFromState(currentViewIdValue);

    if (!isDefined(view) || !isDefined(selectedRelationField)) {
      return;
    }

    const relationRollup = buildRelationRollupSettings();

    if (!isDefined(relationRollup)) {
      if (
        selectedAggregateOperation !== AggregateOperations.COUNT &&
        aggregateableTargetFields.length === 0
      ) {
        enqueueErrorSnackBar({
          message: t`No numeric fields on the related object for this aggregation`,
        });
      } else {
        enqueueErrorSnackBar({
          message: t`Select a relation and aggregation to continue`,
        });
      }

      return;
    }

    const syncViewAfterRollupChange = async () => {
      const updatedView = getViewFromState(currentViewIdValue);

      if (!isDefined(updatedView)) {
        return;
      }

      loadRecordIndexStates(updatedView, objectMetadataItem);

      const recordIds = store.get(recordIndexAllRecordIdsCallbackState);
      const records = recordIds
        .map((recordId) =>
          store.get(recordStoreFamilyState.atomFamily(recordId)),
        )
        .filter(isDefined) as ObjectRecord[];

      if (records.length > 0) {
        await fetchRelationRollupAggregates(records);
      }
    };

    if (isEditMode && isDefined(existingViewField)) {
      const updateResult = await performViewFieldAPIUpdate([
        {
          input: {
            id: existingViewField.id,
            update: {
              relationRollup,
            },
          },
        },
      ]);

      if (updateResult.status === 'successful') {
        addToDraft({
          key: 'viewFields',
          items: [
            {
              ...existingViewField,
              viewId: currentViewIdValue,
              relationRollup,
            },
          ],
        });
        applyChanges();
        await syncViewAfterRollupChange();
        onSuccess?.();
      }

      return;
    }

    const maxPosition = view.viewFields.reduce(
      (max, viewField) => Math.max(max, viewField.position),
      0,
    );

    const position = maxPosition + 1;

    const existingRelationRollupViewField = view.viewFields.find(
      (viewField) =>
        isDefined(viewField.relationRollup) &&
        viewField.fieldMetadataId === selectedRelationField.id &&
        areRelationRollupSettingsEqual(viewField.relationRollup, relationRollup),
    );

    if (isDefined(existingRelationRollupViewField)) {
      const updateResult = await performViewFieldAPIUpdate([
        {
          input: {
            id: existingRelationRollupViewField.id,
            update: {
              isVisible: true,
              position,
              relationRollup,
            },
          },
        },
      ]);

      if (updateResult.status === 'successful') {
        addToDraft({
          key: 'viewFields',
          items: [
            {
              ...existingRelationRollupViewField,
              viewId: currentViewIdValue,
              isVisible: true,
              position,
              relationRollup,
            },
          ],
        });
        applyChanges();
        await syncViewAfterRollupChange();
        onSuccess?.();
      }

      return;
    }

    const viewFieldId = v4();

    const createViewFieldInput: CreateViewFieldInput = {
      id: viewFieldId,
      viewId: currentViewIdValue,
      fieldMetadataId: selectedRelationField.id,
      position,
      isVisible: true,
      relationRollup,
    };

    const result = await performViewFieldAPICreate({
      inputs: [createViewFieldInput],
    });

    if (result.status === 'successful' && isDefined(result.response?.data)) {
      const createdViewFieldFromApi =
        result.response.data.createManyViewFields.at(0);

      const createdViewField: FlatViewField = {
        id: viewFieldId,
        viewId: currentViewIdValue,
        fieldMetadataId: selectedRelationField.id,
        position,
        isVisible: true,
        size: createdViewFieldFromApi?.size ?? DEFAULT_VIEW_FIELD_SIZE,
        isActive: createdViewFieldFromApi?.isActive ?? true,
        relationRollup,
      };

      addToDraft({ key: 'viewFields', items: [createdViewField] });
      applyChanges();
      await syncViewAfterRollupChange();
      onSuccess?.();
    }
  }, [
    addToDraft,
    applyChanges,
    buildRelationRollupSettings,
    currentViewIdCallbackState,
    existingViewField,
    fetchRelationRollupAggregates,
    getViewFromState,
    isEditMode,
    loadRecordIndexStates,
    objectMetadataItem,
    onSuccess,
    performViewFieldAPICreate,
    performViewFieldAPIUpdate,
    recordIndexAllRecordIdsCallbackState,
    selectedRelationField,
    selectedAggregateOperation,
    aggregateableTargetFields.length,
    enqueueErrorSnackBar,
    store,
    t,
  ]);

  const relationRollupSettings = buildRelationRollupSettings();
  const canSaveRollupColumn = isDefined(relationRollupSettings);

  if (oneToManyRelationFields.length === 0) {
    return (
      <DropdownMenuItemsContainer scrollable={false}>
        <MenuItem
          disabled
          accent="placeholder"
          text={t`No related records to aggregate on this object`}
        />
      </DropdownMenuItemsContainer>
    );
  }

  return (
    <StyledRelationRollupColumnPickerScrollContainer>
      <ScrollWrapper
        componentInstanceId={RELATION_ROLLUP_COLUMN_PICKER_SCROLL_WRAPPER_ID}
      >
        {!isEditMode && (
          <>
            <DropdownMenuItemsContainer scrollable={false}>
              <MenuItem
                disabled
                accent="placeholder"
                text={t`1. Related records`}
              />
              {oneToManyRelationFields.map((relationField) => (
                <MenuItemSelect
                  key={relationField.id}
                  selected={relationField.id === selectedRelationFieldId}
                  onClick={() => setSelectedRelationFieldId(relationField.id)}
                  text={relationField.label}
                />
              ))}
            </DropdownMenuItemsContainer>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItemsContainer scrollable={false}>
          <MenuItem disabled accent="placeholder" text={t`2. Aggregation`} />
          {AGGREGATE_OPERATION_OPTIONS.map((aggregateOperation) => (
            <MenuItemSelect
              key={aggregateOperation}
              selected={aggregateOperation === selectedAggregateOperation}
              onClick={() => setSelectedAggregateOperation(aggregateOperation)}
              text={aggregateOperation}
            />
          ))}
        </DropdownMenuItemsContainer>
        {selectedAggregateOperation !== AggregateOperations.COUNT && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItemsContainer scrollable={false}>
              <MenuItem
                disabled
                accent="placeholder"
                text={t`3. Field to aggregate`}
              />
              {aggregateableTargetFields.length === 0 ? (
                <MenuItem
                  disabled
                  accent="placeholder"
                  text={t`No numeric fields on the related object`}
                />
              ) : (
                aggregateableTargetFields.map((targetField) => (
                  <MenuItemSelect
                    key={targetField.id}
                    selected={targetField.id === selectedAggregateFieldId}
                    onClick={() => setSelectedAggregateFieldId(targetField.id)}
                    text={targetField.label}
                  />
                ))
              )}
            </DropdownMenuItemsContainer>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItemsContainer scrollable={false}>
          <MenuItemSelect
            selected={false}
            disabled={!canSaveRollupColumn}
            onClick={handleSaveRollupColumn}
            text={isEditMode ? t`Save changes` : t`Add column`}
          />
        </DropdownMenuItemsContainer>
        <RelationRollupFiltersSection
          filterableTargetFields={filterableTargetFields}
          recordFilters={recordFilters}
          onRecordFiltersChange={setRecordFilters}
        />
      </ScrollWrapper>
    </StyledRelationRollupColumnPickerScrollContainer>
  );
};
