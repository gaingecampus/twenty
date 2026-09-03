import { isNavigationDrawerExpandedState } from '@/ui/navigation/states/isNavigationDrawerExpanded';
import { navigationDrawerActiveTabState } from '@/ui/navigation/states/navigationDrawerActiveTabState';
import { NAVIGATION_DRAWER_TABS } from '@/ui/navigation/states/navigationDrawerTabs';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import {
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarRightCollapse,
} from 'twenty-ui/icon';
import { IconButton } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledCollapseIconButton = styled(IconButton)`
  --icon-button-border-color: transparent;
  --icon-button-border-width: 0;
  --t-control-height-sm: var(
    --t-nav-collapse-size,
    var(--t-nav-tabs-height, ${themeCssVariables.spacing[8]})
  );
  height: var(
    --t-nav-collapse-size,
    var(--t-nav-tabs-height, ${themeCssVariables.spacing[8]})
  );
  min-width: var(
    --t-nav-collapse-size,
    var(--t-nav-tabs-height, ${themeCssVariables.spacing[8]})
  );
  width: var(
    --t-nav-collapse-size,
    var(--t-nav-tabs-height, ${themeCssVariables.spacing[8]})
  );
`;

type NavigationDrawerCollapseButtonProps = {
  className?: string;
  direction?: 'left' | 'right';
};

export const NavigationDrawerCollapseButton = ({
  className,
  direction = 'left',
}: NavigationDrawerCollapseButtonProps) => {
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

  return (
    <StyledCollapseIconButton
      className={className}
      Icon={CollapseIcon}
      size="small"
      variant="secondary"
      accent="default"
      ariaLabel={isNavigationDrawerExpanded ? t`Collapse` : t`Expand`}
      onClick={handleClick}
    />
  );
};
