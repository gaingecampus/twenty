import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import {
  type IconComponent,
  IconComment,
  IconCommentFilled,
  IconHome,
  IconHomeFilled,
} from 'twenty-ui/icon';
import { ThemeContext, themeCssVariables } from 'twenty-ui/theme-constants';

import { useContext } from 'react';

import { agentChatThreadSearchQueryState } from '@/ai/states/agentChatThreadSearchQueryState';
import { useHasPermissionFlag } from '@/settings/roles/hooks/useHasPermissionFlag';
import { NavigationDrawerAnimatedCollapseWrapper } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerAnimatedCollapseWrapper';
import { navigationDrawerActiveTabState } from '@/ui/navigation/states/navigationDrawerActiveTabState';
import {
  type NavigationDrawerActiveTab,
  NAVIGATION_DRAWER_TABS,
} from '@/ui/navigation/states/navigationDrawerTabs';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { PermissionFlagType } from '~/generated-metadata/graphql';

const StyledTabsList = styled.div`
  align-items: stretch;
  background: var(--t-nav-tabs-bg, ${themeCssVariables.background.secondary});
  border: var(
    --t-nav-tabs-border,
    1px solid ${themeCssVariables.border.color.medium}
  );
  border-bottom: var(--t-nav-tabs-bottom-border, none);
  border-radius: var(
    --t-nav-tabs-radius,
    ${themeCssVariables.border.radius.pill}
  );
  box-sizing: border-box;
  display: flex;
  flex-shrink: 0;
  gap: var(--t-nav-tabs-gap, ${themeCssVariables.spacing[0.5]});
  height: var(--t-nav-tabs-height, ${themeCssVariables.spacing[7]});
  padding: var(--t-nav-tabs-padding, 3px);
  width: var(--t-nav-tabs-width, ${themeCssVariables.spacing[18]});
`;

const StyledTabWrapper = styled.div<{ isActive: boolean }>`
  align-items: center;
  background: ${({ isActive }) =>
    isActive
      ? `var(--t-nav-tabs-active-bg, ${themeCssVariables.background.transparent.light})`
      : 'transparent'};
  border-radius: var(
    --t-nav-tabs-inner-radius,
    calc(
      var(--t-nav-tabs-radius, ${themeCssVariables.border.radius.pill}) - 3px
    )
  );
  box-sizing: border-box;
  color: ${({ isActive }) =>
    isActive
      ? `var(--t-nav-tabs-active-color, ${themeCssVariables.font.color.primary})`
      : themeCssVariables.font.color.tertiary};
  cursor: pointer;
  display: flex;
  flex: var(--t-nav-tab-flex, 1);
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${({ isActive }) =>
    isActive
      ? `var(--t-tab-active-font-weight, ${themeCssVariables.font.weight.semiBold})`
      : themeCssVariables.font.weight.medium};
  gap: ${themeCssVariables.spacing[1]};
  height: var(--t-nav-tab-size, 100%);
  justify-content: center;
  min-width: 0;
  position: relative;
  width: auto;

  &::after {
    background: ${({ isActive }) =>
      isActive
        ? `var(--t-nav-tabs-active-underline, transparent)`
        : 'transparent'};
    bottom: 0;
    content: '';
    height: var(--t-tab-underline-height, 2px);
    left: 0;
    position: absolute;
    right: 0;
  }

  &:hover {
    background: ${({ isActive }) =>
      isActive
        ? `var(--t-nav-tabs-active-hover-bg, var(--t-nav-tabs-active-bg, ${themeCssVariables.background.transparent.light}))`
        : `var(--t-nav-tabs-inactive-hover-bg, transparent)`};
    color: ${({ isActive }) =>
      isActive
        ? `var(--t-nav-tabs-active-color, ${themeCssVariables.font.color.primary})`
        : themeCssVariables.font.color.secondary};
  }

  svg.tabler-icon {
    stroke-width: var(
      --t-nav-tabs-active-icon-stroke,
      var(--t-icon-stroke-md)
    );
  }
`;

const StyledTabIcon = styled.div`
  align-items: center;
  display: flex;
  flex-shrink: 0;
  height: ${themeCssVariables.spacing[5]};
  justify-content: center;
  width: ${themeCssVariables.spacing[5]};
`;

const StyledTabLabel = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

type MainNavigationDrawerTabsRowProps = {
  NavigationMenuTabIcon?: IconComponent;
  NavigationMenuTabActiveIcon?: IconComponent;
  navigationMenuTabLabel?: string;
};

export const MainNavigationDrawerTabsRow = ({
  NavigationMenuTabIcon = IconHome,
  NavigationMenuTabActiveIcon = IconHomeFilled,
  navigationMenuTabLabel = t`Home`,
}: MainNavigationDrawerTabsRowProps) => {
  const { theme } = useContext(ThemeContext);
  const [navigationDrawerActiveTab, setNavigationDrawerActiveTab] =
    useAtomState(navigationDrawerActiveTabState);
  const setSearchQuery = useSetAtomState(agentChatThreadSearchQueryState);
  const hasAiPermission = useHasPermissionFlag(PermissionFlagType.AI);
  const chatTabLabel = t`Chat`;
  const isNavigationMenuTabActive =
    navigationDrawerActiveTab === NAVIGATION_DRAWER_TABS.NAVIGATION_MENU;
  const isChatTabActive =
    navigationDrawerActiveTab === NAVIGATION_DRAWER_TABS.AI_CHAT_HISTORY;
  const NavigationMenuIcon = isNavigationMenuTabActive
    ? NavigationMenuTabActiveIcon
    : NavigationMenuTabIcon;
  const ChatTabIcon = isChatTabActive ? IconCommentFilled : IconComment;

  if (!hasAiPermission) {
    return null;
  }

  const handleTabChange = (tab: NavigationDrawerActiveTab) => {
    setNavigationDrawerActiveTab(tab);

    if (tab !== NAVIGATION_DRAWER_TABS.AI_CHAT_HISTORY) {
      setSearchQuery('');
    }
  };

  const handleTabClick = (tab: NavigationDrawerActiveTab) => () => {
    handleTabChange(tab);
  };

  const handleTabKeyDown =
    (tab: NavigationDrawerActiveTab) => (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleTabChange(tab);
      }
    };

  return (
    <NavigationDrawerAnimatedCollapseWrapper expandToFullWidth>
      <StyledTabsList role="tablist" aria-label={t`Navigation tabs`}>
        <StyledTabWrapper
          isActive={isNavigationMenuTabActive}
          role="tab"
          aria-selected={isNavigationMenuTabActive}
          aria-label={navigationMenuTabLabel}
          tabIndex={isNavigationMenuTabActive ? 0 : -1}
          onClick={handleTabClick(NAVIGATION_DRAWER_TABS.NAVIGATION_MENU)}
          onKeyDown={handleTabKeyDown(NAVIGATION_DRAWER_TABS.NAVIGATION_MENU)}
        >
          <StyledTabIcon>
            <NavigationMenuIcon
              size={theme.icon.size.md}
              color="currentColor"
            />
          </StyledTabIcon>
          <StyledTabLabel>{navigationMenuTabLabel}</StyledTabLabel>
        </StyledTabWrapper>
        <StyledTabWrapper
          isActive={isChatTabActive}
          role="tab"
          aria-selected={isChatTabActive}
          aria-label={chatTabLabel}
          tabIndex={isChatTabActive ? 0 : -1}
          onClick={handleTabClick(NAVIGATION_DRAWER_TABS.AI_CHAT_HISTORY)}
          onKeyDown={handleTabKeyDown(NAVIGATION_DRAWER_TABS.AI_CHAT_HISTORY)}
        >
          <StyledTabIcon>
            <ChatTabIcon size={theme.icon.size.md} color="currentColor" />
          </StyledTabIcon>
          <StyledTabLabel>{chatTabLabel}</StyledTabLabel>
        </StyledTabWrapper>
      </StyledTabsList>
    </NavigationDrawerAnimatedCollapseWrapper>
  );
};
