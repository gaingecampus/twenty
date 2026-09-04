import { styled } from '@linaria/react';
import { type IconComponent } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { MainNavigationDrawerNewChatButton } from '@/navigation/components/MainNavigationDrawerNewChatButton';
import { MainNavigationDrawerSearchButton } from '@/navigation/components/MainNavigationDrawerSearchButton';
import { MainNavigationDrawerTabsRow } from '@/navigation/components/MainNavigationDrawerTabsRow';
import { isNavigationDrawerExpandedState } from '@/ui/navigation/states/isNavigationDrawerExpanded';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

const StyledChromeStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--t-nav-chrome-gap, ${themeCssVariables.spacing[2]});
  width: 100%;
`;

// space-between must not be a var() fallback — stylis breaks var() when
// rewriting it for -webkit-box-pack, which fails lightningcss minify.
const StyledChromeRow = styled.div`
  align-items: center;
  background: var(--t-nav-chrome-row-bg, transparent);
  border: var(--t-nav-chrome-row-border, none);
  border-radius: var(--t-nav-chrome-row-radius, 0);
  box-sizing: border-box;
  container-name: nav-chrome;
  container-type: inline-size;
  display: flex;
  flex-shrink: 0;
  gap: 0;
  height: var(--t-nav-chrome-row-height, auto);
  justify-content: space-between;
  justify-content: var(--t-nav-chrome-pack);
  min-width: 0;
  padding: var(--t-nav-chrome-row-padding, 0);
  width: 100%;
`;

type MainNavigationDrawerChromeProps = {
  NavigationMenuTabIcon?: IconComponent;
  NavigationMenuTabActiveIcon?: IconComponent;
  navigationMenuTabLabel?: string;
};

export const MainNavigationDrawerChrome = ({
  NavigationMenuTabIcon,
  NavigationMenuTabActiveIcon,
  navigationMenuTabLabel,
}: MainNavigationDrawerChromeProps) => {
  const isNavigationDrawerExpanded = useAtomStateValue(
    isNavigationDrawerExpandedState,
  );

  return (
    <StyledChromeStack>
      <StyledChromeRow>
        {isNavigationDrawerExpanded && (
          <MainNavigationDrawerTabsRow
            NavigationMenuTabIcon={NavigationMenuTabIcon}
            NavigationMenuTabActiveIcon={NavigationMenuTabActiveIcon}
            navigationMenuTabLabel={navigationMenuTabLabel}
          />
        )}
        <MainNavigationDrawerNewChatButton />
      </StyledChromeRow>
      <MainNavigationDrawerSearchButton />
    </StyledChromeStack>
  );
};
