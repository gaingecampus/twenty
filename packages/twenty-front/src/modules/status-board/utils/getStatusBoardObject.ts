import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { getObjectPermissionsForObject } from '@/object-metadata/utils/getObjectPermissionsForObject';
import { type ObjectPermissions } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

export const getStatusBoardObject = ({
  objectMetadataItems,
  objectPermissionsByObjectMetadataId,
  nameSingular,
  fallbackNames = [],
}: {
  objectMetadataItems: EnrichedObjectMetadataItem[];
  objectPermissionsByObjectMetadataId: Record<
    string,
    ObjectPermissions & { objectMetadataId: string }
  >;
  nameSingular: string;
  fallbackNames?: string[];
}): EnrichedObjectMetadataItem | undefined => {
  const objectMetadataItem = [nameSingular, ...fallbackNames]
    .map((candidateName) =>
      objectMetadataItems.find(
        (item) => item.nameSingular === candidateName && item.isActive === true,
      ),
    )
    .find(isDefined);

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
