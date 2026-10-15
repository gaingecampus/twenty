import { MailboxNavigationItem } from '@/mailbox/components/MailboxNavigationItem';
import { StatusBoardNavigationItem } from '@/status-board/components/StatusBoardNavigationItem';
import { MyFieldsNavigationItem } from '@/field-management/FieldManagement';
import { NavigationMenuItemSection } from '@/navigation-menu-item/display/sections/components/NavigationMenuItemSection';
import { useNavigationSection } from '@/ui/navigation/navigation-drawer/hooks/useNavigationSection';
import { isNavigationDrawerExpandedState } from '@/ui/navigation/states/isNavigationDrawerExpanded';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useLingui } from '@lingui/react/macro';
import { NavigationDrawerOpenedSection } from '@/navigation-menu-item/display/sections/components/NavigationDrawerOpenedSection';
import { NavigationDrawerWorkspaceSectionSkeletonLoader } from '@/object-metadata/components/NavigationDrawerWorkspaceSectionSkeletonLoader';
import { TrashNavigationDrawerItem } from '@/trash/components/TrashNavigationDrawerItem';

import { styled } from '@linaria/react';
import { lazy, Suspense } from 'react';

import { themeCssVariables } from 'twenty-ui/theme-constants';

const FavoritesSectionDispatcher = lazy(() =>
  import('@/navigation-menu-item/display/sections/favorites/components/FavoritesSectionDispatcher').then(
    (module) => ({
      default: module.FavoritesSectionDispatcher,
    }),
  ),
);

const WorkspaceSectionDispatcher = lazy(() =>
  import('@/navigation-menu-item/display/sections/workspace/components/WorkspaceSectionDispatcher').then(
    (module) => ({
      default: module.WorkspaceSectionDispatcher,
    }),
  ),
);

const StyledScrollableItemsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--t-nav-section-gap, ${themeCssVariables.spacing[3]});
`;

export const MainNavigationDrawerScrollableItems = () => {
  const { t } = useLingui();
  const { isNavigationSectionOpen, toggleNavigationSection } =
    useNavigationSection('CrmOverview');
  const isNavigationDrawerExpanded = useAtomStateValue(
    isNavigationDrawerExpandedState,
  );

  return (
    <StyledScrollableItemsContainer>
      <NavigationDrawerOpenedSection />
      <Suspense fallback={<NavigationDrawerWorkspaceSectionSkeletonLoader />}>
        <FavoritesSectionDispatcher />
        <NavigationMenuItemSection
          title={t`현황 관리`}
          isOpen={isNavigationSectionOpen}
          onToggle={toggleNavigationSection}
          forceExpanded={!isNavigationDrawerExpanded}
        >
          <StatusBoardNavigationItem />
          <MyFieldsNavigationItem />
        </NavigationMenuItemSection>
        <MailboxNavigationItem />
        <WorkspaceSectionDispatcher />
        <TrashNavigationDrawerItem />
      </Suspense>
    </StyledScrollableItemsContainer>
  );
};
