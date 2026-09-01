import { isNavigationDrawerExpandedState } from '@/ui/navigation/states/isNavigationDrawerExpanded';
import { navigationDrawerActiveTabState } from '@/ui/navigation/states/navigationDrawerActiveTabState';
import { NAVIGATION_DRAWER_TABS } from '@/ui/navigation/states/navigationDrawerTabs';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { type KeyboardEvent, useContext } from 'react';
import {
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarRightCollapse,
} from 'twenty-ui/icon';
import { ThemeContext, themeCssVariables } from 'twenty-ui/theme-constants';

const StyledCollapseButton = styled.div`
  align-items: center;
  background: transparent;
  border-radius: var(
    --t-nav-tabs-inner-radius,
    ${themeCssVariables.border.radius.sm}
  );
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.tertiary};
  cursor: pointer;
  display: flex;
  flex-shrink: 0;
  height: var(--t-nav-tab-size, ${themeCssVariables.spacing[8]});
  justify-content: center;
  user-select: none;
  width: var(--t-nav-tab-size, ${themeCssVariables.spacing[8]});

  &:hover {
    background: ${themeCssVariables.background.transparent.lighter};
  }

  svg.tabler-icon {
    stroke-width: var(
      --t-nav-tabs-active-icon-stroke,
      var(--t-icon-stroke-md)
    );
  }
`;

type NavigationDrawerCollapseButtonProps = {
  className?: string;
  direction?: 'left' | 'right';
};

export const NavigationDrawerCollapseButton = ({
  className,
  direction = 'left',
}: NavigationDrawerCollapseButtonProps) => {
  const { theme } = useContext(ThemeContext);
  const [isNavigationDrawerExpanded, setIsNavigationDrawerExpanded] =
    useAtomState(isNavigationDrawerExpandedState);
  const setNavigationDrawerActiveTab = useSetAtomState(
    navigationDrawerActiveTabState,
  );

  const CollapseIcon =
    direction === 'left'
      ? IconLayoutSidebarLeftCollapse
      : IconLayoutSidebarRightCollapse;

  const handleClick = () => {
    if (isNavigationDrawerExpanded) {
      setNavigationDrawerActiveTab(NAVIGATION_DRAWER_TABS.NAVIGATION_MENU);
    }
    setIsNavigationDrawerExpanded((previousIsExpanded) => !previousIsExpanded);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <StyledCollapseButton
      className={className}
      role="button"
      tabIndex={0}
      aria-label={
        isNavigationDrawerExpanded ? t`Collapse` : t`Expand`
      }
      data-nav-tab-icon="true"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <CollapseIcon size={theme.icon.size.md} color="currentColor" />
    </StyledCollapseButton>
  );
};
