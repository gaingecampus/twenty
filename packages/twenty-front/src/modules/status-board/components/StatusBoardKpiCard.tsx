import { Link } from 'react-router-dom';
import { StatusBoardKpiIcon } from '@/status-board/components/StatusBoardKpiIcon';
import {
  StyledStatusBoardCumulativeButton,
  StyledStatusBoardCumulativeLabel,
  StyledStatusBoardCumulativeValue,
  StyledStatusBoardKpiButton,
  StyledStatusBoardKpiLabel,
  StyledStatusBoardKpiSubtitle,
  StyledStatusBoardKpiValue,
  type StatusBoardTone,
} from '@/status-board/components/statusBoardStyled';

type StatusBoardKpiCardProps = {
  label: string;
  exactValue?: string;
  value: string;
  subtitle?: string;
  loading: boolean;
  isEmpty?: boolean;
  tone?: StatusBoardTone;
  variant?: 'tile' | 'stat';
  to?: string;
  onClick?: () => void;
};

export const StatusBoardKpiCard = ({
  label,
  exactValue,
  value,
  subtitle,
  loading,
  isEmpty = false,
  tone = 'default',
  variant = 'tile',
  onClick,
  to,
}: StatusBoardKpiCardProps) => {
  const valueParts = /^(.*?)(건|만|억)$/.exec(value);
  const displayValue = loading ? (
    '…'
  ) : valueParts ? (
    <>
      {valueParts[1]}
      <small>{valueParts[2]}</small>
    </>
  ) : (
    value
  );

  if (variant === 'stat') {
    return (
      <StyledStatusBoardCumulativeButton
        type="button"
        aria-label={`${label} ${loading ? '불러오는 중' : (exactValue ?? value)} · 상세 목록 보기`}
        title={loading ? undefined : exactValue}
        aria-busy={loading}
        onClick={onClick}
      >
        <StyledStatusBoardCumulativeLabel>
          {label}
        </StyledStatusBoardCumulativeLabel>
        <StyledStatusBoardCumulativeValue isEmpty={isEmpty}>
          {displayValue}
        </StyledStatusBoardCumulativeValue>
        {!loading && subtitle && (
          <StyledStatusBoardKpiSubtitle>
            {subtitle}
          </StyledStatusBoardKpiSubtitle>
        )}
      </StyledStatusBoardCumulativeButton>
    );
  }

  return (
    <StyledStatusBoardKpiButton
      as={to ? Link : 'button'}
      to={to}
      type={to ? undefined : 'button'}
      aria-label={`${label} ${loading ? '불러오는 중' : (exactValue ?? value)} · 상세 목록 보기`}
      title={loading ? undefined : exactValue}
      aria-busy={loading}
      tone={tone}
      onClick={onClick}
    >
      <StatusBoardKpiIcon label={label} tone={tone} />
      <StyledStatusBoardKpiLabel>{label}</StyledStatusBoardKpiLabel>
      <StyledStatusBoardKpiValue tone={tone} isEmpty={isEmpty}>
        {displayValue}
      </StyledStatusBoardKpiValue>
      {!loading && subtitle && (
        <StyledStatusBoardKpiSubtitle>{subtitle}</StyledStatusBoardKpiSubtitle>
      )}
    </StyledStatusBoardKpiButton>
  );
};
