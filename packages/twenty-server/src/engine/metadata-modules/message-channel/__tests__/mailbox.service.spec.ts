import { MailboxService } from 'src/engine/metadata-modules/message-channel/mailbox.service';

describe('MailboxService', () => {
  const channels = { findOne: jest.fn(), find: jest.fn() };
  const folders = { findOne: jest.fn() };
  const accounts = { getUserConnectedAccountIds: jest.fn() };
  const messages = { find: jest.fn() };
  const orm = {
    getRepository: jest.fn().mockResolvedValue(messages),
    executeInWorkspaceContext: jest.fn((callback: () => unknown) => callback()),
  };
  const service = new MailboxService(
    channels as unknown as ConstructorParameters<typeof MailboxService>[0],
    folders as unknown as ConstructorParameters<typeof MailboxService>[1],
    accounts as unknown as ConstructorParameters<typeof MailboxService>[2],
    orm as unknown as ConstructorParameters<typeof MailboxService>[3],
  );
  const input = {
    workspaceId: 'workspace',
    userWorkspaceId: 'me',
    channelId: 'channel',
    page: 0,
  };
  beforeEach(() => {
    jest.clearAllMocks();
    channels.findOne.mockResolvedValue({
      type: 'EMAIL',
      connectedAccountId: 'mine',
    });
    accounts.getUserConnectedAccountIds.mockResolvedValue(['mine']);
    folders.findOne.mockResolvedValue({ id: 'folder' });
    messages.find.mockResolvedValue([]);
  });
  it.each([
    null,
    { type: 'EMAIL', connectedAccountId: 'someone-else' },
    { type: 'EMAIL_GROUP', connectedAccountId: 'mine' },
  ])('rejects unavailable, other-user and shared channels', async (channel) => {
    channels.findOne.mockResolvedValue(channel);
    await expect(service.findMessages(input)).rejects.toThrow(
      'Mailbox access denied',
    );
    expect(orm.getRepository).not.toHaveBeenCalled();
  });
  it('rejects a folder outside the selected account before reading messages', async () => {
    folders.findOne.mockResolvedValue(null);
    await expect(
      service.findMessages({ ...input, folderId: 'foreign' }),
    ).rejects.toThrow('Mailbox folder access denied');
    expect(folders.findOne).toHaveBeenCalledWith({
      where: {
        id: 'foreign',
        messageChannelId: 'channel',
        workspaceId: 'workspace',
      },
    });
    expect(orm.getRepository).not.toHaveBeenCalled();
  });
  it('constrains messages to the channel and folder and paginates deterministically', async () => {
    messages.find.mockResolvedValue(
      Array.from({ length: 31 }, (_, index) => ({
        id: `${index}`,
        messageParticipants: [],
      })),
    );
    const result = await service.findMessages({
      ...input,
      folderId: 'folder',
      page: 2,
    });
    expect(messages.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          messageChannelMessageAssociations: {
            messageChannelId: 'channel',
            messageFolders: { messageFolderId: 'folder' },
          },
        },
        skip: 60,
        take: 31,
        order: { receivedAt: 'DESC', id: 'DESC' },
      }),
    );
    expect(result.messages).toHaveLength(30);
    expect(result.hasMore).toBe(true);
  });
  it('does not query channels if the current user has no accounts', async () => {
    accounts.getUserConnectedAccountIds.mockResolvedValue([]);
    expect(await service.findChannels('workspace', 'me')).toEqual([]);
    expect(channels.find).not.toHaveBeenCalled();
  });
  it.each([-1, 1.5, 10001])('rejects invalid pagination %s', async (page) => {
    await expect(service.findMessages({ ...input, page })).rejects.toThrow(
      'Invalid mailbox page',
    );
    expect(messages.find).not.toHaveBeenCalled();
  });
  it('returns an empty final page without claiming more messages', async () => {
    expect(await service.findMessages(input)).toEqual({
      messages: [],
      hasMore: false,
    });
  });
});
