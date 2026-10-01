import { getActivityAttachmentSummary } from '@/activities/utils/getActivityAttachmentSummary';

describe('getActivityAttachmentSummary', () => {
  it('returns no groups for an empty note', () => {
    expect(getActivityAttachmentSummary({})).toEqual([]);
  });

  it('groups PDFs separately and includes nested body images', () => {
    const summary = getActivityAttachmentSummary({
      bodyV2: {
        blocknote: JSON.stringify([
          { type: 'file', props: { name: 'report.PDF', url: 'report.pdf' } },
          { type: 'file', props: { name: 'plan.pdf', url: 'plan.pdf' } },
          {
            type: 'paragraph',
            children: [
              { type: 'image', props: { name: 'photo.png', url: 'photo.png' } },
            ],
          },
          { type: 'file', props: { name: 'data.xlsx', url: 'data.xlsx' } },
        ]),
      },
    });
    expect(summary.map((group) => [group.type, group.files.length])).toEqual([
      ['PDF', 2],
      ['IMAGE', 1],
      ['SPREADSHEET', 1],
    ]);
  });

  it('counts a synchronized body attachment only once despite signed URL changes', () => {
    const summary = getActivityAttachmentSummary({
      attachments: [
        {
          id: 'attachment-1',
          name: 'Report',
          file: [
            {
              fileId: 'file-1',
              label: 'report.pdf',
              extension: 'pdf',
              url: 'https://example.com/report.pdf?token=new',
            },
          ],
        },
      ],
      bodyV2: {
        blocknote: JSON.stringify([
          {
            type: 'file',
            props: {
              url: 'https://example.com/report.pdf?token=old',
              name: 'report.pdf',
            },
          },
        ]),
      },
    });
    expect(summary).toEqual([
      {
        type: 'PDF',
        files: [
          {
            name: 'report.pdf',
            url: 'https://example.com/report.pdf?token=new',
          },
        ],
      },
    ]);
  });

  it('handles attachment connections and files without body blocks', () => {
    const summary = getActivityAttachmentSummary({
      attachments: {
        edges: [
          null,
          { node: null },
          { node: { id: '1', fileCategory: 'IMAGE', name: 'photo.png' } },
        ],
      },
    });
    expect(summary).toEqual([
      { type: 'IMAGE', files: [{ name: 'photo.png', url: undefined }] },
    ]);
  });

  it('ignores deleted files and incomplete upload blocks', () => {
    expect(
      getActivityAttachmentSummary({
        attachments: [
          {
            id: 'deleted',
            file: [{ fileId: '1', label: 'old.pdf', isDeleted: true }],
          },
        ],
        bodyV2: {
          blocknote: JSON.stringify([
            null,
            { type: 'file' },
            { type: 'image', props: { url: '' } },
          ]),
        },
      }),
    ).toEqual([]);
  });

  it('infers the extension from a URL without a filename property', () => {
    const summary = getActivityAttachmentSummary({
      bodyV2: {
        blocknote: JSON.stringify([
          {
            type: 'file',
            props: { url: 'https://example.com/report%20final.pdf?token=abc' },
          },
        ]),
      },
    });
    expect(summary[0].type).toBe('PDF');
    expect(summary[0].files[0].name).toBe('report final.pdf');
  });

  it('keeps unsupported files visible and counted', () => {
    const summary = getActivityAttachmentSummary({
      attachments: [
        { id: '1', name: 'file.custom' },
        { id: '2', name: 'another.custom' },
      ],
    });
    expect(summary[0].type).toBe('OTHER');
    expect(summary[0].files).toHaveLength(2);
  });
});
