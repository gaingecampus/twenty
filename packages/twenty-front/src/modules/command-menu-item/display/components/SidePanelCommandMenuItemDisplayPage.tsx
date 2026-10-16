import { CommandMenuContext } from '@/command-menu-item/contexts/CommandMenuContext';
import { CommandMenuItemRenderer } from '@/command-menu-item/display/components/CommandMenuItemRenderer';
import {
  getCommandMenuSettingsPath,
  groupCommandMenuItemsByPurpose,
  type CommandMenuPurpose,
} from '@/command-menu-item/utils/groupCommandMenuItemsByPurpose';
import { CommandMenuItem } from '@/command-menu/components/CommandMenuItem';
import { SidePanelGroup } from '@/side-panel/components/SidePanelGroup';
import { SidePanelList } from '@/side-panel/components/SidePanelList';
import { useFilterCommandMenuItemsWithSidePanelSearch } from '@/side-panel/pages/root/hooks/useFilterCommandMenuItemsWithSidePanelSearch';
import { sidePanelSearchState } from '@/side-panel/states/sidePanelSearchState';
import { SelectableListItem } from '@/ui/layout/selectable-list/components/SelectableListItem';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useContext, useState } from 'react';
import {
  IconArrowLeft,
  IconArrowRight,
  IconSettings,
  IconUser,
} from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import {
  CommandMenuItemAvailabilityType,
  EngineComponentKey,
} from '~/generated-metadata/graphql';

type SettingsMenu = 'personalSettings' | 'workspaceSettings';
type Submenu = SettingsMenu | 'navigation';

const StyledDeleteSection = styled.div`
  border-top: 1px solid ${themeCssVariables.border.color.light};
  margin-top: ${themeCssVariables.spacing[3]};
  padding-top: ${themeCssVariables.spacing[1]};
`;

export const SidePanelCommandMenuItemDisplayPage = () => {
  const { t } = useLingui();
  const [sidePanelSearch, setSidePanelSearch] =
    useAtomState(sidePanelSearchState);
  const [settingsMenu, setSettingsMenu] = useState<Submenu | null>(null);
  const { commandMenuItems, commandMenuContextApi } =
    useContext(CommandMenuContext);
  const { filterCommandMenuItemsWithSidePanelSearch } =
    useFilterCommandMenuItemsWithSidePanelSearch({
      sidePanelSearch,
      commandMenuContextApi,
    });

  const allGroups = groupCommandMenuItemsByPurpose(commandMenuItems);
  const isSearching = sidePanelSearch.trim().length > 0;
  const headings: Record<CommandMenuPurpose, string> = {
    record:
      commandMenuContextApi.objectMetadataItem.nameSingular === 'person'
        ? t`고객 작업`
        : t`레코드 작업`,
    display: t`화면 설정`,
    search: t`검색·AI`,
    tools: t`공통 작업`,
    navigation: t`다른 화면으로 이동`,
    personalSettings: t`개인 설정`,
    workspaceSettings: t`워크스페이스 설정`,
    delete: t`삭제`,
  };
  const settingLabels: Record<string, string> = {
    '/settings/profile': t`프로필`,
    '/settings/experience': t`환경 설정`,
    '/settings/accounts': t`계정`,
    '/settings/accounts/emails': t`이메일`,
    '/settings/accounts/calendars': t`캘린더`,
    '/settings/general': t`일반`,
    '/settings/objects': t`데이터 모델`,
    '/settings/members': t`멤버`,
    '/settings/roles': t`역할`,
    '/settings/domains': t`도메인`,
    '/settings/billing': t`결제`,
    '/settings/api-webhooks': t`API 및 웹훅`,
    '/settings/applications': t`앱`,
    '/settings/ai': t`AI`,
    '/settings/security': t`보안`,
    '/settings/admin-panel': t`관리자 패널`,
    '/settings/community': t`커뮤니티`,
  };

  const purposeOrder: CommandMenuPurpose[] = isSearching
    ? [
        'record',
        'display',
        'search',
        'tools',
        'navigation',
        'personalSettings',
        'workspaceSettings',
        'delete',
      ]
    : settingsMenu
      ? [settingsMenu]
      : ['record', 'display', 'search', 'tools', 'delete'];
  const visibleGroups = purposeOrder
    .map((purpose) => ({
      purpose,
      items: filterCommandMenuItemsWithSidePanelSearch(allGroups[purpose]),
    }))
    .filter((group) => group.items.length > 0);
  const settingsMenus: SettingsMenu[] =
    !isSearching && !settingsMenu
      ? (['personalSettings', 'workspaceSettings'] as const).filter(
          (purpose) => allGroups[purpose].length > 0,
        )
      : [];
  const showNavigationMenu =
    !isSearching && !settingsMenu && allGroups.navigation.length > 0;
  const noResults =
    !showNavigationMenu &&
    visibleGroups.length === 0 &&
    settingsMenus.length === 0;
  const fallbackItems =
    noResults && isSearching
      ? commandMenuItems.filter(
          (item) =>
            item.availabilityType === CommandMenuItemAvailabilityType.FALLBACK,
        )
      : [];
  const regularGroups = visibleGroups.filter(
    (group) => group.purpose !== 'delete',
  );
  const deleteItems =
    visibleGroups.find((group) => group.purpose === 'delete')?.items ?? [];
  const showBack = settingsMenu !== null;
  const backId = 'command-menu-settings-back';
  const submenuId = (menu: Submenu) => `command-menu-${menu}`;
  const openSettingsMenu = (menu: Submenu | null) => {
    setSidePanelSearch('');
    setSettingsMenu(menu);
  };
  const selectableItemIds = [
    ...(showBack ? [backId] : []),
    ...regularGroups.flatMap((group) => group.items.map((item) => item.id)),
    ...(showNavigationMenu ? [submenuId('navigation')] : []),
    ...settingsMenus.map(submenuId),
    ...deleteItems.map((item) => item.id),
    ...fallbackItems.map((item) => item.id),
  ];

  return (
    <SidePanelList selectableItemIds={selectableItemIds} noResults={noResults}>
      {showBack && (
        <SelectableListItem
          itemId={backId}
          onEnter={() => openSettingsMenu(null)}
        >
          <CommandMenuItem
            id={backId}
            label={t`모든 작업으로 돌아가기`}
            Icon={IconArrowLeft}
            onClick={() => openSettingsMenu(null)}
          />
        </SelectableListItem>
      )}
      {regularGroups.map(({ purpose, items }) => (
        <SidePanelGroup key={purpose} heading={headings[purpose]}>
          {items.map((item) => {
            const path = getCommandMenuSettingsPath(item);
            const label = path
              ? settingLabels[path]
              : item.engineComponentKey === EngineComponentKey.COMPOSE_CAMPAIGN
                ? t`심방콜 발송 작성`
                : undefined;
            return (
              <CommandMenuItemRenderer
                item={label ? { ...item, label } : item}
                key={item.id}
              />
            );
          })}
        </SidePanelGroup>
      ))}
      {showNavigationMenu && (
        <SidePanelGroup heading={t`이동`}>
          <SelectableListItem
            itemId={submenuId('navigation')}
            onEnter={() => openSettingsMenu('navigation')}
          >
            <CommandMenuItem
              id={submenuId('navigation')}
              label={headings.navigation}
              Icon={IconArrowRight}
              hasSubMenu
              onClick={() => openSettingsMenu('navigation')}
            />
          </SelectableListItem>
        </SidePanelGroup>
      )}
      {settingsMenus.length > 0 && (
        <SidePanelGroup heading={t`설정`}>
          {settingsMenus.map((menu) => (
            <SelectableListItem
              key={menu}
              itemId={submenuId(menu)}
              onEnter={() => openSettingsMenu(menu)}
            >
              <CommandMenuItem
                id={submenuId(menu)}
                label={headings[menu]}
                Icon={menu === 'personalSettings' ? IconUser : IconSettings}
                hasSubMenu
                onClick={() => openSettingsMenu(menu)}
              />
            </SelectableListItem>
          ))}
        </SidePanelGroup>
      )}
      {deleteItems.length > 0 && (
        <StyledDeleteSection>
          <SidePanelGroup heading={headings.delete}>
            {deleteItems.map((item) => (
              <CommandMenuItemRenderer item={item} key={item.id} />
            ))}
          </SidePanelGroup>
        </StyledDeleteSection>
      )}
      {fallbackItems.length > 0 && (
        <SidePanelGroup heading={t`Fallback`}>
          {fallbackItems.map((item) => (
            <CommandMenuItemRenderer item={item} key={item.id} />
          ))}
        </SidePanelGroup>
      )}
    </SidePanelList>
  );
};
