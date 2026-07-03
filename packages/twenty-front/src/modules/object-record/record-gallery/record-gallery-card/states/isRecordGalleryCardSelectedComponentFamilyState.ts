import { createAtomComponentFamilyState } from '@/ui/utilities/state/jotai/utils/createAtomComponentFamilyState';
import { RecordGalleryComponentInstanceContext } from '@/object-record/record-gallery/states/contexts/RecordGalleryComponentInstanceContext';

export const isRecordGalleryCardSelectedComponentFamilyState =
  createAtomComponentFamilyState<boolean, string>({
    key: 'isRecordGalleryCardSelectedComponentFamilyState',
    defaultValue: false,
    componentInstanceContext: RecordGalleryComponentInstanceContext,
  });
