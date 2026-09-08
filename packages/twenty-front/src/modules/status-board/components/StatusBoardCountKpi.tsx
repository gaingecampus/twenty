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
  const { count, loading: countLoading } = useStatusBoardCount({
    objectNameSingular,
    filter,
  });
  const { sum, loading: sumLoading } = useStatusBoardSum({
    objectNameSingular,
    filter,
    skip: withSum !== true && showAmountAsValue !== true,
  });

  const countLabel = `${count}건`;

  return (
    <StatusBoardKpiCard
      label={label}
      value={showAmountAsValue ? formatStatusBoardAmount(sum) : countLabel}
      subtitle={
        showAmountAsValue
          ? countLabel
          : withSum
            ? formatStatusBoardAmount(sum)
            : undefined
      }
      loading={countLoading || ((withSum || showAmountAsValue) && sumLoading)}
      tone={tone}
      variant={variant}
      onClick={onClick}
    />
  );
};
