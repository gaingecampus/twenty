import { SmsService } from '../sms.service';
import { SmsDispatchEntity, type SmsBatch } from '../sms-dispatch.entity';
import { type Repository } from 'typeorm';
import { type GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { type PpurioService } from '../ppurio.service';
import { type MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';

jest.mock(
  'src/engine/twenty-orm/storage/orm-workspace-context.storage',
  () => ({ getWorkspaceContext: () => ({}) }),
);
jest.mock(
  'src/engine/twenty-orm/utils/resolve-role-permission-config.util',
  () => ({
    resolveRolePermissionConfig: () => ({
      shouldBypassPermissionChecks: false,
    }),
  }),
);

describe('durable SMS dispatch worker', () => {
  let service: SmsService;
  const batch = (status: SmsBatch['status']): SmsBatch => ({
    status,
    refKey: 'ref',
    targets: [
      {
        to: '01012345678',
        name: '테스트',
        content: 'hello',
        messageType: 'SMS',
      },
    ],
  });
  const send = jest.fn();
  const add = jest.fn();
  const save = jest.fn();
  const query = jest.fn();
  const release = jest.fn();
  let row: SmsDispatchEntity;
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    row = Object.assign(new SmsDispatchEntity(), {
      id: 'dispatch',
      workspaceId: 'workspace',
      userWorkspaceId: 'user',
      status: 'QUEUED',
      createdAt: new Date(),
      batches: [batch('QUEUED')],
      from: '0212345678',
      subject: 'test',
      advertising: false,
    });
    query.mockResolvedValue([{ locked: true }]);
    save.mockResolvedValue(row);
    send.mockResolvedValue({ status: 'ACCEPTED', messageKey: 'message' });
    const repository = {
      manager: {
        connection: {
          createQueryRunner: () => ({ connect: jest.fn(), query, release }),
        },
      },
      findOneBy: jest.fn(async () => row),
      save,
    } as unknown as Repository<SmsDispatchEntity>;
    service = new SmsService(
      repository,
      {} as GlobalWorkspaceOrmManager,
      { send } as unknown as PpurioService,
      { add } as unknown as MessageQueueService,
    );
  });
  it('marks before external send and never sends accepted batches again', async () => {
    send.mockImplementation(async () => {
      expect(row.batches[0].status).toBe('SENDING');
      expect(save).toHaveBeenCalled();
      return { status: 'ACCEPTED' };
    });
    await service.process('workspace', 'dispatch');
    await service.process('workspace', 'dispatch');
    expect(send).toHaveBeenCalledTimes(1);
    expect(row.status).toBe('FINISHED');
    expect(release).toHaveBeenCalledTimes(2);
  });
  it('does not resend a batch interrupted after the network boundary', async () => {
    row.batches = [batch('SENDING')];
    await service.process('workspace', 'dispatch');
    expect(send).not.toHaveBeenCalled();
    expect(row.batches[0].status).toBe('UNKNOWN');
  });
  it('runs only one batch per queue job and enqueues remaining work', async () => {
    row.batches = [batch('QUEUED'), batch('QUEUED')];
    await service.process('workspace', 'dispatch');
    expect(send).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledTimes(1);
    expect(row.batches[1].status).toBe('QUEUED');
  });
  it('defers concurrent workers without making API calls', async () => {
    query.mockResolvedValueOnce([{ locked: false }]);
    await service.process('workspace', 'dispatch');
    expect(send).not.toHaveBeenCalled();
    expect(add).toHaveBeenCalledWith(
      'SendSmsDispatchJob',
      { workspaceId: 'workspace', dispatchId: 'dispatch' },
      { retryLimit: 3, delay: 1000 },
    );
    expect(release).toHaveBeenCalled();
  });
});

describe('SMS recipient preview', () => {
  it('scopes queries, deduplicates phones and renders customer variables', async () => {
    const getRepository = jest
      .fn()
      .mockResolvedValueOnce({ findOne: async () => ({ id: 'list' }) })
      .mockResolvedValueOnce({
        find: async () => [
          { personId: 'a' },
          { personId: 'b' },
          { personId: 'c' },
          { workspaceMemberId: 'member' },
        ],
      })
      .mockResolvedValueOnce({
        find: async () => [
          {
            name: { firstName: '루나' },
            phones: { primaryPhoneNumber: '010-1234-5678' },
            company: { name: '가인지' },
          },
          {
            name: { firstName: '중복' },
            phones: { primaryPhoneNumber: '+821012345678' },
          },
          { name: { firstName: '없음' }, phones: { primaryPhoneNumber: '' } },
        ],
      });
    const orm = {
      executeInWorkspaceContext: (callback: () => unknown) => callback(),
      getRepository,
    } as unknown as GlobalWorkspaceOrmManager;
    const service = new SmsService(
      {} as Repository<SmsDispatchEntity>,
      orm,
      {} as PpurioService,
      {} as MessageQueueService,
    );
    const result = await service.preview('workspace', {
      listId: 'list',
      content: '{{fullName}} {{companyName}}',
      advertising: false,
    });
    expect(result).toMatchObject({
      total: 4,
      missing: 2,
      duplicates: 1,
      sms: 1,
      lms: 0,
      sample: '루나 가인지',
    });
    expect(result.targets[0]).toMatchObject({
      to: '01012345678',
      name: '루나',
      company: '가인지',
    });
    expect(
      getRepository.mock.calls.every((call) => call[0] === 'workspace'),
    ).toBe(true);
  });
});
