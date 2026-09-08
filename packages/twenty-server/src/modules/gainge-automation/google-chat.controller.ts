import { GaingeAutomationTableService } from './automation-table.service';
import {
  Body,
  Controller,
  HttpCode,
  Post,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { GaingeChatAuthGuard } from './google-chat-auth.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { quoteAutomationSchema } from './automation-schema';

type ChatUser = { name?: string; email?: string };
type ChatEvent = {
  chat?: {
    user?: ChatUser;
    messagePayload?: { message?: { sender?: ChatUser; text?: string } };
    removedFromSpacePayload?: unknown;
  };
};
@Controller('gainge-automation/chat')
export class GaingeGoogleChatController {
  constructor(
    private readonly config: TwentyConfigService,
    private readonly orm: GlobalWorkspaceOrmManager,
    private readonly tables: GaingeAutomationTableService,
  ) {}
  // External Google OIDC is verified by GaingeChatAuthGuard; no CRM session cookie applies.
  // oxlint-disable-next-line twenty/rest-api-methods-should-be-guarded
  @Post()
  @UseGuards(GaingeChatAuthGuard, NoPermissionGuard)
  @HttpCode(200)
  async receive(@Body() body: ChatEvent) {
    if (body.chat?.removedFromSpacePayload) return {};
    const user = body.chat?.messagePayload?.message?.sender ?? body.chat?.user;
    const response = (text: string) => ({
      hostAppDataAction: {
        chatDataAction: { createMessageAction: { message: { text } } },
      },
    });
    if (
      !user?.email?.toLowerCase().endsWith('@gainge.com') ||
      !/^users\/\d+$/.test(user.name ?? '')
    )
      return response(
        '가인지 CRM 계정에 연결된 구성원만 개인 알림을 등록할 수 있습니다.',
      );
    const workspaceId = this.config.get('GAINGE_AUTOMATION_WORKSPACE_ID');
    if (!/^[0-9a-f-]{36}$/i.test(workspaceId))
      throw new ServiceUnavailableException();
    const ns = quoteAutomationSchema(getWorkspaceSchemaName(workspaceId));
    const ds = await this.orm.getGlobalWorkspaceDataSource();
    const memberTable = await this.tables.quoted(workspaceId, 'teamMember');
    const members = await ds.query(
      `SELECT id FROM ${ns}.${memberTable} WHERE lower(trim("emailPrimaryEmail"))=$1 AND "deletedAt" IS NULL`,
      [user.email.toLowerCase()],
    );
    if (members.length !== 1)
      return response(
        'CRM 구성원 이메일 연결을 확인해 주세요. 연결이 확인되면 이 앱에 다시 메시지를 보내 개인 알림을 등록할 수 있습니다.',
      );
    const text = body.chat?.messagePayload?.message?.text?.trim() ?? '';
    const enabled =
      text === '알림 끄기' ? false : text === '알림 켜기' ? true : null;
    await ds.query(
      `UPDATE ${ns}.${memberTable} SET "googleChatUserId"=$2,"googleChatNotificationsEnabled"=COALESCE($3,"googleChatNotificationsEnabled",true) WHERE id=$1`,
      [members[0].id, user.name!.slice(6), enabled],
    );
    return response(
      enabled === false
        ? '개인 CRM 알림을 껐습니다. 다시 받으려면 “알림 켜기”를 보내세요.'
        : enabled === true
          ? '개인 CRM 알림을 켰습니다.'
          : 'CRM 계정을 연결했습니다. 담당 데이터의 생성·수정·상태 알림을 이 채팅에서 받을 수 있습니다.\n“알림 켜기” 또는 “알림 끄기”로 개인 알림을 설정하세요.\n현황판: https://crm.gainge.com/status-board',
    );
  }
}
