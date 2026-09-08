import {
  IconCalendar,
  IconCoins,
  IconFlag,
  IconMessageCirclePlus,
  IconClock,
  IconFileText,
} from 'twenty-ui/icon';
import {
  StyledStatusBoardKpiIcon,
  type StatusBoardTone,
} from '@/status-board/components/statusBoardStyled';

export const StatusBoardKpiIcon = ({
  label,
  tone = 'default',
}: {
  label: string;
  tone?: StatusBoardTone;
}) => {
  const Icon =
    label.includes('미지급') || label.includes('완료')
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
  return (
    <StyledStatusBoardKpiIcon tone={tone}>
      <Icon size={16} aria-hidden />
    </StyledStatusBoardKpiIcon>
  );
};
