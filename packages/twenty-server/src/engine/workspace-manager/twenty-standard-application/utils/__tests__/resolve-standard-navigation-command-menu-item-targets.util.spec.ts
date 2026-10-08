import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { isDefined } from 'twenty-shared/utils';

import { isObjectMetadataCommandMenuItemPayload } from 'src/engine/metadata-modules/command-menu-item/utils/is-object-metadata-command-menu-item-payload.util';
import { resolveStandardNavigationCommandMenuItemTargets } from 'src/engine/workspace-manager/twenty-standard-application/utils/command-menu-item/resolve-standard-navigation-command-menu-item-targets.util';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';

const buildMaps = () =>
  computeTwentyStandardApplicationAllFlatEntityMaps({
    now: '2026-10-08T00:00:00.000Z',
    workspaceId: '20202020-1111-4111-8111-111111111111',
    twentyStandardApplicationId: '20202020-2222-4222-8222-222222222222',
  }).allFlatEntityMaps;

const campaignUniversalIdentifier =
  STANDARD_OBJECTS.messageCampaign.universalIdentifier;

describe('resolveStandardNavigationCommandMenuItemTargets', () => {
  it('uses the existing workspace object IDs after each sync, preserving labels and access gates', () => {
    const workspace = buildMaps();
    const generated = buildMaps();
    const generatedCampaign =
      generated.flatObjectMetadataMaps.byUniversalIdentifier[
        campaignUniversalIdentifier
      ]!;
    const workspaceCampaign =
      workspace.flatObjectMetadataMaps.byUniversalIdentifier[
        campaignUniversalIdentifier
      ]!;
    expect(generatedCampaign.id).not.toBe(workspaceCampaign.id);

    const resolve = () =>
      resolveStandardNavigationCommandMenuItemTargets({
        commandMenuItemMaps: generated.flatCommandMenuItemMaps,
        generatedObjectMetadataMaps: generated.flatObjectMetadataMaps,
        workspaceObjectMetadataMaps: workspace.flatObjectMetadataMaps,
      });
    const resolved = resolve();
    const campaignCommand = Object.values(
      generated.flatCommandMenuItemMaps.byUniversalIdentifier,
    )
      .filter(isDefined)
      .find(
        (command) =>
          isObjectMetadataCommandMenuItemPayload(command.payload) &&
          command.payload.objectMetadataItemId === generatedCampaign.id,
      )!;
    expect(
      resolved.byUniversalIdentifier[campaignCommand.universalIdentifier],
    ).toEqual({
      ...campaignCommand,
      payload: { objectMetadataItemId: workspaceCampaign.id },
    });
    expect(resolve()).toEqual(resolved);
    expect(campaignCommand.payload).toEqual({
      objectMetadataItemId: generatedCampaign.id,
    });
  });

  it('keeps the generated target ID for an object created in the same migration', () => {
    const workspace = buildMaps();
    delete workspace.flatObjectMetadataMaps.byUniversalIdentifier[
      campaignUniversalIdentifier
    ];
    const generated = buildMaps();
    const resolved = resolveStandardNavigationCommandMenuItemTargets({
      commandMenuItemMaps: generated.flatCommandMenuItemMaps,
      generatedObjectMetadataMaps: generated.flatObjectMetadataMaps,
      workspaceObjectMetadataMaps: workspace.flatObjectMetadataMaps,
    });
    const campaignId =
      generated.flatObjectMetadataMaps.byUniversalIdentifier[
        campaignUniversalIdentifier
      ]!.id;
    expect(
      Object.values(resolved.byUniversalIdentifier)
        .filter(isDefined)
        .some(
          (command) =>
            isObjectMetadataCommandMenuItemPayload(command.payload) &&
            command.payload.objectMetadataItemId === campaignId,
        ),
    ).toBe(true);
  });

  it('leaves path navigation and other commands unchanged', () => {
    const generated = buildMaps();
    const resolved = resolveStandardNavigationCommandMenuItemTargets({
      commandMenuItemMaps: generated.flatCommandMenuItemMaps,
      generatedObjectMetadataMaps: generated.flatObjectMetadataMaps,
      workspaceObjectMetadataMaps: generated.flatObjectMetadataMaps,
    });
    expect(resolved).toEqual(generated.flatCommandMenuItemMaps);
  });
});
