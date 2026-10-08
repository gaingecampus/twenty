import { isDefined } from 'twenty-shared/utils';

import { EngineComponentKey } from 'src/engine/metadata-modules/command-menu-item/enums/engine-component-key.enum';
import { isObjectMetadataCommandMenuItemPayload } from 'src/engine/metadata-modules/command-menu-item/utils/is-object-metadata-command-menu-item-payload.util';
import { type FlatCommandMenuItemMaps } from 'src/engine/metadata-modules/flat-command-menu-item/types/flat-command-menu-item-maps.type';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';

export const resolveStandardNavigationCommandMenuItemTargets = ({
  commandMenuItemMaps,
  generatedObjectMetadataMaps,
  workspaceObjectMetadataMaps,
}: {
  commandMenuItemMaps: FlatCommandMenuItemMaps;
  generatedObjectMetadataMaps: FlatEntityMaps<FlatObjectMetadata>;
  workspaceObjectMetadataMaps: FlatEntityMaps<FlatObjectMetadata>;
}): FlatCommandMenuItemMaps => {
  const byUniversalIdentifier = {
    ...commandMenuItemMaps.byUniversalIdentifier,
  };

  for (const [universalIdentifier, commandMenuItem] of Object.entries(
    byUniversalIdentifier,
  )) {
    if (
      !isDefined(commandMenuItem) ||
      commandMenuItem.engineComponentKey !== EngineComponentKey.NAVIGATION ||
      !isObjectMetadataCommandMenuItemPayload(commandMenuItem.payload)
    ) {
      continue;
    }

    const objectUniversalIdentifier =
      generatedObjectMetadataMaps.universalIdentifierById[
        commandMenuItem.payload.objectMetadataItemId
      ];
    const workspaceObject = isDefined(objectUniversalIdentifier)
      ? workspaceObjectMetadataMaps.byUniversalIdentifier[
          objectUniversalIdentifier
        ]
      : undefined;

    // Payload IDs are embedded JSON, so the relation resolver cannot remap them.
    // New objects keep the generated ID used by this same migration's create action.
    if (isDefined(workspaceObject)) {
      byUniversalIdentifier[universalIdentifier] = {
        ...commandMenuItem,
        payload: {
          ...commandMenuItem.payload,
          objectMetadataItemId: workspaceObject.id,
        },
      };
    }
  }

  return { ...commandMenuItemMaps, byUniversalIdentifier };
};
