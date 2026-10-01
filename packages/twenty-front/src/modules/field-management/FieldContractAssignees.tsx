import { useContext } from 'react';
import { AuthContext } from '@/auth/contexts/AuthContext';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { StyledStatusBoardAvatarStack } from '@/status-board/components/statusBoardStyled';
import { getStatusBoardRecordLabel } from '@/status-board/utils/getStatusBoardRecordLabel';
import { AvatarOrIcon } from 'twenty-ui/data-display';
import { getAbsoluteImageUrl } from '~/utils/image/getAbsoluteImageUrl';
import { relationId } from './fieldManagementUtils';

export const FieldContractAssignees = ({
  members,
}: {
  members: ObjectRecord[];
}) => {
  const { currentWorkspaceMembers, currentWorkspaceDeletedMembers } =
    useContext(AuthContext);
  const accounts = [
    ...(currentWorkspaceMembers ?? []),
    ...(currentWorkspaceDeletedMembers ?? []),
  ];

  if (!members.length) return null;

  return (
    <StyledStatusBoardAvatarStack aria-label="계약 담당자">
      {members.map((member) => {
        const account = accounts.find(
          (item) => item.id === relationId(member.workspaceMemberAccountId),
        );
        const name = getStatusBoardRecordLabel(member);
        return (
          <span key={member.id} title={name} aria-label={name}>
            <AvatarOrIcon
              avatarType="rounded"
              avatarUrl={getAbsoluteImageUrl(account?.avatarUrl ?? '')}
              placeholder={name}
              placeholderColorSeed={member.id}
            />
          </span>
        );
      })}
    </StyledStatusBoardAvatarStack>
  );
};
