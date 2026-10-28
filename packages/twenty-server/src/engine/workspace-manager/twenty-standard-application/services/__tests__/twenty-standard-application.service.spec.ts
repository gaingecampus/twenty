import { addFlatEntityToFlatEntityMapsOrThrow } from 'src/engine/metadata-modules/flat-entity/utils/add-flat-entity-to-flat-entity-maps-or-throw.util';
import { TwentyStandardApplicationService } from 'src/engine/workspace-manager/twenty-standard-application/services/twenty-standard-application.service';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';

describe('standard application synchronization', () => {
  it('validates workspace-owned tabs without treating them as standard migration targets', async () => {
    const workspaceId = '11111111-1111-4111-8111-111111111111';
    const applicationId = '22222222-2222-4222-8222-222222222222';
    const { allFlatEntityMaps } =
      computeTwentyStandardApplicationAllFlatEntityMaps({
        workspaceId,
        twentyStandardApplicationId: applicationId,
        now: '2026-10-28T00:00:00.000Z',
      });
    const template = Object.values(
      allFlatEntityMaps.flatPageLayoutTabMaps.byUniversalIdentifier,
    ).find((tab) => tab !== undefined)!;
    const customTab = {
      ...template,
      id: '33333333-3333-4333-8333-333333333333',
      universalIdentifier: '44444444-4444-4444-8444-444444444444',
      applicationId: '55555555-5555-4555-8555-555555555555',
      title: '사용자 수신자 탭',
    };
    allFlatEntityMaps.flatPageLayoutTabMaps =
      addFlatEntityToFlatEntityMapsOrThrow({
        flatEntity: customTab,
        flatEntityMaps: allFlatEntityMaps.flatPageLayoutTabMaps,
      });
    const validate = jest
      .fn()
      .mockResolvedValue({
        status: 'success',
        workspaceMigration: { actions: [] },
      });
    type Dependencies = ConstructorParameters<
      typeof TwentyStandardApplicationService
    >;
    const service = new TwentyStandardApplicationService(
      {
        findWorkspaceTwentyStandardAndCustomApplicationOrThrow: jest
          .fn()
          .mockResolvedValue({
            twentyStandardFlatApplication: { id: applicationId },
          }),
      } as unknown as Dependencies[0],
      {
        validateBuildAndRunWorkspaceMigrationFromTo: validate,
      } as unknown as Dependencies[1],
      {
        getOrRecompute: jest
          .fn()
          .mockResolvedValue({ ...allFlatEntityMaps, featureFlagsMap: {} }),
      } as unknown as Dependencies[2],
      {} as Dependencies[3],
    );
    await service.synchronizeTwentyStandardApplicationOrThrow({
      workspaceId,
      dryRun: true,
    });
    const args = validate.mock.calls[0][0];
    expect(
      args.dependencyAllFlatEntityMaps.flatPageLayoutTabMaps
        .byUniversalIdentifier[customTab.universalIdentifier],
    ).toEqual(customTab);
    expect(
      args.fromToAllFlatEntityMaps.flatPageLayoutTabMaps.from
        .byUniversalIdentifier[customTab.universalIdentifier],
    ).toBeUndefined();
    expect(
      args.fromToAllFlatEntityMaps.flatPageLayoutTabMaps.to
        .byUniversalIdentifier[customTab.universalIdentifier],
    ).toBeUndefined();
    expect(args.dryRun).toBe(true);
    delete args.dependencyAllFlatEntityMaps.flatPageLayoutTabMaps
      .byUniversalIdentifier[customTab.universalIdentifier];
    expect(
      allFlatEntityMaps.flatPageLayoutTabMaps.byUniversalIdentifier[
        customTab.universalIdentifier
      ],
    ).toEqual(customTab);
  });
});
