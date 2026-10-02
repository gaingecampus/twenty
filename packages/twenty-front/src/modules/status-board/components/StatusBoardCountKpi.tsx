import { type DashboardTone } from '@/ui/layout/dashboard/components/dashboardStyled';
import { formatStatusBoardCount } from '@/status-board/utils/formatStatusBoardCount';
import { DashboardKpiCard } from '@/ui/layout/dashboard/components/DashboardKpiCard';

import { useStatusBoardCount } from '@/status-board/hooks/useStatusBoardCount';
import { useStatusBoardSum } from '@/status-board/hooks/useStatusBoardSum';
import { formatStatusBoardAmount } from '@/status-board/utils/formatStatusBoardAmount';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';

type StatusBoardCountKpiProps = {
  objectNameSingular: string;
  filter?: RecordGqlOperationFilter;
  label: string;
  iconName?: string | null;
  withSum?: boolean;
  showAmountAsValue?: boolean;
  tone?: DashboardTone;
  variant?: 'tile' | 'stat';
  to?: string;
  onClick?: () => void;
};

export const StatusBoardCountKpi = ({
  objectNameSingular,
  filter,
  label,
  iconName,
  withSum = false,
  showAmountAsValue = false,
  tone = 'default',
  variant = 'tile',
  onClick,
  to,
}: StatusBoardCountKpiProps) => {
  const {
    count,
    loading: countLoading,
    error: countError,
  } = useStatusBoardCount({
    objectNameSingular,
    filter,
  });
  const {
    sum,
    loading: sumLoading,
    error: sumError,
  } = useStatusBoardSum({
    objectNameSingular,
    filter,
    skip: withSum !== true && showAmountAsValue !== true,
  });

  const countLabel = `${count.toLocaleString('ko-KR')}건`;
  const hasError = Boolean(
    countError || ((withSum || showAmountAsValue) && sumError),
  );

  return (
    <DashboardKpiCard
      label={label}
      iconName={iconName}
      inlineSubtitle={(showAmountAsValue || withSum) && !hasError}
      exactValue={!hasError && !showAmountAsValue ? countLabel : undefined}
      value={
        hasError
          ? '—'
          : showAmountAsValue
            ? formatStatusBoardAmount(count === 0 ? 0 : sum)
            : formatStatusBoardCount(count)
      }
      subtitle={
        hasError
          ? '불러오지 못했어요'
          : showAmountAsValue
            ? countLabel
            : withSum
              ? formatStatusBoardAmount(count === 0 ? 0 : sum)
              : undefined
      }
      loading={countLoading || ((withSum || showAmountAsValue) && sumLoading)}
      tone={count === 0 || hasError ? 'default' : tone}
      isEmpty={!countLoading && !hasError && count === 0}
      variant={variant}
      onClick={onClick}
      to={to}
    />
  );
};
