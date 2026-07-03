import { contextStoreTargetedRecordsRuleComponentState } from '@/context-store/states/contextStoreTargetedRecordsRuleComponentState';
import { useRecordGalleryContextOrThrow } from '@/object-record/record-gallery/contexts/RecordGalleryContext';
import { recordGallerySelectedRecordIdsComponentSelector } from '@/object-record/record-gallery/states/selectors/recordGallerySelectedRecordIdsComponentSelector';
import { RecordGalleryComponentInstanceContext } from '@/object-record/record-gallery/states/contexts/RecordGalleryComponentInstanceContext';
import { useRecordIndexTableQuery } from '@/object-record/record-index/hooks/useRecordIndexTableQuery';
import { recordIndexRecordIdsByGroupComponentFamilyState } from '@/object-record/record-index/states/recordIndexRecordIdsByGroupComponentFamilyState';
import { NO_RECORD_GROUP_FAMILY_KEY } from '@/object-record/record-index/states/selectors/recordIndexAllRecordIdsComponentSelector';
import { useUpsertRecordsInStore } from '@/object-record/record-store/hooks/useUpsertRecordsInStore';
import { useAvailableComponentInstanceIdOrThrow } from '@/ui/utilities/state/component-state/hooks/useAvailableComponentInstanceIdOrThrow';
import { useAtomComponentSelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentSelectorValue';
import { useSetAtomComponentFamilyState } from '@/ui/utilities/state/jotai/hooks/useSetAtomComponentFamilyState';
import { useSetAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useSetAtomComponentState';
import { useEffect } from 'react';

export const RecordIndexGalleryDataLoaderEffect = () => {
  const recordGalleryId = useAvailableComponentInstanceIdOrThrow(
    RecordGalleryComponentInstanceContext,
  );

  const { objectNameSingular } = useRecordGalleryContextOrThrow();

  const { records } = useRecordIndexTableQuery(objectNameSingular);

  const { upsertRecordsInStore } = useUpsertRecordsInStore();

  const setRecordIndexRecordIdsByGroup = useSetAtomComponentFamilyState(
    recordIndexRecordIdsByGroupComponentFamilyState,
    NO_RECORD_GROUP_FAMILY_KEY,
    recordGalleryId,
  );

  const selectedRecordIds = useAtomComponentSelectorValue(
    recordGallerySelectedRecordIdsComponentSelector,
    recordGalleryId,
  );

  const setContextStoreTargetedRecordsRule = useSetAtomComponentState(
    contextStoreTargetedRecordsRuleComponentState,
    recordGalleryId,
  );

  useEffect(() => {
    upsertRecordsInStore({ partialRecords: records });
    const recordIds = records.map((record) => record.id);
    setRecordIndexRecordIdsByGroup(recordIds);
  }, [records, setRecordIndexRecordIdsByGroup, upsertRecordsInStore]);

  useEffect(() => {
    setContextStoreTargetedRecordsRule({
      mode: 'selection',
      selectedRecordIds,
    });

    return () => {
      setContextStoreTargetedRecordsRule({
        mode: 'selection',
        selectedRecordIds: [],
      });
    };
  }, [selectedRecordIds, setContextStoreTargetedRecordsRule]);

  return <></>;
};
