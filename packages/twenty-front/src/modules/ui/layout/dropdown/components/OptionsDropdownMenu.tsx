import { IconDotsVertical, type IconComponent } from 'twenty-ui/icon';
import { SIDE_PANEL_FOCUS_ID } from '@/side-panel/constants/SidePanelFocusId';
import { Dropdown } from '@/ui/layout/dropdown/components/Dropdown';
import { DropdownContent } from '@/ui/layout/dropdown/components/DropdownContent';
import { DropdownMenuItemsContainer } from '@/ui/layout/dropdown/components/DropdownMenuItemsContainer';
import { useToggleDropdown } from '@/ui/layout/dropdown/hooks/useToggleDropdown';
import { SelectableList } from '@/ui/layout/selectable-list/components/SelectableList';
import { useSelectableList } from '@/ui/layout/selectable-list/hooks/useSelectableList';
import { useHotkeysOnFocusedElement } from '@/ui/utilities/hotkey/hooks/useHotkeysOnFocusedElement';
import { useLingui } from '@lingui/react/macro';
import { type ReactNode, useId } from 'react';
import { Button, IconButton } from 'twenty-ui/input';
import { getOsControlSymbol } from 'twenty-ui/utilities';

const MoreIcon: IconComponent = ({ size, color }) => (
  <IconDotsVertical
    size={size}
    color={color}
    style={{ transform: 'rotate(90deg)' }}
  />
);

type OptionsDropdownMenuProps = {
  dropdownId?: string;
  selectableListId?: string;
  selectableItemIdArray?: string[];
  onOpen?: () => void;
  children: ReactNode;
  compact?: boolean;
};

export const OptionsDropdownMenu = ({
  dropdownId: dropdownIdFromProps,
  selectableListId,
  selectableItemIdArray = [],
  onOpen,
  children,
  compact = false,
}: OptionsDropdownMenuProps) => {
  const generatedDropdownId = useId();
  const dropdownId = dropdownIdFromProps ?? generatedDropdownId;
  const { t } = useLingui();
  const { toggleDropdown } = useToggleDropdown();

  const listId = selectableListId ?? dropdownId;
  const { resetSelectedItem } = useSelectableList(listId);

  const handleOpen = () => {
    resetSelectedItem();
    onOpen?.();
  };

  const hotkeysConfig = {
    keys: ['ctrl+o', 'meta+o'],
    callback: () => {
      toggleDropdown({
        dropdownComponentInstanceIdFromProps: dropdownId,
      });
    },
    dependencies: [toggleDropdown, dropdownId],
  };

  useHotkeysOnFocusedElement({
    ...hotkeysConfig,
    focusId: SIDE_PANEL_FOCUS_ID,
  });

  useHotkeysOnFocusedElement({
    ...hotkeysConfig,
    focusId: dropdownId,
  });

  return (
    <Dropdown
      dropdownId={dropdownId}
      data-select-disable
      clickableComponent={
        compact ? (
          <span title={`더 보기 (${getOsControlSymbol()}O)`}>
            <IconButton
              Icon={MoreIcon}
              variant="secondary"
              size="small"
              ariaLabel="더 보기"
            />
          </span>
        ) : (
          <Button
            title={t`Options`}
            hotkeys={[getOsControlSymbol(), 'O']}
            size="small"
          />
        )
      }
      dropdownPlacement={compact ? 'bottom-end' : 'top-end'}
      dropdownOffset={{ y: 8 }}
      globalHotkeysConfig={{
        enableGlobalHotkeysWithModifiers: true,
        enableGlobalHotkeysConflictingWithKeyboard: false,
      }}
      onOpen={handleOpen}
      dropdownComponents={
        <DropdownContent>
          <DropdownMenuItemsContainer>
            <SelectableList
              selectableListInstanceId={listId}
              focusId={dropdownId}
              selectableItemIdArray={selectableItemIdArray}
            >
              {children}
            </SelectableList>
          </DropdownMenuItemsContainer>
        </DropdownContent>
      }
    />
  );
};
