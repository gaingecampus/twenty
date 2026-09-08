import { StatusBoardCountKpi } from '@/status-board/components/StatusBoardCountKpi';
import {
  StyledStatusBoardChip,
  StyledStatusBoardChipRow,
  StyledStatusBoardKpiGrid,
  StyledStatusBoardMuted,
  StyledStatusBoardSection,
  StyledStatusBoardSectionHeader,
  StyledStatusBoardSectionTitle,
} from '@/status-board/components/statusBoardStyled';
import { type StatusBoardSheetState } from '@/status-board/components/StatusBoardSheet';
import { STATUS_BOARD_FIELD } from '@/status-board/constants/StatusBoardFieldNames';
import { STATUS_BOARD_OBJECT_NAME_SINGULAR } from '@/status-board/constants/StatusBoardObjectNames';
import { andStatusBoardFilters } from '@/status-board/utils/andStatusBoardFilters';
import { buildStatusBoardDateRangeFilter } from '@/status-board/utils/buildStatusBoardDateRangeFilter';
import { buildStatusBoardRecordGqlFields } from '@/status-board/utils/buildStatusBoardRecordGqlFields';
import {
  buildStatusBoardMemberFilter,
  buildStatusBoardPaidDepositFilter,
  buildStatusBoardUnpaidPeriodDepositFilter,
} from '@/status-board/utils/buildStatusBoardSectionFilters';
import { hasStatusBoardField } from '@/status-board/utils/hasStatusBoardField';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import {
  type StatusBoardPeriodRange,
  type StatusBoardPeriodType,
} from '@/status-board/utils/getStatusBoardPeriodRange';

type StatusBoardPeriodSectionProps = {
  depositObjectMetadataItem: EnrichedObjectMetadataItem | undefined;
  opportunityObjectMetadataItem: EnrichedObjectMetadataItem | undefined;
  onboardingObjectMetadataItem: EnrichedObjectMetadataItem | undefined;
  memberIds: string[] | undefined;
  selectedGroupIds: string[];
  periodRange: StatusBoardPeriodRange;
  periodType: StatusBoardPeriodType;
  periodOffset: number;
  onSelectPeriodType: (periodType: StatusBoardPeriodType) => void;
  onShiftPeriodOffset: (delta: number) => void;
  onOpenSheet: (sheet: StatusBoardSheetState) => void;
};

export const StatusBoardPeriodSection = ({
  depositObjectMetadataItem,
  opportunityObjectMetadataItem,
  onboardingObjectMetadataItem,
  memberIds,
  selectedGroupIds,
  periodRange,
  periodType,
  periodOffset,
  onSelectPeriodType,
  onShiftPeriodOffset,
  onOpenSheet,
}: StatusBoardPeriodSectionProps) => {
  const paidFilter =
    depositObjectMetadataItem === undefined
      ? undefined
      : buildStatusBoardPaidDepositFilter({
          depositObjectMetadataItem,
          memberIds,
          selectedGroupIds,
          startDate: periodRange.startDate,
          endDate: periodRange.endDate,
        });
  const dueFilter =
    depositObjectMetadataItem === undefined
      ? undefined
      : buildStatusBoardUnpaidPeriodDepositFilter({
          depositObjectMetadataItem,
          memberIds,
          selectedGroupIds,
          startDate: periodRange.startDate,
          endDate: periodRange.endDate,
        });
  const opportunityFilter =
    opportunityObjectMetadataItem === undefined
      ? undefined
      : andStatusBoardFilters([
          buildStatusBoardDateRangeFilter({
            objectMetadataItem: opportunityObjectMetadataItem,
            preferredFieldName: STATUS_BOARD_FIELD.firstInquiryDate,
            fallbackFieldName: 'createdAt',
            startDate: periodRange.startDate,
            endDate: periodRange.endDate,
          }),
          buildStatusBoardMemberFilter({
            objectMetadataItem: opportunityObjectMetadataItem,
            fieldNames: [
              STATUS_BOARD_FIELD.assignee,
              STATUS_BOARD_FIELD.assigneeId,
            ],
            memberIds,
          }),
        ]);
  const onboardingFilter =
    onboardingObjectMetadataItem === undefined
      ? undefined
      : andStatusBoardFilters([
          buildStatusBoardDateRangeFilter({
            objectMetadataItem: onboardingObjectMetadataItem,
            preferredFieldName: STATUS_BOARD_FIELD.contractStartDate,
            fallbackFieldName: 'createdAt',
            startDate: periodRange.startDate,
            endDate: periodRange.endDate,
          }),
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
        <StyledStatusBoardSectionTitle>
          {periodRange.title}
        </StyledStatusBoardSectionTitle>
        <StyledStatusBoardChipRow>
          <StyledStatusBoardChip
            type="button"
            isActive={false}
            onClick={() => onShiftPeriodOffset(-1)}
          >
            ‹
          </StyledStatusBoardChip>
          <StyledStatusBoardMuted>{periodRange.label}</StyledStatusBoardMuted>
          <StyledStatusBoardChip
            type="button"
            isActive={false}
            disabled={periodOffset >= 0}
            onClick={() => onShiftPeriodOffset(1)}
          >
            ›
          </StyledStatusBoardChip>
          {(['month', 'quarter', 'year'] as const).map((item) => (
            <StyledStatusBoardChip
              key={item}
              type="button"
              isActive={periodType === item}
              onClick={() => onSelectPeriodType(item)}
            >
              {item === 'month' ? '월' : item === 'quarter' ? '분기' : '연도'}
            </StyledStatusBoardChip>
          ))}
        </StyledStatusBoardChipRow>
      </StyledStatusBoardSectionHeader>
      <StyledStatusBoardKpiGrid>
        {depositObjectMetadataItem !== undefined && (
          <StatusBoardCountKpi
            objectNameSingular={STATUS_BOARD_OBJECT_NAME_SINGULAR.deposit}
            filter={paidFilter}
            label="입금 완료"
            showAmountAsValue={hasStatusBoardField(
              depositObjectMetadataItem,
              STATUS_BOARD_FIELD.amount,
            )}
            onClick={() =>
              onOpenSheet({
                title: `${periodRange.label} 입금 완료`,
                objectNameSingular: STATUS_BOARD_OBJECT_NAME_SINGULAR.deposit,
                filter: paidFilter,
                recordGqlFields: buildStatusBoardRecordGqlFields({
                  objectMetadataItem: depositObjectMetadataItem,
                  fieldNames: [
                    STATUS_BOARD_FIELD.name,
                    STATUS_BOARD_FIELD.company,
                    STATUS_BOARD_FIELD.amount,
                  ],
                }),
              })
            }
          />
        )}
        {depositObjectMetadataItem !== undefined && (
          <StatusBoardCountKpi
            objectNameSingular={STATUS_BOARD_OBJECT_NAME_SINGULAR.deposit}
            filter={dueFilter}
            label="입금 예정"
            showAmountAsValue={hasStatusBoardField(
              depositObjectMetadataItem,
              STATUS_BOARD_FIELD.amount,
            )}
            onClick={() =>
              onOpenSheet({
                title: `${periodRange.label} 입금 예정`,
                objectNameSingular: STATUS_BOARD_OBJECT_NAME_SINGULAR.deposit,
                filter: dueFilter,
                recordGqlFields: buildStatusBoardRecordGqlFields({
                  objectMetadataItem: depositObjectMetadataItem,
                  fieldNames: [
                    STATUS_BOARD_FIELD.name,
                    STATUS_BOARD_FIELD.company,
                    STATUS_BOARD_FIELD.amount,
                  ],
                }),
              })
            }
          />
        )}
        {opportunityObjectMetadataItem !== undefined && (
          <StatusBoardCountKpi
            objectNameSingular={STATUS_BOARD_OBJECT_NAME_SINGULAR.opportunity}
            filter={opportunityFilter}
            label="신규 문의"
            onClick={() =>
              onOpenSheet({
                title: `${periodRange.label} 신규 문의`,
                objectNameSingular:
                  STATUS_BOARD_OBJECT_NAME_SINGULAR.opportunity,
                filter: opportunityFilter,
                recordGqlFields: buildStatusBoardRecordGqlFields({
                  objectMetadataItem: opportunityObjectMetadataItem,
                  fieldNames: [
                    STATUS_BOARD_FIELD.name,
                    STATUS_BOARD_FIELD.company,
                  ],
                }),
              })
            }
          />
        )}
        {onboardingObjectMetadataItem !== undefined && (
          <StatusBoardCountKpi
            objectNameSingular={STATUS_BOARD_OBJECT_NAME_SINGULAR.onboarding}
            filter={onboardingFilter}
            label="계약 시작"
            onClick={() =>
              onOpenSheet({
                title: `${periodRange.label} 계약 시작`,
                objectNameSingular:
                  STATUS_BOARD_OBJECT_NAME_SINGULAR.onboarding,
                filter: onboardingFilter,
                recordGqlFields: buildStatusBoardRecordGqlFields({
                  objectMetadataItem: onboardingObjectMetadataItem,
                  fieldNames: [
                    STATUS_BOARD_FIELD.name,
                    STATUS_BOARD_FIELD.company,
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
