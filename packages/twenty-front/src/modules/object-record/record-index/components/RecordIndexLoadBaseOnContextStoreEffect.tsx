import { useContextStoreObjectMetadataItemOrThrow } from '@/context-store/hooks/useContextStoreObjectMetadataItemOrThrow';
import { contextStoreCurrentViewIdComponentState } from '@/context-store/states/contextStoreCurrentViewIdComponentState';
import { useLoadRecordIndexStates } from '@/object-record/record-index/hooks/useLoadRecordIndexStates';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { viewFromViewIdFamilySelector } from '@/views/states/selectors/viewFromViewIdFamilySelector';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from 'jotai';
import { recordShowReturnContextState } from '@/object-record/record-show/states/recordShowReturnContextState';
import { isRecordShowReturnLocation } from '@/object-record/record-show/utils/isRecordShowReturnLocation';
import { getRecordIndexIdFromObjectNamePluralAndViewId } from '@/object-record/utils/getRecordIndexIdFromObjectNamePluralAndViewId';
import { currentRecordFiltersComponentState } from '@/object-record/record-filter/states/currentRecordFiltersComponentState';
import { currentRecordFilterGroupsComponentState } from '@/object-record/record-filter-group/states/currentRecordFilterGroupsComponentState';
import { currentRecordSortsComponentState } from '@/object-record/record-sort/states/currentRecordSortsComponentState';
import { isDefined } from 'twenty-shared/utils';

export const RecordIndexLoadBaseOnContextStoreEffect = () => {
  const { loadRecordIndexStates } = useLoadRecordIndexStates();
  const location = useLocation();
  const store = useStore();
  const contextStoreCurrentViewId = useAtomComponentStateValue(
    contextStoreCurrentViewIdComponentState,
  );

  const [loadedViewId, setLoadedViewId] = useState<string | undefined>(
    undefined,
  );

  const view = useAtomFamilySelectorValue(viewFromViewIdFamilySelector, {
    viewId: contextStoreCurrentViewId ?? '',
  });

  const { objectMetadataItem } = useContextStoreObjectMetadataItemOrThrow();

  useEffect(() => {
    if (
      isDefined(contextStoreCurrentViewId) &&
      loadedViewId === contextStoreCurrentViewId
    ) {
      return;
    }

    if (!isDefined(objectMetadataItem)) {
      return;
    }

    if (isDefined(view)) {
      loadRecordIndexStates(view, objectMetadataItem);
      const recordIndexId = getRecordIndexIdFromObjectNamePluralAndViewId(
        objectMetadataItem.namePlural,
        view.id,
      );
      const returnContext = store.get(recordShowReturnContextState.atom);
      if (
        isRecordShowReturnLocation(
          returnContext,
          location.key,
          recordIndexId,
          location.state?.recordIndexReturnKey,
        ) &&
        returnContext
      ) {
        store.set(
          currentRecordFiltersComponentState.atomFamily({
            instanceId: recordIndexId,
          }),
          returnContext.filters,
        );
        store.set(
          currentRecordFilterGroupsComponentState.atomFamily({
            instanceId: recordIndexId,
          }),
          returnContext.filterGroups,
        );
        store.set(
          currentRecordSortsComponentState.atomFamily({
            instanceId: recordIndexId,
          }),
          returnContext.sorts,
        );
      }
      setLoadedViewId(contextStoreCurrentViewId);
    }
  }, [
    contextStoreCurrentViewId,
    location.key,
    location.state?.recordIndexReturnKey,
    store,
    loadRecordIndexStates,
    loadedViewId,
    objectMetadataItem,
    view,
  ]);

  return <></>;
};
