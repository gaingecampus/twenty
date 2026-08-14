import { replaceChartFiltersForObject } from '@/page-layout/utils/replaceChartFiltersForObject';
import { type ChartFilters } from '@/side-panel/pages/page-layout/types/ChartFilters';
import { ViewFilterOperand } from 'twenty-shared/types';

describe('replaceChartFiltersForObject', () => {
  it('should replace filters for the given object and keep other objects', () => {
    const chartFilters: ChartFilters = {
      recordFilters: [
        {
          id: 'opportunity-filter',
          fieldMetadataId: 'opportunity-owner',
          operand: ViewFilterOperand.IS,
          value: 'old-member',
          displayValue: 'Old',
          label: 'Owner',
          type: 'RELATION',
        },
        {
          id: 'task-filter',
          fieldMetadataId: 'task-assignee',
          operand: ViewFilterOperand.IS,
          value: 'member-1',
          displayValue: 'Ada',
          label: 'Assignee',
          type: 'RELATION',
        },
      ],
    };

    const result = replaceChartFiltersForObject({
      chartFilters,
      objectFieldMetadataIds: new Set(['opportunity-owner']),
      nextObjectChartFilters: {
        recordFilters: [
          {
            id: 'opportunity-filter-2',
            fieldMetadataId: 'opportunity-owner',
            operand: ViewFilterOperand.IS,
            value: 'new-member',
            displayValue: 'New',
            label: 'Owner',
            type: 'RELATION',
          },
        ],
      },
    });

    expect(result.recordFilters).toHaveLength(2);
    expect(
      result.recordFilters?.map((recordFilter) => recordFilter.value),
    ).toEqual(['member-1', 'new-member']);
  });

  it('should drop an object filter group when replacing with empty filters', () => {
    const chartFilters: ChartFilters = {
      recordFilterGroups: [
        {
          id: 'group-1',
          logicalOperator: 'AND',
        },
      ],
      recordFilters: [
        {
          id: 'opportunity-filter',
          fieldMetadataId: 'opportunity-owner',
          operand: ViewFilterOperand.IS,
          value: 'member-1',
          displayValue: 'Ada',
          label: 'Owner',
          type: 'RELATION',
          recordFilterGroupId: 'group-1',
        },
      ],
    };

    const result = replaceChartFiltersForObject({
      chartFilters,
      objectFieldMetadataIds: new Set(['opportunity-owner']),
      nextObjectChartFilters: {
        recordFilters: [],
        recordFilterGroups: [],
      },
    });

    expect(result.recordFilters).toEqual([]);
    expect(result.recordFilterGroups).toEqual([]);
  });
});
