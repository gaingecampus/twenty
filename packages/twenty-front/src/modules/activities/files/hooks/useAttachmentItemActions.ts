import { downloadFile } from '@/activities/files/utils/downloadFile';
import { type AttachmentWithFile } from '@/activities/files/utils/filterAttachmentsWithFile';
import { useDestroyOneRecord } from '@/object-record/hooks/useDestroyOneRecord';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { getFileCategoryFromExtension } from '@/object-record/record-field/ui/utils/getFileCategoryFromExtension';
import { useHasPermissionFlag } from '@/settings/roles/hooks/useHasPermissionFlag';
import { useState } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { isNavigationModifierPressed } from 'twenty-ui/utilities';
import { PermissionFlagType } from '~/generated-metadata/graphql';
import { getFileNameAndExtension } from '~/utils/file/getFileNameAndExtension';

type UseAttachmentItemActionsParams = {
  attachment: AttachmentWithFile;
  onPreview?: (attachment: AttachmentWithFile) => void;
};

export const useAttachmentItemActions = ({
  attachment,
  onPreview,
}: UseAttachmentItemActionsParams) => {
  const [isEditing, setIsEditing] = useState(false);

  const hasDownloadPermission = useHasPermissionFlag(
    PermissionFlagType.DOWNLOAD_FILE,
  );

  const { name: originalFileName, extension: attachmentFileExtension } =
    getFileNameAndExtension(attachment.file.label);

  const [attachmentFileName, setAttachmentFileName] =
    useState(originalFileName);

  const fileCategory = getFileCategoryFromExtension(attachment.file.extension);
  const fileUrl = attachment.file.url;
  const fullFileName = `${attachmentFileName}${attachmentFileExtension}`;

  const { destroyOneRecord: destroyOneAttachment } = useDestroyOneRecord({
    objectNameSingular: CoreObjectNameSingular.Attachment,
  });

  const { updateOneRecord } = useUpdateOneRecord();

  const handleDelete = () => {
    destroyOneAttachment(attachment.id);
  };

  const handleRename = () => {
    setIsEditing(true);
  };

  const saveAttachmentName = () => {
    setIsEditing(false);

    const newFileName = `${attachmentFileName}${attachmentFileExtension}`;

    updateOneRecord({
      objectNameSingular: CoreObjectNameSingular.Attachment,
      idToUpdate: attachment.id,
      updateOneRecordInput: {
        name: newFileName,
        file: [
          {
            fileId: attachment.file.fileId,
            label: newFileName,
          },
        ],
      },
    });
  };

  const handleOnBlur = () => {
    saveAttachmentName();
  };

  const handleOnChange = (newFileName: string) => {
    setAttachmentFileName(newFileName);
  };

  const handleOnKeyDown = (event: React.KeyboardEvent) => {
    if (event.nativeEvent.isComposing || event.keyCode === 229) {
      return;
    }
    if (event.key === 'Enter') {
      saveAttachmentName();
    }
  };

  const handleDownload = () => {
    downloadFile(fileUrl, fullFileName);
  };

  const handleOpenDocument = (event: React.MouseEvent) => {
    if (isNavigationModifierPressed(event) === true) {
      return;
    }

    if (isDefined(onPreview)) {
      event.preventDefault();
      onPreview(attachment);
    }
  };

  return {
    attachmentFileExtension,
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
  };
};
