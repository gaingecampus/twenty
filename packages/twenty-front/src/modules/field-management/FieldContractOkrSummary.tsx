import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { text } from './fieldManagementUtils';

export const FieldContractOkrSummary = ({
  contract,
}: {
  contract: ObjectRecord;
}) => (
  <span data-okr-group>
    <span data-goal-summary-row>
      <strong>O</strong>
      <span
        data-unregistered={!text(contract.consultingGoal).trim() || undefined}
      >
        {text(contract.consultingGoal).trim() || 'O를 입력하세요'}
      </span>
    </span>
    <span data-goal-summary-row>
      <strong>KR</strong>
      <span
        data-unregistered={!text(contract.successCriteria).trim() || undefined}
      >
        {text(contract.successCriteria).trim()
          ? text(contract.successCriteria)
              .split(/\r?\n/)
              .filter((line) => line.trim())
              .map((line, index) => (
                <span data-kr-summary-item key={index}>
                  <span data-kr-number>{index + 1}</span>
                  <span>{line}</span>
                </span>
              ))
          : '등록된 KR이 없습니다.'}
      </span>
    </span>
  </span>
);
