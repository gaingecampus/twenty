import { type PartialBlock } from '@blocknote/core';
import { isArray, isNonEmptyString } from '@sniptt/guards';
import { type FileCategory } from 'twenty-shared/types';

import { type ActivityAttachment } from '@/activities/types/ActivityAttachment';
import { compareUrls } from '@/activities/utils/compareUrls';
import { parseInitialBlocknote } from '@/blocknote-editor/utils/parseInitialBlocknote';
import { getFileCategoryFromExtension } from '@/object-record/record-field/ui/utils/getFileCategoryFromExtension';
import { getFileNameAndExtension } from '~/utils/file/getFileNameAndExtension';

export type ActivityAttachmentSummaryType = FileCategory | 'PDF';
export type ActivityAttachmentSummary = {
  type: ActivityAttachmentSummaryType;
  files: Array<{ name: string; url?: string }>;
};

type PreviewFile = {
  name: string;
  url?: string;
  type: ActivityAttachmentSummaryType;
};

const getNameFromUrl = (url?: string): string => {
  if (!isNonEmptyString(url)) return '';
  try {
    return decodeURIComponent(url.split(/[?#]/)[0].split('/').pop() ?? '');
  } catch {
    return '';
  }
};

const getFileType = (
  name: string,
  url?: string,
  extension?: string,
  category?: FileCategory,
): ActivityAttachmentSummaryType => {
  const fileExtension =
    extension ||
    getFileNameAndExtension(name).extension ||
    getFileNameAndExtension(getNameFromUrl(url)).extension;
  if (fileExtension.toLowerCase().replace(/^\./, '') === 'pdf') return 'PDF';
  const categoryFromExtension = getFileCategoryFromExtension(fileExtension);
  return categoryFromExtension === 'OTHER'
    ? (category ?? 'OTHER')
    : categoryFromExtension;
};

export const getActivityAttachmentSummary = ({
  bodyV2,
  attachments,
}: {
  bodyV2?: { blocknote?: string | null } | null;
  attachments?:
    | ActivityAttachment[]
    | {
        edges?: Array<{ node?: ActivityAttachment | null } | null> | null;
      }
    | null;
}): ActivityAttachmentSummary[] => {
  const files: PreviewFile[] = [];
  const addFile = (file: PreviewFile) => {
    const existing = files.find((item) => compareUrls(item.url, file.url));
    if (existing) {
      if (!existing.name && file.name) existing.name = file.name;
      if (existing.type === 'OTHER') existing.type = file.type;
      return;
    }
    files.push(file);
  };

  const records = isArray(attachments)
    ? attachments
    : (attachments?.edges ?? []).flatMap((edge) =>
        edge?.node ? [edge.node] : [],
      );

  for (const attachment of records) {
    const attachedFiles = (attachment.file ?? []).filter(
      (file) => !file.isDeleted,
    );
    if (attachment.file?.length && attachedFiles.length === 0) continue;
    if (attachedFiles.length > 0) {
      for (const file of attachedFiles) {
        const name = file.label || attachment.name || getNameFromUrl(file.url);
        addFile({
          name,
          url: file.url,
          type: getFileType(
            name,
            file.url,
            file.extension,
            file.fileCategory ?? attachment.fileCategory,
          ),
        });
      }
    } else {
      const url = attachment.fullPath || undefined;
      const name = attachment.name || getNameFromUrl(url);
      addFile({
        name,
        url,
        type: getFileType(name, url, undefined, attachment.fileCategory),
      });
    }
  }

  const visitBlocks = (blocks: PartialBlock[]) => {
    for (const block of blocks) {
      if (!block || typeof block !== 'object') continue;
      const props = block.props as { url?: string; name?: string } | undefined;
      if (
        ['image', 'file', 'video', 'audio'].includes(block.type ?? '') &&
        isNonEmptyString(props?.url)
      ) {
        const name = isNonEmptyString(props.name)
          ? props.name
          : getNameFromUrl(props.url);
        const category =
          block.type === 'image'
            ? 'IMAGE'
            : block.type === 'video'
              ? 'VIDEO'
              : block.type === 'audio'
                ? 'AUDIO'
                : undefined;
        addFile({
          name,
          url: props.url,
          type: getFileType(name, props.url, undefined, category),
        });
      }
      if (isArray(block.children)) visitBlocks(block.children);
    }
  };
  visitBlocks(parseInitialBlocknote(bodyV2?.blocknote) ?? []);

  const summary: ActivityAttachmentSummary[] = [];
  for (const file of files) {
    const group = summary.find((item) => item.type === file.type);
    if (group) group.files.push({ name: file.name, url: file.url });
    else
      summary.push({
        type: file.type,
        files: [{ name: file.name, url: file.url }],
      });
  }
  return summary;
};
