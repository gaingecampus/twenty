import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  max-height: 45vh;
  overflow-y: auto;
  padding-left: 8px;
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
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
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
        <>
          <StyledStatusBoardChipRow>
            <StyledStatusBoardChip
              type="button"
              isActive={false}
              aria-haspopup="dialog"
              onClick={() => setIsMemberModalOpen(true)}
            >
              구성원 선택 ·{' '}
              {selectedMemberIds.length > 0
                ? `${selectedMemberIds.length}명`
                : `전체 ${members.length}명`}
            </StyledStatusBoardChip>
            {members
              .filter((member) => selectedMemberIds.includes(member.id))
              .map((member) => (
                <StyledStatusBoardChip
                  key={member.id}
                  type="button"
                  isActive
                  variant="soft"
                  aria-label={`${getStatusBoardRecordLabel(member)} 선택 해제`}
                  onClick={() => onToggleMemberId(member.id)}
                >
                  {getStatusBoardRecordLabel(member)}{' '}
                  <span aria-hidden="true">×</span>
                </StyledStatusBoardChip>
              ))}
          </StyledStatusBoardChipRow>
          {isMemberModalOpen && (
            <StatusBoardMemberModal onClose={() => setIsMemberModalOpen(false)}>
              {shouldShowGroupChips && (
                <StatusBoardGroupChips
                  selectedGroupIds={selectedGroupIds}
                  onToggleGroupId={onToggleGroupId}
                  onClearSelectedGroupIds={onClearSelectedGroupIds}
                />
              )}
              <StatusBoardMemberChips
                members={members}
                selectedMemberIds={selectedMemberIds}
                onToggleMemberId={onToggleMemberId}
                onClearSelectedMemberIds={onClearSelectedMemberIds}
              />
            </StatusBoardMemberModal>
          )}
        </>
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
  const groupOrder = new Map(groups.map((group, index) => [group.id, index]));
  const memberGroups = [
    ...new Set(members.map((member) => getStatusBoardMemberGroupId(member))),
  ]
    .sort(
      (left, right) =>
        (groupOrder.get(left ?? '') ?? groups.length) -
        (groupOrder.get(right ?? '') ?? groups.length),
    )
    .map((groupId) => ({
      id: groupId ?? 'ungrouped',
      label:
        groups.find((group) => group.id === groupId)?.name ?? '소속 미지정',
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

const StyledMemberDialog = styled.dialog`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: 20px;
  box-shadow: ${themeCssVariables.boxShadow.strong};
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.primary};
  max-height: 85vh;
  padding: 24px;
  width: min(640px, calc(100vw - 32px));
  &::backdrop {
    background: ${themeCssVariables.background.transparent.primary};
  }
`;
const StyledMemberDialogBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;
const StyledMemberDialogHeader = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  h2 {
    font-size: 18px;
    margin: 0;
  }
`;
const StatusBoardMemberModal = ({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);
  return createPortal(
    <StyledMemberDialog
      ref={dialogRef}
      aria-labelledby="status-board-member-title"
      onCancel={onClose}
      onClose={onClose}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        ) {
          onClose();
        }
      }}
    >
      <StyledMemberDialogBody>
        <StyledMemberDialogHeader>
          <h2 id="status-board-member-title">구성원 선택</h2>
        </StyledMemberDialogHeader>
        {children}
      </StyledMemberDialogBody>
    </StyledMemberDialog>,
    document.body,
  );
};
