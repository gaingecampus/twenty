// Properties that sync must keep from the workspace DB instead of overwriting
// with app/code definitions. Includes:
// - override JSON columns (UI customizations on standard entities)
// - isActive (standard view/tab/widget/object/field soft-deactivation)
// - page layout widget layout/config written to base columns
export const WORKSPACE_OWNED_FLAT_ENTITY_PROPERTY_NAMES = [
  'overrides',
  'universalOverrides',
  'standardOverrides',
  'isActive',
  'configuration',
  'universalConfiguration',
  'gridPosition',
] as const;

export type WorkspaceOwnedFlatEntityPropertyName =
  (typeof WORKSPACE_OWNED_FLAT_ENTITY_PROPERTY_NAMES)[number];
