import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { getObjectPermissionsForObject } from '@/object-metadata/utils/getObjectPermissionsForObject';
import { type ObjectPermissions } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

export const getStatusBoardObject = ({
  objectMetadataItems,
  objectPermissionsByObjectMetadataId,
  nameSingular,
}: {
  objectMetadataItems: EnrichedObjectMetadataItem[];
  objectPermissionsByObjectMetadataId: Record<
    string,
    ObjectPermissions & { objectMetadataId: string }
  >;
  nameSingular: string;
}): EnrichedObjectMetadataItem | undefined => {
  const objectMetadataItem = objectMetadataItems.find(
    (item) => item.nameSingular === nameSingular && item.isActive === true,
  );

  if (!isDefined(objectMetadataItem)) {
    return undefined;
  }

  const objectPermissions = getObjectPermissionsForObject(
    objectPermissionsByObjectMetadataId,
    objectMetadataItem.id,
  );

  if (objectPermissions.canReadObjectRecords !== true) {
    return undefined;
  }

  return objectMetadataItem;
};
