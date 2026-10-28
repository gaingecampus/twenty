import { getCashFlowToday } from '@/status-board/utils/getCashFlowToday';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type StatusBoardSheetState } from '@/status-board/components/StatusBoardSheet';
import { useCashFlowDetails } from '@/status-board/hooks/useCashFlowDetails';
import { useCashFlowPendingExpense } from '@/status-board/hooks/useCashFlowPendingExpense';
import { buildStatusBoardRecordGqlFields } from '@/status-board/utils/buildStatusBoardRecordGqlFields';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useStatusBoardMetadata } from '@/status-board/hooks/useStatusBoardMetadata';
import { hasStatusBoardField } from '@/status-board/utils/hasStatusBoardField';
import { formatStatusBoardAmount } from '@/status-board/utils/formatStatusBoardAmount';
import { DashboardInfoTooltip } from '@/ui/layout/dashboard/components/DashboardInfoTooltip';
import { calculateCashFlow } from '@/status-board/utils/calculateCashFlow';
import {
  StyledDashboardSection,
  StyledDashboardSectionHeader,
  StyledDashboardSectionTitle,
  StyledDashboardMuted,
  StyledDashboardKpiGrid,
  StyledDashboardKpiLabel,
  StyledDashboardKpiValue,
  StyledDashboardKpiIcon,
  StyledDashboardKpiButton,
} from '@/ui/layout/dashboard/components/dashboardStyled';
import { styled } from '@linaria/react';
import { Fragment, useId } from 'react';
import { IconMinus, IconPlus, IconRefresh, useIcons } from 'twenty-ui/icon';
import { IconButton } from 'twenty-ui/input';
import { AppTooltip } from 'twenty-ui/surfaces';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { isDefined } from 'twenty-shared/utils';

const StyledFormula = styled(StyledDashboardKpiGrid)`
  align-items: center;
  grid-template-columns: minmax(0, 1fr) repeat(3, 32px minmax(0, 1fr));

  @container (max-width: 720px) {
    grid-template-columns: 32px minmax(0, 1fr);

    > :first-child {
      grid-column: 2;
    }
  }
`;
const StyledOperator = styled.span`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  justify-content: center;
  pointer-events: none;
`;

const StyledMetric = styled(StyledDashboardKpiButton)`
  align-items: flex-start;
  cursor: default;
  display: flex;
  flex-direction: column;
  overflow-wrap: anywhere;
  position: relative;

  &:has(> button:enabled) {
    cursor: pointer;
  }
  &:not(:has(> button:enabled)):hover {
    background: ${themeCssVariables.background.secondary};
  }
  &:has(> button:focus-visible) {
    outline: 2px solid ${themeCssVariables.border.color.blue};
    outline-offset: 2px;
  }
`;
const StyledMetricLabel = styled(StyledDashboardKpiLabel)`
  align-self: flex-start;
  button {
    position: relative;
    z-index: 1;
  }
`;
const StyledSectionTitle = styled(StyledDashboardSectionTitle)`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
`;
const StyledAmountButton = styled.button`
  align-items: flex-start;
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: 0;
  text-align: left;
  &:enabled::after {
    content: '';
    inset: 0;
    position: absolute;
  }
  &:focus-visible {
    outline: none;
  }
  &:disabled {
    cursor: default;
  }
`;
const SNAPSHOT_FIELDS = {
  id: true,
  month: true,
  capturedAt: true,
  sourceHash: true,
  detailsReady: true,
};
const formatAmount = (value: number | null) =>
  value === null ? '—' : `${value.toLocaleString('ko-KR')}원`;
const formatSummaryAmount = (value: number | null) => {
  if (value === null) return '—';
  const summary = formatStatusBoardAmount(Math.abs(value) * 1_000_000);
  return `${value < 0 ? '-' : ''}${summary}${summary.endsWith('원') ? '' : '원'}`;
};
const formatDate = (value: unknown) =>
  typeof value === 'string' && Number.isFinite(Date.parse(value))
    ? new Intl.DateTimeFormat('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(value))
    : '—';

const CashFlowTitle = ({ month }: { month: string }) => (
  <StyledSectionTitle>
    주간 자금 흐름 (월간)
    <DashboardInfoTooltip
      label="주간 자금 흐름 (월간)"
      description={`${month} · 전사 기준. 잔액과 입금예정액은 이번 달 최신 백업에 연결된 CRM 입출금 내역과 입금예정액 DB, 지출대기액은 CRM의 이번 달 현재 데이터를 사용합니다. 실시간 은행·시트 자동 동기화는 아니며 그룹·구성원 필터는 적용되지 않습니다. 새로고침하면 백업과 CRM 지출대기액을 다시 조회합니다. 큰 금액은 반올림한 요약이며, 아래 작은 숫자가 정확한 원화 금액입니다.`}
    />
  </StyledSectionTitle>
);

const CashFlowValues = ({
  month,
  pendingExpense,
  bankTransaction,
  expectedReceipt,
  onOpenSheet,
}: {
  month: string;
  pendingExpense: EnrichedObjectMetadataItem;
  bankTransaction: EnrichedObjectMetadataItem;
  expectedReceipt: EnrichedObjectMetadataItem;
  onOpenSheet: (sheet: StatusBoardSheetState) => void;
}) => {
  const today = getCashFlowToday();
  const expenses = useCashFlowPendingExpense(month, today);
  const { getIcon } = useIcons();
  const refreshId = useId();
  const snapshot = useFindManyRecords({
    objectNameSingular: 'cashFlowSnapshot',
    filter: { month: { eq: month } },
    limit: 1,
    orderBy: [{ capturedAt: 'DescNullsLast' }, { id: 'AscNullsLast' }],
    recordGqlFields: SNAPSHOT_FIELDS,
  });
  const row = snapshot.records.at(0);
  const details = useCashFlowDetails(
    typeof row?.sourceHash === 'string' ? row.sourceHash : 'unavailable',
    today,
  );
  const loading = snapshot.loading || details.loading;
  const detailsReady = row?.detailsReady === true;
  const balance = calculateCashFlow({
    banks: details.banks.map((bank) => (detailsReady ? bank.amount : null)),
    incoming: detailsReady ? details.incomingAmount : null,
    outgoing: expenses.amount,
  });
  const values = [
    {
      label: '잔액',
      amount: balance.balance,
      Icon: getIcon('IconWallet'),
      description: [
        '은행별 최종 거래 잔액',
        ...details.banks.map(
          (bank) =>
            `${bank.name}: ${formatAmount(loading || !detailsReady || isDefined(details.error) ? null : bank.amount)} · ${formatDate(bank.date)}`,
        ),
        `백업 기준: ${formatDate(row?.capturedAt)}`,
        'CRM 입출금 내역에서 은행별 최신 거래 잔액을 읽습니다. 금액을 클릭하면 해당 백업의 입출금 내역을 볼 수 있습니다. 실시간 은행 조회는 아닙니다.',
      ].join('\n'),
    },
    {
      label: '입금예정액',
      amount: balance.incoming,
      Icon: getIcon('IconArrowDownLeft'),
      description: `CRM 입금예정액 DB에서 예정일이 오늘(${today}, 한국 시간) 이후인 미입금액만 합산합니다(오늘 포함). 지난 예정일·예정일 미입력·완료 행은 제외하며, 분할 입금의 누적 잔금은 한 번만 합산합니다. 향후 월 예정액도 포함합니다. 금액을 클릭하면 같은 조건의 상세 내역을 볼 수 있습니다. 백업 기준: ${formatDate(row?.capturedAt)}`,
    },
    {
      label: '지출대기액',
      amount: balance.outgoing,
      Icon: getIcon('IconArrowUpRight'),
      description: `CRM 지출대기액에서 귀속 월이 이번 달이고 예정일이 오늘(${today}, 한국 시간) 이후인 항목만 합산합니다(오늘 포함). 지난 예정일·예정일 미입력·원본 보충 행(제목·소계 등)은 제외합니다. 현금 지출금액(계획) 기준이며 지출금액(결과)은 차감하지 않습니다. 금액을 클릭하면 같은 조건의 근거 목록을 볼 수 있습니다.`,
    },
    {
      label: '이번달 가용액',
      amount: balance.available,
      Icon: getIcon('IconCashBanknote'),
      description:
        '잔액 + 입금예정액 − 지출대기액으로 계산한 예상 가용액입니다. 음수이면 계획된 지출에 비해 자금이 부족하다는 뜻입니다.',
    },
  ] as const;
  return (
    <>
      <StyledDashboardSectionHeader>
        <CashFlowTitle month={month} />
        <span data-cash-flow-refresh={refreshId}>
          <IconButton
            Icon={IconRefresh}
            ariaLabel="자금 흐름 새로고침"
            size="medium"
            variant="secondary"
            disabled={loading || expenses.loading}
            onClick={() => {
              void snapshot.refetch();
              void details.refetch();
              void expenses.refetch();
            }}
          />
          <AppTooltip
            anchorSelect={`[data-cash-flow-refresh="${refreshId}"]`}
            content="자금 흐름 새로고침"
          />
        </span>
      </StyledDashboardSectionHeader>
      <StyledFormula
        role="group"
        aria-label="잔액 더하기 입금예정액 빼기 지출대기액은 이번달 가용액"
        aria-busy={loading || expenses.loading}
      >
        {values.map(({ label, amount, Icon, description }, index) => {
          const OperatorIcon = [
            undefined,
            IconPlus,
            IconMinus,
            getIcon('IconEqual'),
          ][index];
          const isExpense = label === '지출대기액';
          const tone = label === '이번달 가용액' ? 'blue' : undefined;
          const needsSnapshot = !isExpense;
          const needsExpenses = isExpense || label === '이번달 가용액';
          const isUnavailable =
            (needsSnapshot &&
              (loading ||
                !detailsReady ||
                isDefined(snapshot.error) ||
                isDefined(details.error))) ||
            (needsExpenses &&
              (expenses.loading ||
                isDefined(expenses.error) ||
                expenses.hasInvalidAmount));
          const amountContent = (
            <>
              <StyledDashboardKpiValue tone={tone}>
                {isUnavailable ? '—' : formatSummaryAmount(amount)}
              </StyledDashboardKpiValue>
              {!isUnavailable && amount !== null && (
                <StyledDashboardMuted>
                  {formatAmount(amount)}
                </StyledDashboardMuted>
              )}
            </>
          );
          return (
            <Fragment key={label}>
              {OperatorIcon && (
                <StyledOperator aria-hidden="true">
                  <OperatorIcon size={32} stroke={2} />
                </StyledOperator>
              )}
              <StyledMetric as="div">
                <StyledMetricLabel tone={tone}>
                  <StyledDashboardKpiIcon tone={tone}>
                    <Icon size={16} aria-hidden />
                  </StyledDashboardKpiIcon>
                  {label}
                  <DashboardInfoTooltip
                    label={label}
                    description={description}
                  />
                </StyledMetricLabel>
                {label !== '이번달 가용액' ? (
                  <StyledAmountButton
                    type="button"
                    disabled={isUnavailable}
                    aria-label={
                      isExpense
                        ? '이번 달 지출대기액 상세 목록 보기'
                        : label + ' 상세 목록 보기'
                    }
                    onClick={() => {
                      const objectMetadataItem = isExpense
                        ? pendingExpense
                        : label === '잔액'
                          ? bankTransaction
                          : expectedReceipt;
                      onOpenSheet({
                        title: isExpense
                          ? month + ' 지출대기액'
                          : label === '잔액'
                            ? '입출금 내역'
                            : '입금예정액',
                        objectNameSingular: objectMetadataItem.nameSingular,
                        sortDateField: isExpense
                          ? undefined
                          : label === '잔액'
                            ? 'transactionAt'
                            : 'expectedDate',
                        filter: isExpense
                          ? expenses.filter
                          : label === '잔액'
                            ? details.filters.transactions
                            : details.filters.receipts,
                        listTarget: { objectMetadataItem },
                        recordGqlFields: buildStatusBoardRecordGqlFields({
                          objectMetadataItem,
                          fieldNames: isExpense
                            ? [
                                'name',
                                'plannedCashAmount',
                                'expenseMonth',
                                'scheduledDate',
                                'vendorName',
                              ]
                            : label === '잔액'
                              ? [
                                  'name',
                                  'bankName',
                                  'transactionAt',
                                  'incomingAmount',
                                  'outgoingAmount',
                                  'balance',
                                ]
                              : [
                                  'name',
                                  'companyName',
                                  'expectedDate',
                                  'outstandingAmount',
                                  'inclusionStatus',
                                ],
                        }),
                      });
                    }}
                  >
                    {amountContent}
                  </StyledAmountButton>
                ) : (
                  amountContent
                )}
              </StyledMetric>
            </Fragment>
          );
        })}
      </StyledFormula>
      {(expenses.error || expenses.hasInvalidAmount) && (
        <StyledDashboardMuted role="alert">
          {expenses.error
            ? 'CRM 지출대기액을 불러오지 못했습니다. 다시 시도해 주세요.'
            : '지출대기액의 금액·원화 통화를 확인해 주세요. 가용액을 계산할 수 없습니다.'}
        </StyledDashboardMuted>
      )}
      {snapshot.error || details.error ? (
        <StyledDashboardMuted role="alert">
          자금 흐름을 불러오지 못했습니다. 다시 시도해 주세요.
        </StyledDashboardMuted>
      ) : !loading && !row ? (
        <StyledDashboardMuted role="status">
          이번 달 잔액·입금예정액 백업을 등록해 주세요.
        </StyledDashboardMuted>
      ) : null}
    </>
  );
};

export const StatusBoardCashFlowSection = ({
  onOpenSheet,
}: {
  onOpenSheet: (sheet: StatusBoardSheetState) => void;
}) => {
  const { cashFlowSnapshot, pendingExpense, bankTransaction, expectedReceipt } =
    useStatusBoardMetadata();
  const month = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
  }).format(new Date());
  const available =
    bankTransaction &&
    expectedReceipt &&
    [
      'sourceHash',
      'bankKey',
      'bankName',
      'transactionAt',
      'sourceRow',
      'balance',
      'incomingAmount',
      'outgoingAmount',
    ].every((field) => hasStatusBoardField(bankTransaction, field)) &&
    [
      'sourceHash',
      'outstandingAmount',
      'inclusionStatus',
      'companyName',
      'expectedDate',
    ].every((field) => hasStatusBoardField(expectedReceipt, field)) &&
    pendingExpense &&
    [
      'expenseMonth',
      'scheduledDate',
      'plannedCashAmount',
      'sourceRecordType',
    ].every((field) => hasStatusBoardField(pendingExpense, field)) &&
    cashFlowSnapshot &&
    Object.keys(SNAPSHOT_FIELDS).every((field) =>
      hasStatusBoardField(cashFlowSnapshot, field),
    );
  return (
    <StyledDashboardSection aria-label="주간 자금 흐름 (월간)">
      {available ? (
        <CashFlowValues
          month={month}
          pendingExpense={pendingExpense}
          bankTransaction={bankTransaction}
          expectedReceipt={expectedReceipt}
          onOpenSheet={onOpenSheet}
        />
      ) : (
        <>
          <CashFlowTitle month={month} />
          <StyledDashboardMuted role="status">
            자금 흐름 상세 백업이 필요합니다. 입출금
            내역·입금예정액·지출대기액의 조회 권한을 확인해 주세요.
          </StyledDashboardMuted>
        </>
      )}
    </StyledDashboardSection>
  );
};
