import { type ObjectRecordNonDestructiveEvent } from 'twenty-shared/database-events';
import { type GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { type WorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/workspace-event-batch.type';
import { type TimelineActivityService } from 'src/modules/timeline/services/timeline-activity.service';
import { UpsertTimelineActivityFromInternalEvent } from '../upsert-timeline-activity-from-internal-event.job';

describe('messaging system object timeline events', () => {
  const upsertEvents = jest.fn().mockResolvedValue(undefined);
  const executeInWorkspaceContext = jest.fn(
    async (callback: () => Promise<void>) => callback(),
  );
  const findBy = jest
    .fn()
    .mockResolvedValue([{ id: 'member', userId: 'user' }]);
  const job = new UpsertTimelineActivityFromInternalEvent(
    { upsertEvents } as unknown as TimelineActivityService,
    {
      executeInWorkspaceContext,
      getRepository: jest.fn().mockResolvedValue({ findBy }),
    } as unknown as GlobalWorkspaceOrmManager,
  );
  const batch = (nameSingular: string) =>
    ({
      workspaceId: 'workspace',
      name: `${nameSingular}.created`,
      objectMetadata: { isSystem: true, nameSingular },
      events: [
        {
          recordId: 'record',
          userId: 'user',
          properties: { after: { id: 'record' } },
        },
      ],
    }) as WorkspaceEventBatch<ObjectRecordNonDestructiveEvent>;

  it.each(['messageList', 'messageCampaign'])(
    'records %s events with the actual actor',
    async (name) => {
      const event = batch(name);
      await job.handle(event);
      expect(event.events[0].workspaceMemberId).toBe('member');
      expect(upsertEvents).toHaveBeenCalledWith(event);
    },
  );

  it('continues to exclude unrelated system objects', async () => {
    await job.handle(batch('messageChannel'));
    expect(upsertEvents).not.toHaveBeenCalled();
    expect(executeInWorkspaceContext).not.toHaveBeenCalled();
  });
});
