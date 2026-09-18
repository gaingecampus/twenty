import { StatusBoardOnboardingKpi } from '@/status-board/components/StatusBoardOnboardingKpi';
import { type StatusBoardSheetState } from '@/status-board/components/StatusBoardSheet';
import { StatusBoardLinkedCountKpi } from '@/status-board/components/StatusBoardLinkedCountKpi';
import {
  StyledStatusBoardKpiGrid,
  StyledStatusBoardMuted,
  StyledStatusBoardSection,
  StyledStatusBoardSectionHeader,
  StyledStatusBoardSectionTitle,
} from '@/status-board/components/statusBoardStyled';
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
          memberIds,
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
          memberIds,
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
    <StyledStatusBoardSection>
      <StyledStatusBoardSectionHeader>
        <StyledStatusBoardSectionTitle>주요 현황</StyledStatusBoardSectionTitle>
        <StyledStatusBoardMuted>오늘 기준</StyledStatusBoardMuted>
      </StyledStatusBoardSectionHeader>
      <StyledStatusBoardKpiGrid columns={3}>
        {opportunityObjectMetadataItem !== undefined && (
          <StatusBoardLinkedCountKpi
            onOpenSheet={onOpenSheet}
            objectMetadataItem={opportunityObjectMetadataItem}
            filter={openFilter}
            label="온고잉 리드수"
            tone="blue"
          />
        )}
        {onboardingObjectMetadataItem !== undefined && (
          <StatusBoardOnboardingKpi
            onOpenSheet={onOpenSheet}
            objectMetadataItem={onboardingObjectMetadataItem}
            memberIds={memberIds}
          />
        )}
        {onboardingObjectMetadataItem !== undefined &&
          endingFilter !== undefined && (
            <StatusBoardLinkedCountKpi
              onOpenSheet={onOpenSheet}
              objectMetadataItem={onboardingObjectMetadataItem}
              filter={endingFilter}
              label="이번 달 종료"
              tone="orange"
            />
          )}
      </StyledStatusBoardKpiGrid>
    </StyledStatusBoardSection>
  );
};
