import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { type KeyboardEvent, type MouseEvent, useContext } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { IconSearch } from 'twenty-ui/icon';
import { SearchInput } from 'twenty-ui/input';
import { ThemeContext, themeCssVariables } from 'twenty-ui/theme-constants';
import { useIsMobile } from 'twenty-ui/utilities';

import { AiChatThreadFilterDropdown } from '@/ai/components/AiChatThreadFilterDropdown';
import { AI_CHAT_THREAD_ACTIONS_SURFACE } from '@/ai/constants/AiChatThreadActionsSurface';
import { agentChatThreadSearchQueryState } from '@/ai/states/agentChatThreadSearchQueryState';
import { useOpenRecordsSearchPageInSidePanel } from '@/side-panel/hooks/useOpenRecordsSearchPageInSidePanel';
import { isNavigationDrawerExpandedState } from '@/ui/navigation/states/isNavigationDrawerExpanded';
import { navigationDrawerActiveTabState } from '@/ui/navigation/states/navigationDrawerActiveTabState';
import { NAVIGATION_DRAWER_TABS } from '@/ui/navigation/states/navigationDrawerTabs';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

const StyledCollapsedSearchButton = styled.button`
  align-items: center;
  align-self: center;
  background-color: var(
    --t-search-bg,
    ${themeCssVariables.background.transparent.lighter}
  );
  border: 1px solid
    var(--t-search-border-color, ${themeCssVariables.border.color.medium});
  border-radius: var(
    --t-search-radius,
    ${themeCssVariables.border.radius.sm}
  );
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.light};
  cursor: pointer;
  display: flex;
  flex-shrink: 0;
  height: var(--t-search-height, ${themeCssVariables.spacing[8]});
  justify-content: center;
  padding: 0;
  width: var(--t-search-height, ${themeCssVariables.spacing[8]});

  &:focus-visible {
    background-color: var(
      --t-search-focus-bg,
      var(--t-search-bg, ${themeCssVariables.background.transparent.lighter})
    );
    border-color: ${themeCssVariables.color.blue};
    box-shadow: var(--t-search-focus-ring, none);
    outline: none;
  }
`;

const StyledSearchTrigger = styled.div`
  cursor: pointer;
  width: 100%;

  input {
    pointer-events: none;
  }

  &:focus {
    outline: none;
  }

  &:focus-visible > div > div:first-child {
    background-color: var(
      --t-search-focus-bg,
      var(--t-search-bg, ${themeCssVariables.background.transparent.lighter})
    );
    border-color: ${themeCssVariables.color.blue};
    box-shadow: var(--t-search-focus-ring, none);
  }
`;

export const MainNavigationDrawerSearchButton = () => {
  const { theme } = useContext(ThemeContext);
  const isMobile = useIsMobile();
  const isNavigationDrawerExpanded = useAtomStateValue(
    isNavigationDrawerExpandedState,
  );
  const navigationDrawerActiveTab = useAtomStateValue(
    navigationDrawerActiveTabState,
  );
  const [searchQuery, setSearchQuery] = useAtomState(
    agentChatThreadSearchQueryState,
  );
  const { openRecordsSearchPage } = useOpenRecordsSearchPageInSidePanel();
  const isExpanded = isNavigationDrawerExpanded || isMobile;
  const isChatTab =
    navigationDrawerActiveTab === NAVIGATION_DRAWER_TABS.AI_CHAT_HISTORY;
  const searchLabel = isChatTab ? t`Search chats` : t`Universal search`;

  const handleSearchTriggerRef = (element: HTMLDivElement | null) => {
    const input = element?.querySelector('input');

    if (!isDefined(input)) {
      return;
    }

    input.tabIndex = -1;
    input.setAttribute('aria-hidden', 'true');
  };

  const handleSearchMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    openRecordsSearchPage();
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    openRecordsSearchPage();
  };

  if (!isExpanded) {
    return (
      <StyledCollapsedSearchButton
        type="button"
        onClick={openRecordsSearchPage}
        aria-label={t`Universal search`}
      >
        <IconSearch size={theme.icon.size.md} color="currentColor" />
      </StyledCollapsedSearchButton>
    );
  }

  if (isChatTab) {
    return (
      <SearchInput
        placeholder={searchLabel}
        value={searchQuery}
        onChange={setSearchQuery}
        aria-label={searchLabel}
        filterButtonAriaLabel={t`Filter chats`}
        filterDropdown={(filterButton) => (
          <AiChatThreadFilterDropdown
            surface={AI_CHAT_THREAD_ACTIONS_SURFACE.NAV_DRAWER}
            clickableComponent={filterButton}
          />
        )}
      />
    );
  }

  return (
    <StyledSearchTrigger
      ref={handleSearchTriggerRef}
      role="button"
      tabIndex={0}
      aria-label={searchLabel}
      onMouseDown={handleSearchMouseDown}
      onKeyDown={handleSearchKeyDown}
    >
      <SearchInput
        placeholder={searchLabel}
        value=""
        onChange={() => undefined}
        aria-label={searchLabel}
      />
    </StyledSearchTrigger>
  );
};
