import { z } from 'zod';

export const getSalesMonthRange = (month: string, now = new Date()) => {
  const today = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
  }).format(now);

  if (
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(month) ||
    month < '2000-01' ||
    month > today.slice(0, 7)
  ) {
    throw new Error('Invalid sales month');
  }

  const [year, monthNumber] = month.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();

  return {
    startDate: `${month}-01`,
    endDate: month === today.slice(0, 7) ? today : `${month}-${lastDay}`,
  };
};

const amountSchema = z
  .number()
  .int()
  .nonnegative()
  .max(Number.MAX_SAFE_INTEGER);

export const salesReportSchema = z
  .object({
    startDate: z.string(),
    endDate: z.string(),
    includeVat: z.literal(false),
    generatedAt: z.string().datetime({ offset: true }),
    department: z.object({
      includeVat: z.literal(false),
      total: amountSchema,
      items: z
        .array(z.object({ label: z.string().min(1), amount: amountSchema }))
        .max(100),
    }),
  })
  .superRefine((report, context) => {
    const items = report.department.items;

    if (
      items.reduce((total, item) => total + item.amount, 0) !==
        report.department.total ||
      new Set(items.map((item) => item.label)).size !== items.length
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Inconsistent department totals',
      });
    }
  });

export type SalesReport = z.infer<typeof salesReportSchema>;

const rpcSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.number(),
  result: z.unknown().optional(),
  error: z.unknown().optional(),
});

export const parseSalesRpcResponse = (
  text: string,
  contentType: string,
  id: number,
) => {
  const messages: unknown[] = contentType.includes('text/event-stream')
    ? text
        .replace(/\r\n/g, '\n')
        .split('\n\n')
        .flatMap((event) => {
          const data = event
            .split('\n')
            .filter((line) => line.startsWith('data:'))
            .map((line) => line.slice(5).trimStart())
            .join('\n');

          return data ? [JSON.parse(data)] : [];
        })
    : [JSON.parse(text)];
  const response = messages
    .map((message) => rpcSchema.safeParse(message))
    .find((parsed) => parsed.success && parsed.data.id === id);

  if (
    !response?.success ||
    response.data.error !== undefined ||
    response.data.result === undefined
  ) {
    throw new Error('Invalid MCP response');
  }

  return response.data.result;
};
