import { type UIMessage } from 'ai';

import { collectChatUploadedFiles } from 'src/engine/metadata-modules/ai/ai-chat/utils/collect-chat-uploaded-files.util';

const buildUserMessageWithFiles = (
  files: Array<{ filename: string; fileId: string; mediaType: string }>,
): UIMessage =>
  ({
    id: 'msg-1',
    role: 'user',
    parts: [
      { type: 'text', text: 'please save this' },
      ...files.map((file) => ({
        type: 'file' as const,
        filename: file.filename,
        fileId: file.fileId,
        mediaType: file.mediaType,
        url: '',
      })),
    ],
  }) as UIMessage;

describe('collectChatUploadedFiles', () => {
  it('collects image and document fileIds from user messages', () => {
    const messages = [
      buildUserMessageWithFiles([
        {
          filename: 'photo.png',
          fileId: '11111111-1111-1111-1111-111111111111',
          mediaType: 'image/png',
        },
        {
          filename: 'data.csv',
          fileId: '22222222-2222-2222-2222-222222222222',
          mediaType: 'text/csv',
        },
      ]),
    ];

    expect(collectChatUploadedFiles(messages)).toEqual([
      {
        filename: 'photo.png',
        fileId: '11111111-1111-1111-1111-111111111111',
      },
      {
        filename: 'data.csv',
        fileId: '22222222-2222-2222-2222-222222222222',
      },
    ]);
  });

  it('deduplicates by fileId across messages', () => {
    const file = {
      filename: 'photo.png',
      fileId: '11111111-1111-1111-1111-111111111111',
      mediaType: 'image/png',
    };

    const messages = [
      buildUserMessageWithFiles([file]),
      buildUserMessageWithFiles([{ ...file, filename: 'renamed.png' }]),
    ];

    expect(collectChatUploadedFiles(messages)).toEqual([
      {
        filename: 'photo.png',
        fileId: '11111111-1111-1111-1111-111111111111',
      },
    ]);
  });

  it('ignores assistant messages and non-file parts', () => {
    const messages = [
      {
        id: 'a1',
        role: 'assistant',
        parts: [
          {
            type: 'file',
            filename: 'ignored.png',
            fileId: '33333333-3333-3333-3333-333333333333',
            mediaType: 'image/png',
            url: '',
          },
        ],
      },
      {
        id: 'u1',
        role: 'user',
        parts: [{ type: 'text', text: 'hello' }],
      },
    ] as UIMessage[];

    expect(collectChatUploadedFiles(messages)).toEqual([]);
  });
});
