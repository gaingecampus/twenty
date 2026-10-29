import { type AllMetadataName } from 'twenty-shared/metadata';
import { isDefined } from 'twenty-shared/utils';

import {
  getWorkspaceOwnedFlatEntityPropertyNames,
  type WorkspaceOwnedFlatEntityPropertyName,
} from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/constants/workspace-owned-flat-entity-property-names.constant';

export const preserveWorkspaceOwnedPropertiesOnToFlatEntityMaps = <
  TMaps extends {
    byUniversalIdentifier: Partial<
      Record<string, { universalIdentifier: string }>
    >;
  },
>({
  fromFlatEntityMaps,
  toFlatEntityMaps,
  metadataName,
  propertyNames = getWorkspaceOwnedFlatEntityPropertyNames(metadataName),
}: {
  fromFlatEntityMaps: TMaps;
  toFlatEntityMaps: TMaps;
  metadataName?: AllMetadataName;
  propertyNames?: readonly WorkspaceOwnedFlatEntityPropertyName[];
}): TMaps => {
  type TEntity = NonNullable<TMaps['byUniversalIdentifier'][string]>;
  const preservedByUniversalIdentifier = {
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

    for (const propertyName of propertyNames) {
      if (!(propertyName in fromFlatEntity)) {
        continue;
      }

      const fromPropertyValue = (fromFlatEntity as TEntity)[
        propertyName as keyof TEntity
      ] as TEntity[keyof TEntity];
      const toPropertyValue = (toFlatEntity as TEntity)[
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
