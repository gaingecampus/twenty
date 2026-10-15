import { groupCommandMenuItemsByPurpose } from '@/command-menu-item/utils/groupCommandMenuItemsByPurpose';
import {
  CommandMenuItemAvailabilityType as Availability,
  EngineComponentKey as Engine,
  type CommandMenuItemFieldsFragment,
} from '~/generated-metadata/graphql';

const item = (
  id: string,
  engineComponentKey: Engine,
  options: Partial<CommandMenuItemFieldsFragment> = {},
): CommandMenuItemFieldsFragment => ({
  id,
  engineComponentKey,
  label: id,
  position: 0,
  isPinned: false,
  isActive: true,
  availabilityType: Availability.GLOBAL,
  ...options,
});

const setting = (path: string) =>
  item(path, Engine.NAVIGATION, { payload: { path } });

describe('groupCommandMenuItemsByPurpose', () => {
  it('prioritizes contextual email, audience membership and export regardless of pinned state', () => {
    const selection = { availabilityType: Availability.RECORD_SELECTION };
    const actions = [
      item('export', Engine.EXPORT_RECORDS, selection),
      item('favorite', Engine.ADD_TO_FAVORITES, selection),
      item('add', Engine.ADD_CUSTOMERS_TO_MESSAGE_LIST, {
        ...selection,
        isPinned: true,
      }),
      item('generic-email', Engine.COMPOSE_EMAIL),
      item('email', Engine.COMPOSE_EMAIL, { ...selection, isPinned: true }),
    ];
    const groups = groupCommandMenuItemsByPurpose(actions);
    expect(groups.record.map(({ id }) => id)).toEqual([
      'email',
      'add',
      'export',
      'favorite',
    ]);
    expect(groups.tools).toEqual([]);
    expect(actions[0].id).toBe('export');
  });

  it('keeps generic email when no contextual email action is available', () => {
    const compose = item('email', Engine.COMPOSE_EMAIL);
    expect(groupCommandMenuItemsByPurpose([compose]).tools).toEqual([compose]);
  });

  it('groups settings by destination rather than translated labels', () => {
    const groups = groupCommandMenuItemsByPurpose([
      setting('/settings/profile'),
      setting('/settings/accounts/emails'),
      setting('/settings/accounts/calendars'),
      setting('/settings/general'),
      setting('/settings/objects'),
      setting('/settings/ai'),
      setting('/settings/security'),
    ]);
    expect(groups.personalSettings.map(({ id }) => id)).toEqual([
      '/settings/profile',
      '/settings/accounts/emails',
      '/settings/accounts/calendars',
    ]);
    expect(groups.workspaceSettings.map(({ id }) => id)).toEqual([
      '/settings/general',
      '/settings/objects',
      '/settings/ai',
      '/settings/security',
    ]);
  });

  it('separates layout, search and destructive actions, including pinned deletion', () => {
    const groups = groupCommandMenuItemsByPurpose([
      item('layout', Engine.EDIT_RECORD_PAGE_LAYOUT),
      item('search', Engine.SEARCH_RECORDS),
      item('ai', Engine.ASK_AI),
      item('history', Engine.VIEW_PREVIOUS_AI_CHATS),
      item('delete', Engine.DELETE_RECORDS, { isPinned: true }),
      item('destroy', Engine.DESTROY_MULTIPLE_RECORDS),
    ]);
    expect(groups.display.map(({ id }) => id)).toEqual(['layout']);
    expect(groups.search.map(({ id }) => id)).toEqual([
      'search',
      'ai',
      'history',
    ]);
    expect(groups.delete.map(({ id }) => id)).toEqual(['delete', 'destroy']);
  });

  it('keeps object navigation in its own submenu without mixing settings', () => {
    const navigate = item('companies', Engine.GO_TO_COMPANIES);
    const customNavigate = item('custom-object', Engine.NAVIGATION, {
      payload: { objectMetadataItemId: 'custom-object-id' },
    });
    const groups = groupCommandMenuItemsByPurpose([
      navigate,
      customNavigate,
      setting('/settings/general'),
    ]);
    expect(groups.navigation).toEqual([navigate, customNavigate]);
    expect(groups.workspaceSettings).toHaveLength(1);
  });

  it('preserves custom actions and excludes fallback actions from normal groups', () => {
    const custom = item('custom', Engine.FRONT_COMPONENT_RENDERER);
    const groups = groupCommandMenuItemsByPurpose([
      custom,
      item('fallback', Engine.SEARCH_RECORDS_FALLBACK, {
        availabilityType: Availability.FALLBACK,
      }),
    ]);
    expect(Object.values(groups).flat()).toEqual([custom]);
  });
});
