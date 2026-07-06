import { type ViewField } from '@/views/types/ViewField';
import { isRelationRollupViewField } from '@/views/utils/isRelationRollupViewField';
import { isDefined } from 'twenty-shared/utils';

export const resolveExistingViewFieldForSave = ({
  viewFieldToSave,
  currentViewFields,
}: {
  viewFieldToSave: Omit<ViewField, 'definition'>;
  currentViewFields: ViewField[];
}): ViewField | undefined => {
  const existingFieldById = currentViewFields.find(
    (currentViewField) => currentViewField.id === viewFieldToSave.id,
  );

  const isViewFieldRelationRollup =
    isRelationRollupViewField(viewFieldToSave) ||
    isRelationRollupViewField(existingFieldById);

  if (isViewFieldRelationRollup) {
    if (isDefined(existingFieldById)) {
      return existingFieldById;
    }

    if (isRelationRollupViewField(viewFieldToSave)) {
      return {
        ...viewFieldToSave,
        isActive: viewFieldToSave.isActive ?? true,
      } as ViewField;
    }

    return undefined;
  }

  return currentViewFields.find(
    (currentViewField) =>
      currentViewField.fieldMetadataId === viewFieldToSave.fieldMetadataId &&
      !isRelationRollupViewField(currentViewField),
  );
};

export const isViewFieldRelationRollupForSave = ({
  viewFieldToSave,
  currentViewFields,
}: {
  viewFieldToSave: Omit<ViewField, 'definition'>;
  currentViewFields: ViewField[];
}): boolean => {
  const existingFieldById = currentViewFields.find(
    (currentViewField) => currentViewField.id === viewFieldToSave.id,
  );

  return (
    isRelationRollupViewField(viewFieldToSave) ||
    isRelationRollupViewField(existingFieldById)
  );
};
