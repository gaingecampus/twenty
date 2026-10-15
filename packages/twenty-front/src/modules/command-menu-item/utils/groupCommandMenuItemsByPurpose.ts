import {
  CommandMenuItemAvailabilityType,
  EngineComponentKey,
  type CommandMenuItemFieldsFragment,
} from '~/generated-metadata/graphql';

export type CommandMenuPurpose =
  | 'record'
  | 'display'
  | 'search'
  | 'tools'
  | 'navigation'
  | 'personalSettings'
  | 'workspaceSettings'
  | 'delete';

export const isDestructiveCommandMenuItem = (
  item: CommandMenuItemFieldsFragment,
) =>
  [
    EngineComponentKey.DELETE_RECORDS,
    EngineComponentKey.DELETE_SINGLE_RECORD,
    EngineComponentKey.DELETE_MULTIPLE_RECORDS,
    EngineComponentKey.DESTROY_RECORDS,
    EngineComponentKey.DESTROY_SINGLE_RECORD,
    EngineComponentKey.DESTROY_MULTIPLE_RECORDS,
  ].includes(item.engineComponentKey);

export const getCommandMenuSettingsPath = (
  item: CommandMenuItemFieldsFragment,
) => {
  const payload = item.payload;
  return item.engineComponentKey === EngineComponentKey.NAVIGATION &&
    payload &&
    'path' in payload &&
    payload.path.startsWith('/settings/')
    ? payload.path
    : undefined;
};

const getPurpose = (
  item: CommandMenuItemFieldsFragment,
): CommandMenuPurpose => {
  if (isDestructiveCommandMenuItem(item)) return 'delete';

  const settingsPath = getCommandMenuSettingsPath(item);
  if (settingsPath) {
    return [
      '/settings/profile',
      '/settings/experience',
      '/settings/accounts',
      '/settings/accounts/emails',
      '/settings/accounts/calendars',
    ].includes(settingsPath)
      ? 'personalSettings'
      : 'workspaceSettings';
  }

  if (
    [
      EngineComponentKey.EDIT_RECORD_PAGE_LAYOUT,
      EngineComponentKey.EDIT_DASHBOARD_LAYOUT,
      EngineComponentKey.SAVE_DASHBOARD_LAYOUT,
      EngineComponentKey.CANCEL_DASHBOARD_LAYOUT,
    ].includes(item.engineComponentKey)
  )
    return 'display';

  if (
    [
      EngineComponentKey.SEARCH_RECORDS,
      EngineComponentKey.ASK_AI,
      EngineComponentKey.VIEW_PREVIOUS_AI_CHATS,
    ].includes(item.engineComponentKey)
  )
    return 'search';

  if (
    [
      EngineComponentKey.NAVIGATION,
      EngineComponentKey.GO_TO_COMPANIES,
      EngineComponentKey.GO_TO_DASHBOARDS,
      EngineComponentKey.GO_TO_NOTES,
      EngineComponentKey.GO_TO_OPPORTUNITIES,
      EngineComponentKey.GO_TO_PEOPLE,
      EngineComponentKey.GO_TO_RUNS,
      EngineComponentKey.GO_TO_TASKS,
      EngineComponentKey.GO_TO_WORKFLOWS,
    ].includes(item.engineComponentKey)
  )
    return 'navigation';

  return item.availabilityType === CommandMenuItemAvailabilityType.GLOBAL
    ? 'tools'
    : 'record';
};

const getRecordPriority = (item: CommandMenuItemFieldsFragment) => {
  if (item.engineComponentKey === EngineComponentKey.COMPOSE_EMAIL) return 0;
  if (
    item.engineComponentKey === EngineComponentKey.ADD_CUSTOMERS_TO_MESSAGE_LIST
  )
    return 1;
  if (
    [
      EngineComponentKey.EXPORT_RECORDS,
      EngineComponentKey.EXPORT_FROM_RECORD_SHOW,
      EngineComponentKey.EXPORT_FROM_RECORD_INDEX,
      EngineComponentKey.EXPORT_MULTIPLE_RECORDS,
    ].includes(item.engineComponentKey)
  )
    return 2;
  return 3;
};

export const groupCommandMenuItemsByPurpose = (
  items: CommandMenuItemFieldsFragment[],
) => {
  const hasContextualEmail = items.some(
    (item) =>
      item.engineComponentKey === EngineComponentKey.COMPOSE_EMAIL &&
      item.availabilityType ===
        CommandMenuItemAvailabilityType.RECORD_SELECTION,
  );
  const groups: Record<CommandMenuPurpose, CommandMenuItemFieldsFragment[]> = {
    record: [],
    display: [],
    search: [],
    tools: [],
    navigation: [],
    personalSettings: [],
    workspaceSettings: [],
    delete: [],
  };

  for (const item of items) {
    if (item.availabilityType === CommandMenuItemAvailabilityType.FALLBACK)
      continue;
    if (
      hasContextualEmail &&
      item.engineComponentKey === EngineComponentKey.COMPOSE_EMAIL &&
      item.availabilityType === CommandMenuItemAvailabilityType.GLOBAL
    )
      continue;
    groups[getPurpose(item)].push(item);
  }
  groups.record.sort(
    (left, right) => getRecordPriority(left) - getRecordPriority(right),
  );
  return groups;
};
