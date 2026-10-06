import { useEffect, useRef, type ReactNode } from 'react';
import { IconDotsVertical } from 'twenty-ui/icon';
import { styled } from '@linaria/react';
import { themeCssVariables as theme } from 'twenty-ui/theme-constants';
const StyledMore = styled.details`
  position: relative;
  summary {
    align-items: center;
    background: transparent;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    height: 36px;
    justify-content: center;
    list-style: none;
    width: 36px;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary:hover {
    background: ${theme.background.tertiary};
  }
  > div {
    background: ${theme.background.primary};
    border: 1px solid ${theme.border.color.light};
    border-radius: 12px;
    box-shadow: ${theme.boxShadow.strong};
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px;
    position: absolute;
    right: 0;
    top: 42px;
    width: 180px;
    z-index: 10;
  }
  &&& > div button {
    background: transparent;
    border-radius: var(--t-border-radius-sm, 6px);
    align-items: center;
    display: flex;
    gap: 10px;
    justify-content: flex-start;
    padding: 10px 12px;
    text-align: left;
    width: 100%;
  }
  &&& > div button:hover {
    background: ${theme.background.tertiary};
  }
  &&& > div button[data-danger]:hover {
    background: ${theme.background.transparent.danger};
  }
  &&& > div button[data-danger] {
    color: ${theme.color.red};
  }
`;
export const FieldRecordMore = ({
  children,
  label = '기록 더보기',
}: {
  children: ReactNode;
  label?: string;
}) => {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node))
        ref.current.open = false;
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && ref.current?.open) {
        ref.current.open = false;
        ref.current.querySelector('summary')?.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, []);
  return (
    <StyledMore ref={ref}>
      <summary aria-label={label} title="더보기">
        <IconDotsVertical size={18} />
      </summary>
      <div>{children}</div>
    </StyledMore>
  );
};
