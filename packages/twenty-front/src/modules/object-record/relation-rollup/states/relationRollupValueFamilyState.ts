import { createAtomFamilyState } from '@/ui/utilities/state/jotai/utils/createAtomFamilyState';

export type RelationRollupValueFamilyKey = {
  recordId: string;
  viewFieldId: string;
};

export const relationRollupValueFamilyState = createAtomFamilyState<
  string | number | null | undefined,
  RelationRollupValueFamilyKey
>({
  key: 'relationRollupValueFamilyState',
  defaultValue: undefined,
});
