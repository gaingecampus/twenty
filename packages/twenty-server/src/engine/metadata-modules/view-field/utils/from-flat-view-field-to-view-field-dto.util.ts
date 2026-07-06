import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import { type RelationRollupSettingsDTO } from 'src/engine/metadata-modules/view-field/dtos/relation-rollup-settings.dto';
import { type ViewFieldDTO } from 'src/engine/metadata-modules/view-field/dtos/view-field.dto';

export const fromFlatViewFieldToViewFieldDto = (
  flatViewField: FlatViewField,
): ViewFieldDTO => {
  const {
    createdAt,
    updatedAt,
    deletedAt,
    overrides,
    relationRollup,
    ...rest
  } = flatViewField;

  return {
    ...rest,
    relationRollup: (relationRollup ?? null) as RelationRollupSettingsDTO | null,
    ...(overrides ?? {}),
    isOverridden: false,
    createdAt: new Date(createdAt),
    updatedAt: new Date(updatedAt),
    deletedAt: deletedAt ? new Date(deletedAt) : null,
  };
};
