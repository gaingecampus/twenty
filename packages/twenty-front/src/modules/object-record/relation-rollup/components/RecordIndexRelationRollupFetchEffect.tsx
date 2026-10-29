import { contextStoreCurrentViewIdComponentState } from '@/context-store/states/contextStoreCurrentViewIdComponentState';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { recordIndexAllRecordIdsComponentSelector } from '@/object-record/record-index/states/selectors/recordIndexAllRecordIdsComponentSelector';
import { useFetchRelationRollupAggregates } from '@/object-record/relation-rollup/hooks/useFetchRelationRollupAggregates';
import { recordStoreFamilyState } from '@/object-record/record-store/states/recordStoreFamilyState';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useAtomComponentSelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentSelectorValue';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useGetViewFromState } from '@/views/hooks/useGetViewFromState';
import { useStore } from 'jotai';
import { useEffect } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { useDebouncedCallback } from 'use-debounce';

const RELATION_ROLLUP_FETCH_DEBOUNCE_MS = 100;

export const RecordIndexRelationRollupFetchEffect = () => {
  const store = useStore();
  const { objectNameSingular, recordIndexId } = useRecordIndexContextOrThrow();
  const { getViewFromState } = useGetViewFromState();
  const { fetchRelationRollupAggregates } = useFetchRelationRollupAggregates({
    objectNameSingular,
  });

  const contextStoreCurrentViewId = useAtomComponentStateValue(
    contextStoreCurrentViewIdComponentState,
  );

  const recordIds = useAtomComponentSelectorValue(
    recordIndexAllRecordIdsComponentSelector,
    recordIndexId,
  );

  const fetchRollupsForCurrentRecords = useDebouncedCallback(async () => {
    if (!isDefined(contextStoreCurrentViewId)) {
      return;
    }

    const view = getViewFromState(contextStoreCurrentViewId);

    if (!isDefined(view)) {
      return;
    }

    const hasRollupViewFields = view.viewFields.some((viewField) =>
      isDefined(viewField.relationRollup),
    );

    if (!hasRollupViewFields) {
      return;
    }

    if (recordIds.length === 0) {
      return;
    }

    const records = recordIds
      .map((recordId) => store.get(recordStoreFamilyState.atomFamily(recordId)))
      .filter(isDefined) as ObjectRecord[];

    if (records.length === 0) {
      return;
    }

    await fetchRelationRollupAggregates(records);
  }, RELATION_ROLLUP_FETCH_DEBOUNCE_MS);

  useEffect(() => {
    fetchRollupsForCurrentRecords();

    return () => {
      fetchRollupsForCurrentRecords.cancel();
    };
  }, [
    contextStoreCurrentViewId,
    fetchRollupsForCurrentRecords,
    recordIds,
    store,
  ]);

  return null;
};
