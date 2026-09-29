import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { styled } from '@linaria/react';
import { themeCssVariables as theme } from 'twenty-ui/theme-constants';
const StyledDialog = styled.dialog`
  background: ${theme.background.primary};
  border: none;
  border-radius: 20px;
  box-shadow: ${theme.boxShadow.strong};
  color: ${theme.font.color.primary};
  padding: 24px;
  width: min(380px, calc(100vw - 80px));
  &::backdrop {
    background: ${theme.background.overlaySecondary};
  }
  h2 {
    font-size: 20px;
    margin: 0 0 12px;
  }
  p {
    font-size: 14px;
    line-height: 1.7;
    margin: 0 0 24px;
  }
  footer {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
  button {
    background: ${theme.background.tertiary};
    border: none;
    border-radius: 10px;
    color: inherit;
    cursor: pointer;
    font: inherit;
    min-height: 40px;
    padding: 10px 16px;
  }
  button[data-danger] {
    background: ${theme.color.red};
    color: ${theme.font.color.inverted};
  }
  button:focus-visible {
    outline: 2px solid ${theme.color.blue};
    outline-offset: 2px;
  }
`;
export const FieldConfirmDialog = ({
  title,
  description,
  confirmLabel,
  cancelLabel = '취소',
  busy = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return createPortal(
    <StyledDialog
      ref={ref}
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <h2>{title}</h2>
      <p>{description}</p>
      <footer>
        <button disabled={busy} onClick={onCancel}>
          {cancelLabel}
        </button>
        <button data-danger disabled={busy} onClick={onConfirm}>
          {busy ? '처리 중…' : confirmLabel}
        </button>
      </footer>
    </StyledDialog>,
    document.body,
  );
};
