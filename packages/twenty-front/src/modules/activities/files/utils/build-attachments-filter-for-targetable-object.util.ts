import { isNonEmptyArray } from '@sniptt/guards';

type BuildAttachmentsFilterForTargetableObjectParams = {
  targetableObjectFieldIdName: string;
  targetableObjectId: string;
  noteIds: string[];
  taskIds: string[];
  personIds: string[];
};

export const buildAttachmentsFilterForTargetableObject = ({
  targetableObjectFieldIdName,
  targetableObjectId,
  noteIds,
  taskIds,
  personIds,
}: BuildAttachmentsFilterForTargetableObjectParams) => {
  const orConditions: Record<string, unknown>[] = [
    {
      [targetableObjectFieldIdName]: {
        eq: targetableObjectId,
      },
    },
  ];

  if (isNonEmptyArray(noteIds)) {
    orConditions.push({
      targetNoteId: {
        in: noteIds,
      },
    });
  }

  if (isNonEmptyArray(taskIds)) {
    orConditions.push({
      targetTaskId: {
        in: taskIds,
      },
    });
  }

  if (isNonEmptyArray(personIds)) {
    orConditions.push({
      targetPersonId: {
        in: personIds,
      },
    });
  }

  if (orConditions.length === 1) {
    return orConditions[0];
  }

  return { or: orConditions };
};
