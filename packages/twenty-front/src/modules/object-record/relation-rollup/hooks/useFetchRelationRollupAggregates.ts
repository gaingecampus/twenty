import { useStore } from 'jotai';
import { useCallback, useRef } from 'react';

import { contextStoreCurrentViewIdComponentState } from '@/context-store/states/contextStoreCurrentViewIdComponentState';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { flattenedFieldMetadataItemsSelector } from '@/object-metadata/states/flattenedFieldMetadataItemsSelector';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { RELATION_ROLLUP_AGGREGATES } from '@/object-record/relation-rollup/graphql/queries/relationRollupAggregates';
import { relationRollupValueFamilyState } from '@/object-record/relation-rollup/states/relationRollupValueFamilyState';
import { clearRelationRollupValuesForView } from '@/object-record/relation-rollup/utils/clearRelationRollupValuesForView';
import { convertRelationRollupFiltersToGqlFilter } from '@/object-record/relation-rollup/utils/convertRelationRollupFiltersToGqlFilter';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useAtomComponentStateCallbackState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateCallbackState';
import { useGetViewFromState } from '@/views/hooks/useGetViewFromState';
import { isDefined } from 'twenty-shared/utils';

type RelationRollupAggregatesQueryResult = {
  relationRollupAggregates: Array<{
    rollupKey: string;
    values: Array<{
      parentRecordId: string;
      aggregateFieldKey: string;
      value: string | number | null;
    }>;
  }>;
};

export const useFetchRelationRollupAggregates = ({
  objectNameSingular,
}: {
  objectNameSingular: string;
}) => {
  const apolloCoreClient = useApolloCoreClient();
  const store = useStore();
  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular,
  });
  const { getViewFromState } = useGetViewFromState();

  const currentViewIdCallbackState = useAtomComponentStateCallbackState(
    contextStoreCurrentViewIdComponentState,
  );

  const previousViewIdRef = useRef<string | null>(null);

  const fetchRelationRollupAggregates = useCallback(
    async (records: ObjectRecord[]) => {
      const currentViewId = store.get(currentViewIdCallbackState);

      if (!isDefined(currentViewId) || records.length === 0) {
        return;
      }

      const view = getViewFromState(currentViewId);

      if (!isDefined(view)) {
        return;
      }

      const rollupViewFields = view.viewFields.filter((viewField) =>
        isDefined(viewField.relationRollup),
      );

      if (rollupViewFields.length === 0) {
        return;
      }

      const parentRecordIds = records.map((record) => record.id);
      const viewIdChanged = previousViewIdRef.current !== currentViewId;
      previousViewIdRef.current = currentViewId;

      if (viewIdChanged) {
        clearRelationRollupValuesForView({
          store,
          viewFields: view.viewFields,
          recordIds: parentRecordIds,
        });
      }

      const flattenedFieldMetadataItems = store.get(
        flattenedFieldMetadataItemsSelector.atom,
      );

      const rollups = rollupViewFields
        .map((viewField) => {
          const relationRollup = viewField.relationRollup;

          if (!isDefined(relationRollup)) {
            return null;
          }

          return {
            rollupKey: viewField.id,
            relationFieldMetadataUniversalIdentifier:
              relationRollup.relationFieldMetadataUniversalIdentifier,
            aggregateOperation: relationRollup.aggregateOperation,
            aggregateFieldMetadataUniversalIdentifier:
              relationRollup.aggregateFieldMetadataUniversalIdentifier,
            filter: convertRelationRollupFiltersToGqlFilter({
              relationRollup,
              fieldMetadataItems: flattenedFieldMetadataItems,
            }),
          };
        })
        .filter(isDefined);

      try {
        const { data } =
          await apolloCoreClient.query<RelationRollupAggregatesQueryResult>({
            query: RELATION_ROLLUP_AGGREGATES,
            variables: {
              parentObjectNameSingular: objectMetadataItem.nameSingular,
              parentRecordIds,
              rollups,
            },
            fetchPolicy: 'network-only',
          });

        for (const rollupResult of data?.relationRollupAggregates ?? []) {
          for (const valueEntry of rollupResult.values) {
            store.set(
              relationRollupValueFamilyState.atomFamily({
                recordId: valueEntry.parentRecordId,
                viewFieldId: rollupResult.rollupKey,
              }),
              valueEntry.value,
            );
          }
        }
      } catch (error) {
        console.error('Failed to fetch relation rollup aggregates', error);
      }
    },
    [
      apolloCoreClient,
      currentViewIdCallbackState,
      getViewFromState,
      objectMetadataItem.nameSingular,
      store,
    ],
  );

  return {
    fetchRelationRollupAggregates,
  };
};
