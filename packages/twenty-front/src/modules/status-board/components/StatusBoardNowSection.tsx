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
  buildStatusBoardActiveOnboardingFilter,
  buildStatusBoardEndingOnboardingFilter,
  buildStatusBoardOpenOpportunityFilter,
  buildStatusBoardOverdueDepositFilter,
} from '@/status-board/utils/buildStatusBoardSectionFilters';
import { hasStatusBoardField } from '@/status-board/utils/hasStatusBoardField';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';

type StatusBoardNowSectionProps = {
  depositObjectMetadataItem: EnrichedObjectMetadataItem | undefined;
  opportunityObjectMetadataItem: EnrichedObjectMetadataItem | undefined;
  onboardingObjectMetadataItem: EnrichedObjectMetadataItem | undefined;
  memberIds: string[] | undefined;
  selectedGroupIds: string[];
  todayIsoDate: string;
  monthStartDate: string;
  monthEndDate: string;
  onOpenSheet: (sheet: StatusBoardSheetState) => void;
};

export const StatusBoardNowSection = ({
  depositObjectMetadataItem,
  opportunityObjectMetadataItem,
  onboardingObjectMetadataItem,
  memberIds,
  selectedGroupIds,
  todayIsoDate,
  monthStartDate,
  monthEndDate,
  onOpenSheet,
}: StatusBoardNowSectionProps) => {
  const overdueFilter =
    depositObjectMetadataItem === undefined
      ? undefined
      : buildStatusBoardOverdueDepositFilter({
          depositObjectMetadataItem,
          todayIsoDate,
          memberIds,
          selectedGroupIds,
        });
  const openFilter =
    opportunityObjectMetadataItem === undefined
      ? undefined
      : buildStatusBoardOpenOpportunityFilter({
          opportunityObjectMetadataItem,
          memberIds,
        });
  const activeFilter =
    onboardingObjectMetadataItem === undefined
      ? undefined
      : buildStatusBoardActiveOnboardingFilter({
          onboardingObjectMetadataItem,
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
    depositObjectMetadataItem === undefined &&
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
      <StyledStatusBoardKpiGrid>
        {depositObjectMetadataItem !== undefined &&
          hasStatusBoardField(
            depositObjectMetadataItem,
            STATUS_BOARD_FIELD.expectedPaymentDate,
          ) && (
            <StatusBoardLinkedCountKpi
              onOpenSheet={onOpenSheet}
              objectMetadataItem={depositObjectMetadataItem}
              filter={overdueFilter}
              label="미지급금"
              tone="red"
              withSum={hasStatusBoardField(
                depositObjectMetadataItem,
                STATUS_BOARD_FIELD.amount,
              )}
            />
          )}
        {opportunityObjectMetadataItem !== undefined && (
          <StatusBoardLinkedCountKpi
            onOpenSheet={onOpenSheet}
            objectMetadataItem={opportunityObjectMetadataItem}
            filter={openFilter}
            label="진행 중 문의"
            tone="blue"
          />
        )}
        {onboardingObjectMetadataItem !== undefined && (
          <StatusBoardLinkedCountKpi
            onOpenSheet={onOpenSheet}
            objectMetadataItem={onboardingObjectMetadataItem}
            filter={activeFilter}
            label="온보딩 중"
            tone="green"
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
