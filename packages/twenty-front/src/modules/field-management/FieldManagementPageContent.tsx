import { useState } from 'react';
import {
  StyledStatusBoardContractTabs,
  StyledStatusBoardSoftTab,
  StyledStatusBoardScroll,
} from '@/status-board/components/statusBoardStyled';
import { FieldManagement } from './FieldManagement';
import { StatusBoardDummyDataProvider } from '@/status-board/components/StatusBoardDummyDataProvider';
import { StatusBoardFilterBar } from '@/status-board/components/StatusBoardFilterBar';
import { useStatusBoardDummyData } from '@/status-board/contexts/StatusBoardDummyDataContext';
import { useStatusBoardFilters } from '@/status-board/hooks/useStatusBoardFilters';
import { useStatusBoardMemberIds } from '@/status-board/hooks/useStatusBoardMemberIds';
import { useStatusBoardMembers } from '@/status-board/hooks/useStatusBoardMembers';
import { useStatusBoardMetadata } from '@/status-board/hooks/useStatusBoardMetadata';

export const FieldManagementPageContent = () => {
  const metadata = useStatusBoardMetadata();
  const { members } = useStatusBoardMembers({
    memberObjectMetadataItem: metadata.member,
  });
  return (
    <StatusBoardDummyDataProvider
      members={members}
      skipGroups={!metadata.group}
    >
      <FieldManagementPageBody metadata={metadata} />
    </StatusBoardDummyDataProvider>
  );
};

const FieldManagementPageBody = ({
  metadata,
}: {
  metadata: ReturnType<typeof useStatusBoardMetadata>;
}) => {
  const [contractStatus, setContractStatus] = useState<
    'PRE' | 'ACTIVE' | 'DONE'
  >('ACTIVE');
  const { members } = useStatusBoardDummyData();
  const filters = useStatusBoardFilters(members);
  const { visibleMembers, memberIds } = useStatusBoardMemberIds({
    members,
    selectedGroupIds: filters.selectedGroupIds,
    selectedMemberIds: filters.selectedMemberIds,
  });
  return (
    <StyledStatusBoardScroll>
      <StatusBoardFilterBar
        groupObjectMetadataItem={metadata.group}
        memberObjectMetadataItem={metadata.member}
        members={visibleMembers}
        selectedGroupIds={filters.selectedGroupIds}
        selectedMemberIds={filters.selectedMemberIds}
        onToggleGroupId={filters.toggleGroupId}
        onToggleMemberId={filters.toggleMemberId}
        onClearSelectedGroupIds={filters.clearSelectedGroupIds}
        onClearSelectedMemberIds={filters.clearSelectedMemberIds}
      />
      <StyledStatusBoardContractTabs aria-label="계약 상태">
        {(
          [
            ['PRE', '진행 전 계약'],
            ['ACTIVE', '현재 계약'],
            ['DONE', '종료 계약'],
          ] as const
        ).map(([value, label]) => (
          <StyledStatusBoardSoftTab
            key={value}
            type="button"
            isActive={contractStatus === value}
            aria-pressed={contractStatus === value}
            onClick={() => setContractStatus(value)}
          >
            {label}
          </StyledStatusBoardSoftTab>
        ))}
      </StyledStatusBoardContractTabs>
      <FieldManagement
        scope={{ contractList: true, memberIds, contractStatus }}
      />
    </StyledStatusBoardScroll>
  );
};
