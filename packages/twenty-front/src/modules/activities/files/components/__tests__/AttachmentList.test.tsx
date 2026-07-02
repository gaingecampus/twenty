import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { fireEvent, render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { ThemeProvider } from 'twenty-ui/theme-constants';

import { AttachmentList } from '@/activities/files/components/AttachmentList';
import { type Attachment } from '@/activities/files/types/Attachment';

jest.mock('@/activities/files/hooks/useUploadAttachmentFile', () => ({
  useUploadAttachmentFile: () => ({
    uploadAttachmentFile: jest.fn(),
  }),
}));

jest.mock('@/settings/roles/hooks/useHasPermissionFlag', () => ({
  useHasPermissionFlag: () => true,
}));

jest.mock('@/ui/layout/modal/hooks/useModal', () => ({
  useModal: () => ({
    openModal: jest.fn(),
    closeModal: jest.fn(),
  }),
}));

jest.mock('@/ui/utilities/state/jotai/hooks/useAtomStateValue', () => ({
  useAtomStateValue: () => false,
}));

jest.mock('@/activities/files/components/AttachmentRow', () => ({
  AttachmentRow: () => <div data-testid="attachment-row" />,
}));

jest.mock('@/activities/files/components/ExternalLinkAttachmentRow', () => ({
  ExternalLinkAttachmentRow: () => (
    <div data-testid="external-link-attachment-row" />
  ),
}));

jest.mock('@/activities/files/components/AttachmentGrid', () => ({
  AttachmentGrid: () => <div data-testid="attachment-grid" />,
}));

const mockAttachments: Attachment[] = [
  {
    id: 'attachment-1',
    name: 'test-file.pdf',
    fullPath: '',
    fileCategory: 'TEXT_DOCUMENT',
    file: [
      {
        fileId: 'file-1',
        label: 'test-file.pdf',
        url: 'https://example.com/test-file.pdf',
        extension: 'pdf',
      },
    ],
    createdAt: '2026-07-01T00:00:00.000Z',
    __typename: 'Attachment',
  },
];

const renderAttachmentList = (node: ReactNode) =>
  render(
    <ThemeProvider colorScheme="light">
      <I18nProvider i18n={i18n}>{node}</I18nProvider>
    </ThemeProvider>,
  );

describe('AttachmentList', () => {
  it('should render list view by default', () => {
    renderAttachmentList(
      <AttachmentList
        targetableObject={{
          id: 'company-1',
          targetObjectNameSingular: 'company',
        }}
        title="All"
        attachments={mockAttachments}
      />,
    );

    expect(screen.getByTestId('attachment-row')).toBeInTheDocument();
    expect(screen.queryByTestId('attachment-grid')).not.toBeInTheDocument();
  });

  it('should switch to gallery view when the grid toggle is clicked', () => {
    renderAttachmentList(
      <AttachmentList
        targetableObject={{
          id: 'company-1',
          targetObjectNameSingular: 'company',
        }}
        title="All"
        attachments={mockAttachments}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Gallery view' }));

    expect(screen.getByTestId('attachment-grid')).toBeInTheDocument();
    expect(screen.queryByTestId('attachment-row')).not.toBeInTheDocument();
  });

  it('should switch back to list view when the list toggle is clicked', () => {
    renderAttachmentList(
      <AttachmentList
        targetableObject={{
          id: 'company-1',
          targetObjectNameSingular: 'company',
        }}
        title="All"
        attachments={mockAttachments}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Gallery view' }));
    fireEvent.click(screen.getByRole('button', { name: 'List view' }));

    expect(screen.getByTestId('attachment-row')).toBeInTheDocument();
    expect(screen.queryByTestId('attachment-grid')).not.toBeInTheDocument();
  });
});
