import { RecordGalleryCardComponentInstanceContext } from '@/object-record/record-gallery/record-gallery-card/states/contexts/RecordGalleryCardComponentInstanceContext';
import { createAtomComponentState } from '@/ui/utilities/state/jotai/utils/createAtomComponentState';

export const recordGalleryCardEditModePositionComponentState =
  createAtomComponentState<number | null>({
    key: 'recordGalleryCardEditModePositionComponentState',
    defaultValue: null,
    componentInstanceContext: RecordGalleryCardComponentInstanceContext,
  });
