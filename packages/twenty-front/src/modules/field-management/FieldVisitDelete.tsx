import { FieldConfirmDialog } from './FieldConfirmDialog';
import { IconTrash } from 'twenty-ui/icon';
import { useState } from 'react';
import { useDeleteOneRecord } from '@/object-record/hooks/useDeleteOneRecord';
import { StyledFieldRow } from './fieldManagementStyled';
export const FieldVisitDelete = ({
  id,
  onDeleted,
}: {
  id: string;
  onDeleted: () => Promise<void>;
}) => {
  const { deleteOneRecord } = useDeleteOneRecord({
    objectNameSingular: 'fieldVisit',
  });
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const remove = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await deleteOneRecord(id);
      await onDeleted();
    } catch {
      setError('삭제하지 못했습니다. 권한과 연결을 확인하십시오.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <StyledFieldRow>
      <button data-danger onClick={() => setConfirm(true)}>
        <IconTrash size={15} aria-hidden="true" />
        기록 삭제
      </button>
      {confirm && (
        <FieldConfirmDialog
          title="기록을 휴지통으로 이동하시겠습니까?"
          description={error || '휴지통에서 다시 복원할 수 있습니다.'}
          confirmLabel="휴지통으로 이동"
          busy={busy}
          onConfirm={() => void remove()}
          onCancel={() => setConfirm(false)}
        />
      )}
      {error && <p role="alert">{error}</p>}
    </StyledFieldRow>
  );
};
