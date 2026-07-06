import { AggregateOperations } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

export const getRelationRollupDisplayLabel = ({
  relationFieldLabel,
  aggregateOperation,
  aggregateFieldLabel,
}: {
  relationFieldLabel: string;
  aggregateOperation: AggregateOperations;
  aggregateFieldLabel?: string | null;
}): string => {
  if (aggregateOperation === AggregateOperations.COUNT) {
    return `${relationFieldLabel} ${aggregateOperation}`;
  }

  if (isDefined(aggregateFieldLabel) && aggregateFieldLabel.length > 0) {
    return `${relationFieldLabel} ${aggregateFieldLabel} ${aggregateOperation}`;
  }

  return `${relationFieldLabel} ${aggregateOperation}`;
};
