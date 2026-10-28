import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useStatusBoardMetadata } from '@/status-board/hooks/useStatusBoardMetadata';
import { hasStatusBoardField } from '@/status-board/utils/hasStatusBoardField';
import {
  calculateCashFlow,
  readCashFlowCurrency,
} from '@/status-board/utils/calculateCashFlow';
import {
  StyledDashboardSection,
  StyledDashboardSectionHeader,
  StyledDashboardSectionTitle,
  StyledDashboardMuted,
  StyledDashboardKpiGrid,
  StyledDashboardKpiLabel,
  StyledDashboardKpiValue,
} from '@/ui/layout/dashboard/components/dashboardStyled';
import { styled } from '@linaria/react';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledMetric = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  min-width: 0;
  overflow-wrap: anywhere;
  padding: ${themeCssVariables.spacing[3]};
`;
const SNAPSHOT_FIELDS = {
  id: true,
  month: true,
  capturedAt: true,
  shinhanBalance: { amountMicros: true, currencyCode: true },
  kbBalance: { amountMicros: true, currencyCode: true },
  nhBalance: { amountMicros: true, currencyCode: true },
  expectedIncoming: { amountMicros: true, currencyCode: true },
  plannedExpense: { amountMicros: true, currencyCode: true },
  shinhanMeasuredAt: true,
  kbMeasuredAt: true,
  nhMeasuredAt: true,
};
const formatAmount = (value: number | null) =>
  value === null ? '—' : `${value.toLocaleString('ko-KR')}원`;
const formatDate = (value: unknown) =>
  typeof value === 'string' && Number.isFinite(Date.parse(value))
    ? new Intl.DateTimeFormat('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(value))
    : '—';

const CashFlowValues = ({ month }: { month: string }) => {
  const snapshot = useFindManyRecords({
    objectNameSingular: 'cashFlowSnapshot',
    filter: { month: { eq: month } },
    limit: 1,
    orderBy: [{ capturedAt: 'DescNullsLast' }, { id: 'AscNullsLast' }],
    recordGqlFields: SNAPSHOT_FIELDS,
  });
  const row = snapshot.records.at(0);
  const loading = snapshot.loading;
  const balance = calculateCashFlow({
    banks: [
      readCashFlowCurrency(row?.shinhanBalance),
      readCashFlowCurrency(row?.kbBalance),
      readCashFlowCurrency(row?.nhBalance),
    ],
    incoming: readCashFlowCurrency(row?.expectedIncoming),
    outgoing: readCashFlowCurrency(row?.plannedExpense),
  });
  const values = [
    ['잔액', balance.balance],
    ['입금예정액', balance.incoming],
    ['지출예정액', balance.outgoing],
    ['이번달 가용액', balance.available],
  ] as const;
  return (
    <>
      <StyledDashboardSectionHeader>
        <StyledDashboardMuted>{month} · 전사 기준</StyledDashboardMuted>
        <Button
          title="새로고침"
          disabled={loading}
          onClick={() => {
            void snapshot.refetch();
          }}
        />
      </StyledDashboardSectionHeader>
      <StyledDashboardKpiGrid columns={4} aria-busy={loading}>
        {values.map(([label, amount]) => (
          <StyledMetric key={label}>
            <StyledDashboardKpiLabel>{label}</StyledDashboardKpiLabel>
            <StyledDashboardKpiValue>
              {loading || snapshot.error ? '—' : formatAmount(amount)}
            </StyledDashboardKpiValue>
          </StyledMetric>
        ))}
      </StyledDashboardKpiGrid>
      {snapshot.error ? (
        <StyledDashboardMuted role="alert">
          자금 흐름을 불러오지 못했습니다. 다시 시도해 주세요.
        </StyledDashboardMuted>
      ) : !loading && !row ? (
        <StyledDashboardMuted role="status">
          이번 달 입출금·지출대기액 백업을 등록해 주세요.
        </StyledDashboardMuted>
      ) : (
        <>
          <StyledDashboardMuted>
            시트 백업 기준 {formatDate(row?.capturedAt)} · 완료 입금 및 분할
            잔금 중복 제외 · 그룹·구성원 필터 미적용
          </StyledDashboardMuted>
          <StyledDashboardMuted>
            은행별 마지막 거래: 신한 {formatDate(row?.shinhanMeasuredAt)} · 국민{' '}
            {formatDate(row?.kbMeasuredAt)} · 농협{' '}
            {formatDate(row?.nhMeasuredAt)}
          </StyledDashboardMuted>
        </>
      )}
    </>
  );
};

export const StatusBoardCashFlowSection = () => {
  const { cashFlowSnapshot } = useStatusBoardMetadata();
  const month = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
  }).format(new Date());
  const available =
    cashFlowSnapshot &&
    Object.keys(SNAPSHOT_FIELDS).every((field) =>
      hasStatusBoardField(cashFlowSnapshot, field),
    );
  return (
    <StyledDashboardSection aria-label="주간 자금 흐름 (월간)">
      <StyledDashboardSectionTitle>
        주간 자금 흐름 (월간)
      </StyledDashboardSectionTitle>
      {available ? (
        <CashFlowValues month={month} />
      ) : (
        <StyledDashboardMuted role="status">
          자금 흐름 백업의 조회 권한을 확인해 주세요.
        </StyledDashboardMuted>
      )}
    </StyledDashboardSection>
  );
};
