import { useCallback } from 'react';

import { getCommandMenuDropdownIdFromCommandMenuId } from '@/command-menu-item/utils/getCommandMenuDropdownIdFromCommandMenuId';
import { getCommandMenuIdFromRecordIndexId } from '@/command-menu-item/utils/getCommandMenuIdFromRecordIndexId';
import { isRecordGalleryCardSelectedComponentFamilyState } from '@/object-record/record-gallery/record-gallery-card/states/isRecordGalleryCardSelectedComponentFamilyState';
import { RecordGalleryComponentInstanceContext } from '@/object-record/record-gallery/states/contexts/RecordGalleryComponentInstanceContext';
import { recordGallerySelectedRecordIdsComponentSelector } from '@/object-record/record-gallery/states/selectors/recordGallerySelectedRecordIdsComponentSelector';
import { useCloseDropdown } from '@/ui/layout/dropdown/hooks/useCloseDropdown';
import { useAvailableComponentInstanceIdOrThrow } from '@/ui/utilities/state/component-state/hooks/useAvailableComponentInstanceIdOrThrow';
import { useAtomComponentFamilyStateCallbackState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentFamilyStateCallbackState';
import { useAtomComponentSelectorCallbackState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentSelectorCallbackState';
import { useStore } from 'jotai';

export const useRecordGallerySelection = (recordGalleryId?: string) => {
  const instanceIdFromProps = useAvailableComponentInstanceIdOrThrow(
    RecordGalleryComponentInstanceContext,
    recordGalleryId,
  );

  const isRecordGalleryCardSelectedFamilyState =
    useAtomComponentFamilyStateCallbackState(
      isRecordGalleryCardSelectedComponentFamilyState,
      recordGalleryId,
    );

  const recordGallerySelectedRecordIds = useAtomComponentSelectorCallbackState(
    recordGallerySelectedRecordIdsComponentSelector,
    recordGalleryId,
  );

  const { closeDropdown } = useCloseDropdown();
  const store = useStore();

  const dropdownId = getCommandMenuDropdownIdFromCommandMenuId(
    getCommandMenuIdFromRecordIndexId(instanceIdFromProps),
  );

  const resetRecordSelection = useCallback(() => {
    closeDropdown(dropdownId);

    const recordIds = store.get(recordGallerySelectedRecordIds);

    for (const recordId of recordIds) {
      store.set(isRecordGalleryCardSelectedFamilyState(recordId), false);
    }
  }, [
    closeDropdown,
    dropdownId,
    recordGallerySelectedRecordIds,
    isRecordGalleryCardSelectedFamilyState,
    store,
  ]);

  return {
    resetRecordSelection,
  };
};
