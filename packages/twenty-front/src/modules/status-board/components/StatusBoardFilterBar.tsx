import { useState } from 'react';
import { styled } from '@linaria/react';
import {
  StyledStatusBoardSearch,
  StyledStatusBoardToolbar,
  StyledStatusBoardMuted,
  StyledStatusBoardChip,
  StyledStatusBoardChipRow,
} from '@/status-board/components/statusBoardStyled';
import { useStatusBoardDummyData } from '@/status-board/contexts/StatusBoardDummyDataContext';
import { getStatusBoardRecordLabel } from '@/status-board/utils/getStatusBoardRecordLabel';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

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
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(false);
  const matchingMembers = members.filter((member) =>
    getStatusBoardRecordLabel(member)
      .toLocaleLowerCase()
      .includes(search.trim().toLocaleLowerCase()),
  );
  const selectedMember = members.find(
    (member) => member.id === selectedMemberId,
  );

  return (
    <>
      <StyledStatusBoardChipRow>
        <StyledStatusBoardChip
          type="button"
          isActive={selectedMemberId === undefined}
          aria-pressed={selectedMemberId === undefined}
          onClick={onClearSelectedMemberId}
        >
          {`전체 구성원 ${members.length}명`}
        </StyledStatusBoardChip>
        {selectedMember && (
          <StyledStatusBoardChip
            type="button"
            isActive
            aria-pressed
            onClick={onClearSelectedMemberId}
            aria-label={`${getStatusBoardRecordLabel(selectedMember)} 선택 해제`}
          >
            {getStatusBoardRecordLabel(selectedMember)} ×
          </StyledStatusBoardChip>
        )}
        <StyledStatusBoardChip
          isActive={expanded}
          variant="soft"
          type="button"
          aria-expanded={expanded}
          onClick={() => {
            setExpanded(!expanded);
            setSearch('');
          }}
        >
          {expanded ? '구성원 선택 닫기' : '구성원 찾기'}
        </StyledStatusBoardChip>
      </StyledStatusBoardChipRow>
      {expanded && (
        <>
          <StyledStatusBoardSearch
            type="search"
            aria-label="구성원 이름 검색"
            placeholder="구성원 이름으로 검색"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <StyledMemberOptions>
            {matchingMembers.slice(0, 12).map((member) => (
              <StyledStatusBoardChip
                key={member.id}
                type="button"
                isActive={selectedMemberId === member.id}
                aria-pressed={selectedMemberId === member.id}
                onClick={() => {
                  onSelectMemberId(member.id);
                  setExpanded(false);
                  setSearch('');
                }}
              >
                {getStatusBoardRecordLabel(member)}
              </StyledStatusBoardChip>
            ))}
          </StyledMemberOptions>
          <StyledStatusBoardMuted role="status">
            {matchingMembers.length === 0
              ? '일치하는 구성원이 없어요. 이름이나 그룹을 확인해 주세요.'
              : matchingMembers.length > 12
                ? `${matchingMembers.length}명 중 12명 표시 · 이름을 입력해 범위를 좁혀 보세요`
                : `${matchingMembers.length}명`}
          </StyledStatusBoardMuted>
        </>
      )}
    </>
  );
};
