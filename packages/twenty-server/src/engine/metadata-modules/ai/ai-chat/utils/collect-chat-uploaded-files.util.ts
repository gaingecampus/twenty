import { isNonEmptyString } from '@sniptt/guards';
import { type UIMessage } from 'ai';
import { isExtendedFileUIPart } from 'twenty-shared/ai';

export type ChatUploadedFile = {
  filename: string;
  fileId: string;
};

// Collect AgentChat file parts for system-prompt registration (all MIME types).
// Must run on original messages before replaceUnsupportedFileParts (drops
// unsupported MIME fileIds) and before extractCodeInterpreterFiles.
export const collectChatUploadedFiles = (
  messages: UIMessage[],
): ChatUploadedFile[] => {
  const filesById = new Map<string, ChatUploadedFile>();

  for (const message of messages) {
    if (message.role !== 'user' || !message.parts) {
      continue;
    }

    for (const part of message.parts) {
      if (!isExtendedFileUIPart(part) || !isNonEmptyString(part.fileId)) {
        continue;
      }

      if (filesById.has(part.fileId)) {
        continue;
      }

      filesById.set(part.fileId, {
        filename: part.filename ?? 'uploaded_file',
        fileId: part.fileId,
      });
    }
  }

  return Array.from(filesById.values());
};
