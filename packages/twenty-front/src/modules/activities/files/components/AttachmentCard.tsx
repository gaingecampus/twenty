import { AttachmentDropdown } from '@/activities/files/components/AttachmentDropdown';
import { AttachmentSourceLabel } from '@/activities/files/components/AttachmentSourceLabel';
import { useAttachmentItemActions } from '@/activities/files/hooks/useAttachmentItemActions';
import { type AttachmentWithFile } from '@/activities/files/utils/filterAttachmentsWithFile';
import { FileIcon } from '@/file/components/FileIcon';
import {
  FieldContext,
  type GenericFieldContextType,
} from '@/object-record/record-field/ui/contexts/FieldContext';
import { SettingsTextInput } from '@/ui/input/components/SettingsTextInput';
import { styled } from '@linaria/react';
import { isNonEmptyString } from '@sniptt/guards';
import { useState } from 'react';
import { FILE_CATEGORIES } from 'twenty-shared/types';
import { getSafeUrl } from 'twenty-shared/utils';
import { OverflowingTextWithTooltip } from 'twenty-ui/surfaces';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { formatToHumanReadableDate } from '~/utils/date-utils';

const PREVIEW_AREA_HEIGHT_PX = 120;

const StyledCard = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  width: 100%;
`;

const StyledPreviewArea = styled.a`
  align-items: center;
  background: ${themeCssVariables.background.tertiary};
  cursor: pointer;
  display: flex;
  height: ${PREVIEW_AREA_HEIGHT_PX}px;
  justify-content: center;
  overflow: hidden;
  text-decoration: none;
  width: 100%;
`;

const StyledPreviewImage = styled.img`
  height: 100%;
  object-fit: cover;
  width: 100%;
`;

const StyledCardFooter = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing['0.5']};
  padding: ${themeCssVariables.spacing[2]};
`;

const StyledFileNameRow = styled.div`
  align-items: flex-start;
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
  justify-content: space-between;
  min-width: 0;
  width: 100%;
`;

const StyledFileNameLink = styled.a`
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  flex: 1;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  min-width: 0;
  text-decoration: none;

  :hover {
    color: ${themeCssVariables.font.color.secondary};
  }
`;

const StyledSourceLabelContainer = styled.div`
  min-width: 0;
  overflow: hidden;
  width: 100%;
`;

const StyledMetaRow = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  font-size: ${themeCssVariables.font.size.xs};
  gap: ${themeCssVariables.spacing[1]};
  justify-content: space-between;
  min-width: 0;
  width: 100%;
`;

type AttachmentCardProps = {
  attachment: AttachmentWithFile;
  onPreview?: (attachment: AttachmentWithFile) => void;
};

export const AttachmentCard = ({
  attachment,
  onPreview,
}: AttachmentCardProps) => {
  const [failedThumbnailUrl, setFailedThumbnailUrl] = useState<string>();

  const {
    attachmentFileName,
    fileCategory,
    fileUrl,
    fullFileName,
    handleDelete,
    handleDownload,
    handleOnBlur,
    handleOnChange,
    handleOnKeyDown,
    handleOpenDocument,
    handleRename,
    hasDownloadPermission,
    isEditing,
  } = useAttachmentItemActions({ attachment, onPreview });

  const shouldRenderImagePreview =
    fileCategory === FILE_CATEGORIES.IMAGE &&
    isNonEmptyString(fileUrl) &&
    failedThumbnailUrl !== fileUrl;

  return (
    <FieldContext.Provider
      value={
        {
          recordId: attachment.id,
        } as GenericFieldContextType
      }
    >
      <StyledCard>
        <StyledPreviewArea
          href={getSafeUrl(fileUrl)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleOpenDocument}
        >
          {shouldRenderImagePreview ? (
            <StyledPreviewImage
              alt=""
              src={fileUrl}
              onError={() => setFailedThumbnailUrl(fileUrl)}
            />
          ) : (
            <FileIcon
              fileCategory={fileCategory}
              size="large"
              thumbnailUrl={fileUrl}
            />
          )}
        </StyledPreviewArea>
        <StyledCardFooter>
          {isEditing ? (
            <SettingsTextInput
              instanceId={`attachment-card-${attachment.id}-name`}
              value={attachmentFileName}
              onChange={handleOnChange}
              onBlur={handleOnBlur}
              autoFocus
              onKeyDown={handleOnKeyDown}
            />
          ) : (
            <>
              <StyledFileNameRow>
                <StyledFileNameLink
                  href={getSafeUrl(fileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleOpenDocument}
                >
                  <OverflowingTextWithTooltip text={fullFileName} />
                </StyledFileNameLink>
                <AttachmentDropdown
                  attachmentId={attachment.id}
                  onDelete={handleDelete}
                  onDownload={handleDownload}
                  onRename={handleRename}
                  hasDownloadPermission={hasDownloadPermission}
                />
              </StyledFileNameRow>
              <StyledSourceLabelContainer>
                <AttachmentSourceLabel attachment={attachment} />
              </StyledSourceLabelContainer>
              <StyledMetaRow>
                <span>{formatToHumanReadableDate(attachment.createdAt)}</span>
              </StyledMetaRow>
            </>
          )}
        </StyledCardFooter>
      </StyledCard>
    </FieldContext.Provider>
  );
};
