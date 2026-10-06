import { useLocation } from 'react-router-dom';
import { IconLayoutDashboard } from 'twenty-ui/icon';
import { AppPath } from 'twenty-shared/types';
import { NavigationDrawerItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';

export const StatusBoardNavigationItem = () => {
  const { pathname } = useLocation();

  return (
    <NavigationDrawerItem
      label="CRM 대시보드"
      Icon={IconLayoutDashboard}
      to={AppPath.StatusBoard}
      active={pathname === AppPath.StatusBoard}
    />
  );
};
