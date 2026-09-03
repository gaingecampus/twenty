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
      <MainNavigationDrawerTabsRow
        NavigationMenuTabIcon={NavigationMenuTabIcon}
        NavigationMenuTabActiveIcon={NavigationMenuTabActiveIcon}
        navigationMenuTabLabel={navigationMenuTabLabel}
      />
      <MainNavigationDrawerSearchButton />
      <MainNavigationDrawerNewChatButton />
    </StyledChromeStack>
  );
};
