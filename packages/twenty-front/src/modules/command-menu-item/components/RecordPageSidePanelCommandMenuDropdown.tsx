import { CommandMenuContext } from '@/command-menu-item/contexts/CommandMenuContext';
import { CommandMenuItemRenderer } from '@/command-menu-item/display/components/CommandMenuItemRenderer';
import { getSidePanelCommandMenuDropdownIdFromCommandMenuId } from '@/command-menu-item/utils/getSidePanelCommandMenuDropdownIdFromCommandMenuId';
import { CommandMenuComponentInstanceContext } from '@/command-menu/states/contexts/CommandMenuComponentInstanceContext';
import { OptionsDropdownMenu } from '@/ui/layout/dropdown/components/OptionsDropdownMenu';
import { useCloseDropdown } from '@/ui/layout/dropdown/hooks/useCloseDropdown';
import { sidePanelWidgetFooterCommandMenuItemsState } from '@/ui/layout/side-panel/states/sidePanelWidgetFooterCommandMenuItemsState';
import { useAvailableComponentInstanceIdOrThrow } from '@/ui/utilities/state/component-state/hooks/useAvailableComponentInstanceIdOrThrow';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useContext, useMemo } from 'react';
import { HorizontalSeparator } from 'twenty-ui/layout';
import { MenuItem } from 'twenty-ui/navigation';
import {
  EngineComponentKey,
  CommandMenuItemAvailabilityType,
} from '~/generated-metadata/graphql';

export const RecordPageSidePanelCommandMenuDropdown = () => {
  const { commandMenuItems } = useContext(CommandMenuContext);

  const commandMenuId = useAvailableComponentInstanceIdOrThrow(
    CommandMenuComponentInstanceContext,
  );

  const dropdownId =
    getSidePanelCommandMenuDropdownIdFromCommandMenuId(commandMenuId);

  const { closeDropdown } = useCloseDropdown();

  const sidePanelWidgetFooterCommandMenuItems = useAtomStateValue(
    sidePanelWidgetFooterCommandMenuItemsState,
  );

  const dropdownWidgetCommandMenuItems = sidePanelWidgetFooterCommandMenuItems;

  const recordSelectionCommandMenuItems = useMemo(
    () =>
      commandMenuItems
        .filter(
          (item) =>
            item.availabilityType ===
            CommandMenuItemAvailabilityType.RECORD_SELECTION,
        )
        .sort(
          (left, right) =>
            Number(
              left.engineComponentKey === EngineComponentKey.DELETE_RECORDS,
            ) -
            Number(
              right.engineComponentKey === EngineComponentKey.DELETE_RECORDS,
            ),
        ),
    [commandMenuItems],
  );

  const selectableItemIdArray = [
    ...dropdownWidgetCommandMenuItems.map(
      (commandMenuItem) => commandMenuItem.id,
    ),
    ...recordSelectionCommandMenuItems.map((item) => item.id),
  ];

  return (
    <OptionsDropdownMenu
      compact
      dropdownId={dropdownId}
      selectableListId={commandMenuId}
      selectableItemIdArray={selectableItemIdArray}
    >
      {dropdownWidgetCommandMenuItems.map((commandMenuItem) => (
        <MenuItem
          key={commandMenuItem.id}
          disabled={commandMenuItem.disabled}
          text={commandMenuItem.label}
          LeftIcon={commandMenuItem.Icon}
          onClick={() => {
            closeDropdown(dropdownId);
            commandMenuItem.onClick();
          }}
        />
      ))}
      {dropdownWidgetCommandMenuItems.length > 0 &&
        recordSelectionCommandMenuItems.length > 0 && (
          <HorizontalSeparator noMargin />
        )}
      {recordSelectionCommandMenuItems.map((item) => (
        <CommandMenuItemRenderer item={item} key={item.id} />
      ))}
    </OptionsDropdownMenu>
  );
};
