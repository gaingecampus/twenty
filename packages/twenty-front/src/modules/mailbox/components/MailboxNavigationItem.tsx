import { NavigationDrawerItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';
import { useLocation } from 'react-router-dom';
import { IconMail } from 'twenty-ui/icon';

export const MailboxNavigationItem = () => {
  const { pathname } = useLocation();
  return (
    <NavigationDrawerItem
      label="이메일"
      Icon={IconMail}
      to="/mailbox"
      active={pathname === '/mailbox'}
    />
  );
};
