import { AggregateOperations } from 'twenty-shared/types';

import { buildAggregationFieldForRelationRollup } from 'src/engine/core-modules/relation-rollup/utils/build-aggregation-field-for-relation-rollup.util';
import { getAvailableAggregationsFromObjectFields } from 'src/engine/api/graphql/workspace-schema-builder/utils/get-available-aggregations-from-object-fields.util';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { FieldMetadataType } from 'twenty-shared/types';

describe('buildAggregationFieldForRelationRollup', () => {
  const amountField = {
    name: 'amount',
    type: FieldMetadataType.CURRENCY,
  } as FlatFieldMetadata;

  const availableAggregations = getAvailableAggregationsFromObjectFields([
    amountField,
  ]);

  it('should return totalCount for COUNT operation', () => {
    const result = buildAggregationFieldForRelationRollup({
      aggregateOperation: AggregateOperations.COUNT,
      availableAggregations,
    });

    expect(result.aggregateFieldKey).toBe('totalCount');
  });

  it('should return sumAmountAmountMicros for SUM on currency field', () => {
    const result = buildAggregationFieldForRelationRollup({
      aggregateOperation: AggregateOperations.SUM,
      aggregateFieldMetadata: amountField,
      availableAggregations,
    });

    expect(result.aggregateFieldKey).toBe('sumAmountAmountMicros');
  });
});
