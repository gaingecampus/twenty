import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { getLabelIdentifierFieldMetadataItem } from '@/object-metadata/utils/getLabelIdentifierFieldMetadataItem';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { type ObjectRecordIdentifier } from '@/object-record/types/ObjectRecordIdentifier';

import { getAvatarType } from './getAvatarType';
import { getAvatarUrl } from './getAvatarUrl';
import { getLabelIdentifierFieldValue } from './getLabelIdentifierFieldValue';
import { getLinkToShowPage } from './getLinkToShowPage';

export const getObjectRecordIdentifier = ({
  objectMetadataItem,
  record,
  allowRequestsToTwentyIcons,
  workspaceMembers = [],
}: {
  objectMetadataItem: Pick<
    EnrichedObjectMetadataItem,
    | 'fields'
    | 'labelIdentifierFieldMetadataId'
    | 'nameSingular'
    | 'imageIdentifierFieldMetadataId'
  >;
  record: ObjectRecord;
  allowRequestsToTwentyIcons: boolean;
  workspaceMembers?: {
    id: string;
    avatarUrl?: string | null;
    name?: { firstName: string; lastName: string };
  }[];
}): ObjectRecordIdentifier => {
  const labelIdentifierFieldMetadataItem =
    getLabelIdentifierFieldMetadataItem(objectMetadataItem);

  const labelIdentifierFieldValue = getLabelIdentifierFieldValue(
    record,
    labelIdentifierFieldMetadataItem,
  );

  const imageIdentifierFieldMetadata = objectMetadataItem.fields.find(
    (field) => field.id === objectMetadataItem.imageIdentifierFieldMetadataId,
  );

  const avatarType = getAvatarType(objectMetadataItem.nameSingular);

  // TODO: This is a temporary solution before we seed imageIdentifierFieldMetadataId in the database
  const avatarUrl = getAvatarUrl(
    objectMetadataItem.nameSingular,
    record,
    imageIdentifierFieldMetadata,
    allowRequestsToTwentyIcons,
    objectMetadataItem.fields,
    workspaceMembers,
  );

  const linkToShowPage = getLinkToShowPage(
    objectMetadataItem.nameSingular,
    record,
  );

  const account = ['member', 'teamMember'].includes(
    objectMetadataItem.nameSingular,
  )
    ? workspaceMembers.find(
        (member) => member.id === record.workspaceMemberAccountId,
      )
    : undefined;
  const profileName = account?.name
    ? [account.name.firstName, account.name.lastName].filter(Boolean).join(' ')
    : '';
  return {
    id: record.id,
    name: profileName || `${labelIdentifierFieldValue}`,
    avatarUrl,
    avatarType,
    linkToShowPage,
  };
};
