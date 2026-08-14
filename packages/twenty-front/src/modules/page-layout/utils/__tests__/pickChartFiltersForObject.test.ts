import { pickChartFiltersForObject } from '@/page-layout/utils/pickChartFiltersForObject';
import { type ChartFilters } from '@/side-panel/pages/page-layout/types/ChartFilters';
import { ViewFilterOperand } from 'twenty-shared/types';

describe('pickChartFiltersForObject', () => {
  it('should keep filters whose field belongs to the object', () => {
    const chartFilters: ChartFilters = {
      recordFilters: [
        {
          id: 'filter-1',
          fieldMetadataId: 'opportunity-owner',
          operand: ViewFilterOperand.IS,
          value: 'member-1',
          displayValue: 'Ada',
          label: 'Owner',
          type: 'RELATION',
        },
        {
          id: 'filter-2',
          fieldMetadataId: 'task-assignee',
          operand: ViewFilterOperand.IS,
          value: 'member-1',
          displayValue: 'Ada',
          label: 'Assignee',
          type: 'RELATION',
        },
      ],
    };

    const result = pickChartFiltersForObject({
      chartFilters,
      validFieldMetadataIds: new Set(['opportunity-owner']),
    });

    expect(result.recordFilters).toHaveLength(1);
    expect(result.recordFilters?.[0]?.fieldMetadataId).toBe(
      'opportunity-owner',
    );
  });

  it('should drop orphaned groups after removing other-object filters', () => {
    const chartFilters: ChartFilters = {
      recordFilterGroups: [
        {
          id: 'group-1',
          logicalOperator: 'AND',
        },
      ],
      recordFilters: [
        {
          id: 'filter-1',
          fieldMetadataId: 'task-assignee',
          operand: ViewFilterOperand.IS,
          value: 'member-1',
          displayValue: 'Ada',
          label: 'Assignee',
          type: 'RELATION',
          recordFilterGroupId: 'group-1',
        },
      ],
    };

    const result = pickChartFiltersForObject({
      chartFilters,
      validFieldMetadataIds: new Set(['opportunity-owner']),
    });

    expect(result.recordFilters).toEqual([]);
    expect(result.recordFilterGroups).toEqual([]);
  });
});
