import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { SelectDisplay } from '@/ui/field/display/components/SelectDisplay';
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

const StatusBoardStageLabel = ({
  objectNameSingular,
  value,
}: {
  objectNameSingular: string;
  value: string;
}) => {
  const { objectMetadataItem } = useObjectMetadataItem({ objectNameSingular });
  const selectedOption = objectMetadataItem.fields
    .find((field) => field.name === 'customStage')
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
  objectNameSingular,
}: {
  record: ObjectRecord;
  objectNameSingular: string;
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
      <StatusBoardStageLabel
        objectNameSingular={objectNameSingular}
        value={record.customStage}
      />
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
