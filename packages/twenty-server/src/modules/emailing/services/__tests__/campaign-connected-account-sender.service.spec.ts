import { ForbiddenException } from '@nestjs/common';
import { ConnectedAccountProvider } from 'twenty-shared/types';

import { CampaignConnectedAccountSenderService } from 'src/modules/emailing/services/campaign-connected-account-sender.service';

describe('Campaign connected account sender', () => {
  const channels = { find: jest.fn() };
  const accounts = { verifyOwnership: jest.fn() };
  const outbound = { sendMessage: jest.fn() };
  const suppressions = {
    getSuppressedAddresses: jest.fn(),
    getTopicSuppressedAddresses: jest.fn(),
  };
  const tokens = { sign: jest.fn(() => 'signed-token') };
  const config = { get: jest.fn(() => 'https://crm.example.com') };
  const service = new CampaignConnectedAccountSenderService(
    ...([
      channels,
      accounts,
      outbound,
      suppressions,
      tokens,
      config,
    ] as unknown as ConstructorParameters<
      typeof CampaignConnectedAccountSenderService
    >),
  );
  const content = {
    from: 'sender@example.com',
    to: ['recipient@example.com'],
    subject: 'Hello',
    text: 'Hello',
    html: '<p>Hello</p>',
    unsubscribeTopicId: 'topic',
  };
  const account = {
    id: 'account',
    handle: content.from,
    userWorkspaceId: 'owner',
    visibility: 'private',
    provider: ConnectedAccountProvider.GOOGLE,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    accounts.verifyOwnership.mockResolvedValue(account);
    suppressions.getSuppressedAddresses.mockResolvedValue(new Set());
    suppressions.getTopicSuppressedAddresses.mockResolvedValue(new Set());
    outbound.sendMessage.mockResolvedValue({
      headerMessageId: 'header',
      messageExternalId: 'provider',
    });
  });

  it.each([
    ConnectedAccountProvider.GOOGLE,
    ConnectedAccountProvider.MICROSOFT,
    ConnectedAccountProvider.IMAP_SMTP_CALDAV,
  ])(
    'uses existing outbound service for %s and includes preference link',
    async (provider) => {
      accounts.verifyOwnership.mockResolvedValue({ ...account, provider });
      await service.send('workspace', 'owner', 'account', content);
      expect(accounts.verifyOwnership).toHaveBeenCalledWith({
        id: 'account',
        workspaceId: 'workspace',
        userWorkspaceId: 'owner',
      });
      expect(outbound.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          to: content.to,
          html: expect.stringContaining(
            'https://crm.example.com/emailing/unsubscribe?t=signed-token',
          ),
        }),
        expect.objectContaining({ provider }),
      );
    },
  );

  it.each(['global', 'topic'])(
    'does not send after a %s opt-out',
    async (scope) => {
      suppressions[
        scope === 'global'
          ? 'getSuppressedAddresses'
          : 'getTopicSuppressedAddresses'
      ].mockResolvedValue(new Set(content.to));
      await expect(
        service.send('workspace', 'owner', 'account', content),
      ).rejects.toThrow('Recipient opted out');
      expect(outbound.sendMessage).not.toHaveBeenCalled();
    },
  );

  it('rechecks account access at delivery time', async () => {
    accounts.verifyOwnership.mockRejectedValue(new ForbiddenException());
    await expect(
      service.send('workspace', 'owner', 'account', content),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(outbound.sendMessage).not.toHaveBeenCalled();
  });

  it('does not substitute another users private account', async () => {
    channels.find.mockResolvedValue([
      { connectedAccountId: 'account', connectedAccount: account },
    ]);
    await expect(
      service.resolveChannel('workspace', 'other-user', content.from),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a changed sender address without sending', async () => {
    await expect(
      service.send('workspace', 'owner', 'account', {
        ...content,
        from: 'other@example.com',
      }),
    ).rejects.toThrow('발신 계정');
    expect(outbound.sendMessage).not.toHaveBeenCalled();
  });
});
