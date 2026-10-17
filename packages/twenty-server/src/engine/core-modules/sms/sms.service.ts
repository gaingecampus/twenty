import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { getWorkspaceContext } from 'src/engine/twenty-orm/storage/orm-workspace-context.storage';
import { resolveRolePermissionConfig } from 'src/engine/twenty-orm/utils/resolve-role-permission-config.util';
import { MessageListMemberWorkspaceEntity } from 'src/modules/emailing/standard-objects/message-list-member.workspace-entity';
import { MessageListWorkspaceEntity } from 'src/modules/emailing/standard-objects/message-list.workspace-entity';
import { PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';
import {
  SmsDispatchEntity,
  type SmsBatch,
  type SmsTarget,
} from './sms-dispatch.entity';
import { PpurioService } from './ppurio.service';
import {
  type SmsDispatchSummary,
  type SmsPreviewInput,
  type SmsSendInput,
} from './sms.dto';
import { normalizeSmsPhone, renderSms, smsMessageType } from './sms.utils';

export const SEND_SMS_JOB = 'SendSmsDispatchJob';
@Injectable()
export class SmsService {
  constructor(
    // A dedicated connection is required for the cross-worker advisory lock; every query below is workspace-scoped.
    // eslint-disable-next-line twenty/prefer-workspace-scoped-repository
    @InjectRepository(SmsDispatchEntity)
    private readonly dispatches: Repository<SmsDispatchEntity>,
    private readonly orm: GlobalWorkspaceOrmManager,
    private readonly ppurio: PpurioService,
    @InjectMessageQueue(MessageQueue.emailQueue)
    private readonly queue: MessageQueueService,
  ) {}

  async preview(workspaceId: string, input: SmsPreviewInput) {
    return this.orm.executeInWorkspaceContext(() =>
      this.previewInContext(workspaceId, input),
    );
  }

  private async previewInContext(workspaceId: string, input: SmsPreviewInput) {
    const { authContext, userWorkspaceRoleMap, apiKeyRoleMap } =
      getWorkspaceContext();
    const permissions = resolveRolePermissionConfig({
      authContext,
      userWorkspaceRoleMap,
      apiKeyRoleMap,
    });
    if (!permissions) throw new ForbiddenException();
    if (
      input.advertising &&
      (!input.content.startsWith('(광고)') ||
        !/080[-\s]?\d/.test(input.content))
    ) {
      throw new BadRequestException(
        '광고 문자는 (광고)로 시작하고 무료수신거부 080 번호를 포함해야 합니다.',
      );
    }
    const lists = await this.orm.getRepository(
      workspaceId,
      MessageListWorkspaceEntity,
      permissions,
    );
    if (!(await lists.findOne({ where: { id: input.listId } })))
      throw new ForbiddenException('목록을 조회할 권한이 없습니다.');
    const members = await this.orm.getRepository(
      workspaceId,
      MessageListMemberWorkspaceEntity,
      permissions,
    );
    const people = await this.orm.getRepository(
      workspaceId,
      PersonWorkspaceEntity,
      permissions,
    );
    const rows = await members.find({
      where: { listId: input.listId },
      take: 10001,
    });
    if (rows.length > 10000)
      throw new BadRequestException(
        '한 번에 최대 10,000명까지 발송할 수 있습니다.',
      );
    const ids = rows.flatMap((row) => (row.personId ? [row.personId] : []));
    const contacts = ids.length
      ? await people.find({
          where: { id: In(ids) },
          relations: { company: true },
        })
      : [];
    const targets: SmsTarget[] = [];
    const seen = new Set<string>();
    let missing = rows.length - contacts.length;
    let duplicates = 0;
    for (const person of contacts) {
      const raw = person.phones?.primaryPhoneNumber ?? '';
      const callingCode = person.phones?.primaryPhoneCallingCode;
      const to = normalizeSmsPhone(
        callingCode && !raw.startsWith('0') && !raw.startsWith('+')
          ? `${callingCode}${raw}`
          : raw,
      );
      if (!to) {
        missing++;
        continue;
      }
      if (seen.has(to)) {
        duplicates++;
        continue;
      }
      seen.add(to);
      const name = [person.name?.firstName, person.name?.lastName]
        .filter(Boolean)
        .join(' ');
      if (name.length > 100 || (person.company?.name?.length ?? 0) > 100)
        throw new BadRequestException(
          '개인화 이름·기업명은 100자까지 지원합니다.',
        );
      const content = renderSms(
        input.content,
        name,
        person.company?.name ?? '',
      );
      targets.push({
        to,
        name,
        company: person.company?.name ?? '',
        content,
        messageType: smsMessageType(content),
      });
    }
    return {
      targets,
      total: rows.length,
      missing,
      duplicates,
      sms: targets.filter((target) => target.messageType === 'SMS').length,
      lms: targets.filter((target) => target.messageType === 'LMS').length,
      sample: targets[0]?.content ?? input.content,
    };
  }

  async send(
    workspaceId: string,
    userWorkspaceId: string,
    input: SmsSendInput,
  ) {
    const existing = await this.dispatches.findOneBy({
      workspaceId,
      requestId: input.requestId,
      userWorkspaceId,
    });
    if (existing) {
      if (existing.status === 'QUEUED')
        await this.queue.add(
          SEND_SMS_JOB,
          { workspaceId, dispatchId: existing.id },
          { retryLimit: 3, id: existing.id },
        );
      return this.summary(existing);
    }
    const settings = this.ppurio.settings(workspaceId);
    const { targets } = await this.preview(workspaceId, input);
    if (!targets.length)
      throw new BadRequestException('발송 가능한 휴대전화번호가 없습니다.');
    const batches: SmsBatch[] = [];
    const grouped = new Map<string, SmsTarget[]>();
    for (const target of targets) {
      const group = grouped.get(target.messageType) ?? [];
      group.push({ ...target, content: '' });
      grouped.set(target.messageType, group);
    }
    for (const group of grouped.values()) {
      for (let offset = 0; offset < group.length; offset += 100) {
        batches.push({
          targets: group.slice(offset, offset + 100),
          status: 'QUEUED',
          refKey: randomUUID().replace(/-/g, ''),
        });
      }
    }
    const id = randomUUID();
    await this.dispatches
      .createQueryBuilder()
      .insert()
      .values({
        id,
        workspaceId,
        userWorkspaceId,
        requestId: input.requestId,
        listId: input.listId,
        subject: input.subject,
        content: input.content,
        from: settings.from,
        advertising: input.advertising,
        batches,
        status: 'QUEUED',
      })
      .orIgnore()
      .execute();
    const dispatch = await this.dispatches.findOneByOrFail({
      workspaceId,
      requestId: input.requestId,
    });
    if (dispatch.userWorkspaceId !== userWorkspaceId)
      throw new ForbiddenException();
    try {
      await this.queue.add(
        SEND_SMS_JOB,
        { workspaceId, dispatchId: dispatch.id },
        { retryLimit: 3, id: dispatch.id },
      );
    } catch {
      // Persist the snapshot so retrying the same request can enqueue it safely.
      throw new BadRequestException(
        '문자 발송 대기열 연결 실패. 같은 화면에서 다시 시도하세요.',
      );
    }
    return this.summary(dispatch);
  }

  async history(workspaceId: string, userWorkspaceId: string) {
    const rows = await this.dispatches.find({
      where: { workspaceId, userWorkspaceId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
    return rows.map((row) => this.summary(row));
  }

  summary(row: SmsDispatchEntity): SmsDispatchSummary {
    const count = (status: SmsBatch['status']) =>
      row.batches
        .filter((batch) => batch.status === status)
        .reduce((sum, batch) => sum + batch.targets.length, 0);
    return {
      id: row.id,
      subject: row.subject,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      queued: count('QUEUED'),
      accepted: count('ACCEPTED'),
      failed: count('FAILED'),
      unknown: count('UNKNOWN') + count('SENDING'),
      errors: [
        ...new Set(
          row.batches.flatMap((batch) => (batch.error ? [batch.error] : [])),
        ),
      ],
    };
  }

  async process(workspaceId: string, dispatchId: string) {
    const runner = this.dispatches.manager.connection.createQueryRunner();
    await runner.connect();
    let locked = false;
    try {
      // Cross-process lock keeps all CRM workers below the account rate limit.
      const result: { locked: boolean }[] = await runner.query(
        'SELECT pg_try_advisory_lock(679, 1) AS locked',
      );
      locked = result[0].locked;
      if (!locked) {
        await this.queue.add(
          SEND_SMS_JOB,
          { workspaceId, dispatchId },
          { retryLimit: 3, delay: 1000 },
        );
        return;
      }
      const row = await this.dispatches.findOneBy({
        id: dispatchId,
        workspaceId,
      });
      if (!row || row.status === 'FINISHED') return;
      for (const batch of row.batches) {
        if (batch.status === 'SENDING') {
          batch.status = 'UNKNOWN';
          batch.error =
            '처리 중 서버가 재시작되었습니다. 뿌리오에서 접수 여부를 확인하세요.';
        }
      }
      row.status = 'SENDING';
      await this.dispatches.save(row);
      for (const batch of row.batches) {
        if (batch.status !== 'QUEUED') continue;
        // Save before crossing the network boundary; a retried job never sends this batch again.
        batch.status = 'SENDING';
        await this.dispatches.save(row);
        try {
          Object.assign(
            batch,
            await this.ppurio.send(
              workspaceId,
              row.from,
              row.subject,
              row.content,
              row.advertising,
              batch,
            ),
          );
        } catch {
          batch.status = 'FAILED';
          batch.error = '문자 연동 설정을 확인하세요.';
        }
        await this.dispatches.save(row);
        await new Promise((resolve) => setTimeout(resolve, 250));
        break;
      }
      if (row.batches.some((batch) => batch.status === 'QUEUED')) {
        await this.queue.add(
          SEND_SMS_JOB,
          { workspaceId, dispatchId },
          { retryLimit: 3 },
        );
      } else {
        row.status = 'FINISHED';
        await this.dispatches.save(row);
      }
    } finally {
      try {
        if (locked) await runner.query('SELECT pg_advisory_unlock(679, 1)');
      } finally {
        await runner.release();
      }
    }
  }
}
