import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { fireEvent, render, screen } from '@testing-library/react';

import { NoteImagePreview } from '@/activities/notes/components/NoteImagePreview';
import { type ActivityPreviewImage } from '@/activities/utils/getActivityImagePreview';

const images = [
  { url: 'first.png', name: 'First image' },
  { url: 'second.png', name: 'Second image' },
  { url: 'third.png', name: 'Third image' },
  { url: 'fourth.png', name: 'Fourth image' },
];

const renderPreview = (previewImages: ActivityPreviewImage[]) =>
  render(
    <I18nProvider i18n={i18n}>
      <NoteImagePreview images={previewImages} />
    </I18nProvider>,
  );

describe('NoteImagePreview', () => {
  it('shows the first two images and the remaining image count', () => {
    renderPreview(images);
    expect(screen.getAllByRole('img')).toHaveLength(2);
    expect(screen.getByRole('img', { name: 'First image' })).toHaveAttribute(
      'src',
      'first.png',
    );
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('does not show a count for a single image', () => {
    renderPreview(images.slice(0, 1));
    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(screen.queryByText(/\+\d/)).not.toBeInTheDocument();
  });

  it('shows two images without an overlay count when there are exactly two', () => {
    renderPreview(images.slice(0, 2));
    expect(screen.getAllByRole('img')).toHaveLength(2);
    expect(screen.queryByText(/\+\d/)).not.toBeInTheDocument();
  });

  it('does not reserve a preview for a note with no images', () => {
    const { container } = renderPreview([]);
    expect(container).toBeEmptyDOMElement();
  });

  it('keeps the count and replaces a broken image with a placeholder', () => {
    renderPreview(images);
    fireEvent.error(screen.getByRole('img', { name: 'Second image' }));
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(screen.getByText('+2')).toBeInTheDocument();
  });
});
