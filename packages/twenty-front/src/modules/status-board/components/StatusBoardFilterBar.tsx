import { getStatusBoardMemberGroupId } from '@/status-board/utils/getStatusBoardMemberGroupId';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { styled } from '@linaria/react';
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

const StyledMemberList = styled.div`
  max-height: 180px;
  overflow-y: auto;
  padding-top: 6px;
  scrollbar-gutter: stable;
`;

const StyledMemberOptions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 2px;
`;

type StatusBoardFilterBarProps = {
  groupObjectMetadataItem: EnrichedObjectMetadataItem | undefined;
  memberObjectMetadataItem: EnrichedObjectMetadataItem | undefined;
  members: ObjectRecord[];
  selectedGroupIds: string[];
  selectedMemberIds: string[];
  onToggleGroupId: (groupId: string) => void;
  onToggleMemberId: (memberId: string) => void;
  onClearSelectedGroupIds: () => void;
  onClearSelectedMemberIds: () => void;
};

export const StatusBoardFilterBar = ({
  groupObjectMetadataItem,
  memberObjectMetadataItem,
  members,
  selectedGroupIds,
  selectedMemberIds,
  onToggleGroupId,
  onToggleMemberId,
  onClearSelectedGroupIds,
  onClearSelectedMemberIds,
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
          selectedMemberIds={selectedMemberIds}
          onToggleMemberId={onToggleMemberId}
          onClearSelectedMemberIds={onClearSelectedMemberIds}
        />
      )}
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
    <StyledStatusBoardChipRow role="group" aria-label="그룹 선택">
      <StyledStatusBoardChip
        type="button"
        isActive={selectedGroupIds.length === 0}
        aria-pressed={selectedGroupIds.length === 0}
        onClick={onClearSelectedGroupIds}
      >
        전체 그룹
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

const StyledMemberGroup = styled.div`
  align-items: center;
  display: flex;
  gap: 12px;
  padding: 2px 0;
`;

const StyledMemberGroupName = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  flex: 0 0 88px;
  font-size: 12px;
  overflow-wrap: anywhere;
`;

const StatusBoardMemberChips = ({
  members,
  selectedMemberIds,
  onToggleMemberId,
  onClearSelectedMemberIds,
}: {
  members: ObjectRecord[];
  selectedMemberIds: string[];
  onToggleMemberId: (memberId: string) => void;
  onClearSelectedMemberIds: () => void;
}) => {
  const { groups } = useStatusBoardDummyData();
  const memberGroups = [
    ...new Set(members.map((member) => getStatusBoardMemberGroupId(member))),
  ].map((groupId) => ({
    id: groupId ?? 'ungrouped',
    label: groups.find((group) => group.id === groupId)?.name ?? '소속 미지정',
    members: members.filter(
      (member) => getStatusBoardMemberGroupId(member) === groupId,
    ),
  }));
  return (
    <div role="group" aria-label="구성원 선택">
      <StyledStatusBoardChipRow>
        <StyledStatusBoardChip
          type="button"
          isActive={selectedMemberIds.length === 0}
          aria-pressed={selectedMemberIds.length === 0}
          onClick={onClearSelectedMemberIds}
        >
          {`전체 구성원 ${members.length}명`}
        </StyledStatusBoardChip>
        {selectedMemberIds.length > 0 && (
          <StyledStatusBoardMuted>{`${selectedMemberIds.length}명 선택`}</StyledStatusBoardMuted>
        )}
      </StyledStatusBoardChipRow>
      <StyledMemberList>
        {memberGroups.map((group) => (
          <StyledMemberGroup
            key={group.id}
            role="group"
            aria-label={String(group.label)}
          >
            <StyledMemberGroupName>{String(group.label)}</StyledMemberGroupName>
            <StyledMemberOptions>
              {group.members.map((member) => (
                <StyledStatusBoardChip
                  key={member.id}
                  type="button"
                  variant="soft"
                  isActive={selectedMemberIds.includes(member.id)}
                  aria-pressed={selectedMemberIds.includes(member.id)}
                  onClick={() => onToggleMemberId(member.id)}
                >
                  {selectedMemberIds.includes(member.id) && (
                    <span aria-hidden="true">✓ </span>
                  )}
                  {getStatusBoardRecordLabel(member)}
                </StyledStatusBoardChip>
              ))}
            </StyledMemberOptions>
          </StyledMemberGroup>
        ))}
      </StyledMemberList>
      {members.length === 0 && (
        <StyledStatusBoardMuted>
          선택한 그룹에 구성원이 없어요.
        </StyledStatusBoardMuted>
      )}
    </div>
  );
};
