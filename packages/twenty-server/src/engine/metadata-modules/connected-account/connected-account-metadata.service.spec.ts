import { ConnectedAccountProvider } from 'twenty-shared/types';
import { type Repository } from 'typeorm';

import { ConnectedAccountMetadataService } from './connected-account-metadata.service';
import { ConnectedAccountEntity } from './entities/connected-account.entity';
import { MessageChannelEntity } from 'src/engine/metadata-modules/message-channel/entities/message-channel.entity';
import { CalendarChannelEntity } from 'src/engine/metadata-modules/calendar-channel/entities/calendar-channel.entity';

// The transaction boundary is mocked; assertions cover preservation and the
// deletion events that initiate asynchronous workspace cleanup.
describe('Connected account data retention', () => {
  const account = {
    id: 'account',
    workspaceId: 'workspace',
    userWorkspaceId: 'owner',
    provider: ConnectedAccountProvider.GOOGLE,
    archivedAt: null as Date | null,
  };
  const manager = {
    findOneOrFail: jest.fn(),
    update: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  };
  const repository = {
    manager: { transaction: jest.fn(async (callback) => callback(manager)) },
    findOneOrFail: jest.fn(),
    delete: jest.fn(),
  };
  const emitter = { emitCustomBatchEvent: jest.fn() };
  const service = new ConnectedAccountMetadataService(
    repository as unknown as Repository<ConnectedAccountEntity>,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    emitter as never,
    {} as never,
  );
  const input = { id: 'account', workspaceId: 'workspace' };

  beforeEach(() => {
    jest.clearAllMocks();
    account.archivedAt = null;
    manager.findOneOrFail.mockResolvedValue(account);
    repository.findOneOrFail.mockResolvedValue(account);
    manager.find.mockImplementation(async (entity) => [
      {
        id:
          entity === MessageChannelEntity ? 'mail-channel' : 'calendar-channel',
      },
    ]);
  });

  it('disconnects through the old delete API without deleting channels or emitting cleanup events', async () => {
    await service.delete(input);
    expect(manager.update).toHaveBeenCalledWith(
      ConnectedAccountEntity,
      input,
      expect.objectContaining({
        archivedAt: expect.any(Date),
        accessToken: null,
        refreshToken: null,
        connectionParameters: null,
      }),
    );
    for (const entity of [MessageChannelEntity, CalendarChannelEntity]) {
      expect(manager.update).toHaveBeenCalledWith(
        entity,
        { connectedAccountId: 'account', workspaceId: 'workspace' },
        { isSyncEnabled: false },
      );
    }
    expect(manager.delete).not.toHaveBeenCalled();
    expect(repository.delete).not.toHaveBeenCalled();
    expect(emitter.emitCustomBatchEvent).not.toHaveBeenCalled();
  });

  it('preserves the original disconnect date when repeated', async () => {
    account.archivedAt = new Date('2026-10-01T00:00:00Z');
    await service.disconnect(input);
    expect(manager.update).toHaveBeenCalledWith(
      ConnectedAccountEntity,
      input,
      expect.objectContaining({ archivedAt: account.archivedAt }),
    );
  });

  it('rejects purging an active account before touching data', async () => {
    await expect(service.purgeDisconnectedData(input)).rejects.toThrow();
    expect(manager.delete).not.toHaveBeenCalled();
    expect(emitter.emitCustomBatchEvent).not.toHaveBeenCalled();
  });

  it('purges only channels in the current workspace and retains the account history', async () => {
    account.archivedAt = new Date();
    await service.purgeDisconnectedData(input);
    expect(manager.findOneOrFail).toHaveBeenCalledWith(ConnectedAccountEntity, {
      where: input,
      lock: { mode: 'pessimistic_write' },
    });
    expect(manager.delete).toHaveBeenCalledTimes(2);
    expect(manager.delete).toHaveBeenCalledWith(MessageChannelEntity, {
      connectedAccountId: 'account',
      workspaceId: 'workspace',
    });
    expect(manager.delete).not.toHaveBeenCalledWith(
      ConnectedAccountEntity,
      expect.anything(),
    );
    expect(emitter.emitCustomBatchEvent).toHaveBeenCalledTimes(3);
  });

  it('does not emit cleanup events when the transaction fails', async () => {
    manager.findOneOrFail.mockRejectedValueOnce(
      new Error('not found in workspace'),
    );
    await expect(service.purgeDisconnectedData(input)).rejects.toThrow(
      'not found in workspace',
    );
    expect(emitter.emitCustomBatchEvent).not.toHaveBeenCalled();
  });
});
