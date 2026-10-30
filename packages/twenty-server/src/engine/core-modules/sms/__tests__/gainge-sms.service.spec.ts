import { GaingeSmsService } from '../gainge-sms.service';
import { type TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { type SmsBatch } from '../sms-dispatch.entity';

const endpoint = 'https://campus.example.com/api/admin/messages/sms';
const configuration: Record<string, string | boolean> = {
  GAINGE_SMS_ENABLED: true,
  GAINGE_SMS_API_URL: endpoint,
  GAINGE_SMS_AUTH_HEADER: 'x-test-admin',
  GAINGE_SMS_AUTH_TOKEN: 'test-only-secret',
  GAINGE_SMS_WORKSPACE_ID: 'workspace',
};
const batch: SmsBatch = {
  refKey: 'local-request',
  status: 'QUEUED',
  targets: [
    {
      to: '01012345678',
      name: '루나',
      company: '가인지',
      content: '',
      messageType: 'SMS',
    },
    { to: '01087654321', name: '고객', content: '', messageType: 'SMS' },
  ],
};
const createService = (overrides: Record<string, unknown> = {}) =>
  new GaingeSmsService({
    get: (key: string) => ({ ...configuration, ...overrides })[key],
  } as TwentyConfigService);

describe('Gainge SMS API', () => {
  const originalFetch = global.fetch;
  const fetchMock = jest.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });
  afterAll(() => {
    global.fetch = originalFetch;
  });
  const send = (service = createService(), snapshot = endpoint) =>
    service.send(
      'workspace',
      snapshot,
      '제목',
      '{{fullName}} {{companyName}}',
      true,
      batch,
    );

  it.each(Object.keys(configuration))(
    'hides and blocks incomplete %s configuration',
    async (key) => {
      const service = createService({ [key]: undefined });
      expect(service.isAvailable('workspace')).toBe(false);
      await expect(send(service)).rejects.toThrow('준비되지');
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );
  it('requires activation and the authorized workspace', () => {
    expect(
      createService({ GAINGE_SMS_ENABLED: false }).isAvailable('workspace'),
    ).toBe(false);
    expect(createService().isAvailable('other')).toBe(false);
    expect(createService().isAvailable('workspace')).toBe(true);
    expect(
      createService({ GAINGE_SMS_AUTH_HEADER: 'secret_header' }).isAvailable(
        'workspace',
      ),
    ).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each([
    { GAINGE_SMS_API_URL: 'http://campus.example.com/api/admin/messages/sms' },
    {
      GAINGE_SMS_API_URL:
        'https://user:password@campus.example.com/api/admin/messages/sms',
    },
    { GAINGE_SMS_API_URL: endpoint + '?secret=value' },
    { GAINGE_SMS_API_URL: 'https://campus.example.com/wrong' },
    { GAINGE_SMS_AUTH_HEADER: 'Content-Type' },
    { GAINGE_SMS_AUTH_TOKEN: 'bad\nheader' },
  ])('rejects invalid endpoint or authentication configuration', (settings) => {
    expect(createService(settings).isAvailable('workspace')).toBe(false);
  });
  it('uses the admin bulk API contract, with credentials only in the server header', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ statusCode: 200 }),
    });
    expect(await send()).toEqual({ status: 'ACCEPTED' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(endpoint);
    expect(options.redirect).toBe('error');
    expect(options.headers['x-test-admin']).toBe('test-only-secret');
    expect(JSON.parse(options.body)).toEqual({
      subject: '제목',
      content: '[*이름*] [*1*]',
      duplicateFlag: 'N',
      rejectType: 'AD',
      targets: [
        { to: '01012345678', name: '루나', var1: '가인지' },
        { to: '01087654321', name: '고객', var1: '' },
      ],
    });
  });
  it('omits empty subject and advertising fields for a normal SMS', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ statusCode: 200 }),
    });
    await createService().send('workspace', endpoint, '', '안내', false, batch);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).not.toHaveProperty(
      'subject',
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).not.toHaveProperty(
      'rejectType',
    );
  });
  it('forces LMS when expanded customer values exceed a short template', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ statusCode: 200 }),
    });
    await createService().send(
      'workspace',
      endpoint,
      '',
      '{{companyName}}',
      false,
      {
        ...batch,
        targets: batch.targets.map((target) => ({
          ...target,
          messageType: 'LMS',
        })),
      },
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).subject).toBe(
      '심방콜 문자',
    );
  });
  it.each([400, 401, 403, 404, 422])(
    'marks explicit rejection %i as failed',
    async (status) => {
      fetchMock.mockResolvedValue({ ok: false, status });
      expect((await send()).status).toBe('FAILED');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );
  it.each([408, 429, 500, 502])(
    'never retries a potentially partially accepted %i response',
    async (status) => {
      fetchMock.mockResolvedValue({
        ok: false,
        status,
        json: async () => ({ message: 'partial failure' }),
      });
      expect((await send()).status).toBe('UNKNOWN');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );
  it('never retries a lost or malformed successful response', async () => {
    fetchMock.mockRejectedValueOnce(new Error('timeout'));
    expect((await send()).status).toBe('UNKNOWN');
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
    expect((await send()).status).toBe('UNKNOWN');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('does not reroute old provider jobs or changed endpoint snapshots', async () => {
    expect((await send(createService(), '0212345678')).status).toBe('FAILED');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
