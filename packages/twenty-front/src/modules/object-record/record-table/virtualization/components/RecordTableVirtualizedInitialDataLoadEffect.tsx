import { useIsRecordIndexPaginationEnabled } from '@/object-record/record-index/hooks/useIsRecordIndexPaginationEnabled';
import { useRecordIndexTableLazyQuery } from '@/object-record/record-index/hooks/useRecordIndexTableLazyQuery';
import { lastLoadedRecordIndexPaginationComponentState } from '@/object-record/record-index/states/lastLoadedRecordIndexPaginationComponentState';
import { recordIndexCurrentPageComponentState } from '@/object-record/record-index/states/recordIndexCurrentPageComponentState';
import { recordIndexPageSizeState } from '@/object-record/record-index/states/recordIndexPageSizeState';
import { useRecordTableContextOrThrow } from '@/object-record/record-table/contexts/RecordTableContext';

import { visibleRecordFieldsComponentSelector } from '@/object-record/record-field/states/visibleRecordFieldsComponentSelector';
import { recordTableWentFromEmptyToNotEmptyComponentState } from '@/object-record/record-table/states/recordTableWentFromEmptyToNotEmptyComponentState';
import { useTriggerInitialRecordTableDataLoad } from '@/object-record/record-table/virtualization/hooks/useTriggerInitialRecordTableDataLoad';
import { isInitializingVirtualTableDataLoadingComponentState } from '@/object-record/record-table/virtualization/states/isInitializingVirtualTableDataLoadingComponentState';
import { lastContextStoreVirtualizedViewIdComponentState } from '@/object-record/record-table/virtualization/states/lastContextStoreVirtualizedViewIdComponentState';
import { lastContextStoreVirtualizedVisibleRecordFieldsComponentState } from '@/object-record/record-table/virtualization/states/lastContextStoreVirtualizedVisibleRecordFieldsComponentState';
import { lastRecordTableQueryIdentifierComponentState } from '@/object-record/record-table/virtualization/states/lastRecordTableQueryIdentifierComponentState';
import { isFetchingMoreRecordsFamilyState } from '@/object-record/states/isFetchingMoreRecordsFamilyState';
import { useAtomComponentSelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentSelectorValue';
import { useAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentState';
import { useAtomFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilyStateValue';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useGetCurrentViewOnly } from '@/views/hooks/useGetCurrentViewOnly';
import isEmpty from 'lodash.isempty';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from 'jotai';
import { recordShowReturnContextState } from '@/object-record/record-show/states/recordShowReturnContextState';
import { isRecordShowReturnLocation } from '@/object-record/record-show/utils/isRecordShowReturnLocation';

// TODO: see if we can merge the initial and load more processes, to have only one load at scroll index effect
export const RecordTableVirtualizedInitialDataLoadEffect = () => {
  const { recordTableId, objectNameSingular } = useRecordTableContextOrThrow();
  const location = useLocation();
  const store = useStore();

  const { queryIdentifier } = useRecordIndexTableLazyQuery(objectNameSingular);

  const [lastRecordTableQueryIdentifier, setLastRecordTableQueryIdentifier] =
    useAtomComponentState(lastRecordTableQueryIdentifierComponentState);

  const [isInitializedOnMount, setIsInitializedOnMount] = useState(false);

  const visibleRecordFields = useAtomComponentSelectorValue(
    visibleRecordFieldsComponentSelector,
  );
  const [isInitializingVirtualTableDataLoading] = useAtomComponentState(
    isInitializingVirtualTableDataLoadingComponentState,
  );

  const [
    recordTableWentFromEmptyToNotEmpty,
    setRecordTableWentFromEmptyToNotEmpty,
  ] = useAtomComponentState(recordTableWentFromEmptyToNotEmptyComponentState);

  const isFetchingMoreRecords = useAtomFamilyStateValue(
    isFetchingMoreRecordsFamilyState,
    recordTableId,
  );

  const { triggerInitialRecordTableDataLoad } =
    useTriggerInitialRecordTableDataLoad();

  const [
    lastContextStoreVirtualizedViewId,
    setLastContextStoreVirtualizedViewId,
  ] = useAtomComponentState(lastContextStoreVirtualizedViewIdComponentState);

  const [
    lastContextStoreVirtualizedVisibleRecordFields,
    setLastContextStoreVirtualizedVisibleRecordFields,
  ] = useAtomComponentState(
    lastContextStoreVirtualizedVisibleRecordFieldsComponentState,
  );

  const { currentView } = useGetCurrentViewOnly();

  const isRecordIndexPaginationEnabled = useIsRecordIndexPaginationEnabled();

  const [recordIndexCurrentPage, setRecordIndexCurrentPage] =
    useAtomComponentState(recordIndexCurrentPageComponentState);

  const recordIndexPageSize = useAtomStateValue(recordIndexPageSizeState);

  const [lastLoadedRecordIndexPagination, setLastLoadedRecordIndexPagination] =
    useAtomComponentState(lastLoadedRecordIndexPaginationComponentState);

  useEffect(() => {
    if (isInitializingVirtualTableDataLoading) {
      return;
    }

    // Wait for the atomic batch from loadRecordIndexStates to populate
    // visibleRecordFields before triggering any fetch. This guard must apply
    // to every branch: when the current view is a draft (e.g. an unsaved
    // record-table widget view), it is not in the persisted views store, so
    // currentView is undefined and the view-change branch below never runs.
    if (isEmpty(visibleRecordFields)) {
      return;
    }

    (async () => {
      const returnContext = store.get(recordShowReturnContextState.atom);
      const pageToLoad = isRecordShowReturnLocation(
        returnContext,
        location.key,
        recordTableId,
        location.state?.recordIndexReturnKey,
      )
        ? (returnContext?.page ?? 1)
        : 1;
      if ((currentView?.id ?? null) !== lastContextStoreVirtualizedViewId) {
        setLastContextStoreVirtualizedViewId(currentView?.id ?? null);
        setLastRecordTableQueryIdentifier(queryIdentifier);
        setLastContextStoreVirtualizedVisibleRecordFields(visibleRecordFields);
        setRecordIndexCurrentPage(pageToLoad);
        setLastLoadedRecordIndexPagination({
          page: pageToLoad,
          pageSize: recordIndexPageSize,
        });

        await triggerInitialRecordTableDataLoad();
      } else if (
        queryIdentifier !== lastRecordTableQueryIdentifier &&
        !isFetchingMoreRecords
      ) {
        setLastRecordTableQueryIdentifier(queryIdentifier);
        setRecordIndexCurrentPage(pageToLoad);
        setLastLoadedRecordIndexPagination({
          page: pageToLoad,
          pageSize: recordIndexPageSize,
        });

        await triggerInitialRecordTableDataLoad();
      } else if (
        isRecordIndexPaginationEnabled &&
        (recordIndexCurrentPage !== lastLoadedRecordIndexPagination.page ||
          recordIndexPageSize !== lastLoadedRecordIndexPagination.pageSize)
      ) {
        setLastLoadedRecordIndexPagination({
          page: recordIndexCurrentPage,
          pageSize: recordIndexPageSize,
        });

        await triggerInitialRecordTableDataLoad();
      } else if (recordTableWentFromEmptyToNotEmpty) {
        setRecordTableWentFromEmptyToNotEmpty(false);

        await triggerInitialRecordTableDataLoad();
      } else if (
        JSON.stringify(lastContextStoreVirtualizedVisibleRecordFields) !==
        JSON.stringify(visibleRecordFields)
      ) {
        const lastFields = lastContextStoreVirtualizedVisibleRecordFields ?? [];
        const currentFields = visibleRecordFields ?? [];

        setLastContextStoreVirtualizedVisibleRecordFields(visibleRecordFields);

        const shouldRefetchData = currentFields.length > lastFields.length;

        if (shouldRefetchData) {
          await triggerInitialRecordTableDataLoad({
            shouldScrollToStart: isEmpty(lastFields),
          });
        }
      } else if (!isInitializedOnMount) {
        setIsInitializedOnMount(true);
        await triggerInitialRecordTableDataLoad();
      }
    })();
  }, [
    recordTableWentFromEmptyToNotEmpty,
    location.key,
    location.state?.recordIndexReturnKey,
    store,
    recordTableId,
    setRecordTableWentFromEmptyToNotEmpty,
    queryIdentifier,
    lastRecordTableQueryIdentifier,
    triggerInitialRecordTableDataLoad,
    setLastRecordTableQueryIdentifier,
    isFetchingMoreRecords,
    isInitializingVirtualTableDataLoading,
    currentView,
    lastContextStoreVirtualizedViewId,
    setLastContextStoreVirtualizedViewId,
    lastContextStoreVirtualizedVisibleRecordFields,
    setLastContextStoreVirtualizedVisibleRecordFields,
    visibleRecordFields,
    isInitializedOnMount,
    setIsInitializedOnMount,
    isRecordIndexPaginationEnabled,
    recordIndexCurrentPage,
    recordIndexPageSize,
    setRecordIndexCurrentPage,
    lastLoadedRecordIndexPagination,
    setLastLoadedRecordIndexPagination,
  ]);

  return <></>;
};
