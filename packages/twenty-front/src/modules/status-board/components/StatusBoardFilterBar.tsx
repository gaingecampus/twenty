import {
  StyledStatusBoardChip,
  StyledStatusBoardChipRow,
} from '@/status-board/components/statusBoardStyled';
import { useStatusBoardGroups } from '@/status-board/hooks/useStatusBoardGroups';
import { getStatusBoardRecordLabel } from '@/status-board/utils/getStatusBoardRecordLabel';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

type StatusBoardFilterBarProps = {
  groupObjectMetadataItem: EnrichedObjectMetadataItem | undefined;
  memberObjectMetadataItem: EnrichedObjectMetadataItem | undefined;
  members: ObjectRecord[];
  selectedGroupIds: string[];
  selectedMemberId: string | undefined;
  onToggleGroupId: (groupId: string) => void;
  onSelectMemberId: (memberId: string | undefined) => void;
  onClearSelectedGroupIds: () => void;
  onClearSelectedMemberId: () => void;
};

export const StatusBoardFilterBar = ({
  groupObjectMetadataItem,
  memberObjectMetadataItem,
  members,
  selectedGroupIds,
  selectedMemberId,
  onToggleGroupId,
  onSelectMemberId,
  onClearSelectedGroupIds,
  onClearSelectedMemberId,
}: StatusBoardFilterBarProps) => {
  return (
    <>
      {groupObjectMetadataItem !== undefined && (
        <StatusBoardGroupChips
          selectedGroupIds={selectedGroupIds}
          onToggleGroupId={onToggleGroupId}
          onClearSelectedGroupIds={onClearSelectedGroupIds}
        />
      )}
      {memberObjectMetadataItem !== undefined && (
        <StatusBoardMemberChips
          members={members}
          selectedMemberId={selectedMemberId}
          onSelectMemberId={onSelectMemberId}
          onClearSelectedMemberId={onClearSelectedMemberId}
        />
      )}
    </>
  );
};

const StatusBoardGroupChips = ({
  selectedGroupIds,
  onToggleGroupId,
  onClearSelectedGroupIds,
}: {
  selectedGroupIds: string[];
  onToggleGroupId: (groupId: string) => void;
  onClearSelectedGroupIds: () => void;
}) => {
  const { groups } = useStatusBoardGroups({ skip: false });

  return (
    <StyledStatusBoardChipRow>
      <StyledStatusBoardChip
        type="button"
        isActive={selectedGroupIds.length === 0}
        onClick={onClearSelectedGroupIds}
      >
        전체
      </StyledStatusBoardChip>
      {groups.map((group) => (
        <StyledStatusBoardChip
          key={group.id}
          type="button"
          isActive={selectedGroupIds.includes(group.id)}
          onClick={() => onToggleGroupId(group.id)}
        >
          {getStatusBoardRecordLabel(group)}
        </StyledStatusBoardChip>
      ))}
    </StyledStatusBoardChipRow>
  );
};

const StatusBoardMemberChips = ({
  members,
  selectedMemberId,
  onSelectMemberId,
  onClearSelectedMemberId,
}: {
  members: ObjectRecord[];
  selectedMemberId: string | undefined;
  onSelectMemberId: (memberId: string | undefined) => void;
  onClearSelectedMemberId: () => void;
}) => {
  return (
    <StyledStatusBoardChipRow>
      <StyledStatusBoardChip
        type="button"
        isActive={selectedMemberId === undefined}
        onClick={onClearSelectedMemberId}
      >
        {`전체 ${members.length}명`}
      </StyledStatusBoardChip>
      {members.map((member) => (
        <StyledStatusBoardChip
          key={member.id}
          type="button"
          isActive={selectedMemberId === member.id}
          onClick={() => onSelectMemberId(member.id)}
        >
          {getStatusBoardRecordLabel(member)}
        </StyledStatusBoardChip>
      ))}
    </StyledStatusBoardChipRow>
  );
};
