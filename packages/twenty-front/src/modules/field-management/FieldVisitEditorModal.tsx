import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { IconX } from 'twenty-ui/icon';
import { IconButton } from 'twenty-ui/input';
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

const StyledCloseRow = styled.div`
  display: flex;
  justify-content: flex-end;
  position: sticky;
  top: 0;
  z-index: 1;
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
  const [pointerStartedOutside, setPointerStartedOutside] = useState(false);
  const requestClose = () => {
    const cancelButton = ref.current?.querySelector<HTMLButtonElement>(
      'button[data-cancel]',
    );
    if (cancelButton) cancelButton.click();
    else onCancel();
  };
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return createPortal(
    <StyledDialog
      ref={ref}
      aria-label={title}
      onPointerDown={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        setPointerStartedOutside(
          event.target === event.currentTarget &&
            (event.clientX < bounds.left ||
              event.clientX > bounds.right ||
              event.clientY < bounds.top ||
              event.clientY > bounds.bottom),
        );
      }}
      onClick={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          pointerStartedOutside &&
          event.target === event.currentTarget &&
          (event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom)
        ) {
          requestClose();
        }
        setPointerStartedOutside(false);
      }}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
    >
      <StyledCloseRow>
        <IconButton
          Icon={IconX}
          aria-label="현장 기록 닫기"
          onClick={requestClose}
        />
      </StyledCloseRow>
      <StyledFieldPanel>{children}</StyledFieldPanel>
    </StyledDialog>,
    document.body,
  );
};
