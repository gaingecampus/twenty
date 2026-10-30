import { type ScheduledCampaign } from '@/activities/emails/types/ScheduledCampaign';
import { act, renderHook } from '@testing-library/react';

import { useCampaignComposerState } from '@/activities/emails/hooks/useCampaignComposerState';
import { useSendMessageCampaign } from '@/activities/emails/hooks/useSendMessageCampaign';

let signatureMock = '';
jest.mock('@/activities/emails/hooks/useSendMessageCampaign');
jest.mock('@/settings/accounts/hooks/useEmailSignature', () => ({
  useEmailSignature: () => ({
    signature: signatureMock,
    loading: false,
    error: undefined,
  }),
}));
jest.mock('@apollo/client/react', () => ({
  useMutation: () => [cancelScheduleMock, { loading: false }],
}));
jest.mock('@/ui/feedback/snack-bar-manager/hooks/useSnackBar', () => ({
  useSnackBar: () => ({
    enqueueSuccessSnackBar: jest.fn(),
    enqueueErrorSnackBar: jest.fn(),
  }),
}));
const cancelScheduleMock = jest.fn();

const sendMessageCampaignMock = jest.fn(
  (): Promise<boolean> => Promise.resolve(true),
);

const mockedUseSendMessageCampaign = jest.mocked(useSendMessageCampaign);

const fillSendableFields = (result: {
  current: ReturnType<typeof useCampaignComposerState>;
}) => {
  act(() => {
    result.current.setListId('list-1');
    result.current.setFromAddress('  sender@example.com  ');
    result.current.setSubject('Hello');
    result.current.setBody('Body');
  });
};

describe('useCampaignComposerState', () => {
  it('includes the personal signature once and allows opting out', () => {
    signatureMock = '<p>내 명함</p>';
    const { result } = renderHook(() => useCampaignComposerState({}));
    fillSendableFields(result);
    expect(result.current.bodyWithSignature).toBe(
      'Body<br><div data-email-signature="true"><p>내 명함</p></div>',
    );
    act(() => result.current.setIncludeSignature(false));
    expect(result.current.bodyWithSignature).toBe('Body');
  });
  beforeEach(() => {
    jest.clearAllMocks();
    signatureMock = '';
    mockedUseSendMessageCampaign.mockReturnValue({
      sendMessageCampaign: sendMessageCampaignMock,
      loading: false,
    });
  });

  it('blocks direct recipients even when a list was selected and review was opened', async () => {
    const { result } = renderHook(() => useCampaignComposerState({}));
    fillSendableFields(result);
    act(() => result.current.handleSend());
    expect(result.current.isReviewOpen).toBe(true);
    act(() => {
      result.current.setRecipientMode('direct');
      result.current.setDirectEmail('recipient@example.com');
    });
    expect(result.current.canSend).toBe(false);
    await act(async () => result.current.confirmSend());
    expect(sendMessageCampaignMock).not.toHaveBeenCalled();
    act(() => result.current.closeReview());
    act(() => result.current.handleSend());
    expect(result.current.isReviewOpen).toBe(false);
    act(() => result.current.setRecipientMode('list'));
    expect(result.current.canSend).toBe(true);
  });

  it('blocks a reservation without a valid future date', () => {
    const { result } = renderHook(() => useCampaignComposerState({}));
    fillSendableFields(result);
    act(() => {
      result.current.setSendMode('scheduled');
    });
    expect(result.current.canSend).toBe(false);
    act(() => {
      result.current.setScheduledAt(new Date(Date.now() - 60000).toISOString());
    });
    expect(result.current.canSend).toBe(false);
    act(() => {
      result.current.setScheduledAt(
        new Date(Date.now() + 3600000).toISOString(),
      );
    });
    expect(result.current.canSend).toBe(true);
  });

  it('submits the scheduled instant instead of an immediate send', async () => {
    const { result } = renderHook(() => useCampaignComposerState({}));
    fillSendableFields(result);
    const scheduledAt = new Date(Date.now() + 3600000).toISOString();
    act(() => {
      result.current.setSendMode('scheduled');
      result.current.setScheduledAt(scheduledAt);
    });
    act(() => result.current.handleSend());
    await act(async () => {
      await result.current.confirmSend();
    });
    expect(sendMessageCampaignMock).toHaveBeenCalledWith(
      expect.objectContaining({ scheduledAt }),
    );
  });

  const existingCampaign: ScheduledCampaign = {
    id: 'campaign-1',
    __typename: 'MessageCampaign',
    attachmentFiles: [{ id: 'file-1', name: 'guide.pdf' }],
    subject: 'Saved subject',
    bodyTemplate: '<p>Saved body</p>',
    fromAddress: { primaryEmail: 'sender@example.com' },
    listId: 'list-1',
    unsubscribeTopicId: 'topic-1',
    status: 'SCHEDULED',
    scheduleVersion: 'revision-1',
    scheduledAt: '2099-01-01T01:00:00Z',
  };

  it('loads a scheduled campaign and preserves its revision when saving content changes', async () => {
    const { result } = renderHook(() =>
      useCampaignComposerState({ campaign: existingCampaign }),
    );
    expect(result.current.isEditing).toBe(true);
    expect(result.current.sendMode).toBe('scheduled');
    expect(result.current.body).toBe('<p>Saved body</p>');
    act(() => {
      result.current.setSubject('Updated subject');
    });
    act(() => result.current.handleSend());
    await act(async () => {
      await result.current.confirmSend();
    });
    expect(sendMessageCampaignMock).toHaveBeenCalledWith(
      expect.objectContaining({
        campaignId: 'campaign-1',
        scheduleVersion: 'revision-1',
        subject: 'Updated subject',
        files: existingCampaign.attachmentFiles,
        scheduledAt: existingCampaign.scheduledAt,
      }),
    );
  });

  it('cancels the selected revision without sending email', async () => {
    cancelScheduleMock.mockResolvedValue({
      data: { cancelScheduledMessageCampaign: true },
    });
    const onSent = jest.fn();
    const { result } = renderHook(() =>
      useCampaignComposerState({ campaign: existingCampaign, onSent }),
    );
    await act(async () => {
      await result.current.cancelSchedule();
    });
    expect(cancelScheduleMock).toHaveBeenCalledWith({
      variables: { campaignId: 'campaign-1', scheduleVersion: 'revision-1' },
    });
    expect(sendMessageCampaignMock).not.toHaveBeenCalled();
    expect(onSent).toHaveBeenCalledTimes(1);
  });

  it('prevents simultaneous submissions before loading state updates', async () => {
    const { result } = renderHook(() => useCampaignComposerState({}));
    fillSendableFields(result);
    act(() => result.current.handleSend());
    await act(async () => {
      await Promise.all([
        result.current.confirmSend(),
        result.current.confirmSend(),
      ]);
    });
    expect(sendMessageCampaignMock).toHaveBeenCalledTimes(1);
  });

  it('should start empty and not be sendable', () => {
    const { result } = renderHook(() => useCampaignComposerState({}));

    expect(result.current.listId).toBeNull();
    expect(result.current.unsubscribeTopicId).toBeNull();
    expect(result.current.canSend).toBe(false);
  });

  it('should become sendable once list, from address and subject are set', () => {
    const { result } = renderHook(() => useCampaignComposerState({}));

    fillSendableFields(result);

    expect(result.current.canSend).toBe(true);
  });

  it('should not be sendable while a send is in flight', () => {
    mockedUseSendMessageCampaign.mockReturnValue({
      sendMessageCampaign: sendMessageCampaignMock,
      loading: true,
    });

    const { result } = renderHook(() => useCampaignComposerState({}));

    fillSendableFields(result);

    expect(result.current.canSend).toBe(false);
  });

  it('should send trimmed values with the selected topic and call onSent on success', async () => {
    sendMessageCampaignMock.mockResolvedValue(true);
    const onSent = jest.fn();

    const { result } = renderHook(() => useCampaignComposerState({ onSent }));

    act(() => {
      result.current.setUnsubscribeTopicId('topic-1');
      result.current.setBody('Body');
    });
    fillSendableFields(result);

    act(() => result.current.handleSend());
    await act(async () => {
      await result.current.confirmSend();
    });

    expect(sendMessageCampaignMock).toHaveBeenCalledWith({
      scheduledAt: undefined,
      campaignId: undefined,
      scheduleVersion: undefined,
      listId: 'list-1',
      unsubscribeTopicId: 'topic-1',
      subject: 'Hello',
      body: 'Body',
      files: [],
      fromAddress: 'sender@example.com',
    });
    expect(onSent).toHaveBeenCalledTimes(1);
  });

  it('should pass an undefined topic when none is selected', async () => {
    sendMessageCampaignMock.mockResolvedValue(true);

    const { result } = renderHook(() => useCampaignComposerState({}));

    fillSendableFields(result);

    act(() => result.current.handleSend());
    await act(async () => {
      await result.current.confirmSend();
    });

    expect(sendMessageCampaignMock).toHaveBeenCalledWith(
      expect.objectContaining({ unsubscribeTopicId: undefined }),
    );
  });

  it('should not send when required fields are missing', async () => {
    const { result } = renderHook(() => useCampaignComposerState({}));

    act(() => result.current.handleSend());
    await act(async () => {
      await result.current.confirmSend();
    });

    expect(sendMessageCampaignMock).not.toHaveBeenCalled();
  });

  it('should not call onSent when the send fails', async () => {
    sendMessageCampaignMock.mockResolvedValue(false);
    const onSent = jest.fn();

    const { result } = renderHook(() => useCampaignComposerState({ onSent }));

    fillSendableFields(result);

    act(() => result.current.handleSend());
    await act(async () => {
      await result.current.confirmSend();
    });

    expect(sendMessageCampaignMock).toHaveBeenCalled();
    expect(onSent).not.toHaveBeenCalled();
  });
  it('opens review without sending and preserves the draft when dismissed', async () => {
    const { result } = renderHook(() => useCampaignComposerState({}));
    fillSendableFields(result);
    await act(async () => {
      await result.current.confirmSend();
    });
    expect(sendMessageCampaignMock).not.toHaveBeenCalled();
    act(() => result.current.handleSend());
    expect(result.current.isReviewOpen).toBe(true);
    expect(sendMessageCampaignMock).not.toHaveBeenCalled();
    act(() => result.current.closeReview());
    expect(result.current.isReviewOpen).toBe(false);
    expect(result.current.subject).toBe('Hello');
    await act(async () => {
      await result.current.confirmSend();
    });
    expect(sendMessageCampaignMock).not.toHaveBeenCalled();
  });

  it('blocks sending while an attachment is uploading', () => {
    const { result } = renderHook(() => useCampaignComposerState({}));
    fillSendableFields(result);
    act(() => {
      result.current.setBody('Body');
      result.current.setIsUploading(true);
    });
    expect(result.current.canSend).toBe(false);
    act(() => result.current.setIsUploading(false));
    expect(result.current.canSend).toBe(true);
  });
  it('blocks final sending while a review test email is in progress', async () => {
    const { result } = renderHook(() => useCampaignComposerState({}));
    fillSendableFields(result);
    act(() => result.current.handleSend());
    act(() => result.current.setIsTestSending(true));
    expect(result.current.canSend).toBe(false);
    await act(async () => {
      await result.current.confirmSend();
    });
    expect(sendMessageCampaignMock).not.toHaveBeenCalled();
    expect(result.current.isReviewOpen).toBe(true);
    act(() => result.current.setIsTestSending(false));
    expect(result.current.canSend).toBe(true);
  });
});
