import {
  StyledDashboardKpiGrid,
  StyledDashboardKpiLabel,
  StyledDashboardKpiValue,
} from '@/ui/layout/dashboard/components/dashboardStyled';
import { StatusBoardSalesSkeleton } from '@/status-board/components/StatusBoardSalesSkeleton';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';
import { useStatusBoardSum } from '@/status-board/hooks/useStatusBoardSum';

const StyledShare = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
`;
const StyledHeader = styled.div`
  align-items: baseline;
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  flex-wrap: wrap;
  font-size: 13px;
  gap: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[4]};
  justify-content: space-between;
`;
const StyledMetricLabel = styled(StyledDashboardKpiLabel)`
  align-self: flex-start;
`;
const StyledMetric = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  min-width: 0;
  overflow-wrap: anywhere;
  padding: ${themeCssVariables.spacing[4]};
`;
const StyledTrack = styled.div`
  background: ${themeCssVariables.background.tertiary};
  border-radius: 6px;
  display: flex;
  height: 12px;
  overflow: hidden;
`;
const StyledFill = styled.div<{ share: number; paid: boolean }>`
  background: ${({ paid }) =>
    paid ? themeCssVariables.color.green : themeCssVariables.color.orange};
  height: 100%;
  width: ${({ share }) => `${share}%`};
`;
const StyledLegend = styled.span<{ paid: boolean }>`
  align-items: center;
  display: inline-flex;
  gap: 6px;
  &::before {
    background: ${({ paid }) =>
      paid ? themeCssVariables.color.green : themeCssVariables.color.orange};
    border-radius: 2px;
    content: '';
    height: 8px;
    width: 8px;
  }
`;

export const StatusBoardDepositShare = ({
  paidFilter,
  dueFilter,
  dateBasis,
  gaingeAmount,
  gaingeLoading = false,
}: {
  paidFilter?: RecordGqlOperationFilter;
  dueFilter?: RecordGqlOperationFilter;
  dateBasis: string;
  gaingeAmount?: number | null;
  gaingeLoading?: boolean;
}) => {
  const paid = useStatusBoardSum({
    objectNameSingular: 'deposit',
    filter: paidFilter,
  });
  const due = useStatusBoardSum({
    objectNameSingular: 'deposit',
    filter: dueFilter,
  });
  const loading = paid.loading || due.loading;
  const paidAmount = paid.sum ?? 0;
  const dueAmount = due.sum ?? 0;
  const total = paidAmount + dueAmount;
  const invalid = !Number.isFinite(total) || paidAmount < 0 || dueAmount < 0;
  const error = Boolean(paid.error || due.error);
  const hasShare = !loading && !error && !invalid && total > 0;
  const share = hasShare ? (paidAmount / total) * 100 : 0;
  const paidPercent = Math.round(share * 10) / 10;
  const duePercent = Math.round((100 - paidPercent) * 10) / 10;
  const message = loading
    ? '입금 비중을 불러오는 중이에요'
    : error
      ? '입금 비중을 불러오지 못했어요'
      : invalid
        ? '금액을 확인해야 비중을 표시할 수 있어요'
        : '선택한 기간에 집계된 입금 금액이 없어요';
  if (loading) return <StatusBoardSalesSkeleton chart={false} />;
  return (
    <StyledShare
      aria-busy={loading}
      aria-label={`입금 요약 · ${dateBasis} 기준`}
    >
      <StyledDashboardKpiGrid columns={gaingeAmount !== undefined ? 3 : 1}>
        {gaingeAmount !== undefined && (
          <StyledMetric>
            <StyledMetricLabel>전체 합계</StyledMetricLabel>
            <StyledDashboardKpiValue tone="blue">
              {gaingeLoading || error || invalid || gaingeAmount === null
                ? '—'
                : `${(gaingeAmount + total / 1_000_000).toLocaleString('ko-KR')}원`}
            </StyledDashboardKpiValue>
          </StyledMetric>
        )}
        <StyledMetric>
          <StyledMetricLabel>
            {gaingeAmount !== undefined
              ? '입금 · 총 발행 매출'
              : '총 발행 매출'}
          </StyledMetricLabel>
          <StyledDashboardKpiValue>
            {error || invalid
              ? '—'
              : `${(total / 1_000_000).toLocaleString('ko-KR')}원`}
          </StyledDashboardKpiValue>
        </StyledMetric>
        {gaingeAmount !== undefined && (
          <StyledMetric>
            <StyledMetricLabel>가캠 매출</StyledMetricLabel>
            <StyledDashboardKpiValue>
              {gaingeLoading || gaingeAmount === null
                ? '—'
                : `${gaingeAmount.toLocaleString('ko-KR')}원`}
            </StyledDashboardKpiValue>
          </StyledMetric>
        )}
      </StyledDashboardKpiGrid>
      {hasShare && (
        <>
          <StyledTrack
            role="img"
            aria-label={`입금 완료 ${paidPercent}%, 미입금·입금 예정 ${duePercent}%`}
          >
            <StyledFill paid share={share} />
            <StyledFill paid={false} share={100 - share} />
          </StyledTrack>
          <StyledHeader>
            <StyledLegend paid>입금 완료 {paidPercent}%</StyledLegend>
            <StyledLegend paid={false}>
              미입금·예정 {duePercent}% ·{' '}
              {(dueAmount / 1_000_000).toLocaleString('ko-KR')}원
            </StyledLegend>
          </StyledHeader>
        </>
      )}
      {(loading || error || invalid) && (
        <StyledHeader role="status">{message}</StyledHeader>
      )}
    </StyledShare>
  );
};
