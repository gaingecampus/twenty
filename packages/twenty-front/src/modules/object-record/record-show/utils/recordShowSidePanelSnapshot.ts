import { type createStore } from 'jotai';
import { sidePanelNavigationStackState } from '@/side-panel/states/sidePanelNavigationStackState';
import { sidePanelNavigationMorphItemsByPageState } from '@/side-panel/states/sidePanelNavigationMorphItemsByPageState';
import { viewableRecordIdState } from '@/object-record/record-side-panel/states/viewableRecordIdState';
import { activeTabIdComponentState } from '@/ui/layout/tab-list/states/activeTabIdComponentState';
import { getShowPageTabListComponentId } from '@/ui/layout/show-page/utils/getShowPageTabListComponentId';

type Store = ReturnType<typeof createStore>;

export const captureRecordShowSidePanel = (store: Store) => {
  const morphItems = new Map(
    store.get(sidePanelNavigationMorphItemsByPageState.atom),
  );
  const tabs = Array.from(morphItems).flatMap(([pageId, records]) => {
    if (!records[0]) return [];
    const instanceId = getShowPageTabListComponentId({
      pageId,
      targetObjectId: records[0].recordId,
    });
    return [
      {
        instanceId,
        tabId: store.get(activeTabIdComponentState.atomFamily({ instanceId })),
      },
    ];
  });
  return {
    stack: [...store.get(sidePanelNavigationStackState.atom)],
    morphItems,
    tabs,
    viewableRecordId: store.get(viewableRecordIdState.atom),
  };
};

export type RecordShowSidePanelSnapshot = ReturnType<
  typeof captureRecordShowSidePanel
>;

export const restoreRecordShowSidePanel = (
  store: Store,
  snapshot: RecordShowSidePanelSnapshot,
) => {
  store.set(sidePanelNavigationStackState.atom, snapshot.stack);
  store.set(sidePanelNavigationMorphItemsByPageState.atom, snapshot.morphItems);
  store.set(viewableRecordIdState.atom, snapshot.viewableRecordId);
  for (const { instanceId, tabId } of snapshot.tabs) {
    store.set(activeTabIdComponentState.atomFamily({ instanceId }), tabId);
  }
};
