import { StatusBoardRecordAvatar } from '@/status-board/components/StatusBoardRecordAvatar';
import { StyledStatusBoardAvatarStack } from '@/status-board/components/statusBoardStyled';
import { getStatusBoardRecordLabel } from '@/status-board/utils/getStatusBoardRecordLabel';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

export const StatusBoardConsultantAvatars = ({
  members,
  objectNameSingular,
}: {
  members: ObjectRecord[];
  objectNameSingular: string;
}) => (
  <StyledStatusBoardAvatarStack
    aria-label={members.map(getStatusBoardRecordLabel).join(', ')}
  >
    {members.map((member) => (
      <span key={member.id} title={getStatusBoardRecordLabel(member)}>
        <StatusBoardRecordAvatar
          record={member}
          objectNameSingular={objectNameSingular}
        />
      </span>
    ))}
  </StyledStatusBoardAvatarStack>
);
