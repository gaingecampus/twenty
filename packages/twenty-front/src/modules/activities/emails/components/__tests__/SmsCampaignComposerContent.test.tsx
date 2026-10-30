import { SmsCampaignComposerContent } from '@/activities/emails/components/SmsCampaignComposerContent';
import { useSmsDispatchAvailability } from '@/activities/emails/hooks/useSmsDispatchAvailability';
import { render, screen } from '@testing-library/react';

jest.mock('@/activities/emails/hooks/useSmsDispatchAvailability', () => ({
  useSmsDispatchAvailability: jest.fn(),
}));
jest.mock('@/activities/emails/components/SmsCampaignComposer', () => ({
  SmsCampaignComposer: () => <div>문자 작성 화면</div>,
}));

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
