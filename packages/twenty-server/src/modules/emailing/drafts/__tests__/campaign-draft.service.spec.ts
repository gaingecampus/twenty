import { type GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { type CampaignAttachmentsService } from 'src/modules/emailing/services/campaign-attachments.service';
import { type CampaignDraft } from 'twenty-shared/types';
import { CampaignDraftService } from '../campaign-draft.service';

jest.mock(
  'src/engine/twenty-orm/storage/orm-workspace-context.storage',
  () => ({
    getWorkspaceContext: () => ({}),
  }),
);
jest.mock(
  'src/engine/twenty-orm/utils/resolve-role-permission-config.util',
  () => ({
    resolveRolePermissionConfig: () => ({ unionOf: ['role'] }),
  }),
);

const content: CampaignDraft = {
  channel: 'email',
  sendMode: 'immediate',
  scheduledAt: null,
  unsubscribeTopicId: null,
  recipientMode: 'direct',
  listId: null,
  directRecipient: 'unfinished@',
  subject: '',
  body: '',
  fromAddress: '',
  files: [],
  includeSignature: true,
  advertising: false,
  couponMode: 'SIMULATION',
  productId: '',
  scenario: 'SUCCESS',
};

describe('campaign drafts', () => {
  const findOne = jest.fn();
  const insert = jest.fn();
  const update = jest.fn();
  const retain = jest.fn();
  const getRepository = jest.fn();
  let service: CampaignDraftService;
  beforeEach(() => {
    jest.clearAllMocks();
    findOne.mockResolvedValue(null);
    update.mockResolvedValue({ affected: 1 });
    getRepository.mockResolvedValue({ findOne, insert, update });
    service = new CampaignDraftService(
      {
        executeInWorkspaceContext: (callback: () => unknown) => callback(),
        getRepository,
      } as unknown as GlobalWorkspaceOrmManager,
      { retain } as unknown as CampaignAttachmentsService,
    );
  });
  it.each(['email', 'sms', 'coupon'] as const)(
    'saves incomplete %s inputs without dispatch validation',
    async (channel) => {
      await expect(
        service.save('workspace', {
          id: 'id',
          version: 'new',
          content: { ...content, channel },
        }),
      ).resolves.toEqual({ id: 'id', version: 'new' });
      expect(insert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'id',
          status: 'DRAFT',
          subject: '제목 없는 초안',
          draftData: { ...content, channel },
        }),
      );
      expect(retain).toHaveBeenCalledWith('workspace', []);
      expect(getRepository).toHaveBeenCalledWith(
        'workspace',
        expect.anything(),
        { unionOf: ['role'] },
      );
    },
  );
  it('retains attachments and saves raw body and signature preference', async () => {
    const draft = {
      ...content,
      body: '<p>본문</p>',
      includeSignature: false,
      files: [{ id: 'file', name: '안내.pdf' }],
    };
    await service.save('workspace', {
      id: 'id',
      version: 'new',
      content: draft,
    });
    expect(retain).toHaveBeenCalledWith('workspace', draft.files);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        draftData: draft,
        bodyTemplate: draft.body,
        attachmentFiles: draft.files,
      }),
    );
  });
  it('updates the same draft using a version comparison', async () => {
    findOne.mockResolvedValue({ status: 'DRAFT', scheduleVersion: 'old' });
    await service.save('workspace', {
      id: 'id',
      previousVersion: 'old',
      version: 'new',
      content,
    });
    expect(update).toHaveBeenCalledWith(
      { id: 'id', status: 'DRAFT', scheduleVersion: 'old' },
      expect.objectContaining({ scheduleVersion: 'new' }),
    );
    expect(insert).not.toHaveBeenCalled();
  });
  it.each(['SENDING', 'SCHEDULED', 'SENT'])(
    'cannot overwrite a %s record',
    async (status) => {
      findOne.mockResolvedValue({ status, scheduleVersion: 'old' });
      await expect(
        service.save('workspace', {
          id: 'id',
          previousVersion: 'old',
          version: 'new',
          content,
        }),
      ).rejects.toThrow('다른 곳에서 변경');
      expect(update).not.toHaveBeenCalled();
      expect(retain).not.toHaveBeenCalled();
    },
  );
  it('does not overwrite a concurrent save', async () => {
    findOne.mockResolvedValue({ status: 'DRAFT', scheduleVersion: 'old' });
    update.mockResolvedValue({ affected: 0 });
    await expect(
      service.save('workspace', {
        id: 'id',
        previousVersion: 'old',
        version: 'new',
        content,
      }),
    ).rejects.toThrow('초안이 변경');
  });
  it('retries a lost save response without creating another record', async () => {
    findOne.mockResolvedValue({ status: 'DRAFT', scheduleVersion: 'new' });
    await expect(
      service.save('workspace', { id: 'id', version: 'new', content }),
    ).resolves.toEqual({ id: 'id', version: 'new' });
    expect(insert).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });
  it('claims only the saved channel and version', async () => {
    findOne.mockResolvedValue({
      status: 'DRAFT',
      scheduleVersion: 'old',
      draftData: { ...content, channel: 'sms' },
    });
    await service.claim(
      'workspace',
      { id: 'id', version: 'old' },
      'sms',
      'request',
    );
    expect(update).toHaveBeenCalledWith(
      { id: 'id', status: 'DRAFT', scheduleVersion: 'old' },
      { status: 'SENDING', draftDispatchId: 'request' },
    );
    await expect(
      service.claim(
        'workspace',
        { id: 'id', version: 'old' },
        'coupon',
        'quote',
      ),
    ).rejects.toThrow();
  });
  it('allows only the same dispatch to retry after a claim', async () => {
    findOne.mockResolvedValue({
      status: 'SENDING',
      scheduleVersion: 'old',
      draftData: { ...content, channel: 'sms' },
      draftDispatchId: 'request',
    });
    await service.claim(
      'workspace',
      { id: 'id', version: 'old' },
      'sms',
      'request',
    );
    expect(update).not.toHaveBeenCalled();
    update.mockResolvedValue({ affected: 0 });
    await expect(
      service.claim('workspace', { id: 'id', version: 'old' }, 'sms', 'other'),
    ).rejects.toThrow('이미 발송 요청');
  });
});
