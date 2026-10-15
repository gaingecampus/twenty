import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from 'twenty-ui/theme-constants';

import { EmailAttachmentsField } from '@/activities/emails/components/EmailAttachmentsField';
import { useUploadEmailAttachment } from '@/activities/emails/hooks/useUploadEmailAttachment';

jest.mock('@/activities/emails/hooks/useUploadEmailAttachment');
jest.mock('@/file/components/AttachmentChip', () => ({
  AttachmentChip: ({ file }: { file: { name: string } }) => (
    <span>{file.name}</span>
  ),
}));

const upload = jest.fn();
const renderField = (onChange: jest.Mock) =>
  render(
    <ThemeProvider colorScheme="light">
      <I18nProvider i18n={i18n}>
        <EmailAttachmentsField
          files={[{ id: 'existing', name: 'existing.pdf' }]}
          onChange={onChange}
        />
      </I18nProvider>
    </ThemeProvider>,
  );

const dropFiles = (files: File[]) =>
  fireEvent.drop(screen.getByRole('button'), {
    dataTransfer: {
      files,
      items: files.map((file) => ({
        kind: 'file',
        type: file.type,
        getAsFile: () => file,
      })),
      types: ['Files'],
    },
  });

describe('EmailAttachmentsField', () => {
  beforeEach(() => {
    upload.mockReset();
    jest.mocked(useUploadEmailAttachment).mockReturnValue({
      uploadEmailAttachment: upload,
    });
  });

  it('uploads dropped files, preserving existing attachments and excluding failures', async () => {
    const onChange = jest.fn();
    const first = new File(['one'], 'one.txt', { type: 'text/plain' });
    const second = new File(['two'], 'two.txt', { type: 'text/plain' });
    upload.mockResolvedValueOnce({ id: 'new', name: 'one.txt' });
    upload.mockResolvedValueOnce(null);
    renderField(onChange);

    dropFiles([first, second]);

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith([
        { id: 'existing', name: 'existing.pdf' },
        { id: 'new', name: 'one.txt' },
      ]),
    );
    expect(upload).toHaveBeenCalledWith(first);
    expect(upload).toHaveBeenCalledWith(second);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'false');
  });

  it('uses the same uploader for files selected with the input', async () => {
    upload.mockResolvedValue({ id: 'selected', name: 'selected.txt' });
    const onChange = jest.fn();
    const { container } = renderField(onChange);
    const input = container.querySelector('input');
    if (!input) throw new Error('File input missing');
    fireEvent.change(input, {
      target: { files: [new File(['content'], 'selected.txt')] },
    });
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
  });

  it('ignores an empty drop', async () => {
    const onChange = jest.fn();
    renderField(onChange);
    dropFiles([]);
    await waitFor(() =>
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'false'),
    );
    expect(upload).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });
});
