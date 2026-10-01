import { FieldInputEventContext } from '@/object-record/record-field/ui/contexts/FieldInputEventContext';
import { useFullNameField } from '@/object-record/record-field/ui/meta-types/hooks/useFullNameField';
import { useRegisterInputEvents } from '@/object-record/record-field/ui/meta-types/input/hooks/useRegisterInputEvents';
import { TextInput } from '@/ui/input/components/TextInput';
import { useContext, useRef, useState } from 'react';

type RecordTitleFullNameFieldInputProps = {
  instanceId: string;
  sizeVariant?: 'xs' | 'sm' | 'md';
};

export const RecordTitleFullNameFieldInput = ({
  instanceId,
  sizeVariant,
}: RecordTitleFullNameFieldInputProps) => {
  const { draftValue, setDraftValue, fieldDefinition } = useFullNameField();
  const [originalValue] = useState(draftValue);
  const originalName = [
    originalValue?.firstName,
    originalValue?.lastName,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();
  const [name, setName] = useState(originalName);
  const inputRef = useRef<HTMLInputElement>(null);
  const { onEnter, onEscape, onClickOutside, onTab, onShiftTab } = useContext(
    FieldInputEventContext,
  );

  const toFullName = (value: string) =>
    value.trim() === originalName
      ? originalValue
      : { firstName: value.trim(), lastName: '' };

  useRegisterInputEvents<string>({
    focusId: instanceId,
    inputRef,
    inputValue: name,
    onEnter: (value) => onEnter?.({ newValue: toFullName(value) }),
    onEscape: (value) => onEscape?.({ newValue: toFullName(value) }),
    onClickOutside: (event, value) =>
      onClickOutside?.({ newValue: toFullName(value), event }),
    onTab: (value) => onTab?.({ newValue: toFullName(value) }),
    onShiftTab: (value) => onShiftTab?.({ newValue: toFullName(value) }),
  });

  return (
    <TextInput
      ref={inputRef}
      autoGrow
      sizeVariant={sizeVariant}
      inheritFontStyles
      value={name}
      onChange={(value) => {
        setName(value);
        setDraftValue(toFullName(value));
      }}
      placeholder={fieldDefinition.label}
      onFocus={(event) => event.target.select()}
      autoFocus
    />
  );
};
