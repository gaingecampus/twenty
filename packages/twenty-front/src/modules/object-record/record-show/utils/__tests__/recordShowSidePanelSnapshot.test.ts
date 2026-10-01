import { createStore } from 'jotai';
import {
  captureRecordShowSidePanel,
  restoreRecordShowSidePanel,
} from '@/object-record/record-show/utils/recordShowSidePanelSnapshot';
import { sidePanelNavigationMorphItemsByPageState } from '@/side-panel/states/sidePanelNavigationMorphItemsByPageState';
import { activeTabIdComponentState } from '@/ui/layout/tab-list/states/activeTabIdComponentState';
import { getShowPageTabListComponentId } from '@/ui/layout/show-page/utils/getShowPageTabListComponentId';

it('restores each nested record tab after panel cleanup', () => {
  const store = createStore();
  const records = new Map([
    ['company-page', [{ recordId: 'company', objectMetadataId: 'companies' }]],
    ['note-page', [{ recordId: 'note', objectMetadataId: 'notes' }]],
  ]);
  store.set(sidePanelNavigationMorphItemsByPageState.atom, records);
  const tabAtoms = Array.from(records).map(([pageId, items]) =>
    activeTabIdComponentState.atomFamily({
      instanceId: getShowPageTabListComponentId({
        pageId,
        targetObjectId: items[0].recordId,
      }),
    }),
  );
  store.set(tabAtoms[0], 'notes');
  store.set(tabAtoms[1], 'home');
  const snapshot = captureRecordShowSidePanel(store);
  store.set(sidePanelNavigationMorphItemsByPageState.atom, new Map());
  tabAtoms.forEach((atom) => store.set(atom, null));
  restoreRecordShowSidePanel(store, snapshot);
  expect(store.get(sidePanelNavigationMorphItemsByPageState.atom)).toEqual(
    records,
  );
  expect(tabAtoms.map((atom) => store.get(atom))).toEqual(['notes', 'home']);
});
