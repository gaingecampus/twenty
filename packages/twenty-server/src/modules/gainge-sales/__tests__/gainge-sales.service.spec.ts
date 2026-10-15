jest.mock('src/engine/core-modules/twenty-config/twenty-config.service', () => ({ TwentyConfigService: class {} }));
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { GaingeSalesService } from '../gainge-sales.service';

const originalFetch = global.fetch;
let settings: Record<string, string>;
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
it('recovers after temporary upstream errors', async () => {
  fetchMock.mockRejectedValueOnce(new Error('network'));
  expect(
    (await service.getMonthlySales('workspace', 'member', month)).status,
  ).toBe('UNAVAILABLE');
  succeed();
  expect(
    (await service.getMonthlySales('workspace', 'member', month)).status,
  ).toBe('READY');
});
