import { StatusBoardEmptyState } from '@/status-board/components/StatusBoardEmptyState';
import { StatusBoardStageTimingSection } from '@/status-board/components/StatusBoardStageTimingSection';
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
  const filters = useStatusBoardFilters(dummy.members);
  const { visibleMembers, memberIds } = useStatusBoardMemberIds({
    members: dummy.members,
    selectedGroupIds: filters.selectedGroupIds,
    selectedMemberIds: filters.selectedMemberIds,
  });
  const [onboardingTab, setOnboardingTab] = useState<'ACTIVE' | 'PRE' | 'DONE'>(
    'ACTIVE',
  );
  const [sheet, setSheet] = useState<StatusBoardSheetState | undefined>(
    undefined,
  );

  const isGroupUnavailable =
    !dummy.enabled &&
    filters.selectedGroupIds.length > 0 &&
    !hasStatusBoardField(metadata.member, 'currentGroup') &&
    !hasStatusBoardField(metadata.member, 'currentGroupId');

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
            selectedMemberIds={filters.selectedMemberIds}
            onToggleGroupId={filters.toggleGroupId}
            onToggleMemberId={filters.toggleMemberId}
            onClearSelectedGroupIds={filters.clearSelectedGroupIds}
            onClearSelectedMemberIds={filters.clearSelectedMemberIds}
          />
          {isGroupUnavailable ? (
            <StatusBoardEmptyState
              title="그룹별 현황을 아직 확인할 수 없어요"
              description="구성원의 소속 그룹 정보가 연결되어 있지 않아요. 전체 그룹으로 조회하거나 관리자에게 소속 정보 연결을 요청해 주세요."
              variant="connection"
              actionLabel="전체 그룹 현황 보기"
              onAction={filters.clearSelectedGroupIds}
            />
          ) : (
            <>
              <StatusBoardNowSection
                onOpenSheet={setSheet}
                opportunityObjectMetadataItem={metadata.opportunity}
                onboardingObjectMetadataItem={metadata.onboarding}
                memberIds={memberIds}
                monthStartDate={monthRange.startDate}
                monthEndDate={monthRange.endDate}
              />
              <StatusBoardPeriodSection
                todayIsoDate={todayIsoDate}
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
              <StatusBoardStageTimingSection
                opportunityObjectMetadataItem={metadata.opportunity}
                memberIds={memberIds}
                onOpenSheet={setSheet}
              />
              <StatusBoardListsSection
                onboardingObjectMetadataItem={metadata.onboarding}
                memberIds={memberIds}
                onboardingTab={onboardingTab}
                onOnboardingTabChange={setOnboardingTab}
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
              <StatusBoardWeekSection
                memberObjectMetadataItem={metadata.member}
                onboardingObjectMetadataItem={metadata.onboarding}
                members={visibleMembers}
                memberIds={memberIds}
              />
            </>
          )}
        </StyledStatusBoardScroll>
      </PageCardLayout>
      {sheet !== undefined && (
        <StatusBoardSheet sheet={sheet} onClose={() => setSheet(undefined)} />
      )}
    </>
  );
};
