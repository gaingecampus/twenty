import { type RecordField } from '@/object-record/record-field/types/RecordField';
import { type ViewField } from '@/views/types/ViewField';
import { mapRecordFieldToViewField } from '@/views/utils/mapRecordFieldToViewField';
import { isDefined } from 'twenty-shared/utils';

export const mapRecordFieldToViewFieldFromCurrentView = (
  recordField: RecordField,
  currentViewFields: ViewField[],
) => {
  const viewFieldFromState = currentViewFields.find(
    (viewField) => viewField.id === recordField.id,
  );

  return {
    ...mapRecordFieldToViewField(recordField),
    ...(isDefined(viewFieldFromState?.relationRollup)
      ? { relationRollup: viewFieldFromState.relationRollup }
      : {}),
  };
};
