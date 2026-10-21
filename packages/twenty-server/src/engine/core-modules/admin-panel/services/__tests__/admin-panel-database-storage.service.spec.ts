import { AdminPanelDatabaseStorageService } from 'src/engine/core-modules/admin-panel/services/admin-panel-database-storage.service';
import { type TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

const mockExecuteFile = jest.fn();
const mockRdsSend = jest.fn();
const mockCloudWatchSend = jest.fn();

jest.mock('node:util', () => ({
  ...jest.requireActual('node:util'),
  promisify:
    () =>
    (...args: unknown[]) =>
      mockExecuteFile(...args),
}));
jest.mock('@aws-sdk/client-rds', () => ({
  ...jest.requireActual('@aws-sdk/client-rds'),
  RDSClient: jest
    .fn()
    .mockImplementation(() => ({ send: mockRdsSend, destroy: jest.fn() })),
}));
jest.mock('@aws-sdk/client-cloudwatch', () => ({
  ...jest.requireActual('@aws-sdk/client-cloudwatch'),
  CloudWatchClient: jest.fn().mockImplementation(() => ({
    send: mockCloudWatchSend,
    destroy: jest.fn(),
  })),
}));

const GIBIBYTE = 1024 ** 3;
const RDS_HOST = 'test-db.abc123.ap-northeast-2.rds.amazonaws.com';
const NOW = new Date('2026-10-21T07:00:00Z');
const createService = (
  url = 'postgres://user:password@localhost:5432/default',
  environment = 'development',
) => {
  const config = {
    get: jest.fn((key: string) =>
      key === 'PG_DATABASE_URL' ? url : environment,
    ),
  };
  return new AdminPanelDatabaseStorageService(
    config as unknown as TwentyConfigService,
  );
};

const configureRds = () => {
  mockRdsSend.mockResolvedValue({
    DBInstances: [
      {
        Endpoint: { Address: RDS_HOST, Port: 5432 },
        Engine: 'postgres',
        AllocatedStorage: 20,
      },
    ],
  });
  mockCloudWatchSend.mockResolvedValue({
    Datapoints: [
      { Timestamp: new Date(NOW.getTime() - 120000), Average: 10 * GIBIBYTE },
      { Timestamp: new Date(NOW.getTime() - 60000), Average: 12 * GIBIBYTE },
    ],
  });
};

describe('AdminPanelDatabaseStorageService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
    mockExecuteFile.mockReset();
    mockRdsSend.mockReset();
    mockCloudWatchSend.mockReset();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('measures the Docker data filesystem and coalesces concurrent polling', async () => {
    mockExecuteFile
      .mockResolvedValueOnce({ stdout: '{"5432/tcp":[{"HostPort":"5432"}]}' })
      .mockResolvedValueOnce({ stdout: '4096 100000 80000\n' });
    const service = createService();
    const [first, concurrent] = await Promise.all([
      service.getMetrics(),
      service.getMetrics(),
    ]);
    expect(first).toMatchObject({
      source: 'docker',
      status: 'available',
      totalBytes: 409600000,
      availableBytes: 327680000,
    });
    expect(concurrent).toEqual(first);
    expect(await service.getMetrics()).toEqual(first);
    expect(mockExecuteFile).toHaveBeenCalledTimes(2);
    expect(mockExecuteFile.mock.calls[1][1]).toEqual([
      'exec',
      'twenty-dev-db-1',
      'stat',
      '-f',
      '-c',
      '%S %b %a',
      '/var/lib/postgresql/data',
    ]);
  });

  it('does not inspect Docker when the mapped DB port differs', async () => {
    mockExecuteFile.mockResolvedValue({
      stdout: '{"5432/tcp":[{"HostPort":"5433"}]}',
    });
    expect(await createService().getMetrics()).toMatchObject({
      status: 'unavailable',
      totalBytes: null,
    });
    expect(mockExecuteFile).toHaveBeenCalledTimes(1);
  });

  it.each(['0 10 5', '4096 10 11', 'garbage', '4096 10 -1'])(
    'rejects invalid filesystem statistics: %s',
    async (stdout) => {
      mockExecuteFile
        .mockResolvedValueOnce({ stdout: '{"5432/tcp":[{"HostPort":"5432"}]}' })
        .mockResolvedValueOnce({ stdout });
      expect((await createService().getMetrics()).status).toBe('unavailable');
    },
  );

  it('does not inspect the app host or invoke Docker in production', async () => {
    expect(
      await createService(undefined, 'production').getMetrics(),
    ).toMatchObject({ source: 'unsupported', totalBytes: null });
    expect(
      await createService(
        'postgres://user:password@remote.example:5432/default',
      ).getMetrics(),
    ).toMatchObject({ source: 'unsupported' });
    expect(mockExecuteFile).not.toHaveBeenCalled();
  });

  it('returns unavailable on timeout and retries after the cache expires', async () => {
    mockExecuteFile.mockReturnValue(new Promise(() => {}));
    const service = createService();
    const pending = service.getMetrics();
    await jest.advanceTimersByTimeAsync(2500);
    expect((await pending).status).toBe('unavailable');
    mockExecuteFile.mockRejectedValue(new Error('Docker not running'));
    await jest.advanceTimersByTimeAsync(60000);
    expect((await service.getMetrics()).status).toBe('unavailable');
    expect(mockExecuteFile).toHaveBeenCalledTimes(2);
  });

  it('reads actual RDS allocation and selects the newest CloudWatch datapoint', async () => {
    configureRds();
    const metrics = await createService(
      `postgres://user:password@${RDS_HOST}:5432/default`,
      'production',
    ).getMetrics();
    expect(metrics).toMatchObject({
      source: 'rds',
      status: 'available',
      totalBytes: 20 * GIBIBYTE,
      availableBytes: 12 * GIBIBYTE,
      availableMeasuredAt: '2026-10-21T06:59:00.000Z',
    });
    expect(mockRdsSend.mock.calls[0][0].input.DBInstanceIdentifier).toBe(
      'test-db',
    );
    expect(mockCloudWatchSend.mock.calls[0][0].input).toMatchObject({
      Namespace: 'AWS/RDS',
      MetricName: 'FreeStorageSpace',
      Period: 60,
      Statistics: ['Average'],
    });
    expect(mockExecuteFile).not.toHaveBeenCalled();
  });

  it('refreshes the actual allocated size after autoscaling and preserves zero free space', async () => {
    configureRds();
    const service = createService(
      `postgres://user:password@${RDS_HOST}/default`,
    );
    expect((await service.getMetrics()).totalBytes).toBe(20 * GIBIBYTE);
    await jest.advanceTimersByTimeAsync(60000);
    mockRdsSend.mockResolvedValue({
      DBInstances: [
        {
          Endpoint: { Address: RDS_HOST, Port: 5432 },
          Engine: 'postgres',
          AllocatedStorage: 30,
        },
      ],
    });
    mockCloudWatchSend.mockResolvedValue({
      Datapoints: [{ Timestamp: new Date(), Average: 0 }],
    });
    expect(await service.getMetrics()).toMatchObject({
      status: 'available',
      totalBytes: 30 * GIBIBYTE,
      availableBytes: 0,
    });
    expect(mockRdsSend).toHaveBeenCalledTimes(2);
  });

  it('keeps the allocation when CloudWatch access is denied', async () => {
    configureRds();
    mockCloudWatchSend.mockRejectedValue(new Error('AccessDenied'));
    expect(
      await createService(
        `postgres://user:password@${RDS_HOST}/default`,
      ).getMetrics(),
    ).toMatchObject({
      status: 'partial',
      totalBytes: 20 * GIBIBYTE,
      availableBytes: null,
    });
  });

  it('does not report zero when both AWS APIs are inaccessible', async () => {
    mockRdsSend.mockRejectedValue(new Error('AccessDenied'));
    mockCloudWatchSend.mockRejectedValue(new Error('AccessDenied'));
    expect(
      await createService(
        `postgres://user:password@${RDS_HOST}/default`,
      ).getMetrics(),
    ).toMatchObject({
      status: 'unavailable',
      totalBytes: null,
      availableBytes: null,
    });
  });

  it('rejects an RDS instance whose endpoint does not match the connected database', async () => {
    configureRds();
    mockRdsSend.mockResolvedValue({
      DBInstances: [
        {
          Endpoint: { Address: 'different.example', Port: 5432 },
          Engine: 'postgres',
          AllocatedStorage: 20,
        },
      ],
    });
    expect(
      (
        await createService(
          `postgres://user:password@${RDS_HOST}/default`,
        ).getMetrics()
      ).status,
    ).toBe('unavailable');
  });

  it.each([
    { Timestamp: new Date(NOW.getTime() - 600000), Average: 10 * GIBIBYTE },
    { Timestamp: new Date(NOW.getTime() + 60000), Average: 10 * GIBIBYTE },
    { Timestamp: NOW, Average: 30 * GIBIBYTE },
    { Timestamp: NOW, Average: -1 },
    { Timestamp: NOW },
  ])('does not show stale or invalid free-space samples', async (sample) => {
    configureRds();
    mockCloudWatchSend.mockResolvedValue({ Datapoints: [sample] });
    expect(
      await createService(
        `postgres://user:password@${RDS_HOST}/default`,
      ).getMetrics(),
    ).toMatchObject({ status: 'partial', availableBytes: null });
  });
});
