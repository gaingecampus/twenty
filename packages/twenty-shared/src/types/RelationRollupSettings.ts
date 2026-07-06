import { type AggregateOperations } from '@/types/AggregateOperations';
import { type ViewFilterOperand } from '@/types/ViewFilterOperand';
import { type ViewFilterGroupLogicalOperator } from '@/types/ViewFilterGroupLogicalOperator';

export type RelationRollupFilterSnapshot = {
  fieldMetadataUniversalIdentifier: string;
  relationTargetFieldMetadataUniversalIdentifier?: string | null;
  operand: ViewFilterOperand;
  value: string | string[] | boolean | Record<string, unknown>;
  viewFilterGroupId?: string | null;
};

export type RelationRollupFilterGroupSnapshot = {
  id: string;
  parentViewFilterGroupId?: string | null;
  logicalOperator: ViewFilterGroupLogicalOperator;
};

export type RelationRollupSettings = {
  relationFieldMetadataUniversalIdentifier: string;
  aggregateOperation: AggregateOperations;
  aggregateFieldMetadataUniversalIdentifier?: string | null;
  label?: string | null;
  recordFilters?: RelationRollupFilterSnapshot[] | null;
  recordFilterGroups?: RelationRollupFilterGroupSnapshot[] | null;
};
