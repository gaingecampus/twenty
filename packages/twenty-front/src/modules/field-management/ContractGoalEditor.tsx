import { Button } from 'twenty-ui/input';
import { Link } from 'react-router-dom';
import { IconArrowUpRight, IconPlus, IconTrash } from 'twenty-ui/icon';
import { StyledFieldVisitEditor } from './fieldVisitEditorStyled';
import { FieldContractLabel } from './FieldContractLabel';
import { useFieldUnsavedChanges } from './useFieldUnsavedChanges';
import { useState } from 'react';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { text } from './fieldManagementUtils';
import { StyledFieldRow } from './fieldManagementStyled';
export const ContractGoalEditor = ({
  contract,
  onSaved,
  onCancel,
  compact = false,
  addKeyResult = false,
}: {
  compact?: boolean;
  addKeyResult?: boolean;
  contract: ObjectRecord;
  onSaved: () => Promise<void>;
  onCancel: () => void;
}) => {
  const { updateOneRecord } = useUpdateOneRecord();
  const initialSessionCount =
    contract.plannedSessionCount == null
      ? ''
      : String(contract.plannedSessionCount);
  const [sessionCount, setSessionCount] = useState(initialSessionCount);
  const [goal, setGoal] = useState(text(contract.consultingGoal));
  const [criteria, setCriteria] = useState(() => {
    const existingCriteria = text(contract.successCriteria)
      .split(/\r?\n/)
      .filter((value) => value.trim())
      .map((value, id) => ({ id, value }));
    return addKeyResult
      ? [...existingCriteria, { id: existingCriteria.length, value: '' }]
      : existingCriteria;
  });
  const [nextCriteriaId, setNextCriteriaId] = useState(criteria.length);
  const appendCriterion = () => {
    setCriteria((current) => [...current, { id: nextCriteriaId, value: '' }]);
    setNextCriteriaId((current) => current + 1);
  };
  const serializedCriteria = criteria
    .map(({ value }) => value.trim())
    .filter(Boolean)
    .join('\n');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const unsaved = useFieldUnsavedChanges(
    sessionCount !== initialSessionCount ||
      goal !== text(contract.consultingGoal) ||
      serializedCriteria !==
        text(contract.successCriteria)
          .split(/\r?\n/)
          .map((value) => value.trim())
          .filter(Boolean)
          .join('\n'),
    busy,
    onCancel,
  );
  const save = async () => {
    const plannedSessionCount =
      sessionCount.trim() === '' ? null : Number(sessionCount);
    if (
      plannedSessionCount !== null &&
      (!Number.isSafeInteger(plannedSessionCount) || plannedSessionCount < 1)
    ) {
      setError('총 예정 회차는 1 이상의 정수로 입력해 주세요.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await updateOneRecord({
        objectNameSingular: 'onboarding',
        idToUpdate: contract.id,
        updateOneRecordInput: {
          consultingGoal: goal,
          plannedSessionCount,
          successCriteria: serializedCriteria,
        },
      });
      await onSaved();
    } catch {
      setError('목표를 저장하지 못했습니다. 권한과 연결을 확인하십시오.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <StyledFieldVisitEditor
      data-goal-editor
      data-inline-goal-editor={compact || undefined}
    >
      {unsaved.dialog}
      {!compact && (
        <>
          <header>
            <h2>O / KR 수정</h2>
          </header>
          <Link
            data-editor-contract
            to={`/object/onboarding/${contract.id}`}
            aria-label={`${text(contract.name)} 계약 보기`}
            aria-disabled={busy || undefined}
            onClick={(event) => {
              if (busy) event.preventDefault();
            }}
          >
            <FieldContractLabel name={text(contract.name)} />
            <IconArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </>
      )}
      <label data-session-count-row>
        <span>회차</span>
        <input
          aria-label="총 예정 회차"
          type="number"
          min={1}
          step={1}
          placeholder="미정"
          value={sessionCount}
          disabled={busy}
          onChange={(event) => setSessionCount(event.target.value)}
        />
      </label>
      <label data-goal-input-row>
        <span>O</span>
        <textarea
          aria-label="O"
          placeholder="O를 입력하세요"
          rows={2}
          value={goal}
          disabled={busy}
          onChange={(e) => setGoal(e.target.value)}
        />
      </label>
      <div data-kr-list>
        <div data-kr-label>
          <span>KR</span>
        </div>
        <div data-kr-inputs data-empty={criteria.length === 0 || undefined}>
          {criteria.map((criterion, index) => (
            <StyledFieldRow key={criterion.id}>
              <input
                autoFocus={addKeyResult && index === criteria.length - 1}
                aria-label={`KR ${index + 1}`}
                placeholder={`KR ${index + 1}을 입력하세요`}
                value={criterion.value}
                disabled={busy}
                onChange={(event) =>
                  setCriteria((current) =>
                    current.map((item) =>
                      item.id === criterion.id
                        ? { ...item, value: event.target.value }
                        : item,
                    ),
                  )
                }
              />
              <button
                type="button"
                data-kr-delete
                aria-label={`KR ${index + 1} 삭제`}
                disabled={busy}
                onClick={() =>
                  setCriteria((current) =>
                    current.filter((item) => item.id !== criterion.id),
                  )
                }
              >
                <IconTrash size={16} aria-hidden />
              </button>
            </StyledFieldRow>
          ))}
          <button
            type="button"
            data-kr-add
            aria-label="KR 추가"
            title="KR 추가"
            disabled={busy}
            onClick={appendCriterion}
          >
            <IconPlus size={16} aria-hidden />
          </button>
        </div>
      </div>
      {error && <p role="alert">{error}</p>}
      <StyledFieldRow data-editor-actions data-goal-actions>
        <Button
          title="취소"
          variant="secondary"
          accent="danger"
          size="medium"
          disabled={busy}
          onClick={unsaved.cancel}
        />
        <span data-action-spacer aria-hidden="true" />
        <Button
          title={busy ? '저장 중…' : '목표 저장'}
          variant="primary"
          accent="blue"
          size="medium"
          disabled={busy}
          onClick={() => void save()}
        />
      </StyledFieldRow>
    </StyledFieldVisitEditor>
  );
};
