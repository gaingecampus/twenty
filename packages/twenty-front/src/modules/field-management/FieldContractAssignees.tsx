import { ActorDisplay } from '@/ui/field/display/components/ActorDisplay';
import { useContext, useId } from 'react';
import { AuthContext } from '@/auth/contexts/AuthContext';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { styled } from '@linaria/react';
import { getStatusBoardRecordLabel } from '@/status-board/utils/getStatusBoardRecordLabel';
import { AvatarOrIcon } from 'twenty-ui/data-display';
import { AppTooltip } from 'twenty-ui/surfaces';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { getAbsoluteImageUrl } from '~/utils/image/getAbsoluteImageUrl';
import { relationId } from './fieldManagementUtils';

const StyledAssignees = styled.span`
  align-items: center;
  display: inline-flex;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.regular};
  line-height: 20px;
`;

const StyledAvatar = styled.span`
  --t-avatar-size-sm: 20px;
  background: ${themeCssVariables.background.primary};
  border: 2px solid ${themeCssVariables.background.primary};
  border-radius: 50%;
  display: inline-flex;
  position: relative;
  &:not(:first-child) {
    margin-left: -6px;
  }
  &:hover,
  &:focus-visible {
    z-index: 1;
  }
`;

export const FieldContractAssignees = ({
  members,
}: {
  members: ObjectRecord[];
}) => {
  const tooltipId = useId().replace(/:/g, '');
  const { currentWorkspaceMembers, currentWorkspaceDeletedMembers } =
    useContext(AuthContext);
  const accounts = [
    ...(currentWorkspaceMembers ?? []),
    ...(currentWorkspaceDeletedMembers ?? []),
  ];

  if (!members.length) return null;

  if (members.length === 1) {
    const member = members[0];
    const account = accounts.find(
      (item) => item.id === relationId(member.workspaceMemberAccountId),
    );
    return (
      <StyledAssignees>
        <ActorDisplay
          name={
            account
              ? [account.name.firstName, account.name.lastName]
                  .filter(Boolean)
                  .join(' ') || getStatusBoardRecordLabel(member)
              : getStatusBoardRecordLabel(member)
          }
          workspaceMemberId={account?.id ?? member.id}
          avatarUrl={account?.avatarUrl}
        />
      </StyledAssignees>
    );
  }

  return (
    <StyledAssignees aria-label="계약 담당자">
      {members.map((member) => {
        const account = accounts.find(
          (item) => item.id === relationId(member.workspaceMemberAccountId),
        );
        const name = account
          ? [account.name.firstName, account.name.lastName]
              .filter(Boolean)
              .join(' ') || getStatusBoardRecordLabel(member)
          : getStatusBoardRecordLabel(member);
        return (
          <StyledAvatar
            key={member.id}
            id={`${tooltipId}-${member.id}`}
            aria-label={name}
            tabIndex={0}
          >
            <AvatarOrIcon
              avatarType="rounded"
              placeholder={name}
              placeholderColorSeed={account?.id ?? member.id}
              avatarUrl={getAbsoluteImageUrl(account?.avatarUrl ?? '')}
            />
            <AppTooltip
              anchorSelect={`[id="${tooltipId}-${member.id}"]`}
              content={name}
              place="top"
            />
          </StyledAvatar>
        );
      })}
    </StyledAssignees>
  );
};
