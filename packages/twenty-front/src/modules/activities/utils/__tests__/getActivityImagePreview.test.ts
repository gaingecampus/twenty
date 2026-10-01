import { getActivityImagePreview } from '@/activities/utils/getActivityImagePreview';

describe('getActivityImagePreview', () => {
  it.each([null, '', '{}', '[]', 'null'])(
    'handles an empty body: %s',
    (body) => {
      expect(getActivityImagePreview(body)).toEqual([]);
    },
  );

  it('handles invalid JSON', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(getActivityImagePreview('invalid')).toEqual([]);
    warn.mockRestore();
  });

  it('collects images in document order, including nested blocks', () => {
    const body = JSON.stringify([
      {
        type: 'paragraph',
        children: [
          { type: 'image', props: { url: 'first.png', name: 'First image' } },
        ],
      },
      {
        type: 'image',
        props: { url: 'second.png' },
        children: [{ type: 'image', props: { url: 'third.png' } }],
      },
      { type: 'image', props: { url: 'fourth.png' } },
    ]);
    expect(getActivityImagePreview(body)).toEqual([
      { url: 'first.png', name: 'First image' },
      { url: 'second.png', name: '' },
      { url: 'third.png', name: '' },
      { url: 'fourth.png', name: '' },
    ]);
  });

  it('ignores other attachments and images without a usable URL', () => {
    expect(
      getActivityImagePreview(
        JSON.stringify([
          null,
          { type: 'file', props: { url: 'file.png' } },
          { type: 'video', props: { url: 'video.mp4' } },
          { type: 'image' },
          { type: 'image', props: { url: '' } },
          { type: 'image', props: { url: 123 } },
        ]),
      ),
    ).toEqual([]);
  });
});
