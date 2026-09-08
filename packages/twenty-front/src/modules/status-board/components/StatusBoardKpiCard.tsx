import {
  StyledStatusBoardKpiButton,
  StyledStatusBoardKpiLabel,
  StyledStatusBoardKpiValue,
} from '@/status-board/components/statusBoardStyled';

type StatusBoardKpiCardProps = {
  label: string;
  value: string;
  subtitle?: string;
  loading: boolean;
  onClick?: () => void;
};

export const StatusBoardKpiCard = ({
  label,
  value,
  subtitle,
  loading,
  onClick,
}: StatusBoardKpiCardProps) => {
  return (
    <StyledStatusBoardKpiButton type="button" onClick={onClick}>
      <StyledStatusBoardKpiLabel>{label}</StyledStatusBoardKpiLabel>
      <StyledStatusBoardKpiValue>
        {loading ? '…' : value}
      </StyledStatusBoardKpiValue>
      {subtitle !== undefined && (
        <StyledStatusBoardKpiLabel>{subtitle}</StyledStatusBoardKpiLabel>
      )}
    </StyledStatusBoardKpiButton>
  );
};
