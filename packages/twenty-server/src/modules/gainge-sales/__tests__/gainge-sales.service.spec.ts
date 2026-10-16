jest.mock(
  'src/engine/core-modules/twenty-config/twenty-config.service',
  () => ({ TwentyConfigService: class {} }),
);
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { GaingeSalesService } from '../gainge-sales.service';

const originalFetch = global.fetch;
let settings: Record<string, string | boolean>;
let service: GaingeSalesService;
let fetchMock: jest.Mock;
const month = '2026-09';
const report = {
  startDate: '2026-09-01',
  endDate: '2026-09-30',
  generatedAt: '2026-10-15T19:00:00+09:00',
  includeVat: false,
  department: {
    includeVat: false,
    total: 100,
    items: [
      { label: '캠퍼스BU', amount: 100 },
      { label: 'AX센터', amount: 0 },
    ],
  },
};
const json = (id: number, result: unknown) =>
  new Response(JSON.stringify({ jsonrpc: '2.0', id, result }), {
    headers: { 'content-type': 'application/json' },
  });
const succeed = () => {
  fetchMock
    .mockResolvedValueOnce(json(1, { protocolVersion: '2025-03-26' }))
    .mockResolvedValueOnce(new Response(null, { status: 202 }))
    .mockResolvedValueOnce(json(2, { structuredContent: report }));
};

beforeEach(() => {
  settings = {
    GAINGE_SALES_MCP_URL: 'https://campus.example/api/mcp',
    GAINGE_SALES_MCP_TOKEN: 'secret-token',
    GAINGE_SALES_WORKSPACE_ID: 'workspace',
    GAINGE_SALES_MEMBER_IDS: 'member',
  };
  service = new GaingeSalesService({
    get: (key: string) => settings[key],
  } as unknown as TwentyConfigService);
  fetchMock = jest.fn();
  global.fetch = fetchMock;
});
afterEach(() => {
  global.fetch = originalFetch;
});

it('does not call upstream when unconfigured', async () => {
  delete settings.GAINGE_SALES_MCP_TOKEN;
  expect(
    await service.getMonthlySales('workspace', 'member', month),
  ).toMatchObject({ status: 'NOT_CONFIGURED', departments: [] });
  expect(fetchMock).not.toHaveBeenCalled();
});
it.each([
  ['other', 'member'],
  ['workspace', 'other'],
  ['workspace', undefined],
])(
  'checks workspace and member access before reading data',
  async (workspace, member) => {
    expect(
      (await service.getMonthlySales(workspace!, member, month)).status,
    ).toBe('FORBIDDEN');
    expect(fetchMock).not.toHaveBeenCalled();
  },
);
it('queries the exact month, retains zero departments, caches and deduplicates concurrent requests', async () => {
  succeed();
  const [first, second] = await Promise.all([
    service.getMonthlySales('workspace', 'member', month),
    service.getMonthlySales('workspace', 'member', month),
  ]);
  expect(first).toMatchObject({
    status: 'READY',
    total: 100,
    departments: report.department.items,
  });
  expect(second).toEqual(first);
  expect(await service.getMonthlySales('workspace', 'member', month)).toEqual(
    first,
  );
  expect(fetchMock).toHaveBeenCalledTimes(3);
  expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toMatchObject({
    params: {
      name: 'get_sales_by_department',
      arguments: { startDate: '2026-09-01', endDate: '2026-09-30' },
    },
  });
  expect(JSON.stringify(first)).not.toContain('secret-token');
});
it('invalidates cached data after token change', async () => {
  succeed();
  await service.getMonthlySales('workspace', 'member', month);
  settings.GAINGE_SALES_MCP_TOKEN = 'replacement';
  fetchMock.mockResolvedValueOnce(
    new Response('secret error', { status: 401 }),
  );
  expect(await service.getMonthlySales('workspace', 'member', month)).toEqual({
    status: 'AUTH_ERROR',
    month,
    departments: [],
  });
});
it('sanitizes tool errors instead of returning partial or zero sales', async () => {
  fetchMock
    .mockResolvedValueOnce(json(1, { protocolVersion: '2025-03-26' }))
    .mockResolvedValueOnce(new Response(null, { status: 202 }))
    .mockResolvedValueOnce(
      json(2, {
        isError: true,
        structuredContent: report,
        content: [{ text: 'secret-token' }],
      }),
    );
  expect(await service.getMonthlySales('workspace', 'member', month)).toEqual({
    status: 'UNAVAILABLE',
    month,
    departments: [],
  });
});
it('rejects insecure endpoints before transmitting a token', async () => {
  settings.GAINGE_SALES_MCP_URL = 'http://campus.example/api/mcp';
  expect(
    (await service.getMonthlySales('workspace', 'member', month)).status,
  ).toBe('NOT_CONFIGURED');
  expect(fetchMock).not.toHaveBeenCalled();
});
it('rejects a result for a different period', async () => {
  fetchMock
    .mockResolvedValueOnce(json(1, { protocolVersion: '2025-03-26' }))
    .mockResolvedValueOnce(new Response(null, { status: 202 }))
    .mockResolvedValueOnce(
      json(2, { structuredContent: { ...report, endDate: '2026-09-29' } }),
    );
  expect(
    (await service.getMonthlySales('workspace', 'member', month)).status,
  ).toBe('UNAVAILABLE');
});
it('recovers after the temporary failure cooldown expires', async () => {
  fetchMock.mockRejectedValueOnce(new Error('network'));
  expect(
    (await service.getMonthlySales('workspace', 'member', month)).status,
  ).toBe('UNAVAILABLE');
  const clock = jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 15_001);

  try {
    succeed();
    expect(
      (await service.getMonthlySales('workspace', 'member', month)).status,
    ).toBe('READY');
  } finally {
    clock.mockRestore();
  }
});

it('allows any authenticated member in the configured workspace when all-members access is enabled', async () => {
  settings.GAINGE_SALES_ALLOW_ALL_MEMBERS = true;
  delete settings.GAINGE_SALES_MEMBER_IDS;
  succeed();
  expect(
    (await service.getMonthlySales('workspace', 'another-member', month))
      .status,
  ).toBe('READY');
});
it.each([
  ['other-workspace', 'member'],
  ['workspace', undefined],
])(
  'never bypasses workspace isolation or member authentication in all-members mode',
  async (workspace, member) => {
    settings.GAINGE_SALES_ALLOW_ALL_MEMBERS = true;
    expect(
      (await service.getMonthlySales(workspace!, member, month)).status,
    ).toBe('FORBIDDEN');
    expect(fetchMock).not.toHaveBeenCalled();
  },
);
it('denies everyone when designated-member mode has an empty list', async () => {
  settings.GAINGE_SALES_MEMBER_IDS = '';
  expect(
    (await service.getMonthlySales('workspace', 'member', month)).status,
  ).toBe('FORBIDDEN');
  expect(fetchMock).not.toHaveBeenCalled();
});
it('revokes cached access when switching back to designated members', async () => {
  settings.GAINGE_SALES_ALLOW_ALL_MEMBERS = true;
  succeed();
  await service.getMonthlySales('workspace', 'another-member', month);
  settings.GAINGE_SALES_ALLOW_ALL_MEMBERS = false;
  expect(
    (await service.getMonthlySales('workspace', 'another-member', month))
      .status,
  ).toBe('FORBIDDEN');
  expect(fetchMock).toHaveBeenCalledTimes(3);
});

const succeedTimeline = (failDay?: string) => {
  fetchMock.mockImplementation(async (_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    if (body.method === 'initialize')
      return json(1, { protocolVersion: '2025-03-26' });
    if (body.method === 'notifications/initialized')
      return new Response(null, { status: 202 });
    const range = body.params.arguments;
    if (range.endDate === failDay) return new Response(null, { status: 503 });
    return json(2, { structuredContent: { ...report, ...range } });
  });
};

it('returns ordered inclusive daily cumulative ranges and shares cached timeline requests', async () => {
  succeedTimeline();
  const [first, second] = await Promise.all([
    service.getSalesTimeline('workspace', 'member', month),
    service.getSalesTimeline('workspace', 'member', month),
  ]);
  expect(first.status).toBe('READY');
  expect(first.days).toHaveLength(30);
  expect(first.days?.[0]).toMatchObject({ date: '2026-09-01', total: 100 });
  expect(first.days?.[29]).toMatchObject({
    date: '2026-09-30',
    total: first.total,
  });
  expect(second).toEqual(first);
  const ranges = fetchMock.mock.calls
    .map(([, init]) => JSON.parse(init.body))
    .filter((body) => body.method === 'tools/call')
    .map((body) => body.params.arguments);
  expect(ranges).toHaveLength(30);
  expect(ranges.every((range) => range.startDate === '2026-09-01')).toBe(true);
  const calls = fetchMock.mock.calls.length;
  expect(await service.getSalesTimeline('workspace', 'member', month)).toEqual(
    first,
  );
  expect(fetchMock).toHaveBeenCalledTimes(calls);
  settings.GAINGE_SALES_MEMBER_IDS = 'someone-else';
  expect(
    (await service.getSalesTimeline('workspace', 'member', month)).status,
  ).toBe('FORBIDDEN');
  expect(fetchMock).toHaveBeenCalledTimes(calls);
});

it('does not return a partial or fabricated graph when a day fails; monthly figures survive', async () => {
  succeedTimeline('2026-09-02');
  const result = await service.getSalesTimeline('workspace', 'member', month);
  expect(result).toEqual({ status: 'UNAVAILABLE', month, departments: [] });
  expect(
    (await service.getMonthlySales('workspace', 'member', month)).total,
  ).toBe(100);
});

it('caps upstream concurrency across different months without an unbounded queue', async () => {
  succeedTimeline();
  const respond = fetchMock.getMockImplementation()!;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  fetchMock.mockImplementation(async (...args: unknown[]) => {
    await gate;
    return respond(...args);
  });
  const requests = Array.from({ length: 8 }, (_, index) =>
    service.getMonthlySales(
      'workspace',
      'member',
      `2025-${String(index + 1).padStart(2, '0')}`,
    ),
  );
  expect(fetchMock).toHaveBeenCalledTimes(6);
  release();
  const reports = await Promise.all(requests);
  expect(reports.filter((item) => item.status === 'READY')).toHaveLength(6);
  expect(reports.filter((item) => item.status === 'UNAVAILABLE')).toHaveLength(
    2,
  );
});

it('cools down failed timeline retries while retaining monthly totals', async () => {
  succeedTimeline('2026-09-02');
  await service.getSalesTimeline('workspace', 'member', month);
  const calls = fetchMock.mock.calls.length;
  const retry = await service.getSalesTimeline('workspace', 'member', month);
  expect(retry.status).toBe('UNAVAILABLE');
  expect(fetchMock).toHaveBeenCalledTimes(calls);
  expect(
    (await service.getMonthlySales('workspace', 'member', month)).status,
  ).toBe('READY');
});

it('allows only one distinct timeline fan-out per process', async () => {
  succeedTimeline();
  await service.getMonthlySales('workspace', 'member', month);
  await service.getMonthlySales('workspace', 'member', '2026-08');
  const respond = fetchMock.getMockImplementation()!;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  fetchMock.mockImplementation(async (...args: unknown[]) => {
    await gate;
    return respond(...args);
  });
  const first = service.getSalesTimeline('workspace', 'member', month);
  const second = await service.getSalesTimeline(
    'workspace',
    'member',
    '2026-08',
  );
  expect(second.status).toBe('UNAVAILABLE');
  release();
  expect((await first).status).toBe('READY');
  expect(
    (await service.getSalesTimeline('workspace', 'member', '2026-08')).status,
  ).toBe('READY');
});

it('aborts stalled upstream requests and suppresses immediate retries', async () => {
  jest.useFakeTimers();
  try {
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener(
            'abort',
            () => reject(new Error('aborted')),
            { once: true },
          );
        }),
    );
    const request = service.getMonthlySales('workspace', 'member', month);
    await jest.advanceTimersByTimeAsync(15_000);
    expect((await request).status).toBe('UNAVAILABLE');
    expect(
      (await service.getMonthlySales('workspace', 'member', month)).status,
    ).toBe('UNAVAILABLE');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  } finally {
    jest.useRealTimers();
  }
});
