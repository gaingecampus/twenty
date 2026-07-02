import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { fireEvent, render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { ThemeProvider } from 'twenty-ui/theme-constants';

import { AttachmentCard } from '@/activities/files/components/AttachmentCard';
import { type AttachmentWithFile } from '@/activities/files/utils/filterAttachmentsWithFile';

jest.mock('@/object-record/hooks/useDestroyOneRecord', () => ({
  useDestroyOneRecord: () => ({
    destroyOneRecord: jest.fn(),
  }),
}));

jest.mock('@/object-record/hooks/useUpdateOneRecord', () => ({
  useUpdateOneRecord: () => ({
    updateOneRecord: jest.fn(),
  }),
}));

jest.mock('@/settings/roles/hooks/useHasPermissionFlag', () => ({
  useHasPermissionFlag: () => true,
}));

jest.mock('@/activities/files/components/AttachmentDropdown', () => ({
  AttachmentDropdown: () => <div data-testid="attachment-dropdown" />,
}));

jest.mock('@/activities/files/components/AttachmentSourceLabel', () => ({
  AttachmentSourceLabel: () => <div data-testid="attachment-source-label" />,
}));

const mockAttachment: AttachmentWithFile = {
  id: 'attachment-1',
  name: 'test-file.pdf',
  fullPath: '',
  fileCategory: 'TEXT_DOCUMENT',
  file: {
    fileId: 'file-1',
    label: 'test-file.pdf',
    url: 'https://example.com/test-file.pdf',
    extension: 'pdf',
  },
  createdAt: '2026-07-01T00:00:00.000Z',
  __typename: 'Attachment',
};

const renderAttachmentCard = (node: ReactNode) =>
  render(
    <ThemeProvider colorScheme="light">
      <I18nProvider i18n={i18n}>{node}</I18nProvider>
    </ThemeProvider>,
  );

class ResizeObserverMock {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

describe('AttachmentCard', () => {
  beforeAll(() => {
    global.ResizeObserver = ResizeObserverMock;
  });

  it('should render the attachment file name', () => {
    renderAttachmentCard(<AttachmentCard attachment={mockAttachment} />);

    expect(screen.getByText('test-file.pdf')).toBeInTheDocument();
  });

  it('should call onPreview when the preview area is clicked', () => {
    const onPreview = jest.fn();

    renderAttachmentCard(
      <AttachmentCard attachment={mockAttachment} onPreview={onPreview} />,
    );

    fireEvent.click(screen.getAllByRole('link')[0]);

    expect(onPreview).toHaveBeenCalledWith(mockAttachment);
  });
});
