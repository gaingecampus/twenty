import { AttachmentChip } from '@/file/components/AttachmentChip';
import { parseCampaignAttachments } from '@/activities/emails/utils/campaignDisplay';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledFiles = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  min-width: 0;
`;

export const CampaignAttachmentsDisplay = ({ value }: { value: unknown }) => {
  const files = parseCampaignAttachments(value);
  return (
    <StyledFiles aria-label="첨부 파일">
      {files.length === 0
        ? '첨부 파일 없음'
        : files.map((file) => (
            <AttachmentChip
              key={file.id}
              file={file}
              readonly
              onRemove={() => {}}
            />
          ))}
    </StyledFiles>
  );
};
