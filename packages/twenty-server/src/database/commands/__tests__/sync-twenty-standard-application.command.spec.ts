import { SyncTwentyStandardApplicationCommand } from 'src/database/commands/sync-twenty-standard-application.command';
import { type WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { ADDITIVE_INFER_DELETION_FROM_MISSING_ENTITIES } from 'src/engine/workspace-manager/twenty-standard-application/constants/additive-infer-deletion-from-missing-entities.constant';
import { type TwentyStandardApplicationService } from 'src/engine/workspace-manager/twenty-standard-application/services/twenty-standard-application.service';

const WORKSPACE_ID = '20202020-0000-0000-0000-000000000001';

describe('SyncTwentyStandardApplicationCommand', () => {
  const synchronizeTwentyStandardApplicationOrThrowMock = jest.fn();
  const workspaceIteratorServiceMock = {} as WorkspaceIteratorService;

  const twentyStandardApplicationServiceMock = {
    synchronizeTwentyStandardApplicationOrThrow:
      synchronizeTwentyStandardApplicationOrThrowMock,
  } as unknown as TwentyStandardApplicationService;

  const command = new SyncTwentyStandardApplicationCommand(
    workspaceIteratorServiceMock,
    twentyStandardApplicationServiceMock,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    synchronizeTwentyStandardApplicationOrThrowMock.mockResolvedValue({
      totalActions: 0,
      actionCountsByTypeAndMetadataName: {},
    });
  });

  it('should pass additive inferDeletionFromMissingEntities when syncing', async () => {
    await command.runOnWorkspace({
      workspaceId: WORKSPACE_ID,
      options: {},
      index: 0,
      total: 1,
    });

    expect(
      synchronizeTwentyStandardApplicationOrThrowMock,
    ).toHaveBeenCalledWith({
      workspaceId: WORKSPACE_ID,
      inferDeletionFromMissingEntities:
        ADDITIVE_INFER_DELETION_FROM_MISSING_ENTITIES,
      dryRun: false,
    });
  });

  it('should preview migration actions on dry run without applying changes', async () => {
    synchronizeTwentyStandardApplicationOrThrowMock.mockResolvedValue({
      totalActions: 2,
      actionCountsByTypeAndMetadataName: {
        'create:fieldMetadata': 2,
      },
    });

    await command.runOnWorkspace({
      workspaceId: WORKSPACE_ID,
      options: { dryRun: true },
      index: 0,
      total: 1,
    });

    expect(
      synchronizeTwentyStandardApplicationOrThrowMock,
    ).toHaveBeenCalledWith({
      workspaceId: WORKSPACE_ID,
      inferDeletionFromMissingEntities:
        ADDITIVE_INFER_DELETION_FROM_MISSING_ENTITIES,
      dryRun: true,
    });
  });
});
