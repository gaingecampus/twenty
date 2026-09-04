import { useFilteredObjectMetadataItems } from '@/object-metadata/hooks/useFilteredObjectMetadataItems';
import { useObjectPermissions } from '@/object-record/hooks/useObjectPermissions';
import { getTrashAccessibleObjectMetadataItems } from '@/trash/utils/getTrashAccessibleObjectMetadataItems';
import { useMemo } from 'react';

export const useTrashAccessibleObjectMetadataItems = () => {
  const { objectMetadataItems } = useFilteredObjectMetadataItems();
  const { objectPermissionsByObjectMetadataId } = useObjectPermissions();

  const trashAccessibleObjectMetadataItems = useMemo(
    () =>
      getTrashAccessibleObjectMetadataItems({
        objectMetadataItems,
        objectPermissionsByObjectMetadataId,
      }),
    [objectMetadataItems, objectPermissionsByObjectMetadataId],
  );

  return {
    trashAccessibleObjectMetadataItems,
    hasTrashAccess: trashAccessibleObjectMetadataItems.length > 0,
    areObjectMetadataItemsLoaded: objectMetadataItems.length > 0,
  };
};
