import { AttachmentCard } from '@/activities/files/components/AttachmentCard';
import { ExternalLinkAttachmentCard } from '@/activities/files/components/ExternalLinkAttachmentCard';
import { type Attachment } from '@/activities/files/types/Attachment';
import {
  type AttachmentWithFile,
  filterAttachmentsWithFile,
} from '@/activities/files/utils/filterAttachmentsWithFile';
import { filterExternalLinkAttachments } from '@/activities/files/utils/filterExternalLinkAttachments';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledGridContainer = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  width: 100%;
`;

type AttachmentGridProps = {
  attachments: Attachment[];
  onPreview?: (attachment: AttachmentWithFile) => void;
};

export const AttachmentGrid = ({
  attachments,
  onPreview,
}: AttachmentGridProps) => {
  const attachmentsWithFile = filterAttachmentsWithFile(attachments);
  const externalLinkAttachments = filterExternalLinkAttachments(attachments);

  return (
    <StyledGridContainer>
      {attachmentsWithFile.map((attachment) => (
        <AttachmentCard
          key={attachment.id}
          attachment={attachment}
          onPreview={onPreview}
        />
      ))}
      {externalLinkAttachments.map((attachment) => (
        <ExternalLinkAttachmentCard key={attachment.id} attachment={attachment} />
      ))}
    </StyledGridContainer>
  );
};
