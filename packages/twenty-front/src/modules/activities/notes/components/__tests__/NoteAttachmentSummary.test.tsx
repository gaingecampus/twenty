import { IconsProvider } from 'twenty-ui/icon';
import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { render, screen, waitFor } from '@testing-library/react';
import { NoteAttachmentSummary } from '@/activities/notes/components/NoteAttachmentSummary';

describe('NoteAttachmentSummary', () => {
  it('shows the PDF icon, count, and filenames', async () => {
    const { container } = render(
      <IconsProvider>
        <I18nProvider i18n={i18n}>
          <NoteAttachmentSummary
            summary={[
              {
                type: 'PDF',
                files: [{ name: 'report.pdf' }, { name: 'plan.pdf' }],
              },
            ]}
          />
        </I18nProvider>
      </IconsProvider>,
    );
    expect(screen.getByText('PDF 2')).toBeInTheDocument();
    expect(screen.getByTitle(/report\.pdf/)).toBeInTheDocument();
    await waitFor(() =>
      expect(
        container.querySelector('.tabler-icon-file-type-pdf'),
      ).toBeInTheDocument(),
    );
  });

  it('shows multiple file types with their own counts', async () => {
    const { container } = render(
      <IconsProvider>
        <I18nProvider i18n={i18n}>
          <NoteAttachmentSummary
            summary={[
              { type: 'PDF', files: [{ name: 'report.pdf' }] },
              {
                type: 'IMAGE',
                files: [{ name: 'photo.png' }, { name: 'photo2.png' }],
              },
            ]}
          />
        </I18nProvider>
      </IconsProvider>,
    );
    expect(screen.getByText('PDF 1')).toBeInTheDocument();
    expect(screen.getByTitle(/photo\.png/)).toHaveTextContent('2');
    await waitFor(() =>
      expect(
        container.querySelector('.tabler-icon-file-type-pdf'),
      ).toBeInTheDocument(),
    );
  });
});
