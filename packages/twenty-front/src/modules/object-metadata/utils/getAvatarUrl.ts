import { type Company } from '@/companies/types/Company';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { getCompanyDomainName } from '@/object-metadata/utils/getCompanyDomainName';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { getLogoUrlFromDomainName, isDefined } from 'twenty-shared/utils';
import { getImageIdentifierFieldValue } from './getImageIdentifierFieldValue';

export const getAvatarUrl = (
  objectNameSingular: string,
  record: ObjectRecord,
  imageIdentifierFieldMetadataItem: FieldMetadataItem | undefined,
  allowRequestsToTwentyIcons?: boolean | undefined,
  fields: FieldMetadataItem[] = [],
  workspaceMembers: { id: string; avatarUrl?: string | null }[] = [],
) => {
  if (objectNameSingular === 'member' || objectNameSingular === 'teamMember') {
    const linkedMemberField = fields.find(
      (field) =>
        field.relation?.targetObjectMetadata.nameSingular ===
        CoreObjectNameSingular.WorkspaceMember,
    );
    const linkedMember = linkedMemberField
      ? record[linkedMemberField.name]
      : undefined;
    const linkedMemberId =
      record.workspaceMemberAccountId ??
      (linkedMemberField ? record[`${linkedMemberField.name}Id`] : undefined) ??
      linkedMember?.id;
    const workspaceMember = workspaceMembers.find(
      (member) => member.id === linkedMemberId,
    );
    return workspaceMember?.avatarUrl ?? linkedMember?.avatarUrl ?? '';
  }

  if (objectNameSingular === CoreObjectNameSingular.WorkspaceMember) {
    return record.avatarUrl ?? undefined;
  }

  if (
    objectNameSingular === CoreObjectNameSingular.Company &&
    allowRequestsToTwentyIcons === true
  ) {
    return getLogoUrlFromDomainName(
      getCompanyDomainName(record as Company) ?? '',
    );
  }

  if (objectNameSingular === CoreObjectNameSingular.Person) {
    return record.avatarFile?.[0]?.url ?? '';
  }

  const imageIdentifierFieldValue = getImageIdentifierFieldValue(
    record,
    imageIdentifierFieldMetadataItem,
  );

  if (isDefined(imageIdentifierFieldValue)) {
    return imageIdentifierFieldValue;
  }

  return '';
};
