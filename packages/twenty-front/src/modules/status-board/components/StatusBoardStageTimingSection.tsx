import {
  StyledDashboardKpiGrid,
  StyledDashboardSection,
  StyledDashboardSectionHeader,
  StyledDashboardSectionTitle,
} from '@/ui/layout/dashboard/components/dashboardStyled';
import { useId } from 'react';
import { IconInfoCircle } from 'twenty-ui/icon';
import { AppTooltip } from 'twenty-ui/surfaces';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useAggregateRecords } from '@/object-record/hooks/useAggregateRecords';
import { AggregateOperations } from '@/object-record/record-table/constants/AggregateOperations';
import { DashboardKpiCard } from '@/ui/layout/dashboard/components/DashboardKpiCard';
import { type StatusBoardSheetState } from '@/status-board/components/StatusBoardSheet';

import { useStatusBoardDummyData } from '@/status-board/contexts/StatusBoardDummyDataContext';
import { STATUS_BOARD_FIELD } from '@/status-board/constants/StatusBoardFieldNames';
import { STATUS_BOARD_STAGE_TIMING_START_DATE } from '@/status-board/constants/StatusBoardStageTimingStartDate';
import { hasStatusBoardField } from '@/status-board/utils/hasStatusBoardField';
import { andStatusBoardFilters } from '@/status-board/utils/andStatusBoardFilters';
import { buildStatusBoardMemberFilter } from '@/status-board/utils/buildStatusBoardSectionFilters';
import { buildStatusBoardRecordGqlFields } from '@/status-board/utils/buildStatusBoardRecordGqlFields';
import { type OPPORTUNITY_STAGE_TIMINGS } from 'twenty-shared/constants';
import { getStatusBoardStageTimings } from '@/status-board/utils/getStatusBoardStageTimings';
import {
  FieldMetadataType,
  type RecordGqlOperationFilter,
} from 'twenty-shared/types';

type StatusBoardStageTimingSectionProps = {
  opportunityObjectMetadataItem: EnrichedObjectMetadataItem | undefined;
  memberIds: string[] | undefined;
  onOpenSheet: (sheet: StatusBoardSheetState) => void;
};

export const StatusBoardStageTimingSection = ({
  opportunityObjectMetadataItem,
  memberIds,
  onOpenSheet,
}: StatusBoardStageTimingSectionProps) => {
  const infoId = useId();
  const description = `${STATUS_BOARD_STAGE_TIMING_START_DATE.replaceAll('-', '.')} 이후 문의 · 최초 문의 날짜부터 최초 도달일까지 평균 · 한국 날짜 기준, 주말 포함. 측정 전 이력과 미도달 단계는 제외됩니다.`;
  const stages = getStatusBoardStageTimings(
    opportunityObjectMetadataItem,
  ).filter((stage) =>
    opportunityObjectMetadataItem?.readableFields.some(
      (field) =>
        field.name === stage.daysField &&
        field.type === FieldMetadataType.NUMBER,
    ),
  );
  if (!opportunityObjectMetadataItem || stages.length === 0) return null;

  const filter = andStatusBoardFilters([
    buildStatusBoardMemberFilter({
      objectMetadataItem: opportunityObjectMetadataItem,
      memberIds,
      fieldNames: ['assignee', 'assigneeId'],
    }),
    hasStatusBoardField(
      opportunityObjectMetadataItem,
      STATUS_BOARD_FIELD.firstInquiryDate,
    )
      ? {
          [STATUS_BOARD_FIELD.firstInquiryDate]: {
            gte: STATUS_BOARD_STAGE_TIMING_START_DATE,
          },
        }
      : undefined,
  ]);

  return (
    <StyledDashboardSection>
      <StyledDashboardSectionHeader>
        <StyledDashboardSectionTitle>
          문의 단계별 평균 소요일
          <span
            data-stage-timing-info={infoId}
            tabIndex={0}
            aria-label={`집계 기준: ${description}`}
            style={{
              display: 'inline-flex',
              marginLeft: 6,
              verticalAlign: 'middle',
              color: themeCssVariables.font.color.tertiary,
            }}
          >
            <IconInfoCircle size={16} aria-hidden />
          </span>
          <AppTooltip
            anchorSelect={`[data-stage-timing-info="${infoId}"]`}
            content={description}
          />
        </StyledDashboardSectionTitle>
      </StyledDashboardSectionHeader>
      <StyledDashboardKpiGrid>
        {stages.map((stage) => (
          <StageTimingCard
            key={stage.value}
            stage={stage}
            objectMetadataItem={opportunityObjectMetadataItem}
            filter={filter}
            onOpenSheet={onOpenSheet}
          />
        ))}
      </StyledDashboardKpiGrid>
    </StyledDashboardSection>
  );
};

const StageTimingCard = ({
  stage,
  objectMetadataItem,
  filter,
  onOpenSheet,
}: {
  stage: (typeof OPPORTUNITY_STAGE_TIMINGS)[number];
  objectMetadataItem: EnrichedObjectMetadataItem;
  filter: RecordGqlOperationFilter | undefined;
  onOpenSheet: StatusBoardStageTimingSectionProps['onOpenSheet'];
}) => {
  const dummy = useStatusBoardDummyData();
  const measuredFilter = andStatusBoardFilters([
    filter,
    { [stage.daysField]: { gte: 0 } },
  ]);
  const { data, loading, error } = useAggregateRecords({
    objectNameSingular: 'opportunity',
    filter: measuredFilter,
    skip: dummy.enabled,
    recordGqlFieldsAggregate: {
      [stage.daysField]: [
        AggregateOperations.AVG,
        AggregateOperations.COUNT_NOT_EMPTY,
      ],
    },
  });
  const average = data?.[stage.daysField]?.AVG;
  const count = data?.[stage.daysField]?.COUNT_NOT_EMPTY;
  const hasMeasurement =
    !dummy.enabled &&
    !error &&
    typeof average === 'number' &&
    Number.isFinite(average) &&
    typeof count === 'number' &&
    count > 0;
  const label =
    objectMetadataItem.fields
      .find((field) => field.name === 'customStage')
      ?.options?.find((option) => option.value === stage.value)?.label ??
    stage.label;

  return (
    <DashboardKpiCard
      label={label}
      value={hasMeasurement ? `${average.toFixed(1)}일` : '—'}
      loading={!dummy.enabled && loading}
      isEmpty={!hasMeasurement}
      inlineSubtitle={hasMeasurement}
      subtitle={
        error ? '조회 실패' : hasMeasurement ? `측정 ${count}건` : undefined
      }
      onClick={() =>
        onOpenSheet({
          title: `${label} 도달 소요일 · 측정 문의`,
          kpiLabel: label,
          objectNameSingular: 'opportunity',
          filter: measuredFilter,
          listTarget: { objectMetadataItem },
          recordGqlFields: buildStatusBoardRecordGqlFields({
            objectMetadataItem,
            fieldNames: [
              'name',
              'company',
              stage.daysField,
              stage.reachedAtField,
            ],
          }),
        })
      }
    />
  );
};
