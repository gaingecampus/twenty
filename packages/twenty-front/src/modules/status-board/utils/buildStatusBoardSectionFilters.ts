import { STATUS_BOARD_CLOSED_OPPORTUNITY_STAGES } from '@/status-board/constants/StatusBoardClosedOpportunityStages';
import { STATUS_BOARD_FIELD } from '@/status-board/constants/StatusBoardFieldNames';
import { andStatusBoardFilters } from '@/status-board/utils/andStatusBoardFilters';
import { buildStatusBoardDateRangeFilter } from '@/status-board/utils/buildStatusBoardDateRangeFilter';
import { buildStatusBoardIdInFilter } from '@/status-board/utils/buildStatusBoardIdInFilter';
import { hasStatusBoardField } from '@/status-board/utils/hasStatusBoardField';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';

export const buildStatusBoardMemberFilter = ({
  objectMetadataItem,
  fieldNames,
  memberIds,
}: {
  objectMetadataItem: EnrichedObjectMetadataItem;
  fieldNames: string[];
  memberIds: string[] | undefined;
}): RecordGqlOperationFilter | undefined => {
  if (memberIds === undefined) {
    return undefined;
  }

  if (memberIds.length === 0) {
    return { id: { is: 'NULL' } };
  }

  return (
    buildStatusBoardIdInFilter({
      objectMetadataItem,
      fieldNames,
      ids: memberIds,
    }) ?? { id: { is: 'NULL' } }
  );
};

export const buildStatusBoardOverdueDepositFilter = ({
  depositObjectMetadataItem,
  todayIsoDate,
  memberIds,
  selectedGroupIds,
}: {
  depositObjectMetadataItem: EnrichedObjectMetadataItem;
  todayIsoDate: string;
  memberIds: string[] | undefined;
  selectedGroupIds: string[];
}): RecordGqlOperationFilter | undefined => {
  return andStatusBoardFilters([
    hasStatusBoardField(
      depositObjectMetadataItem,
      STATUS_BOARD_FIELD.depositStatus,
    )
      ? { [STATUS_BOARD_FIELD.depositStatus]: { neq: 'PAID' } }
      : undefined,
    hasStatusBoardField(
      depositObjectMetadataItem,
      STATUS_BOARD_FIELD.expectedPaymentDate,
    )
      ? {
          [STATUS_BOARD_FIELD.expectedPaymentDate]: {
            lt: todayIsoDate,
          },
        }
      : undefined,
    buildStatusBoardMemberFilter({
      objectMetadataItem: depositObjectMetadataItem,
      fieldNames: [STATUS_BOARD_FIELD.creator, STATUS_BOARD_FIELD.creatorId],
      memberIds,
    }),
    selectedGroupIds.length > 0
      ? buildStatusBoardIdInFilter({
          objectMetadataItem: depositObjectMetadataItem,
          fieldNames: [
            STATUS_BOARD_FIELD.revenueDept,
            STATUS_BOARD_FIELD.revenueDeptId,
          ],
          ids: selectedGroupIds,
        })
      : undefined,
  ]);
};

export const buildStatusBoardOpenOpportunityFilter = ({
  opportunityObjectMetadataItem,
  memberIds,
}: {
  opportunityObjectMetadataItem: EnrichedObjectMetadataItem;
  memberIds: string[] | undefined;
}): RecordGqlOperationFilter | undefined => {
  return andStatusBoardFilters([
    hasStatusBoardField(
      opportunityObjectMetadataItem,
      STATUS_BOARD_FIELD.customStage,
    )
      ? {
          not: {
            [STATUS_BOARD_FIELD.customStage]: {
              in: [...STATUS_BOARD_CLOSED_OPPORTUNITY_STAGES],
            },
          },
        }
      : undefined,
    buildStatusBoardMemberFilter({
      objectMetadataItem: opportunityObjectMetadataItem,
      fieldNames: [STATUS_BOARD_FIELD.assignee, STATUS_BOARD_FIELD.assigneeId],
      memberIds,
    }),
  ]);
};

export const buildStatusBoardActiveOnboardingFilter = ({
  onboardingObjectMetadataItem,
  memberIds,
}: {
  onboardingObjectMetadataItem: EnrichedObjectMetadataItem;
  memberIds: string[] | undefined;
}): RecordGqlOperationFilter | undefined => {
  return andStatusBoardFilters([
    hasStatusBoardField(
      onboardingObjectMetadataItem,
      STATUS_BOARD_FIELD.onboardingStatus,
    )
      ? { [STATUS_BOARD_FIELD.onboardingStatus]: { eq: 'ACTIVE' } }
      : undefined,
    buildStatusBoardMemberFilter({
      objectMetadataItem: onboardingObjectMetadataItem,
      fieldNames: [
        STATUS_BOARD_FIELD.leadConsultant,
        STATUS_BOARD_FIELD.leadConsultantId,
        STATUS_BOARD_FIELD.executionConsultant,
        STATUS_BOARD_FIELD.executionConsultantId,
      ],
      memberIds,
    }),
  ]);
};

export const buildStatusBoardEndingOnboardingFilter = ({
  onboardingObjectMetadataItem,
  memberIds,
  monthStartDate,
  monthEndDate,
}: {
  onboardingObjectMetadataItem: EnrichedObjectMetadataItem;
  memberIds: string[] | undefined;
  monthStartDate: string;
  monthEndDate: string;
}): RecordGqlOperationFilter | undefined => {
  return andStatusBoardFilters([
    buildStatusBoardActiveOnboardingFilter({
      onboardingObjectMetadataItem,
      memberIds,
    }),
    buildStatusBoardDateRangeFilter({
      objectMetadataItem: onboardingObjectMetadataItem,
      preferredFieldName: STATUS_BOARD_FIELD.contractEndDate,
      fallbackFieldName: STATUS_BOARD_FIELD.contractEndDate,
      startDate: monthStartDate,
      endDate: monthEndDate,
    }),
  ]);
};

export const buildStatusBoardPeriodDepositFilter = ({
  depositObjectMetadataItem,
  memberIds,
  selectedGroupIds,
  startDate,
  endDate,
}: {
  depositObjectMetadataItem: EnrichedObjectMetadataItem;
  memberIds: string[] | undefined;
  selectedGroupIds: string[];
  startDate: string;
  endDate: string;
}): RecordGqlOperationFilter | undefined => {
  return andStatusBoardFilters([
    buildStatusBoardDateRangeFilter({
      objectMetadataItem: depositObjectMetadataItem,
      preferredFieldName: STATUS_BOARD_FIELD.expectedPaymentDate,
      fallbackFieldName: 'createdAt',
      startDate,
      endDate,
    }),
    buildStatusBoardMemberFilter({
      objectMetadataItem: depositObjectMetadataItem,
      fieldNames: [STATUS_BOARD_FIELD.creator, STATUS_BOARD_FIELD.creatorId],
      memberIds,
    }),
    selectedGroupIds.length > 0
      ? buildStatusBoardIdInFilter({
          objectMetadataItem: depositObjectMetadataItem,
          fieldNames: [
            STATUS_BOARD_FIELD.revenueDept,
            STATUS_BOARD_FIELD.revenueDeptId,
          ],
          ids: selectedGroupIds,
        })
      : undefined,
  ]);
};

export const buildStatusBoardPaidDepositFilter = ({
  depositObjectMetadataItem,
  memberIds,
  selectedGroupIds,
  startDate,
  endDate,
}: {
  depositObjectMetadataItem: EnrichedObjectMetadataItem;
  memberIds: string[] | undefined;
  selectedGroupIds: string[];
  startDate: string;
  endDate: string;
}): RecordGqlOperationFilter | undefined => {
  return andStatusBoardFilters([
    buildStatusBoardPeriodDepositFilter({
      depositObjectMetadataItem,
      memberIds,
      selectedGroupIds,
      startDate,
      endDate,
    }),
    hasStatusBoardField(
      depositObjectMetadataItem,
      STATUS_BOARD_FIELD.depositStatus,
    )
      ? { [STATUS_BOARD_FIELD.depositStatus]: { eq: 'PAID' } }
      : undefined,
  ]);
};

export const buildStatusBoardUnpaidPeriodDepositFilter = ({
  depositObjectMetadataItem,
  memberIds,
  selectedGroupIds,
  startDate,
  endDate,
}: {
  depositObjectMetadataItem: EnrichedObjectMetadataItem;
  memberIds: string[] | undefined;
  selectedGroupIds: string[];
  startDate: string;
  endDate: string;
}): RecordGqlOperationFilter | undefined => {
  return andStatusBoardFilters([
    buildStatusBoardPeriodDepositFilter({
      depositObjectMetadataItem,
      memberIds,
      selectedGroupIds,
      startDate,
      endDate,
    }),
    hasStatusBoardField(
      depositObjectMetadataItem,
      STATUS_BOARD_FIELD.depositStatus,
    )
      ? { [STATUS_BOARD_FIELD.depositStatus]: { neq: 'PAID' } }
      : undefined,
  ]);
};
