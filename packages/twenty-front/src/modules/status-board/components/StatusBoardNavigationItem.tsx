import { MenuFavoriteButton } from '@/navigation-menu-item/display/components/MenuFavoriteButton';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useLocation } from 'react-router-dom';
import { IconLayoutDashboard, IconUser } from 'twenty-ui/icon';
import { AppPath } from 'twenty-shared/types';
import { NavigationDrawerItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';

export const StatusBoardNavigationItem = () => {
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const memberName = [
    currentWorkspaceMember?.name.firstName,
    currentWorkspaceMember?.name.lastName,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();
  const dashboardTitle = `${memberName || '내'} 대시보드`;
  const { pathname } = useLocation();

  return (
    <>
      <NavigationDrawerItem
        label={dashboardTitle}
        rightOptions={
          <MenuFavoriteButton
            label={dashboardTitle}
            path="/personal-dashboard"
            icon="IconUser"
          />
        }
        badgeLabel="준비중"
        Icon={IconUser}
        to="/personal-dashboard"
        active={pathname === '/personal-dashboard'}
      />
      <NavigationDrawerItem
        label="CRM 대시보드"
        rightOptions={
          <MenuFavoriteButton
            label="CRM 대시보드"
            path={AppPath.StatusBoard}
            icon="IconLayoutDashboard"
          />
        }
        Icon={IconLayoutDashboard}
        to={AppPath.StatusBoard}
        active={pathname === AppPath.StatusBoard}
      />
    </>
  );
};
