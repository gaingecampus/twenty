import { useMailboxChannels } from '@/mailbox/hooks/useMailboxChannels';
import { NavigationDrawerItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';
import { useLocation } from 'react-router-dom';
import { IconMail } from 'twenty-ui/icon';

export const MailboxNavigationItem = () => {
  const { channels } = useMailboxChannels();
  const { pathname } = useLocation();
  if (!channels.length) return null;
  return (
    <NavigationDrawerItem
      label="이메일"
      Icon={IconMail}
      to="/mailbox"
      active={pathname === '/mailbox'}
    />
  );
};
