import { render, screen } from '@testing-library/react';
import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { CampaignTestEmail } from '@/activities/emails/components/CampaignTestEmail';
import { useSendCampaignTestEmail } from '@/activities/emails/hooks/useSendCampaignTestEmail';
import { type useCampaignComposerState } from '@/activities/emails/hooks/useCampaignComposerState';

jest.mock('@/activities/emails/hooks/useSendCampaignTestEmail');
jest.mock('twenty-ui/input', () => ({
  Button: ({
    title,
    isLoading,
    disabled,
  }: {
    title: string;
    isLoading: boolean;
    disabled: boolean;
  }) => (
    <button aria-busy={isLoading} disabled={disabled}>
      {title}
    </button>
  ),
}));

it.each(['mutation', 'composer'] as const)(
  'shows test-send loading from %s and clears it on completion',
  (source) => {
    jest.mocked(useSendCampaignTestEmail).mockReturnValue({
      sendTest: jest.fn(),
      loading: source === 'mutation',
      result: null,
    });
    const campaignState = {
      isTestSending: source === 'composer',
      subject: '제목',
      body: '본문',
      signatureReady: true,
    } as ReturnType<typeof useCampaignComposerState>;
    const { rerender } = render(
      <CampaignTestEmail
        campaignState={campaignState}
        connectedAccountId="account"
      />,
      {
        wrapper: ({ children }) => (
          <I18nProvider i18n={i18n}>{children}</I18nProvider>
        ),
      },
    );
    expect(
      screen.getByRole('button', { name: '테스트 발송 중…' }),
    ).toHaveAttribute('aria-busy', 'true');
    expect(
      screen.getByRole('button', { name: '테스트 발송 중…' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('textbox', { name: '테스트 이메일 주소' }),
    ).toBeDisabled();
    jest
      .mocked(useSendCampaignTestEmail)
      .mockReturnValue({ sendTest: jest.fn(), loading: false, result: null });
    rerender(
      <CampaignTestEmail
        campaignState={{ ...campaignState, isTestSending: false }}
        connectedAccountId="account"
      />,
    );
    expect(screen.getByRole('button', { name: '테스트 발송' })).toHaveAttribute(
      'aria-busy',
      'false',
    );
    expect(
      screen.getByRole('textbox', { name: '테스트 이메일 주소' }),
    ).toBeEnabled();
  },
);
