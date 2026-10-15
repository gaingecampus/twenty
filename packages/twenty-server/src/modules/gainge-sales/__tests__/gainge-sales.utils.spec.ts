import {
  getSalesMonthRange,
  parseSalesRpcResponse,
  salesReportSchema,
} from '../gainge-sales.utils';

describe('sales month in Korea', () => {
  it('includes today and crosses the month boundary in Korea', () => {
    expect(
      getSalesMonthRange('2026-11', new Date('2026-10-31T16:00:00Z')),
    ).toEqual({ startDate: '2026-11-01', endDate: '2026-11-01' });
  });
  it('includes the last day of a historical leap month', () => {
    expect(
      getSalesMonthRange('2024-02', new Date('2026-10-15T00:00:00Z')).endDate,
    ).toBe('2024-02-29');
  });
  it.each(['2026-13', '2026-00', '2026-1', '2027-01', '1999-01', 'invalid'])(
    'rejects invalid or future month %s',
    (month) => {
      expect(() => getSalesMonthRange(month, new Date('2026-10-15'))).toThrow();
    },
  );
});

describe('MCP responses', () => {
  it('reads JSON and matches the request ID', () => {
    expect(
      parseSalesRpcResponse(
        '{"jsonrpc":"2.0","id":2,"result":{"ok":true}}',
        'application/json',
        2,
      ),
    ).toEqual({ ok: true });
  });
  it('reads SSE with notifications and CRLF', () => {
    expect(
      parseSalesRpcResponse(
        'event: message\r\ndata: {"jsonrpc":"2.0","method":"notification"}\r\n\r\ndata: {"jsonrpc":"2.0","id":2,\r\ndata: "result":{"ok":true}}\r\n\r\n',
        'text/event-stream',
        2,
      ),
    ).toEqual({ ok: true });
  });
  it.each([
    '{"jsonrpc":"2.0","id":3,"result":{}}',
    '{"jsonrpc":"2.0","id":2,"error":{"message":"secret"}}',
  ])('rejects missing results', (text) => {
    expect(() => parseSalesRpcResponse(text, 'application/json', 2)).toThrow();
  });
});

const report = {
  startDate: '2026-10-01',
  endDate: '2026-10-15',
  generatedAt: '2026-10-15T19:00:00+09:00',
  includeVat: false,
  department: {
    includeVat: false,
    total: 100,
    items: [{ label: '캠퍼스BU', amount: 100 }],
  },
};

it('rejects incorrect VAT, totals, duplicate departments and invalid amounts', () => {
  expect(salesReportSchema.safeParse(report).success).toBe(true);
  expect(
    salesReportSchema.safeParse({ ...report, includeVat: true }).success,
  ).toBe(false);
  expect(
    salesReportSchema.safeParse({
      ...report,
      department: { ...report.department, total: 101 },
    }).success,
  ).toBe(false);
  expect(
    salesReportSchema.safeParse({
      ...report,
      department: {
        ...report.department,
        total: 200,
        items: [...report.department.items, ...report.department.items],
      },
    }).success,
  ).toBe(false);
  expect(
    salesReportSchema.safeParse({
      ...report,
      department: { ...report.department, total: NaN },
    }).success,
  ).toBe(false);
});
