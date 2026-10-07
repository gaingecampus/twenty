import { refreshFieldSummary } from './fieldSummaryRequest';
import { FieldVisitHeading } from './FieldVisitHeading';
import { FieldContractOkrSummary } from './FieldContractOkrSummary';
import { FieldVisitUploadArea } from './FieldVisitUploadArea';
import { useFieldVisitUploadQueue } from './useFieldVisitUploadQueue';
import { FieldVisitEditorModal } from './FieldVisitEditorModal';
import { useNavigate } from 'react-router-dom';
import { useFieldUnsavedChanges } from './useFieldUnsavedChanges';
import { useRef, useState } from 'react';
import { v4 } from 'uuid';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { text } from './fieldManagementUtils';
import {
  StyledFieldPanel,
  StyledFieldRecordSection,
  StyledFieldRow,
} from './fieldManagementStyled';
import { StyledFieldVisitEditor } from './fieldVisitEditorStyled';
import { FieldContractLabel } from './FieldContractLabel';
export const FieldVisitEditor = ({
  contract,
  visit,
  onSaved,
  onCancel,
  onOpenContract,
  modal = false,
}: {
  modal?: boolean;
  contract: ObjectRecord;
  visit?: ObjectRecord;
  onSaved: () => Promise<void>;
  onCancel: () => void;
  onOpenContract?: () => void;
}) => {
  const navigate = useNavigate();
  const { createOneRecord } = useCreateOneRecord({
    objectNameSingular: 'fieldVisit',
  });
  const { updateOneRecord } = useUpdateOneRecord();
  const [id] = useState(() => visit?.id ?? v4());
  const [persisted, setPersisted] = useState(!!visit);
  const uploads = useFieldVisitUploadQueue(id, !!visit);
  // Synchronous mutex prevents two writes before React commits the busy state.
  // oxlint-disable-next-line twenty/no-state-useref
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: text(visit?.name),
    visitDate:
      text(visit?.visitDate).slice(0, 10) ||
      new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(
        new Date(),
      ),
    sessionNumber: visit?.sessionNumber ? String(visit.sessionNumber) : '',
    activities: text(visit?.activities),
    decisions: text(visit?.decisions),
    nextActions: text(visit?.nextActions),
  });
  const [initial] = useState(() => JSON.stringify(form));
  const rootRef = useRef<HTMLElement>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const unsaved = useFieldUnsavedChanges(
    JSON.stringify(form) !== initial || uploads.dirty,
    busy,
    onCancel,
  );
  const updateField = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: '' }));
  };
  const save = async (status: 'DRAFT' | 'SUBMITTED') => {
    if (pending.current) return;
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = '제목을 입력하십시오.';
    if (status === 'SUBMITTED' && !form.visitDate)
      errors.visitDate = '현장 날짜를 선택하십시오.';
    if (status === 'SUBMITTED' && !form.activities.trim())
      errors.activities = '수행 내용을 입력하십시오.';
    const session = form.sessionNumber ? Number(form.sessionNumber) : null;
    if (session !== null && (!Number.isInteger(session) || session < 1))
      errors.sessionNumber = '회차는 1 이상의 정수로 입력하십시오.';
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      rootRef.current
        ?.querySelector<HTMLElement>(`[name="${Object.keys(errors)[0]}"]`)
        ?.focus();
      return;
    }
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      const input = {
        ...form,
        visitDate: form.visitDate || null,
        sessionNumber: session,
        recordStatus: status,
      };
      if (persisted)
        await updateOneRecord({
          objectNameSingular: 'fieldVisit',
          idToUpdate: id,
          updateOneRecordInput: input,
        });
      else
        await createOneRecord({
          ...input,
          id: id,
          contractId: contract.id,
        });
      setPersisted(true);
      refreshFieldSummary(contract.id);
      try {
        await uploads.persist();
      } catch {
        setError(
          '기록은 저장했지만 일부 첨부파일 처리가 실패했습니다. 저장 버튼을 다시 누르면 실패한 항목을 재시도합니다.',
        );
        return;
      }
      await onSaved();
    } catch {
      setError(
        '저장하지 못했습니다. 입력 내용은 유지됩니다. 새로고침으로 저장 여부를 확인한 후 다시 시도하십시오.',
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  const content = (
    <StyledFieldVisitEditor ref={rootRef} aria-label="현장 기록 작성">
      {unsaved.dialog}
      {visit ? (
        <FieldVisitHeading
          visit={{
            ...visit,
            name: form.name || '제목 미입력',
            sessionNumber: form.sessionNumber,
            visitDate: form.visitDate,
          }}
        />
      ) : (
        <header>
          <h2>새 현장 기록</h2>
        </header>
      )}
      <StyledFieldPanel data-contextual data-inline-detail>
        <StyledFieldRecordSection data-contract-group>
          <div
            data-contract-item
            role="button"
            tabIndex={0}
            aria-label={`${text(contract.name)} 계약 목표 보기`}
            onClick={() =>
              unsaved.requestLeave(
                onOpenContract ??
                  (() =>
                    navigate(
                      `/object/onboarding/${contract.id}#gainge-field-records`,
                    )),
              )
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                unsaved.requestLeave(
                  onOpenContract ??
                    (() =>
                      navigate(
                        `/object/onboarding/${contract.id}#gainge-field-records`,
                      )),
                );
              }
            }}
          >
            <FieldContractLabel name={text(contract.name)} />
            <FieldContractOkrSummary contract={contract} />
          </div>
        </StyledFieldRecordSection>
      </StyledFieldPanel>
      <section data-editor-section>
        <label>
          <span>
            제목{' '}
            <small data-required aria-label="필수">
              *
            </small>
          </span>
          <input
            aria-label="제목"
            aria-required="true"
            name="name"
            aria-invalid={!!fieldErrors.name}
            aria-describedby={fieldErrors.name ? 'field-error-name' : undefined}
            disabled={busy}
            value={form.name}
            placeholder="예: 3회차 · 영업 현황 점검"
            onChange={(e) => updateField('name', e.target.value)}
          />
          {fieldErrors.name && (
            <span data-field-error id="field-error-name" role="alert">
              {fieldErrors.name}
            </span>
          )}
        </label>
        <div data-editor-grid>
          <label>
            <span>
              현장 날짜{' '}
              <small data-required aria-label="제출 시 필수">
                *
              </small>
            </span>
            <input
              aria-label="현장 날짜"
              aria-required="true"
              name="visitDate"
              aria-invalid={!!fieldErrors.visitDate}
              aria-describedby={
                fieldErrors.visitDate ? 'field-error-visitDate' : undefined
              }
              type="date"
              disabled={busy}
              value={form.visitDate}
              onChange={(e) => updateField('visitDate', e.target.value)}
            />
            {fieldErrors.visitDate && (
              <span data-field-error id="field-error-visitDate" role="alert">
                {fieldErrors.visitDate}
              </span>
            )}
          </label>
          <label>
            <span>회차</span>
            <input
              aria-label="회차"
              name="sessionNumber"
              aria-invalid={!!fieldErrors.sessionNumber}
              aria-describedby={
                fieldErrors.sessionNumber
                  ? 'field-error-sessionNumber'
                  : undefined
              }
              type="number"
              min={1}
              step={1}
              placeholder="예: 3"
              disabled={busy}
              value={form.sessionNumber}
              onChange={(e) => updateField('sessionNumber', e.target.value)}
            />
            {fieldErrors.sessionNumber && (
              <span
                data-field-error
                id="field-error-sessionNumber"
                role="alert"
              >
                {fieldErrors.sessionNumber}
              </span>
            )}
          </label>
        </div>
      </section>
      <section data-editor-section>
        {(
          [
            [
              'activities',
              '수행 내용',
              '어떤 활동을 진행했으며, 무엇을 확인했습니까?',
              '제출 시 필수',
            ],
            [
              'decisions',
              '주요 결정',
              '고객과 논의하고 합의한 내용을 작성하십시오.',
              '선택',
            ],
            [
              'nextActions',
              '다음 할 일',
              '다음 방문까지 할 일과 담당자, 기한을 작성하십시오.',
              '선택',
            ],
          ] as const
        ).map(([key, label, placeholder, hint]) => (
          <label key={key}>
            <span>
              {label}{' '}
              {hint !== '선택' && (
                <small data-required aria-label="제출 시 필수">
                  *
                </small>
              )}
            </span>
            <textarea
              aria-label={label}
              aria-required={key === 'activities'}
              name={key}
              aria-invalid={!!fieldErrors[key]}
              aria-describedby={
                fieldErrors[key] ? `field-error-${key}` : undefined
              }
              rows={key === 'activities' ? 4 : 3}
              placeholder={placeholder}
              disabled={busy}
              value={form[key]}
              onChange={(e) => updateField(key, e.target.value)}
            />
            {fieldErrors[key] && (
              <span data-field-error id={`field-error-${key}`} role="alert">
                {fieldErrors[key]}
              </span>
            )}
          </label>
        ))}
      </section>
      <FieldVisitUploadArea queue={uploads} disabled={busy} />
      {error && <p role="alert">{error}</p>}
      <StyledFieldRow data-editor-actions>
        <button data-cancel disabled={busy} onClick={unsaved.cancel}>
          취소
        </button>
        <span data-action-spacer aria-hidden="true" />
        {visit?.recordStatus !== 'SUBMITTED' && (
          <button disabled={busy} onClick={() => void save('DRAFT')}>
            초안 저장
          </button>
        )}
        <button
          data-primary
          disabled={busy}
          onClick={() => void save('SUBMITTED')}
        >
          {busy
            ? '저장 중…'
            : visit?.recordStatus === 'SUBMITTED'
              ? '수정 저장'
              : '기록 제출'}
        </button>
      </StyledFieldRow>
    </StyledFieldVisitEditor>
  );
  return modal ? (
    <FieldVisitEditorModal onCancel={unsaved.cancel}>
      {content}
    </FieldVisitEditorModal>
  ) : (
    content
  );
};
