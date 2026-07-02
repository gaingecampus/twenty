import { useMemo } from 'react';

import { ATTACHMENT_GQL_FIELDS } from '@/activities/files/constants/attachment-gql-fields.constant';
import { useAttachmentEmailDirections } from '@/activities/files/hooks/useAttachmentEmailDirections';
import { useRelatedPersonIdsForAttachments } from '@/activities/files/hooks/useRelatedPersonIdsForAttachments';
import { type Attachment } from '@/activities/files/types/Attachment';
import { buildActivityTargetsFilterForTargetableObject } from '@/activities/files/utils/build-activity-targets-filter-for-targetable-object.util';
import { buildAttachmentsFilterForTargetableObject } from '@/activities/files/utils/build-attachments-filter-for-targetable-object.util';
import { enrichAttachmentWithEmailDirection } from '@/activities/files/utils/enrichAttachmentWithEmailDirection';
import { type ActivityTargetableObject } from '@/activities/types/ActivityTargetableEntity';
import { type NoteTarget } from '@/activities/types/NoteTarget';
import { type TaskTarget } from '@/activities/types/TaskTarget';
import { getActivityTargetObjectFieldIdName } from '@/activities/utils/getActivityTargetObjectFieldIdName';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

const ACTIVITY_TARGET_RECORD_GQL_FIELDS = {
  id: true,
  note: {
    id: true,
  },
  task: {
    id: true,
  },
} as const;

const ACTIVITY_TARGETS_LIMIT = 200;

const shouldFetchActivityTargetsForAttachments = (
  targetObjectNameSingular: string,
) => {
  return (
    targetObjectNameSingular !== CoreObjectNameSingular.Note &&
    targetObjectNameSingular !== CoreObjectNameSingular.Task
  );
};

export const useAttachments = (targetableObject: ActivityTargetableObject) => {
  const targetableObjectFieldIdName = getActivityTargetObjectFieldIdName({
    nameSingular: targetableObject.targetObjectNameSingular,
  });

  const shouldFetchActivityTargets = shouldFetchActivityTargetsForAttachments(
    targetableObject.targetObjectNameSingular,
  );

  const { relatedPersonIds, loading: relatedPersonIdsLoading } =
    useRelatedPersonIdsForAttachments(targetableObject);

  const activityTargetsFilter = useMemo(
    () =>
      buildActivityTargetsFilterForTargetableObject({
        targetObjectNameSingular: targetableObject.targetObjectNameSingular,
        targetableObjectId: targetableObject.id,
        relatedPersonIds,
      }),
    [
      targetableObject.targetObjectNameSingular,
      targetableObject.id,
      relatedPersonIds,
    ],
  );

  const { records: noteTargets, loading: noteTargetsLoading } =
    useFindManyRecords<NoteTarget>({
      skip: !shouldFetchActivityTargets,
      objectNameSingular: CoreObjectNameSingular.NoteTarget,
      filter: activityTargetsFilter,
      recordGqlFields: ACTIVITY_TARGET_RECORD_GQL_FIELDS,
      limit: ACTIVITY_TARGETS_LIMIT,
    });

  const { records: taskTargets, loading: taskTargetsLoading } =
    useFindManyRecords<TaskTarget>({
      skip: !shouldFetchActivityTargets,
      objectNameSingular: CoreObjectNameSingular.TaskTarget,
      filter: activityTargetsFilter,
      recordGqlFields: ACTIVITY_TARGET_RECORD_GQL_FIELDS,
      limit: ACTIVITY_TARGETS_LIMIT,
    });

  const noteIds = useMemo(() => {
    if (
      targetableObject.targetObjectNameSingular === CoreObjectNameSingular.Note
    ) {
      return [];
    }

    return [
      ...new Set(
        noteTargets.map((noteTarget) => noteTarget.note?.id).filter(isDefined),
      ),
    ];
  }, [noteTargets, targetableObject.targetObjectNameSingular]);

  const taskIds = useMemo(() => {
    if (
      targetableObject.targetObjectNameSingular === CoreObjectNameSingular.Task
    ) {
      return [];
    }

    return [
      ...new Set(
        taskTargets.map((taskTarget) => taskTarget.task?.id).filter(isDefined),
      ),
    ];
  }, [taskTargets, targetableObject.targetObjectNameSingular]);

  const attachmentsFilter = useMemo(
    () =>
      buildAttachmentsFilterForTargetableObject({
        targetableObjectFieldIdName,
        targetableObjectId: targetableObject.id,
        noteIds,
        taskIds,
        personIds: relatedPersonIds,
      }),
    [
      targetableObjectFieldIdName,
      targetableObject.id,
      noteIds,
      taskIds,
      relatedPersonIds,
    ],
  );

  const { records: attachments, loading: attachmentsLoading } =
    useFindManyRecords<Attachment>({
      objectNameSingular: CoreObjectNameSingular.Attachment,
      filter: attachmentsFilter,
      orderBy: [
        {
          createdAt: 'DescNullsFirst',
        },
      ],
      recordGqlFields: ATTACHMENT_GQL_FIELDS,
    });

  const messageIds = useMemo(
    () =>
      attachments
        .map((attachment) => attachment.targetMessageId)
        .filter(isDefined),
    [attachments],
  );

  const { emailDirectionByMessageId, loading: emailDirectionsLoading } =
    useAttachmentEmailDirections(messageIds);

  const attachmentsWithEmailDirection = useMemo(
    () =>
      attachments.map((attachment) =>
        enrichAttachmentWithEmailDirection(
          attachment,
          emailDirectionByMessageId,
        ),
      ),
    [attachments, emailDirectionByMessageId],
  );

  return {
    attachments: attachmentsWithEmailDirection,
    loading:
      relatedPersonIdsLoading ||
      (shouldFetchActivityTargets &&
        (noteTargetsLoading || taskTargetsLoading)) ||
      attachmentsLoading ||
      emailDirectionsLoading,
  };
};
