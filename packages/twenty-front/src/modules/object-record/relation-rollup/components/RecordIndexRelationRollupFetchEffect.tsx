import { contextStoreCurrentViewIdComponentState } from '@/context-store/states/contextStoreCurrentViewIdComponentState';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { recordIndexAllRecordIdsComponentSelector } from '@/object-record/record-index/states/selectors/recordIndexAllRecordIdsComponentSelector';
import { useFetchRelationRollupAggregates } from '@/object-record/relation-rollup/hooks/useFetchRelationRollupAggregates';
import { recordStoreFamilyState } from '@/object-record/record-store/states/recordStoreFamilyState';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useAtomComponentSelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentSelectorValue';
import { useAtomComponentStateCallbackState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateCallbackState';
import { useGetViewFromState } from '@/views/hooks/useGetViewFromState';
import { useStore } from 'jotai';
import { useEffect, useRef } from 'react';
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

  const currentViewIdCallbackState = useAtomComponentStateCallbackState(
    contextStoreCurrentViewIdComponentState,
  );

  const recordIds = useAtomComponentSelectorValue(
    recordIndexAllRecordIdsComponentSelector,
    recordIndexId,
  );

  const previousViewIdRef = useRef<string | null>(null);

  const fetchRollupsForCurrentRecords = useDebouncedCallback(async () => {
    const currentViewId = store.get(currentViewIdCallbackState);

    if (!isDefined(currentViewId)) {
      return;
    }

    const view = getViewFromState(currentViewId);

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
    const currentViewId = store.get(currentViewIdCallbackState);
    const viewIdChanged = previousViewIdRef.current !== currentViewId;

    previousViewIdRef.current = currentViewId ?? null;

    if (viewIdChanged) {
      fetchRollupsForCurrentRecords.cancel();
      void fetchRollupsForCurrentRecords.flush();
    } else {
      fetchRollupsForCurrentRecords();
    }

    return () => {
      fetchRollupsForCurrentRecords.cancel();
    };
  }, [
    currentViewIdCallbackState,
    fetchRollupsForCurrentRecords,
    recordIds,
    store,
  ]);

  return null;
};
