import { type RecordGqlOperationFilter } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

export const andStatusBoardFilters = (
  filters: Array<RecordGqlOperationFilter | undefined>,
): RecordGqlOperationFilter | undefined => {
  const definedFilters = filters.filter(isDefined);

  if (definedFilters.length === 0) {
    return undefined;
  }

  if (definedFilters.length === 1) {
    return definedFilters[0];
  }

  return { and: definedFilters };
};
