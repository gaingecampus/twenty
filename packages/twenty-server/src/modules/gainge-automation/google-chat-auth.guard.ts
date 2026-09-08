import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
@Injectable()
export class GaingeChatAuthGuard implements CanActivate {
  constructor(private readonly config: TwentyConfigService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authorization = context
      .switchToHttp()
      .getRequest<{ headers: { authorization?: string } }>()
      .headers.authorization;
    const email = this.config.get('GAINGE_CHAT_SYSTEM_EMAIL');
    if (!email)
      throw new ServiceUnavailableException('Chat verification not configured');
    try {
      if (!authorization?.startsWith('Bearer '))
        throw new Error('Missing token');
      const ticket = await new OAuth2Client().verifyIdToken({
        idToken: authorization.slice(7),
        audience: 'https://crm.gainge.com/gainge-automation/chat',
      });
      const payload = ticket.getPayload();
      if (!payload?.email_verified || payload.email !== email)
        throw new Error('Invalid sender');
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }
}
