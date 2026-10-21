import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useContext, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { type EmailAttachment } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { IconUpload } from 'twenty-ui/icon';
import { ThemeContext, themeCssVariables } from 'twenty-ui/theme-constants';

import { useUploadEmailAttachment } from '@/activities/emails/hooks/useUploadEmailAttachment';
import { AttachmentChip } from '@/file/components/AttachmentChip';
import { InputLabel } from '@/ui/input/components/InputLabel';

type EmailAttachmentsFieldProps = {
  files: EmailAttachment[];
  onChange: (files: EmailAttachment[]) => void;
  label?: string;
  onUploadingChange?: (uploading: boolean) => void;
};

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const StyledUploadArea = styled.div`
  background-color: ${themeCssVariables.background.transparent.lighter};
  border-radius: ${themeCssVariables.border.radius.sm};
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: center;
  min-height: var(--t-input-height, 32px);
  padding-bottom: ${themeCssVariables.spacing[3]};
  padding-left: ${themeCssVariables.spacing[2]};
  padding-right: ${themeCssVariables.spacing[2]};
  padding-top: ${themeCssVariables.spacing[3]};

  &:hover,
  &:focus-visible,
  &[data-drag-active='true'] {
    background-color: ${themeCssVariables.background.transparent.light};
    outline: 2px solid ${themeCssVariables.border.color.strong};
  }
`;

const StyledChipsContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledUploadAreaLabel = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: ${themeCssVariables.spacing[1]};
  justify-content: center;
`;

export const EmailAttachmentsField = ({
  files,
  label,
  onChange,
  onUploadingChange,
}: EmailAttachmentsFieldProps) => {
  const { theme } = useContext(ThemeContext);
  const { uploadEmailAttachment } = useUploadEmailAttachment();
  const [isUploading, setIsUploading] = useState(false);
  const { t } = useLingui();

  const handleUploadFiles = async (filesToUpload: File[]) => {
    if (isUploading || filesToUpload.length === 0) {
      return;
    }

    setIsUploading(true);
    onUploadingChange?.(true);

    try {
      const uploadedFiles = await Promise.all(
        filesToUpload.map((file) => uploadEmailAttachment(file)),
      );
      const successfulUploads = uploadedFiles.filter(isDefined);

      if (successfulUploads.length > 0) {
        onChange([...files, ...successfulUploads]);
      }
    } finally {
      setIsUploading(false);
      onUploadingChange?.(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: true,
    disabled: isUploading,
    onDropAccepted: handleUploadFiles,
  });

  const handleRemoveFile = (fileId: string) => {
    onChange(files.filter((file) => file.id !== fileId));
  };

  return (
    <StyledContainer>
      {label ? <InputLabel>{label}</InputLabel> : null}

      <StyledUploadArea
        // oxlint-disable-next-line react/jsx-props-no-spreading
        {...getRootProps({ role: 'button', 'aria-label': t`Upload files` })}
        aria-busy={isUploading}
        aria-disabled={isUploading}
        data-drag-active={isDragActive}
      >
        <input
          // oxlint-disable-next-line react/jsx-props-no-spreading
          {...getInputProps()}
        />
        {files.length > 0 && (
          <StyledChipsContainer>
            {files.map((file) => (
              <AttachmentChip
                key={file.id}
                file={file}
                readonly={isUploading}
                onRemove={() => handleRemoveFile(file.id)}
              />
            ))}
          </StyledChipsContainer>
        )}
        <StyledUploadAreaLabel role="status">
          <IconUpload size={theme.icon.size.sm} />
          <span>{isUploading ? t`Uploading...` : t`Upload files`}</span>
        </StyledUploadAreaLabel>
      </StyledUploadArea>
    </StyledContainer>
  );
};
