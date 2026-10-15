import { useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useState } from 'react';

import {
  GAINGE_MONTHLY_SALES,
  type GaingeMonthlySales,
} from '@/status-board/graphql/gaingeMonthlySales';
import {
  StyledStatusBoardPeriodControls,
  StyledStatusBoardPeriodNav,
  StyledStatusBoardPeriodNavButton,
  StyledStatusBoardPeriodLabel,
} from '@/status-board/components/statusBoardStyled';
import {
  StyledDashboardSection,
  StyledDashboardSectionHeader,
  StyledDashboardSectionTitle,
  StyledDashboardMuted,
} from '@/ui/layout/dashboard/components/dashboardStyled';
import { IconChevronLeft, IconChevronRight } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledAmounts = styled.dl`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  margin: 0;

  > div {
    background: ${themeCssVariables.background.secondary};
    border-radius: ${themeCssVariables.border.radius.md};
    min-width: 0;
    padding: 16px;
  }
  dt {
    color: ${themeCssVariables.font.color.secondary};
    font-size: 14px;
  }
  dd {
    color: ${themeCssVariables.font.color.primary};
    font-size: 20px;
    font-variant-numeric: tabular-nums;
    font-weight: ${themeCssVariables.font.weight.semiBold};
    margin: 10px 0 0;
    overflow-wrap: anywhere;
  }
  > div:first-child dd {
    color: ${themeCssVariables.color.blue};
  }
`;

const STATUS_MESSAGES = {
  NOT_CONFIGURED: '연결 대기 · 가캠 매출 조회 연결을 준비하고 있습니다.',
  FORBIDDEN: '전사 매출 조회 권한이 없습니다. 관리자에게 권한을 요청해 주세요.',
  AUTH_ERROR:
    '매출 조회 인증이 만료되었거나 권한이 없습니다. 관리자에게 연결 확인을 요청해 주세요.',
  UNAVAILABLE: '매출 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
} as const;

export const StatusBoardSalesSection = () => {
  const currentMonth = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
  }).format(new Date());
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const { data, loading, error, refetch } = useQuery<{
    gaingeMonthlySales: GaingeMonthlySales;
  }>(GAINGE_MONTHLY_SALES, {
    variables: { month: selectedMonth },
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  });
  const report = data?.gaingeMonthlySales;
  const isReady =
    !loading &&
    !error &&
    report?.status === 'READY' &&
    report.month === selectedMonth &&
    report.total !== null;
  const shiftMonth = (delta: number) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1 + delta, 1));

    setSelectedMonth(date.toISOString().slice(0, 7));
  };
  const message = loading
    ? '매출 정보를 불러오는 중입니다…'
    : error || !report
      ? STATUS_MESSAGES.UNAVAILABLE
      : report.status === 'READY'
        ? STATUS_MESSAGES.UNAVAILABLE
        : (STATUS_MESSAGES[report.status] ?? STATUS_MESSAGES.UNAVAILABLE);

  return (
    <StyledDashboardSection aria-label="가캠 사업부별 매출">
      <StyledDashboardSectionHeader>
        <StyledDashboardSectionTitle>
          월 누적 매출 · 사업부별
        </StyledDashboardSectionTitle>
        <StyledStatusBoardPeriodControls>
          <StyledStatusBoardPeriodNav>
            <StyledStatusBoardPeriodNavButton
              type="button"
              aria-label="이전 매출 월"
              disabled={selectedMonth <= '2000-01'}
              onClick={() => shiftMonth(-1)}
            >
              <IconChevronLeft size={16} />
            </StyledStatusBoardPeriodNavButton>
            <StyledStatusBoardPeriodLabel>
              {selectedMonth.replace('-', '년 ')}월
            </StyledStatusBoardPeriodLabel>
            <StyledStatusBoardPeriodNavButton
              type="button"
              aria-label="다음 매출 월"
              disabled={selectedMonth >= currentMonth}
              onClick={() => shiftMonth(1)}
            >
              <IconChevronRight size={16} />
            </StyledStatusBoardPeriodNavButton>
          </StyledStatusBoardPeriodNav>
          <Button
            title="새로고침"
            ariaLabel="매출 새로고침"
            size="small"
            variant="secondary"
            disabled={loading}
            onClick={() => {
              void refetch().catch(() => undefined);
            }}
          />
        </StyledStatusBoardPeriodControls>
      </StyledDashboardSectionHeader>
      <StyledDashboardMuted>
        가캠 전사 매출 · VAT 제외 · 상단 그룹·구성원 필터 미적용
      </StyledDashboardMuted>
      {isReady ? (
        <>
          <StyledAmounts>
            {[
              { label: '전체 매출', amount: report.total! },
              ...report.departments,
            ].map((item, index) => (
              <div key={`${index}-${item.label}`}>
                <dt>{item.label}</dt>
                <dd>{item.amount.toLocaleString('ko-KR')}원</dd>
              </div>
            ))}
          </StyledAmounts>
          <StyledDashboardMuted>
            집계 기간 {report.startDate} ~ {report.endDate} (한국 시간) · 마지막
            조회{' '}
            {report.fetchedAt
              ? new Date(report.fetchedAt).toLocaleString('ko-KR', {
                  timeZone: 'Asia/Seoul',
                })
              : '—'}
          </StyledDashboardMuted>
          <StyledDashboardMuted>
            PG·인앱 결제 기준이며 CRM 입금액은 합산하지 않습니다. 조회 결과는
            최대 1분간 유지됩니다.
          </StyledDashboardMuted>
        </>
      ) : (
        <StyledDashboardMuted role="status">{message}</StyledDashboardMuted>
      )}
    </StyledDashboardSection>
  );
};
