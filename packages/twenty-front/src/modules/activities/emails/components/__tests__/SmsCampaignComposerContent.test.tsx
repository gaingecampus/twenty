import { SmsCampaignComposerContent } from '@/activities/emails/components/SmsCampaignComposerContent';
import { useSmsDispatchAvailability } from '@/activities/emails/hooks/useSmsDispatchAvailability';
import { render, screen } from '@testing-library/react';

jest.mock('@/activities/emails/hooks/useSmsDispatchAvailability', () => ({
  useSmsDispatchAvailability: jest.fn(),
}));
jest.mock('@/activities/emails/components/SmsCampaignComposer', () => ({
  SmsCampaignComposer: ({
    isSendingDisabled,
    isSendingBlocked,
  }: {
    isSendingDisabled?: boolean;
    isSendingBlocked?: boolean;
  }) => (
    <div>
      문자 작성 화면
      <button disabled={isSendingDisabled || isSendingBlocked}>발송</button>
    </div>
  ),
}));

it('always shows the composer while enabling sending only when SMS is available', () => {
  jest.mocked(useSmsDispatchAvailability).mockReturnValue(false);
  const { rerender } = render(<SmsCampaignComposerContent />);
  expect(screen.getByText('문자 작성 화면')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '발송' })).toBeDisabled();

  jest.mocked(useSmsDispatchAvailability).mockReturnValue(true);
  rerender(<SmsCampaignComposerContent />);
  expect(screen.getByRole('button', { name: '발송' })).toBeEnabled();

  rerender(<SmsCampaignComposerContent isSendingBlocked />);
  expect(screen.getByRole('button', { name: '발송' })).toBeDisabled();
  rerender(<SmsCampaignComposerContent />);
  expect(screen.getByRole('button', { name: '발송' })).toBeEnabled();

  jest.mocked(useSmsDispatchAvailability).mockReturnValue(false);
  rerender(<SmsCampaignComposerContent />);
  expect(screen.getByRole('button', { name: '발송' })).toBeDisabled();
});
