import { randomUUID } from 'node:crypto';
import { SecretEncryptionService } from '../secret-encryption/secret-encryption.service';
import { type PlaintextString } from '../secret-encryption/branded-strings/plaintext-string.type';
import { SendbeeClient } from './sendbee.client';
import { type SendbeeConfig, type SendbeeOrder } from './sendbee.types';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { getWorkspaceContext } from 'src/engine/twenty-orm/storage/orm-workspace-context.storage';
import { resolveRolePermissionConfig } from 'src/engine/twenty-orm/utils/resolve-role-permission-config.util';
import { MessageListMemberWorkspaceEntity } from 'src/modules/emailing/standard-objects/message-list-member.workspace-entity';
import { MessageListWorkspaceEntity } from 'src/modules/emailing/standard-objects/message-list.workspace-entity';
import { PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';
import { CouponDispatchEntity } from './coupon-dispatch.entity';
import {
  type CouponPreviewInput,
  type CouponDispatchSummary,
} from './coupon.dto';
import {
  type CouponProduct,
  type CouponRecipient,
  COUPON_MAX_RECIPIENTS,
  COUPON_QUOTE_TTL_MS,
  COUPON_SIMULATION_BUDGET,
  COUPON_SIMULATION_PRODUCTS,
} from './coupon.types';
import { buildCouponRecipients } from './coupon.utils';

@Injectable()
export class CouponService {
  constructor(
    // Core dispatches are explicitly scoped to both workspace and actor on every read/write.
    // eslint-disable-next-line twenty/prefer-workspace-scoped-repository
    @InjectRepository(CouponDispatchEntity)
    private readonly dispatches: Repository<CouponDispatchEntity>,
    private readonly orm: GlobalWorkspaceOrmManager,
    private readonly sendbee: SendbeeClient,
    private readonly encryption: SecretEncryptionService,
  ) {}

  async capabilities(workspaceId: string) {
    let liveAvailable = this.sendbee.available(workspaceId);
    let liveBlockedReason =
      '관리자 패널에서 센드비 계정·암호화 정보와 연동 확인 설정이 필요합니다.';
    let liveProducts: CouponProduct[] = [];
    let environment: string | undefined;
    let liveBudget = 0;
    if (liveAvailable) {
      const config = this.sendbee.settings(workspaceId);
      environment = config.environment;
      liveBudget = config.maxOrderAmount!;
      try {
        liveProducts = await this.sendbee.products(config);
        liveAvailable = liveProducts.length > 0;
        liveBlockedReason = liveAvailable
          ? ''
          : '현재 발송 가능한 센드비 상품이 없습니다.';
      } catch {
        liveAvailable = false;
        liveBlockedReason =
          '센드비 상품을 조회하지 못했습니다. 연동 설정을 확인하세요.';
      }
    }
    return {
      mode: 'SIMULATION',
      liveAvailable,
      liveBlockedReason,
      liveBudget,
      environment,
      liveProducts,
      simulationBudget: COUPON_SIMULATION_BUDGET,
      products: COUPON_SIMULATION_PRODUCTS.map((product) => ({ ...product })),
    };
  }

  async preview(
    workspaceId: string,
    userWorkspaceId: string,
    input: CouponPreviewInput,
  ) {
    if (!['SIMULATION', 'LIVE'].includes(input.mode))
      throw new BadRequestException('발송 모드를 확인하세요.');
    const config =
      input.mode === 'LIVE' ? this.sendbee.settings(workspaceId) : null;
    const products = config
      ? await this.sendbee.products(config)
      : COUPON_SIMULATION_PRODUCTS;
    const product = products.find((item) => item.id === input.productId);
    if (!product) throw new BadRequestException('상품을 다시 선택하세요.');
    if (config && !input.title?.trim())
      throw new BadRequestException('쿠폰 제목을 입력하세요.');
    const protectPhone = config
      ? (phone: string) =>
          this.encryption.encryptVersioned(phone as PlaintextString, {
            workspaceId,
          })
      : undefined;
    if (Boolean(input.listId) === Boolean(input.testPhone?.trim())) {
      throw new BadRequestException(
        '고객 목록 또는 테스트 번호 중 하나만 선택하세요.',
      );
    }
    const listId = input.listId;
    const targets = listId
      ? await this.orm.executeInWorkspaceContext(() =>
          this.listRecipients(workspaceId, listId, protectPhone),
        )
      : buildCouponRecipients(
          [{ personId: null, phone: input.testPhone ?? '' }],
          1,
          protectPhone,
        );
    if (!targets.recipients.length)
      throw new BadRequestException('유효한 휴대전화번호가 없습니다.');
    const dispatch = this.dispatches.create({
      workspaceId,
      userWorkspaceId,
      listId: input.listId ?? null,
      mode: input.mode,
      provider: config
        ? {
            environment: config.environment!,
            mid: config.mid!,
            orderTrId: `${config.mid}_${randomUUID().replace(/-/g, '')}`,
            title: input.title!.trim(),
            senderName: config.senderName!,
            sendNumber: config.sendNumber,
          }
        : null,
      status: 'PREVIEW',
      product: { ...product },
      scenario: input.scenario,
      message: input.message.trim(),
      ...targets,
      estimatedCost: product.price * targets.recipients.length,
      expiresAt: new Date(Date.now() + COUPON_QUOTE_TTL_MS),
    });
    if (config && dispatch.estimatedCost > config.maxOrderAmount!)
      throw new BadRequestException('1회 발송 예산을 초과했습니다.');
    if (!dispatch.message)
      throw new BadRequestException('메시지를 입력하세요.');

    return this.summary(await this.dispatches.save(dispatch));
  }

  private async listRecipients(
    workspaceId: string,
    listId: string,
    protectPhone?: (phone: string) => CouponRecipient['encryptedPhone'],
  ) {
    const { authContext, userWorkspaceRoleMap, apiKeyRoleMap } =
      getWorkspaceContext();
    const permissions = resolveRolePermissionConfig({
      authContext,
      userWorkspaceRoleMap,
      apiKeyRoleMap,
    });
    if (!permissions) throw new ForbiddenException();
    const lists = await this.orm.getRepository(
      workspaceId,
      MessageListWorkspaceEntity,
      permissions,
    );
    if (!(await lists.findOne({ where: { id: listId } })))
      throw new ForbiddenException('고객 목록을 조회할 권한이 없습니다.');
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
      where: { listId },
      take: COUPON_MAX_RECIPIENTS + 1,
    });
    if (rows.length > COUPON_MAX_RECIPIENTS)
      throw new BadRequestException(
        '한 번에 최대 1,000명까지 검토할 수 있습니다.',
      );
    const ids = [
      ...new Set(
        rows.flatMap((member) => (member.personId ? [member.personId] : [])),
      ),
    ];
    const contacts = ids.length
      ? await people.find({ where: { id: In(ids) } })
      : [];
    const byId = new Map(contacts.map((person) => [person.id, person]));
    // Preserve list membership cardinality, including duplicate people and inaccessible records.
    return buildCouponRecipients(
      rows.flatMap((member) => {
        const person = member.personId ? byId.get(member.personId) : undefined;
        return person
          ? [
              {
                personId: person.id,
                phone: person.phones?.primaryPhoneNumber ?? '',
                callingCode: person.phones?.primaryPhoneCallingCode,
              },
            ]
          : [];
      }),
      rows.length,
      protectPhone,
    );
  }

  async simulate(workspaceId: string, userWorkspaceId: string, id: string) {
    return this.dispatches.manager.transaction(async (manager) => {
      // One immutable quote is the idempotency key. Concurrent submissions serialize here.
      const repository = manager.getRepository(CouponDispatchEntity);
      const row = await repository.findOne({
        where: { id, workspaceId, userWorkspaceId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!row)
        throw new ForbiddenException('검토 내역을 조회할 권한이 없습니다.');
      if (row.mode !== 'SIMULATION')
        throw new ServiceUnavailableException('실제 발송은 지원되지 않습니다.');
      if (row.status !== 'PREVIEW') return this.summary(row);
      if (row.expiresAt.getTime() <= Date.now())
        throw new BadRequestException(
          '검토 유효시간이 지났습니다. 다시 검토하세요.',
        );
      if (row.estimatedCost > COUPON_SIMULATION_BUDGET)
        throw new BadRequestException(
          '검증 예산 100,000원을 초과했습니다. 대상을 줄이세요.',
        );
      const status =
        row.scenario === 'SUCCESS'
          ? 'SIMULATED'
          : row.scenario === 'UNKNOWN'
            ? 'UNKNOWN'
            : 'SIMULATED_FAILED';
      row.status = status;
      row.recipients = row.recipients.map((recipient) => ({
        ...recipient,
        status,
      }));
      return this.summary(await repository.save(row));
    });
  }

  async send(
    workspaceId: string,
    userWorkspaceId: string,
    id: string,
    confirmedCost: number,
  ) {
    // Persist a claim BEFORE the network call. A crash can leave SUBMITTING, but cannot duplicate payment.
    const claimed = await this.dispatches.manager.transaction(
      async (manager) => {
        const repository = manager.getRepository(CouponDispatchEntity);
        const row = await repository.findOne({
          where: { id, workspaceId, userWorkspaceId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!row)
          throw new ForbiddenException('검토 내역을 조회할 권한이 없습니다.');
        if (row.mode !== 'LIVE' || !row.provider)
          throw new BadRequestException('실제 연동 검토 내역이 아닙니다.');
        if (row.status !== 'PREVIEW') return { row, submit: false };
        const config = this.sendbee.settings(workspaceId);
        this.assertAccount(row, config);
        if (row.expiresAt.getTime() <= Date.now())
          throw new BadRequestException(
            '검토 유효시간이 지났습니다. 다시 검토하세요.',
          );
        if (
          confirmedCost !== row.estimatedCost ||
          row.estimatedCost > config.maxOrderAmount!
        )
          throw new BadRequestException(
            '확인 금액 또는 발송 예산이 일치하지 않습니다. 다시 검토하세요.',
          );
        const product = (await this.sendbee.products(config)).find(
          (item) => item.id === row.product.id,
        );
        if (!product || product.price !== row.product.price)
          throw new BadRequestException(
            '상품 가격 또는 판매 상태가 변경되었습니다. 다시 검토하세요.',
          );
        // Verify decryptability before claiming an irreversible operation.
        const phones = this.phones(row);
        if (row.listId) {
          // A saved quote must not outlive access revocation or a changed recipient list.
          const current = await this.orm.executeInWorkspaceContext(() =>
            this.listRecipients(workspaceId, row.listId!, (phone) =>
              this.encryption.encryptVersioned(phone as PlaintextString, {
                workspaceId,
              }),
            ),
          );
          const identity = (personId: string | null, phone: string) =>
            `${personId ?? ''}:${phone}`;
          const quoted = row.recipients
            .map((recipient, index) =>
              identity(recipient.personId, phones[index]),
            )
            .sort();
          const latest = current.recipients
            .map((recipient) =>
              identity(
                recipient.personId,
                this.encryption.decryptVersionedOrThrow(
                  recipient.encryptedPhone!,
                  { workspaceId },
                ),
              ),
            )
            .sort();
          if (
            quoted.length !== latest.length ||
            quoted.some((value, index) => value !== latest[index])
          ) {
            throw new BadRequestException(
              '고객 분류 또는 수신번호가 변경되었습니다. 발송 대상을 다시 검토하세요.',
            );
          }
        }
        if (
          !phones.length ||
          phones.some((phone) => !/^01[016789]\d{7,8}$/.test(phone))
        )
          throw new BadRequestException(
            '수신자 정보를 확인할 수 없습니다. 다시 검토하세요.',
          );
        row.status = 'SUBMITTING';
        row.provider.submittedAt = new Date().toISOString();
        await repository.save(row);
        return { row, submit: true, config, phones };
      },
    );
    if (!claimed.submit) return this.summary(claimed.row);
    const { row, config, phones } = claimed;
    try {
      const response = await this.sendbee.order(config!, {
        productId: row.product.id,
        phones: phones!,
        title: row.provider!.title,
        message: row.message,
        orderTrId: row.provider!.orderTrId,
      });
      this.applyOrder(row, response, phones!);
    } catch {
      row.status = 'UNKNOWN';
      row.recipients = row.recipients.map((recipient) => ({
        ...recipient,
        status: 'UNKNOWN',
      }));
    }
    // If saving fails, the durable SUBMITTING claim still prevents another order.
    return this.summary(await this.dispatches.save(row));
  }

  async refresh(workspaceId: string, userWorkspaceId: string, id: string) {
    return this.dispatches.manager.transaction(async (manager) => {
      const repository = manager.getRepository(CouponDispatchEntity);
      const row = await repository.findOne({
        where: { id, workspaceId, userWorkspaceId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!row)
        throw new ForbiddenException('발송 내역을 조회할 권한이 없습니다.');
      if (row.mode !== 'LIVE' || !row.provider?.orderId)
        throw new BadRequestException(
          '조회 가능한 센드비 주문번호가 없습니다. 주문거래번호로 센드비에 확인해 주세요.',
        );
      const config = this.sendbee.settings(workspaceId);
      this.assertAccount(row, config);
      const response = await this.sendbee.status(
        config,
        row.provider.orderId,
        row.product.id,
      );
      this.applyOrder(row, response, this.phones(row));
      return this.summary(await repository.save(row));
    });
  }

  private assertAccount(row: CouponDispatchEntity, config: SendbeeConfig) {
    if (
      row.provider?.mid !== config.mid ||
      row.provider?.environment !== config.environment ||
      row.provider?.senderName !== config.senderName ||
      row.provider?.sendNumber !== config.sendNumber
    )
      throw new BadRequestException(
        '센드비 계정 또는 발신 설정이 변경되었습니다. 기존 주문을 확인하세요.',
      );
  }

  private phones(row: CouponDispatchEntity) {
    return row.recipients.map((recipient) => {
      if (!recipient.encryptedPhone)
        throw new BadRequestException('수신번호가 없습니다.');
      return this.encryption.decryptVersionedOrThrow(recipient.encryptedPhone, {
        workspaceId: row.workspaceId,
      });
    });
  }

  private applyOrder(
    row: CouponDispatchEntity,
    order: SendbeeOrder,
    phones: string[],
  ) {
    row.provider = {
      ...row.provider!,
      orderId: order.orderId,
      actualCost: order.totalPrice,
      checkedAt: new Date().toISOString(),
    };
    row.status = order.status;
    row.recipients = row.recipients.map((recipient, index) => {
      const matches = order.coupons.filter(
        (coupon) => coupon.phone === phones[index],
      );
      return {
        ...recipient,
        status: matches.length === 1 ? matches[0].status : 'UNKNOWN',
      };
    });
  }

  async history(workspaceId: string, userWorkspaceId: string) {
    const rows = await this.dispatches.find({
      where: { workspaceId, userWorkspaceId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
    return rows.map((row) => this.summary(row));
  }

  summary(row: CouponDispatchEntity): CouponDispatchSummary {
    return {
      id: row.id,
      mode: row.mode,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      expiresAt: row.expiresAt.toISOString(),
      scenario: row.scenario,
      message: row.message,
      product: row.product,
      total: row.total,
      missing: row.missing,
      duplicates: row.duplicates,
      recipientCount: row.recipients.length,
      estimatedCost: row.estimatedCost,
      recipients: row.recipients.map(({ personId, phone, status }) => ({
        personId,
        phone,
        status,
      })),
      orderId: row.provider?.orderId,
      orderTrId: row.provider?.orderTrId,
      environment: row.provider?.environment,
      title: row.provider?.title,
      actualCost: row.provider?.actualCost,
    };
  }
}
