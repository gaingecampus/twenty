import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { IconX } from 'twenty-ui/icon';
import { IconButton } from 'twenty-ui/input';
import { styled } from '@linaria/react';
import { themeCssVariables as theme } from 'twenty-ui/theme-constants';
import { StyledFieldPanel } from './fieldManagementStyled';

const StyledDialog = styled.dialog`
  --field-editor-sticky-bottom: -24px;
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
  align-items: center;
  background: ${theme.background.primary};
  display: flex;
  gap: 12px;
  justify-content: space-between;
  padding-bottom: var(--t-gallery-gap, 16px);
  position: sticky;
  top: 0;
  z-index: 1;
`;

const StyledHeaderActions = styled.div`
  align-items: center;
  display: flex;
  gap: 8px;
`;

export const FieldVisitEditorModal = ({
  children,
  onCancel,
  title = '새 현장 기록',
  onNavigationContainer,
  onActionsContainer,
}: {
  onActionsContainer?: (container: HTMLDivElement | null) => void;
  onNavigationContainer?: (container: HTMLDivElement | null) => void;
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
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          requestClose();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        requestClose();
      }}
    >
      <StyledCloseRow>
        <div ref={onNavigationContainer} />
        <StyledHeaderActions>
          <div ref={onActionsContainer} />
          <IconButton
            Icon={IconX}
            ariaLabel={`${title} 닫기`}
            onClick={requestClose}
          />
        </StyledHeaderActions>
      </StyledCloseRow>
      <StyledFieldPanel data-inline-detail>{children}</StyledFieldPanel>
    </StyledDialog>,
    document.body,
  );
};
