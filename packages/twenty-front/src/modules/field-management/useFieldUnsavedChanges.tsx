import { useEffect, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import { FieldConfirmDialog } from './FieldConfirmDialog';
export const useFieldUnsavedChanges = (
  dirty: boolean,
  busy: boolean,
  onCancel: () => void,
) => {
  const [confirm, setConfirm] = useState(false);
  const [leaveAction, setLeaveAction] = useState<(() => void) | null>(null);
  const requestLeave = (action: () => void) => {
    if (busy) return;
    if (!dirty) {
      action();
      return;
    }
    setLeaveAction(() => action);
    setConfirm(true);
  };
  const blocker = useBlocker(dirty && !busy);
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
  return {
    cancel: () => requestLeave(onCancel),
    requestLeave,
    dialog:
      confirm || blocker.state === 'blocked' ? (
        <FieldConfirmDialog
          title="저장하지 않고 나가시겠습니까?"
          description="지금 나가면 작성 중인 내용은 저장되지 않습니다."
          confirmLabel="저장하지 않고 나가기"
          cancelLabel="계속 작성"
          onCancel={() => {
            setConfirm(false);
            if (blocker.state === 'blocked') blocker.reset();
          }}
          onConfirm={() => {
            setConfirm(false);
            if (blocker.state === 'blocked') blocker.proceed();
            else (leaveAction ?? onCancel)();
          }}
        />
      ) : null,
  };
};
