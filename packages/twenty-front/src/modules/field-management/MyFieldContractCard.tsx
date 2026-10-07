import { FieldContractSummary } from './FieldContractSummary';
import { FieldContractLabel } from './FieldContractLabel';
import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { text } from './fieldManagementUtils';
import {
  StyledMyFieldCard,
  StyledMyFieldCardHeader,
  StyledMyFieldGoal,
  StyledMyFieldRecords,
  StyledMyFieldSchedule,
} from './myFieldsStyled';

type MyFieldContractCardProps = {
  contract: ObjectRecord;
  records: ObjectRecord[];
  canWriteGoals: boolean;
  canWriteVisits: boolean;
  onEditGoal: () => void;
  onWrite: (visit?: ObjectRecord) => void;
  children: ReactNode;
};
const dateLabel = (value: unknown) =>
  text(value).slice(0, 10).replace(/-/g, '.');
export const MyFieldContractCard = ({
  contract,
  records,
  canWriteGoals,
  canWriteVisits,
  onEditGoal,
  onWrite,
  children,
}: MyFieldContractCardProps) => {
  const drafts = records.filter((v) => v.recordStatus === 'DRAFT');
  const submitted = records.filter((v) => v.recordStatus === 'SUBMITTED');
  const goal = text(contract.consultingGoal).trim();
  const stateLabel =
    contract.onboardingStatus === 'ACTIVE'
      ? '진행 중'
      : contract.onboardingStatus === 'PRE'
        ? '시작 전'
        : '종료';
  return (
    <StyledMyFieldCard aria-label={text(contract.name)}>
      <StyledMyFieldCardHeader>
        <div>
          <h3>
            <Link to={`/object/onboarding/${contract.id}`}>
              <FieldContractLabel name={text(contract.name)} />
            </Link>
            <span data-contract-state>{stateLabel}</span>
          </h3>
        </div>
        <div data-card-actions>
          {canWriteGoals && (
            <button data-quiet onClick={onEditGoal}>
              {goal ? '목표 편집' : '목표 등록'}
            </button>
          )}
          {canWriteVisits && (
            <>
              {drafts.length > 0 && (
                <button data-quiet onClick={() => onWrite()}>
                  새 기록
                </button>
              )}
              <button data-primary onClick={() => onWrite(drafts[0])}>
                {drafts.length ? '이어서 작성' : '기록 작성'}
              </button>
            </>
          )}
        </div>
      </StyledMyFieldCardHeader>
      <StyledMyFieldSchedule>
        <div>
          <span>계약 기간</span>
          <p>
            {dateLabel(contract.contractStartDate) || '시작일 미정'} -{' '}
            {dateLabel(contract.contractEndDate) || '종료일 미정'}
          </p>
        </div>
        <div>
          <span>최근 현장</span>
          <p>
            {submitted.length ? (
              <>
                <strong>
                  {submitted[0].sessionNumber
                    ? `${String(submitted[0].sessionNumber)}회차`
                    : '회차 미입력'}
                </strong>
                {dateLabel(submitted[0].visitDate)}
              </>
            ) : (
              <span data-empty>제출 기록 없음</span>
            )}
          </p>
        </div>
      </StyledMyFieldSchedule>
      <StyledMyFieldGoal>
        <div data-goal-primary>
          <span>O</span>
          <p data-missing={!goal || undefined}>{goal || '목표 미등록'}</p>
        </div>
        {text(contract.successCriteria).trim() && (
          <div data-criteria>
            <span>KR</span>
            <p>{text(contract.successCriteria)}</p>
          </div>
        )}
      </StyledMyFieldGoal>
      <FieldContractSummary contract={contract} visits={records} />
      <StyledMyFieldRecords id={`field-records-${contract.id}`}>
        {records.length ? children : <p>첫 현장 기록을 작성하십시오.</p>}
      </StyledMyFieldRecords>
    </StyledMyFieldCard>
  );
};
