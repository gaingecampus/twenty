import { Injectable } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';
import { In, type FindOptionsSelect, type FindOptionsWhere } from 'typeorm';

import { RelationType } from 'src/engine/metadata-modules/field-metadata/interfaces/relation-type.interface';
import {
  findRelationPathsToPerson,
  type RelationPathToPerson,
} from 'src/engine/core-modules/related-person-ids/utils/find-relation-paths-to-person.util';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';

const PERSON_OBJECT_NAME_SINGULAR = 'person';
const COMPANY_OBJECT_NAME_SINGULAR = 'company';

type RelationWalkRecord = { id: string } & Record<string, unknown>;

type PersonLinkedToCompanyRecord = {
  id: string;
  companyId: string | null;
};

@Injectable()
export class RelatedPersonIdsService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly workspaceCacheService: WorkspaceCacheService,
  ) {}

  async getRelatedPersonIds({
    workspaceId,
    objectNameSingular,
    recordId,
  }: {
    workspaceId: string;
    objectNameSingular: string;
    recordId: string;
  }): Promise<string[]> {
    if (objectNameSingular === PERSON_OBJECT_NAME_SINGULAR) {
      return [recordId];
    }

    // Company inbox/calendar should only include people linked via
    // company.people — not DRI, opportunity POC, or other Person relations
    if (objectNameSingular === COMPANY_OBJECT_NAME_SINGULAR) {
      return this.getPersonIdsLinkedToCompany({
        workspaceId,
        companyId: recordId,
      });
    }

    const { flatObjectMetadataMaps, flatFieldMetadataMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatObjectMetadataMaps',
        'flatFieldMetadataMaps',
      ]);

    const relationPaths = findRelationPathsToPerson({
      rootObjectNameSingular: objectNameSingular,
      flatObjectMetadataMaps,
      flatFieldMetadataMaps,
    });

    if (relationPaths.length === 0) {
      return [];
    }

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const personIds = new Set<string>();

        for (const relationPath of relationPaths) {
          const personIdsForPath = await this.walkRelationPath({
            workspaceId,
            recordId,
            relationPath,
          });

          personIdsForPath.forEach((personId) => personIds.add(personId));
        }

        return [...personIds];
      },
      buildSystemAuthContext(workspaceId),
    );
  }

  private async getPersonIdsLinkedToCompany({
    workspaceId,
    companyId,
  }: {
    workspaceId: string;
    companyId: string;
  }): Promise<string[]> {
    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const personRepository =
          await this.globalWorkspaceOrmManager.getRepository<PersonLinkedToCompanyRecord>(
            workspaceId,
            PERSON_OBJECT_NAME_SINGULAR,
            { shouldBypassPermissionChecks: true },
          );

        const people = await personRepository.find({
          where: {
            companyId,
          } as FindOptionsWhere<PersonLinkedToCompanyRecord>,
          select: { id: true },
        });

        return people.map((person) => person.id);
      },
      buildSystemAuthContext(workspaceId),
    );
  }

  private async walkRelationPath({
    workspaceId,
    recordId,
    relationPath,
  }: {
    workspaceId: string;
    recordId: string;
    relationPath: RelationPathToPerson;
  }): Promise<string[]> {
    let currentIds = [recordId];

    for (const hop of relationPath) {
      if (currentIds.length === 0) {
        return [];
      }

      const repository =
        await this.globalWorkspaceOrmManager.getRepository<RelationWalkRecord>(
          workspaceId,
          hop.queryObjectNameSingular,
          { shouldBypassPermissionChecks: true },
        );

      if (hop.direction === RelationType.MANY_TO_ONE) {
        const records = await repository.find({
          where: { id: In(currentIds) } as FindOptionsWhere<RelationWalkRecord>,
          select: {
            [hop.joinColumnName]: true,
          } as FindOptionsSelect<RelationWalkRecord>,
        });

        currentIds = [
          ...new Set(
            records
              .map((record) => record[hop.joinColumnName])
              .filter(
                (value): value is string =>
                  typeof value === 'string' && isDefined(value),
              ),
          ),
        ];
      } else {
        const records = await repository.find({
          where: {
            [hop.joinColumnName]: In(currentIds),
          } as FindOptionsWhere<RelationWalkRecord>,
          select: { id: true },
        });

        currentIds = [...new Set(records.map((record) => record.id))];
      }
    }

    return currentIds;
  }
}
