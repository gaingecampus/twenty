import { useAggregateRecords } from '@/object-record/hooks/useAggregateRecords';
import { AggregateOperations } from '@/object-record/record-table/constants/AggregateOperations';
import { getPersonalDashboardComparison } from '@/personal-dashboard/utils/getPersonalDashboardComparison';
import {
  StyledDashboardSection,
  StyledDashboardSectionTitle,
  StyledDashboardMuted,
} from '@/ui/layout/dashboard/components/dashboardStyled';
import { styled } from '@linaria/react';
import { FIELD_FOR_TOTAL_COUNT_AGGREGATE_OPERATION } from 'twenty-shared/constants';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledMetrics = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: repeat(2, minmax(0, 1fr));
`;
const StyledMetric = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  strong {
    color: ${themeCssVariables.color.blue};
    font-size: 32px;
  }
`;
const TaskCount = ({
  label,
  filter,
}: {
  label: string;
  filter: RecordGqlOperationFilter;
}) => {
  const { data, loading, error } = useAggregateRecords({
    objectNameSingular: 'task',
    filter,
    recordGqlFieldsAggregate: {
      [FIELD_FOR_TOTAL_COUNT_AGGREGATE_OPERATION]: [AggregateOperations.COUNT],
    },
  });
  const count = data?.[FIELD_FOR_TOTAL_COUNT_AGGREGATE_OPERATION]?.COUNT;
  return (
    <StyledMetric>
      <span>{label}</span>
      <strong>
        {loading || error || typeof count !== 'number' ? '—' : `${count}건`}
      </strong>
      {error && (
        <StyledDashboardMuted>다시 조회해 주세요.</StyledDashboardMuted>
      )}
    </StyledMetric>
  );
};
export const PersonalDashboardToday = ({
  accountId,
}: {
  accountId: string;
}) => {
  const today = getPersonalDashboardComparison().currentEnd;
  const base = [{ assigneeId: { eq: accountId } }, { status: { neq: 'DONE' } }];
  return (
    <StyledDashboardSection>
      <StyledDashboardSectionTitle>오늘 챙길 일</StyledDashboardSectionTitle>
      <StyledDashboardMuted>
        오늘 마감할 일과 기한이 지난 일부터 확인해 보세요.
      </StyledDashboardMuted>
      <StyledMetrics>
        <TaskCount
          label="오늘 마감"
          filter={{
            and: [
              ...base,
              { dueAt: { gte: `${today}T00:00:00+09:00` } },
              { dueAt: { lte: `${today}T23:59:59.999+09:00` } },
            ],
          }}
        />
        <TaskCount
          label="기한 지남"
          filter={{
            and: [...base, { dueAt: { lt: `${today}T00:00:00+09:00` } }],
          }}
        />
      </StyledMetrics>
    </StyledDashboardSection>
  );
};
