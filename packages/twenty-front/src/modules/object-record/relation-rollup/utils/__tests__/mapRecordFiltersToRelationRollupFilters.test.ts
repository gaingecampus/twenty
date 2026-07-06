import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { mapRecordFiltersToRelationRollupFilters } from '@/object-record/relation-rollup/utils/mapRecordFiltersToRelationRollupFilters';
import { mapRelationRollupFiltersToRecordFilters } from '@/object-record/relation-rollup/utils/mapRelationRollupFiltersToRecordFilters';
import {
  AggregateOperations,
  ViewFilterOperand,
} from 'twenty-shared/types';
import { FieldMetadataType } from '~/generated-metadata/graphql';

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

describe('mapRecordFiltersToRelationRollupFilters', () => {
  it('should round-trip relation rollup filters through record filters', () => {
    const relationRollup = {
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
    };

    const { recordFilters } = mapRelationRollupFiltersToRecordFilters({
      relationRollup,
      fieldMetadataItems: [targetFieldMetadataItem],
    });

    const mappedBack = mapRecordFiltersToRelationRollupFilters({
      recordFilters,
      recordFilterGroups: [],
      fieldMetadataItems: [targetFieldMetadataItem],
    });

    expect(mappedBack.recordFilters).toEqual([
      {
        fieldMetadataUniversalIdentifier:
          '00000000-0000-0000-0000-000000000010',
        relationTargetFieldMetadataUniversalIdentifier: null,
        operand: ViewFilterOperand.GREATER_THAN_OR_EQUAL,
        value: '100',
        viewFilterGroupId: null,
      },
    ]);
  });
});
