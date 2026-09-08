import { TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER } from 'twenty-shared/application';
import { Injectable } from '@nestjs/common';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { computeTableName } from 'src/engine/utils/compute-table-name.util';
import { quoteAutomationSchema } from './automation-schema';

@Injectable()
export class GaingeAutomationTableService {
  constructor(private readonly cache: WorkspaceCacheService) {}

  async name(workspaceId: string, objectName: string): Promise<string> {
    const { flatObjectMetadataMaps, flatApplicationMaps } =
      await this.cache.getOrRecompute(workspaceId, [
        'flatObjectMetadataMaps',
        'flatApplicationMaps',
      ]);
    const object = Object.values(
      flatObjectMetadataMaps.byUniversalIdentifier,
    ).find((o) => o?.nameSingular === objectName);
    if (!object) throw new Error(`Missing CRM object: ${objectName}`);
    const standard =
      flatApplicationMaps.idByUniversalIdentifier[
        TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER
      ];
    if (!standard) throw new Error('Missing Twenty standard application');
    return computeTableName(
      object.nameSingular,
      object.applicationId !== standard,
    );
  }

  async quoted(workspaceId: string, objectName: string): Promise<string> {
    return quoteAutomationSchema(await this.name(workspaceId, objectName));
  }
}
