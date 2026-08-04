import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { type ReactNode } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { IconMinus } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { type NavigationMenuItem } from '~/generated-metadata/graphql';

import { isLayoutCustomizationModeEnabledState } from '@/layout-customization/states/isLayoutCustomizationModeEnabledState';
import { navigationMenuItemEditSectionState } from '@/navigation-menu-item/common/states/navigationMenuItemEditSectionState';
import type { NavigationMenuItemSectionContentProps } from '@/navigation-menu-item/display/sections/types/NavigationMenuItemSectionContentProps';
import { useOpenNavigationMenuItemInSidePanel } from '@/navigation-menu-item/edit/hooks/useOpenNavigationMenuItemInSidePanel';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';

const StyledRow = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
  min-height: ${themeCssVariables.spacing[6]};
  width: 100%;
`;

const StyledLine = styled.div`
  background-color: ${themeCssVariables.border.color.medium};
  flex: 1 1 auto;
  height: 1px;
  min-width: 0;
  width: 100%;
`;

const StyledSeparatorButton = styled.button`
  align-items: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: ${themeCssVariables.border.radius.sm};
  box-sizing: border-box;
  cursor: pointer;
  display: flex;
  flex: 1;
  min-height: ${themeCssVariables.spacing[4]};
  min-width: 0;
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[1]};
  width: 100%;

  &[data-selected='true'] {
    border-color: ${themeCssVariables.color.blue};
  }

  &[data-dragging='true'] {
    cursor: grabbing;
  }
`;

const StyledSeparatorReadOnly = styled.div`
  align-items: center;
  display: flex;
  flex: 1;
  min-height: ${themeCssVariables.spacing[4]};
  min-width: 0;
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[1]};
  width: 100%;
`;

const StyledRightOptions = styled.div`
  align-items: center;
  display: flex;
  flex-shrink: 0;
`;

type NavigationMenuItemSeparatorDisplayProps = Pick<
  NavigationMenuItemSectionContentProps,
  'editModeProps' | 'isDragging' | 'rightOptions'
> & {
  item: NavigationMenuItem;
  indentationLevel?: 1 | 2;
};

export const NavigationMenuItemSeparatorDisplay = ({
  item,
  editModeProps,
  isDragging,
  rightOptions,
  indentationLevel = 1,
}: NavigationMenuItemSeparatorDisplayProps) => {
  const { t } = useLingui();
  const isLayoutCustomizationModeEnabled = useAtomStateValue(
    isLayoutCustomizationModeEnabledState,
  );
  const { openNavigationMenuItemInSidePanel } =
    useOpenNavigationMenuItemInSidePanel();
  const setNavigationMenuItemEditSection = useSetAtomState(
    navigationMenuItemEditSectionState,
  );

  const paddingLeft =
    indentationLevel === 2
      ? themeCssVariables.spacing[4]
      : themeCssVariables.spacing[1];

  const handleClick = () => {
    if (isDefined(editModeProps?.onEditModeClick)) {
      editModeProps.onEditModeClick();
      return;
    }

    setNavigationMenuItemEditSection(
      isDefined(item.userWorkspaceId) ? 'favorite' : 'workspace',
    );
    openNavigationMenuItemInSidePanel({
      itemId: item.id,
      pageTitle: t`Separator`,
      pageIcon: IconMinus,
    });
  };

  const isInteractive =
    isLayoutCustomizationModeEnabled ||
    isDefined(editModeProps?.onEditModeClick) ||
    isDefined(rightOptions);

  const separatorContent: ReactNode = isInteractive ? (
    <StyledSeparatorButton
      type="button"
      aria-label={t`Separator`}
      data-selected={editModeProps?.isSelectedInEditMode === true}
      data-dragging={isDragging === true}
      style={{ paddingLeft }}
      onClick={handleClick}
    >
      <StyledLine />
    </StyledSeparatorButton>
  ) : (
    <StyledSeparatorReadOnly style={{ paddingLeft }}>
      <StyledLine />
    </StyledSeparatorReadOnly>
  );

  if (!isDefined(rightOptions)) {
    return separatorContent;
  }

  return (
    <StyledRow>
      {separatorContent}
      <StyledRightOptions>{rightOptions}</StyledRightOptions>
    </StyledRow>
  );
};
