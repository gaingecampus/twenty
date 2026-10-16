import { BadRequestException, Injectable } from '@nestjs/common';

import { z } from 'zod';

import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { type GaingeSalesReportDTO } from 'src/modules/gainge-sales/gainge-sales.dto';
import {
  getSalesMonthRange,
  parseSalesRpcResponse,
  salesReportSchema,
} from 'src/modules/gainge-sales/gainge-sales.utils';

const CACHE_TTL_MS = 60_000;
const REQUEST_TIMEOUT_MS = 15_000;
const FAILURE_CACHE_TTL_MS = 15_000;
const TIMELINE_TIMEOUT_MS = 25_000;
const MAX_ACTIVE_REPORTS = 6;
const MAX_RESPONSE_BYTES = 1_000_000;

@Injectable()
export class GaingeSalesService {
  private cache = new Map<
    string,
    { expiresAt: number; report: GaingeSalesReportDTO }
  >();
  private pending = new Map<string, Promise<GaingeSalesReportDTO>>();
  private configuration = '';
  private activeReports = 0;
  private timelineActive = false;

  private cacheReport(key: string, report: GaingeSalesReportDTO, ttl: number) {
    if (this.cache.size >= 24 && !this.cache.has(key)) {
      const oldestKey = this.cache.keys().next().value;

      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(key, { expiresAt: Date.now() + ttl, report });
  }

  constructor(private readonly config: TwentyConfigService) {}

  async getMonthlySales(
    workspaceId: string,
    memberId: string | undefined,
    month: string,
  ): Promise<GaingeSalesReportDTO> {
    let range: ReturnType<typeof getSalesMonthRange>;

    try {
      range = getSalesMonthRange(month);
    } catch {
      throw new BadRequestException(
        '조회할 월을 YYYY-MM 형식으로 입력해 주세요.',
      );
    }

    const empty = (status: string): GaingeSalesReportDTO => ({
      status,
      month,
      departments: [],
    });
    const url = this.config.get('GAINGE_SALES_MCP_URL');
    const token = this.config.get('GAINGE_SALES_MCP_TOKEN');
    const allowedWorkspace = this.config.get('GAINGE_SALES_WORKSPACE_ID');
    const allowAllMembers =
      this.config.get('GAINGE_SALES_ALLOW_ALL_MEMBERS') === true;
    const allowedMembers =
      this.config
        .get('GAINGE_SALES_MEMBER_IDS')
        ?.split(',')
        .map((id) => id.trim())
        .filter(Boolean) ?? [];
    const configuration = JSON.stringify([
      url,
      token,
      allowedWorkspace,
      allowedMembers,
      allowAllMembers,
    ]);

    // Drop cached data immediately when credentials or access scope change.
    if (configuration !== this.configuration) {
      this.cache.clear();
      this.pending.clear();
      this.configuration = configuration;
    }

    if (!url || !token || !allowedWorkspace) return empty('NOT_CONFIGURED');
    if (
      workspaceId !== allowedWorkspace ||
      !memberId ||
      (!allowAllMembers && !allowedMembers.includes(memberId))
    )
      return empty('FORBIDDEN');

    const key = `${workspaceId}:${range.startDate}:${range.endDate}`;
    const cached = this.cache.get(key);

    if (cached && cached.expiresAt > Date.now()) return cached.report;
    const pending = this.pending.get(key);

    if (pending) return pending;

    const request = this.fetchReport(url, token, month, range)
      .then((report) => {
        if (configuration !== this.configuration) return empty('UNAVAILABLE');
        this.cacheReport(
          key,
          report,
          report.status === 'READY' ? CACHE_TTL_MS : FAILURE_CACHE_TTL_MS,
        );

        return report;
      })
      .finally(() => {
        if (this.pending.get(key) === request) this.pending.delete(key);
      });

    this.pending.set(key, request);

    return request;
  }

  async getSalesTimeline(
    workspaceId: string,
    memberId: string | undefined,
    month: string,
  ): Promise<GaingeSalesReportDTO> {
    // Check access on every request, including cache hits.
    const monthly = await this.getMonthlySales(workspaceId, memberId, month);

    if (monthly.status !== 'READY') return monthly;
    const configuration = this.configuration;
    const key = `timeline:${workspaceId}:${monthly.startDate}:${monthly.endDate}`;
    const cached = this.cache.get(key);

    if (
      cached &&
      cached.expiresAt > Date.now() &&
      (cached.report.status !== 'READY' ||
        (cached.report.total === monthly.total &&
          JSON.stringify(cached.report.departments) ===
            JSON.stringify(monthly.departments)))
    )
      return cached.report;
    const pending = this.pending.get(key);

    if (pending) return pending;
    if (this.timelineActive)
      return { status: 'UNAVAILABLE', month, departments: [] };
    this.timelineActive = true;
    const url = this.config.get('GAINGE_SALES_MCP_URL')!;
    const token = this.config.get('GAINGE_SALES_MCP_TOKEN')!;
    const request = (async (): Promise<GaingeSalesReportDTO> => {
      const dayCount = Number(monthly.endDate!.slice(-2));
      const days: NonNullable<GaingeSalesReportDTO['days']> = [];
      let nextDay = 1;
      let failed = false;
      const deadline = Date.now() + TIMELINE_TIMEOUT_MS;

      // At most three requests at once; never publish an incomplete curve.
      await Promise.all(
        Array.from({ length: Math.min(3, dayCount) }, async () => {
          while (!failed && nextDay <= dayCount) {
            const day = nextDay++;
            const date = `${month}-${String(day).padStart(2, '0')}`;

            if (
              Date.now() >= deadline ||
              configuration !== this.configuration
            ) {
              failed = true;
              break;
            }
            const report =
              day === dayCount
                ? monthly
                : await this.fetchReport(
                    url,
                    token,
                    month,
                    {
                      startDate: monthly.startDate!,
                      endDate: date,
                    },
                    Math.min(
                      REQUEST_TIMEOUT_MS,
                      Math.max(1, deadline - Date.now()),
                    ),
                  );

            if (report.status !== 'READY' || report.total === undefined) {
              failed = true;
              break;
            }
            days.push({
              date,
              total: report.total,
              departments: report.departments,
            });
          }
        }),
      );

      if (
        configuration !== this.configuration ||
        failed ||
        days.length !== dayCount
      ) {
        const failure = { status: 'UNAVAILABLE', month, departments: [] };

        if (configuration === this.configuration)
          this.cacheReport(key, failure, FAILURE_CACHE_TTL_MS);
        return failure;
      }
      const report = {
        ...monthly,
        days: days.sort((a, b) => a.date.localeCompare(b.date)),
      };

      this.cacheReport(key, report, 300_000);
      return report;
    })().finally(() => {
      this.timelineActive = false;
      if (this.pending.get(key) === request) this.pending.delete(key);
    });

    this.pending.set(key, request);
    return request;
  }

  private async fetchReport(
    url: string,
    token: string,
    month: string,
    range: { startDate: string; endDate: string },
    timeoutMs = REQUEST_TIMEOUT_MS,
  ): Promise<GaingeSalesReportDTO> {
    if (this.activeReports >= MAX_ACTIVE_REPORTS) {
      return { status: 'UNAVAILABLE', month, departments: [] };
    }
    this.activeReports += 1;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const empty = (status: string): GaingeSalesReportDTO => ({
      status,
      month,
      departments: [],
    });

    try {
      const endpoint = new URL(url);

      if (
        endpoint.protocol !== 'https:' ||
        endpoint.username ||
        endpoint.password ||
        endpoint.search ||
        endpoint.hash
      )
        return empty('NOT_CONFIGURED');

      const post = async (body: unknown) => {
        const response = await fetch(url, {
          method: 'POST',
          redirect: 'error',
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json, text/event-stream',
            'MCP-Protocol-Version': '2025-03-26',
          },
          body: JSON.stringify(body),
        });

        if (response.status === 401 || response.status === 403)
          throw new Error('MCP_AUTH');
        if (!response.ok) throw new Error('MCP_UNAVAILABLE');

        return response;
      };
      const readResult = async (response: Response, id: number) => {
        const reader = response.body?.getReader();

        if (!reader) throw new Error('MCP_EMPTY');
        const decoder = new TextDecoder();
        let text = '';
        let bytes = 0;

        try {
          while (true) {
            const chunk = await reader.read();

            if (chunk.done) break;
            bytes += chunk.value.byteLength;
            if (bytes > MAX_RESPONSE_BYTES) throw new Error('MCP_TOO_LARGE');
            text += decoder.decode(chunk.value, { stream: true });
          }
        } finally {
          await reader.cancel();
        }
        text += decoder.decode();

        return parseSalesRpcResponse(
          text,
          response.headers.get('content-type') ?? '',
          id,
        );
      };

      const initialized = await readResult(
        await post({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2025-03-26',
            capabilities: {},
            clientInfo: { name: 'gainge-crm-sales', version: '1.0.0' },
          },
        }),
        1,
      );

      z.object({ protocolVersion: z.literal('2025-03-26') }).parse(initialized);
      const notification = await post({
        jsonrpc: '2.0',
        method: 'notifications/initialized',
      });

      await notification.body?.cancel();
      const result = z
        .object({
          isError: z.boolean().optional(),
          structuredContent: z.unknown(),
        })
        .parse(
          await readResult(
            await post({
              jsonrpc: '2.0',
              id: 2,
              method: 'tools/call',
              params: {
                name: 'get_sales_by_department',
                arguments: range,
              },
            }),
            2,
          ),
        );

      if (result.isError) throw new Error('MCP_TOOL_ERROR');
      const report = salesReportSchema.parse(result.structuredContent);

      if (
        report.startDate !== range.startDate ||
        report.endDate !== range.endDate
      )
        throw new Error('MCP_PERIOD_MISMATCH');

      return {
        status: 'READY',
        month,
        ...range,
        generatedAt: report.generatedAt,
        fetchedAt: new Date().toISOString(),
        total: report.department.total,
        departments: report.department.items,
      };
    } catch (error) {
      // Upstream messages may contain credentials or internal SQL; never forward them.
      return empty(
        error instanceof Error && error.message === 'MCP_AUTH'
          ? 'AUTH_ERROR'
          : 'UNAVAILABLE',
      );
    } finally {
      clearTimeout(timeout);
      this.activeReports -= 1;
    }
  }
}
