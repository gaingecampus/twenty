import { type createStore } from 'jotai/vanilla';
import { relationRollupValueFamilyState } from '@/object-record/relation-rollup/states/relationRollupValueFamilyState';
import { type ViewField } from '@/views/types/ViewField';
import { isDefined } from 'twenty-shared/utils';

type JotaiStore = ReturnType<typeof createStore>;

export const clearRelationRollupValuesForView = ({
  store,
  viewFields,
  recordIds,
}: {
  store: JotaiStore;
  viewFields: ViewField[];
  recordIds: string[];
}) => {
  const rollupViewFieldIds = viewFields
    .filter((viewField) => isDefined(viewField.relationRollup))
    .map((viewField) => viewField.id);

  for (const viewFieldId of rollupViewFieldIds) {
    for (const recordId of recordIds) {
      store.set(
        relationRollupValueFamilyState.atomFamily({
          recordId,
          viewFieldId,
        }),
        undefined,
      );
    }
  }
};
