import { useDepositStatusPolicy } from '@/deposit/hooks/useDepositStatusPolicy';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { recordStoreFamilySelector } from '@/object-record/record-store/states/selectors/recordStoreFamilySelector';
import { useGetIsMetadataItemFromStandardApplication } from '@/object-metadata/hooks/useGetIsMetadataItemFromStandardApplication';
import { useObjectMetadataItemById } from '@/object-metadata/hooks/useObjectMetadataItemById';
import { formatFieldMetadataItemAsFieldDefinition } from '@/object-metadata/utils/formatFieldMetadataItemAsFieldDefinition';
import { getObjectPermissionsForObject } from '@/object-metadata/utils/getObjectPermissionsForObject';
import { useObjectPermissions } from '@/object-record/hooks/useObjectPermissions';
import { useIsRecordReadOnly } from '@/object-record/read-only/hooks/useIsRecordReadOnly';
import { isRecordFieldReadOnly } from '@/object-record/read-only/utils/isRecordFieldReadOnly';

export type UseFieldIsReadOnlyParams = {
  fieldMetadataId: string;
  objectMetadataId: string;
  recordId: string;
};

export const useIsRecordFieldReadOnly = ({
  fieldMetadataId,
  objectMetadataId,
  recordId,
}: UseFieldIsReadOnlyParams) => {
  const { objectMetadataItem } = useObjectMetadataItemById({
    objectId: objectMetadataId,
  });

  const fieldMetadataItem = objectMetadataItem.fields.find(
    (field) => field.id === fieldMetadataId,
  );

  const currentValue = useAtomFamilySelectorValue(recordStoreFamilySelector, {
    recordId,
    fieldName: fieldMetadataItem?.name ?? '',
  });
  const depositPolicy = useDepositStatusPolicy({
    objectNameSingular: objectMetadataItem.nameSingular,
    fieldName: fieldMetadataItem?.name,
    value: currentValue,
  });

  const { objectPermissionsByObjectMetadataId } = useObjectPermissions();
  const getIsMetadataItemFromStandardApplication =
    useGetIsMetadataItemFromStandardApplication();

  const objectPermissions = getObjectPermissionsForObject(
    objectPermissionsByObjectMetadataId,
    objectMetadataId,
  );

  const isRecordReadOnly = useIsRecordReadOnly({
    recordId,
    objectMetadataId,
  });

  if (!fieldMetadataItem) {
    return false;
  }

  const fieldDefinition = formatFieldMetadataItemAsFieldDefinition({
    field: fieldMetadataItem,
    objectMetadataItem,
  });

  const isMessageListEditableField =
    objectMetadataItem.nameSingular === 'messageList' &&
    ['name', 'avatarEmoji', 'avatarColor'].includes(fieldMetadataItem.name);

  return (
    depositPolicy.isReadOnly ||
    isRecordFieldReadOnly({
      isRecordReadOnly,
      isSystemObject:
        objectMetadataItem.isSystem && !isMessageListEditableField,
      isFieldFromStandardApplication:
        getIsMetadataItemFromStandardApplication(fieldMetadataItem),
      objectPermissions,
      fieldMetadataItem,
      fieldDefinition,
      objectPermissionsByObjectMetadataId,
    })
  );
};
