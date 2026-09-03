import { useSidePanelMenu } from '@/side-panel/hooks/useSidePanelMenu';
import { isSidePanelOpenedState } from '@/side-panel/states/isSidePanelOpenedState';
import { sidePanelPageState } from '@/side-panel/states/sidePanelPageState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { t } from '@lingui/core/macro';
import { useCallback } from 'react';
import { SidePanelPages } from 'twenty-shared/types';
import { IconSearch } from 'twenty-ui/icon';
import { v4 } from 'uuid';

export const useOpenRecordsSearchPageInSidePanel = () => {
  const { closeSidePanelMenu, navigateSidePanelMenu } = useSidePanelMenu();
  const isSidePanelOpened = useAtomStateValue(isSidePanelOpenedState);
  const sidePanelPage = useAtomStateValue(sidePanelPageState);

  const openRecordsSearchPage = useCallback(() => {
    navigateSidePanelMenu({
      page: SidePanelPages.SearchRecords,
      pageTitle: t`Search`,
      pageIcon: IconSearch,
      pageId: v4(),
      resetNavigationStack: isSidePanelOpened,
    });
  }, [isSidePanelOpened, navigateSidePanelMenu]);

  const toggleRecordsSearchPage = useCallback(() => {
    if (
      isSidePanelOpened &&
      sidePanelPage === SidePanelPages.SearchRecords
    ) {
      closeSidePanelMenu();
      return;
    }

    openRecordsSearchPage();
  }, [
    closeSidePanelMenu,
    isSidePanelOpened,
    openRecordsSearchPage,
    sidePanelPage,
  ]);

  return {
    openRecordsSearchPage,
    toggleRecordsSearchPage,
  };
};
