import { MailboxService } from 'src/engine/metadata-modules/message-channel/mailbox.service';
import { STANDARD_ROLE } from 'src/engine/workspace-manager/twenty-standard-application/constants/standard-role.constant';

describe('MailboxService', () => {
  const channels = { findOne: jest.fn(), find: jest.fn() };
  const folders = { findOne: jest.fn(), find: jest.fn() };
  const userRoles = { getRolesByUserWorkspaces: jest.fn() };
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
    userRoles as unknown as ConstructorParameters<typeof MailboxService>[4],
  );
  const input = {
    workspaceId: 'workspace',
    userWorkspaceId: 'me',
    channelId: 'channel',
    page: 0,
  };
  beforeEach(() => {
    jest.clearAllMocks();
    userRoles.getRolesByUserWorkspaces.mockResolvedValue(new Map());
    channels.findOne.mockResolvedValue({
      type: 'EMAIL',
      connectedAccountId: 'mine',
    });
    accounts.getUserConnectedAccountIds.mockResolvedValue(['mine']);
    folders.findOne.mockResolvedValue({ id: 'folder' });
    messages.find.mockResolvedValue([]);
    folders.find.mockResolvedValue([]);
  });

  const makeAdmin = () => {
    userRoles.getRolesByUserWorkspaces.mockResolvedValue(
      new Map([
        [
          'me',
          [{ universalIdentifier: STANDARD_ROLE.admin.universalIdentifier }],
        ],
      ]),
    );
  };

  it('lists all email channels in the current workspace for administrators', async () => {
    makeAdmin();
    channels.find.mockResolvedValue([{ id: 'other-channel' }]);
    await expect(service.findChannels('workspace', 'me')).resolves.toEqual([
      { id: 'other-channel' },
    ]);
    expect(channels.find).toHaveBeenCalledWith({
      where: { workspaceId: 'workspace', type: 'EMAIL' },
      order: { handle: 'ASC', id: 'ASC' },
    });
    expect(accounts.getUserConnectedAccountIds).toHaveBeenCalledWith({
      workspaceId: 'workspace',
      userWorkspaceId: 'me',
    });
  });

  it('prioritizes the administrators own accounts while retaining other accounts', async () => {
    makeAdmin();
    const other = { id: 'a', connectedAccountId: 'other' };
    const ownFirst = { id: 'b', connectedAccountId: 'mine' };
    const ownSecond = { id: 'c', connectedAccountId: 'mine' };
    channels.find.mockResolvedValue([other, ownFirst, ownSecond]);

    expect(await service.findChannels('workspace', 'me')).toEqual([
      ownFirst,
      ownSecond,
      other,
    ]);
  });

  it('retains the address order for administrators without a connected account', async () => {
    makeAdmin();
    accounts.getUserConnectedAccountIds.mockResolvedValue([]);
    const available = [
      { id: 'a', connectedAccountId: 'other-a' },
      { id: 'b', connectedAccountId: 'other-b' },
    ];
    channels.find.mockResolvedValue(available);

    expect(await service.findChannels('workspace', 'me')).toEqual(available);
  });

  it('allows an administrator to read another account and its folders', async () => {
    makeAdmin();
    channels.findOne.mockResolvedValue({
      type: 'EMAIL',
      connectedAccountId: 'other',
    });
    await service.findMessages(input);
    await service.findFolders('workspace', 'me', 'channel');
    expect(messages.find).toHaveBeenCalled();
    expect(folders.find).toHaveBeenCalledWith({
      where: { workspaceId: 'workspace', messageChannelId: 'channel' },
      order: { name: 'ASC', id: 'ASC' },
    });
    expect(channels.findOne).toHaveBeenCalledWith({
      where: { id: 'channel', workspaceId: 'workspace' },
    });
  });

  it('does not grant another workspace administrator access', async () => {
    makeAdmin();
    channels.findOne.mockResolvedValue(null);
    await expect(service.findMessages(input)).rejects.toThrow(
      'Mailbox access denied',
    );
    expect(messages.find).not.toHaveBeenCalled();
  });

  it('keeps other users folders private for ordinary members', async () => {
    channels.findOne.mockResolvedValue({
      type: 'EMAIL',
      connectedAccountId: 'other',
    });
    await expect(
      service.findFolders('workspace', 'me', 'channel'),
    ).rejects.toThrow('Mailbox access denied');
    expect(folders.find).not.toHaveBeenCalled();
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
