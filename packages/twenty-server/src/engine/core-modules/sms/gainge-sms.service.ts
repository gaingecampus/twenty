import { BadRequestException, Injectable } from '@nestjs/common';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { type SmsBatch } from './sms-dispatch.entity';
import { toGaingeSmsContent } from './sms.utils';

@Injectable()
export class GaingeSmsService {
  constructor(private readonly config: TwentyConfigService) {}

  isAvailable(workspaceId: string): boolean {
    try {
      this.settings(workspaceId);
      return true;
    } catch {
      return false;
    }
  }

  settings(workspaceId: string) {
    const endpoint = this.config.get('GAINGE_SMS_API_URL')?.trim();
    const header = this.config.get('GAINGE_SMS_AUTH_HEADER')?.trim();
    const token = this.config.get('GAINGE_SMS_AUTH_TOKEN')?.trim();
    if (
      !this.config.get('GAINGE_SMS_ENABLED') ||
      this.config.get('GAINGE_SMS_WORKSPACE_ID') !== workspaceId ||
      !endpoint ||
      !header ||
      !token
    ) {
      throw new BadRequestException(
        '가인지 문자 발송 연동이 준비되지 않았습니다.',
      );
    }
    let url: URL;
    try {
      url = new URL(endpoint);
    } catch {
      throw new BadRequestException('가인지 문자 API 주소를 확인하세요.');
    }
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== '/api/admin/messages/sms' ||
      !/^[a-z0-9_-]+$/i.test(header) ||
      [
        'content-type',
        'content-length',
        'host',
        'connection',
        'transfer-encoding',
      ].includes(header.toLowerCase()) ||
      /[\r\n]/.test(token)
    ) {
      throw new BadRequestException(
        '가인지 문자 API 주소와 인증 헤더를 확인하세요.',
      );
    }
    return { endpoint, header, token };
  }

  async send(
    workspaceId: string,
    endpointSnapshot: string,
    subject: string,
    content: string,
    advertising: boolean,
    batch: SmsBatch,
  ): Promise<Pick<SmsBatch, 'status' | 'error'>> {
    const settings = this.settings(workspaceId);
    // Old direct-provider jobs and jobs for another endpoint must never be rerouted.
    if (settings.endpoint !== endpointSnapshot) {
      return {
        status: 'FAILED',
        error: '문자 발송 연결 설정이 변경되었습니다.',
      };
    }
    // The upstream worker determines LMS from the template, not expanded company values.
    const effectiveSubject =
      subject.trim() ||
      (batch.targets.some((target) => target.messageType === 'LMS')
        ? '심방콜 문자'
        : '');
    try {
      const response = await fetch(settings.endpoint, {
        method: 'POST',
        redirect: 'error',
        signal: AbortSignal.timeout(20_000),
        headers: {
          [settings.header]: settings.token,
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          ...(effectiveSubject ? { subject: effectiveSubject } : {}),
          content: toGaingeSmsContent(content),
          targets: batch.targets.map((target) => ({
            to: target.to,
            name: target.name,
            var1: target.company ?? '',
          })),
          duplicateFlag: 'N',
          ...(advertising ? { rejectType: 'AD' } : {}),
        }),
      });
      if ([400, 401, 403, 404, 422].includes(response.status)) {
        return {
          status: 'FAILED',
          error: `가인지 문자 API 요청 거절 (${response.status}). 연동 설정과 입력 내용을 확인하세요.`,
        };
      }
      const result = (await response.json()) as { statusCode?: number };
      if (response.ok && result.statusCode === 200)
        return { status: 'ACCEPTED' };
      // The API may enqueue some chunks before returning 502. It has no caller idempotency key.
      return {
        status: 'UNKNOWN',
        error:
          '접수 결과가 불명확합니다. 가인지 어드민 발송 이력을 확인한 뒤 재발송 여부를 결정하세요.',
      };
    } catch {
      return {
        status: 'UNKNOWN',
        error:
          '접수 결과를 확인할 수 없습니다. 가인지 어드민 발송 이력을 확인하세요.',
      };
    }
  }
}
