import { ActivityRow } from '@/activities/components/ActivityRow';
import { AttachmentDropdown } from '@/activities/files/components/AttachmentDropdown';
import { AttachmentSourceLabel } from '@/activities/files/components/AttachmentSourceLabel';
import { useAttachmentItemActions } from '@/activities/files/hooks/useAttachmentItemActions';
import {
  FieldContext,
  type GenericFieldContextType,
} from '@/object-record/record-field/ui/contexts/FieldContext';
import { SettingsTextInput } from '@/ui/input/components/SettingsTextInput';
import { styled } from '@linaria/react';
import { useContext } from 'react';
import { getSafeUrl } from 'twenty-shared/utils';

import { type AttachmentWithFile } from '@/activities/files/utils/filterAttachmentsWithFile';
import { FileIcon } from '@/file/components/FileIcon';
import { IconCalendar } from 'twenty-ui/icon';
import { OverflowingTextWithTooltip } from 'twenty-ui/surfaces';
import { ThemeContext, themeCssVariables } from 'twenty-ui/theme-constants';
import { formatToHumanReadableDate } from '~/utils/date-utils';

const StyledLeftContent = styled.div`
  align-items: center;
  display: flex;
  flex: 1;

  gap: ${themeCssVariables.spacing[3]};
  overflow: auto;
  width: 100%;
`;

const StyledRightContent = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing['0.5']};
`;

const StyledCalendarIconContainer = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.light};
  display: flex;
`;

const StyledLink = styled.a`
  align-items: center;
  appearance: none;
  background: none;
  border: none;
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: flex;
  font-family: inherit;
  font-size: inherit;
  padding: 0;
  text-align: left;
  text-decoration: none;
  width: 100%;

  :hover {
    color: ${themeCssVariables.font.color.secondary};
  }
`;

const StyledLinkContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing['0.5']};
  min-width: 0;
  overflow: auto;
  width: 100%;
`;

type AttachmentRowProps = {
  attachment: AttachmentWithFile;
  onPreview?: (attachment: AttachmentWithFile) => void;
};

export const AttachmentRow = ({
  attachment,
  onPreview,
}: AttachmentRowProps) => {
  const { theme } = useContext(ThemeContext);

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

  return (
    <FieldContext.Provider
      value={
        {
          recordId: attachment.id,
        } as GenericFieldContextType
      }
    >
      <ActivityRow disabled autoHeight>
        <StyledLeftContent>
          <FileIcon fileCategory={fileCategory} thumbnailUrl={fileUrl} />
          {isEditing ? (
            <SettingsTextInput
              instanceId={`attachment-${attachment.id}-name`}
              value={attachmentFileName}
              onChange={handleOnChange}
              onBlur={handleOnBlur}
              autoFocus
              onKeyDown={handleOnKeyDown}
            />
          ) : (
            <StyledLinkContainer>
              <StyledLink
                onClick={handleOpenDocument}
                href={getSafeUrl(fileUrl)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <OverflowingTextWithTooltip text={fullFileName} />
              </StyledLink>
              <AttachmentSourceLabel attachment={attachment} />
            </StyledLinkContainer>
          )}
        </StyledLeftContent>
        <StyledRightContent>
          <StyledCalendarIconContainer>
            <IconCalendar size={theme.icon.size.md} />
          </StyledCalendarIconContainer>
          {formatToHumanReadableDate(attachment.createdAt)}
          <AttachmentDropdown
            attachmentId={attachment.id}
            onDelete={handleDelete}
            onDownload={handleDownload}
            onRename={handleRename}
            hasDownloadPermission={hasDownloadPermission}
          />
        </StyledRightContent>
      </ActivityRow>
    </FieldContext.Provider>
  );
};
