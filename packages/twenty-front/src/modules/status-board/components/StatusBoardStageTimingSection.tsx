import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useAggregateRecords } from '@/object-record/hooks/useAggregateRecords';
import { AggregateOperations } from '@/object-record/record-table/constants/AggregateOperations';
import { StatusBoardKpiCard } from '@/status-board/components/StatusBoardKpiCard';
import { type StatusBoardSheetState } from '@/status-board/components/StatusBoardSheet';
import {
  StyledStatusBoardKpiGrid,
  StyledStatusBoardMuted,
  StyledStatusBoardSection,
  StyledStatusBoardSectionHeader,
  StyledStatusBoardSectionTitle,
} from '@/status-board/components/statusBoardStyled';
import { useStatusBoardDummyData } from '@/status-board/contexts/StatusBoardDummyDataContext';
import { andStatusBoardFilters } from '@/status-board/utils/andStatusBoardFilters';
import { buildStatusBoardMemberFilter } from '@/status-board/utils/buildStatusBoardSectionFilters';
import { buildStatusBoardRecordGqlFields } from '@/status-board/utils/buildStatusBoardRecordGqlFields';
import { OPPORTUNITY_STAGE_TIMINGS } from 'twenty-shared/constants';
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
  const stages = OPPORTUNITY_STAGE_TIMINGS.filter((stage) =>
    opportunityObjectMetadataItem?.readableFields.some(
      (field) =>
        field.name === stage.daysField &&
        field.type === FieldMetadataType.NUMBER,
    ),
  );
  if (!opportunityObjectMetadataItem || stages.length === 0) return null;

  const filter = buildStatusBoardMemberFilter({
    objectMetadataItem: opportunityObjectMetadataItem,
    memberIds,
    fieldNames: ['assignee', 'assigneeId'],
  });

  return (
    <StyledStatusBoardSection>
      <StyledStatusBoardSectionHeader>
        <StyledStatusBoardSectionTitle>
          문의 단계별 도달 소요일
        </StyledStatusBoardSectionTitle>
      </StyledStatusBoardSectionHeader>
      <StyledStatusBoardMuted>
        전체 기간 · 생성일부터 최초 관측 도달일까지 평균 · 한국 날짜 기준, 주말
        포함. 측정 전 이력과 미도달 단계는 제외됩니다.
      </StyledStatusBoardMuted>
      <StyledStatusBoardKpiGrid>
        {stages.map((stage) => (
          <StageTimingCard
            key={stage.value}
            stage={stage}
            objectMetadataItem={opportunityObjectMetadataItem}
            filter={filter}
            onOpenSheet={onOpenSheet}
          />
        ))}
      </StyledStatusBoardKpiGrid>
    </StyledStatusBoardSection>
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
    <StatusBoardKpiCard
      label={label}
      value={hasMeasurement ? `${average.toFixed(1)}일` : '—'}
      loading={!dummy.enabled && loading}
      isEmpty={!hasMeasurement}
      subtitle={
        error
          ? '조회 실패'
          : hasMeasurement
            ? `측정 ${count}건`
            : '측정 데이터 없음'
      }
      onClick={() =>
        onOpenSheet({
          title: `${label} 도달 소요일 · 측정 문의`,
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
