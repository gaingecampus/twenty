import { CampaignBodyDisplay } from '@/activities/emails/components/CampaignBodyDisplay';
import { getObjectPermissionsForObject } from '@/object-metadata/utils/getObjectPermissionsForObject';
import { useObjectPermissions } from '@/object-record/hooks/useObjectPermissions';
import { recordStoreFamilySelector } from '@/object-record/record-store/states/selectors/recordStoreFamilySelector';
import { checkFieldPermissions } from '@/page-layout/utils/checkFieldPermissions';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { H3Title } from 'twenty-ui/typography';

const StyledSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding-block: ${themeCssVariables.spacing[4]};
`;

type CampaignBodySectionProps = {
  recordId: string;
  objectMetadataId: string;
  fieldMetadataId: string;
};

export const CampaignBodySection = ({
  recordId,
  objectMetadataId,
  fieldMetadataId,
}: CampaignBodySectionProps) => {
  const { objectPermissionsByObjectMetadataId } = useObjectPermissions();
  const permissions = getObjectPermissionsForObject(
    objectPermissionsByObjectMetadataId,
    objectMetadataId,
  );
  const value = useAtomFamilySelectorValue(recordStoreFamilySelector, {
    recordId,
    fieldName: 'bodyTemplate',
  });

  if (
    !permissions.canReadObjectRecords ||
    !checkFieldPermissions([fieldMetadataId], permissions)
  ) {
    return null;
  }

  return (
    <StyledSection aria-label="본문 미리보기">
      <H3Title title="본문" />
      {value === undefined ? (
        <span role="status">본문을 불러오는 중…</span>
      ) : (
        <CampaignBodyDisplay value={value} />
      )}
    </StyledSection>
  );
};
