import { useAggregateRecords } from '@/object-record/hooks/useAggregateRecords';
import { AggregateOperations } from '@/object-record/record-table/constants/AggregateOperations';
import { getPersonalDashboardComparison } from '@/personal-dashboard/utils/getPersonalDashboardComparison';
import {
  StyledDashboardSection,
  StyledDashboardSectionTitle,
  StyledDashboardSectionHeader,
} from '@/ui/layout/dashboard/components/dashboardStyled';
import { styled } from '@linaria/react';
import { FIELD_FOR_TOTAL_COUNT_AGGREGATE_OPERATION } from 'twenty-shared/constants';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledMetrics = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: repeat(2, minmax(0, 1fr));
  @container (max-width: 360px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;
const StyledMetric = styled.button`
  align-items: center;
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.primary};
  &:focus-visible {
    outline: 2px solid ${themeCssVariables.color.blue};
  }
  &[aria-pressed='true'] {
    border-color: ${themeCssVariables.color.blue};
  }
  cursor: pointer;
  display: flex;
  flex-wrap: wrap;
  font: inherit;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[4]};
  text-align: left;
  text-decoration: none;
  width: 100%;
  &:hover {
    background: ${themeCssVariables.background.tertiary};
  }
  &[data-overdue='true'] strong {
    color: ${themeCssVariables.color.red};
  }
  strong {
    color: ${themeCssVariables.color.blue};
    font-size: ${themeCssVariables.font.size.xxl};
  }
`;
const TaskCount = ({
  label,
  filter,
  onSelect,
  selected,
}: {
  onSelect: () => void;
  selected: boolean;
  label: string;
  filter: RecordGqlOperationFilter;
}) => {
  const { data, loading, error, refetch } = useAggregateRecords({
    objectNameSingular: 'task',
    filter,
    recordGqlFieldsAggregate: {
      [FIELD_FOR_TOTAL_COUNT_AGGREGATE_OPERATION]: [AggregateOperations.COUNT],
    },
  });
  const count = data?.[FIELD_FOR_TOTAL_COUNT_AGGREGATE_OPERATION]?.COUNT;
  return (
    <div>
      <StyledMetric
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        data-overdue={
          label === '기한 지남' &&
          typeof count === 'number' &&
          count > 0 &&
          !loading &&
          !error
        }
        aria-label={`${label} ${loading || error || typeof count !== 'number' ? '확인 중' : `${count}건`} · 내 할 일 확인`}
      >
        <span>{label}</span>
        <strong>
          {loading || error || typeof count !== 'number'
            ? error
              ? '조회 실패'
              : '확인 중…'
            : `${count}건`}
        </strong>
      </StyledMetric>
      {error && (
        <Button
          title="다시 시도"
          size="small"
          onClick={() => {
            void refetch().catch(() => undefined);
          }}
        />
      )}
    </div>
  );
};
export const PersonalDashboardToday = ({
  accountId,
  selectedFilter,
  onSelectFilter,
}: {
  selectedFilter: 'all' | 'today' | 'overdue';
  onSelectFilter: (filter: 'all' | 'today' | 'overdue') => void;
  accountId: string;
}) => {
  const today = getPersonalDashboardComparison().currentEnd;
  const base = [{ assigneeId: { eq: accountId } }, { status: { neq: 'DONE' } }];
  return (
    <StyledDashboardSection>
      <StyledDashboardSectionHeader>
        <StyledDashboardSectionTitle>오늘 챙길 일</StyledDashboardSectionTitle>

        <Button
          title="미완료 전체 보기"
          size="small"
          variant="tertiary"
          onClick={() => onSelectFilter('all')}
        />
      </StyledDashboardSectionHeader>
      <StyledMetrics>
        <TaskCount
          label="오늘 마감"
          selected={selectedFilter === 'today'}
          onSelect={() => onSelectFilter('today')}
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
          selected={selectedFilter === 'overdue'}
          onSelect={() => onSelectFilter('overdue')}
          filter={{
            and: [...base, { dueAt: { lt: `${today}T00:00:00+09:00` } }],
          }}
        />
      </StyledMetrics>
    </StyledDashboardSection>
  );
};
