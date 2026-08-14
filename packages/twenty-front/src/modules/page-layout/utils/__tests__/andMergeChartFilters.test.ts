import {
  RecordFilterGroupLogicalOperator,
  type ChartFilter,
} from 'twenty-shared/types';

import { andMergeChartFilters } from '@/page-layout/utils/andMergeChartFilters';

describe('andMergeChartFilters', () => {
  describe('when one side is empty', () => {
    it('should return the other filter when left is empty', () => {
      const right: ChartFilter = {
        recordFilters: [
          {
            fieldMetadataId: 'field-1',
            operand: 'IS',
            value: 'a',
          },
        ],
      };

      expect(
        andMergeChartFilters({
          left: {},
          right,
        }),
      ).toEqual(right);
    });

    it('should return the other filter when right is empty', () => {
      const left: ChartFilter = {
        recordFilters: [
          {
            fieldMetadataId: 'field-1',
            operand: 'IS',
            value: 'a',
          },
        ],
      };

      expect(
        andMergeChartFilters({
          left,
          right: null,
        }),
      ).toEqual(left);
    });
  });

  describe('when both sides have ungrouped filters', () => {
    it('should wrap both sides in an AND root group', () => {
      const left: ChartFilter = {
        recordFilters: [
          {
            fieldMetadataId: 'widget-field',
            operand: 'IS',
            value: 'won',
          },
        ],
      };
      const right: ChartFilter = {
        recordFilters: [
          {
            fieldMetadataId: 'dashboard-field',
            operand: 'IS',
            value: 'member-1',
          },
        ],
      };

      const result = andMergeChartFilters({ left, right });

      expect(result.recordFilterGroups).toHaveLength(1);
      expect(result.recordFilterGroups?.[0]?.logicalOperator).toBe(
        RecordFilterGroupLogicalOperator.AND,
      );
      expect(
        result.recordFilterGroups?.[0]?.parentRecordFilterGroupId,
      ).toBeNull();

      const mergeRootGroupId = result.recordFilterGroups?.[0]?.id;

      expect(result.recordFilters).toHaveLength(2);
      expect(
        result.recordFilters?.map((filter) => filter.fieldMetadataId),
      ).toEqual(['widget-field', 'dashboard-field']);
      expect(
        result.recordFilters?.every(
          (filter) => filter.recordFilterGroupId === mergeRootGroupId,
        ),
      ).toBe(true);
    });
  });

  describe('when both sides have groups', () => {
    it('should remap right group ids so they do not collide', () => {
      const sharedGroupId = 'shared-group-id';
      const left: ChartFilter = {
        recordFilterGroups: [
          {
            id: sharedGroupId,
            logicalOperator: RecordFilterGroupLogicalOperator.OR,
          },
        ],
        recordFilters: [
          {
            fieldMetadataId: 'widget-field',
            operand: 'IS',
            value: 'won',
            recordFilterGroupId: sharedGroupId,
          },
        ],
      };
      const right: ChartFilter = {
        recordFilterGroups: [
          {
            id: sharedGroupId,
            logicalOperator: RecordFilterGroupLogicalOperator.AND,
          },
        ],
        recordFilters: [
          {
            fieldMetadataId: 'dashboard-field',
            operand: 'IS',
            value: 'member-1',
            recordFilterGroupId: sharedGroupId,
          },
        ],
      };

      const result = andMergeChartFilters({ left, right });

      const groupIds =
        result.recordFilterGroups?.map((group) => group.id) ?? [];

      expect(new Set(groupIds).size).toBe(groupIds.length);
      expect(result.recordFilterGroups).toHaveLength(3);

      const widgetFilter = result.recordFilters?.find(
        (filter) => filter.fieldMetadataId === 'widget-field',
      );
      const dashboardFilter = result.recordFilters?.find(
        (filter) => filter.fieldMetadataId === 'dashboard-field',
      );

      expect(widgetFilter?.recordFilterGroupId).toBe(sharedGroupId);
      expect(dashboardFilter?.recordFilterGroupId).not.toBe(sharedGroupId);
      expect(dashboardFilter?.recordFilterGroupId).toBeDefined();
    });
  });
});
