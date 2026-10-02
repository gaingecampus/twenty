import { type ReactNode } from 'react';
import {
  StyledDashboardSoftTab,
  StyledDashboardTabCount,
} from '@/ui/layout/dashboard/components/dashboardStyled';

type DashboardCountTabProps = {
  label: string;
  count: ReactNode;
  isActive: boolean;
  loading?: boolean;
  countTitle?: string;
  onClick: () => void;
};

export const DashboardCountTab = ({
  label,
  count,
  isActive,
  loading = false,
  countTitle,
  onClick,
}: DashboardCountTabProps) => (
  <StyledDashboardSoftTab
    type="button"
    isActive={isActive}
    aria-pressed={isActive}
    aria-busy={loading}
    onClick={onClick}
  >
    {label}
    <StyledDashboardTabCount title={countTitle}>
      {loading ? '…' : count}
    </StyledDashboardTabCount>
  </StyledDashboardSoftTab>
);
