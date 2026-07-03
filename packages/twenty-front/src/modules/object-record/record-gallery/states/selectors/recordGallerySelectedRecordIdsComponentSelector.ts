import { isRecordGalleryCardSelectedComponentFamilyState } from '@/object-record/record-gallery/record-gallery-card/states/isRecordGalleryCardSelectedComponentFamilyState';
import { recordIndexAllRecordIdsComponentSelector } from '@/object-record/record-index/states/selectors/recordIndexAllRecordIdsComponentSelector';
import { createAtomComponentSelector } from '@/ui/utilities/state/jotai/utils/createAtomComponentSelector';
import { RecordGalleryComponentInstanceContext } from '@/object-record/record-gallery/states/contexts/RecordGalleryComponentInstanceContext';

export const recordGallerySelectedRecordIdsComponentSelector =
  createAtomComponentSelector<string[]>({
    key: 'recordGallerySelectedRecordIdsSelector',
    componentInstanceContext: RecordGalleryComponentInstanceContext,
    get:
      ({ instanceId }) =>
      ({ get }) => {
        const allRecordIds = get(recordIndexAllRecordIdsComponentSelector, {
          instanceId,
        });

        return allRecordIds.filter(
          (recordId: string) =>
            get(isRecordGalleryCardSelectedComponentFamilyState, {
              instanceId,
              familyKey: recordId,
            }) === true,
        );
      },
  });
