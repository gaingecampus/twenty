import { isNonEmptyArray } from '@sniptt/guards';
import { CoreObjectNameSingular } from 'twenty-shared/types';

import { getActivityTargetObjectFieldIdName } from '@/activities/utils/getActivityTargetObjectFieldIdName';

type BuildActivityTargetsFilterForTargetableObjectParams = {
  targetObjectNameSingular: string;
  targetableObjectId: string;
  relatedPersonIds: string[];
};

export const buildActivityTargetsFilterForTargetableObject = ({
  targetObjectNameSingular,
  targetableObjectId,
  relatedPersonIds,
}: BuildActivityTargetsFilterForTargetableObjectParams) => {
  const targetableObjectFieldIdName = getActivityTargetObjectFieldIdName({
    nameSingular: targetObjectNameSingular,
  });

  const directCondition = {
    [targetableObjectFieldIdName]: {
      eq: targetableObjectId,
    },
  };

  const shouldIncludeRelatedPersonIds =
    (targetObjectNameSingular === CoreObjectNameSingular.Company ||
      targetObjectNameSingular === CoreObjectNameSingular.Opportunity) &&
    isNonEmptyArray(relatedPersonIds);

  if (!shouldIncludeRelatedPersonIds) {
    return directCondition;
  }

  return {
    or: [
      directCondition,
      {
        targetPersonId: {
          in: relatedPersonIds,
        },
      },
    ],
  };
};
