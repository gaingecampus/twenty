import {
  IconCalendar,
  IconCoins,
  IconFlag,
  IconMessageCirclePlus,
  IconClock,
  IconFileText,
} from 'twenty-ui/icon';
import {
  StyledStatusBoardCumulativeButton,
  StyledStatusBoardCumulativeLabel,
  StyledStatusBoardCumulativeValue,
  StyledStatusBoardKpiButton,
  StyledStatusBoardKpiIcon,
  StyledStatusBoardKpiLabel,
  StyledStatusBoardKpiSubtitle,
  StyledStatusBoardKpiValue,
  type StatusBoardTone,
} from '@/status-board/components/statusBoardStyled';

type StatusBoardKpiCardProps = {
  label: string;
  value: string;
  subtitle?: string;
  loading: boolean;
  tone?: StatusBoardTone;
  variant?: 'tile' | 'stat';
  onClick?: () => void;
};

export const StatusBoardKpiCard = ({
  label,
  value,
  subtitle,
  loading,
  tone = 'default',
  variant = 'tile',
  onClick,
}: StatusBoardKpiCardProps) => {
  const Icon =
    label.includes('미수') || label.includes('완료')
      ? IconCoins
      : label.includes('문의')
        ? IconMessageCirclePlus
        : label.includes('종료')
          ? IconCalendar
          : label.includes('예정')
            ? IconClock
            : label.includes('시작')
              ? IconFileText
              : IconFlag;

  if (variant === 'stat') {
    return (
      <StyledStatusBoardCumulativeButton type="button" onClick={onClick}>
        <StyledStatusBoardCumulativeValue>
          {loading ? '…' : value}
        </StyledStatusBoardCumulativeValue>
        <StyledStatusBoardCumulativeLabel>
          {label}
        </StyledStatusBoardCumulativeLabel>
        {subtitle !== undefined && (
          <StyledStatusBoardKpiSubtitle>
            {subtitle}
          </StyledStatusBoardKpiSubtitle>
        )}
      </StyledStatusBoardCumulativeButton>
    );
  }

  return (
    <StyledStatusBoardKpiButton type="button" tone={tone} onClick={onClick}>
      <StyledStatusBoardKpiIcon tone={tone}>
        <Icon size={20} />
      </StyledStatusBoardKpiIcon>
      <StyledStatusBoardKpiLabel>{label}</StyledStatusBoardKpiLabel>
      <StyledStatusBoardKpiValue tone={tone}>
        {loading ? '…' : value}
      </StyledStatusBoardKpiValue>
      {subtitle !== undefined && (
        <StyledStatusBoardKpiSubtitle>{subtitle}</StyledStatusBoardKpiSubtitle>
      )}
    </StyledStatusBoardKpiButton>
  );
};
