import { getAttachmentSourceIcon } from '@/activities/files/utils/getAttachmentSourceIcon';
import { IconCheckbox, IconMail, IconNotes } from 'twenty-ui/icon';

describe('getAttachmentSourceIcon', () => {
  it('should return the note icon for note source type', () => {
    expect(getAttachmentSourceIcon('note')).toBe(IconNotes);
  });

  it('should return the task icon for task source type', () => {
    expect(getAttachmentSourceIcon('task')).toBe(IconCheckbox);
  });

  it('should return the email icon for email source type', () => {
    expect(getAttachmentSourceIcon('email')).toBe(IconMail);
  });
});
