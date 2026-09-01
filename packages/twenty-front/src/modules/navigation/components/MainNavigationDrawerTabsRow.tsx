import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import {
  type IconComponent,
  IconComment,
  IconCommentFilled,
  IconHome,
  IconHomeFilled,
  IconMessageCirclePlus,
} from 'twenty-ui/icon';
import { OverflowingTextWithTooltip } from 'twenty-ui/surfaces';
import { ThemeContext, themeCssVariables } from 'twenty-ui/theme-constants';
import { useIsMobile } from 'twenty-ui/utilities';

import { useContext } from 'react';

import { useSwitchToNewAiChat } from '@/ai/hooks/useSwitchToNewAiChat';
import { agentChatThreadSearchQueryState } from '@/ai/states/agentChatThreadSearchQueryState';
import { useHasPermissionFlag } from '@/settings/roles/hooks/useHasPermissionFlag';
import { NavigationDrawerAnimatedCollapseWrapper } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerAnimatedCollapseWrapper';
import { isNavigationDrawerExpandedState } from '@/ui/navigation/states/isNavigationDrawerExpanded';
import { navigationDrawerActiveTabState } from '@/ui/navigation/states/navigationDrawerActiveTabState';
import {
  type NavigationDrawerActiveTab,
  NAVIGATION_DRAWER_TABS,
} from '@/ui/navigation/states/navigationDrawerTabs';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { PermissionFlagType } from '~/generated-metadata/graphql';

const StyledRow = styled.div<{ isExpanded: boolean }>`
  align-items: center;
  box-sizing: border-box;
  display: flex;
  gap: ${({ isExpanded }) =>
    isExpanded
      ? `var(--t-nav-chrome-gap, ${themeCssVariables.spacing[2]})`
      : 0};
  justify-content: ${({ isExpanded }) =>
    isExpanded
      ? 'var(--t-nav-chrome-justify, space-between)'
      : 'center'};
  min-height: ${({ isExpanded }) =>
    isExpanded ? `var(--t-nav-row-min-height, auto)` : 'auto'};
  padding-left: var(--t-nav-tabs-align-inset, 0);
  transition: gap calc(${themeCssVariables.animation.duration.normal} * 1s) ease;
  width: ${({ isExpanded }) => (isExpanded ? '100%' : 'max-content')};
`;

const StyledTabsPill = styled.div`
  align-items: center;
  background: var(--t-nav-tabs-bg, ${themeCssVariables.background.secondary});
  border: var(
    --t-nav-tabs-border,
    1px solid ${themeCssVariables.border.color.medium}
  );
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
  color: ${({ isActive }) =>
    isActive
      ? `var(--t-nav-tabs-active-color, ${themeCssVariables.font.color.primary})`
      : themeCssVariables.font.color.tertiary};
  box-sizing: border-box;
  cursor: pointer;
  display: flex;
  flex: var(--t-nav-tab-flex, 1);
  height: var(--t-nav-tab-size, 100%);
  justify-content: center;
  min-width: var(--t-nav-tab-size, 0);
  width: var(--t-nav-tab-size, auto);

  &:hover {
    background: ${({ isActive }) =>
      isActive
        ? `var(--t-nav-tabs-active-hover-bg, var(--t-nav-tabs-active-bg, ${themeCssVariables.background.transparent.light}))`
        : themeCssVariables.background.transparent.lighter};
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
  height: ${themeCssVariables.spacing[5]};
  justify-content: center;
  width: ${themeCssVariables.spacing[5]};
`;

const StyledNewChatIcon = styled.div`
  align-items: center;
  display: flex;
  flex-grow: 0;
  flex-shrink: 0;
  justify-content: center;

  svg.tabler-icon {
    stroke-width: var(--t-nav-new-chat-icon-stroke, 2.25);
  }
`;

const StyledNewChatButtonWrapper = styled.div<{
  isExpanded: boolean;
  isEmphasized: boolean;
}>`
  align-items: center;
  background: ${({ isEmphasized }) =>
    isEmphasized
      ? `var(--t-nav-new-chat-bg, ${themeCssVariables.background.secondary})`
      : `var(
          --t-nav-new-chat-quiet-bg,
          var(--t-nav-new-chat-bg, ${themeCssVariables.background.secondary})
        )`};
  border: ${({ isEmphasized }) =>
    isEmphasized
      ? `var(
          --t-nav-new-chat-border,
          1px solid ${themeCssVariables.border.color.medium}
        )`
      : `var(
          --t-nav-new-chat-quiet-border,
          var(
            --t-nav-new-chat-border,
            1px solid ${themeCssVariables.border.color.medium}
          )
        )`};
  border-radius: var(
    --t-nav-new-chat-radius,
    var(--t-nav-tabs-radius, ${themeCssVariables.border.radius.pill})
  );
  box-sizing: border-box;
  display: flex;
  flex: ${({ isExpanded }) =>
    isExpanded ? 'var(--t-nav-new-chat-flex, 0 0 auto)' : '0 0 auto'};
  height: ${({ isExpanded }) =>
    isExpanded
      ? `var(--t-nav-tabs-height, ${themeCssVariables.spacing[7]})`
      : `var(
          --t-nav-new-chat-collapsed-size,
          ${themeCssVariables.spacing[6]}
        )`};
  justify-content: center;
  min-width: ${({ isExpanded }) =>
    isExpanded
      ? 'var(--t-nav-new-chat-min-width, 0)'
      : `var(
          --t-nav-new-chat-collapsed-size,
          ${themeCssVariables.spacing[6]}
        )`};
  padding: ${({ isExpanded }) =>
    isExpanded
      ? 'var(--t-nav-new-chat-padding, 3px)'
      : `var(
          --t-nav-new-chat-collapsed-padding,
          ${themeCssVariables.spacing[0.5]}
        )`};
  transition:
    height calc(${themeCssVariables.animation.duration.normal} * 1s) ease,
    padding calc(${themeCssVariables.animation.duration.normal} * 1s) ease;
  width: ${({ isExpanded, isEmphasized }) => {
    if (!isExpanded) {
      return `var(
        --t-nav-new-chat-collapsed-size,
        ${themeCssVariables.spacing[6]}
      )`;
    }

    if (isEmphasized) {
      return 'var(--t-nav-new-chat-width, 103px)';
    }

    return `var(
      --t-nav-new-chat-quiet-width,
      var(--t-nav-tabs-height, ${themeCssVariables.spacing[7]})
    )`;
  }};
`;

const StyledNewChatButton = styled.div<{ isEmphasized: boolean }>`
  align-items: center;
  border-radius: inherit;
  color: ${({ isEmphasized }) =>
    isEmphasized
      ? `var(--t-nav-new-chat-color, ${themeCssVariables.font.color.secondary})`
      : `var(
          --t-nav-new-chat-quiet-color,
          var(--t-nav-new-chat-color, ${themeCssVariables.font.color.secondary})
        )`};
  cursor: pointer;
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: var(
    --t-nav-new-chat-font-weight,
    ${themeCssVariables.font.weight.medium}
  );
  gap: ${themeCssVariables.spacing[1]};
  height: 100%;
  justify-content: center;
  min-width: 0;
  overflow: hidden;
  padding-inline: ${({ isEmphasized }) =>
    isEmphasized
      ? `var(--t-nav-new-chat-padding-x, ${themeCssVariables.spacing[2]})`
      : '0'};
  transition:
    background calc(${themeCssVariables.animation.duration.fast} * 1s) ease,
    color calc(${themeCssVariables.animation.duration.fast} * 1s) ease;
  width: 100%;

  &:hover {
    background: ${({ isEmphasized }) =>
      isEmphasized
        ? `var(
            --t-nav-new-chat-hover-bg,
            ${themeCssVariables.background.transparent.light}
          )`
        : `var(
            --t-nav-new-chat-quiet-hover-bg,
            var(
              --t-nav-new-chat-hover-bg,
              ${themeCssVariables.background.transparent.light}
            )
          )`};
    color: ${({ isEmphasized }) =>
      isEmphasized
        ? `var(
            --t-nav-new-chat-hover-color,
            var(--t-nav-new-chat-color, ${themeCssVariables.font.color.primary})
          )`
        : `var(
            --t-nav-new-chat-quiet-hover-color,
            var(
              --t-nav-new-chat-hover-color,
              var(--t-nav-new-chat-color, ${themeCssVariables.font.color.primary})
            )
          )`};
  }
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
  const isMobile = useIsMobile();
  const isNavigationDrawerExpanded = useAtomStateValue(
    isNavigationDrawerExpandedState,
  );
  const [navigationDrawerActiveTab, setNavigationDrawerActiveTab] =
    useAtomState(navigationDrawerActiveTabState);
  const { switchToNewChat } = useSwitchToNewAiChat();
  const setIsNavigationDrawerExpanded = useSetAtomState(
    isNavigationDrawerExpandedState,
  );
  const setSearchQuery = useSetAtomState(agentChatThreadSearchQueryState);
  const hasAiPermission = useHasPermissionFlag(PermissionFlagType.AI);

  const isExpanded = isNavigationDrawerExpanded || isMobile;
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

  const handleNewChatClick = () => {
    if (isMobile) {
      setIsNavigationDrawerExpanded(false);
    }
    switchToNewChat();
  };

  const handleNewChatKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleNewChatClick();
    }
  };

  return (
    <StyledRow isExpanded={isExpanded}>
      <NavigationDrawerAnimatedCollapseWrapper>
        <StyledTabsPill role="tablist" aria-label={t`Navigation tabs`}>
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
              <ChatTabIcon
                size={theme.icon.size.md}
                color="currentColor"
              />
            </StyledTabIcon>
          </StyledTabWrapper>
        </StyledTabsPill>
      </NavigationDrawerAnimatedCollapseWrapper>
      <StyledNewChatButtonWrapper isExpanded={isExpanded} isEmphasized={true}>
        <StyledNewChatButton
          role="button"
          tabIndex={0}
          aria-label={t`New chat`}
          isEmphasized={true}
          onClick={handleNewChatClick}
          onKeyDown={handleNewChatKeyDown}
        >
          <StyledNewChatIcon data-nav-new-chat-icon="true">
            <IconMessageCirclePlus
              size={theme.icon.size.md}
              stroke={theme.icon.stroke.lg}
              color="currentColor"
            />
          </StyledNewChatIcon>
          {isExpanded && <OverflowingTextWithTooltip text={t`New chat`} />}
        </StyledNewChatButton>
      </StyledNewChatButtonWrapper>
    </StyledRow>
  );
};
