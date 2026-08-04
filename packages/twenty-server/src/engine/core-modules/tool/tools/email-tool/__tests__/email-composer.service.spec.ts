import { ConnectedAccountProvider } from 'twenty-shared/types';

import { EmailComposerService } from 'src/engine/core-modules/tool/tools/email-tool/email-composer.service';

const WORKSPACE_ID = '20202020-0000-4000-8000-000000000000';
const CONNECTED_ACCOUNT_ID = '20202020-1111-4111-8111-111111111111';
const OTHER_CONNECTED_ACCOUNT_ID = '20202020-2222-4222-8222-222222222222';
const USER_WORKSPACE_ID = '20202020-3333-4333-8333-333333333333';
const OTHER_USER_WORKSPACE_ID = '20202020-4444-4444-8444-444444444444';

const buildAccount = ({
  id,
  userWorkspaceId = USER_WORKSPACE_ID,
  visibility = 'user' as const,
}: {
  id: string;
  userWorkspaceId?: string;
  visibility?: 'user' | 'workspace';
}) => ({
  id,
  handle: 'tim@apple.dev',
  provider: ConnectedAccountProvider.GOOGLE,
  scopes: ['email'],
  connectionParameters: null,
  userWorkspaceId,
  visibility,
  messageChannels: [{ id: 'message-channel-1', handle: 'tim@apple.dev' }],
});

const baseParams = {
  recipients: { to: 'test@example.com' },
  subject: 'Subject',
  body: '<p>body</p>',
  files: [],
};

const context = {
  workspaceId: WORKSPACE_ID,
  userWorkspaceId: USER_WORKSPACE_ID,
};

describe('EmailComposerService connected account resolution', () => {
  let service: EmailComposerService;
  let connectedAccountRepository: {
    findOne: jest.Mock;
    find: jest.Mock;
  };
  let globalWorkspaceOrmManager: {
    executeInWorkspaceContext: jest.Mock;
    getRepository: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    connectedAccountRepository = { findOne: jest.fn(), find: jest.fn() };
    globalWorkspaceOrmManager = {
      executeInWorkspaceContext: jest.fn((callback) => callback()),
      getRepository: jest.fn(),
    };

    service = new EmailComposerService(
      globalWorkspaceOrmManager as never,
      connectedAccountRepository as never,
      { find: jest.fn() } as never,
      {} as never,
    );
  });

  it('uses the connected account matching the provided id', async () => {
    connectedAccountRepository.findOne.mockResolvedValue(
      buildAccount({ id: CONNECTED_ACCOUNT_ID }),
    );

    const result = await service.composeEmail(
      { ...baseParams, connectedAccountId: CONNECTED_ACCOUNT_ID },
      context,
    );

    expect(result.success).toBe(true);
    expect(result.success && result.data.connectedAccount.id).toBe(
      CONNECTED_ACCOUNT_ID,
    );
    expect(connectedAccountRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: CONNECTED_ACCOUNT_ID, workspaceId: WORKSPACE_ID },
      }),
    );
  });

  it('throws when the id is not a valid UUID', async () => {
    await expect(
      service.composeEmail(
        { ...baseParams, connectedAccountId: 'not-a-uuid' },
        context,
      ),
    ).rejects.toThrow('Connected account id is not a valid UUID');
  });

  it('throws when no connected account matches the provided id', async () => {
    connectedAccountRepository.findOne.mockResolvedValue(null);

    await expect(
      service.composeEmail(
        { ...baseParams, connectedAccountId: CONNECTED_ACCOUNT_ID },
        context,
      ),
    ).rejects.toThrow(`No connected account found for id`);
  });

  it('rejects another members private connected account', async () => {
    connectedAccountRepository.findOne.mockResolvedValue(
      buildAccount({
        id: OTHER_CONNECTED_ACCOUNT_ID,
        userWorkspaceId: OTHER_USER_WORKSPACE_ID,
        visibility: 'user',
      }),
    );

    await expect(
      service.composeEmail(
        { ...baseParams, connectedAccountId: OTHER_CONNECTED_ACCOUNT_ID },
        context,
      ),
    ).rejects.toThrow('does not belong to user workspace');
  });

  it('allows a workspace-visible connected account for another member', async () => {
    connectedAccountRepository.findOne.mockResolvedValue(
      buildAccount({
        id: OTHER_CONNECTED_ACCOUNT_ID,
        userWorkspaceId: OTHER_USER_WORKSPACE_ID,
        visibility: 'workspace',
      }),
    );

    const result = await service.composeEmail(
      { ...baseParams, connectedAccountId: OTHER_CONNECTED_ACCOUNT_ID },
      context,
    );

    expect(result.success).toBe(true);
    expect(result.success && result.data.connectedAccount.id).toBe(
      OTHER_CONNECTED_ACCOUNT_ID,
    );
  });

  it('rejects a private connected account when userWorkspaceId is missing', async () => {
    connectedAccountRepository.findOne.mockResolvedValue(
      buildAccount({
        id: CONNECTED_ACCOUNT_ID,
        visibility: 'user',
      }),
    );

    await expect(
      service.composeEmail(
        { ...baseParams, connectedAccountId: CONNECTED_ACCOUNT_ID },
        { workspaceId: WORKSPACE_ID },
      ),
    ).rejects.toThrow('is not workspace-visible');
  });

  it('falls back to the callers first owned account when id is omitted', async () => {
    connectedAccountRepository.find
      .mockResolvedValueOnce([buildAccount({ id: CONNECTED_ACCOUNT_ID })])
      .mockResolvedValueOnce([]);
    connectedAccountRepository.findOne.mockResolvedValue(
      buildAccount({ id: CONNECTED_ACCOUNT_ID }),
    );

    const result = await service.composeEmail(baseParams, context);

    expect(result.success).toBe(true);
    expect(result.success && result.data.connectedAccount.id).toBe(
      CONNECTED_ACCOUNT_ID,
    );
    expect(connectedAccountRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          workspaceId: WORKSPACE_ID,
          userWorkspaceId: USER_WORKSPACE_ID,
        }),
      }),
    );
  });

  it('falls back to a workspace-visible account when the caller has none', async () => {
    connectedAccountRepository.find
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        buildAccount({
          id: OTHER_CONNECTED_ACCOUNT_ID,
          userWorkspaceId: OTHER_USER_WORKSPACE_ID,
          visibility: 'workspace',
        }),
      ]);
    connectedAccountRepository.findOne.mockResolvedValue(
      buildAccount({
        id: OTHER_CONNECTED_ACCOUNT_ID,
        userWorkspaceId: OTHER_USER_WORKSPACE_ID,
        visibility: 'workspace',
      }),
    );

    const result = await service.composeEmail(baseParams, context);

    expect(result.success).toBe(true);
    expect(result.success && result.data.connectedAccount.id).toBe(
      OTHER_CONNECTED_ACCOUNT_ID,
    );
  });
});
