import { StatusBoardSalesSkeleton } from '@/status-board/components/StatusBoardSalesSkeleton';
import {
  StatusBoardIssuedSales,
  type StatusBoardIssuedSalesProps,
} from '@/status-board/components/StatusBoardIssuedSales';
import { StatusBoardSalesChart } from '@/status-board/components/StatusBoardSalesChart';
import { useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useId, useState } from 'react';

import {
  GAINGE_MONTHLY_SALES,
  type GaingeMonthlySales,
} from '@/status-board/graphql/gaingeMonthlySales';
import {
  StyledStatusBoardPeriodControls,
  StyledStatusBoardSegment,
  StyledStatusBoardSegmentButton,
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
import {
  IconChevronLeft,
  IconChevronRight,
  IconInfoCircle,
  IconRefresh,
} from 'twenty-ui/icon';
import { AppTooltip } from 'twenty-ui/surfaces';
import { IconButton } from 'twenty-ui/input';
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

const StyledRefreshButton = styled(IconButton)`
  height: var(--t-input-height);
  min-width: var(--t-input-height);
`;

const STATUS_MESSAGES = {
  NOT_CONFIGURED: '연결 대기 · 가캠 매출 조회 연결을 준비하고 있습니다.',
  FORBIDDEN: '전사 매출 조회 권한이 없습니다. 관리자에게 권한을 요청해 주세요.',
  AUTH_ERROR:
    '매출 조회 인증이 만료되었거나 권한이 없습니다. 관리자에게 연결 확인을 요청해 주세요.',
  UNAVAILABLE: '가캠 매출 조회 실패 · 새로고침해 주세요.',
} as const;

export const StatusBoardSalesSection = ({
  depositProps,
}: {
  depositProps?: StatusBoardIssuedSalesProps;
}) => {
  const [source, setSource] = useState<'all' | 'gainge' | 'deposit'>(
    depositProps ? 'all' : 'gainge',
  );
  const infoId = useId();
  const refreshId = useId();
  const [chartVersion, setChartVersion] = useState(0);
  const description =
    source === 'all'
      ? '가캠 결제 매출(VAT 제외)과 CRM 총 발행 매출을 함께 표시합니다. 중복 거래가 없다는 전제로 두 금액을 합산합니다. 원천별 VAT 기준이 다를 수 있으며 CRM 금액은 등록된 값을 사용합니다. CRM 입금은 발행일(필드가 없으면 등록일) 기준으로 그룹·구성원 필터를 적용하며 가캠은 전사 기준입니다.'
      : source === 'deposit'
        ? 'CRM 입금 데이터의 총 발행 매출입니다. 발행일(없으면 등록일) 기준이며 상단 그룹·구성원 필터를 적용합니다. 입금 완료와 미입금·예정 금액을 포함하며 실제 입금 완료액과 다릅니다. 가캠 매출과 합산하지 않습니다.'
        : '가캠의 PG·인앱·정기결제 매출을 사업부별로 표시합니다. 환불액 반영·VAT 제외 기준이며 CRM 입금액은 합산하지 않습니다. 상단 그룹·구성원 필터는 적용되지 않습니다. 조회 결과 중 합계는 최대 1분, 일별 그래프는 최대 5분간 유지됩니다. 범례로 사업부를 선택하고 그래프에서 날짜별 금액과 전체 대비 비중을 확인할 수 있습니다.';
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
    skip: source === 'deposit',
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  });
  const report = data?.gaingeMonthlySales;
  const reportDescription =
    source !== 'deposit' &&
    report?.status === 'READY' &&
    report.month === selectedMonth
      ? ` 집계 기간 ${report.startDate} ~ ${report.endDate} (한국 시간). 마지막 조회: ${report.fetchedAt ? new Date(report.fetchedAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : '—'}.`
      : '';
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
    <StyledDashboardSection
      aria-label={
        source === 'all'
          ? '전체 매출 현황'
          : source === 'gainge'
            ? '가캠 사업부별 매출'
            : '입금 총 발행 매출'
      }
    >
      <StyledDashboardSectionHeader>
        <StyledDashboardSectionTitle>
          {source === 'all'
            ? '월 매출 현황'
            : source === 'gainge'
              ? '가캠 월 누적 매출 · 사업부별'
              : '입금 월 매출 · 발행 기준'}
          <span
            data-sales-info={infoId}
            tabIndex={0}
            aria-label={`매출 집계 기준: ${description}${reportDescription}`}
            style={{
              display: 'inline-flex',
              marginLeft: 6,
              verticalAlign: 'middle',
              color: themeCssVariables.font.color.tertiary,
            }}
          >
            <IconInfoCircle size={16} aria-hidden />
          </span>
          <AppTooltip
            anchorSelect={`[data-sales-info="${infoId}"]`}
            content={`${description}${reportDescription}`}
          />
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
          {source !== 'deposit' && (
            <span data-sales-refresh={refreshId}>
              <StyledRefreshButton
                Icon={IconRefresh}
                ariaLabel="매출 새로고침"
                size="medium"
                variant="secondary"
                disabled={loading}
                onClick={() => {
                  setChartVersion((value) => value + 1);
                  void refetch().catch(() => undefined);
                }}
              />
              <AppTooltip
                anchorSelect={`[data-sales-refresh="${refreshId}"]`}
                content="매출 새로고침"
              />
            </span>
          )}
        </StyledStatusBoardPeriodControls>
      </StyledDashboardSectionHeader>
      {depositProps && (
        <StyledStatusBoardSegment aria-label="매출 구분">
          {(['all', 'gainge', 'deposit'] as const).map((item) => (
            <StyledStatusBoardSegmentButton
              key={item}
              type="button"
              isActive={source === item}
              aria-pressed={source === item}
              onClick={() => setSource(item)}
            >
              {item === 'all' ? '전체' : item === 'gainge' ? '가캠' : '입금'}
            </StyledStatusBoardSegmentButton>
          ))}
        </StyledStatusBoardSegment>
      )}
      {source !== 'gainge' && depositProps && (
        <StatusBoardIssuedSales
          key={`${selectedMonth}-${chartVersion}`}
          month={selectedMonth}
          gaingeLoading={source === 'all' && loading}
          gaingeAmount={
            source === 'all' ? (isReady ? report.total : null) : undefined
          }
          depositObjectMetadataItem={depositProps.depositObjectMetadataItem}
          memberIds={depositProps.memberIds}
          selectedGroupIds={depositProps.selectedGroupIds}
          isGroupUnavailable={depositProps.isGroupUnavailable}
        />
      )}
      {source !== 'deposit' &&
        (isReady ? (
          <>
            {source === 'all' && (
              <StyledDashboardMuted>
                가캠 · 사업부별 누적 매출 그래프
              </StyledDashboardMuted>
            )}
            <StatusBoardSalesChart
              key={`${selectedMonth}-${chartVersion}`}
              month={selectedMonth}
            />
            <StyledAmounts>
              {[
                {
                  label: source === 'all' ? '가캠 전체 매출' : '전체 매출',
                  amount: report.total!,
                },
                ...report.departments,
              ].map((item, index) => (
                <div key={`${index}-${item.label}`}>
                  <dt>{item.label}</dt>
                  <dd>{item.amount.toLocaleString('ko-KR')}원</dd>
                </div>
              ))}
            </StyledAmounts>
          </>
        ) : loading ? (
          <StatusBoardSalesSkeleton />
        ) : (
          <StyledDashboardMuted role="status">{message}</StyledDashboardMuted>
        ))}
    </StyledDashboardSection>
  );
};
