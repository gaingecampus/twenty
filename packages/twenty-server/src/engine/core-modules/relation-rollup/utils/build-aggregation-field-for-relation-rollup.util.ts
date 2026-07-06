import { AggregateOperations, FieldMetadataType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { type AggregationField } from 'src/engine/api/graphql/workspace-schema-builder/utils/get-available-aggregations-from-object-fields.util';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { buildAggregateFieldKey } from 'src/modules/dashboard/chart-data/utils/build-aggregate-field-key.util';

export const buildAggregationFieldForRelationRollup = ({
  aggregateOperation,
  aggregateFieldMetadata,
  availableAggregations,
}: {
  aggregateOperation: AggregateOperations;
  aggregateFieldMetadata?: FlatFieldMetadata;
  availableAggregations: Record<string, AggregationField>;
}): { aggregateFieldKey: string; aggregationField: AggregationField } => {
  if (aggregateOperation === AggregateOperations.COUNT) {
    const aggregationField = availableAggregations.totalCount;

    if (!isDefined(aggregationField)) {
      throw new Error('totalCount aggregation is not available');
    }

    return {
      aggregateFieldKey: 'totalCount',
      aggregationField,
    };
  }

  if (!isDefined(aggregateFieldMetadata)) {
    throw new Error(
      'aggregateFieldMetadataUniversalIdentifier is required for non-COUNT operations',
    );
  }

  if (
    aggregateFieldMetadata.type !== FieldMetadataType.NUMBER &&
    aggregateFieldMetadata.type !== FieldMetadataType.CURRENCY
  ) {
    throw new Error(
      `Unsupported aggregate field type: ${aggregateFieldMetadata.type}`,
    );
  }

  const aggregateFieldKey = buildAggregateFieldKey({
    aggregateOperation,
    aggregateFieldMetadata,
  });

  const aggregationField = availableAggregations[aggregateFieldKey];

  if (!isDefined(aggregationField)) {
    throw new Error(
      `Aggregation field ${aggregateFieldKey} is not available on target object`,
    );
  }

  return {
    aggregateFieldKey,
    aggregationField,
  };
};
