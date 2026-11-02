import { validate } from 'class-validator';
import { type Repository } from 'typeorm';
import { type CampaignDraftService } from 'src/modules/emailing/drafts/campaign-draft.service';
import { type GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { type MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { type GaingeSmsService } from '../gainge-sms.service';
import { type SmsDispatchEntity } from '../sms-dispatch.entity';
import { SmsPreviewInput } from '../sms.dto';
import { SmsService } from '../sms.service';

jest.mock(
  'src/engine/twenty-orm/storage/orm-workspace-context.storage',
  () => ({ getWorkspaceContext: () => ({}) }),
);
jest.mock(
  'src/engine/twenty-orm/utils/resolve-role-permission-config.util',
  () => ({
    resolveRolePermissionConfig: () => ({ intersectionOf: ['sender'] }),
  }),
);

describe('direct SMS dispatch', () => {
  const getRepository = jest.fn();
  const add = jest.fn();
  const claim = jest.fn();
  const findExisting = jest.fn();
  const insert = {
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    orIgnore: jest.fn().mockReturnThis(),
    execute: jest.fn(),
  };
  const findSaved = jest.fn();
  const service = new SmsService(
    {
      findOneBy: findExisting,
      createQueryBuilder: () => insert,
      findOneByOrFail: findSaved,
    } as unknown as Repository<SmsDispatchEntity>,
    {
      executeInWorkspaceContext: (callback: () => unknown) => callback(),
      getRepository,
    } as unknown as GlobalWorkspaceOrmManager,
    {
      settings: () => ({ endpoint: 'https://sms.example.test' }),
    } as unknown as GaingeSmsService,
    { add } as unknown as MessageQueueService,
    { claim } as unknown as CampaignDraftService,
  );
  const input = {
    subject: '',
    content: '안녕하세요\n직접 입력입니다.',
    advertising: false,
    directPhones: ['01012345678'],
  };
  beforeEach(() => {
    jest.clearAllMocks();
    findExisting.mockResolvedValue(null);
    findSaved.mockImplementation(async () => ({
      ...insert.values.mock.calls[0][0],
      createdAt: new Date(),
    }));
  });

  it('normalizes, removes duplicates and excludes invalid phones without reading a customer list', async () => {
    const result = await service.preview('workspace', {
      ...input,
      directPhones: ['010-1234-5678', '+82 10 1234 5678', 'bad', '01023456789'],
    });
    expect(result).toMatchObject({
      total: 4,
      missing: 1,
      duplicates: 1,
      sms: 2,
      lms: 0,
      sample: input.content,
    });
    expect(result.targets.map((target) => target.to)).toEqual([
      '01012345678',
      '01023456789',
    ]);
    expect(
      result.targets.every(
        (target) => target.personId === undefined && target.name === '',
      ),
    ).toBe(true);
    expect(getRepository).not.toHaveBeenCalled();
  });

  it.each([
    {},
    { directPhones: [] },
    { listId: 'list', directPhones: ['01012345678'] },
    { directPhones: Array(101).fill('01012345678') },
  ])(
    'rejects ambiguous, absent or excessive targets: %j',
    async (recipients) => {
      await expect(
        service.preview('workspace', {
          subject: '',
          content: '테스트',
          advertising: false,
          ...recipients,
        }),
      ).rejects.toThrow();
    },
  );

  it.each([
    '{{fullName}}님',
    '{{companyName}} 안내',
    '[*이름*]님',
    '[*1*] 안내',
  ])('rejects unresolved personalization: %s', async (content) => {
    await expect(
      service.preview('workspace', { ...input, content }),
    ).rejects.toThrow('고객 이름·기업 변수');
  });

  it('retains advertising and rendered length validation', async () => {
    await expect(
      service.preview('workspace', { ...input, advertising: true }),
    ).rejects.toThrow('080');
    await expect(
      service.preview('workspace', { ...input, content: '가'.repeat(667) }),
    ).rejects.toThrow('2,000');
    expect(
      await service.preview('workspace', { ...input, subject: '제목' }),
    ).toMatchObject({ sms: 0, lms: 1 });
  });

  it('revalidates targets, stores history without a list and retries the same request without another dispatch', async () => {
    const request = {
      ...input,
      requestId: 'request',
      directPhones: ['01012345678', 'invalid', '+821012345678'],
    };
    const result = await service.send('workspace', 'sender', request);
    expect(result).toMatchObject({ queued: 1 });
    expect(claim).toHaveBeenCalledWith(
      'workspace',
      undefined,
      'sms',
      'request',
      { subject: '문자 발송', bodyTemplate: input.content, listId: null },
    );
    const saved = insert.values.mock.calls[0][0];
    expect(saved.listId).toBeNull();
    expect(saved.batches[0].targets).toHaveLength(1);
    expect(saved.batches[0].targets[0]).toMatchObject({ to: '01012345678' });
    findExisting.mockResolvedValue({ ...saved, createdAt: new Date() });
    await service.send('workspace', 'sender', request);
    expect(insert.execute).toHaveBeenCalledTimes(1);
    expect(claim).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledTimes(2);
  });

  it('does not persist or enqueue an invalid-only direct audience', async () => {
    await expect(
      service.send('workspace', 'sender', {
        ...input,
        requestId: 'request',
        directPhones: ['bad'],
      }),
    ).rejects.toThrow('발송 가능한');
    expect(insert.execute).not.toHaveBeenCalled();
    expect(add).not.toHaveBeenCalled();
  });

  it('validates direct phone array types and individual input lengths at the API boundary', async () => {
    expect(
      await validate(Object.assign(new SmsPreviewInput(), input)),
    ).toHaveLength(0);
    for (const directPhones of ['01012345678', [123], ['1'.repeat(51)]]) {
      expect(
        (
          await validate(
            Object.assign(new SmsPreviewInput(), { ...input, directPhones }),
          )
        ).length,
      ).toBeGreaterThan(0);
    }
  });
});
