import { styled } from '@linaria/react';

import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { MainNavigationDrawerNavigationContent } from '@/navigation/components/MainNavigationDrawerNavigationContent';
import { MainNavigationDrawerSearchButton } from '@/navigation/components/MainNavigationDrawerSearchButton';
import { MainNavigationDrawerTabsRow } from '@/navigation/components/MainNavigationDrawerTabsRow';
import { NavigationDrawerTabbedContent } from '@/navigation/components/NavigationDrawerTabbedContent';
import { useHasPermissionFlag } from '@/settings/roles/hooks/useHasPermissionFlag';
import { NavigationDrawer } from '@/ui/navigation/navigation-drawer/components/NavigationDrawer';
import { NavigationDrawerFixedContent } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerFixedContent';
import { NavigationDrawerScrollableContent } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerScrollableContent';
import { navigationDrawerActiveTabState } from '@/ui/navigation/states/navigationDrawerActiveTabState';
import { NAVIGATION_DRAWER_TABS } from '@/ui/navigation/states/navigationDrawerTabs';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { PermissionFlagType } from '~/generated-metadata/graphql';

const StyledChromeStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--t-nav-chrome-gap, ${themeCssVariables.spacing[2]});
  width: 100%;
`;

export const MainNavigationDrawer = ({ className }: { className?: string }) => {
  const navigationDrawerActiveTab = useAtomStateValue(
    navigationDrawerActiveTabState,
  );
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);
  const hasAiPermission = useHasPermissionFlag(PermissionFlagType.AI);

  const showAiChatContent =
    hasAiPermission &&
    navigationDrawerActiveTab === NAVIGATION_DRAWER_TABS.AI_CHAT_HISTORY;

  return (
    <NavigationDrawer
      className={className}
      title={currentWorkspace?.displayName ?? ''}
    >
      <NavigationDrawerFixedContent>
        <StyledChromeStack>
          <MainNavigationDrawerSearchButton />
          <MainNavigationDrawerTabsRow />
        </StyledChromeStack>
      </NavigationDrawerFixedContent>

      <NavigationDrawerScrollableContent>
        <NavigationDrawerTabbedContent
          showAiChatContent={showAiChatContent}
          shouldMountAiChatContent={hasAiPermission}
          navigationContent={<MainNavigationDrawerNavigationContent />}
        />
      </NavigationDrawerScrollableContent>
    </NavigationDrawer>
  );
};
