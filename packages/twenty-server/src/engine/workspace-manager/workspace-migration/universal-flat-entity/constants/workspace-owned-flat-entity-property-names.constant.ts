import { type AllMetadataName } from 'twenty-shared/metadata';

// Properties that sync must keep from the workspace DB instead of overwriting
// with app/code definitions. Includes:
// - override JSON columns (UI customizations on standard entities)
// - isActive (standard view/tab/widget/object/field soft-deactivation)
// - page layout widget layout/config written to base columns
// - SELECT/MULTI_SELECT options + defaultValue (e.g. opportunity stage)
// - viewGroup kanban column order/visibility (no override path)
// - navigationMenuItem sidebar order/folder (no override path)
export const WORKSPACE_OWNED_FLAT_ENTITY_PROPERTY_NAMES = [
  'overrides',
  'universalOverrides',
  'standardOverrides',
  'isActive',
  'configuration',
  'universalConfiguration',
  'gridPosition',
  'options',
  'defaultValue',
  'position',
  'isVisible',
  'folderId',
  'folderUniversalIdentifier',
] as const;

// Nav folders/links write label props to base columns (no overrides path).
// Keep these scoped so field/object base name/icon still follow code.
const NAVIGATION_MENU_ITEM_WORKSPACE_OWNED_PROPERTY_NAMES = [
  'name',
  'icon',
  'color',
  'link',
] as const;

export type WorkspaceOwnedFlatEntityPropertyName =
  | (typeof WORKSPACE_OWNED_FLAT_ENTITY_PROPERTY_NAMES)[number]
  | (typeof NAVIGATION_MENU_ITEM_WORKSPACE_OWNED_PROPERTY_NAMES)[number];

export const getWorkspaceOwnedFlatEntityPropertyNames = (
  metadataName?: AllMetadataName,
): readonly WorkspaceOwnedFlatEntityPropertyName[] => {
  if (metadataName === 'navigationMenuItem') {
    return [
      ...WORKSPACE_OWNED_FLAT_ENTITY_PROPERTY_NAMES,
      ...NAVIGATION_MENU_ITEM_WORKSPACE_OWNED_PROPERTY_NAMES,
    ];
  }

  return WORKSPACE_OWNED_FLAT_ENTITY_PROPERTY_NAMES;
};
