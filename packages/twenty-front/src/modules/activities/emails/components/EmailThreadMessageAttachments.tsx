import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { lazy, Suspense, useState } from 'react';
import { createPortal } from 'react-dom';

import { ActivityList } from '@/activities/components/ActivityList';
import { AttachmentRow } from '@/activities/files/components/AttachmentRow';
import { ExternalLinkAttachmentRow } from '@/activities/files/components/ExternalLinkAttachmentRow';
import { type Attachment } from '@/activities/files/types/Attachment';
import {
  type AttachmentWithFile,
  filterAttachmentsWithFile,
} from '@/activities/files/utils/filterAttachmentsWithFile';
import { filterExternalLinkAttachments } from '@/activities/files/utils/filterExternalLinkAttachments';
import { downloadFile } from '@/activities/files/utils/downloadFile';
import { getAttachmentUrl } from '@/activities/utils/getAttachmentUrl';
import { isAttachmentPreviewEnabledState } from '@/client-config/states/isAttachmentPreviewEnabledState';
import { ModalStatefulWrapper } from '@/ui/layout/modal/components/ModalStatefulWrapper';
import { useModal } from '@/ui/layout/modal/hooks/useModal';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { ScrollWrapper } from '@/ui/utilities/scroll/components/ScrollWrapper';
import { isDefined } from 'twenty-shared/utils';
import { AnimatedEaseInOut } from 'twenty-ui/layout';
import { IconDownload, IconX } from 'twenty-ui/icon';
import { IconButton } from 'twenty-ui/input';
import { ModalContent, ModalHeader } from 'twenty-ui/surfaces';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { useHasPermissionFlag } from '@/settings/roles/hooks/useHasPermissionFlag';
import { PermissionFlagType } from '~/generated-metadata/graphql';
import { PREVIEW_MODAL_ID } from '@/activities/files/components/AttachmentList';

const DocumentViewer = lazy(() =>
  import('@/activities/files/components/DocumentViewer').then((module) => ({
    default: module.DocumentViewer,
  })),
);

const StyledAttachmentsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  margin-top: ${themeCssVariables.spacing[4]};
`;

const StyledAttachmentsLabel = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledLoadingContainer = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.primary};
  display: flex;
  height: 80vh;
  justify-content: center;
  width: 100%;
`;

const StyledLoadingText = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledHeader = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  min-height: 40px;
  width: 100%;
`;

const StyledModalTitle = styled.span`
  color: ${themeCssVariables.font.color.primary};
`;

const StyledButtonContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: ${themeCssVariables.spacing[1]};
`;

type EmailThreadMessageAttachmentsProps = {
  attachments: Attachment[];
  isDisplayed: boolean;
};

export const EmailThreadMessageAttachments = ({
  attachments,
  isDisplayed,
}: EmailThreadMessageAttachmentsProps) => {
  const [previewedAttachment, setPreviewedAttachment] =
    useState<AttachmentWithFile | null>(null);

  const isAttachmentPreviewEnabled = useAtomStateValue(
    isAttachmentPreviewEnabledState,
  );

  const hasDownloadPermission = useHasPermissionFlag(
    PermissionFlagType.DOWNLOAD_FILE,
  );

  const { openModal, closeModal } = useModal();

  const attachmentsWithFile = filterAttachmentsWithFile(attachments);
  const externalLinkAttachments = filterExternalLinkAttachments(attachments);
  const totalAttachmentCount =
    attachmentsWithFile.length + externalLinkAttachments.length;

  if (totalAttachmentCount === 0) {
    return null;
  }

  const handlePreview = (attachment: AttachmentWithFile) => {
    if (!isAttachmentPreviewEnabled) return;
    setPreviewedAttachment(attachment);
    openModal(PREVIEW_MODAL_ID);
  };

  const handleClosePreview = () => {
    closeModal(PREVIEW_MODAL_ID);
    setPreviewedAttachment(null);
  };

  const handleDownload = () => {
    if (!isDefined(previewedAttachment)) return;
    const attachmentUrl = getAttachmentUrl({ attachment: previewedAttachment });
    downloadFile(attachmentUrl, previewedAttachment.name);
  };

  return (
    <>
      <AnimatedEaseInOut isOpen={isDisplayed} duration="fast">
        <StyledAttachmentsContainer>
          <StyledAttachmentsLabel>
            {t`Attachments`} ({totalAttachmentCount})
          </StyledAttachmentsLabel>
          <ActivityList>
            {attachmentsWithFile.map((attachment) => (
              <AttachmentRow
                key={attachment.id}
                attachment={attachment}
                onPreview={
                  isAttachmentPreviewEnabled ? handlePreview : undefined
                }
              />
            ))}
            {externalLinkAttachments.map((attachment) => (
              <ExternalLinkAttachmentRow
                key={attachment.id}
                attachment={attachment}
              />
            ))}
          </ActivityList>
        </StyledAttachmentsContainer>
      </AnimatedEaseInOut>
      {previewedAttachment &&
        isAttachmentPreviewEnabled &&
        createPortal(
          <ModalStatefulWrapper
            modalInstanceId={PREVIEW_MODAL_ID}
            size="large"
            isClosable
            onClose={handleClosePreview}
            renderInDocumentBody
            gap={2}
            padding="small"
          >
            <ModalHeader noPadding autoHeight>
              <StyledHeader>
                <StyledModalTitle>{previewedAttachment.name}</StyledModalTitle>
                <StyledButtonContainer>
                  {hasDownloadPermission && (
                    <IconButton
                      Icon={IconDownload}
                      onClick={handleDownload}
                      size="small"
                    />
                  )}
                  <IconButton
                    Icon={IconX}
                    onClick={handleClosePreview}
                    size="small"
                  />
                </StyledButtonContainer>
              </StyledHeader>
            </ModalHeader>
            <ScrollWrapper
              componentInstanceId={`preview-modal-${previewedAttachment.id}`}
            >
              <ModalContent noPadding>
                <Suspense
                  fallback={
                    <StyledLoadingContainer>
                      <StyledLoadingText>
                        {t`Loading document viewer...`}
                      </StyledLoadingText>
                    </StyledLoadingContainer>
                  }
                >
                  <DocumentViewer
                    documentName={previewedAttachment.name}
                    documentUrl={getAttachmentUrl({
                      attachment: previewedAttachment,
                    })}
                  />
                </Suspense>
              </ModalContent>
            </ScrollWrapper>
          </ModalStatefulWrapper>,
          document.body,
        )}
    </>
  );
};
