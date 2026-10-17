import { PpurioService } from '../ppurio.service';
import { type TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { type SmsBatch } from '../sms-dispatch.entity';

describe('Ppurio current REST API', () => {
  const settings: Record<string, string> = {
    PPURIO_ACCOUNT: 'test',
    PPURIO_API_KEY: 'fake-key',
    PPURIO_FROM_NUMBER: '0212345678',
    PPURIO_WORKSPACE_ID: 'workspace',
  };
  const fetchMock = jest.fn();
  const originalFetch = global.fetch;
  let service: PpurioService;
  const batch: SmsBatch = {
    refKey: 'request1',
    status: 'QUEUED',
    targets: [
      {
        to: '01012345678',
        name: '루나',
        content: '안녕하세요',
        messageType: 'SMS',
      },
      {
        to: '01087654321',
        name: '팀',
        content: '안녕하세요',
        messageType: 'SMS',
      },
    ],
  };
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
    service = new PpurioService({
      get: (key: string) => settings[key],
    } as TwentyConfigService);
  });
  afterAll(() => {
    global.fetch = originalFetch;
  });
  const token = () =>
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: 'fake-token', expired: '20990101000000' }),
    });
  it.each([
    'PPURIO_ACCOUNT',
    'PPURIO_API_KEY',
    'PPURIO_FROM_NUMBER',
    'PPURIO_WORKSPACE_ID',
  ])('blocks missing %s without calling the provider', async (missingKey) => {
    const unconfigured = new PpurioService({
      get: (key: string) => (key === missingKey ? undefined : settings[key]),
    } as TwentyConfigService);
    await expect(
      unconfigured.send(
        'workspace',
        '0212345678',
        '제목',
        '내용',
        false,
        batch,
      ),
    ).rejects.toThrow('관리자 설정에서');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('blocks another workspace before exposing credentials', () => {
    expect(() => service.settings('other')).toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('submits a bulk request with current field names and caches token', async () => {
    token();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ code: '1000', messageKey: 'provider-id' }),
    });
    expect(
      await service.send(
        'workspace',
        '0212345678',
        '제목',
        '안녕하세요',
        true,
        batch,
      ),
    ).toEqual({ status: 'ACCEPTED', messageKey: 'provider-id' });
    await service.send(
      'workspace',
      '0212345678',
      '제목',
      '안녕하세요',
      false,
      batch,
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const [url, options] = fetchMock.mock.calls[1];
    expect(url).toBe('https://message.ppurio.com/v1/message');
    expect(JSON.parse(options.body)).toMatchObject({
      account: 'test',
      targetCount: 2,
      duplicateFlag: 'N',
      rejectType: 'AD',
      refKey: 'request1',
      targets: [
        { to: '01012345678', name: '루나', changeWord: { var1: '' } },
        { to: '01087654321', name: '팀', changeWord: { var1: '' } },
      ],
      content: '안녕하세요',
    });
  });
  it('never automatically retries an uncertain network result', async () => {
    token();
    fetchMock.mockRejectedValueOnce(new Error('timeout'));
    expect(
      (
        await service.send(
          'workspace',
          '0212345678',
          '제목',
          '안녕하세요',
          false,
          batch,
        )
      ).status,
    ).toBe('UNKNOWN');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('marks rate limit rejection as failed without blind retry', async () => {
    token();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({ code: '3008' }),
    });
    expect(
      (
        await service.send(
          'workspace',
          '0212345678',
          '제목',
          '안녕하세요',
          false,
          batch,
        )
      ).status,
    ).toBe('FAILED');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('does not submit when authentication fails', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ code: '3003' }),
    });
    expect(
      (
        await service.send(
          'workspace',
          '0212345678',
          '제목',
          '안녕하세요',
          false,
          batch,
        )
      ).status,
    ).toBe('FAILED');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
