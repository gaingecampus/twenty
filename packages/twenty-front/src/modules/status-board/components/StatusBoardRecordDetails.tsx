import { themeCssVariables } from 'twenty-ui/theme-constants';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { SelectDisplay } from '@/ui/field/display/components/SelectDisplay';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import {
  StyledStatusBoardContractMeta,
  StyledStatusBoardProgress,
  StyledStatusBoardRowAside,
  StyledStatusBoardContractLabels,
  StyledStatusBoardRowCaption,
  StyledStatusBoardTag,
} from '@/status-board/components/statusBoardStyled';
import {
  formatStatusBoardAmount,
  getStatusBoardAmountMicros,
} from '@/status-board/utils/formatStatusBoardAmount';
import { getStatusBoardContractProgress } from '@/status-board/utils/getStatusBoardContractProgress';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { getStatusBoardStageTimings } from '@/status-board/utils/getStatusBoardStageTimings';
import { readCashFlowCurrency } from '@/status-board/utils/calculateCashFlow';

const StatusBoardStageLabel = ({
  objectNameSingular,
  value,
  fieldName = 'customStage',
}: {
  objectNameSingular: string;
  value: string;
  fieldName?: string;
}) => {
  const { objectMetadataItem } = useObjectMetadataItem({ objectNameSingular });
  const selectedOption = objectMetadataItem.fields
    .find((field) => field.name === fieldName)
    ?.options?.find((option) => option.value === value);

  if (!selectedOption) return null;

  return (
    <SelectDisplay color={selectedOption.color} label={selectedOption.label} />
  );
};

const CADENCES: Record<string, string> = {
  WEEKLY: '매주',
  BIWEEKLY: '격주',
  MONTHLY: '월 1회',
  BIMONTHLY: '격월',
  PROJECT: '프로젝트형',
  LECTURE: '특강',
  ADVISORY: '자문',
};
const DAYS: Record<string, string> = {
  MON: '월',
  TUE: '화',
  WED: '수',
  THU: '목',
  FRI: '금',
  SAT: '토',
  SUN: '일',
};

export const StatusBoardContractDday = ({
  record,
}: {
  record: ObjectRecord;
}) => {
  const isUpcoming = record.onboardingStatus === 'PRE';
  const targetDate = isUpcoming
    ? record.contractStartDate
    : record.contractEndDate;
  const remaining =
    typeof targetDate === 'string'
      ? differenceInCalendarDays(parseISO(targetDate.slice(0, 10)), new Date())
      : undefined;
  if (record.onboardingStatus === 'DONE') return null;
  if (remaining === undefined || !Number.isFinite(remaining)) {
    return (
      <SelectDisplay
        color="gray"
        label={isUpcoming ? '시작일 미정' : '계약 종료일 미정'}
      />
    );
  }
  return (
    <StyledStatusBoardRowCaption>
      <SelectDisplay
        color={remaining < 0 ? 'red' : remaining <= 30 ? 'orange' : 'gray'}
        label={
          isUpcoming
            ? remaining < 0
              ? `시작 예정일 ${-remaining}일 경과`
              : remaining === 0
                ? '시작 D-day'
                : `시작까지 D-${remaining}`
            : remaining < 0
              ? `계약 종료일 ${-remaining}일 경과`
              : remaining === 0
                ? '계약 종료 D-day'
                : `계약 종료까지 D-${remaining}`
        }
      />
    </StyledStatusBoardRowCaption>
  );
};

export const StatusBoardContractProgress = ({
  record,
}: {
  record: ObjectRecord;
}) => {
  const progress = getStatusBoardContractProgress(
    record.contractStartDate,
    record.contractEndDate,
  );
  return progress === undefined ? null : (
    <StyledStatusBoardProgress
      aria-label="계약 기간 진행률"
      value={progress.percent}
      max={100}
    />
  );
};

export const StatusBoardRecordDetails = ({
  record,
  objectNameSingular,
}: {
  record: ObjectRecord;
  objectNameSingular: string;
}) => {
  const { objectMetadataItem } = useObjectMetadataItem({ objectNameSingular });
  if (
    objectNameSingular === 'bankTransaction' ||
    objectNameSingular === 'expectedReceipt'
  ) {
    const formatMoney = (value: unknown) => {
      const amount = readCashFlowCurrency(value);
      return amount === null ? '—' : `${amount.toLocaleString('ko-KR')}원`;
    };
    const isBank = objectNameSingular === 'bankTransaction';
    return (
      <StyledStatusBoardRowAside>
        {isBank
          ? `잔액 ${formatMoney(record.balance)}`
          : formatMoney(record.outstandingAmount)}
        <StyledStatusBoardRowCaption>
          {isBank ? (
            <>
              <span style={{ color: themeCssVariables.color.green }}>
                입금 {formatMoney(record.incomingAmount)}
              </span>
              {' · '}
              <span style={{ color: themeCssVariables.color.red }}>
                출금 {formatMoney(record.outgoingAmount)}
              </span>
            </>
          ) : (
            record.inclusionStatus
          )}
        </StyledStatusBoardRowCaption>
      </StyledStatusBoardRowAside>
    );
  }
  if (objectNameSingular === 'pendingExpense') {
    const amount = readCashFlowCurrency(record.plannedCashAmount);
    return (
      <StyledStatusBoardRowAside>
        {amount === null
          ? '금액 미입력'
          : `${amount.toLocaleString('ko-KR')}원`}
        <StyledStatusBoardRowCaption>
          {[
            record.vendorName,
            typeof record.scheduledDate === 'string'
              ? `예정 ${record.scheduledDate.slice(0, 10)}`
              : null,
          ]
            .filter((value) => typeof value === 'string' && value.length > 0)
            .join(' · ')}
        </StyledStatusBoardRowCaption>
      </StyledStatusBoardRowAside>
    );
  }
  if (
    record.expectedPaymentDate !== undefined ||
    record.depositStatus !== undefined
  ) {
    const overdueDays =
      typeof record.expectedPaymentDate === 'string'
        ? differenceInCalendarDays(
            new Date(),
            parseISO(record.expectedPaymentDate.slice(0, 10)),
          )
        : 0;
    return (
      <StyledStatusBoardRowAside>
        {formatStatusBoardAmount(getStatusBoardAmountMicros(record.amount))}
        <StyledStatusBoardRowCaption
          style={
            record.depositStatus !== 'PAID' && overdueDays > 0
              ? { color: themeCssVariables.color.red }
              : undefined
          }
        >
          {record.depositStatus === 'PAID'
            ? '입금 완료'
            : overdueDays > 0
              ? `${overdueDays}일 경과`
              : '입금 예정'}
        </StyledStatusBoardRowCaption>
      </StyledStatusBoardRowAside>
    );
  }
  if (typeof record.onboardingStatus === 'string') {
    return (
      <StyledStatusBoardContractLabels>
        <StatusBoardStageLabel
          objectNameSingular={objectNameSingular}
          fieldName="onboardingStatus"
          value={record.onboardingStatus}
        />
        <StatusBoardContractDday record={record} />
      </StyledStatusBoardContractLabels>
    );
  }
  if (typeof record.customStage !== 'string') return null;
  return (
    <StyledStatusBoardRowAside>
      <StatusBoardStageLabel
        objectNameSingular={objectNameSingular}
        value={record.customStage}
      />
      {getStatusBoardStageTimings(objectMetadataItem).map((stage) => {
        const days = record[stage.daysField];
        return typeof days === 'number' &&
          Number.isFinite(days) &&
          days >= 0 ? (
          <StyledStatusBoardRowCaption key={stage.value}>
            {stage.label} 도달 {days}일
          </StyledStatusBoardRowCaption>
        ) : null;
      })}
    </StyledStatusBoardRowAside>
  );
};

export const StatusBoardContractDetails = ({
  record,
}: {
  record: ObjectRecord;
}) => {
  const cadence =
    typeof record.visitCadence === 'string'
      ? (CADENCES[record.visitCadence] ?? record.visitCadence)
      : undefined;
  const days = Array.isArray(record.visitDays)
    ? record.visitDays.map((day: string) => DAYS[day] ?? day).join('·')
    : '';
  const amount = getStatusBoardAmountMicros(record.totalFee);
  return (
    <>
      <StyledStatusBoardContractMeta>
        {cadence && (
          <StyledStatusBoardTag
            tone={record.visitCadence === 'BIWEEKLY' ? 'orange' : 'default'}
          >
            {cadence} {days}
          </StyledStatusBoardTag>
        )}
        {amount !== null && (
          <StyledStatusBoardTag>
            계약 금액 {formatStatusBoardAmount(amount)}원
          </StyledStatusBoardTag>
        )}
        {typeof record.contractStartDate === 'string' && (
          <StyledStatusBoardTag>
            {record.contractStartDate.slice(0, 10).replaceAll('-', '.')} –{' '}
            {typeof record.contractEndDate === 'string'
              ? record.contractEndDate.slice(0, 10).replaceAll('-', '.')
              : '종료일 미정'}
          </StyledStatusBoardTag>
        )}
      </StyledStatusBoardContractMeta>
      <StatusBoardContractProgress record={record} />
    </>
  );
};
