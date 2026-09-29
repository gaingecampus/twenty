import { Link } from 'react-router-dom';
import { IconArrowUpRight } from 'twenty-ui/icon';
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
}: {
  contract: ObjectRecord;
  onSaved: () => Promise<void>;
  onCancel: () => void;
}) => {
  const { updateOneRecord } = useUpdateOneRecord();
  const [goal, setGoal] = useState(text(contract.consultingGoal));
  const [criteria, setCriteria] = useState(text(contract.successCriteria));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const unsaved = useFieldUnsavedChanges(
    goal !== text(contract.consultingGoal) ||
      criteria !== text(contract.successCriteria),
    busy,
    onCancel,
  );
  const save = async () => {
    setBusy(true);
    setError('');
    try {
      await updateOneRecord({
        objectNameSingular: 'onboarding',
        idToUpdate: contract.id,
        updateOneRecordInput: {
          consultingGoal: goal,
          successCriteria: criteria,
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
    <StyledFieldVisitEditor data-goal-editor>
      {unsaved.dialog}
      <header>
        <h2>계약 목표 수정</h2>
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
      <label>
        이번 계약의 목표
        <textarea
          value={goal}
          disabled={busy}
          onChange={(e) => setGoal(e.target.value)}
        />
      </label>
      <label>
        성공 기준
        <textarea
          value={criteria}
          disabled={busy}
          onChange={(e) => setCriteria(e.target.value)}
        />
      </label>
      {error && <p role="alert">{error}</p>}
      <StyledFieldRow data-editor-actions>
        <button data-cancel disabled={busy} onClick={unsaved.cancel}>
          취소
        </button>
        <span data-action-spacer aria-hidden="true" />
        <button data-primary disabled={busy} onClick={() => void save()}>
          {busy ? '저장 중…' : '목표 저장'}
        </button>
      </StyledFieldRow>
    </StyledFieldVisitEditor>
  );
};
