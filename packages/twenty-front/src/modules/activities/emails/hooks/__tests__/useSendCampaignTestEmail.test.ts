import { act, renderHook } from '@testing-library/react';
import { useSendCampaignTestEmail } from '@/activities/emails/hooks/useSendCampaignTestEmail';

const sendEmail = jest.fn();
jest.mock('@apollo/client/react', () => ({
  useMutation: () => [sendEmail, { loading: false }],
}));

const input = {
  connectedAccountId: 'account',
  to: ' test@example.com ',
  subject: '안내',
  body: '<p>안녕하세요</p>',
  files: [{ id: 'file', name: 'guide.pdf' }],
};

describe('useSendCampaignTestEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sendEmail.mockResolvedValue({ data: { sendEmail: { success: true } } });
  });

  it('sends only to the entered address with attachments and a test subject', async () => {
    const { result } = renderHook(() => useSendCampaignTestEmail());
    await act(async () => result.current.sendTest(input));
    expect(sendEmail).toHaveBeenCalledWith({
      variables: {
        input: {
          ...input,
          to: 'test@example.com',
          subject: '[테스트] 안내',
        },
      },
    });
    expect(result.current.result).toEqual({
      recipient: 'test@example.com',
      subject: '안내',
      success: true,
      error: undefined,
    });
  });

  it('rejects multiple recipients before sending', async () => {
    const { result } = renderHook(() => useSendCampaignTestEmail());
    await act(async () =>
      result.current.sendTest({ ...input, to: 'a@example.com,b@example.com' }),
    );
    expect(sendEmail).not.toHaveBeenCalled();
    expect(result.current.result?.success).toBe(false);
  });

  it('shows the server failure without reporting success', async () => {
    sendEmail.mockResolvedValue({
      data: { sendEmail: { success: false, error: 'SMTP 인증 실패' } },
    });
    const { result } = renderHook(() => useSendCampaignTestEmail());
    await act(async () => result.current.sendTest(input));
    expect(result.current.result).toEqual(
      expect.objectContaining({ success: false, error: 'SMTP 인증 실패' }),
    );
  });

  it('shows network errors and allows retrying', async () => {
    sendEmail.mockRejectedValueOnce(new Error('네트워크 오류'));
    const { result } = renderHook(() => useSendCampaignTestEmail());
    await act(async () => result.current.sendTest(input));
    expect(result.current.result?.error).toBe('네트워크 오류');
    await act(async () => result.current.sendTest(input));
    expect(result.current.result?.success).toBe(true);
  });

  it('prevents duplicate requests while a send is pending', async () => {
    let complete: (value: unknown) => void = () => {};
    sendEmail.mockImplementation(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    const { result } = renderHook(() => useSendCampaignTestEmail());
    await act(async () => {
      const first = result.current.sendTest(input);
      await result.current.sendTest(input);
      expect(sendEmail).toHaveBeenCalledTimes(1);
      complete({ data: { sendEmail: { success: true } } });
      await first;
    });
  });
});
