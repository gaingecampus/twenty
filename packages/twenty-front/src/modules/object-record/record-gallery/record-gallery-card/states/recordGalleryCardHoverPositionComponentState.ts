import { RecordGalleryCardComponentInstanceContext } from '@/object-record/record-gallery/record-gallery-card/states/contexts/RecordGalleryCardComponentInstanceContext';
import { createAtomComponentState } from '@/ui/utilities/state/jotai/utils/createAtomComponentState';

export const recordGalleryCardHoverPositionComponentState =
  createAtomComponentState<number | null>({
    key: 'recordGalleryCardHoverPositionComponentState',
    defaultValue: null,
    componentInstanceContext: RecordGalleryCardComponentInstanceContext,
  });
