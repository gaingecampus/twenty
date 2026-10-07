import { KeyValuePairService } from 'src/engine/core-modules/key-value-pair/key-value-pair.service';
import { KeyValuePairType } from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { getWorkspaceContext } from 'src/engine/twenty-orm/storage/orm-workspace-context.storage';
import { resolveRolePermissionConfig } from 'src/engine/twenty-orm/utils/resolve-role-permission-config.util';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { generateText } from 'ai';
import { InjectCacheStorage } from 'src/engine/core-modules/cache-storage/decorators/cache-storage.decorator';
import { CacheStorageService } from 'src/engine/core-modules/cache-storage/services/cache-storage.service';
import { CacheStorageNamespace } from 'src/engine/core-modules/cache-storage/types/cache-storage-namespace.enum';
import { type UserWorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { AiModelRegistryService } from 'src/engine/metadata-modules/ai/ai-models/services/ai-model-registry.service';
import { BillingUsageService } from 'src/engine/core-modules/billing/services/billing-usage.service';
import { AiBillingService } from 'src/engine/metadata-modules/ai/ai-billing/services/ai-billing.service';
import { UsageOperationType } from 'src/engine/core-modules/usage/enums/usage-operation-type.enum';
import {
  FIELD_SUMMARY_PROMPT,
  splitSummarySource,
  summarySource,
  summarySourceHash,
  type SummaryContract,
  type SummaryVisit,
} from './field-summary-source';

type SummaryResult = {
  text: string;
  recordCount: number;
  generatedAt: string;
  sourceHash: string;
};

@Injectable()
export class FieldSummaryService {
  private readonly pending = new Map<string, Promise<SummaryResult>>();

  constructor(
    private readonly orm: GlobalWorkspaceOrmManager,
    private readonly models: AiModelRegistryService,
    private readonly billing: BillingUsageService,
    private readonly aiBilling: AiBillingService,
    @InjectCacheStorage(CacheStorageNamespace.EngineWorkspace)
    private readonly cache: CacheStorageService,
    private readonly storedSummaries: KeyValuePairService,
  ) {}

  async summarize(
    contractId: string,
    auth: UserWorkspaceAuthContext,
  ): Promise<SummaryResult> {
    // Re-read with the caller's row/field permissions before accessing any cache.
    const { contract, visits } = await this.orm.executeInWorkspaceContext(
      async () => {
        const { userWorkspaceRoleMap, apiKeyRoleMap } = getWorkspaceContext();
        const permissions = resolveRolePermissionConfig({
          authContext: auth,
          userWorkspaceRoleMap,
          apiKeyRoleMap,
        });
        if (!permissions) throw new ForbiddenException();
        const contracts = await this.orm.getRepository<SummaryContract>(
          auth.workspace.id,
          'onboarding',
          permissions,
        );
        const records = await this.orm.getRepository<SummaryVisit>(
          auth.workspace.id,
          'fieldVisit',
          permissions,
        );
        const contract = await contracts.findOne({
          where: { id: contractId },
          select: {
            id: true,
            name: true,
            consultingGoal: true,
            successCriteria: true,
            plannedSessionCount: true,
          },
        });
        if (!contract) throw new NotFoundException();
        const visits = await records.find({
          where: { contractId },
          select: {
            id: true,
            contractId: true,
            name: true,
            visitDate: true,
            sessionNumber: true,
            recordStatus: true,
            activities: true,
            decisions: true,
            nextActions: true,
            goalSnapshot: true,
            criteriaSnapshot: true,
          },
          order: { visitDate: 'ASC', id: 'ASC' },
        });
        return { contract, visits };
      },
      auth,
    );
    const source = summarySource(contract, visits);
    const sourceHash = summarySourceHash(source);
    const key = `field-summary:v2:${auth.workspace.id}:${contractId}:${sourceHash}`;
    // The source hash also isolates summaries made from different visible records.
    // Persist separately from user variables so their public API cannot expose summaries.
    const scope = {
      workspaceId: auth.workspace.id,
      userId: null,
      type: KeyValuePairType.FIELD_SUMMARY,
      key,
    };
    const [stored] = await this.storedSummaries.get(scope);
    if (stored?.value && !/^thought\b/i.test(stored.value.text ?? ''))
      return stored.value as SummaryResult;
    const cached = await this.cache.get<SummaryResult>(key);
    if (cached && !/^thought\b/i.test(cached.text)) {
      await this.storedSummaries.set({ ...scope, value: cached });
      return cached;
    }
    const pending = this.pending.get(key);
    if (pending) return pending;
    const generation = this.generate(source, auth)
      .then(async (text) => {
        const result = {
          text,
          recordCount: visits.length,
          generatedAt: new Date().toISOString(),
          sourceHash,
        };
        await this.storedSummaries.set({ ...scope, value: result });
        await this.cache.set(key, result, 30 * 24 * 60 * 60 * 1000);
        return result;
      })
      .finally(() => this.pending.delete(key));
    this.pending.set(key, generation);
    return generation;
  }

  private async generate(source: string, auth: UserWorkspaceAuthContext) {
    if (!this.models.getAvailableModels().length)
      throw new ServiceUnavailableException('AI model unavailable');
    await this.billing.hasAvailableCreditsOrThrow(auth.workspace.id);
    const modelId = auth.workspace.fastModel;
    this.models.validateModelAvailability(modelId, auth.workspace);
    const model = await this.models.resolveModelForAgent({ modelId });
    const call = async (prompt: string, system: string) => {
      const result = await generateText({
        model: model.model,
        system,
        prompt,
        maxOutputTokens: 4096,
        maxRetries: 1,
        abortSignal: AbortSignal.timeout(60000),
      });
      await this.aiBilling.calculateAndBillUsage(
        modelId,
        {
          usage: result.usage,
          cacheCreationTokens:
            result.usage.inputTokenDetails?.cacheWriteTokens ?? 0,
        },
        auth.workspace.id,
        UsageOperationType.AI_WORKFLOW_TOKEN,
        null,
        auth.userWorkspaceId,
      );
      if (result.finishReason !== 'stop' || /^thought\b/i.test(result.text))
        throw new ServiceUnavailableException('Incomplete summary');
      if (!result.text.trim())
        throw new ServiceUnavailableException('Empty summary');
      return result.text.trim();
    };
    let material = source;
    while (material.length > 18000) {
      const parts: string[] = [];
      for (const chunk of splitSummarySource(material)) {
        parts.push(
          await call(
            chunk,
            `${FIELD_SUMMARY_PROMPT} 지금은 전체 자료의 일부를 압축하는 단계입니다. 날짜, 초안 여부, 핵심 사실, 결정, 남은 과제를 보존해 최대 1000자로 압축하세요.`,
          ),
        );
      }
      const reduced = parts.join('\n');
      if (reduced.length >= material.length)
        throw new ServiceUnavailableException('Summary reduction failed');
      material = reduced;
    }
    let result = await call(material, FIELD_SUMMARY_PROMPT);
    // Ask for a shorter rewrite rather than cutting a sentence in the middle.
    if (result.length > 650)
      result = await call(
        result,
        `${FIELD_SUMMARY_PROMPT} 다음 요약을 사실을 바꾸지 않고 500자 이내로 압축하세요.`,
      );
    if (result.length > 650)
      throw new ServiceUnavailableException('Summary too long');
    return result;
  }
}
