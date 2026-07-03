import { usePersistFieldFromFieldInputContext } from '@/object-record/record-field/ui/hooks/usePersistFieldFromFieldInputContext';
import { RecordFieldComponentInstanceContext } from '@/object-record/record-field/ui/states/contexts/RecordFieldComponentInstanceContext';
import { recordGalleryCardEditModePositionComponentState } from '@/object-record/record-gallery/record-gallery-card/states/recordGalleryCardEditModePositionComponentState';
import {
  FieldInputEventContext,
  type FieldInputClickOutsideEvent,
  type FieldInputEvent,
} from '@/object-record/record-field/ui/contexts/FieldInputEventContext';
import { useInlineCell } from '@/object-record/record-inline-cell/hooks/useInlineCell';
import { currentFocusIdSelector } from '@/ui/utilities/focus/states/currentFocusIdSelector';
import { useAvailableComponentInstanceId } from '@/ui/utilities/state/component-state/hooks/useAvailableComponentInstanceId';
import { useSetAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useSetAtomComponentState';
import { useStore } from 'jotai';
import { useCallback } from 'react';

type RecordGalleryCardInputContextProviderProps = {
  children: React.ReactNode;
};

export const RecordGalleryCardInputContextProvider = ({
  children,
}: RecordGalleryCardInputContextProviderProps) => {
  const store = useStore();
  const { closeInlineCell } = useInlineCell();
  const setRecordGalleryCardEditModePosition = useSetAtomComponentState(
    recordGalleryCardEditModePositionComponentState,
  );

  const closeInlineCellAndResetEditModePosition = useCallback(() => {
    setRecordGalleryCardEditModePosition(null);
    closeInlineCell();
  }, [closeInlineCell, setRecordGalleryCardEditModePosition]);

  const instanceId = useAvailableComponentInstanceId(
    RecordFieldComponentInstanceContext,
  );

  const { persistFieldFromFieldInputContext } =
    usePersistFieldFromFieldInputContext();

  const handleEnter: FieldInputEvent = ({ newValue, skipPersist }) => {
    if (skipPersist !== true) {
      persistFieldFromFieldInputContext(newValue);
    }

    closeInlineCellAndResetEditModePosition();
  };

  const handleSubmit: FieldInputEvent = ({ newValue, skipPersist }) => {
    if (skipPersist !== true) {
      persistFieldFromFieldInputContext(newValue);
    }

    closeInlineCellAndResetEditModePosition();
  };

  const handleCancel = () => {
    closeInlineCellAndResetEditModePosition();
  };

  const handleClickOutside: FieldInputClickOutsideEvent = useCallback(
    ({ newValue, event, skipPersist }) => {
      const currentFocusId = store.get(currentFocusIdSelector.atom);

      if (currentFocusId !== instanceId) {
        return;
      }
      event?.preventDefault();
      event?.stopImmediatePropagation();

      if (skipPersist !== true) {
        persistFieldFromFieldInputContext(newValue);
      }

      closeInlineCellAndResetEditModePosition();
    },
    [
      closeInlineCellAndResetEditModePosition,
      instanceId,
      persistFieldFromFieldInputContext,
      store,
    ],
  );

  const handleEscape: FieldInputEvent = ({ newValue, skipPersist }) => {
    if (skipPersist !== true) {
      persistFieldFromFieldInputContext(newValue);
    }

    closeInlineCellAndResetEditModePosition();
  };

  const handleTab: FieldInputEvent = ({ newValue, skipPersist }) => {
    if (skipPersist !== true) {
      persistFieldFromFieldInputContext(newValue);
    }

    closeInlineCellAndResetEditModePosition();
  };

  const handleShiftTab: FieldInputEvent = ({ newValue, skipPersist }) => {
    if (skipPersist !== true) {
      persistFieldFromFieldInputContext(newValue);
    }

    closeInlineCellAndResetEditModePosition();
  };

  return (
    <FieldInputEventContext.Provider
      value={{
        onCancel: handleCancel,
        onEnter: handleEnter,
        onEscape: handleEscape,
        onClickOutside: handleClickOutside,
        onShiftTab: handleShiftTab,
        onSubmit: handleSubmit,
        onTab: handleTab,
      }}
    >
      {children}
    </FieldInputEventContext.Provider>
  );
};
