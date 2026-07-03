import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { RecordComponentInstanceContextsWrapper } from '@/object-record/components/RecordComponentInstanceContextsWrapper';
import { useObjectPermissionsForObject } from '@/object-record/hooks/useObjectPermissionsForObject';
import { RecordGallery } from '@/object-record/record-gallery/components/RecordGallery';
import { RecordGallerySSESubscribeEffect } from '@/object-record/record-gallery/components/RecordGallerySSESubscribeEffect';
import { RecordIndexGalleryDataLoaderEffect } from '@/object-record/record-gallery/components/RecordIndexGalleryDataLoaderEffect';
import { RecordGalleryContextProvider } from '@/object-record/record-gallery/contexts/RecordGalleryContext';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';

type RecordIndexGalleryContainerProps = {
  recordGalleryInstanceId: string;
  viewBarInstanceId: string;
};

export const RecordIndexGalleryContainer = ({
  viewBarInstanceId,
  recordGalleryInstanceId,
}: RecordIndexGalleryContainerProps) => {
  const { objectNameSingular } = useRecordIndexContextOrThrow();

  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular,
  });

  const objectPermissions = useObjectPermissionsForObject(
    objectMetadataItem.id,
  );

  return (
    <RecordComponentInstanceContextsWrapper
      componentInstanceId={recordGalleryInstanceId}
    >
      <RecordGalleryContextProvider
        value={{
          viewBarInstanceId,
          objectNameSingular,
          visibleRecordFields: [],
          objectMetadataItem,
          objectPermissions,
        }}
      >
        <RecordGallery />
        <RecordGallerySSESubscribeEffect />
        <RecordIndexGalleryDataLoaderEffect />
      </RecordGalleryContextProvider>
    </RecordComponentInstanceContextsWrapper>
  );
};
