import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { IsNull } from 'typeorm';
import { type CampaignDraftReferenceInput } from './campaign-draft-reference.input';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { type CampaignDraft } from 'twenty-shared/types';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { getWorkspaceContext } from 'src/engine/twenty-orm/storage/orm-workspace-context.storage';
import { resolveRolePermissionConfig } from 'src/engine/twenty-orm/utils/resolve-role-permission-config.util';
import { MessageCampaignWorkspaceEntity } from 'src/modules/emailing/standard-objects/message-campaign.workspace-entity';
import { CampaignAttachmentsService } from 'src/modules/emailing/services/campaign-attachments.service';
import { type SaveMessageCampaignDraftInput } from './campaign-draft.dto';

@Injectable()
export class CampaignDraftService {
  constructor(
    private readonly orm: GlobalWorkspaceOrmManager,
    private readonly attachments: CampaignAttachmentsService,
  ) {}

  private async repository(workspaceId: string) {
    const { authContext, userWorkspaceRoleMap, apiKeyRoleMap } =
      getWorkspaceContext();
    const permissions = resolveRolePermissionConfig({
      authContext,
      userWorkspaceRoleMap,
      apiKeyRoleMap,
    });
    if (!permissions) throw new ForbiddenException();
    return this.orm.getRepository(
      workspaceId,
      MessageCampaignWorkspaceEntity,
      permissions,
    );
  }

  async save(workspaceId: string, input: SaveMessageCampaignDraftInput) {
    return this.orm.executeInWorkspaceContext(async () => {
      const repository = await this.repository(workspaceId);
      const existing = await repository.findOne({ where: { id: input.id } });
      // Retrying a save after a lost response must not create a second draft.
      if (
        existing?.status === 'DRAFT' &&
        existing.scheduleVersion === input.version
      )
        return { id: input.id, version: input.version };
      if (
        existing &&
        (existing.status !== 'DRAFT' ||
          existing.scheduleVersion !== (input.previousVersion ?? null))
      )
        throw new ConflictException(
          '다른 곳에서 변경되었거나 발송된 초안입니다. 목록에서 다시 열어 주세요.',
        );
      if (!existing && input.previousVersion)
        throw new ConflictException(
          '초안을 찾을 수 없습니다. 목록을 새로 고침하세요.',
        );
      await this.attachments.retain(workspaceId, input.content.files);
      const content = {
        draftData: input.content,
        subject: input.content.subject || '제목 없는 초안',
        bodyTemplate: input.content.body,
        attachmentFiles: input.content.files,
        listId:
          input.content.recipientMode === 'list' ? input.content.listId : null,
        scheduleVersion: input.version,
        status: 'DRAFT',
      };
      if (existing) {
        const result = await repository.update(
          {
            id: input.id,
            status: 'DRAFT',
            scheduleVersion: input.previousVersion ?? IsNull(),
          },
          content,
        );
        if (result.affected !== 1)
          throw new ConflictException(
            '초안이 변경되었습니다. 목록에서 다시 열어 주세요.',
          );
      } else {
        await repository.insert({ id: input.id, ...content });
      }
      return { id: input.id, version: input.version };
    });
  }

  // Persist the provider's idempotency key before any external dispatch. A retry
  // may only continue that same request, never create a second paid dispatch.
  async claim(
    workspaceId: string,
    draft: CampaignDraftReferenceInput | undefined,
    channel: CampaignDraft['channel'],
    dispatchId: string,
    sentContent?: {
      subject: string;
      bodyTemplate: string;
      listId: string | null;
    },
  ) {
    if (!draft) return;
    await this.orm.executeInWorkspaceContext(async () => {
      const repository = await this.repository(workspaceId);
      const existing = await repository.findOne({ where: { id: draft.id } });
      if (
        !existing ||
        existing.draftData?.channel !== channel ||
        existing.scheduleVersion !== draft.version
      )
        throw new ConflictException(
          '초안이 변경되었습니다. 목록에서 다시 열어 주세요.',
        );
      if (
        existing.status === 'SENDING' &&
        existing.draftDispatchId === dispatchId
      )
        return;
      const result = await repository.update(
        { id: draft.id, status: 'DRAFT', scheduleVersion: draft.version },
        { ...sentContent, status: 'SENDING', draftDispatchId: dispatchId },
      );
      if (result.affected !== 1)
        throw new ConflictException(
          '이미 발송 요청한 초안입니다. 발송 결과를 확인해 주세요.',
        );
    });
  }

  async finishDispatch(
    workspaceId: string,
    dispatchId: string,
    status: 'SENT' | 'SENT_WITH_ERRORS' | 'SIMULATED' | 'CANCELLED',
  ) {
    // Called only with a persisted dispatch's workspace and idempotency key.
    await this.orm.executeInWorkspaceContext(async () => {
      if (!getWorkspaceContext().objectIdByNameSingular.messageCampaign) return;
      const repository = await this.orm.getRepository(
        workspaceId,
        MessageCampaignWorkspaceEntity,
        { shouldBypassPermissionChecks: true },
      );
      await repository.update(
        { status: 'SENDING', draftDispatchId: dispatchId },
        { status, sentAt: status === 'SIMULATED' ? null : new Date() },
      );
    }, buildSystemAuthContext(workspaceId));
  }
}
