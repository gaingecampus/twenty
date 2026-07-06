import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadata } from '@/object-record/record-field/ui/types/FieldMetadata';
import { buildRelationRollupColumnDefinitionFromViewField } from '@/object-record/relation-rollup/utils/buildRelationRollupColumnDefinitionFromViewField';
import { type ColumnDefinition } from '@/object-record/record-table/types/ColumnDefinition';
import { mapArrayToObject } from '~/utils/array/mapArrayToObject';
import { moveArrayItem } from '~/utils/array/moveArrayItem';
import { isUndefinedOrNull } from '~/utils/isUndefinedOrNull';

import { isDefined } from 'twenty-shared/utils';
import { type ViewField } from '@/views/types/ViewField';

export const mapViewFieldsToColumnDefinitions = ({
  columnDefinitions,
  viewFields,
  objectMetadataItem,
  objectMetadataItems = [objectMetadataItem],
}: {
  columnDefinitions: ColumnDefinition<FieldMetadata>[];
  viewFields: ViewField[];
  objectMetadataItem: EnrichedObjectMetadataItem;
  objectMetadataItems?: EnrichedObjectMetadataItem[];
}): ColumnDefinition<FieldMetadata>[] => {
  let labelIdentifierFieldMetadataId = '';

  const columnDefinitionsByFieldMetadataId = mapArrayToObject(
    columnDefinitions,
    ({ fieldMetadataId }) => fieldMetadataId,
  );

  const columnDefinitionsFromViewFields = viewFields
    .map((viewField) => {
      if (isDefined(viewField.relationRollup)) {
        const relationFieldMetadataItem = objectMetadataItem.fields.find(
          (field) => field.id === viewField.fieldMetadataId,
        );

        if (!isDefined(relationFieldMetadataItem)) {
          return null;
        }

        const targetObjectMetadataItem = objectMetadataItems.find(
          (objectMetadataItemToFind) =>
            objectMetadataItemToFind.id ===
            relationFieldMetadataItem.relation?.targetObjectMetadata.id,
        );

        const aggregateFieldMetadataItem = isDefined(
          viewField.relationRollup.aggregateFieldMetadataUniversalIdentifier,
        )
          ? targetObjectMetadataItem?.fields.find(
              (field) =>
                field.universalIdentifier ===
                viewField.relationRollup
                  ?.aggregateFieldMetadataUniversalIdentifier,
            )
          : undefined;

        return buildRelationRollupColumnDefinitionFromViewField({
          viewField,
          relationFieldMetadataItem,
          aggregateFieldMetadataItem,
          objectMetadataNameSingular: objectMetadataItem.nameSingular,
        });
      }

      const correspondingColumnDefinition =
        columnDefinitionsByFieldMetadataId[viewField.fieldMetadataId];

      if (isUndefinedOrNull(correspondingColumnDefinition)) return null;

      const { isLabelIdentifier } = correspondingColumnDefinition;

      if (isLabelIdentifier === true) {
        labelIdentifierFieldMetadataId =
          correspondingColumnDefinition.fieldMetadataId;
      }

      return {
        fieldMetadataId: viewField.fieldMetadataId,
        label: correspondingColumnDefinition.label,
        metadata: correspondingColumnDefinition.metadata,
        iconName: correspondingColumnDefinition.iconName,
        type: correspondingColumnDefinition.type,
        position: isLabelIdentifier ? 0 : viewField.position,
        size: viewField.size ?? correspondingColumnDefinition.size,
        isLabelIdentifier,
        isVisible: isLabelIdentifier || viewField.isVisible,
        viewFieldId: viewField.id,
        isUIEditable: correspondingColumnDefinition.metadata.isUIEditable,
        isSortable: correspondingColumnDefinition.isSortable,
        isFilterable: correspondingColumnDefinition.isFilterable,
        defaultValue: correspondingColumnDefinition.defaultValue,
        settings:
          'settings' in correspondingColumnDefinition.metadata
            ? correspondingColumnDefinition.metadata.settings
            : undefined,
      } as ColumnDefinition<FieldMetadata>;
    })
    .filter(isDefined);

  if (!labelIdentifierFieldMetadataId) return columnDefinitionsFromViewFields;

  const labelIdentifierIndex = columnDefinitionsFromViewFields.findIndex(
    ({ fieldMetadataId }) => fieldMetadataId === labelIdentifierFieldMetadataId,
  );

  return moveArrayItem(columnDefinitionsFromViewFields, {
    fromIndex: labelIdentifierIndex,
    toIndex: 0,
  });
};
