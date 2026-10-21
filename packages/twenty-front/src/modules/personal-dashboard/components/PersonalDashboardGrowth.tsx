import { useId } from 'react';
import { AppTooltip } from 'twenty-ui/surfaces';
import { IconInfoCircle } from 'twenty-ui/icon';
import { useAggregateRecords } from '@/object-record/hooks/useAggregateRecords';
import { AggregateOperations } from '@/object-record/record-table/constants/AggregateOperations';
import {
  formatPersonalDashboardGrowth,
  getPersonalDashboardComparison,
} from '@/personal-dashboard/utils/getPersonalDashboardComparison';
import { StyledDashboardMuted } from '@/ui/layout/dashboard/components/dashboardStyled';
import { styled } from '@linaria/react';
import { FIELD_FOR_TOTAL_COUNT_AGGREGATE_OPERATION } from 'twenty-shared/constants';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledComparison = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.secondary};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]};
`;
const StyledBadge = styled.strong`
  background: ${themeCssVariables.background.tertiary};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.color.blue};
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
`;
const StyledNumbers = styled.div`
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

export const PersonalDashboardGrowth = ({
  objectNameSingular,
  filter,
  dateField,
  label,
}: {
  objectNameSingular: string;
  filter: RecordGqlOperationFilter;
  dateField: string;
  label: string;
}) => {
  const tooltipId = useId();
  const range = getPersonalDashboardComparison();
  // Date-only fields use calendar dates; timestamps use explicit Korean time.
  const isDateOnly = dateField === 'contractStartDate';
  const makeFilter = (start: string, end: string) => ({
    and: [
      filter,
      { [dateField]: { gte: isDateOnly ? start : `${start}T00:00:00+09:00` } },
      { [dateField]: { lte: isDateOnly ? end : `${end}T23:59:59.999+09:00` } },
    ],
  });
  const aggregate = {
    [FIELD_FOR_TOTAL_COUNT_AGGREGATE_OPERATION]: [AggregateOperations.COUNT],
  };
  const current = useAggregateRecords({
    objectNameSingular,
    filter: makeFilter(range.currentStart, range.currentEnd),
    recordGqlFieldsAggregate: aggregate,
  });
  const previous = useAggregateRecords({
    objectNameSingular,
    filter: makeFilter(range.previousStart, range.previousEnd),
    recordGqlFieldsAggregate: aggregate,
  });
  const currentCount =
    current.data?.[FIELD_FOR_TOTAL_COUNT_AGGREGATE_OPERATION]?.COUNT;
  const previousCount =
    previous.data?.[FIELD_FOR_TOTAL_COUNT_AGGREGATE_OPERATION]?.COUNT;
  const ready =
    !current.loading &&
    !previous.loading &&
    !current.error &&
    !previous.error &&
    typeof currentCount === 'number' &&
    typeof previousCount === 'number';
  return (
    <StyledComparison aria-label={`${label} 지난달 대비`}>
      {ready ? (
        <StyledNumbers>
          <StyledBadge>
            지난달 대비{' '}
            {formatPersonalDashboardGrowth(currentCount, previousCount)}
          </StyledBadge>
        </StyledNumbers>
      ) : (
        <StyledDashboardMuted role="status">
          {current.error || previous.error
            ? '비교 수치를 불러오지 못했습니다.'
            : '비교 수치를 확인하는 중입니다…'}
        </StyledDashboardMuted>
      )}
      <span
        tabIndex={0}
        data-personal-growth-info={tooltipId}
        aria-label={`${label} 비교 기준`}
      >
        <IconInfoCircle size={16} aria-hidden />
      </span>
      <AppTooltip
        anchorSelect={`[data-personal-growth-info="${tooltipId}"]`}
        content={`${ready ? `이번 달 ${currentCount}건 · 지난달 ${previousCount}건. ` : ''}${label}: 이번 달 ${range.currentStart}~${range.currentEnd}, 지난달 ${range.previousStart}~${range.previousEnd} (한국 시간). 현재 담당 기준이며 (이번 달−지난달)÷지난달×100으로 계산합니다. 지난달 0건이면 신규 발생으로 표시합니다.`}
      />
    </StyledComparison>
  );
};
