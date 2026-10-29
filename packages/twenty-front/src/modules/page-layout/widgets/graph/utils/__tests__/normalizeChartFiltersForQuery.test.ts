import { normalizeChartFiltersForQuery } from '@/page-layout/widgets/graph/utils/normalizeChartFiltersForQuery';
import { FieldMetadataType, ViewFilterOperand } from 'twenty-shared/types';

const fields = [
  { id: 'name', name: 'name', label: 'Name', type: FieldMetadataType.TEXT },
];

describe('normalizeChartFiltersForQuery', () => {
  it('hydrates persisted emptiness filters without UI-only fields', () => {
    const result = normalizeChartFiltersForQuery(
      {
        recordFilters: [
          {
            fieldMetadataId: 'name',
            operand: ViewFilterOperand.IS_EMPTY,
            value: null,
            recordFilterGroupId: 'group',
          },
        ],
        recordFilterGroups: [{ id: 'group', logicalOperator: 'OR' }],
      },
      fields,
    );
    expect(result.recordFilters[0]).toMatchObject({
      value: '',
      type: 'TEXT',
      recordFilterGroupId: 'group',
    });
    expect(result.recordFilterGroups[0].logicalOperator).toBe('OR');
  });

  it('rejects invalid operators instead of silently dropping filters', () => {
    expect(() =>
      normalizeChartFiltersForQuery(
        { recordFilterGroups: [{ id: 'group', logicalOperator: 'XOR' }] },
        fields,
      ),
    ).toThrow('Invalid chart filter group');
    expect(() =>
      normalizeChartFiltersForQuery(
        { recordFilters: [{ fieldMetadataId: 'name', operand: 'invalid' }] },
        fields,
      ),
    ).toThrow('Invalid chart filter');
  });
});
