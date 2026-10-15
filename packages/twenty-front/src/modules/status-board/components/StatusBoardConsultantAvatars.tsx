import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { StatusBoardRecordAvatar } from '@/status-board/components/StatusBoardRecordAvatar';
import { StyledStatusBoardAvatarStack } from '@/status-board/components/statusBoardStyled';
import { getStatusBoardRecordLabel } from '@/status-board/utils/getStatusBoardRecordLabel';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

const StyledNamedMembers = styled(StyledStatusBoardAvatarStack)`
  flex-shrink: 1;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  max-width: 45%;
  min-width: 0;
`;

const StyledMember = styled.span`
  align-items: center;
  display: inline-flex;
  gap: ${themeCssVariables.spacing[1]};
  min-width: 0;
`;

const StyledMemberName = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  overflow-wrap: anywhere;
`;

export const StatusBoardConsultantAvatars = ({
  members,
  objectNameSingular,
  showNames = false,
}: {
  showNames?: boolean;
  members: ObjectRecord[];
  objectNameSingular: string;
}) => {
  const Container = showNames
    ? StyledNamedMembers
    : StyledStatusBoardAvatarStack;
  return (
    <Container aria-label={members.map(getStatusBoardRecordLabel).join(', ')}>
      {members.map((member) => (
        <StyledMember key={member.id}>
          <StatusBoardRecordAvatar
            record={member}
            objectNameSingular={objectNameSingular}
          />
          {showNames && (
            <StyledMemberName>
              {getStatusBoardRecordLabel(member)}
            </StyledMemberName>
          )}
        </StyledMember>
      ))}
    </Container>
  );
};
