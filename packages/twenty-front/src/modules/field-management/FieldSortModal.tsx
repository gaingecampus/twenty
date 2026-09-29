import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { styled } from '@linaria/react';
import { IconCheck, IconX } from 'twenty-ui/icon';
import { themeCssVariables as theme } from 'twenty-ui/theme-constants';

const StyledDialog = styled.dialog`
  background: ${theme.background.primary};
  border: none;
  border-radius: 24px;
  box-shadow: ${theme.boxShadow.strong};
  box-sizing: border-box;
  color: ${theme.font.color.primary};
  max-height: 85vh;
  padding: 24px;
  width: min(400px, calc(100vw - 32px));
  &[data-contract-picker] {
    width: min(640px, calc(100vw - 32px));
  }
  [data-choices] {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  &[data-contract-picker] [data-choice] {
    background: ${theme.background.secondary};
    border-radius: 14px;
    margin: 0;
    padding: 18px 16px;
  }
  &[data-contract-picker] [data-choice]:hover {
    background: ${theme.background.tertiary};
  }
  &::backdrop {
    background: ${theme.background.overlaySecondary};
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }
  h2 {
    font-size: 20px;
    margin: 0;
  }
  button {
    font: inherit;
    cursor: pointer;
    color: inherit;
    border: none;
    border-radius: 10px;
    background: transparent;
  }
  header button {
    display: flex;
    padding: 8px;
  }
  [data-choice] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 44px;
    padding: 12px;
    width: 100%;
    text-align: left;
    margin: 2px 0;
  }
  [data-choice]:hover,
  header button:hover {
    background: ${theme.background.tertiary};
  }
  [data-choice][aria-checked='true'] {
    background: ${theme.background.transparent.blue};
    color: ${theme.color.blue};
    font-weight: 600;
  }
  small {
    display: block;
    font-size: 12px;
    color: ${theme.font.color.secondary};
    margin-top: 6px;
  }
  input {
    box-sizing: border-box;
    width: 100%;
    border: 1px solid ${theme.border.color.medium};
    border-radius: 8px;
    padding: 12px;
    font: inherit;
    color: inherit;
    background: ${theme.background.primary};
    margin-bottom: 12px;
  }
  button:focus-visible {
    outline: 2px solid ${theme.border.color.blue};
    outline-offset: 2px;
  }
`;
export const FieldSortModal = ({
  title = '기록 정렬',
  options,
  value,
  renderOption,
  onSelect,
  onClose,
}: {
  title?: string;
  options: { value: string; label: string; description?: string }[];
  value: string;
  renderOption?: (value: string) => ReactNode;
  onSelect: (value: string) => void;
  onClose: () => void;
}) => {
  const [search, setSearch] = useState('');
  const isContract = title !== '기록 정렬';
  const filtered = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase()),
  );
  const titleId = useId();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return createPortal(
    <StyledDialog
      ref={ref}
      data-contract-picker={isContract || undefined}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            onClose();
        }
      }}
    >
      <header>
        <h2 id={titleId}>{title}</h2>
        <button type="button" aria-label={`${title} 닫기`} onClick={onClose}>
          <IconX size={20} />
        </button>
      </header>
      {isContract && options.length > 5 && (
        <input
          aria-label="계약 검색"
          placeholder="계약 이름 검색"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      )}
      <div
        data-choices
        role={isContract ? 'group' : 'menu'}
        aria-label={title}
        onKeyDown={(event) => {
          if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key))
            return;
          event.preventDefault();
          const buttons = Array.from(
            event.currentTarget.querySelectorAll('button'),
          );
          const index = buttons.indexOf(
            document.activeElement as HTMLButtonElement,
          );
          const next =
            event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? buttons.length - 1
                : (index +
                    (event.key === 'ArrowDown' ? 1 : -1) +
                    buttons.length) %
                  buttons.length;
          buttons[next]?.focus();
        }}
      >
        {filtered.map((option) => (
          <button
            data-choice
            type="button"
            role={isContract ? undefined : 'menuitemradio'}
            aria-checked={isContract ? undefined : value === option.value}
            key={option.value}
            onClick={() => {
              onSelect(option.value);
              onClose();
            }}
          >
            {renderOption ? (
              renderOption(option.value)
            ) : (
              <span>
                {option.label}
                {option.description && <small>{option.description}</small>}
              </span>
            )}
            {value === option.value && (
              <IconCheck size={18} aria-hidden="true" />
            )}
          </button>
        ))}
        {!filtered.length && <p>일치하는 계약이 없습니다.</p>}
      </div>
    </StyledDialog>,
    document.body,
  );
};
