import { type AttachmentSourceType } from '@/activities/files/utils/getAttachmentSourceInfo';
import {
  IconCheckbox,
  IconMail,
  IconNotes,
  type IconComponent,
} from 'twenty-ui/icon';

export const getAttachmentSourceIcon = (
  sourceType: AttachmentSourceType,
): IconComponent => {
  switch (sourceType) {
    case 'note':
      return IconNotes;
    case 'task':
      return IconCheckbox;
    case 'email':
      return IconMail;
  }
};
