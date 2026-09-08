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
          : count === 0
            ? '해당 항목 없음'
            : showAmountAsValue
              ? countLabel
              : withSum
                ? formatStatusBoardAmount(sum)
                : '눌러서 목록 보기'
      }
      loading={countLoading || ((withSum || showAmountAsValue) && sumLoading)}
      tone={count === 0 || hasError ? 'default' : tone}
      variant={variant}
      onClick={onClick}
    />
  );
};
