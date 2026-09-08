import { StatusBoardKpiCard } from '@/status-board/components/StatusBoardKpiCard';
import { type StatusBoardTone } from '@/status-board/components/statusBoardStyled';
import { useStatusBoardCount } from '@/status-board/hooks/useStatusBoardCount';
import { useStatusBoardSum } from '@/status-board/hooks/useStatusBoardSum';
import { formatStatusBoardAmount } from '@/status-board/utils/formatStatusBoardAmount';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';

type StatusBoardCountKpiProps = {
  objectNameSingular: string;
  filter?: RecordGqlOperationFilter;
  label: string;
  withSum?: boolean;
  showAmountAsValue?: boolean;
  tone?: StatusBoardTone;
  variant?: 'tile' | 'stat';
  to?: string;
  onClick?: () => void;
};

export const StatusBoardCountKpi = ({
  objectNameSingular,
  filter,
  label,
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
    <StatusBoardKpiCard
      label={label}
      value={
        hasError
          ? '—'
          : showAmountAsValue
            ? formatStatusBoardAmount(count === 0 ? 0 : sum)
            : countLabel
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
