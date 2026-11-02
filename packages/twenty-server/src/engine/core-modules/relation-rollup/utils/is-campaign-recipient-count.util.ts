import { AggregateOperations } from 'twenty-shared/types';

import { type RelationRollupAggregateInput } from 'src/engine/core-modules/relation-rollup/dtos/relation-rollup-aggregates.dto';

export const isCampaignRecipientCount = ({
  parentObjectName,
  relationFieldName,
  rollup,
}: {
  parentObjectName: string;
  relationFieldName: string;
  rollup: RelationRollupAggregateInput;
}) =>
  parentObjectName === 'messageCampaign' &&
  relationFieldName === 'recipients' &&
  rollup.aggregateOperation === AggregateOperations.COUNT &&
  // Filters on email-participant fields must retain their original meaning.
  Object.keys(rollup.filter ?? {}).length === 0;
