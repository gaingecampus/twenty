import { SOFT_DELETE_FILTER_FIELD_NAME } from '@/object-record/record-filter/constants/SoftDeleteFilterFieldName';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { getObjectPermissionsForObject } from '@/object-metadata/utils/getObjectPermissionsForObject';
import { type ObjectPermissions } from 'twenty-shared/types';

export const canAccessObjectTrash = (
  objectPermissions: ObjectPermissions,
): boolean =>
  objectPermissions.canSoftDeleteObjectRecords === true ||
  objectPermissions.canDestroyObjectRecords === true;

export const getTrashAccessibleObjectMetadataItems = ({
  objectMetadataItems,
  objectPermissionsByObjectMetadataId,
}: {
  objectMetadataItems: EnrichedObjectMetadataItem[];
  objectPermissionsByObjectMetadataId: Record<
    string,
    ObjectPermissions & { objectMetadataId: string }
  >;
}): EnrichedObjectMetadataItem[] => {
  return objectMetadataItems.filter((objectMetadataItem) => {
    if (
      objectMetadataItem.isActive !== true ||
      objectMetadataItem.isSystem === true ||
      objectMetadataItem.isRemote === true
    ) {
      return false;
    }

    const hasDeletedAtField = objectMetadataItem.fields.some(
      (fieldMetadataItem) =>
        fieldMetadataItem.name === SOFT_DELETE_FILTER_FIELD_NAME,
    );

    if (hasDeletedAtField !== true) {
      return false;
    }

    const objectPermissions = getObjectPermissionsForObject(
      objectPermissionsByObjectMetadataId,
      objectMetadataItem.id,
    );

    return canAccessObjectTrash(objectPermissions);
  });
};
