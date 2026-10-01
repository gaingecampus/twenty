import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { styled } from '@linaria/react';
import { themeCssVariables as theme } from 'twenty-ui/theme-constants';
import { StyledFieldPanel } from './fieldManagementStyled';

const StyledDialog = styled.dialog`
  background: ${theme.background.primary};
  border: 1px solid ${theme.border.color.medium};
  border-radius: ${theme.border.radius.xl};
  box-shadow: ${theme.boxShadow.strong};
  box-sizing: border-box;
  max-height: calc(100dvh - 48px);
  overflow-y: auto;
  padding: 24px;
  width: min(800px, calc(100vw - 32px));

  &::backdrop {
    background: ${theme.background.overlaySecondary};
  }
`;

export const FieldVisitEditorModal = ({
  children,
  onCancel,
  title = '새 현장 기록',
}: {
  children: ReactNode;
  title?: string;
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
        const cancelButton = ref.current?.querySelector<HTMLButtonElement>(
          'button[data-cancel]',
        );
        if (cancelButton) cancelButton.click();
        else onCancel();
      }}
    >
      <StyledFieldPanel>{children}</StyledFieldPanel>
    </StyledDialog>,
    document.body,
  );
};
