import { usePushFocusItemToFocusStack } from '@/ui/utilities/focus/hooks/usePushFocusItemToFocusStack';
import { useRemoveFocusItemFromFocusStackById } from '@/ui/utilities/focus/hooks/useRemoveFocusItemFromFocusStackById';
import { FocusComponentType } from '@/ui/utilities/focus/types/FocusComponentType';
import { type FocusEventHandler, useId } from 'react';
import {
  SearchInput as UiSearchInput,
  type SearchInputProps as UiSearchInputProps,
} from 'twenty-ui/input';

export type SearchInputProps = UiSearchInputProps & {
  instanceId?: string;
  disableHotkeys?: boolean;
};

export const SearchInput = ({
  instanceId,
  disableHotkeys = false,
  onFocus,
  onBlur,
  ...props
}: SearchInputProps) => {
  const generatedInstanceId = useId();
  const focusInstanceId = instanceId ?? generatedInstanceId;

  const { pushFocusItemToFocusStack } = usePushFocusItemToFocusStack();
  const { removeFocusItemFromFocusStackById } =
    useRemoveFocusItemFromFocusStackById();

  // Capture on the wrapper so Go-to hotkeys stay disabled even if Base UI
  // Input does not forward React focus handlers to the native input.
  const handleFocusCapture: FocusEventHandler<HTMLDivElement> = () => {
    if (disableHotkeys) {
      return;
    }

    pushFocusItemToFocusStack({
      focusId: focusInstanceId,
      component: {
        type: FocusComponentType.TEXT_INPUT,
        instanceId: focusInstanceId,
      },
      globalHotkeysConfig: {
        enableGlobalHotkeysConflictingWithKeyboard: false,
      },
    });
  };

  const handleBlurCapture: FocusEventHandler<HTMLDivElement> = (event) => {
    if (disableHotkeys) {
      return;
    }

    if (
      event.relatedTarget instanceof Node &&
      event.currentTarget.contains(event.relatedTarget)
    ) {
      return;
    }

    removeFocusItemFromFocusStackById({ focusId: focusInstanceId });
  };

  return (
    <div onFocusCapture={handleFocusCapture} onBlurCapture={handleBlurCapture}>
      <UiSearchInput
        // oxlint-disable-next-line react/jsx-props-no-spreading
        {...props}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </div>
  );
};
