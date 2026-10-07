import { getWorkspaceContext } from 'src/engine/twenty-orm/storage/orm-workspace-context.storage';
import { generateText } from 'ai';
import { FieldSummaryService } from '../field-summary.service';
import {
  type SummaryContract,
  type SummaryVisit,
  splitSummarySource,
  summarySource,
  summarySourceHash,
} from '../field-summary-source';
import { type UserWorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';

jest.mock(
  'src/engine/twenty-orm/storage/orm-workspace-context.storage',
  () => ({ getWorkspaceContext: jest.fn() }),
);
jest.mock('ai', () => ({ generateText: jest.fn() }));
const generated = jest.mocked(generateText);
const contract: SummaryContract = {
  id: 'contract',
  name: '컨설팅',
  consultingGoal: '실행 습관 정착',
  successCriteria: '주간 회의',
  plannedSessionCount: 10,
};
const visit: SummaryVisit = {
  id: 'visit',
  contractId: 'contract',
  name: '진단',
  visitDate: '2026-10-01',
  sessionNumber: 1,
  recordStatus: 'SUBMITTED',
  activities: '영업 현황 진단',
  decisions: '매주 회의',
  nextActions: '지표 초안 공유',
  goalSnapshot: '실행 습관 정착',
  criteriaSnapshot: '주간 회의',
};
const auth = {
  type: 'user',
  workspace: { id: 'workspace', fastModel: 'model' },
  userWorkspaceId: 'user',
} as UserWorkspaceAuthContext;

const setup = () => {
  const findOne = jest.fn().mockResolvedValue(contract);
  const find = jest.fn().mockResolvedValue([visit]);
  const orm = {
    executeInWorkspaceContext: jest.fn((fn: () => Promise<unknown>) => fn()),
    getRepository: jest.fn((_id, name) =>
      Promise.resolve(name === 'onboarding' ? { findOne } : { find }),
    ),
  };
  const cache = new Map<string, unknown>();
  const cacheService = {
    get: jest.fn((key) => Promise.resolve(cache.get(key))),
    set: jest.fn((key, value) => {
      cache.set(key, value);
      return Promise.resolve();
    }),
  };
  const persisted = new Map<string, unknown>();
  const storage = {
    get: jest.fn(async ({ key }) =>
      persisted.has(key) ? [{ value: persisted.get(key) }] : [],
    ),
    set: jest.fn(async ({ key, value }) => {
      persisted.set(key, value);
    }),
  };
  const models = {
    getAvailableModels: jest.fn(() => ['model']),
    validateModelAvailability: jest.fn(),
    resolveModelForAgent: jest.fn().mockResolvedValue({ model: 'model' }),
  };
  const billing = {
    hasAvailableCreditsOrThrow: jest.fn().mockResolvedValue(undefined),
  };
  const aiBilling = {
    calculateAndBillUsage: jest.fn().mockResolvedValue(undefined),
  };
  const service = new FieldSummaryService(
    orm as never,
    models as never,
    billing as never,
    aiBilling as never,
    cacheService as never,
    storage as never,
  );
  return { service, find, findOne, cacheService, models, orm, storage, cache };
};
beforeEach(() => {
  jest.mocked(getWorkspaceContext).mockReturnValue({
    userWorkspaceRoleMap: { user: 'reader-role' },
    apiKeyRoleMap: {},
  } as never);
  generated.mockReset();
  generated.mockResolvedValue({
    text: '영업 현황을 진단했습니다. 매주 회의를 진행하기로 했으며 지표 초안을 공유할 예정입니다.',
    finishReason: 'stop',
    usage: { inputTokens: 100, outputTokens: 50, inputTokenDetails: {} },
  } as never);
});
it('uses all contract records, including drafts, and reuses only matching source', async () => {
  const { service, find } = setup();
  const visits = Array.from({ length: 125 }, (_, index) => ({
    ...visit,
    id: String(index),
    recordStatus: index === 124 ? 'DRAFT' : 'SUBMITTED',
  }));
  find.mockResolvedValue(visits);
  const result = await service.summarize('contract', auth);
  expect(result.recordCount).toBe(125);
  expect(find.mock.calls[0][0]).toMatchObject({
    where: { contractId: 'contract' },
  });
  expect(find.mock.calls[0][0].take).toBeUndefined();
  expect(generated.mock.calls.map(([call]) => call.prompt).join('')).toContain(
    'DRAFT',
  );
  const count = generated.mock.calls.length;
  await service.summarize('contract', auth);
  expect(generated).toHaveBeenCalledTimes(count);
});
it('regenerates after edits, goal changes and deletions', async () => {
  const { service, find, findOne } = setup();
  await service.summarize('contract', auth);
  find.mockResolvedValue([{ ...visit, decisions: '격주 회의로 변경' }]);
  await service.summarize('contract', auth);
  findOne.mockResolvedValue({ ...contract, consultingGoal: '신규 목표' });
  await service.summarize('contract', auth);
  find.mockResolvedValue([]);
  await service.summarize('contract', auth);
  expect(generated).toHaveBeenCalledTimes(4);
});
it('checks record access before reading a cached summary', async () => {
  const { service, findOne, cacheService } = setup();
  await service.summarize('contract', auth);
  cacheService.get.mockClear();
  findOne.mockResolvedValue(null);
  await expect(service.summarize('contract', auth)).rejects.toThrow();
  expect(cacheService.get).not.toHaveBeenCalled();
});
it('isolates workspace cache and permission-filtered record sets', async () => {
  const { service, find } = setup();
  await service.summarize('contract', auth);
  await service.summarize('contract', {
    ...auth,
    workspace: { ...auth.workspace, id: 'other' },
  });
  find.mockResolvedValue([]);
  await service.summarize('contract', auth);
  expect(generated).toHaveBeenCalledTimes(3);
});
it('does not cache failed generation and permits retry', async () => {
  const { service, cacheService } = setup();
  generated.mockRejectedValueOnce(new Error('timeout'));
  await expect(service.summarize('contract', auth)).rejects.toThrow('timeout');
  expect(cacheService.set).not.toHaveBeenCalled();
  await service.summarize('contract', auth);
  expect(cacheService.set).toHaveBeenCalledTimes(1);
});
it('coalesces concurrent requests for the same source', async () => {
  const { service } = setup();
  await Promise.all([
    service.summarize('contract', auth),
    service.summarize('contract', auth),
  ]);
  expect(generated).toHaveBeenCalledTimes(1);
});
it('never truncates long source material when splitting', () => {
  const source = summarySource(contract, [
    { ...visit, activities: '중요한 사실'.repeat(10000) },
  ]);
  expect(splitSummarySource(source).join('')).toBe(source);
  expect(summarySourceHash(source)).not.toBe(
    summarySourceHash(source + '수정'),
  );
});

it('passes the caller role to both repositories without bypassing permissions', async () => {
  const { service, orm } = setup();
  await service.summarize('contract', auth);
  expect(orm.getRepository.mock.calls).toEqual([
    ['workspace', 'onboarding', { intersectionOf: ['reader-role'] }],
    ['workspace', 'fieldVisit', { intersectionOf: ['reader-role'] }],
  ]);
});
it('rejects a user without a role before reading records or generating a summary', async () => {
  jest
    .mocked(getWorkspaceContext)
    .mockReturnValue({ userWorkspaceRoleMap: {}, apiKeyRoleMap: {} } as never);
  const { service, orm } = setup();
  await expect(service.summarize('contract', auth)).rejects.toThrow();
  expect(orm.getRepository).not.toHaveBeenCalled();
  expect(generated).not.toHaveBeenCalled();
});

it('reuses persisted summaries after the cache is cleared', async () => {
  const { service, cache, storage } = setup();
  const first = await service.summarize('contract', auth);
  cache.clear();
  const second = await service.summarize('contract', auth);
  expect(second).toEqual(first);
  expect(generated).toHaveBeenCalledTimes(1);
  expect(storage.set).toHaveBeenCalledTimes(1);
});
it('promotes an existing cached summary to persistent storage', async () => {
  const { service, storage } = setup();
  const first = await service.summarize('contract', auth);
  storage.get.mockResolvedValueOnce([]);
  await expect(service.summarize('contract', auth)).resolves.toEqual(first);
  expect(generated).toHaveBeenCalledTimes(1);
  expect(storage.set).toHaveBeenCalledTimes(2);
});

it('does not persist a truncated model response', async () => {
  const { service, storage } = setup();
  generated.mockResolvedValueOnce({
    text: '## 진행 내용\n미완성',
    finishReason: 'length',
    usage: {},
  } as never);
  await expect(service.summarize('contract', auth)).rejects.toThrow(
    'Incomplete summary',
  );
  expect(storage.set).not.toHaveBeenCalled();
});
