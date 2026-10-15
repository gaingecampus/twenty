import { StatusBoardUpcomingOnboardingKpi } from '@/status-board/components/StatusBoardUpcomingOnboardingKpi';
import {
  StyledDashboardKpiGrid,
  StyledDashboardSection,
  StyledDashboardSectionHeader,
  StyledDashboardSectionTitle,
} from '@/ui/layout/dashboard/components/dashboardStyled';
import { StatusBoardOnboardingKpi } from '@/status-board/components/StatusBoardOnboardingKpi';
import { type StatusBoardSheetState } from '@/status-board/components/StatusBoardSheet';
import { StatusBoardAssignedCountKpi } from '@/status-board/components/StatusBoardAssignedCountKpi';

import { STATUS_BOARD_FIELD } from '@/status-board/constants/StatusBoardFieldNames';
import {
  buildStatusBoardEndingOnboardingFilter,
  buildStatusBoardOpenOpportunityFilter,
} from '@/status-board/utils/buildStatusBoardSectionFilters';
import { hasStatusBoardField } from '@/status-board/utils/hasStatusBoardField';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';

type StatusBoardNowSectionProps = {
  opportunityObjectMetadataItem: EnrichedObjectMetadataItem | undefined;
  onboardingObjectMetadataItem: EnrichedObjectMetadataItem | undefined;
  memberIds: string[] | undefined;
  monthStartDate: string;
  monthEndDate: string;
  onOpenSheet: (sheet: StatusBoardSheetState) => void;
};

export const StatusBoardNowSection = ({
  opportunityObjectMetadataItem,
  onboardingObjectMetadataItem,
  memberIds,
  monthStartDate,
  monthEndDate,
  onOpenSheet,
}: StatusBoardNowSectionProps) => {
  const openFilter =
    opportunityObjectMetadataItem === undefined
      ? undefined
      : buildStatusBoardOpenOpportunityFilter({
          opportunityObjectMetadataItem,
          memberIds: undefined,
        });
  const endingFilter =
    onboardingObjectMetadataItem === undefined ||
    !hasStatusBoardField(
      onboardingObjectMetadataItem,
      STATUS_BOARD_FIELD.contractEndDate,
    )
      ? undefined
      : buildStatusBoardEndingOnboardingFilter({
          onboardingObjectMetadataItem,
          memberIds: undefined,
          monthStartDate,
          monthEndDate,
        });

  if (
    opportunityObjectMetadataItem === undefined &&
    onboardingObjectMetadataItem === undefined
  ) {
    return null;
  }

  return (
    <StyledDashboardSection>
      <StyledDashboardSectionHeader>
        <StyledDashboardSectionTitle>
          온보딩 진행·예정 현황
        </StyledDashboardSectionTitle>
      </StyledDashboardSectionHeader>
      <StyledDashboardKpiGrid columns={5}>
        {opportunityObjectMetadataItem !== undefined && (
          <StatusBoardAssignedCountKpi
            onOpenSheet={onOpenSheet}
            objectMetadataItem={opportunityObjectMetadataItem}
            memberIds={memberIds}
            memberFieldNames={['assignee', 'assigneeId']}
            sharedFieldName="gongdongDamdangja"
            filter={openFilter}
            label="온고잉 리드수"
            tone="blue"
          />
        )}
        {onboardingObjectMetadataItem !== undefined &&
          hasStatusBoardField(
            onboardingObjectMetadataItem,
            STATUS_BOARD_FIELD.onboardingStatus,
          ) && (
            <StatusBoardUpcomingOnboardingKpi
              objectMetadataItem={onboardingObjectMetadataItem}
              memberIds={memberIds}
              onOpenSheet={onOpenSheet}
            />
          )}
        {onboardingObjectMetadataItem !== undefined && (
          <StatusBoardOnboardingKpi
            onOpenSheet={onOpenSheet}
            objectMetadataItem={onboardingObjectMetadataItem}
            memberIds={memberIds}
          />
        )}
        {onboardingObjectMetadataItem !== undefined && (
          <StatusBoardOnboardingKpi
            variant="project"
            onOpenSheet={onOpenSheet}
            objectMetadataItem={onboardingObjectMetadataItem}
            memberIds={memberIds}
          />
        )}
        {onboardingObjectMetadataItem !== undefined &&
          endingFilter !== undefined && (
            <StatusBoardAssignedCountKpi
              onOpenSheet={onOpenSheet}
              objectMetadataItem={onboardingObjectMetadataItem}
              memberIds={memberIds}
              memberFieldNames={[
                'leadConsultant',
                'leadConsultantId',
                'executionConsultant',
                'executionConsultantId',
              ]}
              sharedFieldName="gongdongSilhaengKeonseolteonteu"
              filter={endingFilter}
              label="이번 달 종료"
              tone="orange"
            />
          )}
      </StyledDashboardKpiGrid>
    </StyledDashboardSection>
  );
};
