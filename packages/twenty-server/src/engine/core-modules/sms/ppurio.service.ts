import { BadRequestException, Injectable } from '@nestjs/common';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { type SmsBatch } from './sms-dispatch.entity';

@Injectable()
export class PpurioService {
  private token: {
    value: string;
    expiresAt: number;
    credentials: string;
  } | null = null;
  private tokenRequest: Promise<string> | null = null;
  constructor(private readonly config: TwentyConfigService) {}

  settings(workspaceId: string) {
    const account = this.config.get('PPURIO_ACCOUNT');
    const key = this.config.get('PPURIO_API_KEY');
    const from = this.config.get('PPURIO_FROM_NUMBER');
    if (
      this.config.get('PPURIO_WORKSPACE_ID') !== workspaceId ||
      !account ||
      !key ||
      !from
    ) {
      throw new BadRequestException(
        '관리자 설정에서 뿌리오 계정·인증키·발신번호·워크스페이스를 등록하세요.',
      );
    }
    if (!/^\d{8,16}$/.test(from))
      throw new BadRequestException(
        '뿌리오에 등록된 발신번호를 숫자로 입력하세요.',
      );
    return { account, key, from };
  }

  private async getToken(account: string, key: string): Promise<string> {
    const credentials = `${account}:${key}`;
    if (
      this.token?.credentials === credentials &&
      this.token.expiresAt > Date.now()
    )
      return this.token.value;
    if (this.tokenRequest) {
      await this.tokenRequest;
      return this.getToken(account, key);
    }
    this.tokenRequest = (async () => {
      const response = await fetch('https://message.ppurio.com/v1/token', {
        method: 'POST',
        redirect: 'error',
        signal: AbortSignal.timeout(15_000),
        headers: {
          Authorization: `Basic ${Buffer.from(credentials).toString('base64')}`,
        },
      });
      const result = (await response.json()) as {
        token?: string;
        expired?: string;
      };
      if (!response.ok || !result.token)
        throw new BadRequestException(
          '뿌리오 인증 실패: 계정·인증키·등록 IP를 확인하세요.',
        );
      const expiry = result.expired?.replace(
        /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/,
        '$1-$2-$3T$4:$5:$6+09:00',
      );
      this.token = {
        value: result.token,
        credentials,
        expiresAt: Math.min(
          Date.now() + 23 * 60 * 60_000,
          expiry ? new Date(expiry).getTime() - 60_000 : Date.now(),
        ),
      };
      return result.token;
    })();
    try {
      return await this.tokenRequest;
    } finally {
      this.tokenRequest = null;
    }
  }

  async send(
    workspaceId: string,
    from: string,
    subject: string,
    content: string,
    advertising: boolean,
    batch: SmsBatch,
  ): Promise<Pick<SmsBatch, 'status' | 'messageKey' | 'error'>> {
    const settings = this.settings(workspaceId);
    if (settings.from !== from)
      return { status: 'FAILED', error: '발신번호 설정이 변경되었습니다.' };
    let token: string;
    try {
      token = await this.getToken(settings.account, settings.key);
    } catch {
      return {
        status: 'FAILED',
        error: '뿌리오 인증 실패: 설정과 등록 IP를 확인하세요.',
      };
    }
    try {
      const response = await fetch('https://message.ppurio.com/v1/message', {
        method: 'POST',
        redirect: 'error',
        signal: AbortSignal.timeout(20_000),
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          account: settings.account,
          from,
          subject,
          messageType: batch.targets[0].messageType,
          content: content
            .replace(/\{\{fullName\}\}/g, '[*이름*]')
            .replace(/\{\{companyName\}\}/g, '[*1*]'),
          duplicateFlag: 'N',
          targetCount: batch.targets.length,
          targets: batch.targets.map((target) => ({
            to: target.to,
            name: target.name,
            changeWord: { var1: target.company ?? '' },
          })),
          refKey: batch.refKey,
          ...(advertising ? { rejectType: 'AD' } : {}),
        }),
      });
      const result = (await response.json()) as {
        code?: string;
        messageKey?: string;
      };
      if (response.ok && result.code === '1000' && result.messageKey)
        return { status: 'ACCEPTED', messageKey: result.messageKey };
      if (response.status >= 500)
        return {
          status: 'UNKNOWN',
          error: '뿌리오 응답 불명확. 발송 결과 확인 전 재발송하지 마세요.',
        };
      return {
        status: 'FAILED',
        error: `뿌리오 요청 거절 (${result.code ?? response.status}). 뿌리오 연동 사용내역을 확인하세요.`,
      };
    } catch {
      // A lost response may already have charged/sent. Never retry blindly.
      return {
        status: 'UNKNOWN',
        error: '접수 결과 확인 불가. 뿌리오 발송 결과 확인이 필요합니다.',
      };
    }
  }
}
