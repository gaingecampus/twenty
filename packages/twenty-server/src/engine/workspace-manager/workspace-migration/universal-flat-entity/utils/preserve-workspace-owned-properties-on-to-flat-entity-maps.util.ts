import { isDefined } from 'twenty-shared/utils';

import { type SyncableFlatEntity } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-from.type';
import { WORKSPACE_OWNED_FLAT_ENTITY_PROPERTY_NAMES } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/constants/workspace-owned-flat-entity-property-names.constant';
import { type UniversalFlatEntityMaps } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/types/universal-flat-entity-maps.type';
import { type UniversalSyncableFlatEntity } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/types/universal-flat-entity-from.type';

export const preserveWorkspaceOwnedPropertiesOnToFlatEntityMaps = <
  TEntity extends SyncableFlatEntity | UniversalSyncableFlatEntity,
  TMaps extends UniversalFlatEntityMaps<TEntity>,
>({
  fromFlatEntityMaps,
  toFlatEntityMaps,
}: {
  fromFlatEntityMaps: UniversalFlatEntityMaps<TEntity>;
  toFlatEntityMaps: TMaps;
}): TMaps => {
  const preservedByUniversalIdentifier: Partial<Record<string, TEntity>> = {
    ...toFlatEntityMaps.byUniversalIdentifier,
  };

  for (const [universalIdentifier, toFlatEntity] of Object.entries(
    toFlatEntityMaps.byUniversalIdentifier,
  )) {
    if (!isDefined(toFlatEntity)) {
      continue;
    }

    const fromFlatEntity =
      fromFlatEntityMaps.byUniversalIdentifier[universalIdentifier];

    if (!isDefined(fromFlatEntity)) {
      continue;
    }

    let preservedFlatEntity = toFlatEntity;

    for (const propertyName of WORKSPACE_OWNED_FLAT_ENTITY_PROPERTY_NAMES) {
      if (!(propertyName in fromFlatEntity)) {
        continue;
      }

      const fromPropertyValue = fromFlatEntity[
        propertyName as keyof TEntity
      ] as TEntity[keyof TEntity];
      const toPropertyValue = toFlatEntity[
        propertyName as keyof TEntity
      ] as TEntity[keyof TEntity];

      if (fromPropertyValue === toPropertyValue) {
        continue;
      }

      preservedFlatEntity = {
        ...preservedFlatEntity,
        [propertyName]: fromPropertyValue,
      };
    }

    if (preservedFlatEntity !== toFlatEntity) {
      preservedByUniversalIdentifier[universalIdentifier] = preservedFlatEntity;
    }
  }

  return {
    ...toFlatEntityMaps,
    byUniversalIdentifier: preservedByUniversalIdentifier,
  };
};
