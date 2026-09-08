import { StatusBoardCountKpi } from '@/status-board/components/StatusBoardCountKpi';
import {
  StyledStatusBoardKpiGrid,
  StyledStatusBoardMuted,
  StyledStatusBoardSection,
  StyledStatusBoardSectionHeader,
  StyledStatusBoardSectionTitle,
} from '@/status-board/components/statusBoardStyled';
import { type StatusBoardSheetState } from '@/status-board/components/StatusBoardSheet';
import { STATUS_BOARD_FIELD } from '@/status-board/constants/StatusBoardFieldNames';
import { STATUS_BOARD_OBJECT_NAME_SINGULAR } from '@/status-board/constants/StatusBoardObjectNames';
import { buildStatusBoardRecordGqlFields } from '@/status-board/utils/buildStatusBoardRecordGqlFields';
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
        <StyledStatusBoardSectionTitle>지금</StyledStatusBoardSectionTitle>
        <StyledStatusBoardMuted>오늘 기준</StyledStatusBoardMuted>
      </StyledStatusBoardSectionHeader>
      <StyledStatusBoardKpiGrid>
        {depositObjectMetadataItem !== undefined &&
          hasStatusBoardField(
            depositObjectMetadataItem,
            STATUS_BOARD_FIELD.expectedPaymentDate,
          ) && (
            <StatusBoardCountKpi
              objectNameSingular={STATUS_BOARD_OBJECT_NAME_SINGULAR.deposit}
              filter={overdueFilter}
              label="미수금"
              withSum={hasStatusBoardField(
                depositObjectMetadataItem,
                STATUS_BOARD_FIELD.amount,
              )}
              onClick={() =>
                onOpenSheet({
                  title: '미수금',
                  objectNameSingular: STATUS_BOARD_OBJECT_NAME_SINGULAR.deposit,
                  filter: overdueFilter,
                  recordGqlFields: buildStatusBoardRecordGqlFields({
                    objectMetadataItem: depositObjectMetadataItem,
                    fieldNames: [
                      STATUS_BOARD_FIELD.name,
                      STATUS_BOARD_FIELD.company,
                      STATUS_BOARD_FIELD.amount,
                      STATUS_BOARD_FIELD.expectedPaymentDate,
                    ],
                  }),
                })
              }
            />
          )}
        {opportunityObjectMetadataItem !== undefined && (
          <StatusBoardCountKpi
            objectNameSingular={STATUS_BOARD_OBJECT_NAME_SINGULAR.opportunity}
            filter={openFilter}
            label="진행 중 문의"
            onClick={() =>
              onOpenSheet({
                title: '진행 중 문의',
                objectNameSingular:
                  STATUS_BOARD_OBJECT_NAME_SINGULAR.opportunity,
                filter: openFilter,
                recordGqlFields: buildStatusBoardRecordGqlFields({
                  objectMetadataItem: opportunityObjectMetadataItem,
                  fieldNames: [
                    STATUS_BOARD_FIELD.name,
                    STATUS_BOARD_FIELD.company,
                    STATUS_BOARD_FIELD.customStage,
                  ],
                }),
              })
            }
          />
        )}
        {onboardingObjectMetadataItem !== undefined && (
          <StatusBoardCountKpi
            objectNameSingular={STATUS_BOARD_OBJECT_NAME_SINGULAR.onboarding}
            filter={activeFilter}
            label="온보딩 중"
            onClick={() =>
              onOpenSheet({
                title: '온보딩 중',
                objectNameSingular:
                  STATUS_BOARD_OBJECT_NAME_SINGULAR.onboarding,
                filter: activeFilter,
                recordGqlFields: buildStatusBoardRecordGqlFields({
                  objectMetadataItem: onboardingObjectMetadataItem,
                  fieldNames: [
                    STATUS_BOARD_FIELD.name,
                    STATUS_BOARD_FIELD.company,
                    STATUS_BOARD_FIELD.onboardingStatus,
                  ],
                }),
              })
            }
          />
        )}
        {onboardingObjectMetadataItem !== undefined &&
          endingFilter !== undefined && (
            <StatusBoardCountKpi
              objectNameSingular={STATUS_BOARD_OBJECT_NAME_SINGULAR.onboarding}
              filter={endingFilter}
              label="이번 달 종료"
              onClick={() =>
                onOpenSheet({
                  title: '이번 달 종료',
                  objectNameSingular:
                    STATUS_BOARD_OBJECT_NAME_SINGULAR.onboarding,
                  filter: endingFilter,
                  recordGqlFields: buildStatusBoardRecordGqlFields({
                    objectMetadataItem: onboardingObjectMetadataItem,
                    fieldNames: [
                      STATUS_BOARD_FIELD.name,
                      STATUS_BOARD_FIELD.company,
                      STATUS_BOARD_FIELD.contractEndDate,
                    ],
                  }),
                })
              }
            />
          )}
      </StyledStatusBoardKpiGrid>
    </StyledStatusBoardSection>
  );
};
