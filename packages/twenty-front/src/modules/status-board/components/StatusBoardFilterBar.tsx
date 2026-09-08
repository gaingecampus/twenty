import {
  StyledStatusBoardToolbar,
  StyledStatusBoardMuted,
  StyledStatusBoardChip,
  StyledStatusBoardChipRow,
} from '@/status-board/components/statusBoardStyled';
import { useStatusBoardDummyData } from '@/status-board/contexts/StatusBoardDummyDataContext';
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
  const dummy = useStatusBoardDummyData();
  const shouldShowGroupChips =
    groupObjectMetadataItem !== undefined || dummy.enabled;
  const shouldShowMemberChips =
    memberObjectMetadataItem !== undefined || dummy.enabled;

  return (
    <StyledStatusBoardToolbar>
      {shouldShowGroupChips && (
        <StatusBoardGroupChips
          selectedGroupIds={selectedGroupIds}
          onToggleGroupId={onToggleGroupId}
          onClearSelectedGroupIds={onClearSelectedGroupIds}
        />
      )}
      {shouldShowMemberChips && (
        <StatusBoardMemberChips
          members={members}
          selectedMemberId={selectedMemberId}
          onSelectMemberId={onSelectMemberId}
          onClearSelectedMemberId={onClearSelectedMemberId}
        />
      )}
      <StyledStatusBoardMuted>
        {new Intl.DateTimeFormat('ko-KR', {
          month: 'long',
          day: 'numeric',
          weekday: 'long',
        }).format(new Date())}{' '}
        · 그룹을 여러 개 선택할 수 있어요
      </StyledStatusBoardMuted>
    </StyledStatusBoardToolbar>
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
  const { groups } = useStatusBoardDummyData();

  return (
    <StyledStatusBoardChipRow>
      <StyledStatusBoardChip
        type="button"
        isActive={selectedGroupIds.length === 0}
        aria-pressed={selectedGroupIds.length === 0}
        onClick={onClearSelectedGroupIds}
      >
        전체
      </StyledStatusBoardChip>
      {groups.map((group) => (
        <StyledStatusBoardChip
          key={group.id}
          type="button"
          isActive={selectedGroupIds.includes(group.id)}
          aria-pressed={selectedGroupIds.includes(group.id)}
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
        aria-pressed={selectedMemberId === undefined}
        onClick={onClearSelectedMemberId}
      >
        {`전체 ${members.length}명`}
      </StyledStatusBoardChip>
      {members.map((member) => (
        <StyledStatusBoardChip
          key={member.id}
          type="button"
          isActive={selectedMemberId === member.id}
          aria-pressed={selectedMemberId === member.id}
          onClick={() => onSelectMemberId(member.id)}
        >
          {getStatusBoardRecordLabel(member)}
        </StyledStatusBoardChip>
      ))}
    </StyledStatusBoardChipRow>
  );
};
