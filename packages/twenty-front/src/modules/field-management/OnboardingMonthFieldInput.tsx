import { OnboardingMonthPicker } from '@/field-management/OnboardingMonthPicker';
import { FieldInputEventContext } from '@/object-record/record-field/ui/contexts/FieldInputEventContext';
import { useRegisterInputEvents } from '@/object-record/record-field/ui/meta-types/input/hooks/useRegisterInputEvents';
import { RecordFieldComponentInstanceContext } from '@/object-record/record-field/ui/states/contexts/RecordFieldComponentInstanceContext';
import { useAvailableComponentInstanceIdOrThrow } from '@/ui/utilities/state/component-state/hooks/useAvailableComponentInstanceIdOrThrow';
import { useContext, useRef } from 'react';

export const OnboardingMonthFieldInput = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  const events = useContext(FieldInputEventContext);
  const instanceId = useAvailableComponentInstanceIdOrThrow(
    RecordFieldComponentInstanceContext,
  );
  const ref = useRef<HTMLDivElement>(null);
  useRegisterInputEvents({
    inputRef: ref,
    inputValue: value,
    focusId: instanceId,
    onEscape: () => events.onEscape?.({ newValue: value, skipPersist: true }),
    onEnter: () => (events.onSubmit ?? events.onEnter)?.({ newValue: value }),
    onTab: () => events.onTab?.({ newValue: value }),
    onShiftTab: () => events.onShiftTab?.({ newValue: value }),
    onClickOutside: (event) =>
      events.onClickOutside?.({ newValue: value, event }),
  });
  return (
    <div ref={ref}>
      <OnboardingMonthPicker
        value={value}
        onChange={onChange}
        onConfirm={() =>
          (events.onSubmit ?? events.onEnter)?.({ newValue: value })
        }
      />
    </div>
  );
};
