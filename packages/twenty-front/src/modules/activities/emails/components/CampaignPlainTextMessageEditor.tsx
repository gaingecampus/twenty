import { CampaignBodyVariablePicker } from '@/activities/emails/components/CampaignBodyVariablePicker';
import { isDefined } from 'twenty-shared/utils';
import { FORM_FIELD_PLACEHOLDER_STYLES } from '@/object-record/record-field/ui/form-types/constants/FormFieldPlaceholderStyles';
import { useFullScreenModal } from '@/ui/layout/fullscreen/hooks/useFullScreenModal';
import { styled } from '@linaria/react';
import { useId, useRef, useState, type ReactNode } from 'react';
import { IconMaximize } from 'twenty-ui/icon';
import { LightIconButton } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledEditor = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  min-height: 0;
`;

const StyledMessageInput = styled.div`
  flex: 1;
  min-height: 0;
  position: relative;

  && textarea {
    background: var(
      --t-input-background,
      ${themeCssVariables.background.transparent.lighter}
    );
    border: 1px solid ${themeCssVariables.border.color.medium};
    border-radius: ${themeCssVariables.border.radius.sm};
    box-sizing: border-box;
    color: ${themeCssVariables.font.color.primary};
    display: block;
    font-family: ${themeCssVariables.font.family};
    font-size: ${themeCssVariables.font.size.sm};
    font-weight: ${themeCssVariables.font.weight.regular};
    height: 100%;
    line-height: 1.5;
    min-height: 180px;
    padding: var(--t-input-padding-y, ${themeCssVariables.spacing[1]})
      ${themeCssVariables.spacing[9]} ${themeCssVariables.spacing[8]}
      var(--t-input-padding-x, ${themeCssVariables.spacing[2]});
    resize: none;
    width: 100%;

    &::placeholder {
      ${FORM_FIELD_PLACEHOLDER_STYLES}
      opacity: 1;
    }
  }
`;

const StyledExpandButton = styled.div`
  position: absolute;
  right: var(--t-input-padding-x, ${themeCssVariables.spacing[1]});
  top: var(--t-input-padding-y, ${themeCssVariables.spacing[1]});
`;

const StyledMessageCounter = styled.div`
  bottom: ${themeCssVariables.spacing[2]};
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  line-height: 1.5;
  pointer-events: none;
  position: absolute;
  right: var(--t-input-padding-x, ${themeCssVariables.spacing[2]});
`;

export const CampaignPlainTextMessageEditor = ({
  value,
  onChange,
  disabled,
  counter,
  maxLength,
  showCustomerInfo = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  counter?: ReactNode;
  maxLength?: number;
  showCustomerInfo?: boolean;
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const { renderFullScreenModal } = useFullScreenModal({
    links: [{ children: '텍스트 편집기' }],
    onClose: () => setIsFullScreen(false),
  });
  const counterId = useId();
  const insertCustomerInfo = (text: string) => {
    const input = inputRef.current;
    if (disabled || !input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const nextValue = value.slice(0, start) + text + value.slice(end);
    if (isDefined(maxLength) && nextValue.length > maxLength) return;
    onChange(nextValue);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(
        start + text.length,
        start + text.length,
      );
    });
  };

  const editor = (
    <StyledEditor>
      {showCustomerInfo && (
        <CampaignBodyVariablePicker
          variables={['fullName', 'companyName']}
          disabled={disabled}
          isDropdownInModal={isFullScreen}
          onInsert={insertCustomerInfo}
        />
      )}
      <StyledMessageInput>
        <textarea
          ref={inputRef}
          aria-describedby={isDefined(counter) ? counterId : undefined}
          maxLength={maxLength}
          aria-label="메시지"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder="고객에게 전할 내용을 입력하세요"
        />
        {!isFullScreen && (
          <StyledExpandButton>
            <LightIconButton
              Icon={IconMaximize}
              size="small"
              accent="tertiary"
              aria-label="메시지 전체 화면으로 열기"
              title="전체 화면으로 열기"
              disabled={disabled}
              onClick={() => setIsFullScreen(true)}
            />
          </StyledExpandButton>
        )}
        {isDefined(counter) && (
          <StyledMessageCounter id={counterId}>{counter}</StyledMessageCounter>
        )}
      </StyledMessageInput>
    </StyledEditor>
  );

  return (
    <>
      {!isFullScreen && editor}
      {renderFullScreenModal(editor, isFullScreen)}
    </>
  );
};
