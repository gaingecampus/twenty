import { getWorkspaceContext } from 'src/engine/twenty-orm/storage/orm-workspace-context.storage';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';

import { MessageCampaignService } from 'src/modules/emailing/services/message-campaign.service';
import { MessageCampaignWorkspaceEntity } from 'src/modules/emailing/standard-objects/message-campaign.workspace-entity';
import { MessageListMemberWorkspaceEntity } from 'src/modules/emailing/standard-objects/message-list-member.workspace-entity';
import { PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';
import { MessageWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message.workspace-entity';
import {
  EmailingDomainDriverException,
  EmailingDomainDriverExceptionCode,
} from 'src/engine/core-modules/emailing-domain/drivers/exceptions/emailing-domain-driver.exception';

jest.mock(
  'src/engine/twenty-orm/storage/orm-workspace-context.storage',
  () => ({
    getWorkspaceContext: jest.fn(),
  }),
);

describe('Campaign scheduling and delivery guards', () => {
  const now = new Date('2026-10-08T01:00:00.000Z');
  const campaign = {
    findOne: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  };
  const messages = {
    find: jest.fn(),
    insert: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  };
  const associations = { update: jest.fn(), insert: jest.fn() };
  const people = { find: jest.fn(), findOne: jest.fn() };
  const members = { find: jest.fn() };
  const domains = { findOne: jest.fn() };
  const sender = { sendEmail: jest.fn() };
  const queue = { add: jest.fn() };
  const channels = { getOrCreateEmailGroupChannel: jest.fn() };
  const transactionManager = {};
  const transaction = jest.fn(async (callback) => callback(transactionManager));
  const orm = {
    executeInWorkspaceContext: jest.fn(async (callback) => callback()),
    getGlobalWorkspaceDataSource: jest.fn(async () => ({ transaction })),
    getRepository: jest.fn(async (_workspaceId, entity) => {
      if (entity === MessageCampaignWorkspaceEntity) return campaign;
      if (entity === MessageWorkspaceEntity) return messages;
      if (entity === MessageListMemberWorkspaceEntity) return members;
      if (entity === PersonWorkspaceEntity) return people;
      return associations;
    }),
  };
  const service = new MessageCampaignService(
    domains as unknown as ConstructorParameters<
      typeof MessageCampaignService
    >[0],
    sender as unknown as ConstructorParameters<
      typeof MessageCampaignService
    >[1],
    orm as unknown as ConstructorParameters<typeof MessageCampaignService>[2],
    queue as unknown as ConstructorParameters<typeof MessageCampaignService>[3],
    channels as unknown as ConstructorParameters<
      typeof MessageCampaignService
    >[4],
    {} as ConstructorParameters<typeof MessageCampaignService>[5],
  );
  const input = {
    workspaceId: 'workspace',
    userWorkspaceId: 'user',
    listId: 'list',
    fromAddress: 'sender@example.com',
    subject: 'Hello',
    html: '<p>Hello</p>',
    scheduledAt: '2026-10-08T11:00:00+09:00',
  };
  const materializeJob = {
    workspaceId: 'workspace',
    campaignId: 'campaign',
    scheduleVersion: 'revision',
    messageChannelId: 'channel',
    emailingDomainId: 'domain',
    recipients: [],
  };
  const sendJob = {
    workspaceId: 'workspace',
    campaignId: 'campaign',
    messageId: 'message',
    personId: 'person',
    recipientEmail: 'recipient@example.com',
    emailingDomainId: 'domain',
  };

  it('passes the caller role to customer and campaign repositories', async () => {
    await service.send(input);

    for (const entity of [
      MessageListMemberWorkspaceEntity,
      PersonWorkspaceEntity,
      MessageCampaignWorkspaceEntity,
    ]) {
      expect(orm.getRepository).toHaveBeenCalledWith('workspace', entity, {
        intersectionOf: ['caller-role'],
      });
    }
  });

  it('rejects an unresolved caller role before querying customers or queuing', async () => {
    jest.mocked(getWorkspaceContext).mockReturnValue({
      authContext: { type: 'user', userWorkspaceId: 'unknown-user' },
      userWorkspaceRoleMap: {},
      apiKeyRoleMap: {},
    } as unknown as ReturnType<typeof getWorkspaceContext>);

    await expect(service.send(input)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(people.find).not.toHaveBeenCalled();
    expect(queue.add).not.toHaveBeenCalled();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getWorkspaceContext).mockReturnValue({
      authContext: { type: 'user', userWorkspaceId: 'user' },
      userWorkspaceRoleMap: { user: 'caller-role' },
      apiKeyRoleMap: {},
    } as unknown as ReturnType<typeof getWorkspaceContext>);
    jest.spyOn(Date, 'now').mockReturnValue(now.getTime());
    domains.findOne.mockResolvedValue({ id: 'domain' });
    channels.getOrCreateEmailGroupChannel.mockResolvedValue({ id: 'channel' });
    members.find.mockResolvedValue([{ personId: 'person' }]);
    people.find.mockResolvedValue([
      { id: 'person', emails: { primaryEmail: 'recipient@example.com' } },
    ]);
    people.findOne.mockResolvedValue({ name: { firstName: 'Customer' } });
    campaign.insert.mockResolvedValue({ identifiers: [{ id: 'campaign' }] });
    campaign.update.mockResolvedValue({ affected: 1 });
    queue.add.mockResolvedValue(undefined);
    messages.find.mockResolvedValue([]);
    messages.update.mockResolvedValue({ affected: 1 });
    messages.count.mockResolvedValue(0);
    sender.sendEmail.mockResolvedValue({ messageId: 'provider-message' });
    campaign.findOne.mockResolvedValue({
      id: 'campaign',
      status: 'SENDING',
      subject: 'Hello',
      bodyTemplate: '<p>Hello</p>',
      fromAddress: { primaryEmail: 'sender@example.com' },
      unsubscribeTopicId: 'topic',
    });
    messages.findOne.mockResolvedValue({
      id: 'message',
      deliveryStatus: 'QUEUED',
    });
  });
  afterEach(() => jest.restoreAllMocks());

  it.each([
    '2026-10-08T00:59:00Z',
    '2026-10-08T01:00:30Z',
    'invalid',
    '2026-10-08T11:00:00',
  ])(
    'rejects a past, too-close, invalid or timezone-less date: %s',
    async (scheduledAt) => {
      await expect(
        service.send({ ...input, scheduledAt }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(queue.add).not.toHaveBeenCalled();
    },
  );

  it('stores UTC time and a revision and defers delivery without sending', async () => {
    await service.send(input);
    expect(campaign.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'SCHEDULED',
        scheduledAt: new Date('2026-10-08T02:00:00Z'),
        scheduleVersion: expect.any(String),
      }),
      transactionManager,
    );
    expect(queue.add).toHaveBeenCalledWith(
      'MaterializeCampaignJob',
      expect.objectContaining({ scheduleVersion: expect.any(String) }),
      { retryLimit: 3, delay: 3600000 },
    );
    expect(sender.sendEmail).not.toHaveBeenCalled();
  });

  it.each([input.scheduledAt, undefined])(
    'propagates enqueue failure out of the transaction for send time %s',
    async (scheduledAt) => {
      queue.add.mockRejectedValueOnce(new Error('queue unavailable'));
      await expect(service.send({ ...input, scheduledAt })).rejects.toThrow(
        'queue unavailable',
      );
      await expect(transaction.mock.results[0].value).rejects.toThrow(
        'queue unavailable',
      );
    },
  );

  it('requires the current revision and scheduled state when editing', async () => {
    campaign.update.mockResolvedValueOnce({ affected: 0 });
    await expect(
      service.send({
        ...input,
        campaignId: 'campaign',
        scheduleVersion: 'stale',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('cancels only a pending reservation with the matching revision', async () => {
    await service.cancelSchedule('workspace', 'campaign', 'revision');
    expect(campaign.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'campaign',
        status: 'SCHEDULED',
        scheduleVersion: 'revision',
      }),
      { status: 'CANCELLED', scheduleVersion: null },
    );
    expect(sender.sendEmail).not.toHaveBeenCalled();
  });

  it('rejects cancelling a reservation already claimed or edited', async () => {
    campaign.update.mockResolvedValueOnce({ affected: 0 });
    await expect(
      service.cancelSchedule('workspace', 'campaign', 'revision'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it.each([
    { status: 'CANCELLED', scheduleVersion: null },
    { status: 'SCHEDULED', scheduleVersion: 'new-revision' },
    { status: 'SENT', scheduleVersion: 'revision' },
  ])('ignores obsolete jobs: %o', async (record) => {
    campaign.findOne.mockResolvedValueOnce(record);
    await service.processMaterializeJob(materializeJob);
    expect(queue.add).not.toHaveBeenCalled();
    expect(campaign.update).not.toHaveBeenCalled();
  });

  it('does not run a scheduled job before the due time', async () => {
    campaign.findOne.mockResolvedValueOnce({
      status: 'SCHEDULED',
      scheduleVersion: 'revision',
      scheduledAt: new Date(now.getTime() + 60000),
    });
    await expect(service.processMaterializeJob(materializeJob)).rejects.toThrow(
      'not due',
    );
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('claims a due schedule before creating recipient jobs', async () => {
    campaign.findOne.mockResolvedValueOnce({
      id: 'campaign',
      status: 'SCHEDULED',
      scheduleVersion: 'revision',
      scheduledAt: new Date(now.getTime() - 1000),
      subject: 'Subject',
      bodyTemplate: 'Body',
      fromAddress: { primaryEmail: 'sender@example.com' },
    });
    await service.processMaterializeJob({
      ...materializeJob,
      recipients: [{ personId: 'person', email: 'recipient@example.com' }],
    });
    expect(campaign.update).toHaveBeenCalledWith(
      { id: 'campaign', status: 'SCHEDULED', scheduleVersion: 'revision' },
      { status: 'SENDING' },
    );
    expect(queue.add).toHaveBeenCalledWith(
      'SendCampaignEmailJob',
      expect.objectContaining({ recipientEmail: 'recipient@example.com' }),
      expect.anything(),
    );
    expect(sender.sendEmail).not.toHaveBeenCalled();
  });

  it('abandons a due job if cancellation wins the state transition', async () => {
    campaign.findOne.mockResolvedValueOnce({
      status: 'SCHEDULED',
      scheduleVersion: 'revision',
      scheduledAt: new Date(now.getTime() - 1000),
    });
    campaign.update.mockResolvedValueOnce({ affected: 0 });
    await service.processMaterializeJob(materializeJob);
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('replaces a schedule using a new revision and updated content', async () => {
    await service.send({
      ...input,
      campaignId: 'campaign',
      scheduleVersion: 'previous',
      subject: 'Updated content',
    });
    expect(campaign.update).toHaveBeenCalledWith(
      expect.objectContaining({
        scheduleVersion: 'previous',
        status: 'SCHEDULED',
      }),
      expect.objectContaining({
        subject: 'Updated content',
        scheduleVersion: expect.not.stringMatching(/^previous$/),
      }),
      undefined,
      transactionManager,
    );
    expect(queue.add).toHaveBeenCalledTimes(1);
  });

  it('does not send when another worker already claimed the recipient', async () => {
    messages.update.mockResolvedValueOnce({ affected: 0 });
    await service.processSendJob(sendJob);
    expect(sender.sendEmail).not.toHaveBeenCalled();
  });

  it('checks current suppression through the sender and records skipped delivery', async () => {
    sender.sendEmail.mockRejectedValueOnce(
      new EmailingDomainDriverException(
        'suppressed',
        EmailingDomainDriverExceptionCode.ALL_RECIPIENTS_SUPPRESSED,
      ),
    );
    await service.processSendJob(sendJob);
    expect(sender.sendEmail).toHaveBeenCalledWith(
      'workspace',
      'domain',
      expect.objectContaining({
        unsubscribeTopicId: 'topic',
        to: ['recipient@example.com'],
      }),
    );
    expect(messages.update).toHaveBeenCalledWith('message', {
      deliveryStatus: 'SKIPPED',
    });
  });

  it('does not automatically retry ambiguous provider failures', async () => {
    sender.sendEmail.mockRejectedValueOnce(
      new Error('timeout after acceptance'),
    );
    await service.processSendJob(sendJob);
    messages.findOne.mockResolvedValueOnce({ deliveryStatus: 'FAILED' });
    await service.processSendJob(sendJob);
    expect(sender.sendEmail).toHaveBeenCalledTimes(1);
  });
});
