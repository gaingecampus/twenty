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
      <StyledStatusBoardCumulativeButton
        type="button"
        aria-label={`${label} ${loading ? '불러오는 중' : value} · 상세 목록 보기`}
        aria-busy={loading}
        onClick={onClick}
      >
        <StyledStatusBoardCumulativeValue>
          {loading ? '…' : value}
        </StyledStatusBoardCumulativeValue>
        <StyledStatusBoardCumulativeLabel>
          {label}
        </StyledStatusBoardCumulativeLabel>
        <StyledStatusBoardKpiSubtitle>
          {loading ? '불러오는 중…' : (subtitle ?? '\u00a0')}
        </StyledStatusBoardKpiSubtitle>
      </StyledStatusBoardCumulativeButton>
    );
  }

  return (
    <StyledStatusBoardKpiButton
      type="button"
      aria-label={`${label} ${loading ? '불러오는 중' : value} · 상세 목록 보기`}
      aria-busy={loading}
      tone={tone}
      onClick={onClick}
    >
      <StyledStatusBoardKpiIcon tone={tone}>
        <Icon size={20} />
      </StyledStatusBoardKpiIcon>
      <StyledStatusBoardKpiLabel>{label}</StyledStatusBoardKpiLabel>
      <StyledStatusBoardKpiValue tone={tone}>
        {loading ? '…' : value}
      </StyledStatusBoardKpiValue>
      <StyledStatusBoardKpiSubtitle>
        {loading ? '불러오는 중…' : (subtitle ?? '\u00a0')}
      </StyledStatusBoardKpiSubtitle>
    </StyledStatusBoardKpiButton>
  );
};
