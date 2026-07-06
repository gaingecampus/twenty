import { getRelationRollupDisplayLabel } from '@/object-record/relation-rollup/utils/getRelationRollupDisplayLabel';
import { AggregateOperations } from 'twenty-shared/types';

describe('getRelationRollupDisplayLabel', () => {
  it('should format COUNT as relation plus operation', () => {
    expect(
      getRelationRollupDisplayLabel({
        relationFieldLabel: '기회',
        aggregateOperation: AggregateOperations.COUNT,
      }),
    ).toBe('기회 COUNT');
  });

  it('should format SUM as relation plus field plus operation', () => {
    expect(
      getRelationRollupDisplayLabel({
        relationFieldLabel: '기회',
        aggregateOperation: AggregateOperations.SUM,
        aggregateFieldLabel: '금액',
      }),
    ).toBe('기회 금액 SUM');
  });

  it('should fall back to relation plus operation when aggregate field is missing', () => {
    expect(
      getRelationRollupDisplayLabel({
        relationFieldLabel: '기회',
        aggregateOperation: AggregateOperations.AVG,
      }),
    ).toBe('기회 AVG');
  });
});
