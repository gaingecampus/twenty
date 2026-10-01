import { CommandMenuComponentInstanceContext } from '@/command-menu/states/contexts/CommandMenuComponentInstanceContext';
import { getSidePanelCommandMenuDropdownIdFromCommandMenuId } from '@/command-menu-item/utils/getSidePanelCommandMenuDropdownIdFromCommandMenuId';
import { SIDE_PANEL_FOCUS_ID } from '@/side-panel/constants/SidePanelFocusId';
import { useSidePanelMenu } from '@/side-panel/hooks/useSidePanelMenu';
import { sidePanelNavigationStackState } from '@/side-panel/states/sidePanelNavigationStackState';
import { SidePanelPageComponentInstanceContext } from '@/side-panel/states/contexts/SidePanelPageComponentInstanceContext';
import { MAIN_CONTEXT_STORE_INSTANCE_ID } from '@/context-store/constants/MainContextStoreInstanceId';
import { contextStoreRecordShowParentViewComponentState } from '@/context-store/states/contextStoreRecordShowParentViewComponentState';
import { CoreObjectNameSingular, AppPath } from 'twenty-shared/types';
import { recordStoreFamilyState } from '@/object-record/record-store/states/recordStoreFamilyState';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useCloseDropdown } from '@/ui/layout/dropdown/hooks/useCloseDropdown';
import { getShowPageTabListComponentId } from '@/ui/layout/show-page/utils/getShowPageTabListComponentId';
import { activeTabIdComponentState } from '@/ui/layout/tab-list/states/activeTabIdComponentState';
import { useHotkeysOnFocusedElement } from '@/ui/utilities/hotkey/hooks/useHotkeysOnFocusedElement';
import { useAvailableComponentInstanceIdOrThrow } from '@/ui/utilities/state/component-state/hooks/useAvailableComponentInstanceIdOrThrow';
import { useComponentInstanceStateContext } from '@/ui/utilities/state/component-state/hooks/useComponentInstanceStateContext';
import { useAtomComponentStateCallbackState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateCallbackState';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useAtomFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilyStateValue';
import { useSetAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useSetAtomComponentState';
import { useStore } from 'jotai';
import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { recordShowReturnContextState } from '@/object-record/record-show/states/recordShowReturnContextState';
import { currentRecordFiltersComponentState } from '@/object-record/record-filter/states/currentRecordFiltersComponentState';
import { currentRecordFilterGroupsComponentState } from '@/object-record/record-filter-group/states/currentRecordFilterGroupsComponentState';
import { currentRecordSortsComponentState } from '@/object-record/record-sort/states/currentRecordSortsComponentState';
import { recordIndexCurrentPageComponentState } from '@/object-record/record-index/states/recordIndexCurrentPageComponentState';
import { isDefined } from 'twenty-shared/utils';
import { Button } from 'twenty-ui/input';
import { getOsControlSymbol } from 'twenty-ui/utilities';
import { useNavigateApp } from '~/hooks/useNavigateApp';

type RecordShowSidePanelOpenRecordButtonProps = {
  objectNameSingular: string;
  recordId: string;
};

export const RecordShowSidePanelOpenRecordButton = ({
  objectNameSingular,
  recordId,
}: RecordShowSidePanelOpenRecordButtonProps) => {
  const record = useAtomFamilyStateValue(recordStoreFamilyState, recordId) as
    | ObjectRecord
    | null
    | undefined;
  const { closeSidePanelMenu } = useSidePanelMenu();

  const sidePanelPageComponentInstance = useComponentInstanceStateContext(
    SidePanelPageComponentInstanceContext,
  );

  const tabListComponentId = getShowPageTabListComponentId({
    pageId: sidePanelPageComponentInstance?.instanceId,
    targetObjectId: recordId,
  });

  const activeTabId = useAtomComponentStateValue(
    activeTabIdComponentState,
    tabListComponentId,
  );

  const tabListComponentIdInRecordPage = getShowPageTabListComponentId({
    targetObjectId: recordId,
  });

  const setActiveTabId = useSetAtomComponentState(
    activeTabIdComponentState,
    tabListComponentIdInRecordPage,
  );

  const parentViewState = useAtomComponentStateCallbackState(
    contextStoreRecordShowParentViewComponentState,
    MAIN_CONTEXT_STORE_INSTANCE_ID,
  );

  const store = useStore();

  const navigate = useNavigateApp();
  const location = useLocation();

  const commandMenuId = useAvailableComponentInstanceIdOrThrow(
    CommandMenuComponentInstanceContext,
  );

  const { closeDropdown } = useCloseDropdown();

  const handleOpenRecord = useCallback(() => {
    const tabIdToOpen =
      activeTabId === 'home'
        ? objectNameSingular === CoreObjectNameSingular.Note ||
          objectNameSingular === CoreObjectNameSingular.Task
          ? 'richText'
          : 'timeline'
        : activeTabId;

    setActiveTabId(tabIdToOpen);

    const parentView = store.get(parentViewState);
    const recordIndexId = location.pathname.startsWith('/objects/')
      ? parentView?.parentViewComponentId
      : undefined;
    const scrollElement = recordIndexId
      ? document.getElementById(
          `scroll-wrapper-record-table-scroll-${recordIndexId}`,
        )
      : null;

    store.set(recordShowReturnContextState.atom, {
      locationKey: location.key,
      url: `${location.pathname}${location.search}${location.hash}`,
      recordPath: `/object/${objectNameSingular}/${recordId}`,
      recordIndexId,
      filters: recordIndexId
        ? store.get(
            currentRecordFiltersComponentState.atomFamily({
              instanceId: recordIndexId,
            }),
          )
        : [],
      filterGroups: recordIndexId
        ? store.get(
            currentRecordFilterGroupsComponentState.atomFamily({
              instanceId: recordIndexId,
            }),
          )
        : [],
      sorts: recordIndexId
        ? store.get(
            currentRecordSortsComponentState.atomFamily({
              instanceId: recordIndexId,
            }),
          )
        : [],
      page: recordIndexId
        ? store.get(
            recordIndexCurrentPageComponentState.atomFamily({
              instanceId: recordIndexId,
            }),
          )
        : 1,
      scrollTop: scrollElement?.scrollTop ?? 0,
      scrollLeft: scrollElement?.scrollLeft ?? 0,
    });

    if (
      isDefined(parentView) &&
      parentView.parentViewObjectNameSingular !== objectNameSingular
    ) {
      store.set(parentViewState, undefined);
    }

    store.set(sidePanelNavigationStackState.atom, []);

    navigate(
      AppPath.RecordShowPage,
      {
        objectNameSingular,
        objectRecordId: recordId,
      },
      undefined,
      { state: { recordShowReturnKey: location.key } },
    );

    closeDropdown(
      getSidePanelCommandMenuDropdownIdFromCommandMenuId(commandMenuId),
    );

    closeSidePanelMenu();
  }, [
    commandMenuId,
    location,
    activeTabId,
    closeSidePanelMenu,
    closeDropdown,
    navigate,
    objectNameSingular,
    parentViewState,
    recordId,
    setActiveTabId,
    store,
  ]);

  useHotkeysOnFocusedElement({
    keys: ['ctrl+Enter,meta+Enter'],
    callback: handleOpenRecord,
    focusId: SIDE_PANEL_FOCUS_ID,
    dependencies: [handleOpenRecord],
  });

  if (!isDefined(record)) {
    return null;
  }

  return (
    <span title={`전체 페이지로 열기 (${getOsControlSymbol()}⏎)`}>
      <Button
        title="전체 페이지로 열기 ↗"
        variant="secondary"
        size="small"
        onClick={handleOpenRecord}
      />
    </span>
  );
};
