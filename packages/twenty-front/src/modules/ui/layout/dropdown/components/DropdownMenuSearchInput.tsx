import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useInputFocusWithoutScrollOnMount } from '@/ui/input/hooks/useInputFocusWithoutScrollOnMount';
import { styled } from '@linaria/react';
import { forwardRef, type InputHTMLAttributes } from 'react';
import { IconSearch } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledDropdownMenuSearchInputContainer = styled.div`
  align-items: center;
  background: var(--t-search-bg, ${themeCssVariables.background.secondary});
  border: 1px solid
    var(--t-search-border-color, ${themeCssVariables.border.color.medium});
  border-radius: var(--t-search-radius, ${themeCssVariables.border.radius.sm});
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  margin: 8px;
  min-height: var(--t-search-height, 36px);
  padding: 0 10px;
  width: calc(100% - 16px);

  &:focus-within {
    border-color: ${themeCssVariables.color.blue};
    box-shadow: var(--t-search-focus-ring, none);
  }

  > svg {
    flex-shrink: 0;
  }
`;

const StyledInput = styled.input`
  background-color: transparent;
  border: none;
  color: ${themeCssVariables.font.color.primary};
  flex: 1;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: inherit;
  min-width: 0;

  &::placeholder,
  &::-webkit-input-placeholder {
    color: ${themeCssVariables.font.color.light};
    font-family: ${themeCssVariables.font.family};
    font-weight: ${themeCssVariables.font.weight.medium};
  }

  outline: none;
  padding: ${themeCssVariables.spacing[0]} ${themeCssVariables.spacing[2]};
  width: 100%;

  &[type='number']::-webkit-outer-spin-button,
  &[type='number']::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &[type='number'] {
    -moz-appearance: textfield;
  }
`;

const defaultSearchPlaceholder = msg`Search`;

export const DropdownMenuSearchInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ value, onChange, placeholder, type, ...inputProps }, forwardedRef) => {
  const { i18n } = useLingui();
  const { inputRef } = useInputFocusWithoutScrollOnMount();
  const ref = forwardedRef ?? inputRef;
  const translatedPlaceholder = placeholder ?? i18n._(defaultSearchPlaceholder);
  return (
    <StyledDropdownMenuSearchInputContainer>
      {(type === undefined || type === 'text' || type === 'search') && (
        <IconSearch size={16} aria-hidden />
      )}
      <StyledInput
        // oxlint-disable-next-line react/jsx-props-no-spreading
        {...inputProps}
        aria-label={inputProps['aria-label'] ?? translatedPlaceholder}
        autoComplete="off"
        {...{ onChange, placeholder: translatedPlaceholder, type, value }}
        ref={ref}
      />
    </StyledDropdownMenuSearchInputContainer>
  );
});
