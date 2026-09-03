import { styled } from '@linaria/react';
import {
  forwardRef,
  useRef,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { useRegisterInputEvents } from '@/object-record/record-field/ui/meta-types/input/hooks/useRegisterInputEvents';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { isDefined } from 'twenty-shared/utils';
import { useCombinedRefs } from '~/hooks/useCombinedRefs';

const StyledInput = styled.input<{
  withRightComponent?: boolean;
}>`
  background-color: transparent;
  border: none;
  border-radius: var(
    --t-border-radius-sm,
    ${themeCssVariables.border.radius.sm}
  );
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.primary};
  font-family: ${themeCssVariables.font.family};

  &::placeholder,
  &::-webkit-input-placeholder {
    color: ${themeCssVariables.font.color.light};
    font-family: ${themeCssVariables.font.family};
    font-weight: ${themeCssVariables.font.weight.medium};
  }

  font-size: inherit;
  font-weight: inherit;
  height: var(--t-control-height-md, 40px);
  outline: none;
  padding: ${themeCssVariables.spacing[0]} ${themeCssVariables.spacing[2]};
  padding-right: ${({ withRightComponent }) =>
    withRightComponent ? '32px' : '0'};
  position: relative;

  width: 100%;
`;

const StyledInputContainer = styled.div`
  background-color: transparent;
  box-sizing: border-box;
  position: relative;
  width: 100%;

  &:not(:first-of-type) {
    padding: ${themeCssVariables.spacing[1]};
  }
`;

const StyledRightContainer = styled.div`
  position: absolute;
  right: ${themeCssVariables.spacing[2]};
  top: 50%;
  transform: translateY(-50%);
`;

const StyledErrorDiv = styled.div`
  color: ${themeCssVariables.color.red};
  padding: 0 ${themeCssVariables.spacing[2]};
`;

type HTMLInputProps = InputHTMLAttributes<HTMLInputElement>;

export type MultiItemBaseInputProps = Pick<
  HTMLInputProps,
  'autoFocus' | 'className' | 'value' | 'placeholder' | 'onFocus' | 'onBlur'
> & {
  onClickOutside?: () => void;
  onEnter?: () => void;
  onEscape?: () => void;
  onShiftTab?: () => void;
  onTab?: () => void;
  rightComponent?: ReactNode;
  renderInput?: (props: {
    value: HTMLInputProps['value'];
    onChange: (value: string) => void;
    autoFocus: HTMLInputProps['autoFocus'];
    placeholder: HTMLInputProps['placeholder'];
    hasError?: boolean;
  }) => React.ReactNode;
  error?: string | null;
  hasError?: boolean;
  hasItem: boolean;
  onChange: (value: string) => void;
  instanceId: string;
};

export const MultiItemBaseInput = forwardRef<
  HTMLInputElement,
  MultiItemBaseInputProps
>(
  (
    {
      autoFocus,
      className,
      value,
      placeholder,
      onChange,
      onClickOutside,
      onEnter = () => {},
      onEscape = () => {},
      onShiftTab,
      onTab,
      onFocus,
      onBlur,
      rightComponent,
      renderInput,
      error = '',
      hasError = false,
      instanceId,
    },
    ref,
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const combinedRef = useCombinedRefs(ref, inputRef);

    useRegisterInputEvents({
      focusId: instanceId,
      inputRef,
      inputValue: value,
      onEnter,
      onEscape,
      onClickOutside,
      onTab,
      onShiftTab,
    });

    return (
      <>
        <StyledInputContainer className={className}>
          {renderInput ? (
            renderInput({
              value,
              onChange,
              autoFocus,
              placeholder,
              hasError,
            })
          ) : (
            <StyledInput
              autoFocus={autoFocus}
              value={value}
              placeholder={placeholder}
              onChange={(event) => onChange(event.target.value)}
              ref={combinedRef}
              withRightComponent={isDefined(rightComponent)}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          )}
          {isDefined(rightComponent) && (
            <StyledRightContainer>{rightComponent}</StyledRightContainer>
          )}
        </StyledInputContainer>
        {error && <StyledErrorDiv>{error}</StyledErrorDiv>}
      </>
    );
  },
);
