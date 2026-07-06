import { type ViewField } from '@/views/types/ViewField';
import { isDefined } from 'twenty-shared/utils';

export const isRelationRollupViewField = (
  viewField?: ViewField,
): boolean => {
  return isDefined(viewField?.relationRollup);
};
