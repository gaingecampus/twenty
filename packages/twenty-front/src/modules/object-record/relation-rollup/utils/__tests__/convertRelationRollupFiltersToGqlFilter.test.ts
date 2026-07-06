import { AggregateOperations, ViewFilterOperand } from 'twenty-shared/types';
import { FieldMetadataType } from '~/generated-metadata/graphql';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';

import { convertRelationRollupFiltersToGqlFilter } from '@/object-record/relation-rollup/utils/convertRelationRollupFiltersToGqlFilter';

const targetFieldMetadataItem: FieldMetadataItem = {
  id: 'target-field-id',
  universalIdentifier: '00000000-0000-0000-0000-000000000010',
  name: 'amount',
  label: 'Amount',
  type: FieldMetadataType.NUMBER,
  isActive: true,
  isCustom: false,
  isSystem: false,
  isNullable: true,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
} as FieldMetadataItem;

describe('convertRelationRollupFiltersToGqlFilter', () => {
  it('should return undefined when no filters are configured', () => {
    const result = convertRelationRollupFiltersToGqlFilter({
      relationRollup: {
        relationFieldMetadataUniversalIdentifier:
          '00000000-0000-0000-0000-000000000001',
        aggregateOperation: AggregateOperations.COUNT,
      },
      fieldMetadataItems: [],
    });

    expect(result).toBeUndefined();
  });

  it('should build gql filter when one filter is configured', () => {
    const result = convertRelationRollupFiltersToGqlFilter({
      relationRollup: {
        relationFieldMetadataUniversalIdentifier:
          '00000000-0000-0000-0000-000000000001',
        aggregateOperation: AggregateOperations.SUM,
        aggregateFieldMetadataUniversalIdentifier:
          '00000000-0000-0000-0000-000000000011',
        recordFilters: [
          {
            fieldMetadataUniversalIdentifier:
              '00000000-0000-0000-0000-000000000010',
          operand: ViewFilterOperand.GREATER_THAN_OR_EQUAL,
          value: '100',
          },
        ],
      },
      fieldMetadataItems: [targetFieldMetadataItem],
    });

    expect(result).toBeDefined();
    expect(result).not.toBeUndefined();
  });
});
