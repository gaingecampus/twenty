import { MenuFavoriteButton } from '@/navigation-menu-item/display/components/MenuFavoriteButton';
import { NavigationDrawerItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';
import { useLocation } from 'react-router-dom';
import { IconMail } from 'twenty-ui/icon';

export const MailboxNavigationItem = () => {
  const { pathname } = useLocation();
  return (
    <NavigationDrawerItem
      label="메일함"
      rightOptions={
        <MenuFavoriteButton label="메일함" path="/mailbox" icon="IconMail" />
      }
      badgeLabel="준비중"
      Icon={IconMail}
      to="/mailbox"
      active={pathname === '/mailbox'}
    />
  );
};
