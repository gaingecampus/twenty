import { resolveExistingViewFieldForSave } from '@/views/utils/resolveViewFieldForSave';
import { type ViewField } from '@/views/types/ViewField';
import { AggregateOperations } from 'twenty-shared/types';

const createViewField = (
  overrides: Partial<ViewField> & Pick<ViewField, 'id' | 'fieldMetadataId'>,
): ViewField =>
  ({
    isVisible: true,
    isActive: true,
    position: 0,
    size: 180,
    aggregateOperation: null,
    ...overrides,
  }) as ViewField;

describe('resolveExistingViewFieldForSave', () => {
  const relationFieldMetadataId = 'relation-field-id';
  const regularViewFieldId = 'regular-view-field-id';
  const rollupViewFieldId = 'rollup-view-field-id';

  const regularViewField = createViewField({
    id: regularViewFieldId,
    fieldMetadataId: relationFieldMetadataId,
    position: 1,
  });

  const rollupViewField = createViewField({
    id: rollupViewFieldId,
    fieldMetadataId: relationFieldMetadataId,
    position: 2,
    relationRollup: {
      relationFieldMetadataUniversalIdentifier: 'relation-universal-id',
      aggregateOperation: AggregateOperations.COUNT,
    },
  });

  const currentViewFields = [regularViewField, rollupViewField];

  it('should resolve rollup view field by id when saving visibility change', () => {
    const resolvedViewField = resolveExistingViewFieldForSave({
      viewFieldToSave: {
        id: rollupViewFieldId,
        fieldMetadataId: relationFieldMetadataId,
        isVisible: false,
        isActive: true,
        position: 2,
        size: 180,
      },
      currentViewFields,
    });

    expect(resolvedViewField?.id).toBe(rollupViewFieldId);
    expect(resolvedViewField?.relationRollup).toBeDefined();
  });

  it('should resolve regular view field by fieldMetadataId when relationRollup is absent', () => {
    const resolvedViewField = resolveExistingViewFieldForSave({
      viewFieldToSave: {
        id: regularViewFieldId,
        fieldMetadataId: relationFieldMetadataId,
        isVisible: false,
        isActive: true,
        position: 1,
        size: 180,
      },
      currentViewFields,
    });

    expect(resolvedViewField?.id).toBe(regularViewFieldId);
    expect(resolvedViewField?.relationRollup).toBeUndefined();
  });

  it('should not resolve rollup view field as regular field when ids differ', () => {
    const resolvedViewField = resolveExistingViewFieldForSave({
      viewFieldToSave: {
        id: rollupViewFieldId,
        fieldMetadataId: relationFieldMetadataId,
        isVisible: false,
        isActive: true,
        position: 2,
        size: 180,
        relationRollup: {
          relationFieldMetadataUniversalIdentifier: 'relation-universal-id',
          aggregateOperation: AggregateOperations.COUNT,
        },
      },
      currentViewFields,
    });

    expect(resolvedViewField?.id).not.toBe(regularViewFieldId);
  });

  it('should resolve rollup view field from save payload when missing from current view fields', () => {
    const resolvedViewField = resolveExistingViewFieldForSave({
      viewFieldToSave: {
        id: rollupViewFieldId,
        fieldMetadataId: relationFieldMetadataId,
        isVisible: true,
        isActive: true,
        position: 2,
        size: 180,
        relationRollup: {
          relationFieldMetadataUniversalIdentifier: 'relation-universal-id',
          aggregateOperation: AggregateOperations.COUNT,
        },
      },
      currentViewFields: [regularViewField],
    });

    expect(resolvedViewField?.id).toBe(rollupViewFieldId);
    expect(resolvedViewField?.relationRollup).toBeDefined();
  });
});
