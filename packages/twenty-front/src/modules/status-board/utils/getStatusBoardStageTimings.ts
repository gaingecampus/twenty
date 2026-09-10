import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { OPPORTUNITY_STAGE_TIMINGS } from 'twenty-shared/constants';

export const getStatusBoardStageTimings = (
  objectMetadataItem: EnrichedObjectMetadataItem | undefined,
) => {
  const options = objectMetadataItem?.fields.find(
    (field) => field.name === 'customStage',
  )?.options;

  return [...(options ?? [])]
    .sort((left, right) => left.position - right.position)
    .flatMap((option) => {
      // Retired in gainge-crm; legacy local records may still use this value.
      if (option.value === 'FOLLOW_UP') return [];
      const stage = OPPORTUNITY_STAGE_TIMINGS.find(
        (item) => item.value === option.value,
      );
      return stage ? [{ ...stage, label: option.label }] : [];
    });
};
