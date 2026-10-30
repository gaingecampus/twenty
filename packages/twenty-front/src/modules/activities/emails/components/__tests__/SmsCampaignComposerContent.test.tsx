import { SmsCampaignComposerContent } from '@/activities/emails/components/SmsCampaignComposerContent';
import { useSmsDispatchAvailability } from '@/activities/emails/hooks/useSmsDispatchAvailability';
import { fireEvent, render, screen } from '@testing-library/react';

jest.mock('@/activities/emails/hooks/useSmsDispatchAvailability', () => ({
  useSmsDispatchAvailability: jest.fn(),
}));
jest.mock('@/activities/emails/components/SmsCampaignComposer', () => ({
  SmsCampaignComposer: ({ isPreview }: { isPreview?: boolean }) => (
    <div>{isPreview ? '문자 미리보기 화면' : '문자 작성 화면'}</div>
  ),
}));

afterEach(() => jest.restoreAllMocks());

it('allows an explicit preview only during development and keeps it read-only after availability changes', () => {
  jest.replaceProperty(process.env, 'NODE_ENV', 'development');
  jest.mocked(useSmsDispatchAvailability).mockReturnValue(false);
  const { rerender } = render(<SmsCampaignComposerContent />);
  fireEvent.click(screen.getByRole('button', { name: /문자 화면 미리보기/ }));
  expect(screen.getByText('문자 미리보기 화면')).toBeInTheDocument();
  jest.mocked(useSmsDispatchAvailability).mockReturnValue(true);
  rerender(<SmsCampaignComposerContent />);
  expect(screen.getByText('문자 미리보기 화면')).toBeInTheDocument();
});

it('keeps the production setup gate without offering a preview', () => {
  jest.replaceProperty(process.env, 'NODE_ENV', 'production');
  jest.mocked(useSmsDispatchAvailability).mockReturnValue(false);
  render(<SmsCampaignComposerContent />);
  expect(screen.getByRole('alert')).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: /문자 화면 미리보기/ }),
  ).not.toBeInTheDocument();
  expect(screen.queryByText('문자 작성 화면')).not.toBeInTheDocument();
});

it('shows only a warning until SMS becomes available, then opens the composer', () => {
  jest.mocked(useSmsDispatchAvailability).mockReturnValue(false);
  const { rerender } = render(<SmsCampaignComposerContent />);
  expect(screen.getByRole('alert')).toHaveTextContent(
    '문자 발송 설정과 사용 권한',
  );
  expect(screen.queryByText('문자 작성 화면')).not.toBeInTheDocument();

  jest.mocked(useSmsDispatchAvailability).mockReturnValue(true);
  rerender(<SmsCampaignComposerContent />);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getByText('문자 작성 화면')).toBeInTheDocument();
});
