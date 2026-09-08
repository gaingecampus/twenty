import { Injectable } from '@nestjs/common';
import { GoogleAuth } from 'google-auth-library';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

@Injectable()
export class GaingeGoogleChatService {
  constructor(private readonly config: TwentyConfigService) {}
  isEnabled() {
    return (
      this.config.get('GAINGE_CHAT_ENABLED') &&
      !!this.config.get('GAINGE_CHAT_CREDENTIALS')
    );
  }
  private async request<T>(
    url: string,
    method: 'GET' | 'POST',
    data?: object,
  ): Promise<T> {
    const credentials = JSON.parse(
      this.config.get('GAINGE_CHAT_CREDENTIALS') ?? '{}',
    );
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/chat.bot'],
    });
    const client = await auth.getClient();
    const result = await client.request<T>({
      url,
      method,
      data,
      timeout: 15000,
    });
    return result.data;
  }
  async findDirectMessage(userId: string): Promise<string | null> {
    if (!/^\d+$/.test(userId)) return null;
    try {
      const space = await this.request<{ name?: string }>(
        `https://chat.googleapis.com/v1/spaces:findDirectMessage?name=users/${userId}`,
        'GET',
      );
      return space.name ?? null;
    } catch (error) {
      // An app not installed by this user has no DM; organization delivery still proceeds.
      const status = (error as { response?: { status?: number } }).response
        ?.status;
      if (status === 404) return null;
      throw error;
    }
  }
  async send(space: string, eventId: string, text: string): Promise<void> {
    if (!/^spaces\/[A-Za-z0-9_-]+$/.test(space))
      throw new Error('Invalid Chat space');
    await this.request(
      `https://chat.googleapis.com/v1/${space}/messages?requestId=${encodeURIComponent(eventId)}`,
      'POST',
      { text },
    );
  }
}
