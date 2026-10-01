import { type PartialBlock } from '@blocknote/core';
import { isArray, isNonEmptyString } from '@sniptt/guards';

import { parseInitialBlocknote } from '@/blocknote-editor/utils/parseInitialBlocknote';

export type ActivityPreviewImage = {
  url: string;
  name: string;
};

export const getActivityImagePreview = (
  activityBody: string | null,
): ActivityPreviewImage[] => {
  const images: ActivityPreviewImage[] = [];

  const visitBlocks = (blocks: PartialBlock[]) => {
    for (const block of blocks) {
      if (!block || typeof block !== 'object') continue;

      if (block.type === 'image' && isNonEmptyString(block.props?.url)) {
        images.push({
          url: block.props.url,
          name: isNonEmptyString(block.props.name) ? block.props.name : '',
        });
      }

      if (isArray(block.children)) {
        visitBlocks(block.children);
      }
    }
  };

  visitBlocks(parseInitialBlocknote(activityBody) ?? []);

  return images;
};
