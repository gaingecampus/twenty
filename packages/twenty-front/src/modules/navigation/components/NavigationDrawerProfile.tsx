import { currentUserState } from '@/auth/states/currentUserState';
import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useNavigationDrawerExpanded } from '@/navigation/hooks/useNavigationDrawerExpanded';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { styled } from '@linaria/react';
import { Link } from 'react-router-dom';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import { Avatar } from 'twenty-ui/data-display';
import { IconSettings } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { getAbsoluteImageUrl } from '~/utils/image/getAbsoluteImageUrl';

const StyledProfile = styled(Link)`
  align-items: center;
  border-top: 1px solid ${themeCssVariables.border.color.light};
  color: ${themeCssVariables.font.color.primary};
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  min-width: 0;
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[2]};
  text-decoration: none;
  > :first-child,
  > svg {
    flex-shrink: 0;
  }
  &[data-expanded='false'] {
    justify-content: center;
  }
  &:hover {
    background: ${themeCssVariables.background.secondary};
  }
  &:focus-visible {
    outline: 2px solid ${themeCssVariables.color.blue};
    outline-offset: -2px;
  }
`;
const StyledIdentity = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  min-width: 0;
  strong,
  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  strong {
    font-weight: ${themeCssVariables.font.weight.medium};
  }
  span {
    color: ${themeCssVariables.font.color.secondary};
    font-size: ${themeCssVariables.font.size.sm};
  }
`;

export const NavigationDrawerProfile = () => {
  const currentUser = useAtomStateValue(currentUserState);
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const expanded = useNavigationDrawerExpanded();
  if (!currentUser) return null;
  const name =
    [
      currentWorkspaceMember?.name.firstName ?? currentUser.firstName,
      currentWorkspaceMember?.name.lastName ?? currentUser.lastName,
    ]
      .filter(Boolean)
      .join(' ') || currentUser.email;
  return (
    <StyledProfile
      to={getSettingsPath(SettingsPath.ProfilePage)}
      data-expanded={expanded}
      aria-label={`${name} · 내 프로필 설정`}
      title={`${name}\n${currentUser.email}\n내 프로필 설정`}
    >
      <Avatar
        avatarUrl={getAbsoluteImageUrl(currentWorkspaceMember?.avatarUrl)}
        placeholder={name}
        placeholderColorSeed={currentUser.id}
        type="rounded"
        size="md"
      />
      {expanded && (
        <>
          <StyledIdentity>
            <strong>{name}</strong>
            <span>{currentUser.email}</span>
          </StyledIdentity>
          <IconSettings size={16} aria-hidden />
        </>
      )}
    </StyledProfile>
  );
};
