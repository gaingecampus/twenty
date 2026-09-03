import { styled } from '@linaria/react';
import { type IconComponent } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { MainNavigationDrawerNewChatButton } from '@/navigation/components/MainNavigationDrawerNewChatButton';
import { MainNavigationDrawerSearchButton } from '@/navigation/components/MainNavigationDrawerSearchButton';
import { MainNavigationDrawerTabsRow } from '@/navigation/components/MainNavigationDrawerTabsRow';

const StyledChromeStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--t-nav-chrome-gap, ${themeCssVariables.spacing[2]});
  width: 100%;
`;

const StyledChromeRow = styled.div`
  align-items: center;
  background: var(--t-nav-chrome-row-bg, transparent);
  border: var(--t-nav-chrome-row-border, none);
  border-radius: var(--t-nav-chrome-row-radius, 0);
  box-sizing: border-box;
  display: flex;
  flex-shrink: 0;
  height: var(--t-nav-chrome-row-height, auto);
  justify-content: space-between;
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
  return (
    <StyledChromeStack>
      <StyledChromeRow>
        <MainNavigationDrawerTabsRow
          NavigationMenuTabIcon={NavigationMenuTabIcon}
          NavigationMenuTabActiveIcon={NavigationMenuTabActiveIcon}
          navigationMenuTabLabel={navigationMenuTabLabel}
        />
        <MainNavigationDrawerNewChatButton />
      </StyledChromeRow>
      <MainNavigationDrawerSearchButton />
    </StyledChromeStack>
  );
};
