import { SIDE_PANEL_SEARCH_CLICK_OUTSIDE_LISTENER_ID } from '@/side-panel/constants/SidePanelSearchClickOutsideListenerId';
import { useSidePanelMenu } from '@/side-panel/hooks/useSidePanelMenu';
import { isSidePanelOpenedState } from '@/side-panel/states/isSidePanelOpenedState';
import { sidePanelPageState } from '@/side-panel/states/sidePanelPageState';
import { PAGE_HEADER_SIDE_PANEL_BUTTON_CLICK_OUTSIDE_ID } from '@/ui/layout/page-header/constants/PageHeaderSidePanelButtonClickOutsideId';
import { NAVIGATION_DRAWER_SEARCH_CLICK_OUTSIDE_ID } from '@/ui/navigation/navigation-drawer/constants/NavigationDrawerSearchClickOutsideId';
import { useListenClickOutside } from '@/ui/utilities/pointer-event/hooks/useListenClickOutside';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { type RefObject, useCallback } from 'react';
import { SidePanelPages } from 'twenty-shared/types';

type SidePanelSearchClickOutsideEffectProps = {
  sidePanelRef: RefObject<HTMLDivElement | null>;
};

export const SidePanelSearchClickOutsideEffect = ({
  sidePanelRef,
}: SidePanelSearchClickOutsideEffectProps) => {
  const { closeSidePanelMenu } = useSidePanelMenu();
  const isSidePanelOpened = useAtomStateValue(isSidePanelOpenedState);
  const sidePanelPage = useAtomStateValue(sidePanelPageState);
  const isSearchPageOpen =
    isSidePanelOpened && sidePanelPage === SidePanelPages.SearchRecords;

  const handleClickOutside = useCallback(() => {
    closeSidePanelMenu();
  }, [closeSidePanelMenu]);

  useListenClickOutside({
    refs: [sidePanelRef],
    callback: handleClickOutside,
    listenerId: SIDE_PANEL_SEARCH_CLICK_OUTSIDE_LISTENER_ID,
    enabled: isSearchPageOpen,
    excludedClickOutsideIds: [
      NAVIGATION_DRAWER_SEARCH_CLICK_OUTSIDE_ID,
      PAGE_HEADER_SIDE_PANEL_BUTTON_CLICK_OUTSIDE_ID,
    ],
  });

  return null;
};
