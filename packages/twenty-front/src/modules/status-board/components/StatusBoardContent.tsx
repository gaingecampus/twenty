import { hasStatusBoardField } from '@/status-board/utils/hasStatusBoardField';
import { StatusBoardCumulativeSection } from '@/status-board/components/StatusBoardCumulativeSection';
import { StatusBoardDummyDataProvider } from '@/status-board/components/StatusBoardDummyDataProvider';
import { useStatusBoardDummyData } from '@/status-board/contexts/StatusBoardDummyDataContext';
import { StatusBoardFilterBar } from '@/status-board/components/StatusBoardFilterBar';
import { StatusBoardListsSection } from '@/status-board/components/StatusBoardListsSection';
import { StatusBoardNowSection } from '@/status-board/components/StatusBoardNowSection';
import { StatusBoardPeriodSection } from '@/status-board/components/StatusBoardPeriodSection';
import {
  StatusBoardSheet,
  type StatusBoardSheetState,
} from '@/status-board/components/StatusBoardSheet';
import { StatusBoardWeekSection } from '@/status-board/components/StatusBoardWeekSection';
import {
  StyledStatusBoardScroll,
  StyledStatusBoardMuted,
} from '@/status-board/components/statusBoardStyled';
import { useStatusBoardFilters } from '@/status-board/hooks/useStatusBoardFilters';
import { useStatusBoardMemberIds } from '@/status-board/hooks/useStatusBoardMemberIds';
import { useStatusBoardMembers } from '@/status-board/hooks/useStatusBoardMembers';
import { useStatusBoardMetadata } from '@/status-board/hooks/useStatusBoardMetadata';
import {
  getStatusBoardMonthRange,
  getStatusBoardPeriodRange,
  getStatusBoardTodayIsoDate,
} from '@/status-board/utils/getStatusBoardPeriodRange';
import { SidePanelToggleButton } from '@/side-panel/components/SidePanelToggleButton';
import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageTitle } from '@/ui/utilities/page-title/components/PageTitle';
import { useState } from 'react';
import { IconLayoutDashboard } from 'twenty-ui/icon';
import { useTheme } from 'twenty-ui/theme-constants';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

export const StatusBoardContent = () => {
  const metadata = useStatusBoardMetadata();

  if (metadata.member === undefined) {
    return <StatusBoardContentLoaded members={[]} metadata={metadata} />;
  }

  return <StatusBoardContentWithMembers metadata={metadata} />;
};

const StatusBoardContentWithMembers = ({
  metadata,
}: {
  metadata: ReturnType<typeof useStatusBoardMetadata>;
}) => {
  const { members } = useStatusBoardMembers({
    memberObjectMetadataItem: metadata.member,
  });

  return <StatusBoardContentLoaded members={members} metadata={metadata} />;
};

const StatusBoardContentLoaded = ({
  members,
  metadata,
}: {
  members: ObjectRecord[];
  metadata: ReturnType<typeof useStatusBoardMetadata>;
}) => {
  return (
    <StatusBoardDummyDataProvider
      members={members}
      skipGroups={metadata.group === undefined}
    >
      <StatusBoardContentBody metadata={metadata} />
    </StatusBoardDummyDataProvider>
  );
};

const StatusBoardContentBody = ({
  metadata,
}: {
  metadata: ReturnType<typeof useStatusBoardMetadata>;
}) => {
  const theme = useTheme();
  const dummy = useStatusBoardDummyData();
  const filters = useStatusBoardFilters();
  const { visibleMembers, memberIds } = useStatusBoardMemberIds({
    members: dummy.members,
    selectedGroupIds: filters.selectedGroupIds,
    selectedMemberId: filters.selectedMemberId,
  });
  const [onboardingTab, setOnboardingTab] = useState<'ACTIVE' | 'PRE' | 'DONE'>(
    'ACTIVE',
  );
  const [sheet, setSheet] = useState<StatusBoardSheetState | undefined>(
    undefined,
  );

  const periodRange = getStatusBoardPeriodRange({
    periodType: filters.periodType,
    offset: filters.periodOffset,
  });
  const todayIsoDate = getStatusBoardTodayIsoDate();
  const monthRange = getStatusBoardMonthRange();

  return (
    <>
      <PageTitle title="현황판" />
      <PageCardLayout
        header={
          <PageCardHeader
            icon={<IconLayoutDashboard size={theme.icon.size.xl} />}
            title="현황판"
            actionButton={<SidePanelToggleButton />}
          />
        }
      >
        <StyledStatusBoardScroll>
          {dummy.enabled && (
            <StyledStatusBoardMuted>
              미리보기 · 예시 데이터
            </StyledStatusBoardMuted>
          )}
          <StatusBoardFilterBar
            groupObjectMetadataItem={metadata.group}
            memberObjectMetadataItem={metadata.member}
            members={visibleMembers}
            selectedGroupIds={filters.selectedGroupIds}
            selectedMemberId={filters.selectedMemberId}
            onToggleGroupId={filters.toggleGroupId}
            onSelectMemberId={filters.selectMemberId}
            onClearSelectedGroupIds={filters.clearSelectedGroupIds}
            onClearSelectedMemberId={filters.clearSelectedMemberId}
          />
          {filters.selectedGroupIds.length > 0 &&
            !hasStatusBoardField(metadata.member, 'currentGroup') &&
            !hasStatusBoardField(metadata.member, 'currentGroupId') && (
              <StyledStatusBoardMuted role="status">
                구성원의 소속 그룹 필드가 연결되지 않아 그룹별 현황을 표시할 수
                없어요.
              </StyledStatusBoardMuted>
            )}
          <StatusBoardNowSection
            depositObjectMetadataItem={metadata.deposit}
            opportunityObjectMetadataItem={metadata.opportunity}
            onboardingObjectMetadataItem={metadata.onboarding}
            memberIds={memberIds}
            selectedGroupIds={filters.selectedGroupIds}
            todayIsoDate={todayIsoDate}
            monthStartDate={monthRange.startDate}
            monthEndDate={monthRange.endDate}
            onOpenSheet={setSheet}
          />
          <StatusBoardListsSection
            depositObjectMetadataItem={metadata.deposit}
            opportunityObjectMetadataItem={metadata.opportunity}
            onboardingObjectMetadataItem={metadata.onboarding}
            memberIds={memberIds}
            selectedGroupIds={filters.selectedGroupIds}
            todayIsoDate={todayIsoDate}
            monthStartDate={monthRange.startDate}
            monthEndDate={monthRange.endDate}
            onboardingTab={onboardingTab}
            onOnboardingTabChange={setOnboardingTab}
          />
          <StatusBoardWeekSection
            onboardingObjectMetadataItem={metadata.onboarding}
            members={visibleMembers}
            memberIds={memberIds}
          />
          <StatusBoardPeriodSection
            depositObjectMetadataItem={metadata.deposit}
            opportunityObjectMetadataItem={metadata.opportunity}
            onboardingObjectMetadataItem={metadata.onboarding}
            memberIds={memberIds}
            selectedGroupIds={filters.selectedGroupIds}
            periodRange={periodRange}
            periodType={filters.periodType}
            periodOffset={filters.periodOffset}
            onSelectPeriodType={filters.selectPeriodType}
            onShiftPeriodOffset={(delta) =>
              filters.setPeriodOffset((currentOffset) =>
                Math.min(0, currentOffset + delta),
              )
            }
            onOpenSheet={setSheet}
          />
          <StatusBoardCumulativeSection
            companyObjectMetadataItem={metadata.company}
            personObjectMetadataItem={metadata.person}
            opportunityObjectMetadataItem={metadata.opportunity}
            onboardingObjectMetadataItem={metadata.onboarding}
            depositObjectMetadataItem={metadata.deposit}
            memberIds={memberIds}
            onOpenSheet={setSheet}
          />
        </StyledStatusBoardScroll>
      </PageCardLayout>
      {sheet !== undefined && (
        <StatusBoardSheet sheet={sheet} onClose={() => setSheet(undefined)} />
      )}
    </>
  );
};
