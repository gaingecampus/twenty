import { activityHasAttachments } from '@/activities/utils/activityHasAttachments';

describe('activityHasAttachments', () => {
  it('should return true when blocknote contains attachment blocks', () => {
    expect(
      activityHasAttachments({
        bodyV2: {
          blocknote: JSON.stringify([
            {
              type: 'file',
              props: {
                url: 'https://example.com/files/file.pdf',
                name: 'file.pdf',
              },
            },
          ]),
        },
        attachments: null,
      }),
    ).toBe(true);
  });

  it('should return true when attachments relation has records', () => {
    expect(
      activityHasAttachments({
        bodyV2: {
          blocknote: '[]',
        },
        attachments: [{ id: 'attachment-id' }],
      }),
    ).toBe(true);
  });

  it('should return true when attachments connection has edges', () => {
    expect(
      activityHasAttachments({
        bodyV2: null,
        attachments: {
          edges: [{ node: { id: 'attachment-id' } }],
        },
      }),
    ).toBe(true);
  });

  it('should return false when there are no attachments', () => {
    expect(
      activityHasAttachments({
        bodyV2: {
          blocknote: JSON.stringify([
            {
              type: 'paragraph',
              props: {
                text: 'No files here',
              },
            },
          ]),
        },
        attachments: [],
      }),
    ).toBe(false);
  });
});
