import {
  StyledDashboardKpiIcon,
  type DashboardTone,
} from '@/ui/layout/dashboard/components/dashboardStyled';
import {
  IconCalendar,
  IconCoins,
  IconFlag,
  IconMessageCirclePlus,
  IconClock,
  IconFileText,
} from 'twenty-ui/icon';

export const DashboardKpiIcon = ({
  label,
  tone = 'default',
}: {
  label: string;
  tone?: DashboardTone;
}) => {
  const Icon =
    label.includes('미지급') ||
    label.includes('미입금') ||
    label.includes('완료')
      ? IconCoins
      : label.includes('문의') || label.includes('리드')
        ? IconMessageCirclePlus
        : label.includes('종료')
          ? IconCalendar
          : label.includes('예정')
            ? IconClock
            : label.includes('시작')
              ? IconFileText
              : IconFlag;
  return (
    <StyledDashboardKpiIcon tone={tone}>
      <Icon size={16} aria-hidden />
    </StyledDashboardKpiIcon>
  );
};
