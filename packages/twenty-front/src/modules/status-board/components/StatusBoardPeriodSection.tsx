import { StatusBoardDepositShare } from '@/status-board/components/StatusBoardDepositShare';
import { IconChevronLeft, IconChevronRight } from 'twenty-ui/icon';
import { StatusBoardCountKpi } from '@/status-board/components/StatusBoardCountKpi';
import {
  StyledStatusBoardKpiGrid,
  StyledStatusBoardPeriodControls,
  StyledStatusBoardPeriodLabel,
  StyledStatusBoardPeriodNav,
  StyledStatusBoardPeriodNavButton,
  StyledStatusBoardSection,
  StyledStatusBoardSectionHeader,
  StyledStatusBoardSectionTitle,
  StyledStatusBoardSegment,
  StyledStatusBoardSegmentButton,
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
        <StyledStatusBoardPeriodControls>
          <StyledStatusBoardPeriodNav>
            <StyledStatusBoardPeriodNavButton
              type="button"
              aria-label="이전"
              onClick={() => onShiftPeriodOffset(-1)}
            >
              <IconChevronLeft size={16} />
            </StyledStatusBoardPeriodNavButton>
            <StyledStatusBoardPeriodLabel>
              {periodRange.label}
            </StyledStatusBoardPeriodLabel>
            <StyledStatusBoardPeriodNavButton
              type="button"
              aria-label="다음"
              disabled={periodOffset >= 0}
              onClick={() => onShiftPeriodOffset(1)}
            >
              <IconChevronRight size={16} />
            </StyledStatusBoardPeriodNavButton>
          </StyledStatusBoardPeriodNav>
          <StyledStatusBoardSegment>
            {(['month', 'quarter', 'year'] as const).map((item) => (
              <StyledStatusBoardSegmentButton
                key={item}
                type="button"
                isActive={periodType === item}
                aria-pressed={periodType === item}
                onClick={() => onSelectPeriodType(item)}
              >
                {item === 'month' ? '월' : item === 'quarter' ? '분기' : '연도'}
              </StyledStatusBoardSegmentButton>
            ))}
          </StyledStatusBoardSegment>
        </StyledStatusBoardPeriodControls>
      </StyledStatusBoardSectionHeader>
      <StyledStatusBoardKpiGrid>
        {depositObjectMetadataItem !== undefined && (
          <StatusBoardCountKpi
            objectNameSingular={STATUS_BOARD_OBJECT_NAME_SINGULAR.deposit}
            filter={paidFilter}
            label="입금 완료"
            tone="green"
            showAmountAsValue={hasStatusBoardField(
              depositObjectMetadataItem,
              STATUS_BOARD_FIELD.amount,
            )}
            onClick={() =>
              onOpenSheet({
                title: `${periodRange.label} 입금 완료`,
                kpiLabel: '입금 완료',
                tone: 'green',
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
            tone="orange"
            showAmountAsValue={hasStatusBoardField(
              depositObjectMetadataItem,
              STATUS_BOARD_FIELD.amount,
            )}
            onClick={() =>
              onOpenSheet({
                title: `${periodRange.label} 입금 예정`,
                kpiLabel: '입금 예정',
                tone: 'orange',
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
            tone="blue"
            onClick={() =>
              onOpenSheet({
                title: `${periodRange.label} 신규 문의`,
                kpiLabel: '신규 문의',
                tone: 'blue',
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
            tone="green"
            onClick={() =>
              onOpenSheet({
                title: `${periodRange.label} 계약 시작`,
                kpiLabel: '계약 시작',
                tone: 'green',
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
      {depositObjectMetadataItem &&
        hasStatusBoardField(
          depositObjectMetadataItem,
          STATUS_BOARD_FIELD.amount,
        ) &&
        hasStatusBoardField(
          depositObjectMetadataItem,
          STATUS_BOARD_FIELD.depositStatus,
        ) && (
          <StatusBoardDepositShare
            paidFilter={paidFilter}
            dueFilter={dueFilter}
            dateBasis={
              hasStatusBoardField(
                depositObjectMetadataItem,
                STATUS_BOARD_FIELD.expectedPaymentDate,
              )
                ? '입금 예정일'
                : '등록일'
            }
          />
        )}
    </StyledStatusBoardSection>
  );
};
