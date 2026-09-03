import { act, renderHook } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';
import { type ReactNode } from 'react';

import { useOpenRecordsSearchPageInSidePanel } from '@/side-panel/hooks/useOpenRecordsSearchPageInSidePanel';
import { isSidePanelOpenedState } from '@/side-panel/states/isSidePanelOpenedState';
import { sidePanelPageState } from '@/side-panel/states/sidePanelPageState';
import { jotaiStore } from '@/ui/utilities/state/jotai/jotaiStore';
import { SidePanelPages } from 'twenty-shared/types';
import { IconSearch } from 'twenty-ui/icon';

const navigateSidePanelMenuMock = jest.fn();
const closeSidePanelMenuMock = jest.fn();

jest.mock('@/side-panel/hooks/useSidePanelMenu', () => ({
  useSidePanelMenu: () => ({
    navigateSidePanelMenu: navigateSidePanelMenuMock,
    openSidePanelMenu: jest.fn(),
    closeSidePanelMenu: closeSidePanelMenuMock,
    toggleSidePanelMenu: jest.fn(),
  }),
}));

const Wrapper = ({ children }: { children: ReactNode }) => (
  <JotaiProvider store={jotaiStore}>{children}</JotaiProvider>
);

describe('useOpenRecordsSearchPageInSidePanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jotaiStore.set(isSidePanelOpenedState.atom, false);
    jotaiStore.set(sidePanelPageState.atom, SidePanelPages.CommandMenuDisplay);
  });

  it('should navigate to SearchRecords when opening search', () => {
    const { result } = renderHook(() => useOpenRecordsSearchPageInSidePanel(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.openRecordsSearchPage();
    });

    expect(navigateSidePanelMenuMock).toHaveBeenCalledWith(
      expect.objectContaining({
        page: SidePanelPages.SearchRecords,
        pageTitle: 'Search',
        pageIcon: IconSearch,
      }),
    );
  });

  it('should open search when toggling while the search page is closed', () => {
    const { result } = renderHook(() => useOpenRecordsSearchPageInSidePanel(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.toggleRecordsSearchPage();
    });

    expect(navigateSidePanelMenuMock).toHaveBeenCalledWith(
      expect.objectContaining({
        page: SidePanelPages.SearchRecords,
      }),
    );
    expect(closeSidePanelMenuMock).not.toHaveBeenCalled();
  });

  it('should close search when toggling while the search page is open', () => {
    jotaiStore.set(isSidePanelOpenedState.atom, true);
    jotaiStore.set(sidePanelPageState.atom, SidePanelPages.SearchRecords);

    const { result } = renderHook(() => useOpenRecordsSearchPageInSidePanel(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.toggleRecordsSearchPage();
    });

    expect(closeSidePanelMenuMock).toHaveBeenCalled();
    expect(navigateSidePanelMenuMock).not.toHaveBeenCalled();
  });
});
