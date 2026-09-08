import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import {
  StyledStatusBoardContractMeta,
  StyledStatusBoardProgress,
  StyledStatusBoardRowAside,
  StyledStatusBoardRowCaption,
  StyledStatusBoardTag,
} from '@/status-board/components/statusBoardStyled';
import {
  formatStatusBoardAmount,
  getStatusBoardAmountMicros,
} from '@/status-board/utils/formatStatusBoardAmount';
import { getStatusBoardContractProgress } from '@/status-board/utils/getStatusBoardContractProgress';
import { differenceInCalendarDays, parseISO } from 'date-fns';

const STAGES: Record<string, string> = {
  INQUIRY: '문의',
  TECHNICAL_CONSULT: '기술상담',
  PROPOSAL: '제안',
  FOLLOW_UP: '팔로업',
  ON_HOLD: '보류',
  MATCHING_HOLD_COMPLETED: '종료',
  MATCHING_SUCCESS: '매칭 성공',
};
const CADENCES: Record<string, string> = {
  WEEKLY: '매주',
  BIWEEKLY: '격주',
  MONTHLY: '월 1회',
  BIMONTHLY: '격월',
  PROJECT: '프로젝트',
  LECTURE: '강의',
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

export const StatusBoardRecordDetails = ({
  record,
}: {
  record: ObjectRecord;
}) => {
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
        <StyledStatusBoardRowCaption>
          {record.depositStatus === 'PAID'
            ? '입금 완료'
            : overdueDays > 0
              ? `${overdueDays}일 경과`
              : '입금 예정'}
        </StyledStatusBoardRowCaption>
      </StyledStatusBoardRowAside>
    );
  }
  if (typeof record.customStage === 'string') {
    return (
      <StyledStatusBoardTag>
        {STAGES[record.customStage] ?? record.customStage}
      </StyledStatusBoardTag>
    );
  }
  const progress = getStatusBoardContractProgress(
    record.contractStartDate,
    record.contractEndDate,
  );
  if (progress === undefined) return null;
  return (
    <StyledStatusBoardRowAside>
      <StyledStatusBoardTag
        tone={
          record.onboardingStatus === 'ACTIVE' && progress.remaining <= 30
            ? 'orange'
            : 'default'
        }
      >
        {record.onboardingStatus === 'DONE'
          ? '완료'
          : progress.remaining < 0
            ? `${-progress.remaining}일 초과`
            : `D-${progress.remaining}`}
      </StyledStatusBoardTag>
    </StyledStatusBoardRowAside>
  );
};

export const StatusBoardContractDetails = ({
  record,
}: {
  record: ObjectRecord;
}) => {
  const progress = getStatusBoardContractProgress(
    record.contractStartDate,
    record.contractEndDate,
  );
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
            {formatStatusBoardAmount(amount)}
          </StyledStatusBoardTag>
        )}
        {typeof record.contractStartDate === 'string' && (
          <StyledStatusBoardTag>
            {record.contractStartDate.slice(0, 10)} ~{' '}
            {typeof record.contractEndDate === 'string'
              ? record.contractEndDate.slice(0, 10)
              : '종료일 미정'}
          </StyledStatusBoardTag>
        )}
      </StyledStatusBoardContractMeta>
      {progress !== undefined && (
        <StyledStatusBoardProgress
          aria-label="계약 기간 진행률"
          value={progress.percent}
          max={100}
        />
      )}
    </>
  );
};
